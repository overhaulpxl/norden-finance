import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const testDir = path.join(process.cwd(), 'scripts', 'backup', '__test_cipher__');
if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

const keyFile = path.join(testDir, 'backup.key');
const plainFile = path.join(testDir, 'test.sql');
const encFile = path.join(testDir, 'test.sql.enc');
const decFile = path.join(testDir, 'test_decrypted.sql');

try {
  console.log('--- Testing scripts/backup/cipher.js ---');

  // 1. Generate valid 256-bit hex key (64 hex characters)
  const validKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  fs.writeFileSync(keyFile, validKey);
  const validateOut = execSync(`node scripts/backup/cipher.js validate-key --key-file "${keyFile}"`).toString().trim();
  assert.strictEqual(validateOut, 'KEY_VALID', 'Key validation must pass');
  console.log('✓ Valid key confirmed.');

  // 2. Reject invalid key length
  fs.writeFileSync(keyFile, 'shortkey123');
  assert.throws(() => {
    execSync(`node scripts/backup/cipher.js validate-key --key-file "${keyFile}"`, { stdio: 'pipe' });
  }, 'Should reject short key');
  console.log('✓ Invalid key rejected.');

  // Restore valid key
  fs.writeFileSync(keyFile, validKey);

  // 3. Encrypt file
  const testData = '-- PostgreSQL database dump\nSELECT 1;\nINSERT INTO "Profile" ("id") VALUES (\'test\');\n';
  fs.writeFileSync(plainFile, testData);
  const encOut = execSync(`node scripts/backup/cipher.js encrypt --key-file "${keyFile}" --in "${plainFile}" --out "${encFile}"`).toString().trim();
  assert.strictEqual(encOut, 'ENCRYPT_OK');
  assert.ok(fs.existsSync(encFile));
  console.log('✓ Encryption succeeded.');

  // 4. Decrypt file
  const decOut = execSync(`node scripts/backup/cipher.js decrypt --key-file "${keyFile}" --in "${encFile}" --out "${decFile}"`).toString().trim();
  assert.strictEqual(decOut, 'DECRYPT_OK');
  const decryptedData = fs.readFileSync(decFile, 'utf8');
  assert.strictEqual(decryptedData, testData);
  console.log('✓ Decryption matches original plaintext.');

  // 5. Tamper detection (Bit flip in ciphertext)
  const encBuf = fs.readFileSync(encFile);
  encBuf[encBuf.length - 1] ^= 0x01; // flip last byte
  fs.writeFileSync(encFile, encBuf);
  assert.throws(() => {
    execSync(`node scripts/backup/cipher.js decrypt --key-file "${keyFile}" --in "${encFile}" --out "${decFile}"`, { stdio: 'pipe' });
  }, 'Decryption of tampered ciphertext must fail');
  console.log('✓ Tamper detection verified (GCM auth tag rejected altered byte).');

  console.log('--- ALL CIPHER TESTS PASSED ---');
} finally {
  fs.rmSync(testDir, { recursive: true, force: true });
}
