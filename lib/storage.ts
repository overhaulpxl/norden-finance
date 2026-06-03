import { getAdminStorage } from './firebaseAdmin';

/**
 * Upload a file to Firebase Storage.
 * Returns the storage path (NOT a download URL).
 * 
 * @param folderPath - e.g., 'payment-proofs/user123'
 * @param fileName - e.g., 'payment.jpg'
 * @param fileBuffer - File data as Buffer
 * @param contentType - MIME type
 * @returns Storage path string
 */
export async function uploadFile(
  folderPath: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = getAdminStorage().bucket();
  const filePath = `${folderPath}/${fileName}`;
  const file = bucket.file(filePath);

  await file.save(fileBuffer, {
    metadata: {
      contentType,
    },
  });

  return filePath;
}

/**
 * Generate a temporary signed URL for a file in Firebase Storage.
 * URL expires in 1 hour by default.
 * 
 * @param storagePath - e.g., 'payment-proofs/user123/payment.jpg'
 * @param expiresInMinutes - URL expiry time (default: 60 minutes)
 * @returns Signed download URL
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInMinutes = 60
): Promise<string> {
  const bucket = getAdminStorage().bucket();
  const file = bucket.file(storagePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

/**
 * Delete a file from Firebase Storage.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const bucket = getAdminStorage().bucket();
  const file = bucket.file(storagePath);

  try {
    await file.delete();
  } catch (error) {
    console.error('Failed to delete file:', error);
  }
}
