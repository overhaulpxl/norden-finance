import { cache } from 'react';
import { prisma } from './prisma';

export type EffectivePlan =
  | 'ONBOARDING'
  | 'PRO_ACTIVE'
  | 'TRIAL'
  | 'PRO_PENDING'
  | 'FREE_BASIC';

export interface UserEntitlement {
  userId: string;
  effectivePlan: EffectivePlan;
  isPro: boolean;
  canAccessProFeatures: boolean;
  canWriteBasicFinance: boolean;
  role: 'user' | 'admin';
  onboardingCompleted: boolean;
  trialDaysLeft: number | null;
  trialStartedAt: Date;
  trialEndsAt: Date;
  proExpiredAt: Date | null;
  hasPendingPayment: boolean;
  pendingPaymentId: string | null;
}

/**
 * Source of truth for effective access at current server time.
 * Precedence:
 * 1. ONBOARDING: User has not finished setup. General financial actions blocked.
 * 2. PRO_ACTIVE: Active paid subscription with expiredAt > now.
 * 3. TRIAL: Active unexpired trial (started upon onboarding completion).
 * 4. PRO_PENDING: Valid submitted payment with proof awaiting admin review.
 *    Under agreed policy, grants temporary Pro access until admin decision.
 * 5. FREE_BASIC: Expired trial without Pro entitlement.
 *    Preserves user account, full financial history, manual transactions,
 *    wallet balances, local Smart Input, and data exports.
 */
export const getUserEntitlement = cache(async (userId: string): Promise<UserEntitlement> => {
  const t0 = performance.now();
  const now = new Date();

  const [profile, activeBilling, pendingPayment] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        role: true,
        plan: true,
        onboardingCompleted: true,
        trialStartedAt: true,
        trialEndsAt: true,
      },
    }),
    prisma.billingSubscription.findFirst({
      where: {
        userId,
        plan: 'pro',
        status: 'active',
      },
      orderBy: { expiredAt: 'desc' },
    }),
    prisma.paymentRequest.findFirst({
      where: {
        userId,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!profile) {
    throw new Error('Profil pengguna tidak ditemukan.');
  }

  let entitlement: UserEntitlement;

  // 1. Incomplete Onboarding
  if (!profile.onboardingCompleted) {
    entitlement = {
      userId,
      effectivePlan: 'ONBOARDING',
      isPro: false,
      canAccessProFeatures: false,
      canWriteBasicFinance: false,
      role: profile.role,
      onboardingCompleted: false,
      trialDaysLeft: null,
      trialStartedAt: profile.trialStartedAt,
      trialEndsAt: profile.trialEndsAt,
      proExpiredAt: null,
      hasPendingPayment: false,
      pendingPaymentId: null,
    };
  } else if (activeBilling && (!activeBilling.expiredAt || activeBilling.expiredAt > now)) {
    // 2. Active Paid Pro Subscription
    entitlement = {
      userId,
      effectivePlan: 'PRO_ACTIVE',
      isPro: true,
      canAccessProFeatures: true,
      canWriteBasicFinance: true,
      role: profile.role,
      onboardingCompleted: true,
      trialDaysLeft: null,
      trialStartedAt: profile.trialStartedAt,
      trialEndsAt: profile.trialEndsAt,
      proExpiredAt: activeBilling.expiredAt || null,
      hasPendingPayment: Boolean(pendingPayment),
      pendingPaymentId: pendingPayment?.id || null,
    };
  } else if (now < profile.trialEndsAt) {
    // 3. Unexpired Trial
    const trialDaysLeft = Math.max(
      0,
      Math.ceil((profile.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    entitlement = {
      userId,
      effectivePlan: 'TRIAL',
      isPro: true,
      canAccessProFeatures: true,
      canWriteBasicFinance: true,
      role: profile.role,
      onboardingCompleted: true,
      trialDaysLeft,
      trialStartedAt: profile.trialStartedAt,
      trialEndsAt: profile.trialEndsAt,
      proExpiredAt: null,
      hasPendingPayment: Boolean(pendingPayment),
      pendingPaymentId: pendingPayment?.id || null,
    };
  } else if (pendingPayment && pendingPayment.proofPath && pendingPayment.amount > 0) {
    // 4. Valid Submitted Pending Payment (Temporary Pro access while awaiting review)
    entitlement = {
      userId,
      effectivePlan: 'PRO_PENDING',
      isPro: true,
      canAccessProFeatures: true,
      canWriteBasicFinance: true,
      role: profile.role,
      onboardingCompleted: true,
      trialDaysLeft: 0,
      trialStartedAt: profile.trialStartedAt,
      trialEndsAt: profile.trialEndsAt,
      proExpiredAt: null,
      hasPendingPayment: true,
      pendingPaymentId: pendingPayment.id,
    };
  } else {
    // 5. Free Basic Fallback
    entitlement = {
      userId,
      effectivePlan: 'FREE_BASIC',
      isPro: false,
      canAccessProFeatures: false,
      canWriteBasicFinance: true,
      role: profile.role,
      onboardingCompleted: true,
      trialDaysLeft: 0,
      trialStartedAt: profile.trialStartedAt,
      trialEndsAt: profile.trialEndsAt,
      proExpiredAt: null,
      hasPendingPayment: false,
      pendingPaymentId: null,
    };
  }

  const dur = Math.round((performance.now() - t0) * 10) / 10;
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') {
    console.log(`[PERF:ENTITLEMENT] getUserEntitlement completed in ${dur}ms (uid: ${userId})`);
  }

  return entitlement;
});
