import { cache } from 'react';
import { cookies } from 'next/headers';
import { getAdminAuth } from './firebaseAdmin';
import { getUserEntitlement } from './entitlements';

const SESSION_COOKIE_NAME = '__session';
const SESSION_EXPIRY_DAYS = 5;

export interface AuthUser {
  uid: string;
  email: string;
}

export type { UserEntitlement, EffectivePlan } from './entitlements';
export type AccessRequirement = 'read' | 'basic' | 'pro' | boolean;

/**
 * Get the current user from the Firebase session cookie.
 * Request-scoped deduplication via React cache().
 * Returns null if no valid session exists.
 * Used in server components and server actions.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const t0 = performance.now();
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) return null;

    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const dur = Math.round((performance.now() - t0) * 10) / 10;
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') {
      console.log(`[PERF:AUTH] verifySessionCookie completed in ${dur}ms (uid: ${decodedClaims.uid})`);
    }

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || '',
    };
  } catch {
    return null;
  }
});

/**
 * Require an authenticated user with appropriate access level.
 *
 * Requirement levels:
 * - 'read' (or false): User must be authenticated.
 * - 'basic': User must be authenticated and finished onboarding. Allowed for Free Basic, Trial, Pro.
 * - 'pro' (or true): User must have active Pro entitlement (paid Pro, active trial, or pending payment).
 */
export async function requireUser(requirement: AccessRequirement = 'read') {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Anda harus login terlebih dahulu.');
  }

  const entitlement = await getUserEntitlement(user.uid);

  const profile = {
    id: user.uid,
    userId: user.uid,
    role: entitlement.role,
    plan: (entitlement.effectivePlan === 'FREE_BASIC' ? 'trial' : entitlement.isPro ? 'pro' : 'trial') as 'trial' | 'pro',
    effectivePlan: entitlement.effectivePlan,
    trialStartedAt: entitlement.trialStartedAt,
    trialEndsAt: entitlement.trialEndsAt,
    onboardingCompleted: entitlement.onboardingCompleted,
    fullName: null as string | null,
  };

  // If requirement is read only
  if (requirement === false || requirement === 'read') {
    return { user, profile, entitlement };
  }

  // If user has not completed onboarding
  if (!entitlement.onboardingCompleted) {
    throw new Error('Anda harus menyelesaikan onboarding terlebih dahulu.');
  }

  // Core Basic Finance write operations (transactions, wallets)
  if (requirement === 'basic') {
    if (!entitlement.canWriteBasicFinance) {
      throw new Error('Akses pencatatan keuangan tidak tersedia.');
    }
    return { user, profile, entitlement };
  }

  // Genuine Pro-only operations (recurring background runner, email reminders, receipt OCR)
  if (requirement === true || requirement === 'pro') {
    if (!entitlement.canAccessProFeatures) {
      throw new Error('Fitur ini membutuhkan akun Norden Pro. Silakan upgrade ke Pro untuk melanjutkan.');
    }
    return { user, profile, entitlement };
  }

  return { user, profile, entitlement };
}

/**
 * Session cookie configuration
 */
export const SESSION_CONFIG = {
  name: SESSION_COOKIE_NAME,
  expiresIn: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // 5 days in ms
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 5 days in seconds
  },
};
