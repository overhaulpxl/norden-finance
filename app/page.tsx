import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../lib/auth';
import JsonLd from '../components/JsonLd';
import LandingClient from '../components/LandingClient';
import { getPublicTestimonials } from '../lib/publicTestimonials';
import {
  LANDING_MONTHLY_PRICE,
  LANDING_TRIAL_DAYS,
  LANDING_YEARLY_PRICE,
} from '../lib/landingFallbacks';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    absolute: 'Norden Finance — Aplikasi Keuangan Pribadi',
  },
  description:
    'Kelola keuangan pribadi lebih teratur dengan Norden Finance. Catat pemasukan dan pengeluaran, atur anggaran, pantau tabungan, dan kelola keuangan harian dalam satu aplikasi.',
  alternates: {
    canonical: '/',
  },
};

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  const testimonials = await getPublicTestimonials();
  const trialDays = LANDING_TRIAL_DAYS;
  const monthlyPrice = LANDING_MONTHLY_PRICE;
  const yearlyPrice = LANDING_YEARLY_PRICE;
  const yearlySavingsPercent = Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100));

  return (
    <>
      <JsonLd />
      <LandingClient
        testimonials={testimonials}
        trialDays={trialDays}
        monthlyPrice={monthlyPrice}
        yearlyPrice={yearlyPrice}
        yearlySavingsPercent={yearlySavingsPercent}
      />
    </>
  );
}
