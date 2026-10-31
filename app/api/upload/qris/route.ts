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
import { getPublicUrl, uploadFile } from '../../../../lib/storage';
import { assertWritesAllowed } from '../../../../lib/maintenance';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'qris.jpg';
}

function assertImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran file maksimal 5MB');
  }
}

export async function POST(request: Request) {
  try {
    assertWritesAllowed('upload-qris');
    assertSameOrigin(request);
    await assertRateLimit(rateLimitKey(request, 'upload-qris'), 5, 60_000);

    const { profile } = await requireUser(true);
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
    }
    assertImage(file);

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `merchant_${Date.now()}_${safeFileName(file.name)}`;
    const storagePath = await uploadFile('qris', fileName, buffer, file.type, { upsert: true });
    const imageUrl = getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      qrisPath: storagePath,
      imageUrl,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('MAINTENANCE_ACTIVE')) {
      return NextResponse.json({ error: error.message, maintenance: true }, { status: 503 });
    }
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error);
    }
    if (error instanceof RateLimitIpError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('origin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : 'Gagal mengunggah QRIS';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
