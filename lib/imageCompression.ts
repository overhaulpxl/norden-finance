/**
 * Client-side image compression utility using HTML5 Canvas.
 * Resizes large smartphone camera photos (5MB - 12MB) down to ~200-400KB
 * before uploading to serverless backends (Vercel 4.5MB limit).
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

export async function compressReceiptImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    maxSizeMB = 0.4, // ~400KB threshold
  } = options;

  // If file is already small enough, no compression needed
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  // Only compress image MIME types
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback to original
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to WebP or JPEG blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const compressedFile = new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            // If compressed is somehow bigger than original, keep original
            if (compressedFile.size > file.size) {
              resolve(file);
            } else {
              resolve(compressedFile);
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        resolve(file); // Fallback on image load error
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      resolve(file); // Fallback on reader error
    };

    reader.readAsDataURL(file);
  });
}
