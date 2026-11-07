'use client';

import Link from 'next/link';
import { Compass, ArrowLeft, Home } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useLanguage } from '../lib/i18n';

export default function NotFound() {
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
          <div className="mb-4 inline-flex border-[2.5px] border-black dark:border-neutral-700 bg-[#FFE066] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] text-black">
            <Compass className="h-8 w-8 stroke-[3px]" />
          </div>

          <div className="mb-2 inline-block px-2.5 py-0.5 border border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest text-black dark:text-white">
            404 • {lang === 'en' ? 'Not Found' : 'Tidak Ditemukan'}
          </div>

          <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'en' ? 'Page Not Found' : 'Halaman Tidak Ditemukan'}
          </h1>
          <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600 dark:text-neutral-400">
            {lang === 'en'
              ? 'The page you are looking for does not exist or has been moved.'
              : 'Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.'}
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black dark:border-neutral-700 bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <Home className="w-4 h-4 stroke-[2.5px]" />
              {lang === 'en' ? 'Go to Dashboard' : 'Kembali ke Dashboard'}
            </Link>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-1.5 border-[2.5px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 py-3 text-center text-xs font-black uppercase tracking-wider text-black dark:text-white shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3px]" />
              {lang === 'en' ? 'Back to Home' : 'Kembali ke Beranda'}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
