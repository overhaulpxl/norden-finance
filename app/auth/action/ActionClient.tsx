'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import BrandLogo from '@/components/BrandLogo';
import {
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  LogIn,
  Mail,
  ShieldAlert,
  Lock,
} from 'lucide-react';

import { getSafeContinueUrl, mapFirebaseAuthError } from '@/lib/authActionUtils';
import { useLanguage } from '@/lib/i18n';
export { getSafeContinueUrl, mapFirebaseAuthError };

export default function ActionClient() {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const continueUrlParam = searchParams.get('continueUrl');
  const safeContinueUrl = getSafeContinueUrl(continueUrlParam);

  // Mode: verifyEmail
  const [verifyStatus, setVerifyStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [verifyError, setVerifyError] = useState<string>('');

  // Mode: resetPassword
  const [resetStep, setResetStep] = useState<
    'verifying_code' | 'ready' | 'submitting' | 'success' | 'error'
  >('verifying_code');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Mode: recoverEmail
  const [recoverStatus, setRecoverStatus] = useState<'recovering' | 'success' | 'error'>('recovering');
  const [restoredEmail, setRestoredEmail] = useState<string>('');
  const [recoverError, setRecoverError] = useState<string>('');
  const [passwordResetSent, setPasswordResetSent] = useState<boolean>(false);
  const [sendingReset, setSendingReset] = useState<boolean>(false);

  const actionExecuted = useRef(false);

  useEffect(() => {
    if (actionExecuted.current) return;
    actionExecuted.current = true;

    if (!mode || !oobCode) return;

    if (mode === 'verifyEmail') {
      applyActionCode(auth, oobCode)
        .then(async () => {
          setVerifyStatus('success');
          const user = auth.currentUser;
          if (user) {
            try {
              await user.reload();
              if (user.emailVerified) {
                const idToken = await user.getIdToken(true);
                await fetch('/api/auth/session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken }),
                });
              }
            } catch {
              // Ignore session reload error
            }
          }
        })
        .catch((err) => {
          setVerifyStatus('error');
          setVerifyError(
            mapFirebaseAuthError(
              err,
              lang === 'en' ? 'Failed to verify your email address.' : 'Gagal memverifikasi alamat email Anda.',
              lang
            )
          );
        });
    } else if (mode === 'resetPassword') {
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setAccountEmail(email);
          setResetStep('ready');
        })
        .catch((err) => {
          setResetStep('error');
          setResetError(
            mapFirebaseAuthError(
              err,
              lang === 'en'
                ? 'Password reset link is invalid or has expired.'
                : 'Tautan atur ulang kata sandi tidak valid atau telah kadaluarsa.',
              lang
            )
          );
        });
    } else if (mode === 'recoverEmail') {
      checkActionCode(auth, oobCode)
        .then(async (info) => {
          const email = info.data?.email || '';
          await applyActionCode(auth, oobCode);
          setRestoredEmail(email);
          setRecoverStatus('success');
        })
        .catch((err) => {
          setRecoverStatus('error');
          setRecoverError(
            mapFirebaseAuthError(
              err,
              lang === 'en'
                ? 'Failed to restore your original account email address.'
                : 'Gagal memulihkan alamat email asli akun Anda.',
              lang
            )
          );
        });
    }
  }, [mode, oobCode, lang]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oobCode || resetStep === 'submitting') return;

    setFormError('');

    if (newPassword.length < 8) {
      setFormError(
        lang === 'en'
          ? 'New password must be at least 8 characters.'
          : 'Kata sandi baru minimal 8 karakter.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError(
        lang === 'en'
          ? 'Password confirmation does not match.'
          : 'Konfirmasi kata sandi tidak cocok.'
      );
      return;
    }

    setResetStep('submitting');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetStep('success');
    } catch (err) {
      setResetStep('ready');
      setFormError(
        mapFirebaseAuthError(
          err,
          lang === 'en'
            ? 'Failed to update password. Please try again.'
            : 'Gagal memperbarui kata sandi. Silakan coba lagi.',
          lang
        )
      );
    }
  }

  async function handleSendResetPassword() {
    if (!restoredEmail || sendingReset) return;
    setSendingReset(true);
    try {
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://nordenfinance.site';
      await sendPasswordResetEmail(auth, restoredEmail, {
        url: `${origin}/auth/action`,
        handleCodeInApp: false,
      });
      setPasswordResetSent(true);
    } catch (err) {
      setRecoverError(
        mapFirebaseAuthError(
          err,
          lang === 'en'
            ? 'Failed to send password reset email.'
            : 'Gagal mengirim email reset kata sandi.',
          lang
        )
      );
    } finally {
      setSendingReset(false);
    }
  }

  const isPasswordValid = newPassword.length >= 8;
  const isPasswordMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 py-12 bg-[#F4F5F7] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 selection:bg-[#F5D547] selection:text-black">
      {/* Background radial highlight */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

      <main className="relative z-10 w-full max-w-md space-y-6">
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

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: Missing or Unknown Mode                                 */}
        {/* ------------------------------------------------------------- */}
        {(!mode || !oobCode || !['verifyEmail', 'resetPassword', 'recoverEmail'].includes(mode)) && (
          <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="h-1.5 w-full bg-[#F5D547]" />
            <div className="p-6 sm:p-8 text-center space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                <AlertCircle className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {!mode || !oobCode
                    ? (lang === 'en' ? 'Incomplete Action Link' : 'Tautan Tidak Lengkap')
                    : (lang === 'en' ? 'Unknown Action' : 'Aksi Tidak Dikenal')}
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {!mode || !oobCode
                    ? (lang === 'en'
                        ? 'This authentication link is missing required parameters. Please make sure you clicked the full link from your email.'
                        : 'Tautan autentikasi ini tidak memiliki parameter aksi yang valid. Pastikan Anda membuka tautan lengkap dari email Anda.')
                    : (lang === 'en'
                        ? `Authentication action "${mode}" is not supported.`
                        : `Aksi autentikasi "${mode}" tidak didukung oleh sistem.`)}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" /> {lang === 'en' ? 'Sign in to Account' : 'Masuk ke Akun'}
                </Link>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <Home className="w-4 h-4" /> {lang === 'en' ? 'Go to Home' : 'Ke Beranda'}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: Mode = verifyEmail                                      */}
        {/* ------------------------------------------------------------- */}
        {mode === 'verifyEmail' && oobCode && (
          <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="h-1.5 w-full bg-[#F5D547]" />
            <div className="p-6 sm:p-8 text-center space-y-4">
              {verifyStatus === 'verifying' && (
                <>
                  <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {lang === 'en' ? 'Verifying Email...' : 'Memverifikasi Email...'}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {lang === 'en'
                        ? 'Please wait a moment while we validate your account.'
                        : 'Mohon tunggu sebentar, kami sedang memvalidasi akun Anda.'}
                    </p>
                  </div>
                </>
              )}

              {verifyStatus === 'success' && (
                <>
                  <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {lang === 'en' ? 'Email Verified Successfully' : 'Email Berhasil Diverifikasi'}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {lang === 'en'
                        ? 'Your Norden Finance account is now active. You can now track your money with clarity.'
                        : 'Akun Norden Finance Anda telah terverifikasi. Seluruh fitur pencatatan dan pengelolaan keuangan siap digunakan.'}
                    </p>
                  </div>
                  <div className="space-y-2.5 pt-3">
                    <Link
                      href={safeContinueUrl}
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
                    >
                      {lang === 'en' ? 'Continue to App' : 'Lanjutkan ke Aplikasi'} <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    >
                      <LogIn className="w-4 h-4" /> {lang === 'en' ? 'Sign in to Account' : 'Halaman Masuk'}
                    </Link>
                  </div>
                </>
              )}

              {verifyStatus === 'error' && (
                <>
                  <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {lang === 'en' ? 'Verification Failed' : 'Verifikasi Gagal'}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {verifyError || (lang === 'en' ? 'Email verification link is invalid or has expired.' : 'Tautan verifikasi email tidak valid atau telah kadaluarsa.')}
                    </p>
                  </div>
                  <div className="space-y-2.5 pt-3">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
                    >
                      <LogIn className="w-4 h-4" /> {lang === 'en' ? 'Back to Login' : 'Kembali ke Halaman Masuk'}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 3: Mode = resetPassword                                    */}
        {/* ------------------------------------------------------------- */}
        {mode === 'resetPassword' && oobCode && (
          <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="h-1.5 w-full bg-[#F5D547]" />

            {resetStep === 'verifying_code' && (
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {lang === 'en' ? 'Validating Link...' : 'Memvalidasi Tautan...'}
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {lang === 'en'
                      ? 'Checking your password recovery code.'
                      : 'Sedang memeriksa kode pemulihan kata sandi Anda.'}
                  </p>
                </div>
              </div>
            )}

            {(resetStep === 'ready' || resetStep === 'submitting') && (
              <div className="p-6 sm:p-8 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md mb-2">
                      <Lock className="w-3 h-3" />
                      {lang === 'en' ? 'Account Security' : 'Keamanan Akun'}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {lang === 'en' ? 'Reset Password' : 'Atur Ulang Kata Sandi'}
                    </h1>
                  </div>
                </div>

                {/* Account info pill */}
                {accountEmail && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300">
                    <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>
                      {lang === 'en' ? 'Account:' : 'Untuk akun:'}{' '}
                      <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">{accountEmail}</strong>
                    </span>
                  </div>
                )}

                {/* Form Error alert */}
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="action-new-password"
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5"
                    >
                      {lang === 'en' ? 'New Password' : 'Kata Sandi Baru'}
                    </label>
                    <div className="relative">
                      <input
                        id="action-new-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={lang === 'en' ? 'Minimum 8 characters' : 'Minimal 8 karakter'}
                        autoComplete="new-password"
                        className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F5D547] focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="action-confirm-password"
                      className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5"
                    >
                      {lang === 'en' ? 'Confirm New Password' : 'Konfirmasi Kata Sandi Baru'}
                    </label>
                    <input
                      id="action-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={lang === 'en' ? 'Retype new password' : 'Ketik ulang kata sandi baru'}
                      autoComplete="new-password"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F5D547] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Helper checklist */}
                  <div className="space-y-1 pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isPasswordValid ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-700'}`} />
                      <span>{lang === 'en' ? 'At least 8 characters' : 'Minimal 8 karakter'}</span>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isPasswordMatch ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span>{isPasswordMatch ? (lang === 'en' ? 'Passwords match' : 'Kata sandi cocok') : (lang === 'en' ? 'Passwords do not match' : 'Kata sandi belum cocok')}</span>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={resetStep === 'submitting' || !isPasswordValid || !isPasswordMatch}
                    className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resetStep === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> {lang === 'en' ? 'Saving...' : 'Menyimpan...'}
                      </>
                    ) : (
                      lang === 'en' ? 'Save New Password' : 'Simpan Kata Sandi Baru'
                    )}
                  </button>
                </form>
              </div>
            )}

            {resetStep === 'success' && (
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {lang === 'en' ? 'Password Updated Successfully' : 'Kata Sandi Berhasil Diperbarui'}
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {lang === 'en'
                      ? 'Your new password is now active. Please sign in using your new credentials.'
                      : 'Kata sandi baru Anda telah aktif. Silakan masuk menggunakan kata sandi baru Anda.'}
                  </p>
                </div>
                <div className="space-y-2.5 pt-3">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
                  >
                    <LogIn className="w-4 h-4" /> {lang === 'en' ? 'Sign in to Account' : 'Masuk ke Akun Anda'}
                  </Link>
                </div>
              </div>
            )}

            {resetStep === 'error' && (
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {lang === 'en' ? 'Invalid Reset Link' : 'Tautan Reset Tidak Valid'}
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {resetError || (lang === 'en' ? 'This password reset link is invalid or has expired.' : 'Tautan atur ulang kata sandi ini tidak valid atau telah kadaluarsa.')}
                  </p>
                </div>
                <div className="space-y-2.5 pt-3">
                  <Link
                    href="/forgot-password"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
                  >
                    <KeyRound className="w-4 h-4" /> {lang === 'en' ? 'Request New Link' : 'Minta Tautan Baru'}
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <LogIn className="w-4 h-4" /> {lang === 'en' ? 'Back to Login' : 'Kembali ke Halaman Masuk'}
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 4: Mode = recoverEmail                                    */}
        {/* ------------------------------------------------------------- */}
        {mode === 'recoverEmail' && oobCode && (
          <section className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="h-1.5 w-full bg-[#F5D547]" />
            <div className="p-6 sm:p-8 text-center space-y-4">
              {recoverStatus === 'recovering' && (
                <>
                  <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                    <Loader2 className="h-7 w-7 animate-spin" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {lang === 'en' ? 'Restoring Email Address...' : 'Memulihkan Alamat Email...'}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {lang === 'en' ? 'Restoring your original account email address.' : 'Sedang mengembalikan alamat email asli akun Anda.'}
                    </p>
                  </div>
                </>
              )}

              {recoverStatus === 'success' && (
                <>
                  <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {lang === 'en' ? 'Original Email Restored' : 'Email Asli Dipulihkan'}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {lang === 'en' ? 'Your account email has been successfully restored to: ' : 'Alamat email akun Anda telah dikembalikan ke: '}{' '}
                      <strong className="text-neutral-900 dark:text-white font-semibold">{restoredEmail || (lang === 'en' ? 'original email' : 'email awal')}</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-left text-xs space-y-1">
                    <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> {lang === 'en' ? 'Security Alert' : 'Pemberitahuan Keamanan'}
                    </p>
                    <p className="text-amber-900/80 dark:text-amber-400/80 leading-relaxed">
                      {lang === 'en'
                        ? 'If you did not request this email change earlier, your account may have been compromised. We strongly recommend resetting your password immediately.'
                        : 'Jika Anda tidak pernah meminta perubahan email sebelumnya, akun Anda kemungkinan diakses pihak lain. Sangat disarankan untuk segera mereset kata sandi Anda.'}
                    </p>
                  </div>

                  {passwordResetSent ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200 text-xs font-semibold">
                      {lang === 'en' ? 'Password reset link has been sent to your email.' : 'Tautan atur ulang kata sandi telah dikirimkan ke email Anda.'}
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-2">
                      <button
                        type="button"
                        onClick={handleSendResetPassword}
                        disabled={sendingReset}
                        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {sendingReset ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> {lang === 'en' ? 'Sending...' : 'Mengirim...'}
                          </>
                        ) : (
                          <>
                            <KeyRound className="w-4 h-4" /> {lang === 'en' ? 'Reset Password Now' : 'Reset Kata Sandi Sekarang'}
                          </>
                        )}
                      </button>
                      <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                      >
                        <LogIn className="w-4 h-4" /> {lang === 'en' ? 'Sign in to Account' : 'Masuk ke Akun'}
                      </Link>
                    </div>
                  )}
                </>
              )}

              {recoverStatus === 'error' && (
                <>
                  <div className="inline-flex p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                      {lang === 'en' ? 'Email Recovery Failed' : 'Pemulihan Email Gagal'}
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {recoverError || (lang === 'en' ? 'This email recovery link is invalid or has expired.' : 'Tautan pemulihan email ini tidak valid atau telah kadaluarsa.')}
                    </p>
                  </div>
                  <div className="space-y-2.5 pt-3">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider bg-[#18181B] dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
                    >
                      <LogIn className="w-4 h-4" /> {lang === 'en' ? 'Back to Login' : 'Kembali ke Halaman Masuk'}
                    </Link>
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
