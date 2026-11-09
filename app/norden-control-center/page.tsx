import type { Metadata } from 'next';
import { requireUser } from '../../lib/auth';
import AdminClient from './AdminClient';
import { redirect } from 'next/navigation';
import { getAdminStats, getPaymentSettings, getPricingPlans } from '../../lib/data/loaders';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Control Center Admin',
  robots: {
    index: false,
    follow: false,
  },
};

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

  let adminStatsData: Awaited<ReturnType<typeof getAdminStats>>;
  let adminDataError: string | undefined;

  try {
    adminStatsData = await getAdminStats();
    if (adminStatsData.statsError) {
      adminDataError = adminStatsData.statsError;
    }
  } catch (err: unknown) {
    console.error('Control center data load failed:', err);
    adminDataError = 'Data Control Center sedang tidak dapat dimuat dari database. Silakan muat ulang halaman.';
    adminStatsData = {
      paymentRequests: [],
      feedbacks: [],
      listedUsers: [],
      auditLogs: [],
      platformStats: {
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
      },
      statsError: adminDataError,
    };
  }

  const {
    paymentRequests,
    feedbacks,
    listedUsers,
    auditLogs,
    platformStats,
  } = adminStatsData;

  // ========================================
  // Serialize everything
  // ========================================
  const referencedProfileIds = Array.from(new Set([
    ...listedUsers.map((user) => user.userId),
    ...paymentRequests.map((request) => request.userId),
    ...feedbacks.map((feedback) => feedback.userId),
    ...auditLogs.flatMap((log) => log.userId ? [log.userId] : []),
  ]));
  const { prisma } = await import('../../lib/prisma');
  const referencedProfiles = await prisma.profile.findMany({ where: { userId: { in: referencedProfileIds } } });
  const profilesMap = new Map(referencedProfiles.map(p => [p.userId, p]));

  const { getSignedUrl } = await import('../../lib/storage');
  const serializedRequests = await Promise.all(paymentRequests.map(async req => {
    const userProfile = profilesMap.get(req.userId);
    let viewProof = req.proofPath;
    if (req.proofPath && req.proofPath.startsWith('payment-proofs/')) {
      try {
        viewProof = await getSignedUrl(req.proofPath, 60);
      } catch (err) {
        console.error('Failed to resolve signed URL for proof:', err);
      }
    }
    return {
      id: req.id,
      userId: req.userId,
      plan: req.plan,
      billingType: req.billingType,
      amount: req.amount,
      paymentMethod: req.paymentMethod,
      proofPath: viewProof,
      status: req.status,
      adminNote: req.adminNote,
      fullName: userProfile?.fullName || 'Tanpa Nama',
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
    };
  }));

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
    userName: profilesMap.get(fb.userId)?.fullName || 'Tanpa Nama',
    rating: fb.rating,
    message: fb.message,
    status: fb.status,
    createdAt: fb.createdAt.toISOString(),
  }));

  const [paymentSettings, pricingPlans] = await Promise.all([
    getPaymentSettings(),
    getPricingPlans(),
  ]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-black p-4 sm:p-6 lg:p-8">
      <AdminClient 
        initialRequests={serializedRequests} 
        initialUsers={serializedUsers}
        initialAuditLogs={serializedAuditLogs}
        initialFeedbacks={serializedFeedbacks}
        platformStats={platformStats}
        initialPaymentSettings={paymentSettings}
        initialPricingPlans={pricingPlans}
        currentAdminId={profile.userId}
        initialError={adminDataError}
      />
    </div>
  );
}
