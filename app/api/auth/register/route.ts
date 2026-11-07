import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '../../../../lib/firebaseAdmin';
import { prisma } from '../../../../lib/prisma';
import { SESSION_CONFIG } from '../../../../lib/auth';
import { assertSameOrigin } from '../../../../lib/requestSecurity';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../../lib/rateLimit';
import { sendVerificationEmail } from '../../../../lib/authEmail';
import { DEFAULT_EMAIL_FROM } from '../../../../lib/email';

/**
 * POST /api/auth/register
 * Called after client-side Firebase registration.
 * Creates session cookie + Profile + BillingSubscription.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await assertRateLimit(rateLimitKey(request, 'auth-register'), 10, 60_000);
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

      // Create Profile + BillingSubscription in a transaction.
      // Trial begins ONLY when onboarding is completed in completeOnboarding.
      await prisma.$transaction([
        prisma.profile.create({
          data: {
            userId,
            fullName: typeof fullName === 'string' && fullName.trim() ? fullName.trim().slice(0, 80) : null,
            role: 'user',
            plan: 'trial',
            onboardingCompleted: false,
            trialStartedAt: now,
            trialEndsAt: now,
          },
        }),
        prisma.billingSubscription.create({
          data: {
            userId,
            plan: 'trial',
            status: 'onboarding',
            startedAt: now,
            expiredAt: now,
          },
        }),
      ]);
    }

    let verificationEmailStatus: unknown = null;
    const provider = process.env.EMAIL_VERIFICATION_PROVIDER || 'firebase';
    const emailFrom = process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM;

    let activeProvider = provider;
    if (provider === 'resend' && emailFrom.includes('onboarding@resend.dev')) {
      console.warn('Resend testing sender detected. Falling back to Firebase verification.');
      activeProvider = 'firebase';
    }

    if (activeProvider === 'resend') {
      if (decodedToken.email && decodedToken.email_verified === false) {
        try {
          verificationEmailStatus = await sendVerificationEmail({
            email: decodedToken.email,
            userName: fullName || existingProfile?.fullName || null,
          });
        } catch (emailError) {
          const message = emailError instanceof Error ? emailError.message : 'Verification email failed';
          console.warn('Verification email failed:', message);
          verificationEmailStatus = { error: message };
        }
      }
    }

    const shouldCreateSession = createSession && decodedToken.email_verified !== false;
    const response = NextResponse.json({
      success: true,
      requiresEmailVerification: !shouldCreateSession,
      emailVerificationProvider: activeProvider,
      verificationEmailStatus,
    });

    if (shouldCreateSession) {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_CONFIG.expiresIn,
      });
      response.cookies.set(SESSION_CONFIG.name, sessionCookie, SESSION_CONFIG.options);
    }

    return response;
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
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
