import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import AdminClient from './AdminClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
const ADMIN_PAGE_LIMIT = 200;

export default async function AdminPage() {
  let userAndProfile;
  try {
    userAndProfile = await requireUser(false);
  } catch {
    redirect('/login');
  }

  const { profile } = userAndProfile;

  if (profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // ========================================
  // 1. Payment Requests
  // ========================================
  const paymentRequests = await prisma.paymentRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: ADMIN_PAGE_LIMIT,
  });

  // ========================================
  // 2. Feedback (all)
  // ========================================
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    take: ADMIN_PAGE_LIMIT,
  });

  // ========================================
  // 3. All User Profiles
  // ========================================
  const listedUsers = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
    take: ADMIN_PAGE_LIMIT,
  });

  // ========================================
  // 4. Audit Logs (latest 100)
  // ========================================
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // ========================================
  // 5. Platform Statistics
  // ========================================
  const [
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
    approvedPaymentStats,
    pendingPayments,
    rejectedPayments,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { plan: 'pro' } }),
    prisma.profile.count({ where: { plan: 'trial' } }),
    prisma.profile.count({ where: { role: 'admin' } }),
    prisma.transaction.count({ where: { deletedAt: null } }),
    prisma.balance.count(),
    prisma.budget.count(),
    prisma.savingGoal.count(),
    prisma.debt.count(),
    prisma.paylater.count(),
    prisma.appSubscription.count(),
    prisma.paymentRequest.aggregate({
      where: { status: 'approved' },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.paymentRequest.count({ where: { status: 'pending' } }),
    prisma.paymentRequest.count({ where: { status: 'rejected' } }),
  ]);

  // Users registered per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await prisma.profile.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
    take: 1000,
  });

  // Group by date
  const userGrowthMap: Record<string, number> = {};
  recentUsers.forEach(u => {
    const dateKey = u.createdAt.toISOString().split('T')[0];
    userGrowthMap[dateKey] = (userGrowthMap[dateKey] || 0) + 1;
  });
  const userGrowth = Object.entries(userGrowthMap).map(([date, count]) => ({ date, count }));

  // ========================================
  // Serialize everything
  // ========================================
  const referencedProfileIds = Array.from(new Set([
    ...listedUsers.map((user) => user.userId),
    ...paymentRequests.map((request) => request.userId),
    ...feedbacks.map((feedback) => feedback.userId),
    ...auditLogs.flatMap((log) => log.userId ? [log.userId] : []),
  ]));
  const referencedProfiles = await prisma.profile.findMany({
    where: { userId: { in: referencedProfileIds } },
  });
  const profilesMap = new Map(referencedProfiles.map(p => [p.userId, p]));

  const serializedRequests = paymentRequests.map(req => {
    const userProfile = profilesMap.get(req.userId);
    return {
      id: req.id,
      userId: req.userId,
      plan: req.plan,
      billingType: req.billingType,
      amount: req.amount,
      paymentMethod: req.paymentMethod,
      proofPath: req.proofPath,
      status: req.status,
      adminNote: req.adminNote,
      fullName: userProfile?.fullName || 'User Norden',
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    };
  });

  const serializedUsers = listedUsers.map(u => ({
    id: u.id,
    userId: u.userId,
    fullName: u.fullName || 'Tanpa Nama',
    role: u.role,
    plan: u.plan,
    trialStartedAt: u.trialStartedAt.toISOString(),
    trialEndsAt: u.trialEndsAt.toISOString(),
    createdAt: u.createdAt.toISOString(),
  }));

  const serializedAuditLogs = auditLogs.map(log => ({
    id: log.id,
    userId: log.userId,
    userName: log.userId ? (profilesMap.get(log.userId)?.fullName || log.userId) : 'System',
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
  }));

  const serializedFeedbacks = feedbacks.map(fb => ({
    id: fb.id,
    userId: fb.userId,
    userName: profilesMap.get(fb.userId)?.fullName || 'User Norden',
    rating: fb.rating,
    message: fb.message,
    status: fb.status,
    createdAt: fb.createdAt.toISOString(),
  }));

  const platformStats = {
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
    totalRevenue: approvedPaymentStats._sum.amount || 0,
    pendingPayments,
    approvedPayments: approvedPaymentStats._count,
    rejectedPayments,
    userGrowth,
  };

  // ========================================
  // 6. Payment Settings (BCA, BNI, QRIS)
  // ========================================
  const settings = await prisma.setting.findMany();
  const settingsMap = new Map(settings.map(s => [s.key, s.value]));
  const paymentSettings = {
    bca_number: settingsMap.get('bca_number') || '',
    bca_holder: settingsMap.get('bca_holder') || '',
    bca_active: settingsMap.get('bca_active') || 'false',
    bni_number: settingsMap.get('bni_number') || '',
    bni_holder: settingsMap.get('bni_holder') || '',
    bni_active: settingsMap.get('bni_active') || 'false',
    qris_image: settingsMap.get('qris_image') || '',
    qris_active: settingsMap.get('qris_active') || 'false',
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 sm:p-6 lg:p-8">
      <AdminClient 
        initialRequests={serializedRequests} 
        initialUsers={serializedUsers}
        initialAuditLogs={serializedAuditLogs}
        initialFeedbacks={serializedFeedbacks}
        platformStats={platformStats}
        initialPaymentSettings={paymentSettings}
        currentAdminId={profile.userId}
      />
    </div>
  );
}
