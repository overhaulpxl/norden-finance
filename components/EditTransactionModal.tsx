'use client';

import { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { X, Loader2, Save } from 'lucide-react';
import { updateTransaction } from '../app/actions';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

export default function EditTransactionModal({ transaction, onClose }: Props) {
  const [form, setForm] = useState({
    type: transaction.type,
    category: transaction.category?.name || 'Lain-lain',
    amount: transaction.amount.toString(),
    method: transaction.wallet?.name || 'Lain-lain',
    note: transaction.note || '',
    transaction_date: transaction.transactionDate ? (typeof transaction.transactionDate === 'string' ? transaction.transactionDate.slice(0, 16) : transaction.transactionDate.toISOString().slice(0, 16)) : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await updateTransaction(transaction.id, {
      type: form.type as TransactionType,
      category: form.category,
      amount: parseInt(form.amount.replace(/\D/g, ''), 10) || 0,
      wallet: form.method,
      note: form.note,
      transactionDate: new Date(form.transaction_date).toISOString(),
    });

    if (res.success) {
      onClose();
    } else {
      alert(res.error || 'Gagal menyimpan');
    }
    setLoading(false);
  };

  const inputClass = "w-full bg-slate-950/50 border border-slate-700/50 focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:ring-2 focus:ring-indigo-500/20";
  const labelClass = "text-xs font-medium text-slate-400 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl shadow-black/50 animate-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-slate-100">Edit Transaksi</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Jenis</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as TransactionType })}
                className={inputClass}
              >
                <option value="masuk">Masuk</option>
                <option value="keluar">Keluar</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Kategori</label>
              <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nominal</label>
              <input type="text" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Metode</label>
              <input type="text" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Keterangan</label>
            <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Tanggal & Waktu</label>
            <input type="datetime-local" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
