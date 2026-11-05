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

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 415 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 413 });
    }

    // Local smart parser from file metadata / hint name
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
      date: parsed.transactionDate
        ? (parsed.transactionDate instanceof Date ? parsed.transactionDate.toISOString() : String(parsed.transactionDate))
        : new Date().toISOString(),
      items: [],
      note: note.slice(0, 160),
      suggestedText,
      message: hasDetectedAmount
        ? `Struk terdeteksi: ${parsed.amount} untuk ${note}`
        : 'Struk terlampir. Silakan ketik nominal dan keterangan di Smart Input.'
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error);
    }
    if (error instanceof RateLimitIpError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('origin')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Receipt parse error:', error);
    const message = error instanceof Error ? error.message : 'Gagal memproses struk';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
