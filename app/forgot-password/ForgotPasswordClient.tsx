'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPasswordAction } from '../authActions';
import BrandLogo from '../../components/BrandLogo';
import { Loader2, ArrowLeft, KeyRound, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 py-12 bg-[#F4F5F7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-[#F5D547] selection:text-black">
      {/* Background radial highlight */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            className="hover:opacity-90 transition-opacity"
            aria-label={lang === 'en' ? 'Norden Finance Home' : 'Beranda Norden Finance'}
          >
            <BrandLogo variant="horizontal" priority className="h-10 sm:h-12 w-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
          <div className="h-1.5 w-full bg-[#F5D547]" />

          <div className="p-6 sm:p-8 space-y-5">
            <div className="border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md mb-2">
                <KeyRound className="w-3 h-3" />
                {lang === 'en' ? 'Account Recovery' : 'Pemulihan Akun'}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {lang === 'en' ? 'Forgot Password' : 'Lupa Kata Sandi'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {lang === 'en'
                  ? 'Enter your registered email to receive password reset instructions.'
                  : 'Masukkan email yang terdaftar untuk menerima petunjuk atur ulang kata sandi.'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5"
                >
                  {lang === 'en' ? 'Email Address' : 'Alamat Email'}
                </label>
                <div className="relative">
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={lang === 'en' ? 'name@email.com' : 'nama@email.com'}
                    autoComplete="email"
                    className="w-full px-3.5 py-2.5 pl-10 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F5D547] focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading
                  ? (lang === 'en' ? 'Sending...' : 'Mengirim...')
                  : (lang === 'en' ? 'Send Recovery Link' : 'Kirim Tautan Pemulihan')}
              </button>
            </form>

            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {lang === 'en' ? 'Back to Login' : 'Kembali ke Halaman Masuk'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
