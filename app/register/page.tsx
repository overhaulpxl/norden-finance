import type { Metadata } from 'next';
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
  const trialDays = await getTrialDays();

  return <RegisterClient trialDays={trialDays} />;
}
