'use client';

import { useState } from 'react';
import { Balance } from '../types';
import { formatRupiah, formatMethodName, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { ArchiveRestore, Loader2, Trash2, ArrowRightLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateBalance, deleteBalance, restoreBalance, addTransferTransaction } from '../app/actions';
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
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

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
  ];

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
      setTimeout(() => setSuccess(null), 5000);
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
    setConfirmArchiveId(null);
    if (res.success && 'wallet' in res && res.wallet) {
      triggerHaptic('success');
      setBalanceOverrides((current) => ({ ...current, [res.wallet.id]: res.wallet }));
      setSuccess(
        lang === 'id' ? 'Dompet berhasil diarsipkan!' : 'Wallet successfully archived!'
      );
      setTimeout(() => setSuccess(null), 4000);
      router.refresh();
    } else if (!res.success) {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal mengarsipkan dompet' : 'Failed to archive wallet')
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
      setTimeout(() => setSuccess(null), 5000);
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

    setTransferLoading(true);
    setError(null);
    setSuccess(null);
    triggerHaptic('medium');

    const numAmount = parseRupiahInput(transferAmount);
    if (numAmount <= 0) {
      triggerHaptic('warning');
      setError(
        lang === 'id' ? 'Nominal transfer harus lebih dari 0.' : 'Transfer amount must be > 0.'
      );
      setTransferLoading(false);
      return;
    }

    const res = await addTransferTransaction(
      numAmount,
      source,
      target,
      transferNote.trim() || undefined
    );

    setTransferLoading(false);

    if (res.success) {
      triggerHaptic('success');
      setSuccess(
        lang === 'id'
          ? `Transfer ${formatRupiah(numAmount)} dari ${source} ke ${target} berhasil dicatat!`
          : `Transfer of ${formatRupiah(numAmount)} from ${source} to ${target} recorded!`
      );
      setIsTransferring(false);
      setTransferAmount('');
      setTransferNote('');
      setTimeout(() => setSuccess(null), 5000);
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

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black dark:border-neutral-700 pb-4 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
            {lang === 'id' ? 'Dompet & Rekening Keuangan' : 'Wallets & Financial Accounts'}
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
            className="px-3.5 py-2 border-2 border-black dark:border-neutral-700 bg-[#bfdbfe] dark:bg-blue-950/70 hover:bg-blue-200 text-black dark:text-blue-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title={
              activeBalances.length < 2
                ? lang === 'id'
                  ? 'Butuh minimal 2 dompet untuk transfer'
                  : 'Need at least 2 wallets to transfer'
                : lang === 'id'
                ? 'Transfer saldo atau top-up antar dompet'
                : 'Transfer balance between wallets'
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
                ? '+ Tambah Dompet'
                : '+ Add Wallet'}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'id' ? 'Nominal Transfer (Rp)' : 'Transfer Amount (Rp)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Rp 100.000"
                value={transferAmount}
                onChange={(e) => setTransferAmount(formatRupiahInput(e.target.value))}
                className="w-full brutal-input px-3 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
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
              className="px-6 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-black"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              {transferLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : lang === 'id' ? (
                'Kirim Transfer'
              ) : (
                'Submit Transfer'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Add / Edit Wallet Form */}
      {isEditing && (
        <form
          onSubmit={handleSubmit}
          className="p-5 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 flex flex-col sm:flex-row gap-3 rounded-xl shadow-[3px_3px_0px_0px_#000] animate-in fade-in slide-in-from-top-2 text-black dark:text-white"
        >
          <input
            type="text"
            placeholder={
              lang === 'id'
                ? 'NAMA DOMPET (CONTOH: BCA, GOPAY, CASH)'
                : 'WALLET NAME (E.G.: BCA, CASH)'
            }
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="flex-1 brutal-input px-3.5 py-2.5 text-xs font-black uppercase bg-white dark:bg-neutral-900"
            required
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder={
              lang === 'id' ? 'NOMINAL SALDO SAAT INI (RP)' : 'CURRENT BALANCE AMOUNT (RP)'
            }
            value={amount}
            onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
            className="flex-1 brutal-input px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-neutral-900"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 border-2 border-black rounded-xl flex justify-center items-center min-w-[120px] disabled:opacity-50 cursor-pointer text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : lang === 'id' ? (
              'Simpan'
            ) : (
              'Save'
            )}
          </button>
        </form>
      )}

      {/* Active Wallets Grid */}
      {(!localBalances || activeBalances.length === 0) && !isEditing ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-center px-4">
          <div
            className="p-2 border-2 border-black rounded-xl mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <span className="text-lg font-black text-black">💳</span>
          </div>
          <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'id' ? 'Belum ada dompet aktif' : 'No active wallets yet'}
          </p>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
            {lang === 'id'
              ? 'Tambah dompet baru untuk mulai melacak saldo & mutasi transaksi Anda.'
              : 'Add a new wallet to start tracking your balances and cashflow.'}
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="mt-4 px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {lang === 'id' ? '+ Tambah Dompet Baru' : '+ Add New Wallet'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {activeBalances.map((b) => (
            <div
              key={b.id}
              className="brutal-card p-4 flex flex-col justify-between bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-750 cursor-pointer relative group border-2 border-black dark:border-neutral-700 rounded-xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white transition-all"
              onClick={() => {
                setEditingId(b.id);
                setMethod(b.name);
                setAmount(formatRupiahInput(b.currentBalance));
                setIsEditing(true);
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 border border-black dark:border-neutral-700 rounded-md bg-[#FAF9F5] dark:bg-neutral-900">
                    {b.type === 'cash' ? 'CASH' : b.type === 'ewallet' ? 'E-WALLET' : 'BANK'}
                  </span>
                  {confirmArchiveId === b.id ? (
                    <div
                      className="flex items-center gap-1 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleArchive(b.id)}
                        className="px-1.5 py-0.5 bg-red-600 text-white border border-black rounded text-[9px] font-black uppercase hover:bg-red-700 cursor-pointer"
                      >
                        {lang === 'id' ? 'Arsipkan' : 'Archive'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmArchiveId(null)}
                        className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white border border-black text-[9px] font-black uppercase hover:bg-neutral-300 rounded cursor-pointer"
                      >
                        {lang === 'id' ? 'Batal' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmArchiveId(b.id);
                      }}
                      className="text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 -mt-1 -mr-1 cursor-pointer"
                      title={
                        lang === 'id'
                          ? `Arsipkan dompet ${formatMethodName(b.name)}`
                          : `Archive wallet ${formatMethodName(b.name)}`
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm text-black dark:text-white uppercase font-black tracking-wider truncate mb-2">
                  {formatMethodName(b.name)}
                </h4>
              </div>
              <span className="text-base sm:text-xl font-black text-black dark:text-white tracking-wide">
                {maskBalance(formatRupiah(b.currentBalance))}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Archived Wallets Section */}
      {archivedBalances.length > 0 && (
        <div className="mt-6 border-t-2 border-black dark:border-neutral-700 pt-5">
          <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {lang === 'id' ? 'Dompet Diarsipkan' : 'Archived Wallets'}
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {archivedBalances.map((balance) => (
              <div
                key={balance.id}
                className="border-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/60 p-3 rounded-xl opacity-75"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white truncate">
                    {formatMethodName(balance.name)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRestore(balance.id)}
                    className="border border-black dark:border-neutral-600 bg-white dark:bg-neutral-700 p-1 rounded text-black dark:text-white transition-colors hover:bg-[#bbf7d0] cursor-pointer"
                    title={lang === 'id' ? 'Pulihkan dompet' : 'Restore wallet'}
                  >
                    <ArchiveRestore className="h-3.5 w-3.5 stroke-[2.5px]" />
                  </button>
                </div>
                <span className="text-sm font-black text-neutral-700 dark:text-neutral-300">
                  {maskBalance(formatRupiah(balance.currentBalance))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
