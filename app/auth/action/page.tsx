import type { Metadata } from 'next';
import { Suspense } from 'react';
import ActionClient from './ActionClient';
import BrandLogo from '@/components/BrandLogo';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Aksi Autentikasi | Norden Finance',
  robots: {
    index: false,
    follow: false,
  },
};

function ActionLoadingSkeleton() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden norden-canvas p-4 py-12 text-neutral-900 dark:text-neutral-100 selection:bg-[#FFE066] selection:text-black select-none">
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <BrandLogo variant="horizontal" priority className="h-12 sm:h-14 w-auto" />
        </div>
        <div className="brutal-card border-[3px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center text-black dark:text-white">
          <div className="mb-4 inline-flex border-[2.5px] border-black dark:border-neutral-700 bg-[#FFE066] text-black p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
            <Loader2 className="h-8 w-8 stroke-[3px] text-black animate-spin" />
          </div>
          <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black dark:text-white">
            Memuat Aksi...
          </h1>
          <p className="text-xs sm:text-sm font-bold leading-relaxed text-neutral-600 dark:text-neutral-400">
            Sedang membaca parameter tautan autentikasi Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ActionPage() {
  return (
    <Suspense fallback={<ActionLoadingSkeleton />}>
      <ActionClient />
    </Suspense>
  );
}
