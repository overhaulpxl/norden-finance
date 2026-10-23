import assert from 'assert';
import {
  parseStorageReference,
  getPublicUrl,
} from '../lib/storage';

async function runStorageTests() {
  console.log('--- Starting Phase 11D Supabase Storage Unit Test Suite ---');

  // ==========================================
  // TEST SUITE 1: CANONICAL REFERENCE PARSING
  // ==========================================
  console.log('\n[1] Testing Canonical Reference Parsing...');

  // 1.1 Valid payment-proof reference
  const validProof = parseStorageReference('payment-proofs/user_123/1729000000_proof.jpg');
  assert.strictEqual(validProof.bucket, 'payment-proofs');
  assert.strictEqual(validProof.objectPath, 'user_123/1729000000_proof.jpg');
  assert.strictEqual(validProof.canonicalRef, 'payment-proofs/user_123/1729000000_proof.jpg');

  // 1.2 Valid QRIS reference
  const validQris = parseStorageReference('qris/merchant_1729000000_qris.png');
  assert.strictEqual(validQris.bucket, 'qris');
  assert.strictEqual(validQris.objectPath, 'merchant_1729000000_qris.png');
  assert.strictEqual(validQris.canonicalRef, 'qris/merchant_1729000000_qris.png');

  // 1.3 Leading slashes trimmed safely
  const leadingSlash = parseStorageReference('///qris/test.webp');
  assert.strictEqual(leadingSlash.bucket, 'qris');
  assert.strictEqual(leadingSlash.objectPath, 'test.webp');

  // ==========================================
  // TEST SUITE 2: SECURITY & PATH TRAVERSAL REJECTION
  // ==========================================
  console.log('\n[2] Testing Path Traversal & Injection Rejection...');

  // 2.1 Directory traversal attempt
  assert.throws(
    () => parseStorageReference('../secret.env'),
    /karakter berbahaya/,
    'Path traversal with .. must be rejected'
  );

  assert.throws(
    () => parseStorageReference('payment-proofs/user/../../etc/passwd'),
    /karakter berbahaya/,
    'Embedded traversal must be rejected'
  );

  // 2.2 Backslash injection attempt
  assert.throws(
    () => parseStorageReference('payment-proofs\\user\\file.jpg'),
    /karakter berbahaya/,
    'Backslashes must be rejected'
  );

  // 2.3 Unapproved bucket
  assert.throws(
    () => parseStorageReference('avatars/user.jpg'),
    /tidak diizinkan/,
    'Unapproved bucket name must be rejected'
  );

  // 2.4 Missing UID in payment-proofs
  assert.throws(
    () => parseStorageReference('payment-proofs/orphan_file.jpg'),
    /UID pengguna/,
    'Payment proof without UID folder must be rejected'
  );

  // 2.5 Illegal characters in filename
  assert.throws(
    () => parseStorageReference('qris/image;drop table.jpg'),
    /tidak diizinkan/,
    'Illegal characters in filename must be rejected'
  );

  // ==========================================
  // TEST SUITE 3: PRIVACY & PUBLIC URL BOUNDARIES
  // ==========================================
  console.log('\n[3] Testing Privacy & Public URL Boundaries...');

  // 3.1 Private bucket payment-proofs cannot generate public URL
  assert.throws(
    () => getPublicUrl('payment-proofs/user_123/proof.jpg'),
    /bersifat privat/,
    'Generating public URL for private payment-proofs must be rejected'
  );

  // 3.2 Public bucket qris can generate public URL
  const publicUrl = getPublicUrl('qris/merchant_preview.png');
  assert.strictEqual(
    publicUrl.includes('/storage/v1/object/public/qris/merchant_preview.png'),
    true,
    'QRIS public URL must point to public storage endpoint'
  );

  console.log('\n--- ALL PHASE 11D STORAGE UNIT TESTS PASSED (10/10 checks) ---');
}

runStorageTests().catch((err) => {
  console.error('\nStorage unit test failed:', err);
  process.exit(1);
});
