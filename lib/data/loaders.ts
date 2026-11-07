import 'server-only';

import { PaymentStatus, PlanType, Prisma, type PrismaClient } from '@prisma/client';
import { prisma } from '../prisma';
import { syncAchievements } from '../achievements';
import { DEFAULT_MONTHLY_PRICE, DEFAULT_PRICING, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from '../constants';
import { getUserEntitlement } from '../entitlements';

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const ADMIN_PAGE_LIMIT = 200;
const EXPORT_ROW_LIMIT = 5000;
const DASHBOARD_TRANSACTION_LIMIT = 50;

export type PaymentSettings = Awaited<ReturnType<typeof getPaymentSettings>>;
export type PricingPlans = Awaited<ReturnType<typeof getPricingPlans>>;
export type MonthlyReportData = Awaited<ReturnType<typeof getMonthlyReportData>>;
export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export interface UnavailableMetrics {
  users?: boolean;
  transactions?: boolean;
  financials?: boolean;
  revenue?: boolean;
  userGrowth?: boolean;
}

export interface PlatformStats {
  totalUsers: number;
  proUsers: number;
  trialUsers: number;
  adminUsers: number;
  totalTransactions: number;
  totalBalances: number;
  totalBudgets: number;
  totalSavingGoals: number;
  totalDebts: number;
  totalPaylaters: number;
  totalSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  userGrowth: { date: string; count: number }[];
  isUnavailable?: boolean;
  unavailableMetrics?: UnavailableMetrics;
}

type Db = PrismaClient;

type PricingSource = 'plan' | 'settings' | 'fallback';

const balanceSelect = {
  id: true,
  userId: true,
  name: true,
  type: true,
  currentBalance: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const categorySelect = {
  id: true,
  userId: true,
  name: true,
  type: true,
  createdAt: true,
} as const;

const transactionListSelect = {
  id: true,
  userId: true,
  categoryId: true,
  walletId: true,
  transferToWalletId: true,
  type: true,
  amount: true,
  note: true,
  rawInput: true,
  tags: true,
  receiptMerchant: true,
  receiptItems: true,
  receiptDate: true,
  transactionDate: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: categorySelect },
  wallet: { select: balanceSelect },
  transferToWallet: { select: balanceSelect },
} as const;

export interface PricingPlanView {
  id: string;
  name: string;
  type: 'trial' | 'pro';
  price: number;
  billingType: string | null;
  durationDays: number | null;
  isActive: boolean;
  source: PricingSource;
}

function getMonthRange(month: number, year: number) {
  const safeMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1;
  const safeYear = Number.isInteger(year) && year >= 1970 && year <= 9999 ? year : new Date().getFullYear();
  const periodStart = new Date(safeYear, safeMonth - 1, 1);
  const periodEnd = new Date(safeYear, safeMonth, 0, 23, 59, 59, 999);

  return {
    month: safeMonth,
    year: safeYear,
    periodStart,
    periodEnd,
    monthName: `${INDONESIAN_MONTHS[safeMonth - 1]} ${safeYear}`,
    periodLabel: `1 - ${periodEnd.getDate()} ${INDONESIAN_MONTHS[safeMonth - 1]} ${safeYear}`,
  };
}

function formatGeneratedDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())} WIB`;
}

function calculateFinancialHealthScore(input: {
  totalIncome: number;
  totalExpense: number;
  activeWalletBalance: number;
  savingGoalCount: number;
  debtAmount: number;
}) {
  let score = 50;
  if (input.totalIncome > 0) {
    const savingsRate = (input.totalIncome - input.totalExpense) / input.totalIncome;
    score += Math.max(-25, Math.min(25, savingsRate * 50));
  }
  if (input.activeWalletBalance > 0) score += 10;
  if (input.savingGoalCount > 0) score += 10;
  if (input.debtAmount > input.activeWalletBalance) score -= 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function getUserProfile(userId: string, db: Db = prisma) {
  return db.profile.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      fullName: true,
      role: true,
      plan: true,
      onboardingCompleted: true,
      trialStartedAt: true,
      trialEndsAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getTrialDays(db: Db = prisma) {
  try {
    const [plan, setting] = await Promise.all([
      db.plan.findFirst({ where: { type: 'trial', isActive: true } }),
      db.setting.findUnique({ where: { key: 'trial_days' } }),
    ]);
    if (plan?.durationDays && plan.durationDays > 0) return plan.durationDays;
    const parsed = Number.parseInt(setting?.value || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRIAL_DAYS;
  } catch {
    return DEFAULT_TRIAL_DAYS;
  }
}

export async function getDashboardData(userId: string, db: Db = prisma) {
  const t0 = performance.now();
  const profile = await getUserProfile(userId, db);
  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

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
    db.transaction.findMany({
      where: { userId, deletedAt: null },
      select: transactionListSelect,
      orderBy: { transactionDate: 'desc' },
      take: DASHBOARD_TRANSACTION_LIMIT,
    }),
    db.balance.findMany({
      where: { userId },
      select: balanceSelect,
      orderBy: [
        { archivedAt: 'asc' },
        { updatedAt: 'desc' },
      ],
    }),
    db.category.findMany({ where: { userId }, select: categorySelect, orderBy: { name: 'asc' } }),
    db.savingGoal.findMany({ where: { userId } }),
    db.debt.findMany({ where: { userId } }),
    db.wishlistItem.findMany({ where: { userId } }),
    db.paylater.findMany({ where: { userId } }),
    db.budget.findMany({ where: { userId }, include: { category: { select: categorySelect } } }),
    db.appSubscription.findMany({ where: { userId } }),
    db.emergencyFundPlan.findUnique({ where: { userId } }),
    db.transactionTemplate.findMany({
      where: { userId },
      orderBy: [
        { isFavorite: 'desc' },
        { lastUsedAt: 'desc' },
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
    }),
    db.recurringTransaction.findMany({
      where: { userId },
      orderBy: [
        { isActive: 'desc' },
        { nextRunAt: 'asc' },
      ],
    }),
    db.reminder.findMany({
      where: { userId },
      orderBy: [
        { completedAt: 'asc' },
        { dueAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    }),
  ]);

  const [achievements, entitlement] = await Promise.all([
    syncAchievements(db, userId, {
      transactions,
      balances,
      goals: savingGoals,
      emergencyFundPlan,
    }),
    getUserEntitlement(userId),
  ]);

  const dur = Math.round((performance.now() - t0) * 10) / 10;
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') {
    console.log(`[PERF:LOADER] getDashboardData completed in ${dur}ms (userId: ${userId})`);
  }

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
      plan: entitlement.isPro ? 'pro' : 'trial',
      effectivePlan: entitlement.effectivePlan,
      trialEndsAt: entitlement.effectivePlan === 'TRIAL' ? entitlement.trialEndsAt.toISOString() : null,
      proExpiredAt: entitlement.proExpiredAt?.toISOString() || null,
      onboardingCompleted: profile.onboardingCompleted,
      fullName: profile.fullName,
      hasPendingPayment: entitlement.hasPendingPayment,
    },
    dataError: null as string | null,
  };
}

export async function getMonthlyReportData(userId: string, month: number, year: number, db: Db = prisma) {
  const range = getMonthRange(month, year);
  const generatedAt = new Date();

  const [
    profile,
    transactions,
    wallets,
    savingGoals,
    debts,
    streak,
    achievements,
  ] = await Promise.all([
    getUserProfile(userId, db),
    db.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: {
          gte: range.periodStart,
          lte: range.periodEnd,
        },
      },
      include: { category: true, wallet: true, transferToWallet: true },
      orderBy: { transactionDate: 'desc' },
      take: EXPORT_ROW_LIMIT,
    }),
    db.balance.findMany({ where: { userId, archivedAt: null }, orderBy: { name: 'asc' } }),
    db.savingGoal.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
    db.debt.findMany({ where: { userId, isSettled: false } }),
    db.streak.findUnique({ where: { userId } }),
    db.achievement.findMany({
      where: {
        userId,
        unlockedAt: {
          gte: range.periodStart,
          lte: range.periodEnd,
        },
      },
      orderBy: { unlockedAt: 'desc' },
    }),
  ]);

  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

  const totalTransactions = transactions.length;
  const totalIncome = transactions.filter((t) => t.type === 'masuk').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'keluar').reduce((sum, t) => sum + t.amount, 0);
  const transferVolume = transactions.filter((t) => t.type === 'transfer').reduce((sum, t) => sum + t.amount, 0);
  const cashflow = totalIncome - totalExpense;
  const activeWalletBalance = wallets.reduce((sum, wallet) => sum + wallet.currentBalance, 0);

  const expenseByCategory = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== 'keluar') continue;
    const name = transaction.category?.name || null;
    if (!name) continue;
    expenseByCategory.set(name, (expenseByCategory.get(name) || 0) + transaction.amount);
  }
  const largestExpense = Array.from(expenseByCategory.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)[0] || null;
  const largestExpenseAmount = largestExpense?.amount || 0;
  const recentTransactions = transactions.slice(0, 20).map((transaction) => ({
    id: transaction.id,
    transactionDate: transaction.transactionDate,
    type: transaction.type,
    amount: transaction.amount,
    note: transaction.note,
    category: transaction.category ? { name: transaction.category.name } : null,
    wallet: transaction.wallet ? { name: transaction.wallet.name } : null,
    transferToWallet: transaction.transferToWallet ? { name: transaction.transferToWallet.name } : null,
  }));

  return {
    userFullName: profile?.fullName || 'Pengguna Norden',
    userPlan: profile?.plan || 'trial',
    month: range.month,
    year: range.year,
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    generatedAt,
    monthName: range.monthName,
    periodLabel: range.periodLabel,
    generatedDateLabel: formatGeneratedDate(generatedAt),
    totalTransactions,
    totalIncome,
    totalExpense,
    transferVolume,
    cashflow,
    activeWalletBalance,
    largestExpenseCategory: largestExpense?.name || null,
    largestExpenseAmount,
    largestExpensePercentage: totalExpense > 0 ? Math.round((largestExpenseAmount / totalExpense) * 100) : 0,
    recentTransactions,
    savingGoals: savingGoals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
    })),
    financialHealthScore: calculateFinancialHealthScore({
      totalIncome,
      totalExpense,
      activeWalletBalance,
      savingGoalCount: savingGoals.length,
      debtAmount: debts.reduce((sum, debt) => sum + debt.amount, 0),
    }),
    streak: {
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      lastInputDate: streak?.lastInputDate || null,
    },
    achievements: achievements.map((achievement) => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      unlockedAt: achievement.unlockedAt,
    })),
    topCategoryName: largestExpense?.name || '',
    topCategoryAmount: largestExpenseAmount,
    topCategoryPercent: totalExpense > 0 ? Math.round((largestExpenseAmount / totalExpense) * 100) : 0,
    transactions: recentTransactions,
  };
}

function classifyDatabaseError(err: unknown): { code: string; userReason: string } {
  let code = 'UNKNOWN';
  let userReason = 'kendala database sementara';

  if (err && typeof err === 'object') {
    const errCode = (err as { code?: string }).code;
    const msg = String((err as { message?: string }).message || '');

    if (errCode === 'P2024' || msg.includes('P2024') || /timed out|timeout/i.test(msg)) {
      code = 'P2024';
      userReason = 'batas waktu koneksi database';
    } else if (errCode === 'P1001' || msg.includes('P1001') || /can't reach database|connect ECONNREFUSED/i.test(msg)) {
      code = 'P1001';
      userReason = 'koneksi ke server database terputus';
    } else if (errCode === 'P2010' || msg.includes('P2010') || msg.includes('42883') || /raw query failed/i.test(msg)) {
      code = 'P2010';
      userReason = 'kesalahan pemrosesan kueri database';
    }
  }

  return { code, userReason };
}

function sanitizeLogMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
      .replace(/\/\/[^:]+:[^@]+@[^/\s]+/g, '//***:***@***')
      .replace(/password=[^\s&]+/gi, 'password=***');
  }
  return String(err);
}

export async function getAdminStats(db: Db = prisma) {
  const t0 = performance.now();

  // Step 1: Sequential retrieval of core management lists
  // Executing sequentially ensures exactly 1 connection checkout at any moment,
  // completely eliminating pool queue contention on pools with connection_limit=1.
  const paymentRequests = await db.paymentRequest.findMany({ orderBy: { createdAt: 'desc' }, take: ADMIN_PAGE_LIMIT });
  const feedbacks = await db.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: ADMIN_PAGE_LIMIT });
  const listedUsers = await db.profile.findMany({ orderBy: { createdAt: 'desc' }, take: ADMIN_PAGE_LIMIT });
  const auditLogs = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });

  // Step 2: Consolidated retrieval of noncritical platform summary statistics
  // Wrapped in a dedicated error boundary to prevent whole-page crash if pool times out.
  let platformStats: PlatformStats;
  let statsError: string | undefined;

  try {
    let totalUsers = 0;
    let proUsers = 0;
    let trialUsers = 0;
    let adminUsers = 0;
    let totalTransactions = 0;
    let totalBalances = 0;
    let totalBudgets = 0;
    let totalSavingGoals = 0;
    let totalDebts = 0;
    let totalPaylaters = 0;
    let totalSubscriptions = 0;
    let totalRevenue = 0;
    let approvedPayments = 0;
    let pendingPayments = 0;
    let rejectedPayments = 0;
    const unavailableMetrics: UnavailableMetrics = {};
    let lastErrorReason: string | undefined;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    type AggRow = {
      totalUsers: number;
      proUsers: number;
      trialUsers: number;
      adminUsers: number;
      totalTransactions: number;
      totalBalances: number;
      totalBudgets: number;
      totalSavingGoals: number;
      totalDebts: number;
      totalPaylaters: number;
      totalSubscriptions: number;
      totalRevenue: number;
      approvedPayments: number;
      pendingPayments: number;
      rejectedPayments: number;
    };

    const clientWithRaw = db as unknown as {
      $queryRaw?: (query: Prisma.Sql) => Promise<AggRow[]>;
    };

    let consolidatedSucceeded = false;

    if (clientWithRaw.$queryRaw) {
      try {
        const aggResult = await clientWithRaw.$queryRaw(Prisma.sql`
          SELECT
            (SELECT COUNT(*)::int FROM "Profile") AS "totalUsers",
            (SELECT COUNT(*)::int FROM "Profile" WHERE "plan" = ${PlanType.pro}::"PlanType") AS "proUsers",
            (SELECT COUNT(*)::int FROM "Profile" WHERE "plan" = ${PlanType.trial}::"PlanType") AS "trialUsers",
            (SELECT COUNT(*)::int FROM "Profile" WHERE "role" = 'admin'::"UserRole") AS "adminUsers",
            (SELECT COUNT(*)::int FROM "Transaction" WHERE "deletedAt" IS NULL) AS "totalTransactions",
            (SELECT COUNT(*)::int FROM "Balance") AS "totalBalances",
            (SELECT COUNT(*)::int FROM "Budget") AS "totalBudgets",
            (SELECT COUNT(*)::int FROM "SavingGoal") AS "totalSavingGoals",
            (SELECT COUNT(*)::int FROM "Debt") AS "totalDebts",
            (SELECT COUNT(*)::int FROM "Paylater") AS "totalPaylaters",
            (SELECT COUNT(*)::int FROM "AppSubscription") AS "totalSubscriptions",
            (SELECT COALESCE(SUM("amount"), 0)::float FROM "PaymentRequest" WHERE "status" = ${PaymentStatus.approved}::"PaymentStatus") AS "totalRevenue",
            (SELECT COUNT(*)::int FROM "PaymentRequest" WHERE "status" = ${PaymentStatus.approved}::"PaymentStatus") AS "approvedPayments",
            (SELECT COUNT(*)::int FROM "PaymentRequest" WHERE "status" = ${PaymentStatus.pending}::"PaymentStatus") AS "pendingPayments",
            (SELECT COUNT(*)::int FROM "PaymentRequest" WHERE "status" = ${PaymentStatus.rejected}::"PaymentStatus") AS "rejectedPayments"
        `);

        const agg = aggResult[0] || ({} as Partial<AggRow>);
        totalUsers = Number(agg.totalUsers) || 0;
        proUsers = Number(agg.proUsers) || 0;
        trialUsers = Number(agg.trialUsers) || 0;
        adminUsers = Number(agg.adminUsers) || 0;
        totalTransactions = Number(agg.totalTransactions) || 0;
        totalBalances = Number(agg.totalBalances) || 0;
        totalBudgets = Number(agg.totalBudgets) || 0;
        totalSavingGoals = Number(agg.totalSavingGoals) || 0;
        totalDebts = Number(agg.totalDebts) || 0;
        totalPaylaters = Number(agg.totalPaylaters) || 0;
        totalSubscriptions = Number(agg.totalSubscriptions) || 0;
        totalRevenue = Number(agg.totalRevenue) || 0;
        approvedPayments = Number(agg.approvedPayments) || 0;
        pendingPayments = Number(agg.pendingPayments) || 0;
        rejectedPayments = Number(agg.rejectedPayments) || 0;
        consolidatedSucceeded = true;
      } catch (rawErr) {
        const { code, userReason } = classifyDatabaseError(rawErr);
        lastErrorReason = userReason;
        console.error(`Consolidated $queryRaw failed (code: ${code}), attempting decoupled fallback queries:`, sanitizeLogMessage(rawErr));
      }
    }

    if (!consolidatedSucceeded) {
      // Decoupled independent sequential execution per domain (preserves peak concurrency = 1)
      
      // Domain 1: Revenue & Payments
      try {
        const approvedPaymentStats = await db.paymentRequest.aggregate({
          where: { status: PaymentStatus.approved },
          _sum: { amount: true },
          _count: true,
        });
        totalRevenue = approvedPaymentStats._sum.amount || 0;
        approvedPayments = approvedPaymentStats._count;
        pendingPayments = await db.paymentRequest.count({ where: { status: PaymentStatus.pending } });
        rejectedPayments = await db.paymentRequest.count({ where: { status: PaymentStatus.rejected } });
      } catch (err) {
        const { code, userReason } = classifyDatabaseError(err);
        lastErrorReason = userReason;
        console.error(`Failed to load payment/revenue statistics (code: ${code}):`, sanitizeLogMessage(err));
        unavailableMetrics.revenue = true;
      }

      // Domain 2: Users & Profiles
      try {
        totalUsers = await db.profile.count();
        proUsers = await db.profile.count({ where: { plan: PlanType.pro } });
        trialUsers = await db.profile.count({ where: { plan: PlanType.trial } });
        adminUsers = await db.profile.count({ where: { role: 'admin' } });
      } catch (err) {
        const { code, userReason } = classifyDatabaseError(err);
        lastErrorReason = userReason;
        console.error(`Failed to load user/profile statistics (code: ${code}):`, sanitizeLogMessage(err));
        unavailableMetrics.users = true;
      }

      // Domain 3: Transactions
      try {
        totalTransactions = await db.transaction.count({ where: { deletedAt: null } });
      } catch (err) {
        const { code, userReason } = classifyDatabaseError(err);
        lastErrorReason = userReason;
        console.error(`Failed to load transaction statistics (code: ${code}):`, sanitizeLogMessage(err));
        unavailableMetrics.transactions = true;
      }

      // Domain 4: Financial Accounts & Budgets
      try {
        totalBalances = await db.balance.count();
        totalBudgets = await db.budget.count();
        totalSavingGoals = await db.savingGoal.count();
        totalDebts = await db.debt.count();
        totalPaylaters = await db.paylater.count();
        totalSubscriptions = await db.appSubscription.count();
      } catch (err) {
        const { code, userReason } = classifyDatabaseError(err);
        lastErrorReason = userReason;
        console.error(`Failed to load financial account/budget statistics (code: ${code}):`, sanitizeLogMessage(err));
        unavailableMetrics.financials = true;
      }
    }

    // Domain 5: 30-day user growth
    const userGrowthMap: Record<string, number> = {};
    try {
      const recentUsers = await db.profile.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
        take: 1000,
      });

      recentUsers.forEach((user) => {
        const dateKey = user.createdAt.toISOString().split('T')[0];
        userGrowthMap[dateKey] = (userGrowthMap[dateKey] || 0) + 1;
      });
    } catch (err) {
      const { code, userReason } = classifyDatabaseError(err);
      lastErrorReason = userReason;
      console.error(`Failed to load user growth statistics (code: ${code}):`, sanitizeLogMessage(err));
      unavailableMetrics.userGrowth = true;
    }

    const failedDomains: string[] = [];
    if (unavailableMetrics.revenue) failedDomains.push('pendapatan & pembayaran');
    if (unavailableMetrics.users) failedDomains.push('pengguna');
    if (unavailableMetrics.transactions) failedDomains.push('transaksi');
    if (unavailableMetrics.financials) failedDomains.push('akun finansial');
    if (unavailableMetrics.userGrowth) failedDomains.push('grafik pertumbuhan');

    const allFailed = Boolean(
      unavailableMetrics.revenue &&
      unavailableMetrics.users &&
      unavailableMetrics.transactions &&
      unavailableMetrics.financials
    );

    const primaryReason = lastErrorReason || 'kendala database sementara';

    if (failedDomains.length > 0) {
      statsError = allFailed
        ? `Sebagian data statistik platform sementara tidak dapat dimuat karena ${primaryReason}.`
        : `Sebagian data statistik (${failedDomains.join(', ')}) sementara tidak dapat dimuat karena ${primaryReason}.`;
    }

    platformStats = {
      totalUsers,
      proUsers,
      trialUsers,
      adminUsers,
      totalTransactions,
      totalBalances,
      totalBudgets,
      totalSavingGoals,
      totalDebts,
      totalPaylaters,
      totalSubscriptions,
      totalRevenue,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      userGrowth: Object.entries(userGrowthMap).map(([date, count]) => ({ date, count })),
      isUnavailable: allFailed,
      unavailableMetrics: Object.keys(unavailableMetrics).length > 0 ? unavailableMetrics : undefined,
    };
  } catch (err: unknown) {
    const { code, userReason } = classifyDatabaseError(err);
    console.error(`Noncritical platform statistics unavailable (code: ${code}):`, sanitizeLogMessage(err));
    statsError = `Sebagian data statistik platform sementara tidak dapat dimuat karena ${userReason}.`;
    platformStats = {
      totalUsers: 0,
      proUsers: 0,
      trialUsers: 0,
      adminUsers: 0,
      totalTransactions: 0,
      totalBalances: 0,
      totalBudgets: 0,
      totalSavingGoals: 0,
      totalDebts: 0,
      totalPaylaters: 0,
      totalSubscriptions: 0,
      totalRevenue: 0,
      pendingPayments: 0,
      approvedPayments: 0,
      rejectedPayments: 0,
      userGrowth: [],
      isUnavailable: true,
      unavailableMetrics: {
        users: true,
        transactions: true,
        financials: true,
        revenue: true,
        userGrowth: true,
      },
    };
  }

  const dur = Math.round((performance.now() - t0) * 10) / 10;
  if (process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'preview') {
    console.log(`[PERF:ADMIN] getAdminStats completed in ${dur}ms`);
  }

  return {
    paymentRequests,
    feedbacks,
    listedUsers,
    auditLogs,
    platformStats,
    statsError,
  };
}

function parsePositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toPricingPlanView(
  plan: {
    id: string;
    name: string;
    type: string;
    price: number;
    billingType: string | null;
    durationDays: number | null;
    isActive: boolean;
  },
  source: PricingSource,
): PricingPlanView {
  return {
    id: plan.id,
    name: plan.name,
    type: plan.type === 'trial' ? 'trial' : 'pro',
    price: plan.price,
    billingType: plan.billingType,
    durationDays: plan.durationDays,
    isActive: plan.isActive,
    source,
  };
}

export async function getPricingPlans(db: Db = prisma) {
  let plans: Awaited<ReturnType<typeof db.plan.findMany>> = [];
  let settings: Awaited<ReturnType<typeof db.setting.findMany>> = [];

  try {
    const results = await Promise.all([
      db.plan.findMany({
        orderBy: [{ billingType: 'asc' }, { price: 'asc' }],
      }),
      db.setting.findMany({
        where: { key: { in: ['trial_days', 'monthly_price', 'yearly_price'] } },
      }),
    ]);
    plans = results[0];
    settings = results[1];
  } catch {
    // Fall back to default pricing when database is unreachable
  }
  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));

  const trialPlan = plans.find((plan) => plan.type === 'trial');
  const monthlyPlan = plans.find((plan) => plan.type !== 'trial' && plan.billingType === 'monthly');
  const yearlyPlan = plans.find((plan) => plan.type !== 'trial' && plan.billingType === 'yearly');

  const trialDays = parsePositiveInt(settingsMap.get('trial_days'), DEFAULT_TRIAL_DAYS);
  const monthlyPrice = parsePositiveNumber(settingsMap.get('monthly_price'), DEFAULT_MONTHLY_PRICE);
  const yearlyPrice = parsePositiveNumber(settingsMap.get('yearly_price'), DEFAULT_YEARLY_PRICE);

  const trial = trialPlan
    ? trialPlan.isActive
      ? toPricingPlanView(trialPlan, 'plan')
      : null
    : toPricingPlanView({
      id: settingsMap.has('trial_days') ? 'settings-trial-plan' : 'fallback-trial-plan',
      name: DEFAULT_PRICING.trial.name,
      type: DEFAULT_PRICING.trial.type,
      price: DEFAULT_PRICING.trial.price,
      billingType: null,
      durationDays: trialDays,
      isActive: true,
    }, settingsMap.has('trial_days') ? 'settings' : 'fallback');

  const monthly = monthlyPlan
    ? monthlyPlan.isActive
      ? toPricingPlanView(monthlyPlan, 'plan')
      : null
    : toPricingPlanView({
      id: settingsMap.has('monthly_price') ? 'settings-pro-monthly' : 'fallback-pro-monthly',
      name: DEFAULT_PRICING.monthly.name,
      type: DEFAULT_PRICING.monthly.type,
      price: monthlyPrice,
      billingType: DEFAULT_PRICING.monthly.billingType,
      durationDays: null,
      isActive: true,
    }, settingsMap.has('monthly_price') ? 'settings' : 'fallback');

  const yearly = yearlyPlan
    ? yearlyPlan.isActive
      ? toPricingPlanView(yearlyPlan, 'plan')
      : null
    : toPricingPlanView({
      id: settingsMap.has('yearly_price') ? 'settings-pro-yearly' : 'fallback-pro-yearly',
      name: DEFAULT_PRICING.yearly.name,
      type: DEFAULT_PRICING.yearly.type,
      price: yearlyPrice,
      billingType: DEFAULT_PRICING.yearly.billingType,
      durationDays: null,
      isActive: true,
    }, settingsMap.has('yearly_price') ? 'settings' : 'fallback');

  const all = [trial, monthly, yearly].filter((plan): plan is PricingPlanView => Boolean(plan));

  return {
    trial,
    monthly,
    yearly,
    all,
  };
}

export async function getPaymentSettings(db: Db = prisma) {
  let settings: Awaited<ReturnType<typeof db.setting.findMany>> = [];
  try {
    settings = await db.setting.findMany();
  } catch {
    // Return empty configuration when database is unreachable
  }
  const settingsMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const bcaNumber = settingsMap.get('bca_number') || '';
  const bcaHolder = settingsMap.get('bca_holder') || '';
  const bniNumber = settingsMap.get('bni_number') || '';
  const bniHolder = settingsMap.get('bni_holder') || '';
  let qrisImage = settingsMap.get('qris_image') || '';
  if (qrisImage.startsWith('qris/')) {
    try {
      const { getPublicUrl } = await import('../storage');
      qrisImage = getPublicUrl(qrisImage);
    } catch {
      // keep original if resolution fails
    }
  }

  return {
    bca_number: bcaNumber,
    bca_holder: bcaHolder,
    bca_active: bcaNumber && bcaHolder ? settingsMap.get('bca_active') || 'true' : 'false',
    bni_number: bniNumber,
    bni_holder: bniHolder,
    bni_active: bniNumber && bniHolder ? settingsMap.get('bni_active') || 'true' : 'false',
    qris_image: qrisImage,
    qris_active: qrisImage ? settingsMap.get('qris_active') || 'true' : 'false',
  };
}
