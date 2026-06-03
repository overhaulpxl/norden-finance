import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import UpgradeClient from './UpgradeClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

  // Get current payment settings
  const settings = await prisma.setting.findMany();
  const settingsMap = new Map(settings.map(s => [s.key, s.value]));
  const bcaNumber = settingsMap.get('bca_number') || '';
  const bcaHolder = settingsMap.get('bca_holder') || '';
  const bniNumber = settingsMap.get('bni_number') || '';
  const bniHolder = settingsMap.get('bni_holder') || '';
  const qrisImage = settingsMap.get('qris_image') || '';
  const paymentSettings = {
    bca_number: bcaNumber,
    bca_holder: bcaHolder,
    bca_active: bcaNumber && bcaHolder ? settingsMap.get('bca_active') || 'true' : 'false',
    bni_number: bniNumber,
    bni_holder: bniHolder,
    bni_active: bniNumber && bniHolder ? settingsMap.get('bni_active') || 'true' : 'false',
    qris_image: qrisImage,
    qris_active: qrisImage ? settingsMap.get('qris_active') || 'true' : 'false',
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] p-4 sm:p-6 lg:p-8">
      <UpgradeClient 
        profile={profile} 
        initialRequests={serializedRequests} 
        paymentSettings={paymentSettings}
        initialPlan={initialPlan}
      />
    </div>
  );
}
