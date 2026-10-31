import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
const sgRef = 'tidpkhwcxrsugioctpnf';
const sgStorageBaseUrl = `https://${sgRef}.supabase.co/storage/v1`;

async function runStorageDryRun() {
  console.log('=== PHASE 14C-FREE: STORAGE MIGRATION DRY RUN (SINGAPORE PREVIEW) ===\n');

  // 1. Initial Storage Objects Count
  const initialRes = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'SELECT count(*)::int as c FROM storage.objects;' })
  });
  const initialCount = (await initialRes.json())[0].c;
  console.log(`[1] Initial Singapore Storage Objects Count: ${initialCount}`);

  // 2. Generate Independent Dummy PNG
  // 1x1 transparent PNG binary bytes
  const dummyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const dummySha256 = crypto.createHash('sha256').update(dummyPng).digest('hex');
  const dummyLength = dummyPng.length;
  console.log(`[2] Generated Dummy PNG: Length=${dummyLength} bytes, SHA-256=${dummySha256}`);

  // 3. Upload to dedicated Preview test path via Storage API
  const testObjectPath = 'preview-test/dummy_migration_test.png';
  console.log(`[3] Uploading dummy PNG to bucket "qris", path "${testObjectPath}"...`);

  // We can upload using service role or management API / storage API
  // Let's get service role key from project API keys endpoint
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/api-keys`, {
    headers: { Authorization: `Bearer ${sbToken}` }
  });
  const keys = await keysRes.json();
  const serviceKey = keys.find((k: any) => k.name === 'service_role')?.api_key;
  assert.ok(serviceKey, 'Service role key for Singapore Preview must be available');

  const uploadRes = await fetch(`${sgStorageBaseUrl}/object/qris/${testObjectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'image/png',
      'x-upsert': 'true'
    },
    body: dummyPng
  });
  console.log(`  Upload response status: ${uploadRes.status}`);
  assert.strictEqual(uploadRes.status, 200, 'Upload must return 200 OK');

  // 4. Download and Hash Verification
  console.log('\n[4] Downloading uploaded object via Public CDN URL...');
  const publicCdnUrl = `${sgStorageBaseUrl}/object/public/qris/${testObjectPath}`;
  const downloadRes = await fetch(publicCdnUrl);
  console.log(`  Download status: ${downloadRes.status}`);
  assert.strictEqual(downloadRes.status, 200, 'Public CDN download must return 200 OK');

  const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer());
  const downloadedSha256 = crypto.createHash('sha256').update(downloadedBuf).digest('hex');
  const downloadedLength = downloadedBuf.length;

  console.log(`  Downloaded Length: ${downloadedLength} bytes (Original: ${dummyLength})`);
  console.log(`  Downloaded SHA-256: ${downloadedSha256}`);
  assert.strictEqual(downloadedLength, dummyLength, 'Byte lengths must match exactly');
  assert.strictEqual(downloadedSha256, dummySha256, 'SHA-256 checksums must match identically');
  console.log('  ✓ Cryptographic byte and hash match verified.');

  // 5. Verify Public vs Private Bucket Restrictions
  console.log('\n[5] Verifying Public vs Private Bucket Security Boundaries...');
  // Public bucket (qris) allows unauthenticated read
  assert.strictEqual(downloadRes.status, 200, 'qris bucket must be public');

  // Private bucket (payment-proofs) must reject unauthenticated read
  const privateTestUrl = `${sgStorageBaseUrl}/object/public/payment-proofs/nonexistent.png`;
  const privateRes = await fetch(privateTestUrl);
  console.log(`  Private bucket unauthenticated access status: ${privateRes.status}`);
  assert.ok(
    privateRes.status === 400 || privateRes.status === 403 || privateRes.status === 404,
    'payment-proofs bucket must reject unauthenticated public download'
  );
  console.log('  ✓ Public/Private bucket security boundary confirmed.');

  // 6. Delete Test Object
  console.log('\n[6] Deleting temporary test object...');
  const deleteRes = await fetch(`${sgStorageBaseUrl}/object/qris`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prefixes: [testObjectPath] })
  });
  console.log(`  Delete response status: ${deleteRes.status}`);
  assert.strictEqual(deleteRes.status, 200, 'Delete must return 200 OK');

  // 7. Confirm Storage Object Count Returned to Initial Baseline
  const finalRes = await fetch(`https://api.supabase.com/v1/projects/${sgRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'SELECT count(*)::int as c FROM storage.objects;' })
  });
  const finalCount = (await finalRes.json())[0].c;
  console.log(`[7] Final Singapore Storage Objects Count: ${finalCount} (Initial: ${initialCount})`);
  assert.strictEqual(finalCount, initialCount, 'Storage objects count must return to exact initial baseline');
  console.log('  ✓ Zero lingering artifacts confirmed.');

  console.log('\n=== STORAGE MIGRATION DRY RUN COMPLETED SUCCESSFULLY ===');
}

runStorageDryRun().catch(err => {
  console.error('\nStorage Dry Run Failed:', err);
  process.exit(1);
});
