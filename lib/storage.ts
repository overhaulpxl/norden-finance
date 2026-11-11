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

export function getSupabaseBaseUrl(): string {
  const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = (rawUrl || '').trim().replace(/\/+$/, '');

  if (!url) {
    throw new Error(
      'Server configuration error: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL is required for Supabase Storage'
    );
  }

  return url;
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

function isValidImageMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (buffer.byteLength < 12) return false;
  const mime = mimeType.toLowerCase();

  // JPEG: FF D8 FF
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (mime === 'image/png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: RIFF .... WEBP
  if (mime === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
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

  if (!isValidImageMagicBytes(fileBuffer, contentType)) {
    throw new Error('Konten file tidak sesuai dengan tipe gambar yang ditentukan.');
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

/**
 * Deletes all storage objects in the payment-proofs bucket under the specified user ID prefix.
 */
export async function deleteUserStorageObjects(userId: string): Promise<void> {
  if (!userId || !userId.trim()) return;
  try {
    const client = getStorageClient();
    const cleanUid = userId.trim();
    const { data, error } = await client.from('payment-proofs').list(cleanUid);
    if (error) {
      console.warn(`Failed to list storage objects for user ${cleanUid}:`, error.message);
      return;
    }
    if (data && data.length > 0) {
      const pathsToDelete = data.map((item) => `${cleanUid}/${item.name}`);
      const { error: removeError } = await client.from('payment-proofs').remove(pathsToDelete);
      if (removeError) {
        console.warn(`Failed to delete storage objects for user ${cleanUid}:`, removeError.message);
      }
    }
  } catch (error) {
    console.warn(`deleteUserStorageObjects error for user ${userId}:`, error);
  }
}
