import { prisma } from './prisma';

export interface FinancialResetResult {
  success: boolean;
  targetName?: string;
  error?: string;
  counts?: {
    transactions: number;
    budgets: number;
    categories: number;
    balances: number;
    goals: number;
    wishlist: number;
    debts: number;
    paylaters: number;
    appSubscriptions: number;
    emergencyFunds: number;
    templates: number;
    recurring: number;
    reminders: number;
    achievements: number;
    notifications: number;
  };
}

/**
 * Dedicated server-side service to reset all financial data for a specific user.
 *
 * STRICT DATA BOUNDARIES:
 * - CLEARED: Transactions, budgets, custom categories, balances/wallets, saving goals,
 *   wishlist, debts, paylaters, bill subscriptions, emergency fund plan, templates,
 *   recurring transaction schedules, reminders, streaks, achievements, and financial notifications.
 * - PROTECTED: Firebase Auth user, Profile (role, plan, trial dates, onboarding status),
 *   BillingSubscription records, PaymentRequest records, uploaded payment proofs,
 *   Settings, RateLimitBucket, Feedback, and AuditLog history.
 */
export async function executeFinancialDataReset(
  targetUserId: string,
  actor: { userId: string; role: 'user' | 'admin' }
): Promise<FinancialResetResult> {
  if (!targetUserId || typeof targetUserId !== 'string' || !targetUserId.trim()) {
    throw new Error('ID pengguna target tidak valid.');
  }

  // 1. Verify target user exists
  const profile = await prisma.profile.findUnique({
    where: { userId: targetUserId },
    select: { id: true, userId: true, fullName: true, role: true },
  });

  if (!profile) {
    throw new Error('Profil pengguna tidak ditemukan.');
  }

  // 2. Perform atomic reset inside a database transaction
  const counts = await prisma.$transaction(async (tx) => {
    // Step A: Delete child records referencing Category / Balance first
    const deletedTx = await tx.transaction.deleteMany({ where: { userId: targetUserId } });
    const deletedBudgets = await tx.budget.deleteMany({ where: { userId: targetUserId } });
    const deletedCategories = await tx.category.deleteMany({ where: { userId: targetUserId } });
    const deletedBalances = await tx.balance.deleteMany({ where: { userId: targetUserId } });

    // Step B: Delete financial planning, debt, installment, and bill records
    const deletedGoals = await tx.savingGoal.deleteMany({ where: { userId: targetUserId } });
    const deletedWishlist = await tx.wishlistItem.deleteMany({ where: { userId: targetUserId } });
    const deletedDebts = await tx.debt.deleteMany({ where: { userId: targetUserId } });
    const deletedPaylaters = await tx.paylater.deleteMany({ where: { userId: targetUserId } });
    const deletedAppSubs = await tx.appSubscription.deleteMany({ where: { userId: targetUserId } });
    const deletedEmergency = await tx.emergencyFundPlan.deleteMany({ where: { userId: targetUserId } });
    const deletedTemplates = await tx.transactionTemplate.deleteMany({ where: { userId: targetUserId } });
    const deletedRecurring = await tx.recurringTransaction.deleteMany({ where: { userId: targetUserId } });
    const deletedReminders = await tx.reminder.deleteMany({ where: { userId: targetUserId } });
    const deletedAchievements = await tx.achievement.deleteMany({ where: { userId: targetUserId } });

    // Step C: Reset gamification streak
    await tx.streak.deleteMany({ where: { userId: targetUserId } });

    // Step D: Delete financial-only notifications (preserve billing & system notices)
    const deletedNotifications = await tx.notification.deleteMany({
      where: {
        userId: targetUserId,
        type: { notIn: ['TRIAL_WARNING', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED'] },
      },
    });

    // Step E: Seed clean default categories and primary wallet so user can immediately record transactions
    const defaultCategories: Array<{ userId: string; name: string; type: 'masuk' | 'keluar' }> = [
      { userId: targetUserId, name: 'Makanan', type: 'keluar' },
      { userId: targetUserId, name: 'Transport', type: 'keluar' },
      { userId: targetUserId, name: 'Tagihan', type: 'keluar' },
      { userId: targetUserId, name: 'Belanja', type: 'keluar' },
      { userId: targetUserId, name: 'Gaji', type: 'masuk' },
      { userId: targetUserId, name: 'Lain-lain', type: 'keluar' },
    ];
    await tx.category.createMany({ data: defaultCategories });
    await tx.balance.create({
      data: {
        userId: targetUserId,
        name: 'CASH',
        type: 'cash',
        currentBalance: 0,
      },
    });

    // Step F: Append audit log entry within transaction
    const auditAction = actor.role === 'admin'
      ? `ADMIN_RESET_FINANCIAL_DATA_TARGET_${targetUserId}`
      : 'RESET_FINANCIAL_DATA';

    await tx.auditLog.create({
      data: {
        userId: actor.userId,
        action: auditAction,
        entity: 'profile',
        entityId: targetUserId,
      },
    });

    return {
      transactions: deletedTx.count,
      budgets: deletedBudgets.count,
      categories: deletedCategories.count,
      balances: deletedBalances.count,
      goals: deletedGoals.count,
      wishlist: deletedWishlist.count,
      debts: deletedDebts.count,
      paylaters: deletedPaylaters.count,
      appSubscriptions: deletedAppSubs.count,
      emergencyFunds: deletedEmergency.count,
      templates: deletedTemplates.count,
      recurring: deletedRecurring.count,
      reminders: deletedReminders.count,
      achievements: deletedAchievements.count,
      notifications: deletedNotifications.count,
    };
  }, {
    maxWait: 5000,
    timeout: 20000,
  });

  return {
    success: true,
    targetName: profile.fullName || 'Pengguna',
    counts,
  };
}
