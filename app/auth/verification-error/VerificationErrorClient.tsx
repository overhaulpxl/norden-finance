'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, MailCheck } from 'lucide-react';
import BrandLogo from '../../../components/BrandLogo';
import { useLanguage } from '../../../lib/i18n';

export default function VerificationErrorClient() {
  const { lang } = useLanguage();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden norden-canvas p-4 text-neutral-900 dark:text-neutral-100 selection:bg-[#FFE066] selection:text-black select-none">
      <main className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Link
            href="/"
            className="hover:opacity-90 transition-opacity"
            aria-label={lang === 'en' ? 'Norden Finance Home' : 'Beranda Norden Finance'}
          >
            <BrandLogo variant="horizontal" priority className="h-12 sm:h-14 w-auto" />
          </Link>
        </div>

        <section className="brutal-card border-[3px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="mb-4 inline-flex border-[2.5px] border-black dark:border-neutral-700 bg-red-100 dark:bg-red-950/40 p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle className="h-8 w-8 stroke-[3px] text-red-700 dark:text-red-400" />
          </div>

          <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'en' ? 'Invalid or Expired Link' : 'Tautan Tidak Valid atau Kadaluarsa'}
          </h1>
          <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600 dark:text-neutral-400">
            {lang === 'en'
              ? 'This email verification link is no longer valid. Please request a new verification link to proceed.'
              : 'Tautan verifikasi email ini sudah tidak berlaku. Silakan minta tautan verifikasi baru untuk melanjutkan.'}
          </p>

          <div className="space-y-3">
            <Link
              href="/verify-email"
              className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black dark:border-neutral-700 bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <MailCheck className="w-4 h-4" />{' '}
              {lang === 'en' ? 'Resend Verification Email' : 'Kirim Ulang Email Verifikasi'}
            </Link>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center gap-1.5 border-[2.5px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 py-3 text-center text-xs font-black uppercase tracking-wider text-black dark:text-white shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3px]" />{' '}
              {lang === 'en' ? 'Back to Login' : 'Kembali ke Login'}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
