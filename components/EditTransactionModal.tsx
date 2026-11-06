'use client';

import { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Loader2, Save } from 'lucide-react';
import { updateTransaction } from '../app/actions';
import { addCustomNotification } from '../app/actions/notifications';
import { formatCurrency, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export default function EditTransactionModal({ transaction, onClose }: Props) {
  const { lang } = useLanguage();
  const [form, setForm] = useState({
    type: transaction.type,
    category: transaction.category?.name || 'Lain-lain',
    amount: formatRupiahInput(transaction.amount),
    method: transaction.wallet?.name || 'Lain-lain',
    note: transaction.note || '',
    transaction_date: transaction.transactionDate
      ? typeof transaction.transactionDate === 'string'
        ? transaction.transactionDate.slice(0, 16)
        : transaction.transactionDate.toISOString().slice(0, 16)
      : '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    triggerHaptic('medium');

    const numericAmount = parseRupiahInput(form.amount);

    const res = await updateTransaction(transaction.id, {
      type: form.type as TransactionType,
      category: form.category,
      amount: numericAmount,
      wallet: form.method,
      note: form.note,
      transactionDate: new Date(form.transaction_date).toISOString(),
    });

    if (res.success) {
      triggerHaptic('success');
      setSuccess(
        lang === 'en' ? 'Transaction updated successfully!' : 'Transaksi berhasil diperbarui!'
      );
      await addCustomNotification(
        lang === 'en' ? 'Transaction Updated' : 'Transaksi Diperbarui',
        lang === 'en'
          ? `Transaction of ${formatCurrency(numericAmount)} in ${form.category} has been updated.`
          : `Detail transaksi nominal ${formatCurrency(numericAmount)} kategori ${
              form.category
            } telah berhasil diubah.`,
        'TRANSACTION_EDIT'
      );
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 1200);
    } else {
      triggerHaptic('warning');
      setError(res.error || (lang === 'en' ? 'Failed to save' : 'Gagal menyimpan'));
    }
    setLoading(false);
  };

  const inputClass =
    'w-full brutal-input px-3 py-2 text-xs font-bold uppercase rounded-xl border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white';
  const labelClass =
    'text-[10px] font-black text-black dark:text-neutral-300 mb-1 block uppercase tracking-widest';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl w-full max-w-md shadow-[6px_6px_0px_0px_#000] text-black dark:text-white animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
            {lang === 'en' ? 'Edit Transaction' : 'Edit Transaksi'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{lang === 'en' ? 'Type' : 'Jenis'}</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as TransactionType })
                }
                className="w-full brutal-input px-3 py-2 text-xs font-black uppercase rounded-xl border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white cursor-pointer"
              >
                <option value="masuk">{lang === 'en' ? 'Income' : 'Pemasukan'}</option>
                <option value="keluar">{lang === 'en' ? 'Expense' : 'Pengeluaran'}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{lang === 'en' ? 'Category' : 'Kategori'}</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{lang === 'en' ? 'Amount (Rp)' : 'Nominal (Rp)'}</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: formatRupiahInput(e.target.value) })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                {lang === 'en' ? 'Wallet' : 'Dompet / Metode'}
              </label>
              <input
                type="text"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{lang === 'en' ? 'Note' : 'Catatan'}</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className={inputClass}
              placeholder={lang === 'en' ? 'Optional note' : 'Catatan opsional'}
            />
          </div>

          <div>
            <label className={labelClass}>{lang === 'en' ? 'Date & Time' : 'Tanggal & Waktu'}</label>
            <input
              type="datetime-local"
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {lang === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-3 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 text-black"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Save className="w-4 h-4 text-black stroke-[2.5px]" />
              )}
              <span>{lang === 'en' ? 'Save' : 'Simpan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
