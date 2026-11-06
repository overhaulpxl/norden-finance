import type { Metadata } from 'next';
import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import UpgradeClient from './UpgradeClient';
import { redirect } from 'next/navigation';
import { getPaymentSettings, getPricingPlans } from '../../lib/data/loaders';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Upgrade Paket Pro',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  let userAndProfile;
  try {
    userAndProfile = await requireUser(false);
  } catch {
    redirect('/login');
  }

  const { profile } = userAndProfile;
  const params = await searchParams;
  const initialPlan = params.plan === 'yearly' ? 'yearly' : 'monthly';

  // Get current payment requests
  const paymentRequests = await prisma.paymentRequest.findMany({
    where: {
      userId: profile.userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert Date objects to strings for Client Component compatibility
  const serializedRequests = paymentRequests.map(req => ({
    ...req,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
  }));

  const [paymentSettings, pricingPlans] = await Promise.all([
    getPaymentSettings(),
    getPricingPlans(),
  ]);

  return (
    <div className="min-h-screen norden-canvas text-neutral-900 dark:text-neutral-100 p-4 sm:p-6 lg:p-8">
      <UpgradeClient 
        profile={profile} 
        initialRequests={serializedRequests} 
        paymentSettings={paymentSettings}
        pricingPlans={pricingPlans}
        initialPlan={initialPlan}
      />
    </div>
  );
}
