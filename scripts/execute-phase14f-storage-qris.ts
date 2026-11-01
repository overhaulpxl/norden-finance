import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const authPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'mcp-auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const sbToken = auth.supabase?.tokens?.accessToken;
assert.ok(sbToken, 'Supabase token required');

const tokyoRef = 'cfsjmpfgywfvpmrguqsi';
const sgRef = 'tidpkhwcxrsugioctpnf';

async function runSql(projectRef: string, sql: string) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getProjectServiceKey(projectRef: string): Promise<string> {
  const keysRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${sbToken}` }
  });
  const keys = await keysRes.json();
  const serviceKey = keys.find((k: any) => k.name === 'service_role')?.api_key;
  assert.ok(serviceKey, `Service role key required for ${projectRef}`);
  return serviceKey;
}

async function transferStorageObjects() {
  console.log('=== PHASE 14F: COPY TOKYO QRIS STORAGE OBJECTS TO SINGAPORE ===\n');

  const tokyoServiceKey = await getProjectServiceKey(tokyoRef);
  const sgServiceKey = await getProjectServiceKey(sgRef);

  // 1. Verify Tokyo payment-proofs is empty
  const tokyoProofRes = await fetch(`https://${tokyoRef}.supabase.co/storage/v1/object/list/payment-proofs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokyoServiceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 100 }),
  });
  const tokyoProofs = await tokyoProofRes.json();
  console.log(`Tokyo payment-proofs count: ${tokyoProofs.length}`);
  assert.strictEqual(tokyoProofs.length, 0, 'Tokyo payment-proofs must be empty');

  // 2. Query Tokyo qris objects
  const tokyoQrisRes = await fetch(`https://${tokyoRef}.supabase.co/storage/v1/object/list/qris`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokyoServiceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 100 }),
  });
  const tokyoQrisList = await tokyoQrisRes.json();
  console.log(`Tokyo qris objects count: ${tokyoQrisList.length}`);
  assert.strictEqual(tokyoQrisList.length, 2, 'Tokyo qris bucket must have exactly 2 objects');

  const expectedObjects = [
    'merchant_1792756634039_image.png',
    'merchant_1792918766957_image.png',
  ];

  for (const objName of expectedObjects) {
    console.log(`\nProcessing QRIS object: ${objName}...`);

    // A. Download from Tokyo
    const dlTokyo = await fetch(`https://${tokyoRef}.supabase.co/storage/v1/object/qris/${objName}`, {
      headers: { Authorization: `Bearer ${tokyoServiceKey}` }
    });
    assert.strictEqual(dlTokyo.status, 200, `Failed to download ${objName} from Tokyo`);
    const tokyoBuf = Buffer.from(await dlTokyo.arrayBuffer());
    const tokyoHash = crypto.createHash('sha256').update(tokyoBuf).digest('hex');
    assert.strictEqual(tokyoBuf.length, 2608169, `Expected 2608169 bytes, got ${tokyoBuf.length}`);
    console.log(`  ✓ Tokyo: ${tokyoBuf.length} bytes, SHA-256: ${tokyoHash}`);

    // B. Check if already exists in Singapore
    const checkSg = await fetch(`https://${sgRef}.supabase.co/storage/v1/object/qris/${objName}`, {
      headers: { Authorization: `Bearer ${sgServiceKey}` }
    });

    if (checkSg.status === 200) {
      const sgBuf = Buffer.from(await checkSg.arrayBuffer());
      const sgHash = crypto.createHash('sha256').update(sgBuf).digest('hex');
      if (sgHash === tokyoHash && sgBuf.length === tokyoBuf.length) {
        console.log(`  ✓ Singapore already has identical object (${sgBuf.length} bytes, SHA-256 verified).`);
      } else {
        console.log('  Singapore object differs; updating...');
        const upRes = await fetch(`https://${sgRef}.supabase.co/storage/v1/object/qris/${objName}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sgServiceKey}`,
            'Content-Type': 'image/png',
            'x-upsert': 'true',
            'cache-control': 'max-age=3600',
          },
          body: tokyoBuf,
        });
        assert.ok(upRes.ok, `Upload failed: ${await upRes.text()}`);
      }
    } else {
      console.log('  Uploading to Singapore qris bucket...');
      const upRes = await fetch(`https://${sgRef}.supabase.co/storage/v1/object/qris/${objName}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sgServiceKey}`,
          'Content-Type': 'image/png',
          'x-upsert': 'true',
          'cache-control': 'max-age=3600',
        },
        body: tokyoBuf,
      });
      assert.ok(upRes.ok, `Upload failed: ${await upRes.text()}`);
    }

    // C. Download from Singapore and verify exact byte length and SHA-256
    const dlSg = await fetch(`https://${sgRef}.supabase.co/storage/v1/object/qris/${objName}`, {
      headers: { Authorization: `Bearer ${sgServiceKey}` }
    });
    assert.strictEqual(dlSg.status, 200, `Failed to download ${objName} from Singapore`);
    const sgBuf = Buffer.from(await dlSg.arrayBuffer());
    const sgHash = crypto.createHash('sha256').update(sgBuf).digest('hex');
    assert.strictEqual(sgBuf.length, tokyoBuf.length, 'Byte length mismatch between Tokyo and Singapore');
    assert.strictEqual(sgHash, tokyoHash, 'SHA-256 mismatch between Tokyo and Singapore');
    console.log(`  ✓ Verification passed: Singapore object matches Tokyo byte-for-byte.`);

    // D. Verify public HTTP 200
    const publicUrl = `https://${sgRef}.supabase.co/storage/v1/object/public/qris/${objName}`;
    const pubRes = await fetch(publicUrl);
    assert.strictEqual(pubRes.status, 200, `Public URL failed for ${publicUrl}`);
    console.log(`  ✓ Public URL verified HTTP 200: ${publicUrl}`);
  }

  // 3. Verify bucket permissions
  console.log('\nVerifying bucket security:');
  const sgBucketsRes = await fetch(`https://${sgRef}.supabase.co/storage/v1/bucket`, {
    headers: { Authorization: `Bearer ${sgServiceKey}` }
  });
  const sgBuckets = await sgBucketsRes.json();
  const qrisBucket = sgBuckets.find((b: any) => b.id === 'qris');
  const proofBucket = sgBuckets.find((b: any) => b.id === 'payment-proofs');
  assert.strictEqual(qrisBucket?.public, true, 'qris bucket must be public');
  assert.strictEqual(proofBucket?.public, false, 'payment-proofs bucket must be private');
  console.log('  ✓ Bucket "qris" is public (true).');
  console.log('  ✓ Bucket "payment-proofs" is private (false).');

  // Verify private access denies public request
  const privRes = await fetch(`https://${sgRef}.supabase.co/storage/v1/object/public/payment-proofs/test.png`);
  assert.strictEqual(privRes.status, 400, 'Unauthenticated access to private bucket must be blocked (HTTP 400)');
  console.log('  ✓ Public access to payment-proofs blocked (HTTP 400).');

  // 4. Inspect and reconcile Setting.qris_image
  console.log('\nInspecting Setting.qris_image:');
  const tokyoSetting = await runSql(tokyoRef, `SELECT "key", "value" FROM public."Setting" WHERE "key" = 'qris_image';`);
  const sgSetting = await runSql(sgRef, `SELECT "key", "value" FROM public."Setting" WHERE "key" = 'qris_image';`);
  console.log('  Tokyo Setting:', tokyoSetting[0]);
  console.log('  Singapore Setting (initial):', sgSetting[0]);

  // If setting contains Tokyo host or canonical ref, update to active Singapore reference:
  const tokyoVal = tokyoSetting[0]?.value || '';
  let desiredVal = tokyoVal;

  if (tokyoVal.includes(tokyoRef)) {
    desiredVal = tokyoVal.replace(tokyoRef, sgRef);
    console.log(`  Replacing Tokyo project ref with Singapore project ref: ${desiredVal}`);
    await runSql(sgRef, `UPDATE public."Setting" SET "value" = '${desiredVal}' WHERE "key" = 'qris_image';`);
  } else if (!tokyoVal.startsWith('qris/')) {
    // If it's a relative path or canonical path
    console.log(`  Current value: ${desiredVal}`);
  }

  const finalSgSetting = await runSql(sgRef, `SELECT "key", "value" FROM public."Setting" WHERE "key" = 'qris_image';`);
  console.log('  ✓ Singapore Setting.qris_image final:', finalSgSetting[0]);

  console.log('\n=== PHASE 14F: QRIS STORAGE TRANSFER & SECURITY COMPLETE (100% SUCCESS) ===');
}

transferStorageObjects().catch(err => {
  console.error('\nStorage transfer failed:', err);
  process.exit(1);
});
