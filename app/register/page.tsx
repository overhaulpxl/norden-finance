import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { getTrialDays } from '../../lib/data/loaders';
import RegisterClient from './RegisterClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Daftar Akun Baru',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  const trialDays = await getTrialDays();

  return <RegisterClient trialDays={trialDays} />;
}
