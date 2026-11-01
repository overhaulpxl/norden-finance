import { Suspense } from 'react';
import type { Metadata } from 'next';
import VerifyEmailClient from './VerifyEmailClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verifikasi Email',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  return (
    <Suspense fallback={null}>
      <VerifyEmailClient initialEmail={params.email} />
    </Suspense>
  );
}

