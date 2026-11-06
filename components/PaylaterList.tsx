'use client';

import { useMemo, useState } from 'react';
import { Balance, Paylater } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { addPaylater, payPaylaterInstallment, deletePaylater } from '../app/actions';
import { Plus, Trash2, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import WalletSelect, { getActiveWallets } from './WalletSelect';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';

export default function PaylaterList({
  paylaters,
  balances = [],
}: {
  paylaters: Paylater[];
  balances?: Balance[];
}) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [platform, setPlatform] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [tenorMonths, setTenorMonths] = useState('');

  const [payMethod, setPayMethod] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const activeWallets = useMemo(() => getActiveWallets(balances), [balances]);
  const currentPayMethod = activeWallets.some((wallet) => wallet.name === payMethod)
    ? payMethod
    : activeWallets[0]?.name || '';

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    triggerHaptic('medium');
    const amount = parseRupiahInput(totalAmount);
    const tenor = parseInt(tenorMonths.replace(/\D/g, ''), 10);

    if (!itemName.trim() || !platform.trim() || !amount || !tenor) {
      triggerHaptic('warning');
      setError(
        lang === 'id'
          ? 'Harap lengkapi semua kolom dengan benar.'
          : 'Please complete all required fields.'
      );
      return;
    }

    if (tenor <= 0 || tenor > 120) {
      triggerHaptic('warning');
      setError(
        lang === 'id'
          ? 'Tenor harus antara 1 sampai 120 bulan.'
          : 'Tenor must be between 1 and 120 months.'
      );
      return;
    }

    setLoading(true);
    const res = await addPaylater(itemName.trim(), platform.trim(), amount, tenor);
    if (res.success) {
      triggerHaptic('success');
      setShowAdd(false);
      setItemName('');
      setPlatform('');
      setTotalAmount('');
      setTenorMonths('');
      setSuccess(
        lang === 'id'
          ? 'Cicilan paylater berhasil ditambahkan!'
          : 'Installment successfully added!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error ||
          (lang === 'id'
            ? 'Gagal menyimpan cicilan paylater.'
            : 'Failed to save installment.')
      );
    }
    setLoading(false);
  };

  const handlePay = async (id: string) => {
    if (!currentPayMethod.trim()) {
      triggerHaptic('warning');
      setError(
        lang === 'id'
          ? 'Pilih dompet / metode pembayaran terlebih dahulu.'
          : 'Select a wallet / payment method first.'
      );
      return;
    }
    setLoading(true);
    setSuccess(null);
    setError(null);
    triggerHaptic('medium');
    const res = await payPaylaterInstallment(id, currentPayMethod);
    if (res.success) {
      triggerHaptic('success');
      setPayingId(null);
      setPayMethod('');
      setSuccess(
        lang === 'id'
          ? 'Pembayaran cicilan berhasil dicatat!'
          : 'Installment payment recorded successfully!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal membayar cicilan.' : 'Failed to pay installment.')
      );
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    triggerHaptic('medium');
    const res = await deletePaylater(id);
    setLoading(false);
    setConfirmDeleteId(null);
    if (res.success) {
      triggerHaptic('medium');
      setSuccess(
        lang === 'id'
          ? 'Cicilan paylater berhasil dihapus!'
          : 'Installment successfully deleted!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error ||
          (lang === 'id'
            ? 'Gagal menghapus cicilan paylater.'
            : 'Failed to delete installment.')
      );
    }
  };

  const activePaylaters = paylaters.filter((p) => !p.isSettled);
  const settledPaylaters = paylaters.filter((p) => p.isSettled);

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">
          {lang === 'id' ? 'Paylater & Cicilan' : 'Paylater & Installments'}
        </h2>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowAdd(!showAdd);
            setSuccess(null);
          }}
          className="px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 text-black"
          style={{
            backgroundColor: 'var(--theme-accent, #FFE066)',
            color: 'var(--theme-accent-text, #000000)',
          }}
        >
          {showAdd ? (
            lang === 'id' ? (
              'Batal'
            ) : (
              'Cancel'
            )
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[3px]" />
              <span>{lang === 'id' ? 'Tambah Cicilan' : 'Add Installment'}</span>
            </>
          )}
        </button>
      </div>

      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 border-2 border-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4 animate-in fade-in duration-200">
          ❌ {error}
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="mb-6 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 p-4 space-y-4 rounded-xl shadow-[3px_3px_0px_0px_#000] animate-in fade-in duration-200 text-black dark:text-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black mb-1 uppercase tracking-widest">
                {lang === 'id' ? 'Nama Barang / Transaksi' : 'Item / Transaction Name'}
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={lang === 'id' ? 'Contoh: iPhone 15 Pro' : 'E.g.: iPhone 15 Pro'}
                className="w-full brutal-input px-4 py-2 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black mb-1 uppercase tracking-widest">
                {lang === 'id' ? 'Platform' : 'Platform'}
              </label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                placeholder="SPayLater, GoPayLater, Kredivo"
                className="w-full brutal-input px-4 py-2 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black mb-1 uppercase tracking-widest">
                {lang === 'id' ? 'Total Harga (Rp)' : 'Total Price (Rp)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={totalAmount}
                onChange={(e) => setTotalAmount(formatRupiahInput(e.target.value))}
                placeholder="Contoh: 1.500.000"
                className="w-full brutal-input px-4 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black mb-1 uppercase tracking-widest">
                {lang === 'id' ? 'Tenor (Bulan)' : 'Tenor (Months)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={tenorMonths}
                onChange={(e) => setTenorMonths(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 12"
                className="w-full brutal-input px-4 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 border-2 border-black rounded-xl flex justify-center items-center gap-2 cursor-pointer shadow-[2px_2px_0px_0px_#000] text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : lang === 'id' ? (
              'Simpan Cicilan'
            ) : (
              'Save Installment'
            )}
          </button>
        </form>
      )}

      {activePaylaters.length === 0 && settledPaylaters.length === 0 && !showAdd ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-center px-4">
          <div
            className="p-2 border-2 border-black rounded-xl mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <span className="text-lg font-black text-black">💳</span>
          </div>
          <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'id' ? 'Belum ada catatan paylater' : 'No paylater records yet'}
          </p>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
            {lang === 'id'
              ? 'Lacak cicilan belanja paylater Anda (e.g. Shopee Paylater) di sini agar keuangan tetap stabil.'
              : 'Track your paylater installments (e.g. Shopee Paylater) here to keep finances balanced.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowAdd(true);
              setSuccess(null);
            }}
            className="mt-4 px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {lang === 'id' ? '+ Tambah Cicilan Baru' : '+ Add New Installment'}
          </button>
        </div>
      ) : activePaylaters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {activePaylaters.map((p) => {
            const progress = (p.monthsPaid / p.tenorMonths) * 100;
            return (
              <div
                key={p.id}
                className="border-2 border-black dark:border-neutral-700 rounded-xl p-4 bg-white dark:bg-neutral-800 relative group shadow-[3px_3px_0px_0px_#000] text-black dark:text-white"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-wider">
                      {p.itemName}
                    </h3>
                    <p className="text-[10px] font-black border border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-900 px-2 py-0.5 rounded-md inline-block mt-1 uppercase shadow-[1px_1px_0px_0px_#000]">
                      {p.platform}
                    </p>
                  </div>
                  {confirmDeleteId === p.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                        {lang === 'id' ? 'Hapus?' : 'Delete?'}
                      </span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleDelete(p.id)}
                        className="px-2 py-0.5 bg-red-600 text-white border border-black rounded text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] hover:bg-red-700 cursor-pointer"
                      >
                        {lang === 'id' ? 'Ya' : 'Yes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white border border-black text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] hover:bg-neutral-300 rounded cursor-pointer"
                      >
                        {lang === 'id' ? 'Batal' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="text-neutral-400 hover:text-red-500 transition-all p-1.5 cursor-pointer"
                      title={lang === 'id' ? 'Hapus cicilan' : 'Delete installment'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-widest">
                      {lang === 'id' ? 'Cicilan bulanan' : 'Monthly installment'}
                    </p>
                    <p className="font-black text-base sm:text-lg tracking-wider">
                      {maskBalance(formatRupiah(p.installmentAmount))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                      Total: {maskBalance(formatRupiah(p.totalAmount))}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span>
                      {p.monthsPaid} {lang === 'id' ? 'bulan' : 'months'}
                    </span>
                    <span className="text-neutral-400">
                      {p.tenorMonths} {lang === 'id' ? 'bulan' : 'months'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-full h-3 overflow-hidden shadow-[1px_1px_0px_0px_#000]">
                    <div
                      className="bg-[#bfdbfe] dark:bg-blue-600 h-full rounded-full transition-all duration-500 border-r-2 border-black"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {payingId === p.id ? (
                  <div className="flex gap-2 items-center mt-4">
                    <WalletSelect
                      wallets={balances}
                      value={currentPayMethod}
                      onChange={setPayMethod}
                      className="flex-1 brutal-input px-3 py-2 text-xs uppercase font-black"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handlePay(p.id)}
                      disabled={loading || !currentPayMethod}
                      className="px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-lg text-xs font-black uppercase cursor-pointer text-black"
                      style={{
                        backgroundColor: 'var(--theme-accent, #FFE066)',
                        color: 'var(--theme-accent-text, #000000)',
                      }}
                    >
                      {lang === 'id' ? 'Bayar' : 'Pay'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayingId(null)}
                      className="px-3 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase rounded-lg cursor-pointer"
                    >
                      {lang === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setPayingId(p.id);
                    }}
                    className="w-full py-2 mt-4 flex justify-center items-center gap-1.5 text-xs font-black uppercase tracking-wider border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                  >
                    <span>{lang === 'id' ? 'Bayar Bulan Ini' : 'Pay This Month'}</span>
                    <ChevronRight className="w-4 h-4 stroke-[3px]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {settledPaylaters.length > 0 && (
        <div className="mt-8 pt-6 border-t-2 border-black dark:border-neutral-700">
          <h3 className="text-sm font-black mb-4 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'id' ? 'Lunas 🎉' : 'Settled 🎉'}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settledPaylaters.map((p) => (
              <div
                key={p.id}
                className="border-2 border-black dark:border-neutral-700 rounded-xl p-3 bg-neutral-100 dark:bg-neutral-800/60 opacity-70 flex justify-between items-center"
              >
                <div>
                  <h4 className="font-black text-xs uppercase">{p.itemName}</h4>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase">
                    {p.platform} • {formatRupiah(p.totalAmount)}
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">
                  {lang === 'id' ? 'Lunas' : 'Paid'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
