import assert from 'assert';
import crypto from 'crypto';

const sgRef = 'tidpkhwcxrsugioctpnf';
const tokyoRef = 'cfsjmpfgywfvpmrguqsi';
const prodHost = 'https://www.nordenfinance.site';

async function checkStorage() {
  console.log('=== CHECK C: STORAGE, QRIS DELIVERY & SECURITY ISOLATION ===\n');

  // 1. Verify both QRIS images publicly accessible
  const qrisFiles = [
    'merchant_1792756634039_image.png',
    'merchant_1792918766957_image.png'
  ];

  for (const f of qrisFiles) {
    const url = `https://${sgRef}.supabase.co/storage/v1/object/public/qris/${f}`;
    const res = await fetch(url);
    console.log(`Checking QRIS object: ${f}`);
    console.log(`  - URL: ${url}`);
    console.log(`  - Status: ${res.status}`);
    assert.strictEqual(res.status, 200, `Expected HTTP 200 for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    assert.strictEqual(buf.length, 2608169, 'Expected 2608169 bytes');
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    assert.strictEqual(hash, 'bfbb947b7fe0496895d51922e4ba8090790217d85e5fd347efcfdd85ca8b6c8e', 'SHA-256 hash mismatch');
    console.log(`  ✓ Status 200, size ${buf.length} bytes, SHA-256 verified.`);
  }

  // 2. Verify payment-proofs private isolation
  console.log('\n2. Verifying private bucket isolation (payment-proofs):');
  const privateUrl = `https://${sgRef}.supabase.co/storage/v1/object/public/payment-proofs/test_unauth.png`;
  const privRes = await fetch(privateUrl);
  console.log(`  - GET ${privateUrl} -> Status: ${privRes.status}`);
  assert.strictEqual(privRes.status, 400, 'Expected HTTP 400 for unauthenticated access to private bucket');
  console.log('  ✓ Public read correctly rejected on payment-proofs.');

  // 3. Scan live HTML of /upgrade and /login to verify zero Tokyo references
  console.log('\n3. Scanning live production pages for silent Tokyo references:');
  const pagesToScan = ['/', '/login', '/upgrade'];
  for (const p of pagesToScan) {
    const res = await fetch(`${prodHost}${p}`);
    const html = await res.text();
    const hasTokyo = html.includes(tokyoRef);
    console.log(`  - Page ${p.padEnd(10)}: includes Tokyo project ref (${tokyoRef}): ${hasTokyo}`);
    assert.strictEqual(hasTokyo, false, `Page ${p} contains reference to Tokyo ref ${tokyoRef}!`);
  }
  console.log('  ✓ Zero silent Tokyo references in live production responses.');

  console.log('\n=== CHECK C PASSED: STORAGE HEALTHY & SECURED ===');
}

checkStorage().catch(err => {
  console.error('\nCheck C failed:', err);
  process.exit(1);
});
