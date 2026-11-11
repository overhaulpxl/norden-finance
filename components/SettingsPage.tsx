import { useState, useEffect } from 'react';
import { User, Crown, Check, Zap, Database, Trash2, Key, RotateCcw, Mail, Loader2, ShieldCheck, MessageCircle, ExternalLink, HelpCircle, Lock, Fingerprint, ShieldAlert, X, Smartphone, Download, CheckCircle2, Palette, Sun, Moon, Laptop, Camera, Bell, BellRing } from 'lucide-react';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { deleteUserAccountData, resetUserFinancialData } from '../app/actions';
import { forgotPasswordAction } from '../app/authActions';
import { saveUserAvatarAction, getUserAvatarAction } from '../app/actions/user';
import Link from 'next/link';
import { MVP_FEATURES, MVP_FEATURES_EN } from '../lib/constants';
import { formatCurrency } from '../lib/format';
import {
  isPinSet,
  isBiometricEnabled,
  setPinData,
  removePinData,
  lockApp,
  hashPin,
  isBiometricSupported,
  registerBiometrics,
  isDesktopDevice,
  verifyStoredPin,
  setBiometricEnabled,
  clearAllUserDataLocally,
} from '../lib/appLock';
import { triggerHaptic } from '../lib/haptics';
import { isPwaInstalled, promptPwaInstall, isIosDevice } from '../lib/pwa';
import { useTheme } from '../lib/themeContext';
import { useLanguage } from '../lib/i18n';

interface SettingsProps {
  user: {
    id: string;
    email: string;
    plan: 'trial' | 'pro';
    effectivePlan?: string;
    fullName?: string;
    trialEndsAt?: string | null;
  };
  stats: {
    transactionCount: number;
    walletCount: number;
    balanceTotal: number;
  };
  trialDays: number;
  pricingPlans: {
    monthly: { price: number; name: string } | null;
    yearly: { price: number; name: string } | null;
  };
}

export default function SettingsPage({ user, stats, trialDays, pricingPlans }: SettingsProps) {
  const { lang } = useLanguage();
  const { accentColor, setAccentColor, resetAccentColor, accentTextColor, themeMode, setThemeMode, presets } = useTheme();
  const [customColorInput, setCustomColorInput] = useState<string | null>(null);
  const displayColorInput = customColorInput ?? accentColor;

  const isPro = user.plan === 'pro';
  const [now] = useState(() => Date.now());
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetAcknowledged, setResetAcknowledged] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [emailResetLoading, setEmailResetLoading] = useState(false);
  const [emailResetSuccess, setEmailResetSuccess] = useState<string | null>(null);
  const [emailResetError, setEmailResetError] = useState<string | null>(null);

  // App Lock states
  const [pinActive, setPinActive] = useState<boolean>(() => isPinSet(user.id));
  const [biometricActive, setBiometricActive] = useState<boolean>(() => isBiometricEnabled(user.id));
  const [biometricDeviceSupport, setBiometricDeviceSupport] = useState(false);
  const [pwaInstalled, setPwaInstalled] = useState<boolean>(() => isPwaInstalled());
  const [isIos] = useState<boolean>(() => isIosDevice());
  const [isDesktop] = useState<boolean>(() => isDesktopDevice());

  // PIN modal states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'change' | 'remove'>('setup');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [pinModalLoading, setPinModalLoading] = useState(false);
  const [pinActionSuccess, setPinActionSuccess] = useState<string | null>(null);
  const [pinActionError, setPinActionError] = useState<string | null>(null);

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`norden_avatar_${user.id}`) || null;
    }
    return null;
  });
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);

  // Notification states
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  useEffect(() => {
    isBiometricSupported().then(setBiometricDeviceSupport);

    getUserAvatarAction().then((res) => {
      if (res.success && res.avatarUrl) {
        setAvatarUrl(res.avatarUrl);
        localStorage.setItem(`norden_avatar_${user.id}`, res.avatarUrl);
      }
    });
  }, [user.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setAvatarSuccess(null);

    // Max size: 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      triggerHaptic('warning');
      setAvatarError(lang === 'en' ? 'Photo size exceeds 5MB limit.' : 'Ukuran foto melebihi batas 5MB.');
      return;
    }

    setAvatarLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const size = 360;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              setAvatarLoading(false);
              return;
            }

            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

            const dataUrl = canvas.toDataURL('image/webp', 0.85);

            setAvatarUrl(dataUrl);
            localStorage.setItem(`norden_avatar_${user.id}`, dataUrl);
            window.dispatchEvent(new Event('norden_avatar_updated'));

            const res = await saveUserAvatarAction(dataUrl);
            setAvatarLoading(false);
            if (res.success) {
              triggerHaptic('success');
              setAvatarSuccess(lang === 'en' ? 'Profile photo updated!' : 'Foto profil berhasil diperbarui!');
              setTimeout(() => setAvatarSuccess(null), 3000);
            } else {
              setAvatarError(res.error || (lang === 'en' ? 'Failed to save photo.' : 'Gagal menyimpan foto.'));
            }
          } catch {
            setAvatarLoading(false);
            setAvatarError(lang === 'en' ? 'Error processing photo.' : 'Gagal memproses foto.');
          }
        };
        img.onerror = () => {
          setAvatarLoading(false);
          setAvatarError(lang === 'en' ? 'Invalid image file.' : 'File gambar tidak valid.');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setAvatarLoading(false);
      setAvatarError(lang === 'en' ? 'Failed to read file.' : 'Gagal membaca berkas foto.');
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    setAvatarError(null);
    try {
      setAvatarUrl(null);
      localStorage.removeItem(`norden_avatar_${user.id}`);
      window.dispatchEvent(new Event('norden_avatar_updated'));
      await saveUserAvatarAction(null);
      triggerHaptic('success');
      setAvatarSuccess(lang === 'en' ? 'Profile photo removed.' : 'Foto profil berhasil dihapus.');
      setTimeout(() => setAvatarSuccess(null), 3000);
    } catch {
      setAvatarError(lang === 'en' ? 'Failed to remove photo.' : 'Gagal menghapus foto.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRequestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      triggerHaptic('warning');
      return;
    }

    triggerHaptic('medium');
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        triggerHaptic('success');
        localStorage.setItem('norden_browser_notification_enabled', 'true');

        new Notification('Norden Finance', {
          body:
            lang === 'en'
              ? 'Notifications enabled! Norden will remind you to track cashflow.'
              : 'Notifikasi aktif! Norden akan mengingatkan Anda untuk mencatat transaksi dan arus kas.',
          icon: '/brand/norden-icon.png',
        });
      } else {
        triggerHaptic('warning');
        localStorage.setItem('norden_browser_notification_enabled', 'false');
      }
    } catch {
      triggerHaptic('warning');
    }
  };

  const handleTestNotification = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      triggerHaptic('light');
      new Notification('Norden Finance ⚡', {
        body:
          lang === 'en'
            ? 'Reminder: Have you logged all your transactions today?'
            : 'Pengingat Harian: Sudahkah Anda mencatat mutasi dan pengeluaran hari ini?',
        icon: '/brand/norden-icon.png',
      });
    }
  };

  const openPinModal = (mode: 'setup' | 'change' | 'remove') => {
    setPinModalMode(mode);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinModalError(null);
    setPinModalOpen(true);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinModalError(null);

    // Verify current PIN if in change or remove mode (6 digits bank standard)
    if (pinModalMode === 'change' || pinModalMode === 'remove') {
      if (currentPinInput.length !== 6) {
        setPinModalError(lang === 'en' ? 'Current PIN must be 6 digits.' : 'PIN saat ini harus 6 digit angka.');
        return;
      }
      const isCurrentValid = await verifyStoredPin(user.id, currentPinInput);
      if (!isCurrentValid) {
        triggerHaptic('warning');
        setPinModalError(lang === 'en' ? 'Current PIN does not match.' : 'PIN saat ini tidak cocok.');
        return;
      }

      if (pinModalMode === 'remove') {
        removePinData(user.id);
        setPinActive(false);
        setBiometricActive(false);
        setPinModalOpen(false);
        triggerHaptic('success');
        setPinActionSuccess(lang === 'en' ? '6-digit PIN lock disabled.' : 'Kunci PIN 6-digit berhasil dinonaktifkan.');
        setTimeout(() => setPinActionSuccess(null), 4000);
        return;
      }
    }

    // Setup or Change mode: validate new PIN (6 digits)
    if (!/^\d{6}$/.test(newPinInput)) {
      setPinModalError(lang === 'en' ? 'New PIN must be exactly 6 digits (0-9).' : 'PIN baru harus tepat 6 digit angka (0-9).');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinModalError(lang === 'en' ? 'New PIN confirmation does not match.' : 'Konfirmasi PIN baru tidak cocok.');
      return;
    }

    setPinModalLoading(true);
    const newHash = await hashPin(newPinInput, user.id);
    setPinData(user.id, newHash, biometricActive);
    setPinActive(true);
    setPinModalLoading(false);
    setPinModalOpen(false);
    triggerHaptic('success');
    setPinActionSuccess(
      pinModalMode === 'change'
        ? (lang === 'en' ? '6-digit PIN updated!' : 'PIN 6-digit berhasil diperbarui!')
        : (lang === 'en' ? '6-digit PIN lock activated!' : 'Kunci PIN 6-digit berhasil diaktifkan!')
    );
    setTimeout(() => setPinActionSuccess(null), 4000);
  };

  const handleToggleBiometrics = async () => {
    setPinActionError(null);
    if (!pinActive) {
      triggerHaptic('warning');
      setPinActionError(lang === 'en' ? 'Enable 6-digit PIN first before turning on biometrics.' : 'Aktifkan PIN 6-digit terlebih dahulu sebelum menyalakan biometrik.');
      setTimeout(() => setPinActionError(null), 5000);
      return;
    }

    if (!biometricActive) {
      // Register
      const success = await registerBiometrics(user.id, user.email);
      if (success) {
        setBiometricEnabled(user.id, true);
        setBiometricActive(true);
        triggerHaptic('success');
        setPinActionSuccess(lang === 'en' ? 'Biometrics (Face ID / Fingerprint) enabled!' : 'Biometrik (Face ID / Sidik Jari) berhasil diaktifkan!');
        setTimeout(() => setPinActionSuccess(null), 4000);
      } else {
        triggerHaptic('warning');
        setPinActionError(lang === 'en' ? 'Failed to register device biometrics or cancelled.' : 'Gagal mendaftarkan biometrik perangkat atau dibatalkan.');
        setTimeout(() => setPinActionError(null), 5000);
      }
    } else {
      setBiometricEnabled(user.id, false);
      setBiometricActive(false);
      triggerHaptic('light');
    }
  };

  const handleLockNow = () => {
    triggerHaptic('medium');
    lockApp(user.id);
  };

  useEffect(() => {
    if (!pinModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinModalOpen]);
  const monthlyPrice = pricingPlans.monthly?.price ?? null;
  const yearlyPrice = pricingPlans.yearly?.price ?? null;
  const yearlySavingsPercent = monthlyPrice && yearlyPrice
    ? Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100))
    : null;

  const handleSendResetEmail = async () => {
    const targetEmail = user.email || auth.currentUser?.email;
    if (!targetEmail) {
      setEmailResetError(lang === 'en' ? 'Account email address not found.' : 'Alamat email akun tidak ditemukan.');
      return;
    }

    setEmailResetLoading(true);
    setEmailResetError(null);
    setEmailResetSuccess(null);

    try {
      const res = await forgotPasswordAction(targetEmail);
      if (res.success) {
        setEmailResetSuccess(
          lang === 'en'
            ? `Password reset link sent to ${targetEmail}. Please check your inbox or spam folder.`
            : `Tautan atur ulang kata sandi telah dikirim ke ${targetEmail}. Silakan periksa kotak masuk atau folder spam email Anda.`
        );
      } else {
        setEmailResetError(res.error || (lang === 'en' ? 'Failed to send password reset email.' : 'Gagal mengirim email reset password.'));
      }
    } catch (err: unknown) {
      setEmailResetError(err instanceof Error ? err.message : (lang === 'en' ? 'An error occurred while sending reset email.' : 'Terjadi kesalahan saat mengirim email reset.'));
    } finally {
      setEmailResetLoading(false);
    }
  };

  const handleResetFinancialData = async () => {
    const isValidConfirm = resetConfirmText === 'RESET KEUANGAN' || resetConfirmText === 'RESET FINANCIAL';
    if (!isValidConfirm || !resetAcknowledged) {
      setResetError(
        lang === 'en'
          ? 'Type RESET FINANCIAL and check the confirmation box first.'
          : 'Ketik RESET KEUANGAN dan centang kotak konfirmasi terlebih dahulu.'
      );
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await resetUserFinancialData();
      if (res.success) {
        setResetSuccess(
          lang === 'en'
            ? 'Financial data successfully reset! Your workspace is fresh again.'
            : 'Data keuangan berhasil di-reset! Workspace Anda telah bersih kembali.'
        );
        setResetConfirmText('');
        setResetAcknowledged(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setResetError(res.error || (lang === 'en' ? 'Failed to reset financial data.' : 'Gagal mereset data keuangan.'));
      }
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : (lang === 'en' ? 'System error occurred.' : 'Terjadi kesalahan sistem.'));
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError(lang === 'en' ? 'Type DELETE to delete account.' : 'Ketik DELETE untuk menghapus akun.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error(lang === 'en' ? 'User not detected. Please log in again.' : 'Pengguna tidak terdeteksi. Silakan login kembali.');
      }

      const usesPassword = currentUser.providerData.some((provider) => provider.providerId === 'password');
      if (usesPassword) {
        if (!deletePassword) throw new Error(lang === 'en' ? 'Password is required to delete account.' : 'Password wajib diisi untuk menghapus akun.');
        const credential = EmailAuthProvider.credential(currentUser.email || user.email, deletePassword);
        await reauthenticateWithCredential(currentUser, credential);
      }

      const res = await deleteUserAccountData();
      if (!res.success) {
        throw new Error(res.error || (lang === 'en' ? 'Failed to delete data from database.' : 'Gagal menghapus data dari database.'));
      }

      clearAllUserDataLocally(user.id);

      await deleteUser(currentUser);

      window.location.href = '/login';
    } catch (err: unknown) {
      console.error(err);
      setDeleteError(err instanceof Error ? err.message : (lang === 'en' ? 'An error occurred while deleting account.' : 'Terjadi kesalahan saat menghapus akun.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const allFeatures = lang === 'en' ? MVP_FEATURES_EN : MVP_FEATURES;

  // Calculate trial days remaining
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;

  const levelInfo = (() => {
    const txCount = stats.transactionCount;
    if (txCount >= 100) return { level: 5, name: 'Financial Navigator', color: 'bg-[#c084fc]' };
    if (txCount >= 50) return { level: 4, name: 'Budget Master', color: 'bg-[#4ade80]' };
    if (txCount >= 20) return { level: 3, name: 'Smart Planner', color: 'bg-[#facc15]' };
    if (txCount >= 5) return { level: 2, name: 'Consistent Tracker', color: 'bg-[#60a5fa]' };
    return { level: 1, name: 'Beginner Saver', color: 'bg-[#a3a3a3]' };
  })();

  return (
    <div className="space-y-8 max-w-3xl select-none">
      {/* Profile Card */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-black dark:text-white">
        <div className="flex justify-between items-start mb-6 border-b-2 border-black dark:border-neutral-700 pb-4">
          <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-5 h-5 text-black dark:text-white stroke-[3px]" /> {lang === 'en' ? 'Account Profile' : 'Profil Akun'}
          </h3>
        </div>

        <div className="space-y-6">
          {avatarSuccess && (
            <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5px]" />
              <span>{avatarSuccess}</span>
            </div>
          )}

          {avatarError && (
            <div className="p-3 border-2 border-black dark:border-neutral-700 bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 stroke-[2.5px]" />
              <span>{avatarError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-none border-2 border-black dark:border-neutral-700 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-black text-2xl flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden group">
                {avatarLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#FFE066] dark:text-black" />
                ) : avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt={user.fullName || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()
                )}
              </div>

              <div>
                <p className="text-lg font-black text-black dark:text-white uppercase tracking-wider">{user.fullName || 'User'}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border-[2px] border-black dark:border-neutral-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                    user.effectivePlan === 'PRO_ACTIVE'
                      ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
                      : user.effectivePlan === 'PRO_PENDING'
                      ? 'bg-amber-200 dark:bg-amber-950/80 text-black dark:text-amber-200'
                      : user.effectivePlan === 'TRIAL'
                      ? 'bg-[#fef08a] dark:bg-amber-950/80 text-black dark:text-amber-200'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                  }`}>
                    {user.effectivePlan === 'PRO_ACTIVE'
                      ? 'Pro Plan 👑'
                      : user.effectivePlan === 'PRO_PENDING'
                      ? (lang === 'en' ? 'Pro (Pending Verification ⏳)' : 'Pro (Menunggu Verifikasi ⏳)')
                      : user.effectivePlan === 'TRIAL'
                      ? (lang === 'en' ? `Trial ⚡${trialDaysLeft !== null ? ` (${trialDaysLeft} days)` : ''}` : `Trial ⚡${trialDaysLeft !== null ? ` (${trialDaysLeft} hari)` : ''}`)
                      : 'Free Basic 🌱'}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${levelInfo.color} text-black`}>
                    Lvl {levelInfo.level}: {levelInfo.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200 dark:border-neutral-700">
              <label
                className={`px-3 py-2 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                  avatarLoading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Camera className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>{avatarUrl ? (lang === 'en' ? 'Change Photo' : 'Ganti Foto') : (lang === 'en' ? 'Upload Photo' : 'Upload Foto')}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  disabled={avatarLoading}
                  className="hidden"
                />
              </label>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarLoading}
                  className="px-2.5 py-2 bg-red-100 dark:bg-red-950/80 hover:bg-red-200 text-red-700 dark:text-red-200 border-2 border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1"
                  title={lang === 'en' ? 'Remove custom avatar' : 'Hapus foto kustom'}
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5px]" />
                </button>
              )}
            </div>
          </div>
          <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
            {lang === 'en'
              ? 'Max photo size 5MB (JPG, PNG, WebP). Compressed automatically to keep app snappy.'
              : 'Ukuran foto maksimal 5MB (JPG, PNG, WebP). Dikompresi otomatis agar aplikasi tetap cepat.'}
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border-2 border-black dark:border-neutral-700 text-center rounded-none bg-white dark:bg-neutral-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black dark:text-white tracking-wider">{stats.transactionCount}</p>
              <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1">
                {lang === 'en' ? 'Transactions' : 'Transaksi'}
              </p>
            </div>
            <div className="p-4 border-2 border-black dark:border-neutral-700 text-center rounded-none bg-white dark:bg-neutral-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black dark:text-white tracking-wider">{stats.walletCount}</p>
              <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1">
                {lang === 'en' ? 'Wallets' : 'Dompet'}
              </p>
            </div>
            <div className="p-4 border-2 border-black dark:border-neutral-700 text-center rounded-none bg-[#f3f4f6] dark:bg-neutral-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black dark:text-white">∞</p>
              <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mt-1">
                {lang === 'en' ? 'Limit/Month' : 'Limit/Bulan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tema & Tampilan (Warna Aksen & Mode Gelap) */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 select-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-black dark:border-neutral-700 pb-4 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-5 h-5 text-black dark:text-white stroke-[2.5px]" />
              {lang === 'en' ? 'Theme & Appearance' : 'Tema & Tampilan'}
            </h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
              {lang === 'en'
                ? 'Customize accent color, dark mode, and UI style'
                : 'Sesuaikan warna aksen aplikasi, mode gelap, dan tampilan visual Anda'}
            </p>
          </div>
          <span
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border border-black dark:border-neutral-700 rounded-md shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
            style={{ backgroundColor: accentColor, color: accentTextColor }}
          >
            {accentColor.toUpperCase()}
          </span>
        </div>

        <div className="space-y-6">
          {/* Mode Tampilan (Light / Dark / System) */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-neutral-200">
              {lang === 'en' ? 'Display Mode' : 'Mode Tampilan Layar'}
            </label>
            <div className="grid grid-cols-3 gap-2.5 max-w-md">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setThemeMode('light');
                }}
                className={`py-2.5 px-3 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
                style={themeMode === 'light' ? { backgroundColor: accentColor, color: accentTextColor } : {}}
              >
                <Sun className="w-4 h-4 stroke-[2.5px]" />
                <span>{lang === 'en' ? 'Light' : 'Terang'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setThemeMode('dark');
                }}
                className={`py-2.5 px-3 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
                style={themeMode === 'dark' ? { backgroundColor: accentColor, color: accentTextColor } : {}}
              >
                <Moon className="w-4 h-4 stroke-[2.5px]" />
                <span>{lang === 'en' ? 'Dark' : 'Gelap'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setThemeMode('system');
                }}
                className={`py-2.5 px-3 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50'
                }`}
                style={themeMode === 'system' ? { backgroundColor: accentColor, color: accentTextColor } : {}}
              >
                <Laptop className="w-4 h-4 stroke-[2.5px]" />
                <span>{lang === 'en' ? 'System' : 'Sistem'}</span>
              </button>
            </div>
          </div>

          {/* Preset Warna Aksen Cepat */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-neutral-200">
              {lang === 'en' ? 'Quick Accent Color Presets' : 'Pilihan Warna Aksen Cepat'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {presets.map((preset) => {
                const isSelected = accentColor.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCustomColorInput(null);
                      setAccentColor(preset.hex);
                    }}
                    className={`p-3 border-2 border-black dark:border-neutral-700 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-800 ring-2 ring-black dark:ring-white'
                        : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full border border-black shrink-0 shadow-[1px_1px_0px_0px_#000]"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-xs font-bold text-black dark:text-white truncate">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-black text-black dark:text-white shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pilihan Warna Kustom (Color Wheel & Hex Input) */}
          <div className="p-4 border-2 border-black dark:border-neutral-700 rounded-xl bg-[#FAF9F5] dark:bg-neutral-800/60 shadow-[3px_3px_0px_0px_#000] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-white">
                {lang === 'en' ? 'Custom Color (Hex / Palette)' : 'Warna Kustom (Hex / Palet Bebas)'}
              </label>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCustomColorInput(null);
                  resetAccentColor();
                }}
                className="text-[10px] font-black uppercase text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline cursor-pointer"
              >
                {lang === 'en' ? 'Reset to Default (#FFE066)' : 'Kembalikan Default (#FFE066)'}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Native Color Picker Trigger */}
              <div className="relative flex items-center justify-center">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => {
                    setCustomColorInput(null);
                    setAccentColor(e.target.value);
                  }}
                  className="w-11 h-11 p-0.5 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000] cursor-pointer bg-white"
                  title={lang === 'en' ? 'Open color wheel' : 'Buka roda warna'}
                />
              </div>

              {/* Hex Input */}
              <div className="flex-1 min-w-[140px] max-w-xs">
                <input
                  type="text"
                  value={displayColorInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomColorInput(val);
                    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                      setAccentColor(val);
                    }
                  }}
                  placeholder="#FFE066"
                  maxLength={7}
                  className="w-full brutal-input uppercase text-xs font-black"
                />
              </div>

              {/* Live Preview Button */}
              <div className="shrink-0">
                <button
                  type="button"
                  className="px-4 py-2.5 border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] transition-all"
                  style={{ backgroundColor: accentColor, color: accentTextColor }}
                >
                  {lang === 'en' ? 'Button Preview' : 'Contoh Tombol'}
                </button>
              </div>
            </div>

            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
              {lang === 'en'
                ? `Smart contrast automatically sets button text to ${accentTextColor === '#000000' ? 'Black' : 'White'} for optimal readability.`
                : `Kontras pintar otomatis menyesuaikan teks tombol menjadi ${accentTextColor === '#000000' ? 'Hitam' : 'Putih'} agar selalu nyaman dibaca.`}
            </p>
          </div>
        </div>
      </div>

      {/* Keamanan & Ganti Password */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 select-none text-black dark:text-white">
        <div className="flex justify-between items-start mb-6 border-b-2 border-black dark:border-neutral-700 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-5 h-5 text-black dark:text-white stroke-[2.5px]" /> {lang === 'en' ? 'Security & Password' : 'Keamanan & Kata Sandi'}
            </h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
              {lang === 'en'
                ? 'Reset account password via official verification link sent to your registered email'
                : 'Atur ulang kata sandi akun melalui tautan verifikasi resmi ke email terdaftar'}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl max-w-xl space-y-4 text-black dark:text-white">
          <div className="flex items-start gap-3">
            <div className="p-2 border-2 border-black bg-[#FFE066] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5 text-black stroke-[2.5px]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                {lang === 'en' ? 'Encrypted Reset Link' : 'Tautan Atur Ulang Terenkripsi'}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mt-1">
                {lang === 'en'
                  ? 'For account security and theft prevention, password updates must go through a secure link sent to your email:'
                  : 'Demi keamanan akun dan mencegah pembajakan, pembaruan password wajib melalui tautan khusus yang dikirimkan ke email akun Anda:'}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-neutral-900 border border-black dark:border-neutral-700 rounded-md text-xs font-black text-black dark:text-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>

          {emailResetError && (
            <div className="p-3 bg-red-100 border-[2px] border-black text-red-700 font-bold text-xs uppercase tracking-wider">
              ❌ {emailResetError}
            </div>
          )}
          {emailResetSuccess && (
            <div className="p-3 bg-emerald-100 border-[2px] border-black text-emerald-800 font-bold text-xs uppercase tracking-wider">
              ✅ {emailResetSuccess}
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSendResetEmail}
              disabled={emailResetLoading}
              className="w-full sm:w-auto px-5 py-3 bg-[#FFE066] hover:bg-[#FFD633] text-black border-[2px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {emailResetLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  {lang === 'en' ? 'SENDING LINK...' : 'MENGIRIM TAUTAN...'}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-black stroke-[2.5px]" />
                  {lang === 'en' ? 'SEND PASSWORD RESET LINK TO EMAIL' : 'KIRIM TAUTAN RESET PASSWORD KE EMAIL'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Kunci Layar PIN (6 Digit Standar Bank) & Biometrik */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 select-none text-black dark:text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-black dark:border-neutral-700 pb-4 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-5 h-5 text-black dark:text-white stroke-[2.5px]" /> {lang === 'en' ? 'PIN Screen Lock (6-Digit) & Biometrics' : 'Kunci Layar PIN (6-Digit Bank) & Biometrik'}
            </h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
              {lang === 'en'
                ? 'Standard 6-digit banking PIN protection for balance and transaction privacy'
                : 'Proteksi PIN 6 digit standar perbankan untuk privasi saldo dan catatan mutasi'}
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] shrink-0 ${
            pinActive ? 'bg-[#bbf7d0] text-black' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
          }`}>
            {pinActive
              ? (isDesktop
                  ? (lang === 'en' ? 'Active (Mobile Only)' : 'Aktif (Khusus HP)')
                  : (lang === 'en' ? '✓ 6-Digit PIN Active' : '✓ PIN 6-Digit Aktif'))
              : (lang === 'en' ? 'Disabled' : 'Nonaktif')}
          </span>
        </div>

        {pinActionSuccess && (
          <div className="mb-4 p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] animate-in fade-in">
            {pinActionSuccess}
          </div>
        )}

        {pinActionError && (
          <div className="mb-4 p-3 border-2 border-black dark:border-neutral-700 bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] animate-in fade-in">
            {pinActionError}
          </div>
        )}

        <div className="p-4 sm:p-5 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl max-w-xl space-y-4 text-black dark:text-white">
          <div className="flex items-start gap-3">
            <div className={`p-2 border-2 border-black dark:border-neutral-700 rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0 ${
              pinActive ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200' : 'bg-[#FFE066] text-black'
            }`}>
              <Lock className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                {pinActive
                  ? (lang === 'en' ? '6-Digit PIN Protection Active' : 'Proteksi PIN 6-Digit Sedang Berjalan')
                  : (lang === 'en' ? 'Screen Protection Not Set' : 'Proteksi Layar Belum Terpasang')}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {pinActive
                  ? (lang === 'en'
                    ? 'App will prompt for standard 6-digit PIN to protect your financial data (enter via keyboard on PC).'
                    : 'Aplikasi akan otomatis meminta PIN 6-digit saat dibuka (dapat diketik langsung via keyboard di PC).')
                  : (lang === 'en'
                    ? 'Enable standard 6-digit PIN to prevent others from seeing balance and transactions when opening the app.'
                    : 'Aktifkan PIN 6-digit standar untuk mencegah orang lain melihat saldo dan mutasi rekening saat membuka aplikasi.')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {!pinActive ? (
              <button
                type="button"
                onClick={() => openPinModal('setup')}
                className="px-4 py-2.5 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 stroke-[2.5px]" /> {lang === 'en' ? '+ Set 6-Digit PIN' : '+ Pasang PIN 6-Digit'}
              </button>
            ) : (
              <>
                {!isDesktop ? (
                  <button
                    type="button"
                    onClick={handleLockNow}
                    className="px-4 py-2.5 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5"
                    title={lang === 'en' ? 'Test lock screen right now' : 'Uji kunci layar sekarang juga'}
                  >
                    <Lock className="w-3.5 h-3.5 stroke-[2.5px]" /> {lang === 'en' ? 'Test Lock Now' : 'Uji Kunci Sekarang'}
                  </button>
                ) : (
                  <span className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-400 dark:border-neutral-600 rounded-xl text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                    {lang === 'en' ? 'Bypassed on PC' : 'Dilewati di PC'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => openPinModal('change')}
                  className="px-3.5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-black dark:text-white border-2 border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  {lang === 'en' ? 'Change PIN' : 'Ganti PIN'}
                </button>
                <button
                  type="button"
                  onClick={() => openPinModal('remove')}
                  className="px-3.5 py-2.5 bg-red-100 dark:bg-red-950/80 hover:bg-red-200 text-red-700 dark:text-red-200 border-2 border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  {lang === 'en' ? 'Remove PIN' : 'Hapus PIN'}
                </button>
              </>
            )}
          </div>

          {/* Biometrics Toggle Row */}
          {pinActive && (
            <div className="border-t-2 border-black dark:border-neutral-700 pt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-black dark:text-white stroke-[2.5px]" />
                <div>
                  <p className="text-xs font-black uppercase text-black dark:text-white">
                    {lang === 'en' ? 'Quick Biometric Unlock (Face ID / Fingerprint)' : 'Buka Cepat Biometrik (Face ID / Sidik Jari)'}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold">
                    {biometricDeviceSupport
                      ? (lang === 'en' ? 'Supported on your device (WebAuthn Platform)' : 'Didukung perangkat Anda (WebAuthn Platform)')
                      : (lang === 'en' ? 'Will use device biometric sensor if available' : 'Akan menggunakan sensor biometrik perangkat jika tersedia')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleBiometrics}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
                  biometricActive ? 'bg-[#bbf7d0] text-black' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {biometricActive ? (lang === 'en' ? '✓ On' : '✓ Nyala') : (lang === 'en' ? 'Off' : 'Mati')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PIN Setup / Change Modal */}
      {pinModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPinModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_#000] space-y-4 animate-in zoom-in-95 duration-200 text-black dark:text-white">
            <div className="flex justify-between items-center border-b-2 border-black dark:border-neutral-700 pb-3">
              <h4 className="font-black text-sm uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {pinModalMode === 'setup'
                  ? (lang === 'en' ? 'Set 6-Digit PIN' : 'Pasang PIN 6-Digit')
                  : pinModalMode === 'change'
                  ? (lang === 'en' ? 'Change Security PIN' : 'Ubah PIN Keamanan')
                  : (lang === 'en' ? 'Disable PIN' : 'Nonaktifkan PIN')}
              </h4>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black dark:hover:text-white border border-transparent hover:border-black cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3">
              {pinModalError && (
                <div className="p-2.5 bg-red-100 dark:bg-red-950/80 border-2 border-black dark:border-neutral-700 text-red-700 dark:text-red-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{pinModalError}</span>
                </div>
              )}

              {(pinModalMode === 'change' || pinModalMode === 'remove') && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-black dark:text-white mb-1">
                    {lang === 'en' ? 'Current PIN (6 Digits)' : 'PIN Saat Ini (6 Digit)'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="••••••"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full brutal-input px-3 py-2 text-center text-lg font-black tracking-widest bg-white dark:bg-neutral-800"
                    required
                    autoFocus
                  />
                </div>
              )}

              {pinModalMode !== 'remove' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-black dark:text-white mb-1">
                      {pinModalMode === 'change'
                        ? (lang === 'en' ? 'New PIN (6 Digits)' : 'PIN Baru (6 Digit)')
                        : (lang === 'en' ? 'Enter PIN (6 Digits)' : 'Masukkan PIN (6 Digit Angka)')}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="••••••"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full brutal-input px-3 py-2 text-center text-lg font-black tracking-widest bg-white dark:bg-neutral-800"
                      required
                      autoFocus={pinModalMode === 'setup'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-black dark:text-white mb-1">
                      {lang === 'en' ? 'Confirm New PIN' : 'Ulangi / Konfirmasi PIN Baru'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="••••••"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full brutal-input px-3 py-2 text-center text-lg font-black tracking-widest bg-white dark:bg-neutral-800"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="px-4 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-black dark:text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  disabled={pinModalLoading}
                  className={`px-5 py-2 border-2 border-black dark:border-neutral-700 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer disabled:opacity-50 ${
                    pinModalMode === 'remove'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-[#FFE066] hover:bg-yellow-300 text-black'
                  }`}
                >
                  {pinModalLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : pinModalMode === 'remove' ? (
                    lang === 'en' ? 'Remove PIN' : 'Hapus PIN'
                  ) : (
                    lang === 'en' ? 'Save PIN' : 'Simpan PIN'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Info */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-black dark:text-white">
        <div className="flex justify-between items-start mb-6 border-b-2 border-black dark:border-neutral-700 pb-4">
          <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-5 h-5 text-black dark:text-white stroke-[3px]" /> {lang === 'en' ? 'Subscription Plans' : 'Paket Langganan'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trial / Current */}
          <div className={`p-6 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            !isPro ? (user.effectivePlan === 'FREE_BASIC' ? 'bg-[#e5e5e5] text-black' : 'bg-[#fef08a] text-black') : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 stroke-[3px]" />
              <h4 className="text-base font-black uppercase tracking-wider">
                {user.effectivePlan === 'FREE_BASIC' ? 'Free Basic' : 'Trial Plan'}
              </h4>
            </div>
            <p className="text-3xl font-black mb-1 tracking-wider">Rp 0</p>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-4 uppercase tracking-wider">
              {user.effectivePlan === 'FREE_BASIC'
                ? (lang === 'en' ? 'Basic financial tracking with unlimited duration' : 'Pencatatan keuangan dasar tanpa batas waktu')
                : (lang === 'en' ? `${trialDays} days free full access` : `${trialDays} hari gratis akses penuh`)}
            </p>
            <ul className="space-y-2">
              {allFeatures.slice(0, 6).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-800 dark:text-emerald-400 stroke-[3px] flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {!isPro && (
              <div className="mt-6 p-2 bg-white dark:bg-neutral-900 text-black dark:text-white text-center text-xs font-black uppercase tracking-widest rounded-none border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {lang === 'en' ? '✓ Active Plan' : '✓ Paket Aktif'}
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className={`p-6 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            isPro ? 'bg-[#bbf7d0] text-black' : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 stroke-[3px]" />
              <h4 className="text-base font-black uppercase tracking-wider">Pro Plan</h4>
            </div>
            <p className="text-3xl font-black mb-1 tracking-wider">
              {monthlyPrice !== null ? formatCurrency(monthlyPrice) : (lang === 'en' ? 'Not available' : 'Tidak tersedia')}
            </p>
            <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mb-4 uppercase tracking-wider">
              {yearlyPrice
                ? (lang === 'en'
                    ? `or ${formatCurrency(yearlyPrice)} / year${yearlySavingsPercent ? ` (save ${yearlySavingsPercent}%)` : ''}`
                    : `atau ${formatCurrency(yearlyPrice)} / tahun${yearlySavingsPercent ? ` (hemat ${yearlySavingsPercent}%)` : ''}`)
                : (lang === 'en' ? 'Yearly plan currently disabled' : 'Paket tahunan sedang dinonaktifkan')}
            </p>
            <ul className="space-y-2">
              {allFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-800 dark:text-emerald-400 stroke-[3px] flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-6 p-2 bg-white dark:bg-neutral-900 text-black dark:text-white text-center text-xs font-black uppercase tracking-widest rounded-none border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {user.effectivePlan === 'PRO_PENDING'
                  ? (lang === 'en' ? '⏳ Pending Admin Verification' : '⏳ Menunggu Verifikasi Admin')
                  : (lang === 'en' ? '✓ Active Plan' : '✓ Paket Aktif')}
              </div>
            ) : (
              <Link href="/upgrade" className="block mt-6 w-full brutal-btn py-3 text-xs font-black uppercase tracking-widest text-center cursor-pointer">
                {lang === 'en' ? 'Upgrade to Pro' : 'Upgrade ke Pro'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Data & Storage */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 text-black dark:text-white space-y-6">
        <div className="flex justify-between items-start border-b-2 border-black dark:border-neutral-700 pb-4">
          <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-5 h-5 text-black dark:text-white stroke-[3px]" /> {lang === 'en' ? 'Data & Storage' : 'Data & Penyimpanan'}
          </h3>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wide">
          {lang === 'en'
            ? 'All your financial data is securely stored in the cloud using Firebase and PostgreSQL. Data is protected with Firebase authentication and Prisma authorization.'
            : 'Semua data keuangan Anda disimpan secara aman di cloud menggunakan Firebase dan PostgreSQL. Data diamankan menggunakan otentikasi Firebase dan otorisasi Prisma.'}
        </p>

        {/* Reset Financial Data Card */}
        <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black dark:text-white">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-6 h-6 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5 stroke-[2.5px]" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  {lang === 'en' ? 'Reset Financial Workspace' : 'Reset Workspace Keuangan'}
                </h4>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-bold mt-1 leading-relaxed">
                  {lang === 'en'
                    ? 'Deletes all transaction records, wallets, balances, budgets, saving goals, debts, paylaters, bills, and reminders.'
                    : 'Menghapus seluruh catatan transaksi, dompet, saldo, budget, target tabungan, utang, paylater, tagihan, dan reminder.'}
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 font-black mt-1">
                  {lang === 'en'
                    ? '✓ Your account, profile, trial / Pro subscription, payment proofs, and login history REMAIN SAFE and UNCHANGED.'
                    : '✓ Akun, profil, masa trial / langganan Pro, bukti pembayaran, dan riwayat login Anda TETAP AMAN dan TIDAK BERUBAH.'}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold mt-1">
                  {lang === 'en' ? (
                    <>💡 Recommended to download a backup via <strong>Data Dashboard (Export CSV / PDF)</strong> before resetting.</>
                  ) : (
                    <>💡 Disarankan mengunduh cadangan catatan via menu <strong>Data Dashboard (Export CSV / PDF)</strong> sebelum melakukan reset.</>
                  )}
                </p>
              </div>

              {resetError && (
                <div className="p-3 bg-red-100 dark:bg-red-950/80 border-2 border-black dark:border-neutral-700 text-red-700 dark:text-red-200 font-bold text-xs uppercase tracking-wider">
                  ❌ {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 border-2 border-black dark:border-neutral-700 text-emerald-800 dark:text-emerald-200 font-bold text-xs uppercase tracking-wider">
                  ✅ {resetSuccess}
                </div>
              )}

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={resetAcknowledged}
                    onChange={(e) => setResetAcknowledged(e.target.checked)}
                    className="w-4 h-4 border-2 border-black rounded-none cursor-pointer"
                  />
                  <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                    {lang === 'en'
                      ? 'I understand transaction & wallet data will be permanently deleted'
                      : 'Saya paham data transaksi & dompet akan dihapus permanen'}
                  </span>
                </label>

                <input
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-black uppercase"
                  placeholder={lang === 'en' ? 'TYPE RESET FINANCIAL' : 'KETIK RESET KEUANGAN'}
                  disabled={resetLoading}
                />
              </div>

              <button
                type="button"
                onClick={handleResetFinancialData}
                disabled={resetLoading || (resetConfirmText !== 'RESET KEUANGAN' && resetConfirmText !== 'RESET FINANCIAL') || !resetAcknowledged}
                className="mt-2 px-4 py-2.5 border-2 border-black dark:border-neutral-700 bg-[#FFE066] text-black rounded-none text-xs font-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 stroke-[3px]" />
                {resetLoading
                  ? (lang === 'en' ? 'RESETTING...' : 'MEMPROSES RESET...')
                  : (lang === 'en' ? 'Reset Financial Data' : 'Reset Data Keuangan')}
              </button>
            </div>
          </div>
        </div>

        {/* Zona Bahaya (Account Deletion) */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-2 border-red-650 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] text-black dark:text-white">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5 stroke-[2.5px]" />
            <div>
              <h4 className="text-sm font-black text-red-650 uppercase tracking-wider">
                {lang === 'en' ? 'Danger Zone' : 'Zona Bahaya'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-1 uppercase tracking-wider">
                {lang === 'en'
                  ? 'Deleting your account will permanently remove all transactions, balances, saving goals, and other data. Type DELETE and enter your password to confirm.'
                  : 'Menghapus akun akan menghilangkan semua transaksi, saldo, target tabungan, dan data lainnya secara permanen. Ketik DELETE dan masukkan password untuk konfirmasi.'}
              </p>
              {deleteError && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-950/80 border-2 border-black dark:border-neutral-700 text-red-700 dark:text-red-200 font-bold text-xs uppercase tracking-wider">
                  ❌ {deleteError}
                </div>
              )}
              <div className="mt-3 grid gap-2">
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-black uppercase"
                  placeholder={lang === 'en' ? 'TYPE DELETE' : 'KETIK DELETE'}
                />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-bold"
                  placeholder={lang === 'en' ? 'ACCOUNT PASSWORD' : 'PASSWORD AKUN'}
                />
              </div>
              <button 
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="mt-3 px-4 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-red-650 dark:text-red-400 rounded-none text-xs font-black hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {deleteLoading
                  ? (lang === 'en' ? 'DELETING...' : 'MENGHAPUS...')
                  : (lang === 'en' ? 'Delete My Account' : 'Hapus Akun Saya')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pusat Bantuan & Kontak Dukungan (App Store & Play Store Support Requirement) */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 select-none text-black dark:text-white">
        <div className="flex justify-between items-start mb-4 border-b-2 border-black dark:border-neutral-700 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-black dark:text-white stroke-[2.5px]" /> {lang === 'en' ? 'Help Center & Customer Support' : 'Pusat Bantuan & Layanan Pelanggan'}
            </h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
              {lang === 'en'
                ? 'Transaction issues, account verification, or questions regarding Pro subscription'
                : 'Kendala transaksi, verifikasi akun, atau pertanyaan seputar langganan Pro'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://wa.me/6287882924651?text=Halo%20Norden%20Finance,%20saya%20butuh%20bantuan%20terkait%20akun%20atau%20kendala%20aplikasi."
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 hover:bg-[#bbf7d0] dark:hover:bg-neutral-700 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-start gap-3 group text-black dark:text-white"
          >
            <div className="p-2 border-2 border-black bg-[#2ECC71] text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] rounded-lg shrink-0">
              <MessageCircle className="w-5 h-5 text-black stroke-[2.5px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-black dark:text-white">
                <span>{lang === 'en' ? 'Official WhatsApp Support' : 'WhatsApp Admin Resmi'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black dark:group-hover:text-white" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-1">
                {lang === 'en' ? 'Fast response Monday - Sunday (08:00 - 21:00 WIB)' : 'Respon cepat Senin - Minggu (08.00 - 21.00 WIB)'}
              </p>
              <span className="text-[11px] font-mono font-black text-neutral-800 dark:text-neutral-200 underline mt-1.5 block">
                +62 878-8292-4651
              </span>
            </div>
          </a>

          <a
            href="mailto:support@nordenfinance.site?subject=Bantuan%20Akun%20Norden%20Finance"
            className="p-4 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 hover:bg-[#bfdbfe] dark:hover:bg-neutral-700 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-start gap-3 group text-black dark:text-white"
          >
            <div className="p-2 border-2 border-black bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] rounded-lg shrink-0">
              <Mail className="w-5 h-5 text-black stroke-[2.5px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-black dark:text-white">
                <span>{lang === 'en' ? 'Official Support Email' : 'Email Dukungan Resmi'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black dark:group-hover:text-white" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-1">
                {lang === 'en' ? 'For technical inquiries, data issues, and account verification' : 'Untuk pertanyaan teknis, kendala data, dan verifikasi akun'}
              </p>
              <span className="text-[11px] font-mono font-black text-neutral-800 dark:text-neutral-200 underline mt-1.5 block">
                support@nordenfinance.site
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* Notifikasi Web Browser */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 select-none text-black dark:text-white rounded-2xl shadow-[4px_4px_0px_0px_#000]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b-2 border-black dark:border-neutral-700 pb-3 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-5 h-5 text-black dark:text-white stroke-[2.5px]" /> {lang === 'en' ? 'Daily Browser Reminders' : 'Notifikasi Pengingat Browser'}
            </h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
              {lang === 'en'
                ? 'Get gentle reminders on this device to track daily transactions and maintain streaks'
                : 'Dapatkan pengingat harian di perangkat ini untuk mencatat mutasi dan menjaga streak keuangan'}
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black dark:border-neutral-700 rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0 ${
            notificationPermission === 'granted'
              ? 'bg-[#bbf7d0] text-black'
              : notificationPermission === 'denied'
              ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-200'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          }`}>
            {notificationPermission === 'granted'
              ? (lang === 'en' ? '✓ Notifications Active' : '✓ Notifikasi Aktif')
              : notificationPermission === 'denied'
              ? (lang === 'en' ? 'Blocked by Browser' : 'Diblokir Browser')
              : (lang === 'en' ? 'Not Permitted' : 'Belum Diizinkan')}
          </span>
        </div>

        <div className="p-4 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 shadow-[3px_3px_0px_0px_#000] rounded-xl space-y-3 text-black dark:text-white">
          <div className="flex items-start gap-3">
            <div className={`p-2 border-[2px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] shrink-0 ${
              notificationPermission === 'granted' ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200' : 'bg-[#FFE066] text-black'
            }`}>
              {notificationPermission === 'granted' ? <BellRing className="w-5 h-5 text-emerald-800 dark:text-emerald-300 stroke-[2.5px]" /> : <Bell className="w-5 h-5 stroke-[2.5px]" />}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                {notificationPermission === 'granted'
                  ? (lang === 'en' ? 'Browser Notification Permission Granted' : 'Izin Notifikasi Web Sudah Aktif')
                  : notificationPermission === 'denied'
                  ? (lang === 'en' ? 'Notification Permission Denied' : 'Izin Notifikasi Tidak Diizinkan')
                  : (lang === 'en' ? 'Allow Instant Reminders' : 'Aktifkan Pengingat Pencatatan')}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {notificationPermission === 'granted'
                  ? (lang === 'en'
                    ? 'Norden will send native system notifications to remind you to log your daily spending and avoid forgotten cash leaks.'
                    : 'Norden dapat mengirimkan notifikasi sistem untuk mengingatkan Anda mencatat pengeluaran harian agar tidak ada pos bocor halus.')
                  : notificationPermission === 'denied'
                  ? (lang === 'en'
                    ? 'Notifications are blocked in your browser settings. Please click the padlock or settings icon in your browser address bar to allow notifications.'
                    : 'Notifikasi diblokir pada setelan peramban Anda. Klik ikon gembok atau setelan di bilah alamat browser untuk mengizinkannya.')
                  : (lang === 'en'
                    ? 'Click button below to enable native browser notifications without installing any heavy apps.'
                    : 'Klik tombol di bawah untuk mengizinkan notifikasi browser langsung tanpa perlu unduh aplikasi berat.')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {notificationPermission !== 'granted' && notificationPermission !== 'denied' && (
              <button
                type="button"
                onClick={handleRequestNotification}
                className="px-4 py-2 bg-[#FFE066] hover:bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>{lang === 'en' ? 'Allow Notifications' : 'Izinkan Notifikasi'}</span>
              </button>
            )}

            {notificationPermission === 'granted' && (
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-black dark:text-white border-[2px] border-black dark:border-neutral-700 font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                <BellRing className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>{lang === 'en' ? 'Send Test Reminder' : 'Kirim Uji Coba Pengingat'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Aplikasi PWA & Pemasangan */}
      <div className="brutal-card p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 select-none text-black dark:text-white rounded-2xl shadow-[4px_4px_0px_0px_#000]">
        <div className="flex justify-between items-start mb-4 border-b-2 border-black dark:border-neutral-700 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-black dark:text-white stroke-[2.5px]" /> {lang === 'en' ? 'Mobile App Mode (PWA)' : 'Mode Aplikasi Mobile (PWA)'}
            </h3>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
              {lang === 'en'
                ? 'Install the app directly to your home screen without App Store for fast offline access'
                : 'Pasang aplikasi langsung ke layar utama HP tanpa App Store untuk akses offline cepat'}
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black dark:border-neutral-700 rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0 ${
            pwaInstalled ? 'bg-[#bbf7d0] text-black' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          }`}>
            {pwaInstalled
              ? (lang === 'en' ? '✓ Installed (Standalone)' : '✓ Terpasang (Standalone)')
              : (lang === 'en' ? 'Web Browser Mode' : 'Mode Browser Web')}
          </span>
        </div>

        <div className="p-4 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 shadow-[3px_3px_0px_0px_#000] rounded-xl space-y-3 text-black dark:text-white">
          <div className="flex items-start gap-3">
            <div className={`p-2 border-[2px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] shrink-0 ${
              pwaInstalled ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200' : 'bg-[#FFE066] text-black'
            }`}>
              {pwaInstalled ? <CheckCircle2 className="w-5 h-5 text-emerald-800 dark:text-emerald-300 stroke-[2.5px]" /> : <Smartphone className="w-5 h-5 stroke-[2.5px]" />}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                {pwaInstalled
                  ? (lang === 'en' ? 'Norden Running as Full Application' : 'Norden Berjalan Sebagai Aplikasi Penuh')
                  : (lang === 'en' ? 'Install to Home Screen' : 'Pasang di Layar Utama (Home Screen)')}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
                {pwaInstalled
                  ? (lang === 'en'
                    ? 'App runs in full screen standalone mode, isolated from browser tabs and optimized for memory consumption.'
                    : 'Aplikasi berjalan dalam mode standalone layar penuh, terisolasi dari tab peramban dan hemat konsumsi memori.')
                  : isIos
                  ? (lang === 'en'
                    ? 'On iPhone/iPad Safari: Tap Share button ⎋ below, then select "Add to Home Screen".'
                    : 'Di iPhone/iPad Safari: Ketuk tombol Share ⎋ di bawah, lalu pilih "Tambah ke Layar Utama" (Add to Home Screen).')
                  : (lang === 'en'
                    ? 'Click button below to install Norden Finance directly to your Android home screen or computer.'
                    : 'Klik tombol di bawah untuk memasang Norden Finance langsung ke beranda Android atau komputer Anda.')}
              </p>
            </div>
          </div>

          {!pwaInstalled && !isIos && (
            <div className="pt-1">
              <button
                type="button"
                onClick={async () => {
                  triggerHaptic('medium');
                  const outcome = await promptPwaInstall();
                  if (outcome === 'accepted') {
                    setPwaInstalled(true);
                  }
                }}
                className="px-4 py-2 bg-black hover:bg-neutral-800 text-white border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>{lang === 'en' ? 'Install App Now' : 'Pasang Aplikasi Sekarang'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* App Version & Build Footer */}
      <div className="pt-2 pb-6 text-center select-none">
        <p className="text-xs font-black uppercase tracking-widest text-black dark:text-white">
          Norden Finance v1.2.0 • Build 2026
        </p>
        <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-1">
          {lang === 'en'
            ? 'Personal Finance Management App & Standalone PWA • Encrypted'
            : 'Aplikasi Manajemen Keuangan Pribadi & PWA Standalone • Terenkripsi'}
        </p>
      </div>
    </div>
  );
}
