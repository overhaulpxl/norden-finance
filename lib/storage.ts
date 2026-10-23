import { StorageClient } from '@supabase/storage-js';

export type AllowedBucket = 'payment-proofs' | 'qris';

export interface StorageReference {
  bucket: AllowedBucket;
  objectPath: string;
  canonicalRef: string;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB

/**
 * Parses and strictly validates a canonical storage reference string.
 * Example canonical formats:
 * - 'payment-proofs/<firebase-uid>/<filename>'
 * - 'qris/<filename>'
 */
export function parseStorageReference(ref: string): StorageReference {
  if (!ref || typeof ref !== 'string') {
    throw new Error('Referensi penyimpanan tidak valid.');
  }

  const clean = ref.trim().replace(/^\/+/, '');
  if (clean.includes('..') || clean.includes('\\')) {
    throw new Error('Jalur penyimpanan mengandung karakter berbahaya.');
  }

  const parts = clean.split('/');
  const bucket = parts[0] as AllowedBucket;
  const objectPath = parts.slice(1).join('/');

  if (bucket !== 'payment-proofs' && bucket !== 'qris') {
    throw new Error(`Bucket penyimpanan "${bucket}" tidak diizinkan.`);
  }

  if (!objectPath || objectPath.length === 0) {
    throw new Error('Jalur objek penyimpanan tidak boleh kosong.');
  }

  if (bucket === 'payment-proofs') {
    if (parts.length < 3 || !parts[1] || !parts[2]) {
      throw new Error('Jalur bukti pembayaran harus menyertakan UID pengguna dan nama file.');
    }
  }

  const fileName = parts[parts.length - 1];
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    throw new Error('Nama file mengandung karakter tidak diizinkan.');
  }

  return {
    bucket,
    objectPath,
    canonicalRef: `${bucket}/${objectPath}`,
  };
}

function getSupabaseBaseUrl(): string {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://cfsjmpfgywfvpmrguqsi.supabase.co';
  return url.replace(/\/+$/, '');
}

/**
 * Retrieves server-side Supabase Storage configuration lazily.
 * Fails closed if the secret/service key is not configured.
 */
function getStorageConfig() {
  const url = getSupabaseBaseUrl();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error(
      'Server configuration error: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required for Supabase Storage'
    );
  }

  return {
    storageUrl: `${url}/storage/v1`,
    secretKey,
  };
}

function getStorageClient(): StorageClient {
  const { storageUrl, secretKey } = getStorageConfig();
  return new StorageClient(storageUrl, {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
  });
}

/**
 * Upload a file to Supabase Storage.
 *
 * @param folderPath - Target folder, e.g. 'payment-proofs/uid123' or 'qris'
 * @param fileName - Clean filename, e.g. '1729000000_proof.jpg'
 * @param fileBuffer - File data buffer
 * @param contentType - Image MIME type ('image/jpeg', 'image/png', 'image/webp')
 * @param options - Upload options (upsert default is false)
 * @returns Canonical storage reference: '<bucket>/<objectPath>'
 */
export async function uploadFile(
  folderPath: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string,
  options: { upsert?: boolean } = {}
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(contentType.toLowerCase())) {
    throw new Error(`Format file "${contentType}" tidak didukung. Gunakan PNG, JPEG, atau WebP.`);
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error('Ukuran file maksimal 5MB.');
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'upload.jpg';
  const cleanFolder = folderPath.trim().replace(/^\/+|\/+$/g, '');
  const candidateRef = `${cleanFolder}/${safeName}`;

  const { bucket, objectPath, canonicalRef } = parseStorageReference(candidateRef);

  const client = getStorageClient();
  const { error } = await client.from(bucket).upload(objectPath, fileBuffer, {
    contentType,
    upsert: options.upsert ?? false,
  });

  if (error) {
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
  }

  return canonicalRef;
}

/**
 * Generates a temporary signed URL for a private file in Supabase Storage.
 *
 * @param storageRef - Canonical reference, e.g. 'payment-proofs/uid123/proof.jpg'
 * @param expiresInMinutes - URL expiration duration (default 60 minutes)
 * @returns Temporary signed URL
 */
export async function getSignedUrl(
  storageRef: string,
  expiresInMinutes = 60
): Promise<string> {
  const { bucket, objectPath } = parseStorageReference(storageRef);

  const client = getStorageClient();
  const { data, error } = await client
    .from(bucket)
    .createSignedUrl(objectPath, expiresInMinutes * 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Gagal membuat signed URL untuk "${storageRef}": ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}

/**
 * Constructs a permanent public URL for public bucket objects (e.g. QRIS).
 *
 * @param storageRef - Canonical reference, e.g. 'qris/merchant_123.jpg'
 * @returns Public CDN URL
 */
export function getPublicUrl(storageRef: string): string {
  const { bucket, objectPath } = parseStorageReference(storageRef);

  if (bucket !== 'qris') {
    throw new Error(`Bucket "${bucket}" bersifat privat dan tidak dapat diakses melalui URL publik.`);
  }

  const baseUrl = getSupabaseBaseUrl();
  return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}

/**
 * Deletes a file from Supabase Storage.
 *
 * @param storageRef - Canonical reference to remove
 */
export async function deleteFile(storageRef: string): Promise<void> {
  const { bucket, objectPath } = parseStorageReference(storageRef);

  const client = getStorageClient();
  const { error } = await client.from(bucket).remove([objectPath]);

  if (error) {
    console.error(`Gagal menghapus file "${storageRef}" dari Supabase Storage:`, error.message);
  }
}
