'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, loginWithGoogleAction } from '../authActions';
import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await loginAction(email, password);

    setLoading(false);
    if (result.success) {
      router.push('/dashboard');
    } else if ('requiresEmailVerification' in result && result.requiresEmailVerification) {
      const targetEmail = 'email' in result && result.email ? result.email : email;
      router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
    } else {
      setError(result.error || 'Email atau password tidak sesuai.');
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setLoading(true);

    const result = await loginWithGoogleAction();

    setLoading(false);
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Gagal masuk dengan Google.');
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black selection:bg-black selection:text-[#FFE066] flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden select-none">

      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* Grid Pattern Background Layer */}
      <div className="absolute inset-0 bg-paper-dots pointer-events-none opacity-80 z-0" />

      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="hover:opacity-90 transition-opacity" aria-label="Beranda Norden Finance">
            <BrandLogo variant="horizontal" priority className="h-12 sm:h-14 w-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="brutal-card p-6 sm:p-8 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000]">
          <div className="border-b-[2.5px] border-black pb-3 mb-5">
            <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-wider">
              Masuk ke Norden
            </h1>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-0.5">
              Kelola dan pantau keuangan Anda secara mandiri
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-100 border-[2px] border-black text-red-800 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black border-[2.5px] border-black py-3 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2.5 shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Masuk dengan Akun Google
          </button>

          <div className="flex items-center justify-center gap-3 my-5">
            <div className="flex-1 h-[1.5px] bg-neutral-300" />
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">atau dengan email</span>
            <div className="flex-1 h-[1.5px] bg-neutral-300" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-black text-black uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-black text-black uppercase tracking-wider">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-bold text-neutral-600 hover:text-black underline">
                  Lupa password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
              {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs font-bold text-neutral-500 uppercase tracking-wide">
          Belum memiliki akun?{' '}
          <Link href="/register" className="text-black underline font-black hover:text-neutral-700">
            Daftar Akun Baru
          </Link>
        </p>
      </div>
    </div>
  );
}
