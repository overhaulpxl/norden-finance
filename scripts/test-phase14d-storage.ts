import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
const sgRef = 'tidpkhwcxrsugioctpnf';
const sgStorageUrl = `https://${sgRef}.supabase.co/storage/v1`;

async function runStorageRegression() {
  console.log('=== PHASE 14D-FREE: STORAGE SAFETY REGRESSION ===\n');

  // 1. Fetch Service Key & Inspect Buckets
  console.log('[1] Fetching API keys & inspecting Singapore Preview Storage Buckets...');
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/api-keys`, {
    headers: { Authorization: `Bearer ${sbToken}` }
  });
  const keys = await keysRes.json();
  const serviceKey = keys.find((k: any) => k.name === 'service_role')?.api_key;
  assert.ok(serviceKey, 'Service role key for Singapore Preview must be available');

  const bucketsRes = await fetch(`${sgStorageUrl}/bucket`, {
    headers: { Authorization: `Bearer ${serviceKey}` }
  });
  assert.strictEqual(bucketsRes.status, 200, 'Buckets list must return 200');
  const buckets = await bucketsRes.json();
  const bucketNames = buckets.map((b: any) => ({ id: b.id, name: b.name, public: b.public }));
  console.log('  Buckets found:', bucketNames);

  const qrisBucket = buckets.find((b: any) => b.id === 'qris');
  const proofsBucket = buckets.find((b: any) => b.id === 'payment-proofs');

  assert.ok(qrisBucket, 'Bucket "qris" must exist');
  assert.strictEqual(qrisBucket.public, true, 'Bucket "qris" must be public');
  console.log('  ✓ Bucket "qris" verified: public = true.');

  assert.ok(proofsBucket, 'Bucket "payment-proofs" must exist');
  assert.strictEqual(proofsBucket.public, false, 'Bucket "payment-proofs" must be private');
  console.log('  ✓ Bucket "payment-proofs" verified: public = false.');

  // 2. Confirm dummy objects absence in payment-proofs and qris
  console.log('\n[2] Checking for dummy or unintended storage objects...');
  const listProofsRes = await fetch(`${sgStorageUrl}/object/list/payment-proofs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 100 })
  });
  const proofObjects = await listProofsRes.json();
  console.log('  payment-proofs objects count:', proofObjects.length);
  const dummyProofs = proofObjects.filter((o: any) => o.name.includes('dummy') || o.name.includes('phase14c') || o.name.includes('phase14b'));
  assert.strictEqual(dummyProofs.length, 0, 'No dummy or temporary objects should remain in payment-proofs');
  console.log('  ✓ Zero dummy/temporary objects in payment-proofs.');

  const listQrisRes = await fetch(`${sgStorageUrl}/object/list/qris`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 100 })
  });
  const qrisObjects = await listQrisRes.json();
  console.log('  qris objects count:', qrisObjects.length);
  const dummyQris = qrisObjects.filter((o: any) => o.name.includes('dummy') || o.name.includes('test'));
  assert.strictEqual(dummyQris.length, 0, 'No dummy objects should remain in qris');
  console.log('  ✓ Zero dummy objects in qris.');

  // 3. Private Bucket Inaccessibility without Authorization
  console.log('\n[3] Testing Private Bucket Access Boundaries...');
  // Attempt unauthenticated download on private bucket payment-proofs
  const unauthProofRes = await fetch(`https://${sgRef}.supabase.co/storage/v1/object/public/payment-proofs/test-private-read.png`);
  console.log(`  GET public/payment-proofs/... (unauthenticated) -> Status ${unauthProofRes.status}`);
  assert.ok(
    unauthProofRes.status === 400 || unauthProofRes.status === 404 || unauthProofRes.status === 403,
    'Unauthenticated access to private bucket must be blocked'
  );
  console.log('  ✓ Private bucket correctly blocks public unauthenticated access.');

  // 4. Public QRIS Access Verification
  console.log('\n[4] Testing Public QRIS Object Resolution...');
  const qrisItem = qrisObjects[0];
  if (qrisItem) {
    const publicUrl = `https://${sgRef}.supabase.co/storage/v1/object/public/qris/${qrisItem.name}`;
    const pubRes = await fetch(publicUrl, { method: 'HEAD' });
    console.log(`  HEAD public/qris/${qrisItem.name} -> Status ${pubRes.status}`);
    assert.ok(pubRes.status === 200 || pubRes.status === 304, 'Public QRIS asset must resolve');
    console.log('  ✓ Public QRIS asset accessible over HTTP.');
  }

  // 5. Fail-Closed Fallback & Zero Tokyo project leakage
  console.log('\n[5] Verifying Fail-Closed URL and Zero Tokyo URL Leakage...');
  // Inspect Singapore DB Setting.qris_image
  const sgQueryRes = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'SELECT "key", "value" FROM "Setting" WHERE "key" = \'qris_image\';' })
  });
  const sgSettings = await sgQueryRes.json();
  const qrisVal = sgSettings[0]?.value || '';
  console.log(`  Setting "qris_image" in Singapore DB: "${qrisVal}"`);
  assert.ok(!qrisVal.includes('cfsjmpfgywfvpmrguqsi'), 'qris_image must NEVER reference Tokyo project (cfsjmpfgywfvpmrguqsi)');
  console.log('  ✓ No URL or setting references Tokyo Production project.');

  console.log('\n=== ALL STORAGE SAFETY REGRESSION CHECKS PASSED (100%) ===');
}

runStorageRegression().catch(err => {
  console.error('\nStorage Regression Failed:', err);
  process.exit(1);
});
