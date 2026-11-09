'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, @next/next/no-img-element */

import { useState, useRef } from 'react';
import { 
  ArrowLeft, Check, X, Eye, Loader2, MessageSquare, 
  Users, CreditCard, Search, Activity, Heart, Wallet, Target,
  DollarSign, TrendingUp, HelpCircle, Star, Calendar, RefreshCw,
  Upload, Sliders, Trash2, RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import { 
  approvePaymentRequest, 
  rejectPaymentRequest, 
  updateUserPlanManually, 
  updateUserRoleManually,
  deleteUserAccountByAdmin,
  resetUserFinancialDataByAdmin,
  updateFeedbackStatus,
  updatePaymentSettings,
  updatePricingSettings
} from '../actions/admin';
import { DEFAULT_MONTHLY_PRICE, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from '../../lib/constants';
import { formatCurrency } from '../../lib/format';

interface RequestItem {
  id: string;
  userId: string;
  plan: 'trial' | 'pro';
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string | null;
  fullName: string;
  createdAt: string;
}

interface UserProfileItem {
  id: string;
  userId: string;
  fullName: string;
  role: 'user' | 'admin';
  plan: 'trial' | 'pro';
  trialStartedAt: string;
  trialEndsAt: string;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
}

interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  message: string;
  status: string;
  createdAt: string;
}

interface PlatformStats {
  totalUsers: number;
  proUsers: number;
  trialUsers: number;
  adminUsers: number;
  totalTransactions: number;
  totalBalances: number;
  totalBudgets: number;
  totalSavingGoals: number;
  totalDebts: number;
  totalPaylaters: number;
  totalSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  userGrowth: { date: string; count: number }[];
  isUnavailable?: boolean;
  unavailableMetrics?: {
    users?: boolean;
    transactions?: boolean;
    financials?: boolean;
    revenue?: boolean;
    userGrowth?: boolean;
  };
}

interface PaymentSettings {
  bca_number: string;
  bca_holder: string;
  bca_active: string;
  bni_number: string;
  bni_holder: string;
  bni_active: string;
  qris_image: string;
  qris_active: string;
}

interface PricingPlanView {
  id: string;
  name: string;
  price: number;
  billingType: string | null;
  durationDays: number | null;
  isActive: boolean;
}

interface PricingPlans {
  trial: PricingPlanView | null;
  monthly: PricingPlanView | null;
  yearly: PricingPlanView | null;
}

interface AdminClientProps {
  initialRequests: RequestItem[];
  initialUsers: UserProfileItem[];
  initialAuditLogs: AuditLogItem[];
  initialFeedbacks: FeedbackItem[];
  platformStats: PlatformStats;
  initialPaymentSettings: PaymentSettings;
  initialPricingPlans: PricingPlans;
  currentAdminId: string;
  initialError?: string;
}

export default function AdminClient({ 
  initialRequests, 
  initialUsers, 
  initialAuditLogs, 
  initialFeedbacks,
  platformStats,
  initialPaymentSettings,
  initialPricingPlans,
  currentAdminId,
  initialError
}: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'users' | 'logs' | 'feedbacks' | 'settings'>('overview');
  
  const [requests, setRequests] = useState<RequestItem[]>(initialRequests);
  const [users, setUsers] = useState<UserProfileItem[]>(initialUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Settings States
  const [bcaNumber, setBcaNumber] = useState(initialPaymentSettings.bca_number);
  const [bcaHolder, setBcaHolder] = useState(initialPaymentSettings.bca_holder);
  const [bcaActive, setBcaActive] = useState(initialPaymentSettings.bca_active === 'true');
  const [bniNumber, setBniNumber] = useState(initialPaymentSettings.bni_number);
  const [bniHolder, setBniHolder] = useState(initialPaymentSettings.bni_holder);
  const [bniActive, setBniActive] = useState(initialPaymentSettings.bni_active === 'true');
  const [qrisImage, setQrisImage] = useState(initialPaymentSettings.qris_image);
  const [qrisActive, setQrisActive] = useState(initialPaymentSettings.qris_active === 'true');
  const [trialDays, setTrialDays] = useState(String(initialPricingPlans.trial?.durationDays || DEFAULT_TRIAL_DAYS));
  const [monthlyPrice, setMonthlyPrice] = useState(String(initialPricingPlans.monthly?.price || DEFAULT_MONTHLY_PRICE));
  const [yearlyPrice, setYearlyPrice] = useState(String(initialPricingPlans.yearly?.price || DEFAULT_YEARLY_PRICE));
  const [trialPlanActive, setTrialPlanActive] = useState(Boolean(initialPricingPlans.trial));
  const [monthlyPlanActive, setMonthlyPlanActive] = useState(Boolean(initialPricingPlans.monthly));
  const [yearlyPlanActive, setYearlyPlanActive] = useState(Boolean(initialPricingPlans.yearly));
  
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const qrisFileInputRef = useRef<HTMLInputElement>(null);
  
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Plan Modification Modal States
  const [planModalUserId, setPlanModalUserId] = useState<string | null>(null);
  const [planModalUserName, setPlanModalUserName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'pro'>('pro');
  const [durationOption, setDurationOption] = useState<'30' | '90' | '365' | 'custom'>('30');
  const [customDays, setCustomDays] = useState('30');
  const [deleteModalUser, setDeleteModalUser] = useState<UserProfileItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [resetModalUser, setResetModalUser] = useState<UserProfileItem | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [confirmActionModal, setConfirmActionModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant?: 'primary' | 'danger';
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  
  const [error, setError] = useState(initialError || '');
  const [success, setSuccess] = useState('');

  // Local Counts
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const pricingPreview = {
    trialDays: Number.parseInt(trialDays, 10) || DEFAULT_TRIAL_DAYS,
    monthlyPrice: Number(monthlyPrice) || DEFAULT_MONTHLY_PRICE,
    yearlyPrice: Number(yearlyPrice) || DEFAULT_YEARLY_PRICE,
  };

  const handleApprove = (id: string) => {
    const request = requests.find(r => r.id === id);
    setConfirmActionModal({
      title: 'Setujui Pembayaran?',
      message: request 
        ? `Apakah Anda yakin ingin menyetujui pembayaran dari ${request.fullName || request.userId} sebesar ${formatCurrency(request.amount)} dan meningkatkan akun ke PRO?`
        : 'Apakah Anda yakin ingin menyetujui pembayaran ini?',
      confirmLabel: 'Ya, Setujui',
      variant: 'primary',
      onConfirm: async () => {
        setLoadingId(id);
        setError('');
        setSuccess('');

        try {
          const res = await approvePaymentRequest(id);
          if (res.success) {
            setSuccess('Pembayaran berhasil disetujui dan pengguna ditingkatkan ke PRO.');
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
            
            const targetReq = requests.find(r => r.id === id);
            if (targetReq) {
              setUsers(prev => prev.map(u => u.userId === targetReq.userId ? { ...u, plan: 'pro' } : u));
            }
          } else {
            setError(res.error || 'Gagal menyetujui pembayaran.');
          }
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
        } finally {
          setLoadingId(null);
        }
      },
    });
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId) return;

    setLoadingId(rejectId);
    setError('');
    setSuccess('');

    try {
      const res = await rejectPaymentRequest(rejectId, rejectNote);
      if (res.success) {
        setSuccess('Pembayaran telah ditolak.');
        setRequests(prev => prev.map(r => r.id === rejectId ? { ...r, status: 'rejected', adminNote: rejectNote } : r));
        setRejectId(null);
        setRejectNote('');
      } else {
        setError(res.error || 'Gagal menolak pembayaran.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoadingId(null);
    }
  };

  const openPlanModal = (userId: string, fullName: string, currentPlan: 'trial' | 'pro') => {
    setPlanModalUserId(userId);
    setPlanModalUserName(fullName);
    setSelectedPlan(currentPlan);
    setDurationOption('30');
    setCustomDays('30');
    setError('');
    setSuccess('');
  };

  const handlePlanModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planModalUserId) return;

    setLoadingId(planModalUserId);
    setError('');
    setSuccess('');

    let daysVal = 30;
    if (selectedPlan === 'pro') {
      if (durationOption === 'custom') {
        daysVal = parseInt(customDays) || 30;
      } else {
        daysVal = parseInt(durationOption);
      }
    }

    try {
      const res = await updateUserPlanManually(planModalUserId, selectedPlan, daysVal);
      if (res.success) {
        setSuccess(`Paket pengguna "${planModalUserName}" berhasil diperbarui ke ${selectedPlan.toUpperCase()} (${selectedPlan === 'pro' ? daysVal + ' Hari' : 'Masa Trial'}).`);
        
        const targetUser = users.find(u => u.userId === planModalUserId);
        let newDateStr = new Date().toISOString();
        if (targetUser) {
          let base = new Date();
          if (selectedPlan === 'pro' && targetUser.plan === 'pro') {
            const exp = new Date(targetUser.trialEndsAt);
            if (exp > new Date()) base = exp;
          }
          base.setDate(base.getDate() + daysVal);
          newDateStr = base.toISOString();
        }

        setUsers(prev => prev.map(u => u.userId === planModalUserId ? { 
          ...u, 
          plan: selectedPlan,
          trialEndsAt: newDateStr
        } : u));
        
        setPlanModalUserId(null);
      } else {
        setError(res.error || 'Gagal mengubah paket pengguna.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleRole = (targetUserId: string, currentRole: 'user' | 'admin') => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    const targetUser = users.find(u => u.userId === targetUserId);
    setConfirmActionModal({
      title: `Ubah Role Menjadi ${nextRole.toUpperCase()}?`,
      message: `Apakah Anda yakin ingin mengubah hak akses "${targetUser?.fullName || targetUserId}" menjadi ${nextRole.toUpperCase()}?`,
      confirmLabel: `Ubah ke ${nextRole.toUpperCase()}`,
      variant: nextRole === 'admin' ? 'primary' : 'danger',
      onConfirm: async () => {
        setLoadingId(targetUserId);
        setError('');
        setSuccess('');

        try {
          const res = await updateUserRoleManually(targetUserId, nextRole);
          if (res.success) {
            setSuccess(`Role pengguna berhasil diubah menjadi ${nextRole.toUpperCase()}.`);
            setUsers(prev => prev.map(u => u.userId === targetUserId ? { ...u, role: nextRole } : u));
          } else {
            setError(res.error || 'Gagal mengubah role pengguna.');
          }
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
        } finally {
          setLoadingId(null);
        }
      },
    });
  };

  const openDeleteModal = (targetUser: UserProfileItem) => {
    setDeleteModalUser(targetUser);
    setDeleteConfirmText('');
    setError('');
    setSuccess('');
  };

  const handleDeleteUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalUser) return;
    if (deleteConfirmText !== 'DELETE') {
      setError('Ketik DELETE untuk mengonfirmasi penghapusan akun.');
      return;
    }

    setLoadingId(deleteModalUser.userId);
    setError('');
    setSuccess('');

    try {
      const res = await deleteUserAccountByAdmin(deleteModalUser.userId);
      if (res.success) {
        setUsers(prev => prev.filter(u => u.userId !== deleteModalUser.userId));
        setRequests(prev => prev.filter(r => r.userId !== deleteModalUser.userId));
        setFeedbacks(prev => prev.filter(f => f.userId !== deleteModalUser.userId));
        setAuditLogs(prev => prev.filter(log => log.userId !== deleteModalUser.userId));
        setSuccess(`Akun "${res.deletedName || deleteModalUser.fullName}" dan seluruh data aplikasinya berhasil dihapus.`);
        setDeleteModalUser(null);
        setDeleteConfirmText('');
      } else {
        setError(res.error || 'Gagal menghapus akun pengguna.');
      }
    } catch (err: unknown) {
      console.error('Delete user client error:', err);
      setError('Terjadi gangguan sistem saat memproses penghapusan akun.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleResetUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (resetConfirmText !== 'RESET KEUANGAN') {
      setError('Ketik RESET KEUANGAN untuk mengonfirmasi reset data keuangan pengguna.');
      return;
    }

    setResetLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await resetUserFinancialDataByAdmin(resetModalUser.userId);
      if (res.success) {
        setSuccess(`Data keuangan pengguna "${res.targetName || resetModalUser.fullName}" berhasil di-reset.`);
        setResetModalUser(null);
        setResetConfirmText('');
      } else {
        setError(res.error || 'Gagal mereset data keuangan pengguna.');
      }
    } catch (err: unknown) {
      console.error('Reset financial client error:', err);
      setError('Terjadi gangguan sistem saat memproses reset data keuangan pengguna.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleToggleFeedback = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'reviewed' ? 'open' : 'reviewed';
    setLoadingId(id);
    setError('');
    setSuccess('');

    try {
      const res = await updateFeedbackStatus(id, nextStatus);
      if (res.success) {
        setSuccess(`Umpan balik berhasil diubah menjadi ${nextStatus.toUpperCase()}.`);
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: nextStatus } : f));
      } else {
        setError(res.error || 'Gagal merubah status umpan balik.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoadingId(null);
    }
  };

  const handleQRISUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file QRIS maksimal adalah 5MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Gambar QRIS harus berupa file gambar.');
      return;
    }

    setUpdatingSettings(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await fetch('/api/upload/qris', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json().catch(() => ({}));
      if (!uploadResponse.ok || !uploadData.imageUrl) {
        throw new Error(uploadData.error || 'Gagal mengunggah QRIS.');
      }
      setQrisImage(uploadData.imageUrl);
      setSuccess('Gambar QRIS berhasil diunggah! Klik Simpan untuk memperbarui pengaturan.');
    } catch (err: unknown) {
      console.error('QRIS upload error:', err);
      const rawMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
      if (
        rawMessage.includes('SUPABASE_SECRET_KEY') ||
        rawMessage.includes('SUPABASE_SERVICE_ROLE_KEY') ||
        rawMessage.includes('SUPABASE_URL')
      ) {
        setError('Konfigurasi Supabase Storage belum lengkap pada deployment ini. Pastikan environment variables Supabase terpasang di Vercel.');
      } else {
        setError('Gagal mengunggah gambar QRIS. Periksa koneksi dan coba lagi.');
      }
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    setError('');
    setSuccess('');

    try {
      const res = await updatePaymentSettings({
        bca_number: bcaNumber,
        bca_holder: bcaHolder,
        bca_active: bcaActive ? 'true' : 'false',
        bni_number: bniNumber,
        bni_holder: bniHolder,
        bni_active: bniActive ? 'true' : 'false',
        qris_image: qrisImage,
        qris_active: qrisActive ? 'true' : 'false',
      });

      if (res.success) {
        setSuccess('Pengaturan pembayaran berhasil diperbarui!');
      } else {
        setError(res.error || 'Gagal memperbarui pengaturan pembayaran.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSavePricingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingSettings(true);
    setError('');
    setSuccess('');

    try {
      const res = await updatePricingSettings({
        trial_days: Number(trialDays),
        monthly_price: Number(monthlyPrice),
        yearly_price: Number(yearlyPrice),
        trial_active: trialPlanActive,
        monthly_active: monthlyPlanActive,
        yearly_active: yearlyPlanActive,
      });

      if (res.success) {
        setSuccess('Pengaturan harga berhasil diperbarui!');
      } else {
        setError(res.error || 'Gagal memperbarui pengaturan harga.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-none text-black">
      
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-2 border-[2px] border-black bg-white text-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50 font-black text-xs uppercase tracking-wider transition-all mb-3"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3px]" /> Kembali ke Dasbor
          </Link>
          <h1 className="text-2xl font-black text-black uppercase tracking-wider flex items-center gap-2">
            <BrandLogo variant="icon" theme="light" className="h-9 w-9 shrink-0" /> Panel Admin Norden
          </h1>
        </div>

        {/* Global Statistics Cards */}
        <div className="flex flex-wrap gap-4">
          <div className="border-[2px] border-black p-3 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center min-w-[90px]">
            <p className="text-lg font-black text-black">{platformStats.isUnavailable || platformStats.unavailableMetrics?.revenue ? '-' : formatCurrency(platformStats.totalRevenue)}</p>
            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mt-0.5">Total Revenue</p>
          </div>
          <div className="border-[2px] border-black p-3 bg-[#bbf7d0] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center min-w-[90px]">
            <p className="text-lg font-black text-black">{platformStats.isUnavailable || platformStats.unavailableMetrics?.users ? '-' : platformStats.proUsers}</p>
            <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mt-0.5">Pro User</p>
          </div>
          <div className="border-[2px] border-black p-3 bg-[#fef08a] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center min-w-[90px]">
            <p className="text-lg font-black text-black">{pendingCount}</p>
            <p className="text-[9px] font-black text-yellow-800 uppercase tracking-widest mt-0.5">Pending</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border-[2px] border-black text-red-700 font-bold text-xs uppercase tracking-wider">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-100 border-[2px] border-black text-emerald-800 font-bold text-xs uppercase tracking-wider">
          ✅ {success}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b-[3px] border-black pb-1">
        <button
          onClick={() => { setActiveTab('overview'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 border-[3px] border-black font-black text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview' 
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          <Activity className="w-4 h-4" /> Ikhtisar Sistem
        </button>
        <button
          onClick={() => { setActiveTab('payments'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 border-[3px] border-black font-black text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'payments' 
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Verifikasi Pembayaran ({pendingCount})
        </button>
        <button
          onClick={() => { setActiveTab('users'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 border-[3px] border-black font-black text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'users' 
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          <Users className="w-4 h-4" /> Manajemen Pengguna ({users.length})
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 border-[3px] border-black font-black text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'logs' 
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Log Audit Admin
        </button>
        <button
          onClick={() => { setActiveTab('feedbacks'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 border-[3px] border-black font-black text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'feedbacks' 
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          <Star className="w-4 h-4" /> Feedback Pengguna ({feedbacks.length})
        </button>
        <button
          onClick={() => { setActiveTab('settings'); setError(''); setSuccess(''); }}
          className={`px-4 py-2 border-[3px] border-black font-black text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings' 
              ? 'bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
              : 'bg-white text-black hover:bg-neutral-50'
          }`}
        >
          <Sliders className="w-4 h-4" /> Pengaturan Pembayaran
        </button>
      </div>

      {/* TAB 1: System Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="brutal-card p-4 bg-white text-black">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black uppercase text-neutral-600">Total Transaksi</p>
                  <h4 className="text-2xl font-black mt-1 text-black">{platformStats.isUnavailable || platformStats.unavailableMetrics?.transactions ? '-' : platformStats.totalTransactions}</h4>
                </div>
                <Activity className="w-8 h-8 text-neutral-400 stroke-[2px]" />
              </div>
            </div>
            
            <div className="brutal-card p-4 bg-white text-black">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black uppercase text-neutral-600">Akun Finansial</p>
                  <h4 className="text-2xl font-black mt-1 text-black">{platformStats.isUnavailable || platformStats.unavailableMetrics?.financials ? '-' : platformStats.totalBalances}</h4>
                </div>
                <Wallet className="w-8 h-8 text-neutral-400 stroke-[2px]" />
              </div>
            </div>

            <div className="brutal-card p-4 bg-white text-black">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black uppercase text-neutral-600">Anggaran Aktif</p>
                  <h4 className="text-2xl font-black mt-1 text-black">{platformStats.isUnavailable || platformStats.unavailableMetrics?.financials ? '-' : platformStats.totalBudgets}</h4>
                </div>
                <Target className="w-8 h-8 text-neutral-400 stroke-[2px]" />
              </div>
            </div>

            <div className="brutal-card p-4 bg-white text-black">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-black uppercase text-neutral-600">Tabungan & Hutang</p>
                  <h4 className="text-2xl font-black mt-1 text-black">{platformStats.isUnavailable || platformStats.unavailableMetrics?.financials ? '-' : platformStats.totalSavingGoals + platformStats.totalDebts}</h4>
                </div>
                <DollarSign className="w-8 h-8 text-neutral-400 stroke-[2px]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Distribution breakdown */}
            <div className="brutal-card p-6 bg-white space-y-4 text-black">
              <h3 className="text-sm font-black uppercase text-black">Detail Pembayaran & Pendapatan</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1 text-black">
                    <span>Approved payments ({platformStats.isUnavailable || platformStats.unavailableMetrics?.revenue ? '-' : platformStats.approvedPayments})</span>
                    <span>{platformStats.isUnavailable || platformStats.unavailableMetrics?.revenue ? '-' : formatCurrency(platformStats.totalRevenue)}</span>
                  </div>
                  <div className="w-full h-3 border-[2px] border-black bg-neutral-100">
                    <div 
                      className="h-full bg-[#bbf7d0]" 
                      style={{ 
                        width: `${!platformStats.isUnavailable && !platformStats.unavailableMetrics?.revenue && platformStats.approvedPayments + platformStats.rejectedPayments + platformStats.pendingPayments > 0
                          ? (platformStats.approvedPayments / (platformStats.approvedPayments + platformStats.rejectedPayments + platformStats.pendingPayments)) * 100
                          : 0}%`
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1 text-black">
                    <span>Pending payments ({platformStats.isUnavailable || platformStats.unavailableMetrics?.revenue ? '-' : platformStats.pendingPayments})</span>
                    <span>{platformStats.isUnavailable || platformStats.unavailableMetrics?.revenue ? '-' : `${platformStats.pendingPayments} Permohonan`}</span>
                  </div>
                  <div className="w-full h-3 border-[2px] border-black bg-neutral-100">
                    <div 
                      className="h-full bg-[#fef08a]" 
                      style={{ 
                        width: `${!platformStats.isUnavailable && !platformStats.unavailableMetrics?.revenue && platformStats.approvedPayments + platformStats.rejectedPayments + platformStats.pendingPayments > 0
                          ? (platformStats.pendingPayments / (platformStats.approvedPayments + platformStats.rejectedPayments + platformStats.pendingPayments)) * 100
                          : 0}%`
                      }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold uppercase mb-1 text-black">
                    <span>Rejected payments ({platformStats.isUnavailable || platformStats.unavailableMetrics?.revenue ? '-' : platformStats.rejectedPayments})</span>
                    <span>{platformStats.isUnavailable || platformStats.unavailableMetrics?.revenue ? '-' : `${platformStats.rejectedPayments} Permohonan`}</span>
                  </div>
                  <div className="w-full h-3 border-[2px] border-black bg-neutral-100">
                    <div 
                      className="h-full bg-red-200" 
                      style={{ 
                        width: `${!platformStats.isUnavailable && !platformStats.unavailableMetrics?.revenue && platformStats.approvedPayments + platformStats.rejectedPayments + platformStats.pendingPayments > 0
                          ? (platformStats.rejectedPayments / (platformStats.approvedPayments + platformStats.rejectedPayments + platformStats.pendingPayments)) * 100
                          : 0}%`
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Growth Graph Visualizer */}
            <div className="brutal-card p-6 bg-white space-y-4 text-black">
              <h3 className="text-sm font-black uppercase text-black">Statistik & Pertumbuhan Pengguna</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-[2px] border-black p-4 bg-neutral-50 text-center">
                  <p className="text-xs font-black uppercase text-neutral-500">Masa Trial</p>
                  <p className="text-xl font-black text-black mt-1">{platformStats.isUnavailable || platformStats.unavailableMetrics?.users ? '-' : platformStats.trialUsers}</p>
                </div>
                <div className="border-[2px] border-black p-4 bg-[#bbf7d0] text-center">
                  <p className="text-xs font-black uppercase text-neutral-500">Pro Subscriptions</p>
                  <p className="text-xl font-black text-emerald-950 mt-1">{platformStats.isUnavailable || platformStats.unavailableMetrics?.users ? '-' : platformStats.proUsers}</p>
                </div>
              </div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase leading-tight italic">
                * Data statistik platform Norden diperbarui secara otomatis setiap kali ada pendaftaran atau transaksi pengguna.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Payment Requests */}
      {activeTab === 'payments' && (
        <div className="brutal-card p-6 bg-white text-black">
          <h3 className="text-base font-black text-black uppercase tracking-wider mb-6">Bukti Transfer & Persetujuan Paket</h3>
          
          {requests.length === 0 ? (
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider py-8 text-center">Tidak ada data pengajuan pembayaran.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-[2px] border-black">
                <thead>
                  <tr className="bg-[#f3f4f6] border-b-[2px] border-black">
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Pemohon</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Paket / Nominal</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Metode</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black text-center">Bukti</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Status</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b-[2px] border-black last:border-b-0 hover:bg-[#fafafa] font-bold text-xs uppercase tracking-wide">
                      <td className="p-3 border-r-[2px] border-black">
                        <p className="font-black text-black">{req.fullName}</p>
                        <p className="text-[9px] text-neutral-500 font-mono break-all leading-tight">{req.userId}</p>
                      </td>
                      <td className="p-3 border-r-[2px] border-black">
                        <p className="font-black text-black">PRO {req.billingType}</p>
                        <p className="text-[10px] text-neutral-500">{formatCurrency(req.amount)}</p>
                      </td>
                      <td className="p-3 border-r-[2px] border-black text-black">{req.paymentMethod}</td>
                      <td className="p-3 border-r-[2px] border-black text-center">
                        <button
                          onClick={() => setSelectedProof(req.proofPath)}
                          className="px-2.5 py-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 text-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-black" /> Lihat
                        </button>
                      </td>
                      <td className="p-3 border-r-[2px] border-black">
                        <span className={`px-2 py-0.5 text-[9px] font-black border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                          req.status === 'approved' ? 'bg-[#bbf7d0] text-black' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-[#fef08a] text-black'
                        }`}>
                          {req.status}
                        </span>
                        {req.adminNote && (
                          <p className="text-[9px] text-red-700 mt-2 normal-case italic font-medium leading-tight">Note: {req.adminNote}</p>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {req.status === 'pending' ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={loadingId !== null}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border-[2px] border-black bg-[#bbf7d0] hover:bg-emerald-200 text-black disabled:opacity-50 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider cursor-pointer"
                              title="Setujui pembayaran dan aktifkan paket Pro"
                            >
                              {loadingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> : <Check className="w-3.5 h-3.5 text-black stroke-[3px]" />}
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => setRejectId(req.id)}
                              disabled={loadingId !== null}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border-[2px] border-black bg-red-100 hover:bg-red-200 text-red-800 disabled:opacity-50 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider cursor-pointer"
                              title="Tolak pembayaran dengan catatan alasan"
                            >
                              <X className="w-3.5 h-3.5 text-red-700 stroke-[3px]" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-black uppercase">SELESAI</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Users Management */}
      {activeTab === 'users' && (
        <div className="brutal-card p-6 bg-white space-y-6 text-black">
          {/* Search bar */}
          <div className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400 stroke-[2.5px]" />
              <input
                type="text"
                placeholder="CARI NAMA ATAU UID PENGGUNA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border-[3px] border-black bg-white text-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-xs uppercase placeholder:text-neutral-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border-[2px] border-black">
              <thead>
                <tr className="bg-[#f3f4f6] border-b-[2px] border-black">
                  <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Profil Pengguna</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Plan Aktif</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Role</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Berlaku Sampai</th>
                  <th className="p-3 text-[10px] font-black uppercase text-black text-center">Ubah Data Pengguna</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = u.userId === currentAdminId;
                  return (
                    <tr key={u.id} className="border-b-[2px] border-black last:border-b-0 hover:bg-[#fafafa] font-bold text-xs uppercase tracking-wide">
                      <td className="p-3 border-r-[2px] border-black">
                        <p className="font-black text-black">{u.fullName}</p>
                        <p className="text-[9px] text-neutral-500 font-mono break-all leading-tight">{u.userId}</p>
                      </td>
                      
                      <td className="p-3 border-r-[2px] border-black">
                        <span className={`px-2 py-0.5 border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                          u.plan === 'pro' ? 'bg-[#bbf7d0] text-black' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {u.plan}
                        </span>
                      </td>

                      <td className="p-3 border-r-[2px] border-black">
                        <span className={`px-2 py-0.5 border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                          u.role === 'admin' ? 'bg-[#fef08a] text-black' : 'bg-white text-black'
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3 border-r-[2px] border-black text-neutral-500">
                        {u.plan === 'pro' ? (
                          new Date(u.trialEndsAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        ) : (
                          'Masa Trial'
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            onClick={() => openPlanModal(u.userId, u.fullName, u.plan)}
                            disabled={loadingId !== null}
                            className="px-2.5 py-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 text-black disabled:opacity-50 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider cursor-pointer"
                          >
                            {loadingId === u.userId ? <Loader2 className="w-3 h-3 animate-spin text-black" /> : 'UBAH PAKET / DURASI'}
                          </button>
                          <button
                            onClick={() => handleToggleRole(u.userId, u.role)}
                            disabled={loadingId !== null || isSelf}
                            className={`px-2.5 py-1.5 border-[2px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-30 ${
                              u.role === 'admin' ? 'bg-red-100 hover:bg-red-200 text-red-750' : 'bg-[#fef08a] hover:bg-[#fde047] text-black'
                            }`}
                            title={isSelf ? 'Anda tidak bisa mendegradasi role Anda sendiri' : ''}
                          >
                            {u.role === 'admin' ? 'DEMOTE' : 'PROMOTE ADMIN'}
                          </button>
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setResetConfirmText('');
                              setError('');
                              setSuccess('');
                            }}
                            disabled={loadingId !== null || resetLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border-[2px] border-black bg-amber-100 hover:bg-amber-200 text-amber-950 disabled:opacity-30 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider cursor-pointer"
                            title="Reset data keuangan pengguna tanpa menghapus akun"
                          >
                            <RotateCcw className="w-3 h-3 stroke-[3px]" />
                            Reset Keuangan
                          </button>
                          <button
                            onClick={() => openDeleteModal(u)}
                            disabled={loadingId !== null || isSelf}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border-[2px] border-black bg-red-100 hover:bg-red-200 text-red-700 disabled:opacity-30 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider cursor-pointer"
                            title={isSelf ? 'Anda tidak bisa menghapus akun yang sedang digunakan' : 'Hapus akun dan seluruh data pengguna'}
                          >
                            {loadingId === u.userId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 stroke-[3px]" />}
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="brutal-card p-6 bg-white space-y-4 text-black">
          <h3 className="text-base font-black text-black uppercase tracking-wider mb-2">Log Audit Keamanan & Tindakan Admin</h3>
          <p className="text-xs text-neutral-500 uppercase font-bold mb-4">Menampilkan hingga 100 tindakan administratif terakhir pada sistem.</p>
          
          {auditLogs.length === 0 ? (
            <p className="text-xs font-bold text-neutral-500 uppercase py-8 text-center">Belum ada riwayat tindakan admin.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border-[2px] border-black">
                <thead>
                  <tr className="bg-[#f3f4f6] border-b-[2px] border-black">
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Waktu</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Pelaku</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black border-r-[2px] border-black">Tindakan / Event</th>
                    <th className="p-3 text-[10px] font-black uppercase text-black">Target Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b-[2px] border-black last:border-b-0 hover:bg-[#fafafa] font-bold text-xs uppercase tracking-wide">
                      <td className="p-3 border-r-[2px] border-black text-neutral-500">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 border-r-[2px] border-black text-black font-black">
                        {log.userName}
                      </td>
                      <td className="p-3 border-r-[2px] border-black">
                        <span className="bg-neutral-100 border-[2px] border-black px-1.5 py-0.5 font-mono text-[10px] text-black font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-600">
                        {log.entity} {log.entityId && <span className="font-mono text-[9px] text-neutral-400">({log.entityId})</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: User Feedback */}
      {activeTab === 'feedbacks' && (
        <div className="brutal-card p-6 bg-white space-y-4 text-black">
          <h3 className="text-base font-black text-black uppercase tracking-wider mb-6">Umpan Balik & Masukan Pengguna</h3>

          {feedbacks.length === 0 ? (
            <p className="text-xs font-bold text-neutral-500 uppercase py-8 text-center">Tidak ada data feedback dari pengguna.</p>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="border-[3px] border-black p-4 bg-neutral-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs uppercase text-black">{fb.userName}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">({fb.userId})</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black border-[2px] border-black ${
                        fb.status === 'reviewed' ? 'bg-[#bbf7d0] text-black' : 'bg-[#fef08a] text-black'
                      }`}>
                        {fb.status}
                      </span>
                    </div>
                    
                    {/* Stars Rating representation */}
                    <div className="flex text-yellow-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < fb.rating ? 'fill-yellow-400 text-yellow-500' : 'text-neutral-200'}`} 
                        />
                      ))}
                    </div>

                    <p className="text-xs font-bold text-neutral-700 normal-case leading-relaxed">
                      "{fb.message}"
                    </p>
                    <p className="text-[9px] text-neutral-400 font-bold uppercase">
                      Dikirim pada: {new Date(fb.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={() => handleToggleFeedback(fb.id, fb.status)}
                      disabled={loadingId !== null}
                      className="px-3 py-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 text-black disabled:opacity-50 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {fb.status === 'reviewed' ? 'Tandai Open' : 'Tandai Dibaca / Selesai'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Payment Settings */}
      {activeTab === 'settings' && (
        <div className="brutal-card p-6 bg-white space-y-6 text-black">
          <div>
            <h3 className="text-base font-black text-black uppercase tracking-wider mb-2">Konfigurasi Produk & Pembayaran</h3>
            <p className="text-xs text-neutral-500 uppercase font-bold">Sesuaikan harga paket, durasi trial, rekening BCA, BNI, dan QRIS Norden Finance.</p>
          </div>

          <form onSubmit={handleSavePricingSettings} className="space-y-6 border-[3px] border-black bg-[#fef08a] p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex flex-col gap-2 border-b-[2px] border-black pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-black text-black uppercase text-sm">Pricing & Trial Defaults</h4>
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">Fallback ini menjaga pricing tetap valid saat database belum lengkap.</p>
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider text-black">
                Preview: {formatCurrency(pricingPreview.monthlyPrice)} / bulan
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className={`border-[3px] border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${trialPlanActive ? '' : 'opacity-60'}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-black">Trial Plan</h5>
                  <button
                    type="button"
                    onClick={() => setTrialPlanActive(!trialPlanActive)}
                    className={`border-[2px] border-black px-2 py-0.5 text-[9px] font-black uppercase ${trialPlanActive ? 'bg-[#bbf7d0] text-black' : 'bg-red-100 text-red-700'}`}
                  >
                    {trialPlanActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <label className="text-[10px] font-black uppercase text-black">Durasi Trial</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  className="mt-2 w-full border-[2px] border-black bg-white p-2 text-xs font-bold text-black"
                />
                <p className="mt-2 text-[10px] font-bold uppercase text-neutral-600">{pricingPreview.trialDays} hari gratis akses penuh</p>
              </div>

              <div className={`border-[3px] border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${monthlyPlanActive ? '' : 'opacity-60'}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-black">Pro Monthly</h5>
                  <button
                    type="button"
                    onClick={() => setMonthlyPlanActive(!monthlyPlanActive)}
                    className={`border-[2px] border-black px-2 py-0.5 text-[9px] font-black uppercase ${monthlyPlanActive ? 'bg-[#bbf7d0] text-black' : 'bg-red-100 text-red-700'}`}
                  >
                    {monthlyPlanActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <label className="text-[10px] font-black uppercase text-black">Harga Bulanan</label>
                <input
                  type="number"
                  min="0"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  className="mt-2 w-full border-[2px] border-black bg-white p-2 text-xs font-bold text-black"
                />
                <p className="mt-2 text-[10px] font-bold uppercase text-neutral-600">{formatCurrency(pricingPreview.monthlyPrice)} / bulan</p>
              </div>

              <div className={`border-[3px] border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${yearlyPlanActive ? '' : 'opacity-60'}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h5 className="text-xs font-black uppercase tracking-wider text-black">Pro Yearly</h5>
                  <button
                    type="button"
                    onClick={() => setYearlyPlanActive(!yearlyPlanActive)}
                    className={`border-[2px] border-black px-2 py-0.5 text-[9px] font-black uppercase ${yearlyPlanActive ? 'bg-[#bbf7d0] text-black' : 'bg-red-100 text-red-700'}`}
                  >
                    {yearlyPlanActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>
                <label className="text-[10px] font-black uppercase text-black">Harga Tahunan</label>
                <input
                  type="number"
                  min="0"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                  className="mt-2 w-full border-[2px] border-black bg-white p-2 text-xs font-bold text-black"
                />
                <p className="mt-2 text-[10px] font-bold uppercase text-neutral-600">{formatCurrency(pricingPreview.yearlyPrice)} / tahun</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingSettings}
              className="w-full py-3 brutal-btn font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {updatingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SIMPAN PENGATURAN HARGA'}
            </button>
          </form>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BCA Settings */}
              <div className={`p-4 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4 transition-all ${
                bcaActive ? 'bg-neutral-50' : 'bg-neutral-100 opacity-60'
              }`}>
                <div className="flex justify-between items-center border-b-[2px] border-black pb-2">
                  <h4 className="font-black text-black uppercase text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Bank BCA
                  </h4>
                  <button
                    type="button"
                    onClick={() => setBcaActive(!bcaActive)}
                    className={`px-2 py-0.5 border-[2px] border-black text-[9px] font-black uppercase tracking-wider rounded-none transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                      bcaActive ? 'bg-[#bbf7d0] text-black' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {bcaActive ? 'AKTIF' : 'NON-AKTIF'}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black">Nomor Rekening</label>
                  <input
                    type="text"
                    value={bcaNumber}
                    onChange={(e) => setBcaNumber(e.target.value)}
                    className="w-full p-2 border-[2px] border-black rounded-none bg-white text-black font-bold text-xs"
                    required={bcaActive}
                    disabled={!bcaActive}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    value={bcaHolder}
                    onChange={(e) => setBcaHolder(e.target.value)}
                    className="w-full p-2 border-[2px] border-black rounded-none bg-white text-black font-bold text-xs"
                    required={bcaActive}
                    disabled={!bcaActive}
                  />
                </div>
              </div>

              {/* BNI Settings */}
              <div className={`p-4 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4 transition-all ${
                bniActive ? 'bg-neutral-50' : 'bg-neutral-100 opacity-60'
              }`}>
                <div className="flex justify-between items-center border-b-[2px] border-black pb-2">
                  <h4 className="font-black text-black uppercase text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Bank BNI
                  </h4>
                  <button
                    type="button"
                    onClick={() => setBniActive(!bniActive)}
                    className={`px-2 py-0.5 border-[2px] border-black text-[9px] font-black uppercase tracking-wider rounded-none transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                      bniActive ? 'bg-[#bbf7d0] text-black' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {bniActive ? 'AKTIF' : 'NON-AKTIF'}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black">Nomor Rekening</label>
                  <input
                    type="text"
                    value={bniNumber}
                    onChange={(e) => setBniNumber(e.target.value)}
                    className="w-full p-2 border-[2px] border-black rounded-none bg-white text-black font-bold text-xs"
                    required={bniActive}
                    disabled={!bniActive}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    value={bniHolder}
                    onChange={(e) => setBniHolder(e.target.value)}
                    className="w-full p-2 border-[2px] border-black rounded-none bg-white text-black font-bold text-xs"
                    required={bniActive}
                    disabled={!bniActive}
                  />
                </div>
              </div>
            </div>

            {/* QRIS Settings */}
            <div className={`p-4 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4 transition-all ${
              qrisActive ? 'bg-neutral-50' : 'bg-neutral-100 opacity-60'
            }`}>
              <div className="flex justify-between items-center border-b-[2px] border-black pb-2">
                <h4 className="font-black text-black uppercase text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> QRIS Norden Merchant
                </h4>
                <button
                  type="button"
                  onClick={() => setQrisActive(!qrisActive)}
                  className={`px-2 py-0.5 border-[2px] border-black text-[9px] font-black uppercase tracking-wider rounded-none transition-all shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] cursor-pointer ${
                    qrisActive ? 'bg-[#bbf7d0] text-black' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {qrisActive ? 'AKTIF' : 'NON-AKTIF'}
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 bg-white p-3 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
                  {qrisImage ? (
                    <img src={qrisImage} alt="QRIS Merchant" className="max-w-[150px] max-h-[150px] object-contain border-[1px] border-neutral-300" />
                  ) : (
                    <div className="w-[140px] h-[140px] flex items-center justify-center border-[2px] border-dashed border-neutral-300 text-[10px] font-black text-neutral-400 uppercase">
                      Default QRIS SVG
                    </div>
                  )}
                  <span className="text-[9px] font-black text-black tracking-widest mt-2 uppercase">PRATINJAU QRIS</span>
                </div>

                <div className="space-y-4 flex-1 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-black">Unggah Gambar QRIS Baru</label>
                    <div 
                      onClick={() => qrisActive && qrisFileInputRef.current?.click()}
                      className={`border-[2px] border-dashed border-black bg-white p-6 text-center cursor-pointer hover:bg-neutral-50 transition-all flex flex-col items-center justify-center ${
                        !qrisActive && 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">PILIH FILE QRIS (PNG/JPG)</span>
                      <input
                        type="file"
                        ref={qrisFileInputRef}
                        onChange={handleQRISUpload}
                        accept="image/*"
                        className="hidden"
                        disabled={!qrisActive}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-black">Atau Paste URL Gambar QRIS</label>
                    <input
                      type="text"
                      value={qrisImage}
                      onChange={(e) => setQrisImage(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2 border-[2px] border-black rounded-none bg-white text-black font-bold text-xs"
                      disabled={!qrisActive}
                    />
                  </div>

                  {qrisImage && (
                    <button
                      type="button"
                      onClick={() => setQrisImage('')}
                      className="px-3 py-1.5 border-[2px] border-black bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-none"
                      disabled={!qrisActive}
                    >
                      Gunakan Default QRIS
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingSettings}
              className="w-full py-3 brutal-btn font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {updatingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SIMPAN PENGATURAN PEMBAYARAN'}
            </button>
          </form>
        </div>
      )}

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full relative">
            <button
              onClick={() => setSelectedProof(null)}
              className="absolute top-3 right-3 p-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 rounded-none cursor-pointer"
            >
              <X className="w-4 h-4 text-black stroke-[3px]" />
            </button>
            <h4 className="font-black text-black uppercase tracking-wider mb-4">Bukti Transfer Pengguna</h4>
            <div className="border-[2px] border-black overflow-hidden bg-neutral-100 flex items-center justify-center min-h-[300px]">
              {selectedProof.startsWith('data:') || selectedProof.startsWith('http') ? (
                <img src={selectedProof} alt="Bukti Transfer" className="max-w-full max-h-[450px] object-contain" />
              ) : (
                <p className="text-xs text-neutral-400 font-bold uppercase">Bukti transfer tidak valid atau rusak.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full relative">
            <button
              onClick={() => { setRejectId(null); setRejectNote(''); }}
              className="absolute top-3 right-3 p-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 rounded-none cursor-pointer"
            >
              <X className="w-4 h-4 text-black stroke-[3px]" />
            </button>
            <h4 className="font-black text-black uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-650" /> Tolak Pembayaran
            </h4>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-black">Alasan Penolakan</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full p-2.5 border-[2px] border-black rounded-none focus:outline-none font-bold text-xs uppercase bg-white text-black"
                  placeholder="CONTOH: BUKTI TRANSFER TIDAK TERBACA ATAU NOMINAL KURANG"
                  rows={4}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loadingId !== null}
                className="w-full py-2.5 brutal-btn bg-red-100 text-red-700 font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                KONFIRMASI TOLAK
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md w-full relative">
            <button
              onClick={() => { setDeleteModalUser(null); setDeleteConfirmText(''); }}
              className="absolute top-3 right-3 p-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 rounded-none cursor-pointer"
              disabled={loadingId === deleteModalUser.userId}
            >
              <X className="w-4 h-4 text-black stroke-[3px]" />
            </button>
            <h4 className="font-black text-black uppercase tracking-wider mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-700 stroke-[2.5px]" /> Hapus Akun Pengguna
            </h4>
            <p className="text-xs font-bold text-neutral-600 leading-relaxed mb-4">
              Aksi ini akan menghapus profil, transaksi, wallet, budget, saving goal, hutang, paylater, subscription, reminder, achievement, pembayaran, feedback, dan data aplikasi lain milik pengguna ini.
            </p>

            <div className="border-[2px] border-black bg-red-100 p-3 mb-4">
              <p className="text-xs font-black uppercase tracking-wider text-black">{deleteModalUser.fullName}</p>
              <p className="mt-1 break-all font-mono text-[10px] font-bold text-red-800">{deleteModalUser.userId}</p>
            </div>

            <form onSubmit={handleDeleteUserSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-black">Ketik DELETE untuk konfirmasi</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full p-2.5 border-[2px] border-black rounded-none focus:outline-none font-black text-xs uppercase bg-white text-black"
                  placeholder="DELETE"
                  autoFocus
                  disabled={loadingId === deleteModalUser.userId}
                />
              </div>
              <button
                type="submit"
                disabled={loadingId === deleteModalUser.userId || deleteConfirmText !== 'DELETE'}
                className="w-full py-2.5 border-[3px] border-black bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingId === deleteModalUser.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 stroke-[3px]" />}
                Hapus Akun Permanen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset User Financial Data Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md w-full relative">
            <button
              onClick={() => { setResetModalUser(null); setResetConfirmText(''); }}
              className="absolute top-3 right-3 p-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 rounded-none cursor-pointer"
              disabled={resetLoading}
            >
              <X className="w-4 h-4 text-black stroke-[3px]" />
            </button>
            <h4 className="font-black text-black uppercase tracking-wider mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-600 stroke-[2.5px]" /> Reset Data Keuangan Pengguna
            </h4>
            <p className="text-xs font-bold text-neutral-600 leading-relaxed mb-4">
              Aksi ini akan menghapus seluruh catatan transaksi, dompet, saldo, budget, target tabungan, utang, paylater, bill subscriptions, reminders, dan gamifikasi milik pengguna ini.
            </p>

            <div className="border-[2px] border-black bg-amber-50 p-3 mb-4 space-y-1">
              <p className="text-xs font-black uppercase tracking-wider text-black">{resetModalUser.fullName}</p>
              <p className="break-all font-mono text-[10px] font-bold text-neutral-700">{resetModalUser.userId}</p>
              <p className="text-[10px] font-bold text-emerald-800 uppercase mt-2">
                ✓ Akun login, profil pengguna, status paket ({resetModalUser.plan}), bukti pembayaran, dan log audit TETAP AMAN.
              </p>
            </div>

            <form onSubmit={handleResetUserSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-black">Ketik RESET KEUANGAN untuk konfirmasi</label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full p-2.5 border-[2px] border-black rounded-none focus:outline-none font-black text-xs uppercase bg-white text-black"
                  placeholder="RESET KEUANGAN"
                  autoFocus
                  disabled={resetLoading}
                />
              </div>
              <button
                type="submit"
                disabled={resetLoading || resetConfirmText !== 'RESET KEUANGAN'}
                className="w-full py-2.5 border-[3px] border-black bg-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 stroke-[3px]" />}
                Eksekusi Reset Keuangan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Plan / Duration Modal */}
      {planModalUserId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black p-6 rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full relative">
            <button
              onClick={() => setPlanModalUserId(null)}
              className="absolute top-3 right-3 p-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 rounded-none cursor-pointer"
            >
              <X className="w-4 h-4 text-black stroke-[3px]" />
            </button>
            <h4 className="font-black text-black uppercase tracking-wider mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-black stroke-[2.5px]" /> Ubah Paket & Durasi
            </h4>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-4">
              Pengguna: {planModalUserName}
            </p>

            <form onSubmit={handlePlanModalSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-black">Pilih Paket</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('trial')}
                    className={`py-2 border-[2px] border-black font-black text-xs uppercase rounded-none transition-all cursor-pointer ${
                      selectedPlan === 'trial' ? 'bg-[#fef08a] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                    }`}
                  >
                    TRIAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('pro')}
                    className={`py-2 border-[2px] border-black font-black text-xs uppercase rounded-none transition-all cursor-pointer ${
                      selectedPlan === 'pro' ? 'bg-[#bbf7d0] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                    }`}
                  >
                    PRO
                  </button>
                </div>
              </div>

              {selectedPlan === 'pro' && (
                <div className="space-y-2 border-t-[2px] border-black pt-4">
                  <label className="text-xs font-black uppercase text-black">Pilih Durasi Aktif / Ekstensi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationOption('30')}
                      className={`py-2 border-[2px] border-black font-black text-[10px] uppercase rounded-none transition-all cursor-pointer ${
                        durationOption === '30' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                      }`}
                    >
                      +30 Hari (1 Bln)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationOption('90')}
                      className={`py-2 border-[2px] border-black font-black text-[10px] uppercase rounded-none transition-all cursor-pointer ${
                        durationOption === '90' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                      }`}
                    >
                      +90 Hari (3 Bln)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationOption('365')}
                      className={`py-2 border-[2px] border-black font-black text-[10px] uppercase rounded-none transition-all cursor-pointer ${
                        durationOption === '365' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                      }`}
                    >
                      +365 Hari (1 Thn)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationOption('custom')}
                      className={`py-2 border-[2px] border-black font-black text-[10px] uppercase rounded-none transition-all cursor-pointer ${
                        durationOption === 'custom' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'
                      }`}
                    >
                      Kustom Hari
                    </button>
                  </div>

                  {durationOption === 'custom' && (
                    <div className="space-y-1 mt-2">
                      <label className="text-[10px] font-black uppercase text-neutral-500">Jumlah Hari</label>
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                        className="w-full p-2 border-[2px] border-black rounded-none font-bold text-xs uppercase bg-white text-black"
                        placeholder="MASUKKAN JUMLAH HARI"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingId !== null}
                className="w-full mt-4 py-2.5 brutal-btn bg-black text-white font-black text-xs uppercase tracking-wider cursor-pointer"
              >
                {loadingId === planModalUserId ? 'MEMPROSES...' : 'SIMPAN PERUBAHAN'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Generic Action Confirmation Modal */}
      {confirmActionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-[3px] border-black p-6 max-w-md w-full shadow-[6px_6px_0px_0px_#000] space-y-4 animate-in zoom-in-95">
            <h3 className="font-black text-base uppercase tracking-wider text-black">
              {confirmActionModal.title}
            </h3>
            <p className="text-xs text-neutral-700 font-bold leading-relaxed">
              {confirmActionModal.message}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmActionModal(null)}
                className="brutal-btn-light px-3 py-1.5 text-xs font-black uppercase text-black cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmActionModal.onConfirm;
                  setConfirmActionModal(null);
                  await action();
                }}
                className={`brutal-btn px-4 py-1.5 text-xs font-black uppercase cursor-pointer ${
                  confirmActionModal.variant === 'danger'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-[#FFE066] text-black hover:bg-[#FFD700]'
                }`}
              >
                {confirmActionModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
