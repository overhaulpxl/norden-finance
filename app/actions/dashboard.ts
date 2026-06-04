'use server';

import { getCurrentUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { syncAchievements } from '../../lib/achievements';

export async function getDashboardData() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Anda harus login terlebih dahulu.');
  }

  const userId = user.uid;

  // Fetch profile
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      role: true,
      plan: true,
      trialStartedAt: true,
      trialEndsAt: true,
      onboardingCompleted: true,
      fullName: true,
    },
  });

  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

  try {
    // Fetch all domain data in parallel.
    const [
      transactions,
      balances,
      categories,
      savingGoals,
      debts,
      wishlist,
      paylaters,
      budgets,
      subscriptions,
      emergencyFundPlan,
      templates,
      recurringTransactions,
      reminders,
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, deletedAt: null },
        include: { category: true, wallet: true, transferToWallet: true },
        orderBy: { transactionDate: 'desc' },
        take: 100,
      }),
      prisma.balance.findMany({
        where: { userId },
        orderBy: [
          { archivedAt: 'asc' },
          { updatedAt: 'desc' },
        ],
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      }),
      prisma.savingGoal.findMany({
        where: { userId },
      }),
      prisma.debt.findMany({
        where: { userId },
      }),
      prisma.wishlistItem.findMany({
        where: { userId },
      }),
      prisma.paylater.findMany({
        where: { userId },
      }),
      prisma.budget.findMany({
        where: { userId },
        include: { category: true },
      }),
      prisma.appSubscription.findMany({
        where: { userId },
      }),
      prisma.emergencyFundPlan.findUnique({
        where: { userId },
      }),
      prisma.transactionTemplate.findMany({
        where: { userId },
        orderBy: [
          { isFavorite: 'desc' },
          { lastUsedAt: 'desc' },
          { usageCount: 'desc' },
          { name: 'asc' },
        ],
      }),
      prisma.recurringTransaction.findMany({
        where: { userId },
        orderBy: [
          { isActive: 'desc' },
          { nextRunAt: 'asc' },
        ],
      }),
      prisma.reminder.findMany({
        where: { userId },
        orderBy: [
          { completedAt: 'asc' },
          { dueAt: 'asc' },
          { createdAt: 'desc' },
        ],
        take: 50,
      }),
    ]);
    const achievements = await syncAchievements(prisma, userId);

    return {
      transactions,
      balances,
      categories,
      savingGoals,
      debts,
      wishlist,
      paylaters,
      budgets,
      subscriptions,
      emergencyFundPlan,
      templates,
      recurringTransactions,
      reminders,
      achievements,
      profile: {
        role: profile.role,
        plan: profile.plan,
        trialEndsAt: profile.trialEndsAt.toISOString(),
        onboardingCompleted: profile.onboardingCompleted,
        fullName: profile.fullName,
      },
      dataError: null as string | null,
    };
  } catch (error) {
    console.error('Dashboard data unavailable:', error);
    return {
      transactions: [],
      balances: [],
      categories: [],
      savingGoals: [],
      debts: [],
      wishlist: [],
      paylaters: [],
      budgets: [],
      subscriptions: [],
      emergencyFundPlan: null,
      templates: [],
      recurringTransactions: [],
      reminders: [],
      achievements: [],
      profile: {
        role: profile.role,
        plan: profile.plan,
        trialEndsAt: profile.trialEndsAt.toISOString(),
        onboardingCompleted: profile.onboardingCompleted,
        fullName: profile.fullName,
      },
      dataError: 'Data dashboard sedang tidak lengkap karena database tidak dapat dibaca.',
    };
  }
}
