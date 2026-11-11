import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/auth';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../../lib/rateLimit';
import { assertSameOrigin } from '../../../../lib/requestSecurity';
import { getSignedUrl, uploadFile } from '../../../../lib/storage';
import { assertWritesAllowed } from '../../../../lib/maintenance';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'proof.jpg';
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

function assertImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    throw new Error('File harus berupa gambar (JPG, PNG, atau WebP)');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file maksimal 5MB');
  }
}

export async function POST(request: Request) {
  try {
    assertWritesAllowed('upload-payment-proof');
    assertSameOrigin(request);
    await assertRateLimit(rateLimitKey(request, 'upload-payment-proof'), 10, 60_000);

    const { user } = await requireUser(false);
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
    }
    assertImage(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${safeFileName(file.name)}`;
    const storagePath = await uploadFile(`payment-proofs/${user.uid}`, fileName, buffer, file.type);
    let previewUrl: string | null = null;
    try {
      previewUrl = await getSignedUrl(storagePath, 60);
    } catch {
      // previewUrl is optional for immediate client confirmation
    }

    return NextResponse.json({
      success: true,
      proofPath: storagePath,
      previewUrl,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('MAINTENANCE_ACTIVE')) {
      return NextResponse.json({ error: 'Sistem sedang dalam pemeliharaan.', maintenance: true }, { status: 503 });
    }
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error);
    }
    if (error instanceof RateLimitIpError) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan dari IP ini.' }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('origin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
    if (error instanceof Error) {
      if (error.message.includes('Anda harus login terlebih dahulu')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
      if (
        error.message.includes('Fitur ini membutuhkan akun Norden Pro') ||
        error.message.includes('Akses pencatatan keuangan tidak tersedia') ||
        error.message.includes('Anda tidak memiliki akses')
      ) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    const safeErrors = [
      'File harus berupa gambar (JPG, PNG, atau WebP)',
      'Ukuran file maksimal 5MB',
      'Ukuran file maksimal 5MB.',
      'File wajib diunggah',
      'Format file tidak didukung. Gunakan PNG, JPEG, atau WebP.',
      'Konten file tidak sesuai dengan tipe gambar yang ditentukan.',
    ];
    if (error instanceof Error && safeErrors.some((msg) => error.message.includes(msg))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Payment proof upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah bukti pembayaran' }, { status: 500 });
  }
}
