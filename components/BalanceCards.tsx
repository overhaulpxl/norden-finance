'use client';

import { useState, useRef, useEffect } from 'react';
import { Balance } from '../types';
import { formatRupiah, formatMethodName, formatRupiahInput, parseRupiahInput } from '../lib/format';
import {
  ArchiveRestore,
  Loader2,
  Trash2,
  ArrowRightLeft,
  Plus,
  Archive,
  Pencil,
  AlertTriangle,
  X,
  Wallet,
  Building2,
  Smartphone,
  Banknote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  updateBalance,
  deleteBalance,
  restoreBalance,
  deleteBalancePermanently,
  addTransferTransaction,
} from '../app/actions';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';

export default function BalanceCards({ balances }: { balances: Balance[] }) {
  const router = useRouter();
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const [balanceOverrides, setBalanceOverrides] = useState<Record<string, Balance>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals for confirmation
  const [confirmArchiveWallet, setConfirmArchiveWallet] = useState<Balance | null>(null);
  const [confirmDeleteWallet, setConfirmDeleteWallet] = useState<Balance | null>(null);
  const [deletedWalletIds, setDeletedWalletIds] = useState<Set<string>>(new Set());
  const successTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Transfer states
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const localBalances = [
    ...Object.values(balanceOverrides).filter(
      (override) => !balances.some((balance) => balance.id === override.id)
    ),
    ...balances.map((balance) => balanceOverrides[balance.id] || balance),
  ].filter((balance) => !deletedWalletIds.has(balance.id));

  const activeBalances = localBalances.filter((balance) => !balance.archivedAt);
  const archivedBalances = localBalances.filter((balance) => balance.archivedAt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method.trim() || !amount) return;

    setLoading(true);
    setSuccess(null);
    setError(null);
    triggerHaptic('medium');
    const numericAmount = parseRupiahInput(amount);

    const res = await updateBalance(method.trim().toUpperCase(), numericAmount, editingId);
    if (res.success) {
      triggerHaptic('success');
      if ('wallet' in res && res.wallet) {
        setBalanceOverrides((current) => ({ ...current, [res.wallet.id]: res.wallet }));
      }
      setMethod('');
      setAmount('');
      setEditingId(undefined);
      setIsEditing(false);
      setSuccess(
        editingId
          ? lang === 'id'
            ? 'Dompet berhasil diperbarui!'
            : 'Wallet successfully updated!'
          : lang === 'id'
          ? 'Dompet baru berhasil ditambahkan!'
          : 'New wallet successfully added!'
      );
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal update saldo dompet' : 'Failed to update wallet')
      );
    }
    setLoading(false);
  };

  const handleArchive = async (walletId: string) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    triggerHaptic('medium');
    const res = await deleteBalance(walletId);
    setLoading(false);
    setConfirmArchiveWallet(null);
    if (res.success && 'wallet' in res && res.wallet) {
      triggerHaptic('success');
      setBalanceOverrides((current) => ({ ...current, [res.wallet.id]: res.wallet }));
      setSuccess(
        lang === 'id' ? 'Dompet berhasil diarsipkan!' : 'Wallet successfully archived!'
      );
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 4000);
      router.refresh();
    } else if (!res.success) {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal mengarsipkan dompet' : 'Failed to archive wallet')
      );
    }
  };

  const handleDeletePermanent = async (walletId: string) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    triggerHaptic('medium');
    const res = await deleteBalancePermanently(walletId);
    setLoading(false);
    setConfirmDeleteWallet(null);
    if (res.success) {
      triggerHaptic('success');
      setDeletedWalletIds((prev) => {
        const next = new Set(prev);
        next.add(walletId);
        return next;
      });
      setBalanceOverrides((current) => {
        const next = { ...current };
        delete next[walletId];
        return next;
      });
      setSuccess(
        lang === 'id'
          ? 'Dompet berhasil dihapus permanen!'
          : 'Wallet permanently deleted!'
      );
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 4000);
      router.refresh();
    } else {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal menghapus dompet secara permanen' : 'Failed to permanently delete wallet')
      );
    }
  };

  const handleRestore = async (walletId: string) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    triggerHaptic('medium');
    const res = await restoreBalance(walletId);
    setLoading(false);
    if (res.success && 'wallet' in res && res.wallet) {
      triggerHaptic('success');
      setBalanceOverrides((current) => ({ ...current, [res.wallet.id]: res.wallet }));
      setSuccess(
        lang === 'id' ? 'Dompet berhasil dipulihkan!' : 'Wallet successfully restored!'
      );
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else if (!res.success) {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal memulihkan dompet' : 'Failed to restore wallet')
      );
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const source = transferFrom || activeBalances[0]?.name || '';
    const target = transferTo || activeBalances[1]?.name || activeBalances[0]?.name || '';

    if (!source || !target || !transferAmount) return;
    if (source.toLowerCase() === target.toLowerCase()) {
      triggerHaptic('warning');
      setError(
        lang === 'id'
          ? 'Dompet asal dan tujuan tidak boleh sama.'
          : 'Source and destination wallet cannot be the same.'
      );
      return;
    }

    const numericAmount = parseRupiahInput(transferAmount);
    if (numericAmount <= 0) {
      triggerHaptic('warning');
      setError(
        lang === 'id'
          ? 'Nominal transfer harus lebih dari 0'
          : 'Transfer amount must be greater than 0'
      );
      return;
    }

    setTransferLoading(true);
    setError(null);
    setSuccess(null);
    triggerHaptic('medium');

    const res = await addTransferTransaction(
      numericAmount,
      source,
      target,
      transferNote
    );

    setTransferLoading(false);

    if (res.success) {
      triggerHaptic('success');
      setTransferAmount('');
      setTransferNote('');
      setIsTransferring(false);
      setSuccess(
        lang === 'id'
          ? `Transfer ${formatRupiah(numericAmount)} dari ${source} ke ${target} berhasil!`
          : `Successfully transferred ${formatRupiah(numericAmount)} from ${source} to ${target}!`
      );
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else {
      triggerHaptic('warning');
      setError(
        res.error ||
          (lang === 'id'
            ? 'Gagal memproses transfer antar dompet'
            : 'Failed to process wallet transfer')
      );
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'cash') {
      return {
        label: 'CASH',
        icon: <Banknote className="w-3 h-3 stroke-[2.5px]" />,
        className: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-600 dark:border-amber-700',
      };
    }
    if (type === 'ewallet') {
      return {
        label: 'E-WALLET',
        icon: <Smartphone className="w-3 h-3 stroke-[2.5px]" />,
        className: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-600 dark:border-emerald-700',
      };
    }
    return {
      label: 'BANK',
      icon: <Building2 className="w-3 h-3 stroke-[2.5px]" />,
      className: 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-600 dark:border-blue-700',
    };
  };

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black dark:border-neutral-700 pb-4 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-5 h-5 stroke-[2.5px]" />
            <span>{lang === 'id' ? 'Dompet & Rekening Keuangan' : 'Wallets & Financial Accounts'}</span>
          </h3>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-0.5">
            {lang === 'id'
              ? 'Kelola rekening bank, e-wallet, dan uang tunai harian Anda'
              : 'Manage your bank accounts, e-wallets, and daily cash balances'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsTransferring(!isTransferring);
              if (isEditing) setIsEditing(false);
            }}
            disabled={activeBalances.length < 2}
            className="px-3.5 py-2 border-2 border-black dark:border-neutral-700 bg-[#bfdbfe] dark:bg-blue-950/70 hover:bg-blue-200 text-black dark:text-blue-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              activeBalances.length < 2
                ? lang === 'id'
                  ? 'Butuh minimal 2 dompet aktif untuk transfer'
                  : 'Requires at least 2 active wallets to transfer'
                : undefined
            }
          >
            <ArrowRightLeft className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span>
              {isTransferring
                ? lang === 'id'
                  ? 'Tutup Transfer'
                  : 'Close Transfer'
                : lang === 'id'
                ? 'Transfer Antar Dompet'
                : 'Transfer Between Wallets'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsEditing(!isEditing);
              if (isEditing) setEditingId(undefined);
              if (isTransferring) setIsTransferring(false);
            }}
            className="px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3px]" />
            <span>
              {isEditing
                ? lang === 'id'
                  ? 'Batal'
                  : 'Cancel'
                : lang === 'id'
                ? 'Tambah Dompet'
                : 'Add Wallet'}
            </span>
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 border-2 border-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-200">
          ❌ {error}
        </div>
      )}

      {/* Transfer Form */}
      {isTransferring && (
        <form
          onSubmit={handleTransfer}
          className="p-5 border-2 border-black dark:border-neutral-700 bg-[#e0f2fe] dark:bg-neutral-800 space-y-4 rounded-xl shadow-[3px_3px_0px_0px_#000] animate-in fade-in slide-in-from-top-2 text-black dark:text-white"
        >
          <div className="flex items-center gap-2 border-b-2 border-black dark:border-neutral-700 pb-2">
            <ArrowRightLeft className="w-4 h-4 stroke-[2.5px]" />
            <h4 className="text-xs font-black uppercase tracking-wider">
              {lang === 'id'
                ? 'Transfer Saldo / Top-Up Antar Rekening & Dompet'
                : 'Transfer Balance / Top-Up Between Accounts'}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'id' ? 'Dari Dompet (Asal)' : 'From Wallet (Source)'}
              </label>
              <select
                value={transferFrom || (activeBalances[0]?.name ?? '')}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full brutal-input px-3 py-2 text-xs font-black uppercase bg-white dark:bg-neutral-900 cursor-pointer"
                required
              >
                {activeBalances.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({maskBalance(formatRupiah(b.currentBalance))})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'id' ? 'Ke Dompet (Tujuan)' : 'To Wallet (Destination)'}
              </label>
              <select
                value={transferTo || (activeBalances[1]?.name ?? activeBalances[0]?.name ?? '')}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full brutal-input px-3 py-2 text-xs font-black uppercase bg-white dark:bg-neutral-900 cursor-pointer"
                required
              >
                {activeBalances.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name} ({maskBalance(formatRupiah(b.currentBalance))})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'id' ? 'Nominal Transfer (Rp)' : 'Transfer Amount (Rp)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(formatRupiahInput(e.target.value))}
                className="w-full brutal-input px-3 py-2 text-xs font-black uppercase bg-white dark:bg-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'id' ? 'Catatan (Opsional)' : 'Note (Optional)'}
              </label>
              <input
                type="text"
                placeholder={
                  lang === 'id' ? 'Contoh: Top-up GoPay bulanan' : 'E.g.: Monthly GoPay Top-up'
                }
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className="w-full brutal-input px-3 py-2 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsTransferring(false)}
              className="px-4 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              {lang === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={transferLoading}
              className="px-4 py-2 border-2 border-black dark:border-neutral-700 bg-[#bfdbfe] dark:bg-blue-950/70 hover:bg-blue-200 text-black dark:text-blue-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center gap-1.5"
            >
              {transferLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{lang === 'id' ? 'Kirim Saldo' : 'Send Transfer'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Add / Edit Wallet Form */}
      {isEditing && (
        <form
          onSubmit={handleSubmit}
          className="p-5 border-2 border-black dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-850 space-y-4 rounded-xl shadow-[3px_3px_0px_0px_#000] animate-in fade-in slide-in-from-top-2 text-black dark:text-white"
        >
          <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider">
              {editingId
                ? lang === 'id'
                  ? 'Edit Saldo Dompet'
                  : 'Edit Wallet Balance'
                : lang === 'id'
                ? 'Tambah Dompet / Rekening Baru'
                : 'Add New Wallet / Account'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingId(undefined);
              }}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                {lang === 'id' ? 'Nama Dompet / Rekening' : 'Wallet / Account Name'}
              </label>
              <input
                type="text"
                placeholder={
                  lang === 'id'
                    ? 'BCA, Mandiri, GoPay, Tunai...'
                    : 'BCA, Chase, Cash, PayPal...'
                }
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full brutal-input px-3 py-2 text-xs font-black uppercase bg-white dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                {lang === 'id' ? 'Saldo Saat Ini (Rp)' : 'Current Balance (Rp)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
                className="w-full brutal-input px-3 py-2 text-xs font-black uppercase bg-white dark:bg-neutral-900"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingId(undefined);
              }}
              className="px-4 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
            >
              {lang === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] cursor-pointer flex items-center gap-1.5 text-black"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {editingId
                  ? lang === 'id'
                    ? 'Simpan Perubahan'
                    : 'Save Changes'
                  : lang === 'id'
                  ? 'Tambah Dompet'
                  : 'Add Wallet'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Active Wallets Grid */}
      {activeBalances.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl bg-neutral-50 dark:bg-neutral-850">
          <p className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
            {lang === 'id'
              ? 'Tambah dompet baru untuk mulai melacak saldo dan mutasi transaksi Anda.'
              : 'Add a new wallet to start tracking your balances and transactions.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsEditing(true);
              setEditingId(undefined);
            }}
            className="px-4 py-2.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] cursor-pointer inline-flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>{lang === 'id' ? 'Tambah Dompet Baru' : 'Add New Wallet'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {activeBalances.map((b) => {
            const badge = getTypeBadge(b.type);
            return (
              <div
                key={b.id}
                className="brutal-card p-4 sm:p-5 flex flex-col justify-between bg-white dark:bg-neutral-850 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_#000] relative group"
              >
                {/* Card Top: Type Badge & Action Controls */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-black dark:border-neutral-700 rounded-md ${badge.className}`}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(b.id);
                        setMethod(b.name);
                        setAmount(formatRupiahInput(b.currentBalance));
                        setIsEditing(true);
                        setIsTransferring(false);
                      }}
                      className="p-1.5 border border-black dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-[#FFE066] dark:hover:bg-neutral-700 text-black dark:text-white transition-colors cursor-pointer"
                      title={lang === 'id' ? 'Ubah saldo dompet' : 'Edit wallet'}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmArchiveWallet(b)}
                      className="p-1.5 border border-black dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                      title={lang === 'id' ? 'Arsipkan dompet' : 'Archive wallet'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteWallet(b)}
                      className="p-1.5 border border-black dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-red-200 dark:hover:bg-red-950 text-red-700 dark:text-red-400 transition-colors cursor-pointer"
                      title={lang === 'id' ? 'Hapus permanen dompet' : 'Permanently delete wallet'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Body: Name & Balance */}
                <div className="space-y-1 my-1">
                  <h4 className="text-sm sm:text-base text-black dark:text-white uppercase font-black tracking-wide truncate">
                    {formatMethodName(b.name)}
                  </h4>
                  <div className="text-lg sm:text-xl font-black text-black dark:text-white tracking-tight">
                    {maskBalance(formatRupiah(b.currentBalance))}
                  </div>
                </div>

                {/* Card Footer: Quick edit action text */}
                <div className="pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-750 mt-2 flex items-center justify-between text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <span>{lang === 'id' ? 'Klik edit untuk ubah' : 'Edit to adjust'}</span>
                  <span className="text-[9px] font-black opacity-60">NORDEN</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Archived Wallets Section */}
      {archivedBalances.length > 0 && (
        <div className="mt-8 border-t-2 border-black dark:border-neutral-700 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Archive className="w-4 h-4 stroke-[2.5px]" />
              <span>{lang === 'id' ? 'Dompet Diarsipkan' : 'Archived Wallets'}</span>
            </h4>
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
              {archivedBalances.length} {lang === 'id' ? 'dompet' : 'wallets'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {archivedBalances.map((balance) => (
              <div
                key={balance.id}
                className="border-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/60 p-3.5 rounded-xl opacity-80 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white block truncate">
                      {formatMethodName(balance.name)}
                    </span>
                    <span className="text-xs font-black text-neutral-600 dark:text-neutral-400">
                      {maskBalance(formatRupiah(balance.currentBalance))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRestore(balance.id)}
                      className="border border-black dark:border-neutral-600 bg-white dark:bg-neutral-700 p-1.5 rounded-lg text-black dark:text-white transition-colors hover:bg-[#bbf7d0] dark:hover:bg-emerald-950 cursor-pointer"
                      title={lang === 'id' ? 'Pulihkan dompet' : 'Restore wallet'}
                    >
                      <ArchiveRestore className="h-3.5 w-3.5 stroke-[2.5px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteWallet(balance)}
                      className="border border-black dark:border-neutral-600 bg-white dark:bg-neutral-700 p-1.5 rounded-lg text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-950 cursor-pointer"
                      title={lang === 'id' ? 'Hapus permanen dompet' : 'Permanently delete wallet'}
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[2.5px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Arsip Dompet */}
      {confirmArchiveWallet && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setConfirmArchiveWallet(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_#000] space-y-4 animate-in zoom-in-95 text-black dark:text-white">
            <div className="flex items-center gap-2">
              <div className="p-2 border-2 border-black rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 shadow-[1.5px_1.5px_0px_0px_#000]">
                <Archive className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider">
                  {lang === 'id' ? 'Arsipkan Dompet?' : 'Archive Wallet?'}
                </h3>
                <p className="text-xs font-bold text-neutral-500 uppercase">
                  {formatMethodName(confirmArchiveWallet.name)}
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold leading-relaxed">
              {lang === 'id'
                ? 'Dompet akan disembunyikan dari daftar aktif dan pilihan transaksi, namun seluruh histori transaksi tetap tersimpan utuh dan dompet dapat dipulihkan kapan saja.'
                : 'The wallet will be hidden from the active list, but all historical transaction records remain intact and can be restored anytime.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmArchiveWallet(null)}
                className="px-3.5 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase rounded-xl cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
                disabled={loading}
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleArchive(confirmArchiveWallet.id)}
                disabled={loading}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black border-2 border-black dark:border-neutral-700 text-xs font-black uppercase rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                <span>{lang === 'id' ? 'Ya, Arsipkan' : 'Yes, Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Permanen Dompet */}
      {confirmDeleteWallet && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setConfirmDeleteWallet(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-[6px_6px_0px_0px_#000] space-y-4 animate-in zoom-in-95 text-black dark:text-white">
            <div className="flex items-center gap-2">
              <div className="p-2 border-2 border-black rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 shadow-[1.5px_1.5px_0px_0px_#000]">
                <AlertTriangle className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider text-red-600 dark:text-red-400">
                  {lang === 'id' ? 'Hapus Permanen?' : 'Delete Permanently?'}
                </h3>
                <p className="text-xs font-bold text-neutral-500 uppercase">
                  {formatMethodName(confirmDeleteWallet.name)}
                </p>
              </div>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 dark:border-red-800 rounded-xl space-y-1">
              <p className="text-[11px] text-red-800 dark:text-red-300 font-black uppercase tracking-wide">
                {lang === 'id' ? 'Peringatan Penghapusan:' : 'Deletion Notice:'}
              </p>
              <p className="text-xs text-red-700 dark:text-red-200 font-bold leading-relaxed">
                {lang === 'id'
                  ? 'Data dompet ini akan dihapus permanen dari sistem. Riwayat transaksi masa lalu tetap tersimpan aman tanpa referensi dompet ini.'
                  : 'This wallet will be deleted permanently. Past transaction logs will remain safe without referencing this wallet.'}
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteWallet(null)}
                className="px-3.5 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase rounded-xl cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
                disabled={loading}
              >
                {lang === 'id' ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDeletePermanent(confirmDeleteWallet.id)}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-black dark:border-neutral-700 text-xs font-black uppercase rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{lang === 'id' ? 'Hapus Permanen' : 'Delete Forever'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
