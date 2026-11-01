import type { Metadata } from 'next';
import VerifiedClient from './VerifiedClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Email Terverifikasi',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthVerifiedPage() {
  return <VerifiedClient />;
}

