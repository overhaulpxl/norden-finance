'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrandLogo from './BrandLogo';
import {
  Lock,
  Delete,
  Fingerprint,
  LogOut,
  ShieldAlert,
  KeyRound,
  Keyboard,
  Mail,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  hashPin,
  isPinSet,
  isBiometricEnabled,
  isAppUnlocked,
  unlockApp,
  lockApp,
  removePinData,
  authenticateBiometrics,
  isDesktopDevice,
} from '../lib/appLock';
import { triggerHaptic } from '../lib/haptics';
import { auth } from '../lib/firebase';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { useLanguage } from '../lib/i18n';
import { requestPinResetAction, confirmPinResetCodeAction } from '../app/actions/user';

interface AppLockScreenProps {
  userId: string;
  userEmail?: string;
}

export default function AppLockScreen({ userId, userEmail }: AppLockScreenProps) {
  const { lang } = useLanguage();
  const [locked, setLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isPinSet(userId) && !isAppUnlocked(userId);
  });

  const [pin, setPin] = useState<string>('');
  const pinRef = useRef<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isBiometricEnabled(userId);
  });
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isDesktopDevice();
  });

  // Track window resize for responsive desktop/mobile layout switching
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(isDesktopDevice());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset PIN modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMethod, setResetMethod] = useState<'password' | 'email'>('password');
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetToken, setResetToken] = useState<string>('');
  const [resetCode, setResetCode] = useState<string>('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Emergency Sign out modal state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [clearPinOnSignOut, setClearPinOnSignOut] = useState(true);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Check URL for email auto-unlock link (?resetPinToken=...)
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('resetPinToken');
    if (tokenFromUrl) {
      (async () => {
        try {
          const res = await confirmPinResetCodeAction({ userId, token: tokenFromUrl });
          const url = new URL(window.location.href);
          url.searchParams.delete('resetPinToken');
          window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);

          if (res.success) {
            triggerHaptic('success');
            removePinData(userId);
            unlockApp(userId);
            setLocked(false);
          } else {
            triggerHaptic('warning');
            setShowResetModal(true);
            setResetError(
              res.error ||
                (lang === 'en'
                  ? 'Magic link verification failed or expired.'
                  : 'Tautan reset PIN tidak sah atau telah kedaluwarsa.')
            );
          }
        } catch {
          // ignore
        }
      })();
    }
  }, [userId, lang]);

  // Sync lock state
  useEffect(() => {
    const checkState = () => {
      const isSet = isPinSet(userId);
      const isUnlocked = isAppUnlocked(userId);
      setLocked(isSet && !isUnlocked);
      setBiometricAvailable(isBiometricEnabled(userId));
    };

    window.addEventListener('norden_lock_state_change', checkState);
    window.addEventListener('storage', checkState);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('norden_lock_state_change', checkState);
      window.removeEventListener('storage', checkState);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId]);

  const verifyPin = useCallback(
    async (candidatePin: string) => {
      if (candidatePin.length !== 4) return;
      const hashed = await hashPin(candidatePin, userId);
      const storedHash = localStorage.getItem(`norden_pin_hash_${userId}`);

      if (hashed === storedHash) {
        triggerHaptic('success');
        unlockApp(userId);
        pinRef.current = '';
        setPin('');
        setErrorMsg(null);
        setLocked(false);
      } else {
        triggerHaptic('warning');
        setErrorMsg(
          lang === 'en'
            ? 'Incorrect PIN entered.'
            : 'PIN yang Anda masukkan salah.'
        );
        setShake(true);
        setTimeout(() => setShake(false), 500);
        pinRef.current = '';
        setPin('');
      }
    },
    [userId, lang]
  );

  const handleKeyPress = useCallback(
    (digit: string) => {
      if (pinRef.current.length >= 4) return;
      triggerHaptic('light');
      const nextPin = pinRef.current + digit;
      pinRef.current = nextPin;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    },
    [verifyPin]
  );

  const handleDelete = useCallback(() => {
    if (pinRef.current.length === 0) return;
    triggerHaptic('light');
    const nextPin = pinRef.current.slice(0, -1);
    pinRef.current = nextPin;
    setPin(nextPin);
    setErrorMsg(null);
  }, []);

  const handleBiometricAuth = useCallback(async () => {
    triggerHaptic('medium');
    const success = await authenticateBiometrics();
    if (success) {
      triggerHaptic('success');
      unlockApp(userId);
      setPin('');
      setErrorMsg(null);
      setLocked(false);
    } else {
      triggerHaptic('warning');
      setErrorMsg(
        lang === 'en'
          ? 'Biometric verification failed or cancelled.'
          : 'Verifikasi biometrik gagal atau dibatalkan.'
      );
    }
  }, [userId, lang]);

  // Handle keyboard typing for desktop users and Escape for modals
  useEffect(() => {
    if (!locked && !showEmergencyModal && !showResetModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEmergencyModal) setShowEmergencyModal(false);
        if (showResetModal) setShowResetModal(false);
        return;
      }

      // If modal is open, let user type freely in modal inputs
      if (showResetModal || showEmergencyModal) return;

      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locked, showEmergencyModal, showResetModal, handleKeyPress, handleDelete]);

  // Auto-trigger biometric authentication if enabled on mobile
  useEffect(() => {
    if (!locked || !biometricAvailable || isDesktopDevice()) return;

    const timer = setTimeout(() => {
      handleBiometricAuth();
    }, 350);

    return () => clearTimeout(timer);
  }, [locked, biometricAvailable, handleBiometricAuth]);

  if (!locked) return null;

  const handleSendResetEmail = async () => {
    setResetLoading(true);
    setResetError(null);
    setResetSuccessMsg(null);
    try {
      const res = await requestPinResetAction(userId);
      if (res.success && res.token) {
        setResetToken(res.token);
        setResetStep('verify');
        setResetSuccessMsg(
          lang === 'en'
            ? `6-digit reset code sent to ${res.email || 'your email'}.`
            : `Kode 6 digit telah dikirim ke ${res.email || 'email Anda'}.`
        );
      } else {
        setResetError(res.error || (lang === 'en' ? 'Failed to send reset email.' : 'Gagal mengirim email reset.'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending reset email.';
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      setResetError(lang === 'en' ? 'Please enter a valid 6-digit code.' : 'Masukkan 6 digit kode yang valid.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const res = await confirmPinResetCodeAction({
        userId,
        token: resetToken,
        code: resetCode.trim(),
      });

      if (res.success) {
        triggerHaptic('success');
        removePinData(userId);
        unlockApp(userId);
        setLocked(false);
        setShowResetModal(false);
      } else {
        setResetError(res.error || (lang === 'en' ? 'Verification failed.' : 'Verifikasi gagal.'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error verifying reset code.';
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetWithPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accountPassword.trim()) {
      setResetError(lang === 'en' ? 'Please enter your account password.' : 'Masukkan kata sandi akun Anda.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      const emailToUse = userEmail || auth.currentUser?.email;
      if (!emailToUse) {
        throw new Error(lang === 'en' ? 'Account email not found.' : 'Email akun tidak ditemukan.');
      }

      await signInWithEmailAndPassword(auth, emailToUse, accountPassword.trim());
      triggerHaptic('success');
      removePinData(userId);
      unlockApp(userId);
      setLocked(false);
      setShowResetModal(false);
      setAccountPassword('');
    } catch (err: unknown) {
      triggerHaptic('warning');
      const msg = err instanceof Error ? err.message : '';
      if (
        msg.includes('auth/wrong-password') ||
        msg.includes('auth/invalid-credential') ||
        msg.includes('invalid-login-credentials')
      ) {
        setResetError(lang === 'en' ? 'Incorrect account password.' : 'Kata sandi akun salah.');
      } else if (msg.includes('auth/too-many-requests')) {
        setResetError(
          lang === 'en'
            ? 'Too many failed attempts. Try again later.'
            : 'Terlalu banyak percobaan gagal. Silakan coba lagi nanti.'
        );
      } else {
        setResetError(
          lang === 'en' ? 'Failed to verify account password.' : 'Gagal memverifikasi kata sandi akun.'
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmSignOut = async () => {
    setEmergencyLoading(true);
    try {
      if (clearPinOnSignOut) {
        removePinData(userId);
      } else {
        lockApp(userId);
      }
      await fetch('/api/auth/session', { method: 'DELETE' });
      await signOut(auth);
      window.location.href = '/login';
    } catch {
      setEmergencyLoading(false);
      setShowEmergencyModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F5] dark:bg-neutral-950 flex flex-col justify-between items-center p-6 select-none animate-in fade-in duration-200 text-black dark:text-white">
      {/* Brand & Security Header */}
      <div className="flex flex-col items-center gap-3 pt-6 sm:pt-10">
        <BrandLogo variant="horizontal" priority className="h-10 sm:h-12 w-auto" />
        <div
          className="flex items-center gap-2 px-3 py-1 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000] text-black"
          style={{
            backgroundColor: 'var(--theme-accent, #FFE066)',
            color: 'var(--theme-accent-text, #000000)',
          }}
        >
          <Lock className="w-3.5 h-3.5 stroke-[2.5px]" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            {lang === 'en' ? 'Security Lock Active' : 'Layar Pengaman Aktif'}
          </span>
        </div>
      </div>

      {/* PIN Prompt & Visual Indicators */}
      <div className={`flex flex-col items-center space-y-5 my-auto ${shake ? 'animate-bounce' : ''}`}>
        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">
            {lang === 'en' ? 'Enter Security PIN' : 'Masukkan PIN Keamanan'}
          </h2>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            {isDesktop
              ? (lang === 'en' ? 'Type 4 digits using your keyboard' : 'Ketik 4 digit PIN di keyboard Anda')
              : (lang === 'en' ? '4-digit PIN to unlock Norden Finance' : '4 digit PIN untuk membuka aplikasi')}
          </p>
        </div>

        {/* 4 Dots */}
        <div className="flex items-center gap-4 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-5 h-5 rounded-full border-2 border-black dark:border-neutral-700 transition-all ${
                  isFilled
                    ? 'bg-black dark:bg-white scale-110 shadow-[2px_2px_0px_0px_var(--theme-accent,#FFE066)]'
                    : 'bg-white dark:bg-neutral-800 shadow-[2px_2px_0px_0px_#000]'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-100 dark:bg-red-950/80 border-2 border-black dark:border-neutral-700 text-red-700 dark:text-red-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Desktop vs Mobile Input Area */}
      {isDesktop ? (
        <div className="w-full max-w-sm space-y-4 pb-6 text-center">
          <div className="p-4 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] space-y-2">
            <div className="inline-flex p-2 bg-[#FFE066] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] text-black">
              <Keyboard className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              {lang === 'en' ? 'Type PIN on Keyboard' : 'Ketik PIN di Keyboard'}
            </p>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {lang === 'en'
                ? 'Use number keys (0-9) to enter your 4-digit PIN, or Backspace to delete.'
                : 'Gunakan tombol angka (0-9) untuk memasukkan 4 digit PIN, atau Backspace untuk menghapus.'}
            </p>
          </div>

          {/* Reset PIN via email action */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setShowResetModal(true);
              }}
              className="text-xs font-black uppercase text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white tracking-wider inline-flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Forgot PIN? Reset via Email' : 'Lupa PIN? Reset via Email'}
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xs space-y-3 pb-4">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-14 sm:h-16 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-2xl text-lg sm:text-xl font-black text-black dark:text-white shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
              >
                {digit}
              </button>
            ))}

            {/* Biometric or Empty slot */}
            {biometricAvailable ? (
              <button
                type="button"
                onClick={handleBiometricAuth}
                className="h-14 sm:h-16 bg-[#e0f2fe] dark:bg-sky-950/80 hover:bg-sky-200 dark:hover:bg-sky-900 border-2 border-black dark:border-neutral-700 rounded-2xl text-black dark:text-sky-200 shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                title={lang === 'en' ? 'Use Face ID / Fingerprint' : 'Gunakan Face ID / Sidik Jari'}
              >
                <Fingerprint className="w-6 h-6 stroke-[2.5px]" />
                <span className="text-[9px] font-black uppercase">
                  {lang === 'en' ? 'Biometrics' : 'Biometrik'}
                </span>
              </button>
            ) : (
              <div className="h-14 sm:h-16" />
            )}

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-14 sm:h-16 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-2xl text-lg sm:text-xl font-black text-black dark:text-white shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
            >
              0
            </button>

            {/* Backspace */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-14 sm:h-16 bg-white dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-2xl text-black dark:text-white shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
              title={lang === 'en' ? 'Delete' : 'Hapus'}
            >
              <Delete className="w-6 h-6 stroke-[2.5px]" />
            </button>
          </div>

          {/* Reset PIN action */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setResetError(null);
                setResetSuccessMsg(null);
                setShowResetModal(true);
              }}
              className="text-[11px] font-black uppercase text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white tracking-wider inline-flex items-center gap-1 cursor-pointer underline underline-offset-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {lang === 'en' ? 'Forgot PIN? Reset PIN' : 'Lupa PIN? Reset PIN'}
            </button>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showResetModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !resetLoading) {
              setShowResetModal(false);
            }
          }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_#000] space-y-4 animate-in zoom-in-95 text-black dark:text-white">
            <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="p-1.5 border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000]"
                  style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
                >
                  <KeyRound className="w-4 h-4 text-black stroke-[2.5px]" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {lang === 'en' ? 'Reset Security PIN' : 'Reset PIN Keamanan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-xs font-black px-2 py-1 border border-black dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* Reset Method Tabs */}
            <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  setResetMethod('password');
                  setResetError(null);
                }}
                className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  resetMethod === 'password'
                    ? 'bg-white dark:bg-neutral-900 border border-black dark:border-neutral-700 shadow-[1.5px_1.5px_0px_0px_#000] text-black dark:text-white'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {lang === 'en' ? 'Password' : 'Kata Sandi'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetMethod('email');
                  setResetError(null);
                }}
                className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  resetMethod === 'email'
                    ? 'bg-white dark:bg-neutral-900 border border-black dark:border-neutral-700 shadow-[1.5px_1.5px_0px_0px_#000] text-black dark:text-white'
                    : 'text-neutral-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {lang === 'en' ? 'Email Code' : 'Kode Email'}
              </button>
            </div>

            {resetMethod === 'password' ? (
              <form onSubmit={handleResetWithPassword} className="space-y-4">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
                  {lang === 'en'
                    ? 'Enter your account password to verify and reset your PIN immediately:'
                    : 'Masukkan kata sandi akun Anda untuk verifikasi dan menghapus PIN:'}
                </p>

                <div className="space-y-1">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={accountPassword}
                      onChange={(e) => setAccountPassword(e.target.value)}
                      placeholder={lang === 'en' ? 'Account password' : 'Kata sandi akun'}
                      className="w-full text-xs font-bold p-3 pr-10 bg-neutral-50 dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl focus:outline-hidden focus:bg-[#FFE066]/20 text-black dark:text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white p-1 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {resetError && (
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/80 border-2 border-black dark:border-neutral-700 text-red-700 dark:text-red-200 text-xs font-black uppercase rounded-xl flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={resetLoading || !accountPassword.trim()}
                    className="w-full py-3 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black dark:border-neutral-700 rounded-xl font-black text-xs uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
                    )}
                    <span>{lang === 'en' ? 'Verify & Reset PIN' : 'Verifikasi & Reset PIN'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setShowEmergencyModal(true);
                    }}
                    className="w-full py-2 text-center text-[11px] font-black uppercase text-neutral-500 hover:text-black dark:hover:text-white tracking-wider cursor-pointer underline"
                  >
                    {lang === 'en' ? 'Emergency Sign Out Instead' : 'Keluar Akun (Emergency Sign Out)'}
                  </button>
                </div>
              </form>
            ) : resetStep === 'request' ? (
              <div className="space-y-4">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
                  {lang === 'en'
                    ? `We will send a 6-digit reset code to your registered email (${userEmail || 'account email'}).`
                    : `Kami akan mengirimkan 6 digit kode reset ke email akun Anda (${userEmail || 'email akun'}).`}
                </p>

                {resetError && (
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/80 border-2 border-black dark:border-neutral-700 text-red-700 dark:text-red-200 text-xs font-black uppercase rounded-xl flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={resetLoading}
                    className="w-full py-3 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black dark:border-neutral-700 rounded-xl font-black text-xs uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 stroke-[2.5px]" />
                    )}
                    <span>{lang === 'en' ? 'Send Code to Email' : 'Kirim Kode ke Email'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setShowEmergencyModal(true);
                    }}
                    className="w-full py-2 text-center text-[11px] font-black uppercase text-neutral-500 hover:text-black dark:hover:text-white tracking-wider cursor-pointer underline"
                  >
                    {lang === 'en' ? 'Emergency Sign Out Instead' : 'Keluar Akun (Emergency Sign Out)'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyResetCode} className="space-y-4">
                {resetSuccessMsg && (
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 border-2 border-black dark:border-neutral-700 text-emerald-800 dark:text-emerald-200 text-xs font-black uppercase rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <span>{resetSuccessMsg}</span>
                  </div>
                )}

                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
                  {lang === 'en'
                    ? 'Enter the 6-digit code sent to your email inbox:'
                    : 'Masukkan 6 digit kode yang dikirim ke kotak masuk email Anda:'}
                </p>

                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center text-xl tracking-[0.5em] font-black p-3 bg-neutral-50 dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl focus:outline-hidden focus:bg-[#FFE066]/20 text-black dark:text-white"
                    autoFocus
                  />
                </div>

                {resetError && (
                  <div className="p-2.5 bg-red-100 dark:bg-red-950/80 border-2 border-black dark:border-neutral-700 text-red-700 dark:text-red-200 text-xs font-black uppercase rounded-xl flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={resetLoading || resetCode.length !== 6}
                    className="w-full py-3 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black dark:border-neutral-700 rounded-xl font-black text-xs uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
                    )}
                    <span>{lang === 'en' ? 'Verify & Unlock' : 'Verifikasi & Buka Kunci'}</span>
                  </button>

                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={() => setResetStep('request')}
                      className="text-[11px] font-black uppercase text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      {lang === 'en' ? 'Back' : 'Kembali'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      disabled={resetLoading}
                      className="text-[11px] font-black uppercase text-neutral-500 hover:text-black dark:hover:text-white underline cursor-pointer"
                    >
                      {lang === 'en' ? 'Resend Code' : 'Kirim Ulang Kode'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Emergency Sign Out Modal */}
      {showEmergencyModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !emergencyLoading) {
              setShowEmergencyModal(false);
            }
          }}
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl p-5 max-w-sm w-full shadow-[6px_6px_0px_0px_#000] space-y-4 animate-in zoom-in-95 text-black dark:text-white">
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000]"
                style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
              >
                <LogOut className="w-4 h-4 text-black stroke-[2.5px]" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-wider">
                {lang === 'en' ? 'Sign Out of Account?' : 'Keluar Dari Akun?'}
              </h3>
            </div>
            <div className="space-y-3">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
                {lang === 'en'
                  ? 'You will be signed out to protect your financial data.'
                  : 'Anda akan dialihkan keluar (sign out) untuk mengamankan data keuangan Anda.'}
              </p>

              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={clearPinOnSignOut}
                  onChange={(e) => setClearPinOnSignOut(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-2 border-black accent-[#FFE066] cursor-pointer"
                />
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 leading-tight">
                  {lang === 'en'
                    ? 'Clear PIN from this device (Recommended if you forgot your PIN)'
                    : 'Hapus PIN dari perangkat ini (Disarankan jika Anda lupa PIN)'}
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="px-3 py-1.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                disabled={emergencyLoading}
              >
                {lang === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handleConfirmSignOut}
                disabled={emergencyLoading}
                className="px-4 py-1.5 border-2 border-black rounded-xl text-xs font-black uppercase bg-red-500 text-white hover:bg-red-600 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
              >
                {emergencyLoading
                  ? lang === 'en'
                    ? 'Signing out...'
                    : 'Keluar...'
                  : lang === 'en'
                  ? 'Yes, Sign Out'
                  : 'Ya, Keluar Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
