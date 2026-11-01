import type { Metadata } from 'next';
import ForgotPasswordClient from './ForgotPasswordClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Lupa Password',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
