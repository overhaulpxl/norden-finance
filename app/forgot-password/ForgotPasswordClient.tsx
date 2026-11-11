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
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 py-12 bg-[#FAF9F5] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-[#FFE066] selection:text-black">
      {/* Background radial highlight */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#d4d4d8_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#26262b_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70" />

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
        <div className="bg-white dark:bg-neutral-900 rounded-none border-[3px] border-black dark:border-neutral-700 overflow-hidden shadow-[6px_6px_0px_0px_#000]">
          <div className="h-2 w-full bg-[#FFE066] border-b-2 border-black" />

          <div className="p-6 sm:p-8 space-y-5">
            <div className="border-b-2 border-black/10 dark:border-neutral-800 pb-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-black uppercase tracking-wider bg-[#FFE066] border border-black px-2.5 py-1 rounded-none shadow-[1.5px_1.5px_0px_0px_#000] mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                {lang === 'en' ? 'Account Recovery' : 'Pemulihan Akun'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100">
                {lang === 'en' ? 'Forgot Password' : 'Lupa Kata Sandi'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed uppercase">
                {lang === 'en'
                  ? 'Enter your registered email to receive password reset instructions.'
                  : 'Masukkan email yang terdaftar untuk menerima petunjuk atur ulang kata sandi.'}
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-none bg-red-100 dark:bg-red-950/80 border-2 border-black text-red-900 dark:text-red-200 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="p-3.5 rounded-none bg-[#bbf7d0] dark:bg-emerald-950/80 border-2 border-black text-black dark:text-emerald-200 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5"
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
                    className="w-full px-3.5 py-2.5 pl-10 text-xs font-bold rounded-none bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 shadow-[2px_2px_0px_0px_#000] focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5px]" />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-none font-black text-xs uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />}
                {loading
                  ? (lang === 'en' ? 'Sending...' : 'Mengirim...')
                  : (lang === 'en' ? 'Send Recovery Link' : 'Kirim Tautan Pemulihan')}
              </button>
            </form>

            <div className="border-t-2 border-black/10 dark:border-neutral-800 pt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5px]" />
                {lang === 'en' ? 'Back to Login' : 'Kembali ke Halaman Masuk'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
