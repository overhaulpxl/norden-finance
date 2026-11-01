import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requireUser } from '../../lib/auth';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Onboarding Pengguna',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function OnboardingPage() {
  let session;
  try {
    session = await requireUser(false);
  } catch {
    redirect('/login');
  }

  if (session.profile.onboardingCompleted) {
    redirect('/dashboard');
  }

  return (
    <OnboardingClient
      initialName={session.profile.fullName || ''}
      email={session.user.email}
    />
  );
}
