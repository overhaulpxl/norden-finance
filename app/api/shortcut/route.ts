import { NextResponse } from 'next/server';
import { processInput, processUserInput } from '../../actions/transactions';
import { assertSameOrigin } from '../../../lib/requestSecurity';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
} from '../../../lib/rateLimit';
import { assertShortcutWriteAccess, validateShortcutToken } from '../../../lib/shortcutToken';

type ProcessResult = Awaited<ReturnType<typeof processInput>> | Awaited<ReturnType<typeof processUserInput>>;

function getError(result: ProcessResult): string {
  return 'error' in result && typeof result.error === 'string'
    ? result.error
    : 'Gagal mencatat transaksi';
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Use POST to create shortcut transactions.' },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.has('token')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Token di URL query parameter dilarang demi keamanan. Gunakan header Authorization: Bearer <TOKEN>.',
      },
      { status: 400 }
    );
  }

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  let bearerToken: string | null = null;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }
  const token = bearerToken;
  let tokenUserId: string | null = null;

  if (token) {
    tokenUserId = await validateShortcutToken(token);
    if (!tokenUserId) {
      return NextResponse.json({ success: false, error: 'Token shortcut tidak valid.' }, { status: 401 });
    }

    try {
      await assertRateLimit(rateLimitKey(request, `api-shortcut-token:${tokenUserId}`), 30, 60_000);
    } catch (error: unknown) {
      if (error instanceof RateLimitExceededError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
        );
      }
      if (error instanceof RateLimitIpError) {
        return NextResponse.json({ success: false, error: 'Terlalu banyak permintaan dari IP ini.' }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: 'Terlalu banyak request.' }, { status: 429 });
    }
  } else {
    try {
      assertSameOrigin(request);
      await assertRateLimit(rateLimitKey(request, 'api-shortcut'), 30, 60_000);
    } catch (error: unknown) {
      if (error instanceof RateLimitExceededError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } }
        );
      }
      if (error instanceof RateLimitIpError) {
        return NextResponse.json({ success: false, error: 'Terlalu banyak permintaan dari IP ini.' }, { status: 400 });
      }
      const message = error instanceof Error && error.message.includes('origin') ? 'Akses ditolak.' : 'Terlalu banyak request.';
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
  }

  const { text } = await request.json().catch(() => ({ text: '' }));

  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ success: false, error: 'Missing text parameter' }, { status: 400 });
  }

  if (text.length > 500) {
    return NextResponse.json({ success: false, error: 'Input terlalu panjang' }, { status: 413 });
  }

  try {
    const result = tokenUserId
      ? await (async () => {
          await assertShortcutWriteAccess(tokenUserId);
          return processUserInput(tokenUserId, text);
        })()
      : await processInput(text);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Transaction recorded successfully',
        data: 'result' in result ? result.result : null,
      });
    }

    return NextResponse.json({ success: false, error: getError(result) }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('MAINTENANCE_ACTIVE')) {
      return NextResponse.json(
        { success: false, error: 'Sistem sedang dalam pemeliharaan.', maintenance: true },
        { status: 503 }
      );
    }
    const safeErrorMessages = [
      'Selesaikan onboarding terlebih dahulu.',
      'Akses shortcut tidak tersedia.',
    ];
    if (error instanceof Error && safeErrorMessages.includes(error.message)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error('Shortcut processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan saat memproses transaksi shortcut.' },
      { status: 500 }
    );
  }
}
