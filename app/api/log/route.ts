import { NextResponse } from 'next/server';
import { processInput } from '../../actions';
import { assertSameOrigin } from '../../../lib/requestSecurity';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../lib/rateLimit';

type ProcessResult = Awaited<ReturnType<typeof processInput>>;

function getError(result: ProcessResult): string {
  return 'error' in result && typeof result.error === 'string'
    ? result.error
    : 'Gagal mencatat transaksi';
}

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await assertRateLimit(rateLimitKey(req, 'api-log'), 30, 60_000);
    const { input } = await req.json().catch(() => ({ input: '' }));
    
    if (typeof input !== 'string' || !input.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    if (input.length > 500) {
      return NextResponse.json({ error: 'Input terlalu panjang' }, { status: 413 });
    }

    const result = await processInput(input);
    
    if (result.success) {
      return NextResponse.json({ message: 'Success', result: 'result' in result ? result.result : null });
    }

    return NextResponse.json({ error: getError(result) }, { status: 400 });
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
    if (error instanceof Error && error.message.includes('MAINTENANCE_ACTIVE')) {
      return NextResponse.json({ error: 'Sistem sedang dalam pemeliharaan.', maintenance: true }, { status: 503 });
    }
    console.error('API log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
