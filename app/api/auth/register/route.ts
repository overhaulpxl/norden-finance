import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../lib/firebaseAdmin';
import { prisma } from '../../../../lib/prisma';
import { SESSION_CONFIG } from '../../../../lib/auth';
import { assertSameOrigin } from '../../../../lib/requestSecurity';
import { assertRateLimit, rateLimitKey } from '../../../../lib/rateLimit';

/**
 * POST /api/auth/register
 * Called after client-side Firebase registration.
 * Creates session cookie + Profile + BillingSubscription.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    assertRateLimit(rateLimitKey(request, 'auth-register'), 10, 60_000);
    const { idToken, fullName, createSession = true } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if profile already exists (prevent duplicate creation)
    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

      // Create Profile + BillingSubscription in a transaction
      await prisma.$transaction([
        prisma.profile.create({
          data: {
            userId,
            fullName: fullName || 'User Norden',
            role: 'user',
            plan: 'trial',
            onboardingCompleted: false,
            trialStartedAt: now,
            trialEndsAt,
          },
        }),
        prisma.billingSubscription.create({
          data: {
            userId,
            plan: 'trial',
            status: 'trial',
            startedAt: now,
            expiredAt: trialEndsAt,
          },
        }),
      ]);
    }

    const shouldCreateSession = createSession && decodedToken.email_verified !== false;
    const response = NextResponse.json({
      success: true,
      requiresEmailVerification: !shouldCreateSession,
    });

    if (shouldCreateSession) {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_CONFIG.expiresIn,
      });
      response.cookies.set(SESSION_CONFIG.name, sessionCookie, SESSION_CONFIG.options);
    }

    return response;
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
