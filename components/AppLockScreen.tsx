'use client';

import { useState, useEffect, useCallback } from 'react';
import BrandLogo from './BrandLogo';
import { Lock, Delete, Fingerprint, LogOut, ShieldAlert } from 'lucide-react';
import {
  hashPin,
  isPinSet,
  isBiometricEnabled,
  isAppUnlocked,
  unlockApp,
  authenticateBiometrics,
} from '../lib/appLock';
import { triggerHaptic } from '../lib/haptics';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useLanguage } from '../lib/i18n';

interface AppLockScreenProps {
  userId: string;
  userEmail?: string;
}

export default function AppLockScreen({ userId }: AppLockScreenProps) {
  const { lang } = useLanguage();
  const [locked, setLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isPinSet(userId) && !isAppUnlocked(userId);
  });

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isBiometricEnabled(userId);
  });
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

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

    // Re-lock if user returns after backgrounding app
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
        setPin('');
      }
    },
    [userId, lang]
  );

  const handleKeyPress = useCallback(
    (digit: string) => {
      if (pin.length >= 4) return;
      triggerHaptic('light');
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    },
    [pin, verifyPin]
  );

  const handleDelete = useCallback(() => {
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
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

  // Handle keyboard typing for desktop users
  useEffect(() => {
    if (!locked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locked, handleKeyPress, handleDelete]);

  // Auto-prompt biometrics once on screen load if enabled
  useEffect(() => {
    if (locked && biometricAvailable) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [locked, biometricAvailable, handleBiometricAuth]);

  if (!locked) return null;

  const handleSignOutEmergency = () => {
    triggerHaptic('medium');
    setShowEmergencyModal(true);
  };

  const handleConfirmSignOut = async () => {
    setEmergencyLoading(true);
    try {
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
            {lang === 'en'
              ? '4-digit PIN to unlock Norden Finance'
              : '4 digit PIN untuk membuka aplikasi Norden Finance'}
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

      {/* Numeric Keypad */}
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

        {/* Emergency Escape / Sign Out */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={handleSignOutEmergency}
            className="text-[11px] font-black uppercase text-neutral-500 hover:text-black dark:hover:text-white tracking-wider inline-flex items-center gap-1 cursor-pointer underline underline-offset-2"
          >
            <LogOut className="w-3.5 h-3.5" />{' '}
            {lang === 'en' ? 'Forgot PIN? Sign Out' : 'Lupa PIN? Keluar Akun'}
          </button>
        </div>
      </div>

      {showEmergencyModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
              {lang === 'en'
                ? 'Forgot your PIN? You will be signed out to protect your financial data.'
                : 'Lupa PIN? Anda akan dialihkan keluar (sign out) untuk mengamankan data keuangan Anda.'}
            </p>
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
                className="px-4 py-1.5 border-2 border-black rounded-xl text-xs font-black uppercase bg-red-500 text-white hover:bg-red-600 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
                disabled={emergencyLoading}
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
