import type { Metadata } from 'next';
import VerificationErrorClient from './VerificationErrorClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kesalahan Verifikasi Email',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerificationErrorPage() {
  return <VerificationErrorClient />;
}
