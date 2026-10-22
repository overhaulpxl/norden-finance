'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { MailCheck, RefreshCw } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { auth } from '../../lib/firebase';

const COOLDOWN_SECONDS = 60;

export default function VerifyEmailClient({ initialEmail }: { initialEmail?: string }) {
  const [email, setEmail] = useState(() => initialEmail || auth.currentUser?.email || '');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Email verifikasi telah dikirimkan. Silakan periksa kotak masuk atau spam.');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) return;
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.email) {
        setEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const buttonLabel = useMemo(() => {
    if (loading) return 'Mengirimkan...';
    if (cooldown > 0) return `Kirim ulang dalam ${cooldown} detik`;
    return 'Kirim Ulang Email Verifikasi';
  }, [cooldown, loading]);

  async function resendVerificationEmail() {
    setError(null);
    setMessage('');
    const user = auth.currentUser;
    if (!user) {
      setError('Sesi berakhir. Silakan login kembali untuk meminta email verifikasi baru.');
      return;
    }

    setLoading(true);
    try {
      const provider = process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_PROVIDER || 'firebase';

      if (provider === 'resend') {
        const idToken = await user.getIdToken(true);
        const response = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (response.status === 400 && data.code === 'USE_CLIENT_VERIFICATION') {
            const { sendEmailVerification } = await import('firebase/auth');
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            await sendEmailVerification(user, {
              url: `${appUrl.replace(/\/$/, '')}/auth/verified`
            });
          } else {
            setError(data.message || data.error || 'Gagal mengirim email verifikasi. Silakan coba lagi.');
            if (response.status === 429 || data.code === 'RATE_LIMITED' || data.code === 'TOO_MANY_ATTEMPTS' || data.code === 'TOO_MANY_REQUESTS') {
              setCooldown(COOLDOWN_SECONDS);
            }
            return;
          }
        }
      } else {
        const { sendEmailVerification } = await import('firebase/auth');
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        await sendEmailVerification(user, {
          url: `${appUrl.replace(/\/$/, '')}/auth/verified`
        });
      }

      setMessage('Email verifikasi baru berhasil dikirim. Periksa inbox atau spam Anda.');
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: unknown) {
      console.error(err);
      const errMessage = err instanceof Error ? err.message : '';
      if (errMessage.includes('auth/too-many-requests')) {
        setError('Terlalu banyak permintaan. Silakan tunggu beberapa menit sebelum mencoba lagi.');
        setCooldown(COOLDOWN_SECONDS);
      } else {
        setError('Gagal mengirimkan email verifikasi. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF9F5] p-4 py-12 text-black selection:bg-black selection:text-[#FFE066] select-none">
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

        <section className="brutal-card border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#FFE066] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
            <MailCheck className="h-6 w-6 stroke-[3px]" />
          </div>

          <h1 className="mb-1 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
            Periksa Email Anda
          </h1>
          <p className="mb-5 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
            Tautan verifikasi telah dikirimkan ke alamat email akun Anda. Klik tautan pada email tersebut untuk mengaktifkan akun.
          </p>

          <div className="mb-5 border-[2px] border-black bg-[#FAF9F5] p-3.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Alamat Email Terdaftar</p>
            <p className="mt-1 break-all text-xs sm:text-sm font-black text-black">{email || 'Email akun Anda'}</p>
          </div>

          {message && (
            <div className="mb-4 border-[2px] border-black bg-[#bbf7d0] p-3 text-xs font-bold text-emerald-950 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 border-[2px] border-black bg-red-100 p-3 text-xs font-bold text-red-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={resendVerificationEmail}
              disabled={loading || cooldown > 0}
              className="flex w-full items-center justify-center gap-2 border-[2.5px] border-black bg-[#FFE066] py-3 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 stroke-[3px] ${loading ? 'animate-spin' : ''}`} />
              {buttonLabel}
            </button>

            <Link
              href="/login"
              className="block w-full border-[2.5px] border-black bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
