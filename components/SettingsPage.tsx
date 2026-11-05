import { useState, useEffect } from 'react';
import { User, Crown, Check, Zap, Database, Trash2, Key, RotateCcw, Mail, Loader2, ShieldCheck, MessageCircle, ExternalLink, HelpCircle, Lock, Fingerprint, ShieldAlert, X } from 'lucide-react';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { deleteUserAccountData, resetUserFinancialData } from '../app/actions';
import { forgotPasswordAction } from '../app/authActions';
import Link from 'next/link';
import { MVP_FEATURES } from '../lib/constants';
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
} from '../lib/appLock';
import { triggerHaptic } from '../lib/haptics';

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

  // PIN modal states
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'change' | 'remove'>('setup');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [pinModalLoading, setPinModalLoading] = useState(false);
  const [pinActionSuccess, setPinActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    isBiometricSupported().then(setBiometricDeviceSupport);
  }, []);

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

    // Verify current PIN if in change or remove mode
    if (pinModalMode === 'change' || pinModalMode === 'remove') {
      if (currentPinInput.length !== 4) {
        setPinModalError('PIN saat ini harus 4 digit angka.');
        return;
      }
      const hashedCurrent = await hashPin(currentPinInput, user.id);
      const storedHash = localStorage.getItem(`norden_pin_hash_${user.id}`);
      if (hashedCurrent !== storedHash) {
        triggerHaptic('warning');
        setPinModalError('PIN saat ini tidak cocok.');
        return;
      }

      if (pinModalMode === 'remove') {
        removePinData(user.id);
        setPinActive(false);
        setBiometricActive(false);
        setPinModalOpen(false);
        triggerHaptic('success');
        setPinActionSuccess('Kunci PIN 4-digit berhasil dinonaktifkan.');
        setTimeout(() => setPinActionSuccess(null), 4000);
        return;
      }
    }

    // Setup or Change mode: validate new PIN
    if (!/^\d{4}$/.test(newPinInput)) {
      setPinModalError('PIN baru harus tepat 4 digit angka (0-9).');
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinModalError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    setPinModalLoading(true);
    const newHash = await hashPin(newPinInput, user.id);
    setPinData(user.id, newHash, biometricActive);
    setPinActive(true);
    setPinModalLoading(false);
    setPinModalOpen(false);
    triggerHaptic('success');
    setPinActionSuccess(pinModalMode === 'change' ? 'PIN 4-digit berhasil diperbarui!' : 'Kunci PIN 4-digit berhasil diaktifkan!');
    setTimeout(() => setPinActionSuccess(null), 4000);
  };

  const handleToggleBiometrics = async () => {
    if (!pinActive) {
      alert('Aktifkan PIN 4-digit terlebih dahulu sebelum menyalakan biometrik.');
      return;
    }

    if (!biometricActive) {
      // Register
      const success = await registerBiometrics(user.id, user.email);
      if (success) {
        localStorage.setItem(`norden_biometric_enabled_${user.id}`, 'true');
        setBiometricActive(true);
        triggerHaptic('success');
        setPinActionSuccess('Biometrik (Face ID / Sidik Jari) berhasil diaktifkan!');
        setTimeout(() => setPinActionSuccess(null), 4000);
      } else {
        triggerHaptic('warning');
        alert('Gagal mendaftarkan biometrik perangkat atau dibatalkan.');
      }
    } else {
      localStorage.setItem(`norden_biometric_enabled_${user.id}`, 'false');
      setBiometricActive(false);
      triggerHaptic('light');
    }
  };

  const handleLockNow = () => {
    triggerHaptic('medium');
    lockApp(user.id);
  };
  const monthlyPrice = pricingPlans.monthly?.price ?? null;
  const yearlyPrice = pricingPlans.yearly?.price ?? null;
  const yearlySavingsPercent = monthlyPrice && yearlyPrice
    ? Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100))
    : null;

  const handleSendResetEmail = async () => {
    const targetEmail = user.email || auth.currentUser?.email;
    if (!targetEmail) {
      setEmailResetError('Alamat email akun tidak ditemukan.');
      return;
    }

    setEmailResetLoading(true);
    setEmailResetError(null);
    setEmailResetSuccess(null);

    try {
      const res = await forgotPasswordAction(targetEmail);
      if (res.success) {
        setEmailResetSuccess(`Tautan atur ulang kata sandi telah dikirim ke ${targetEmail}. Silakan periksa kotak masuk atau folder spam email Anda.`);
      } else {
        setEmailResetError(res.error || 'Gagal mengirim email reset password.');
      }
    } catch (err: unknown) {
      setEmailResetError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim email reset.');
    } finally {
      setEmailResetLoading(false);
    }
  };

  const handleResetFinancialData = async () => {
    if (resetConfirmText !== 'RESET KEUANGAN' || !resetAcknowledged) {
      setResetError('Ketik RESET KEUANGAN dan centang kotak konfirmasi terlebih dahulu.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await resetUserFinancialData();
      if (res.success) {
        setResetSuccess('Data keuangan berhasil di-reset! Workspace Anda telah bersih kembali.');
        setResetConfirmText('');
        setResetAcknowledged(false);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setResetError(res.error || 'Gagal mereset data keuangan.');
      }
    } catch (err: unknown) {
      setResetError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Ketik DELETE untuk menghapus akun.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Pengguna tidak terdeteksi. Silakan login kembali.');
      }

      const usesPassword = currentUser.providerData.some((provider) => provider.providerId === 'password');
      if (usesPassword) {
        if (!deletePassword) throw new Error('Password wajib diisi untuk menghapus akun.');
        const credential = EmailAuthProvider.credential(currentUser.email || user.email, deletePassword);
        await reauthenticateWithCredential(currentUser, credential);
      }

      const res = await deleteUserAccountData();
      if (!res.success) {
        throw new Error(res.error || 'Gagal menghapus data dari database.');
      }

      await deleteUser(currentUser);

      window.location.href = '/login';
    } catch (err: unknown) {
      console.error(err);
      setDeleteError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus akun.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const allFeatures = MVP_FEATURES;

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
      <div className="brutal-card p-6 bg-white">
        <div className="flex justify-between items-start mb-6 border-b-[3px] border-black pb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
            <User className="w-5 h-5 text-black stroke-[3px]" /> Profil Akun
          </h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-14 h-14 rounded-none border-[3px] border-black bg-black flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-black text-black uppercase tracking-wider">{user.fullName || 'User'}</p>
              <p className="text-sm text-neutral-500 font-bold uppercase tracking-wider">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                  user.effectivePlan === 'PRO_ACTIVE'
                    ? 'bg-[#bbf7d0] text-black'
                    : user.effectivePlan === 'PRO_PENDING'
                    ? 'bg-amber-200 text-black'
                    : user.effectivePlan === 'TRIAL'
                    ? 'bg-[#fef08a] text-black'
                    : 'bg-neutral-200 text-neutral-800'
                }`}>
                  {user.effectivePlan === 'PRO_ACTIVE'
                    ? 'Pro Plan 👑'
                    : user.effectivePlan === 'PRO_PENDING'
                    ? 'Pro (Menunggu Verifikasi ⏳)'
                    : user.effectivePlan === 'TRIAL'
                    ? `Trial ⚡${trialDaysLeft !== null ? ` (${trialDaysLeft} hari)` : ''}`
                    : 'Free Basic 🌱'}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-none border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${levelInfo.color} text-black`}>
                  Lvl {levelInfo.level}: {levelInfo.name}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border-[2px] border-black text-center rounded-none bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black tracking-wider">{stats.transactionCount}</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Transaksi</p>
            </div>
            <div className="p-4 border-[2px] border-black text-center rounded-none bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black tracking-wider">{stats.walletCount}</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Dompet</p>
            </div>
            <div className="p-4 border-[2px] border-black text-center rounded-none bg-[#f3f4f6] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-2xl font-black text-black">∞</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Limit/Bulan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Keamanan & Ganti Password */}
      <div className="brutal-card p-6 bg-white select-none">
        <div className="flex justify-between items-start mb-6 border-b-[3px] border-black pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
              <Key className="w-5 h-5 text-black stroke-[2.5px]" /> Keamanan & Kata Sandi
            </h3>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">
              Atur ulang kata sandi akun melalui tautan verifikasi resmi ke email terdaftar
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-[2px] border-black bg-[#FAF9F5] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-w-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 border-[2px] border-black bg-[#FFE066] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <ShieldCheck className="w-5 h-5 text-black stroke-[2.5px]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-black">
                Tautan Atur Ulang Terenkripsi
              </p>
              <p className="text-xs text-neutral-600 font-medium leading-relaxed mt-1">
                Demi keamanan akun dan mencegah pembajakan, pembaruan password wajib melalui tautan khusus yang dikirimkan ke email akun Anda:
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border-[1.5px] border-black text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
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
                  MENGIRIM TAUTAN...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 text-black stroke-[2.5px]" />
                  KIRIM TAUTAN RESET PASSWORD KE EMAIL
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Kunci Layar PIN (4 Digit) & Biometrik */}
      <div className="brutal-card p-6 bg-white select-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-[3px] border-black pb-4 gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-5 h-5 text-black stroke-[2.5px]" /> Kunci Layar PIN & Biometrik
            </h3>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">
              Lindungi privasi saldo dan catatan transaksi saat HP dibuka orang lain
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-[2px] border-black shadow-[2px_2px_0px_0px_#000] shrink-0 ${
            pinActive ? 'bg-[#bbf7d0] text-black' : 'bg-neutral-100 text-neutral-600'
          }`}>
            {pinActive ? '✓ Kunci PIN Aktif' : 'Nonaktif'}
          </span>
        </div>

        {pinActionSuccess && (
          <div className="mb-4 p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] animate-in fade-in">
            {pinActionSuccess}
          </div>
        )}

        <div className="p-4 sm:p-5 border-[2px] border-black bg-[#FAF9F5] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] max-w-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 border-[2px] border-black shadow-[2px_2px_0px_0px_#000] shrink-0 ${
              pinActive ? 'bg-[#bbf7d0]' : 'bg-[#FFE066]'
            }`}>
              <Lock className="w-5 h-5 text-black stroke-[2.5px]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-black">
                {pinActive ? 'Proteksi 4-Digit PIN Sedang Berjalan' : 'Proteksi Layar Belum Terpasang'}
              </p>
              <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                {pinActive
                  ? 'Aplikasi akan otomatis meminta PIN 4-digit setiap kali dibuka atau kembali dari latar belakang (background).'
                  : 'Aktifkan PIN untuk mencegah orang lain melihat saldo dan mutasi rekening saat meminjam ponsel Anda.'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {!pinActive ? (
              <button
                type="button"
                onClick={() => openPinModal('setup')}
                className="px-4 py-2.5 bg-[#FFE066] hover:bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 stroke-[2.5px]" /> + Pasang PIN 4-Digit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLockNow}
                  className="px-4 py-2.5 bg-[#FFE066] hover:bg-yellow-300 text-black border-[2px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer flex items-center gap-1.5"
                  title="Uji kunci layar sekarang juga"
                >
                  <Lock className="w-3.5 h-3.5 stroke-[2.5px]" /> Uji Kunci Sekarang
                </button>
                <button
                  type="button"
                  onClick={() => openPinModal('change')}
                  className="px-3.5 py-2.5 bg-white hover:bg-neutral-100 text-black border-[2px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  Ganti PIN
                </button>
                <button
                  type="button"
                  onClick={() => openPinModal('remove')}
                  className="px-3.5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 border-[2px] border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                >
                  Hapus PIN
                </button>
              </>
            )}
          </div>

          {/* Biometrics Toggle Row */}
          {pinActive && (
            <div className="border-t-[1.5px] border-black pt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-black stroke-[2.5px]" />
                <div>
                  <p className="text-xs font-black uppercase text-black">Buka Cepat Biometrik (Face ID / Sidik Jari)</p>
                  <p className="text-[10px] text-neutral-500 font-bold">
                    {biometricDeviceSupport ? 'Didukung perangkat Anda (WebAuthn Platform)' : 'Akan menggunakan sensor biometrik perangkat jika tersedia'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleBiometrics}
                className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider border-[2px] border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
                  biometricActive ? 'bg-[#bbf7d0] text-black' : 'bg-white text-neutral-600'
                }`}
              >
                {biometricActive ? '✓ Nyala' : 'Mati'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PIN Setup / Change Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_#000] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b-2 border-black pb-3">
              <h4 className="font-black text-sm uppercase tracking-wider text-black flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {pinModalMode === 'setup' ? 'Pasang PIN 4-Digit' : pinModalMode === 'change' ? 'Ubah PIN Keamanan' : 'Nonaktifkan PIN'}
              </h4>
              <button
                type="button"
                onClick={() => setPinModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-black border border-transparent hover:border-black cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-3">
              {pinModalError && (
                <div className="p-2.5 bg-red-100 border-[2px] border-black text-red-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{pinModalError}</span>
                </div>
              )}

              {(pinModalMode === 'change' || pinModalMode === 'remove') && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-black mb-1">
                    PIN Saat Ini (4 Digit)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full brutal-input px-3 py-2 text-center text-lg font-black tracking-widest bg-white"
                    required
                    autoFocus
                  />
                </div>
              )}

              {pinModalMode !== 'remove' && (
                <>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-black mb-1">
                      {pinModalMode === 'change' ? 'PIN Baru (4 Digit)' : 'Masukkan PIN (4 Digit Angka)'}
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full brutal-input px-3 py-2 text-center text-lg font-black tracking-widest bg-white"
                      required
                      autoFocus={pinModalMode === 'setup'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-black mb-1">
                      Ulangi / Konfirmasi PIN Baru
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="w-full brutal-input px-3 py-2 text-center text-lg font-black tracking-widest bg-white"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="px-4 py-2 border-[2px] border-black bg-white hover:bg-neutral-100 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pinModalLoading}
                  className={`px-5 py-2 border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer disabled:opacity-50 ${
                    pinModalMode === 'remove'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-[#FFE066] hover:bg-yellow-300 text-black'
                  }`}
                >
                  {pinModalLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                  ) : pinModalMode === 'remove' ? (
                    'Hapus PIN'
                  ) : (
                    'Simpan PIN'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Info */}
      <div className="brutal-card p-6 bg-white">
        <div className="flex justify-between items-start mb-6 border-b-[3px] border-black pb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Crown className="w-5 h-5 text-black stroke-[3px]" /> Paket Langganan
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trial / Current */}
          <div className={`p-6 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            !isPro ? (user.effectivePlan === 'FREE_BASIC' ? 'bg-[#e5e5e5]' : 'bg-[#fef08a]') : 'bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-black stroke-[3px]" />
              <h4 className="text-base font-black text-black uppercase tracking-wider">
                {user.effectivePlan === 'FREE_BASIC' ? 'Free Basic' : 'Trial Plan'}
              </h4>
            </div>
            <p className="text-3xl font-black text-black mb-1 tracking-wider">Rp 0</p>
            <p className="text-xs font-bold text-neutral-600 mb-4 uppercase tracking-wider">
              {user.effectivePlan === 'FREE_BASIC'
                ? 'Pencatatan keuangan dasar tanpa batas waktu'
                : `${trialDays} hari gratis akses penuh`}
            </p>
            <ul className="space-y-2">
              {allFeatures.slice(0, 6).map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-800 stroke-[3px] flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {!isPro && (
              <div className="mt-6 p-2 bg-white text-black text-center text-xs font-black uppercase tracking-widest rounded-none border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ✓ Paket Aktif
              </div>
            )}
          </div>

          {/* Pro Plan */}
          <div className={`p-6 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
            isPro ? 'bg-[#bbf7d0]' : 'bg-white'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-black stroke-[3px]" />
              <h4 className="text-base font-black text-black uppercase tracking-wider">Pro Plan</h4>
            </div>
            <p className="text-3xl font-black text-black mb-1 tracking-wider">
              {monthlyPrice !== null ? formatCurrency(monthlyPrice) : 'Tidak tersedia'}
            </p>
            <p className="text-xs font-bold text-neutral-600 mb-4 uppercase tracking-wider">
              {yearlyPrice
                ? `atau ${formatCurrency(yearlyPrice)} / tahun${yearlySavingsPercent ? ` (hemat ${yearlySavingsPercent}%)` : ''}`
                : 'Paket tahunan sedang dinonaktifkan'}
            </p>
            <ul className="space-y-2">
              {allFeatures.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold text-black uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-800 stroke-[3px] flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="mt-6 p-2 bg-white text-black text-center text-xs font-black uppercase tracking-widest rounded-none border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {user.effectivePlan === 'PRO_PENDING' ? '⏳ Menunggu Verifikasi Admin' : '✓ Paket Aktif'}
              </div>
            ) : (
              <Link href="/upgrade" className="block mt-6 w-full brutal-btn py-3 text-xs font-black uppercase tracking-widest text-center cursor-pointer">
                Upgrade ke Pro
              </Link>
            )}
          </div>
        </div>
      </div>



      {/* Data & Storage */}
      <div className="brutal-card p-6 bg-white space-y-6">
        <div className="flex justify-between items-start border-b-[3px] border-black pb-4">
          <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
            <Database className="w-5 h-5 text-black stroke-[3px]" /> Data & Penyimpanan
          </h3>
        </div>
        <p className="text-sm text-neutral-600 font-bold uppercase tracking-wide">
          Semua data keuangan Anda disimpan secara aman di cloud menggunakan Firebase dan PostgreSQL. 
          Data diamankan menggunakan otentikasi Firebase dan otorisasi Prisma.
        </p>

        {/* Reset Financial Data Card */}
        <div className="p-5 bg-amber-50 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3">
            <RotateCcw className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5 stroke-[2.5px]" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-sm font-black text-black uppercase tracking-wider">Reset Workspace Keuangan</h4>
                <p className="text-xs text-neutral-700 font-bold mt-1 leading-relaxed">
                  Menghapus seluruh catatan transaksi, dompet, saldo, budget, target tabungan, utang, paylater, tagihan, dan reminder.
                </p>
                <p className="text-xs text-emerald-800 font-black mt-1">
                  ✓ Akun, profil, masa trial / langganan Pro, bukti pembayaran, dan riwayat login Anda TETAP AMAN dan TIDAK BERUBAH.
                </p>
                <p className="text-[11px] text-neutral-500 font-bold mt-1">
                  💡 Disarankan mengunduh cadangan catatan via menu <strong>Data Dashboard (Export CSV / PDF)</strong> sebelum melakukan reset.
                </p>
              </div>

              {resetError && (
                <div className="p-3 bg-red-100 border-[2px] border-black text-red-700 font-bold text-xs uppercase tracking-wider">
                  ❌ {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 bg-emerald-100 border-[2px] border-black text-emerald-800 font-bold text-xs uppercase tracking-wider">
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
                  <span className="text-xs font-bold text-black uppercase tracking-wider">
                    Saya paham data transaksi & dompet akan dihapus permanen
                  </span>
                </label>

                <input
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-black uppercase"
                  placeholder="KETIK RESET KEUANGAN"
                  disabled={resetLoading}
                />
              </div>

              <button
                onClick={handleResetFinancialData}
                disabled={resetLoading || resetConfirmText !== 'RESET KEUANGAN' || !resetAcknowledged}
                className="mt-2 px-4 py-2.5 border-[2px] border-black bg-[#FFE066] text-black rounded-none text-xs font-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 stroke-[3px]" />
                {resetLoading ? 'MEMPROSES RESET...' : 'Reset Data Keuangan'}
              </button>
            </div>
          </div>
        </div>

        {/* Zona Bahaya (Account Deletion) */}
        <div className="p-4 bg-white border-[3px] border-red-650 rounded-none shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-650 flex-shrink-0 mt-0.5 stroke-[2.5px]" />
            <div>
              <h4 className="text-sm font-black text-red-650 uppercase tracking-wider">Zona Bahaya</h4>
              <p className="text-xs text-neutral-600 font-bold mt-1 uppercase tracking-wider">
                Menghapus akun akan menghilangkan semua transaksi, saldo, target tabungan, dan data lainnya secara permanen. Ketik DELETE dan masukkan password untuk konfirmasi.
              </p>
              {deleteError && (
                <div className="mt-3 p-3 bg-red-100 border-[2px] border-black text-red-700 font-bold text-xs uppercase tracking-wider">
                  ❌ {deleteError}
                </div>
              )}
              <div className="mt-3 grid gap-2">
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-black uppercase"
                  placeholder="KETIK DELETE"
                />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full max-w-sm brutal-input text-xs font-bold"
                  placeholder="PASSWORD AKUN"
                />
              </div>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="mt-3 px-4 py-2 border-[2px] border-black bg-white text-red-650 rounded-none text-xs font-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'MENGHAPUS...' : 'Hapus Akun Saya'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pusat Bantuan & Kontak Dukungan (App Store & Play Store Support Requirement) */}
      <div className="brutal-card p-6 bg-white select-none">
        <div className="flex justify-between items-start mb-4 border-b-[3px] border-black pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-black stroke-[2.5px]" /> Pusat Bantuan & Layanan Pelanggan
            </h3>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">
              Kendala transaksi, verifikasi akun, atau pertanyaan seputar langganan Pro
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="https://wa.me/6287882924651?text=Halo%20Norden%20Finance,%20saya%20butuh%20bantuan%20terkait%20akun%20atau%20kendala%20aplikasi."
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border-[2px] border-black bg-[#FAF9F5] hover:bg-[#bbf7d0] transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3 group"
          >
            <div className="p-2 border-[1.5px] border-black bg-[#2ECC71] text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <MessageCircle className="w-5 h-5 text-black stroke-[2.5px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-black">
                <span>WhatsApp Admin Resmi</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black" />
              </div>
              <p className="text-xs text-neutral-600 font-bold mt-1">
                Respon cepat Senin - Minggu (08.00 - 21.00 WIB)
              </p>
              <span className="text-[11px] font-mono font-black text-neutral-800 underline mt-1.5 block">
                +62 878-8292-4651
              </span>
            </div>
          </a>

          <a
            href="mailto:support@nordenfinance.site?subject=Bantuan%20Akun%20Norden%20Finance"
            className="p-4 border-[2px] border-black bg-[#FAF9F5] hover:bg-[#bfdbfe] transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3 group"
          >
            <div className="p-2 border-[1.5px] border-black bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
              <Mail className="w-5 h-5 text-black stroke-[2.5px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-black">
                <span>Email Dukungan Resmi</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black" />
              </div>
              <p className="text-xs text-neutral-600 font-bold mt-1">
                Untuk pertanyaan teknis, kendala data, dan verifikasi akun
              </p>
              <span className="text-[11px] font-mono font-black text-neutral-800 underline mt-1.5 block">
                support@nordenfinance.site
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* App Version & Build Footer */}
      <div className="pt-2 pb-6 text-center select-none">
        <p className="text-xs font-black uppercase tracking-widest text-black">
          Norden Finance v1.2.0 • Build 2026
        </p>
        <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-1">
          Aplikasi Manajemen Keuangan Pribadi & PWA Standalone • Terenkripsi
        </p>
      </div>
    </div>
  );
}
