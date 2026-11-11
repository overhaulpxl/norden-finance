import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../lib/firebaseAdmin';
import { SESSION_CONFIG, getSessionConfig } from '../../../../lib/auth';
import { assertSameOrigin } from '../../../../lib/requestSecurity';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../../lib/rateLimit';

/**
 * POST /api/auth/session
 * Creates a Firebase session cookie from an ID token.
 * Called after client-side Firebase login.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await assertRateLimit(rateLimitKey(request, 'auth-session'), 20, 60_000);
    const { idToken, rememberMe = true } = await request.json().catch(() => ({}));

    if (typeof idToken !== 'string' || !idToken.trim() || idToken.length > 4096) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token first
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    if (decodedToken.email_verified === false) {
      return NextResponse.json(
        { error: 'Verifikasi email Anda sebelum masuk.' },
        { status: 403 }
      );
    }

    const sessionConfig = getSessionConfig(rememberMe !== false);

    // Create session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: sessionConfig.expiresIn,
    });

    // Set the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(sessionConfig.name, sessionCookie, sessionConfig.options);

    return response;
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
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat sesi login.' },
      { status: 401 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie (logout).
 */
export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('origin')) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_CONFIG.name, '', {
    ...SESSION_CONFIG.options,
    maxAge: 0,
  });
  return response;
}
