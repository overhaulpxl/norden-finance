'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import BrandLogo from '../../../components/BrandLogo';
import { auth } from '../../../lib/firebase';

export default function VerifiedClient() {
  const [dashboardReady, setDashboardReady] = useState(false);

  useEffect(() => {
    async function createSessionIfPossible() {
      const user = auth.currentUser;
      if (!user) return;
      await user.reload();
      if (!user.emailVerified) return;

      const idToken = await user.getIdToken(true);
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      setDashboardReady(response.ok);
    }

    createSessionIfPossible().catch(() => setDashboardReady(false));
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF9F5] p-4 text-black selection:bg-black selection:text-[#FFE066] select-none">
      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>
      <div className="bg-paper-dots pointer-events-none absolute inset-0 opacity-80" />

      <main className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Link href="/" className="hover:opacity-90 transition-opacity" aria-label="Beranda Norden Finance">
            <BrandLogo variant="horizontal" priority className="h-12 sm:h-14 w-auto" />
          </Link>
        </div>

        <section className="brutal-card border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#bbf7d0] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="h-8 w-8 stroke-[3px] text-emerald-950" />
          </div>

          <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
            Email Berhasil Diverifikasi
          </h1>
          <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
            Akun Norden Finance Anda kini sudah aktif dan siap digunakan untuk mengelola keuangan Anda.
          </p>

          <Link
            href={dashboardReady ? '/dashboard' : '/login'}
            className="inline-flex w-full items-center justify-center gap-2 border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
          >
            <span>{dashboardReady ? 'Lanjut ke Dashboard' : 'Masuk ke Akun Anda'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3px]" />
          </Link>
        </section>
      </main>
    </div>
  );
}
