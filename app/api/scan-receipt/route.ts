import { NextResponse } from 'next/server';
import { assertSameOrigin } from '../../../lib/requestSecurity';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../lib/rateLimit';
import { requireUser } from '../../../lib/auth';
import { parseTransaction } from '../../../lib/parser';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await assertRateLimit(rateLimitKey(req, 'scan-receipt'), 30, 60_000);
    await requireUser();
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
    if (!allowedImageTypes.has(file.type.toLowerCase())) {
      return NextResponse.json({ error: 'File harus berupa gambar (JPG, PNG, atau WebP)' }, { status: 415 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 413 });
    }

    // Local smart parser from file metadata / hint name (100% offline & private)
    const rawName = file.name
      ? file.name.replace(/\.[^/.]+$/, '').replace(/[_\-+]/g, ' ')
      : '';

    const parsed = parseTransaction(rawName || 'belanja');
    const hasDetectedAmount = parsed.amount > 0;

    const note = parsed.note && parsed.note !== '-' ? parsed.note : (parsed.category || 'Struk Belanja');
    const merchant = note;
    const suggestedText = hasDetectedAmount
      ? `${parsed.amount} ${note} ${parsed.method || 'cash'}`
      : '';

    return NextResponse.json({
      amount: hasDetectedAmount ? parsed.amount : 0,
      merchant: merchant.slice(0, 120),
      category: parsed.category || 'Belanja',
      date: parsed.transactionDate
        ? (parsed.transactionDate instanceof Date ? parsed.transactionDate.toISOString() : String(parsed.transactionDate))
        : new Date().toISOString(),
      items: [],
      note: note.slice(0, 160),
      suggestedText,
      message: hasDetectedAmount
        ? `Struk terdeteksi: ${parsed.amount} untuk ${note}`
        : 'Struk terlampir. Silakan ketik nominal dan keterangan di Smart Input.',
    });
  } catch (error: unknown) {
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
    console.error('Receipt parse error:', error);
    return NextResponse.json({ error: 'Gagal memproses struk' }, { status: 500 });
  }
}
