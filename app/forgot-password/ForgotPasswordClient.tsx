'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '../authActions';
import BrandLogo from '../../components/BrandLogo';
import { Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

export default function ForgotPasswordClient() {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const result = await forgotPasswordAction(email);
    setLoading(false);

    if (result.success) {
      setMessage(
        lang === 'en'
          ? 'Password reset instructions have been sent to your email if registered.'
          : 'Instruksi pemulihan kata sandi telah dikirimkan ke email Anda jika terdaftar.'
      );
    } else {
      setError(
        result.error ||
          (lang === 'en'
            ? 'Failed to send recovery email. Please try again.'
            : 'Gagal mengirimkan email pemulihan. Silakan coba lagi.')
      );
    }
  }

  return (
    <div className="min-h-screen norden-canvas text-neutral-900 dark:text-neutral-100 selection:bg-[#FFE066] selection:text-black flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden select-none">

      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" className="hover:opacity-90 transition-opacity" aria-label={lang === 'en' ? 'Norden Finance Home' : 'Beranda Norden Finance'}>
            <BrandLogo variant="horizontal" priority className="h-12 sm:h-14 w-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="brutal-card p-6 sm:p-8 bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000]">
          <div className="border-b-[2.5px] border-black dark:border-neutral-700 pb-3 mb-5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-black dark:border-neutral-700 bg-[#FFE066] text-black text-[10px] font-black uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000] mb-2">
              <KeyRound className="w-3.5 h-3.5" /> {lang === 'en' ? 'Account Recovery' : 'Pemulihan Akun'}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white uppercase tracking-wider">
              {lang === 'en' ? 'Forgot Password' : 'Lupa Password'}
            </h1>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-0.5">
              {lang === 'en'
                ? 'Enter your registered email to reset your password'
                : 'Masukkan email yang terdaftar untuk mengatur ulang kata sandi Anda'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-100 dark:bg-red-950/40 border-[2px] border-black dark:border-red-600 text-red-800 dark:text-red-300 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-5 p-3.5 bg-[#bbf7d0] dark:bg-emerald-950/40 border-[2px] border-black dark:border-emerald-600 text-emerald-950 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-email" className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Email Address' : 'Alamat Email'}
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full mt-2 py-3.5 brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
              {loading ? (lang === 'en' ? 'Sending...' : 'Mengirim...') : (lang === 'en' ? 'Send Recovery Link' : 'Kirim Tautan Pemulihan')}
            </button>
          </form>

          <div className="border-t-[2px] border-black dark:border-neutral-700 pt-4 mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-black text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 underline uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[3px]" /> {lang === 'en' ? 'Back to Login' : 'Kembali ke Halaman Login'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
