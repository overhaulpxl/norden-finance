'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function readKeyFromFile(keyPath) {
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Encryption key file not found: ${path.resolve(keyPath)}`);
  }
  const raw = fs.readFileSync(keyPath, 'utf8').trim();
  let keyBuffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    keyBuffer = Buffer.from(raw, 'hex');
  } else if (Buffer.byteLength(raw, 'utf8') === 32) {
    keyBuffer = Buffer.from(raw, 'utf8');
  } else {
    throw new Error('Invalid encryption key: Key must be exactly 32 bytes (64 hex characters or 32 UTF-8 bytes).');
  }
  return keyBuffer;
}

function encryptFile(keyPath, inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  const stat = fs.statSync(inputPath);
  if (stat.size === 0) {
    throw new Error('Input file is empty (0 bytes). Refusing to create empty encrypted backup.');
  }

  const key = readKeyFromFile(keyPath);
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const inputStream = fs.readFileSync(inputPath);
  const encrypted = Buffer.concat([cipher.update(inputStream), cipher.final()]);
  const authTag = cipher.getAuthTag();

  if (authTag.length !== 16) {
    throw new Error('Failed to generate valid 16-byte GCM authentication tag.');
  }

  // Format: [12-byte IV][16-byte AuthTag][Ciphertext]
  const finalPayload = Buffer.concat([iv, authTag, encrypted]);
  fs.writeFileSync(outputPath, finalPayload);

  // Validate output file exists and is non-empty
  const outStat = fs.statSync(outputPath);
  if (outStat.size < 29) { // 12 + 16 + at least 1 byte ciphertext
    throw new Error('Corrupted output file: encrypted artifact is too small.');
  }
}

function decryptFile(keyPath, inputPath, outputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Encrypted file not found: ${inputPath}`);
  }
  const stat = fs.statSync(inputPath);
  if (stat.size < 28) {
    throw new Error('Encrypted file is corrupt: shorter than IV + AuthTag header (28 bytes).');
  }

  const key = readKeyFromFile(keyPath);
  const fileBuffer = fs.readFileSync(inputPath);

  const iv = fileBuffer.subarray(0, 12);
  const authTag = fileBuffer.subarray(12, 28);
  const ciphertext = fileBuffer.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    fs.writeFileSync(outputPath, decrypted);
  } catch (err) {
    throw new Error(`Decryption failed: Authenticated data verification error (tampered or wrong key). ${err.message}`);
  }

  const outStat = fs.statSync(outputPath);
  if (outStat.size === 0) {
    throw new Error('Decrypted output file is empty.');
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const mode = args[0];
  const params = {};
  for (let i = 1; i < args.length; i += 2) {
    params[args[i]] = args[i + 1];
  }
  return { mode, params };
}

function main() {
  const { mode, params } = parseArgs();
  try {
    if (mode === 'validate-key') {
      if (!params['--key-file']) throw new Error('Missing --key-file');
      readKeyFromFile(params['--key-file']);
      console.log('KEY_VALID');
    } else if (mode === 'encrypt') {
      if (!params['--key-file'] || !params['--in'] || !params['--out']) {
        throw new Error('Usage: node cipher.js encrypt --key-file <path> --in <path> --out <path>');
      }
      encryptFile(params['--key-file'], params['--in'], params['--out']);
      console.log('ENCRYPT_OK');
    } else if (mode === 'decrypt') {
      if (!params['--key-file'] || !params['--in'] || !params['--out']) {
        throw new Error('Usage: node cipher.js decrypt --key-file <path> --in <path> --out <path>');
      }
      decryptFile(params['--key-file'], params['--in'], params['--out']);
      console.log('DECRYPT_OK');
    } else {
      throw new Error(`Unknown mode: ${mode}. Allowed: validate-key, encrypt, decrypt`);
    }
  } catch (err) {
    console.error(`CIPHER_ERROR: ${err.message}`);
    process.exit(1);
  }
}

main();
