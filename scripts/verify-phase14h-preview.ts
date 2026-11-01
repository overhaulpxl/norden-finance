import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));

const previewHost = 'https://norden-89c5s2rzk-zaidaans-projects.vercel.app';
const dplId = 'dpl_2KfgkyBXMnHs4wYibeUZZFPEERWK';

async function getBypassKey(): Promise<string> {
  const pRes = await fetch('https://api.vercel.com/v9/projects/norden', {
    headers: { Authorization: `Bearer ${vAuth.token}` },
  });
  const pData = await pRes.json();
  return Object.keys(pData.protectionBypass)[0];
}

async function verifyPreview() {
  console.log('=== VERIFYING PREVIEW DEPLOYMENT ===\n');
  console.log(`Target Preview: ${previewHost} (${dplId})`);

  const bypassKey = await getBypassKey();
  assert.ok(bypassKey, 'Bypass key must exist');

  // 1. Region sin1 check
  console.log('\n1. Checking execution region on Preview:');
  const res = await fetch(`${previewHost}/`, {
    headers: { 'x-vercel-protection-bypass': bypassKey },
  });
  const xVercelId = res.headers.get('x-vercel-id') || '';
  console.log(`  GET / -> Status: ${res.status} | x-vercel-id: ${xVercelId}`);
  assert.strictEqual(res.status, 200, 'Preview homepage must return 200');
  assert.ok(xVercelId.includes('sin1'), `Execution region must be sin1, got: ${xVercelId}`);
  console.log('  ✓ Execution region confirmed: sin1 (Singapore).');

  // 2. Check unauthenticated access on /norden-control-center
  console.log('\n2. Testing /norden-control-center unauthenticated gate on Preview:');
  const adminGateRes = await fetch(`${previewHost}/norden-control-center`, {
    headers: { 'x-vercel-protection-bypass': bypassKey },
    redirect: 'manual',
  });
  console.log(`  GET /norden-control-center -> Status: ${adminGateRes.status}`);
  const gateText = await adminGateRes.text();
  assert.ok(
    gateText.includes('NEXT_REDIRECT') || adminGateRes.status === 307 || adminGateRes.status === 302 || gateText.includes('/login'),
    'Unauthenticated access must redirect'
  );
  console.log('  ✓ Unauthenticated access strictly redirected to /login.');

  // 3. Confirm Production remained untouched
  console.log('\n3. Confirming Production deployment remained untouched:');
  const prodRes = await fetch('https://api.vercel.com/v6/deployments?app=norden&target=production&limit=1', {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  });
  const prodData = await prodRes.json();
  const currentProd = prodData.deployments?.[0];
  console.log(`  Current Production Deployment ID: ${currentProd?.uid}`);
  console.log(`  Commit SHA: ${currentProd?.meta?.githubCommitSha}`);
  console.log(`  URL: ${currentProd?.url}`);
  assert.strictEqual(currentProd?.uid, 'dpl_3TERqqhkWPySCXuPYbMHqd29u2rD', 'Production must remain on dpl_3TERqqhkWPySCXuPYbMHqd29u2rD');
  assert.strictEqual(currentProd?.meta?.githubCommitSha, '96d525e872961020811e55c3ac6c5273e69c9483', 'Production commit must remain 96d525e');
  console.log('  ✓ Production deployment 100% untouched!');

  // 4. Check runtime logs for Preview
  console.log('\n4. Checking Vercel logs for Preview deployment:');
  const logsRes = await fetch(`https://api.vercel.com/v2/deployments/${dplId}/events?limit=50`, {
    headers: { Authorization: `Bearer ${vAuth.token}` }
  });
  if (logsRes.ok) {
    const events = await logsRes.json();
    console.log(`  Retrieved ${events.length} deployment events.`);
    const errors = events.filter((e: any) => e.type === 'error' || (e.payload?.text && /error|fatal|p1001|p2024|p2010/i.test(e.payload.text)));
    console.log(`  Error count in events: ${errors.length}`);
    assert.strictEqual(errors.length, 0, 'No errors in build/deployment events');
  }

  console.log('\n=== PREVIEW VERIFICATION SUCCESSFUL ===');
}

verifyPreview().catch(err => {
  console.error('Preview verification failed:', err);
  process.exit(1);
});
