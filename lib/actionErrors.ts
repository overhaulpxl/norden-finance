import { revalidatePath } from 'next/cache';

const SAFE_ERROR_SUBSTRINGS = [
  'Anda harus login terlebih dahulu',
  'Anda harus menyelesaikan onboarding',
  'Akses pencatatan keuangan tidak tersedia',
  'Fitur ini membutuhkan akun Norden Pro',
  'Anda tidak memiliki akses',
  'Anda tidak dapat',
  'wajib diisi',
  'harus lebih dari 0',
  'tidak boleh negatif',
  'melebihi batas',
  'terlalu panjang',
  'terlalu besar',
  'terlalu pendek',
  'tidak valid',
  'sudah terdaftar',
  'tidak ditemukan',
  'sudah lunas',
  'sudah dibeli',
  'sudah diproses',
  'Masih ada permintaan upgrade',
  'Input kosong',
  'Pilih dompet tujuan',
  'Tidak ada transaksi',
  'Impor transaksi transfer belum didukung',
  'Maksimal 500 transaksi per impor',
  'Format file',
  'Ukuran file',
  'Konten file',
  'File wajib',
  'Bukti pembayaran',
  'Gambar QRIS',
  'Kelas aset tidak valid',
  'Tautan atau kode reset PIN ini sudah pernah digunakan',
  'Terlalu banyak request',
  'Terlalu banyak permintaan',
];

/**
 * Sanitizes errors returned by Server Actions to prevent leaking database,
 * connection, or internal stack details to clients.
 */
export function sanitizeActionError(error: unknown, fallbackMessage = 'Terjadi kesalahan sistem'): string {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const raw = error.message || '';

  if (raw.includes('MAINTENANCE_ACTIVE')) {
    return 'Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.';
  }

  // Prevent leakage of Prisma/Database internals
  const dbLeakIndicators = [
    'prisma',
    'p20',
    'p10',
    'transaction',
    'timeout',
    'timed out',
    'queryraw',
    'database',
    'econnrefused',
    'etimedout',
    'connection',
    'deadlock',
    'foreign key',
    'unique constraint',
    'syntax error',
  ];

  const lowerRaw = raw.toLowerCase();
  if (dbLeakIndicators.some((indicator) => lowerRaw.includes(indicator))) {
    if (lowerRaw.includes('timeout') || lowerRaw.includes('p2024')) {
      return 'Batas waktu pemrosesan database terlampaui. Silakan coba kembali.';
    }
    return 'Terjadi gangguan pada sistem database. Silakan coba kembali.';
  }

  // Check if error is an intentional user-facing domain/validation message
  const isSafe = SAFE_ERROR_SUBSTRINGS.some((substr) => raw.includes(substr));
  if (isSafe) {
    return raw;
  }

  return fallbackMessage;
}

/**
 * Safe wrapper around next/cache revalidatePath that swallows errors
 * when invoked in non-request contexts (e.g. CLI, tests, background workers).
 */
export function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // Intentionally ignored in test / offline environments
  }
}
