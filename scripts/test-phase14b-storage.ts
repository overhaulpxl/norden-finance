import assert from 'assert';
import { getSupabaseBaseUrl, getPublicUrl, parseStorageReference } from '../lib/storage';

async function runStorageTests() {
  console.log('--- Starting Phase 14B Storage Configuration & Fallback Remediation Test Suite ---');

  const originalSupabaseUrl = process.env.SUPABASE_URL;
  const originalNextPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  try {
    // 1. Valid Singapore URL
    console.log('\n[1] Testing Valid Singapore URL Configuration...');
    process.env.SUPABASE_URL = 'https://tidpkhwcxrsugioctpnf.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    assert.strictEqual(
      getSupabaseBaseUrl(),
      'https://tidpkhwcxrsugioctpnf.supabase.co',
      'Should resolve SUPABASE_URL exactly'
    );
    console.log('  ✓ Verified: Valid Singapore SUPABASE_URL resolved correctly.');

    // 2. Trailing Slash Normalization
    console.log('\n[2] Testing Trailing Slash Normalization...');
    process.env.SUPABASE_URL = 'https://tidpkhwcxrsugioctpnf.supabase.co////';
    assert.strictEqual(
      getSupabaseBaseUrl(),
      'https://tidpkhwcxrsugioctpnf.supabase.co',
      'Should strip all trailing slashes'
    );
    console.log('  ✓ Verified: Multiple trailing slashes safely normalized.');

    // 3. Fallback to NEXT_PUBLIC_SUPABASE_URL if SUPABASE_URL unset
    console.log('\n[3] Testing Fallback to NEXT_PUBLIC_SUPABASE_URL...');
    delete process.env.SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://tidpkhwcxrsugioctpnf.supabase.co/';
    assert.strictEqual(
      getSupabaseBaseUrl(),
      'https://tidpkhwcxrsugioctpnf.supabase.co',
      'Should fallback cleanly to NEXT_PUBLIC_SUPABASE_URL with normalized slash'
    );
    console.log('  ✓ Verified: NEXT_PUBLIC_SUPABASE_URL used cleanly when SUPABASE_URL unset.');

    // 4. Missing Configuration Fails Closed (No Silent Tokyo Fallback)
    console.log('\n[4] Testing Missing URL Fails Closed (No Tokyo Fallback)...');
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    assert.throws(
      () => {
        getSupabaseBaseUrl();
      },
      (err: any) => {
        const msg = err?.message || '';
        assert.ok(
          msg.includes('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required'),
          `Expected missing config error, got: ${msg}`
        );
        assert.ok(
          !msg.includes('cfsjmpfgywfvpmrguqsi'),
          'Error message must not expose Tokyo fallback'
        );
        return true;
      },
      'Should throw when neither SUPABASE_URL nor NEXT_PUBLIC_SUPABASE_URL is defined'
    );
    console.log('  ✓ Verified: Missing config throws sanitized error; zero fallback to Tokyo.');

    // 5. Empty or Whitespace URL Fails Closed
    console.log('\n[5] Testing Empty / Whitespace URL Fails Closed...');
    process.env.SUPABASE_URL = '   ';
    assert.throws(
      () => {
        getSupabaseBaseUrl();
      },
      /SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required/,
      'Whitespace-only URL must fail closed'
    );
    console.log('  ✓ Verified: Whitespace-only string fails closed.');

    // 6. Public QRIS URL Generation
    console.log('\n[6] Testing Public QRIS URL Generation...');
    process.env.SUPABASE_URL = 'https://tidpkhwcxrsugioctpnf.supabase.co';
    const publicUrl = getPublicUrl('qris/merchant_1792756634039_image.png');
    assert.strictEqual(
      publicUrl,
      'https://tidpkhwcxrsugioctpnf.supabase.co/storage/v1/object/public/qris/merchant_1792756634039_image.png',
      'Public URL must construct valid path pointing to Singapore target'
    );
    console.log('  ✓ Verified: Public QRIS URL constructs exact Singapore CDN path.');

    // 7. Private Bucket Rejection on getPublicUrl
    console.log('\n[7] Testing Private Bucket Rejection on Public URL Generation...');
    assert.throws(
      () => {
        getPublicUrl('payment-proofs/uid123/proof.jpg');
      },
      /bersifat privat dan tidak dapat diakses melalui URL publik/,
      'Private bucket must reject public URL generation'
    );
    console.log('  ✓ Verified: Private payment-proofs bucket rejected from public URL generation.');

    // 8. Storage Reference Parsing for Private Payment Proofs
    console.log('\n[8] Testing Private Payment Proof Storage Reference Parsing...');
    const parsedProof = parseStorageReference('payment-proofs/user_abc123/receipt_123.png');
    assert.strictEqual(parsedProof.bucket, 'payment-proofs');
    assert.strictEqual(parsedProof.objectPath, 'user_abc123/receipt_123.png');
    assert.strictEqual(parsedProof.canonicalRef, 'payment-proofs/user_abc123/receipt_123.png');

    // Invalid traversal characters
    assert.throws(
      () => {
        parseStorageReference('payment-proofs/../user_abc123/receipt_123.png');
      },
      /karakter berbahaya/,
      'Directory traversal attempt must be rejected'
    );
    console.log('  ✓ Verified: Private payment proof canonical references strictly validated.');

    console.log('\n--- ALL PHASE 14B STORAGE TESTS PASSED ---');
  } finally {
    if (originalSupabaseUrl !== undefined) process.env.SUPABASE_URL = originalSupabaseUrl;
    else delete process.env.SUPABASE_URL;

    if (originalNextPublicUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalNextPublicUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
}

runStorageTests().catch(err => {
  console.error('\nStorage Test Failure:', err);
  process.exit(1);
});
