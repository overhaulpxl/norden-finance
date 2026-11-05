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
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  MailCheck,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Home,
  LogIn,
} from 'lucide-react';

import { getSafeContinueUrl, mapFirebaseAuthError } from '@/lib/authActionUtils';
export { getSafeContinueUrl, mapFirebaseAuthError };

export default function ActionClient() {
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
          setVerifyError(mapFirebaseAuthError(err, 'Gagal memverifikasi alamat email Anda.'));
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
              'Tautan atur ulang kata sandi tidak valid atau telah kadaluarsa.'
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
            mapFirebaseAuthError(err, 'Gagal memulihkan alamat email asli akun Anda.')
          );
        });
    }
  }, [mode, oobCode]);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oobCode || resetStep === 'submitting') return;

    setFormError('');

    if (newPassword.length < 8) {
      setFormError('Kata sandi baru minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setResetStep('submitting');
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetStep('success');
    } catch (err) {
      setResetStep('ready');
      setFormError(
        mapFirebaseAuthError(err, 'Gagal memperbarui kata sandi. Silakan coba lagi.')
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
          : 'https://www.nordenfinance.site';
      await sendPasswordResetEmail(auth, restoredEmail, {
        url: `${origin}/auth/action`,
        handleCodeInApp: false,
      });
      setPasswordResetSent(true);
    } catch (err) {
      setRecoverError(
        mapFirebaseAuthError(err, 'Gagal mengirim email reset kata sandi.')
      );
    } finally {
      setSendingReset(false);
    }
  }

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

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: Missing or Unknown Mode                                 */}
        {/* ------------------------------------------------------------- */}
        {(!mode || !oobCode || !['verifyEmail', 'resetPassword', 'recoverEmail'].includes(mode)) && (
          <section className="brutal-card border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="mb-4 inline-flex border-[2.5px] border-black bg-red-100 p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
              <AlertTriangle className="h-8 w-8 stroke-[3px] text-red-700" />
            </div>

            <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
              {!mode || !oobCode ? 'Tautan Tidak Lengkap' : 'Aksi Tidak Dikenal'}
            </h1>
            <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
              {!mode || !oobCode
                ? 'Tautan autentikasi ini tidak memiliki parameter aksi yang valid. Pastikan Anda membuka tautan lengkap dari email Anda.'
                : `Aksi autentikasi "${mode}" tidak didukung oleh sistem.`}
            </p>

            <div className="space-y-3">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <LogIn className="w-4 h-4" /> Masuk ke Akun
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 hover:translate-x-[1px] hover:translate-y-[1px]"
              >
                <Home className="w-4 h-4" /> Ke Beranda
              </Link>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: Mode = verifyEmail                                      */}
        {/* ------------------------------------------------------------- */}
        {mode === 'verifyEmail' && oobCode && (
          <section className="brutal-card border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
            {verifyStatus === 'verifying' && (
              <>
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#FFE066] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <Loader2 className="h-8 w-8 stroke-[3px] text-black animate-spin" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Memverifikasi Email...
                </h1>
                <p className="text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  Mohon tunggu sebentar, kami sedang memvalidasi akun Anda.
                </p>
              </>
            )}

            {verifyStatus === 'success' && (
              <>
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#bbf7d0] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 className="h-8 w-8 stroke-[3px] text-emerald-950" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Email Berhasil Diverifikasi
                </h1>
                <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  Alamat email akun Norden Finance Anda telah terverifikasi. Seluruh fitur pencatatan dan pengelolaan keuangan siap digunakan.
                </p>
                <div className="space-y-3">
                  <Link
                    href={safeContinueUrl}
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    Lanjutkan ke Aplikasi <ArrowRight className="h-4 w-4 stroke-[3px]" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <LogIn className="w-4 h-4" /> Halaman Masuk
                  </Link>
                </div>
              </>
            )}

            {verifyStatus === 'error' && (
              <>
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-red-100 p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="h-8 w-8 stroke-[3px] text-red-700" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Verifikasi Gagal
                </h1>
                <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  {verifyError || 'Tautan verifikasi email tidak valid atau telah kadaluarsa.'}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/verify-email"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <MailCheck className="w-4 h-4" /> Kirim Ulang Email Verifikasi
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <LogIn className="w-4 h-4" /> Kembali ke Halaman Masuk
                  </Link>
                </div>
              </>
            )}
          </section>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 3: Mode = resetPassword                                    */}
        {/* ------------------------------------------------------------- */}
        {mode === 'resetPassword' && oobCode && (
          <section className="brutal-card border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            {resetStep === 'verifying_code' && (
              <div className="text-center">
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#FFE066] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <Loader2 className="h-8 w-8 stroke-[3px] text-black animate-spin" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Memvalidasi Tautan...
                </h1>
                <p className="text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  Sedang memeriksa kode pemulihan kata sandi Anda.
                </p>
              </div>
            )}

            {(resetStep === 'ready' || resetStep === 'submitting') && (
              <div>
                <div className="border-b-[2.5px] border-black pb-3 mb-5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-black bg-[#FFE066] text-[10px] font-black uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000] mb-2">
                    <KeyRound className="w-3.5 h-3.5" /> Pemulihan Akun
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-wider">
                    Atur Ulang Kata Sandi
                  </h1>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-0.5">
                    {accountEmail ? `Untuk akun: ${accountEmail}` : 'Masukkan kata sandi baru untuk akun Anda'}
                  </p>
                </div>

                {formError && (
                  <div className="mb-5 p-3.5 bg-red-100 border-[2px] border-black text-red-800 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label
                      htmlFor="action-new-password"
                      className="block text-xs font-black text-black uppercase tracking-wider mb-1.5"
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="action-new-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        autoComplete="new-password"
                        className="w-full brutal-input px-3 py-2.5 pr-10 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-black cursor-pointer"
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="action-confirm-password"
                      className="block text-xs font-black text-black uppercase tracking-wider mb-1.5"
                    >
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      id="action-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      autoComplete="new-password"
                      className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetStep === 'submitting'}
                    className="w-full bg-[#FFE066] text-black border-[2.5px] border-black py-3 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2 shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[2.5px] active:translate-y-[2.5px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {resetStep === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      'Simpan Kata Sandi Baru'
                    )}
                  </button>
                </form>
              </div>
            )}

            {resetStep === 'success' && (
              <div className="text-center">
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#bbf7d0] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <CheckCircle2 className="h-8 w-8 stroke-[3px] text-emerald-950" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Kata Sandi Diperbarui
                </h1>
                <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  Kata sandi baru Anda telah aktif. Silakan masuk menggunakan kredensial baru Anda.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <LogIn className="w-4 h-4" /> Masuk ke Akun
                  </Link>
                </div>
              </div>
            )}

            {resetStep === 'error' && (
              <div className="text-center">
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-red-100 p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="h-8 w-8 stroke-[3px] text-red-700" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Tautan Reset Tidak Valid
                </h1>
                <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  {resetError || 'Tautan atur ulang kata sandi ini tidak valid atau telah kadaluarsa.'}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/forgot-password"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <KeyRound className="w-4 h-4" /> Minta Tautan Baru
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <LogIn className="w-4 h-4" /> Kembali ke Halaman Masuk
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
          <section className="brutal-card border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center">
            {recoverStatus === 'recovering' && (
              <>
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#FFE066] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <Loader2 className="h-8 w-8 stroke-[3px] text-black animate-spin" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Memulihkan Alamat Email...
                </h1>
                <p className="text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  Sedang mengembalikan alamat email asli akun Anda.
                </p>
              </>
            )}

            {recoverStatus === 'success' && (
              <>
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-[#bfdbfe] p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck className="h-8 w-8 stroke-[3px] text-black" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Email Asli Dipulihkan
                </h1>
                <p className="mb-4 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  Alamat email akun Norden Finance Anda telah berhasil dikembalikan ke:{' '}
                  <span className="text-black font-black underline">{restoredEmail || 'email awal'}</span>.
                </p>

                <div className="mb-6 border-[2px] border-black bg-amber-50 p-3.5 text-left shadow-[2px_2px_0px_0px_#000]">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pemberitahuan Keamanan
                  </p>
                  <p className="text-xs font-bold text-amber-950 leading-relaxed">
                    Jika Anda tidak pernah meminta perubahan email sebelumnya, akun Anda kemungkinan diakses pihak lain. Sangat disarankan untuk segera mereset kata sandi Anda.
                  </p>
                </div>

                {passwordResetSent ? (
                  <div className="mb-5 p-3.5 bg-[#bbf7d0] border-[2px] border-black text-emerald-950 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                    Tautan atur ulang kata sandi telah dikirimkan ke email Anda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleSendResetPassword}
                      disabled={sendingReset}
                      className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px] cursor-pointer disabled:opacity-50"
                    >
                      {sendingReset ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" /> Reset Kata Sandi Sekarang
                        </>
                      )}
                    </button>
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                      <LogIn className="w-4 h-4" /> Masuk ke Akun
                    </Link>
                  </div>
                )}
              </>
            )}

            {recoverStatus === 'error' && (
              <>
                <div className="mb-4 inline-flex border-[2.5px] border-black bg-red-100 p-3 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
                  <AlertTriangle className="h-8 w-8 stroke-[3px] text-red-700" />
                </div>
                <h1 className="mb-2 text-xl sm:text-2xl font-black uppercase tracking-wider text-black">
                  Pemulihan Email Gagal
                </h1>
                <p className="mb-6 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600">
                  {recoverError || 'Tautan pemulihan email ini tidak valid atau telah kadaluarsa.'}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-[#FFE066] py-3.5 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-yellow-300 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <LogIn className="w-4 h-4" /> Halaman Masuk
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 w-full border-[2.5px] border-black bg-white py-3 text-center text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:bg-neutral-50 hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <Home className="w-4 h-4" /> Kembali ke Beranda
                  </Link>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
