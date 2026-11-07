'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginWithGoogleAction, registerAction } from '../authActions';
import BrandLogo from '../../components/BrandLogo';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

export default function RegisterClient({ trialDays }: { trialDays: number }) {
  const { lang } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError(lang === 'en' ? 'Password must be at least 8 characters.' : 'Password minimal harus 8 karakter.');
      return;
    }

    if (!acceptedLegal) {
      setError(
        lang === 'en'
          ? 'You must agree to the Terms & Conditions and Privacy Policy.'
          : 'Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.'
      );
      return;
    }

    setLoading(true);

    const result = await registerAction(fullName, email, password);

    setLoading(false);
    if (result.success && 'requiresEmailVerification' in result && result.requiresEmailVerification) {
      setSuccess(
        lang === 'en'
          ? 'Verification email sent. Please check your inbox and log in.'
          : 'Email verifikasi sudah dikirim. Periksa email Anda, lalu lakukan login.'
      );
      const targetEmail = 'email' in result && result.email ? result.email : email;
      router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
    } else if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error || (lang === 'en' ? 'An error occurred during registration.' : 'Terjadi kesalahan saat pendaftaran.'));
    }
  }

  async function handleGoogleRegister() {
    setError(null);
    setLoading(true);

    const result = await loginWithGoogleAction();

    setLoading(false);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error || (lang === 'en' ? 'Failed to sign up with Google.' : 'Gagal mendaftar dengan Google.'));
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
            <h1 className="text-xl sm:text-2xl font-black text-black dark:text-white uppercase tracking-wider">
              {lang === 'en' ? 'Create Norden Account' : 'Buat Akun Norden'}
            </h1>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-0.5">
              {lang === 'en'
                ? `Full-feature ${trialDays}-day trial active after account setup`
                : `Trial ${trialDays} hari fitur penuh aktif setelah setup akun selesai`}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-100 dark:bg-red-950/40 border-[2px] border-black dark:border-red-600 text-red-800 dark:text-red-300 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-3.5 bg-[#bbf7d0] dark:bg-emerald-950/40 border-[2px] border-black dark:border-emerald-600 text-emerald-950 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
              {success}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full bg-white dark:bg-neutral-800 text-black dark:text-white border-[2.5px] border-black dark:border-neutral-700 py-3 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2.5 shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            {lang === 'en' ? 'Sign up with Google' : 'Daftar dengan Akun Google'}
          </button>

          <div className="flex items-center justify-center gap-3 my-5">
            <div className="flex-1 h-[1.5px] bg-neutral-300 dark:bg-neutral-700" />
            <span className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              {lang === 'en' ? 'or with email' : 'atau dengan email'}
            </span>
            <div className="flex-1 h-[1.5px] bg-neutral-300 dark:bg-neutral-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-fullname" className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Full Name' : 'Nama Lengkap'}
              </label>
              <input
                id="reg-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={lang === 'en' ? 'Your Name' : 'Nama Anda'}
                autoComplete="name"
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Email Address' : 'Alamat Email'}
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'en' ? 'name@email.com' : 'nama@email.com'}
                autoComplete="email"
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-black text-black dark:text-neutral-200 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'en' ? 'Minimum 8 characters' : 'Minimal 8 karakter'}
                autoComplete="new-password"
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
              />
            </div>

            {/* Trial Info Pill */}
            <div className="bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 p-3 rounded-none text-black dark:text-white font-bold text-xs">
              <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-neutral-800 dark:text-neutral-200 text-[11px] mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[2.5px]" />
                {lang === 'en' ? `Free ${trialDays}-Day Trial` : `Trial ${trialDays} Hari Gratis`}
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-bold">
                {lang === 'en'
                  ? `Access to all Norden Pro features is open for ${trialDays} days after first setup. No credit card required.`
                  : `Akses ke seluruh fitur Norden Pro terbuka selama ${trialDays} hari setelah setup akun pertama. Tidak membutuhkan kartu kredit.`}
              </p>
            </div>

            <label className="flex items-start gap-2.5 text-xs font-bold text-neutral-800 dark:text-neutral-300 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(event) => setAcceptedLegal(event.target.checked)}
                className="mt-0.5 h-4 w-4 border-2 border-black dark:border-neutral-600 rounded-none cursor-pointer"
              />
              <span className="leading-snug">
                {lang === 'en' ? 'I agree to the ' : 'Saya menyetujui '}
                <Link href="/legal/terms" className="underline font-black text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300">
                  {lang === 'en' ? 'Terms & Conditions' : 'Syarat & Ketentuan'}
                </Link>
                {lang === 'en' ? ' and ' : ' serta '}
                <Link href="/legal/privacy" className="underline font-black text-black dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300">
                  {lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}
                </Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !acceptedLegal}
              className="w-full mt-2 py-3.5 brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
              {loading
                ? (lang === 'en' ? 'Registering Account...' : 'Mendaftarkan Akun...')
                : (lang === 'en' ? 'Sign up & Continue Setup' : 'Daftar & Lanjut Setup')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          {lang === 'en' ? 'Already have an account?' : 'Sudah memiliki akun?'}{' '}
          <Link href="/login" className="text-black dark:text-white underline font-black hover:text-neutral-700 dark:hover:text-neutral-300">
            {lang === 'en' ? 'Log in here' : 'Masuk di sini'}
          </Link>
        </p>
      </div>
    </div>
  );
}
