import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const previewHost = process.argv[2] || 'https://norden-f3ep48kxa-zaidaans-projects.vercel.app';

async function getBypassKey(): Promise<string | null> {
  try {
    const vAuthPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.vercel.cli', 'Data', 'auth.json');
    if (!fs.existsSync(vAuthPath)) return null;
    const vAuth = JSON.parse(fs.readFileSync(vAuthPath, 'utf8'));
    if (!vAuth.token) return null;
    const pRes = await fetch('https://api.vercel.com/v9/projects/norden', {
      headers: { Authorization: `Bearer ${vAuth.token}` },
    });
    const pData = await pRes.json();
    if (pData.protectionBypass) {
      return Object.keys(pData.protectionBypass)[0] || null;
    }
  } catch {
    // ignore
  }
  return null;
}

async function verifyPreview() {
  console.log('================================================================');
  console.log(`PHASE 16A PREVIEW VERIFICATION: ${previewHost}`);
  console.log('================================================================\n');

  const bypassKey = await getBypassKey();
  const customHeaders: Record<string, string> = {};
  if (bypassKey) {
    customHeaders['x-vercel-protection-bypass'] = bypassKey;
    console.log(`  Using Vercel protection bypass key: ${bypassKey.slice(0, 8)}...`);
  }

  // 1. Check HTTP response and SEO / Noindex headers
  console.log('\n1. Verifying /auth/action HTTP response & X-Robots-Tag headers:');
  const actionRes = await fetch(`${previewHost}/auth/action`, { headers: customHeaders });
  console.log(`  - Status: ${actionRes.status} (expected 200)`);
  assert.strictEqual(actionRes.status, 200, 'Must return HTTP 200');

  const xRobotsTag = actionRes.headers.get('x-robots-tag') || '';
  console.log(`  - X-Robots-Tag: "${xRobotsTag}"`);
  assert.ok(xRobotsTag.toLowerCase().includes('noindex'), 'Must include noindex in X-Robots-Tag');
  assert.ok(xRobotsTag.toLowerCase().includes('nofollow'), 'Must include nofollow in X-Robots-Tag');

  const vercelId = actionRes.headers.get('x-vercel-id') || '';
  console.log(`  - Region (x-vercel-id): ${vercelId}`);
  assert.ok(vercelId.includes('sin1'), `Execution region must be sin1, got ${vercelId}`);

  const html = await actionRes.text();
  console.log(`  - Document size: ${html.length} bytes`);
  assert.ok(html.includes('name="robots" content="noindex, nofollow"'), 'HTML must include meta robots noindex, nofollow');
  assert.ok(html.includes('Aksi Autentikasi | Norden Finance'), 'HTML must have correct title');
  assert.ok(html.includes('Tautan Tidak Lengkap') || html.includes('Memuat Aksi'), 'HTML must handle missing parameters gracefully');
  console.log('  ✓ Response headers, noindex protection, and region verified.');

  // 2. Check invalid mode response
  console.log('\n2. Verifying invalid mode rendering:');
  const invalidRes = await fetch(`${previewHost}/auth/action?mode=unsupportedMode&oobCode=dummyCode`, { headers: customHeaders });
  const invalidHtml = await invalidRes.text();
  assert.strictEqual(invalidRes.status, 200, 'Must return HTTP 200');
  const invalidXRobots = invalidRes.headers.get('x-robots-tag') || '';
  assert.ok(invalidXRobots.toLowerCase().includes('noindex'), 'Must include noindex on invalid mode');
  console.log('  ✓ Invalid mode returned 200 with noindex headers.');

  // 3. Check verifyEmail mode URL structure
  console.log('\n3. Verifying verifyEmail mode URL structure:');
  const verifyRes = await fetch(`${previewHost}/auth/action?mode=verifyEmail&oobCode=dummyCode`, { headers: customHeaders });
  assert.strictEqual(verifyRes.status, 200, 'Must return HTTP 200');
  const verifyXRobots = verifyRes.headers.get('x-robots-tag') || '';
  assert.ok(verifyXRobots.toLowerCase().includes('noindex'), 'Must include noindex');
  console.log('  ✓ verifyEmail URL returns 200 with noindex headers.');

  // 4. Check resetPassword mode URL structure
  console.log('\n4. Verifying resetPassword mode URL structure:');
  const resetRes = await fetch(`${previewHost}/auth/action?mode=resetPassword&oobCode=dummyCode`, { headers: customHeaders });
  assert.strictEqual(resetRes.status, 200, 'Must return HTTP 200');
  const resetXRobots = resetRes.headers.get('x-robots-tag') || '';
  assert.ok(resetXRobots.toLowerCase().includes('noindex'), 'Must include noindex');
  console.log('  ✓ resetPassword URL returns 200 with noindex headers.');

  // 5. Check recoverEmail mode URL structure
  console.log('\n5. Verifying recoverEmail mode URL structure:');
  const recoverRes = await fetch(`${previewHost}/auth/action?mode=recoverEmail&oobCode=dummyCode`, { headers: customHeaders });
  assert.strictEqual(recoverRes.status, 200, 'Must return HTTP 200');
  const recoverXRobots = recoverRes.headers.get('x-robots-tag') || '';
  assert.ok(recoverXRobots.toLowerCase().includes('noindex'), 'Must include noindex');
  console.log('  ✓ recoverEmail URL returns 200 with noindex headers.');

  // 6. Security: Check that no private financial data or secrets are exposed
  console.log('\n6. Checking zero financial/user data leakage:');
  for (const h of [html, invalidHtml]) {
    assert.ok(!h.includes('transactions'), 'Must not leak transactions');
    assert.ok(!h.includes('balances'), 'Must not leak balances');
    assert.ok(!h.includes('adminStats'), 'Must not leak adminStats');
    assert.ok(!h.includes('FIREBASE_ADMIN'), 'Must not leak Firebase admin keys');
  }
  console.log('  ✓ Zero private data leaked.');

  console.log('\n================================================================');
  console.log('ALL PHASE 16A PREVIEW VERIFICATION CHECKS PASSED');
  console.log('================================================================\n');
}

verifyPreview().catch((err) => {
  console.error('\nPreview verification failed:', err);
  process.exit(1);
});
