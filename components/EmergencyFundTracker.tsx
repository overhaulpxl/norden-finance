'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck, Loader2, PiggyBank, Target } from 'lucide-react';
import { Balance, EmergencyFundPlan, Transaction } from '../types';
import { formatRupiah } from '../lib/format';
import { updateEmergencyFundPlan } from '../app/actions';

function estimateMonthlyExpense(transactions: Transaction[]) {
  const now = new Date();
  const monthTotals = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'keluar')
    .forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      const monthsAgo = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
      if (monthsAgo < 0 || monthsAgo > 2) return;

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthTotals.set(key, (monthTotals.get(key) || 0) + transaction.amount);
    });

  const totals = Array.from(monthTotals.values()).filter((value) => value > 0);
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length);
}

export default function EmergencyFundTracker({
  transactions,
  balances,
  emergencyFundPlan,
}: {
  transactions: Transaction[];
  balances: Balance[];
  emergencyFundPlan: EmergencyFundPlan | null;
}) {
  const estimatedExpense = useMemo(() => estimateMonthlyExpense(transactions), [transactions]);
  const monthlyExpense = emergencyFundPlan?.monthlyExpense || estimatedExpense;
  const totalBalance = balances.reduce((sum, wallet) => sum + wallet.currentBalance, 0);
  const coverageMonths = monthlyExpense > 0 ? totalBalance / monthlyExpense : 0;
  const [input, setInput] = useState(() => String(emergencyFundPlan?.monthlyExpense || estimatedExpense || ''));
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = parseInt(input.replace(/\D/g, ''), 10);
    if (!value || value <= 0) {
      setStatus({ type: 'error', text: 'Masukkan pengeluaran bulanan yang valid.' });
      return;
    }

    setSaving(true);
    setStatus(null);
    const result = await updateEmergencyFundPlan(value);
    setSaving(false);

    if (result.success) {
      setStatus({ type: 'success', text: 'Target dana darurat diperbarui.' });
    } else {
      setStatus({ type: 'error', text: result.error || 'Gagal menyimpan dana darurat.' });
    }
  }

  const targets = [3, 6, 12].map((months) => {
    const targetAmount = monthlyExpense * months;
    const progress = targetAmount > 0 ? Math.min(100, Math.round((totalBalance / targetAmount) * 100)) : 0;
    return { months, targetAmount, progress };
  });

  return (
    <section className="brutal-card bg-white p-6 select-none">
      <div className="mb-6 flex items-center justify-between gap-4 border-b-[3px] border-black pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-black">
            <ShieldCheck className="h-5 w-5 stroke-[3px]" />
            Emergency Fund
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
            Target 3, 6, dan 12 bulan dari biaya hidup Anda.
          </p>
        </div>
        <div className="border-[2px] border-black bg-[#bbf7d0] px-3 py-2 text-right shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[9px] font-black uppercase tracking-widest text-black">Coverage</p>
          <p className="text-sm font-black text-black">{coverageMonths.toFixed(1)} bulan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Pengeluaran bulanan</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            inputMode="numeric"
            className="brutal-input px-3 py-2 text-xs font-black"
            placeholder={estimatedExpense ? String(estimatedExpense) : 'Contoh: 3000000'}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="brutal-btn mt-auto min-h-11 px-4 text-xs disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PiggyBank className="h-4 w-4" />}
          Simpan
        </button>
      </form>

      {status && (
        <div className={`mb-5 border-[2px] border-black p-3 text-xs font-black uppercase tracking-wider ${
          status.type === 'success' ? 'bg-[#bbf7d0] text-black' : 'bg-red-100 text-red-700'
        }`}>
          {status.text}
        </div>
      )}

      {monthlyExpense <= 0 ? (
        <div className="border-[3px] border-dashed border-black bg-white p-5 text-center text-xs font-black uppercase tracking-wider text-neutral-500">
          Isi pengeluaran bulanan untuk menghitung target dana darurat.
        </div>
      ) : (
        <div className="space-y-4">
          {targets.map((target) => (
            <div key={target.months} className="border-[2px] border-black bg-white p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 stroke-[3px] text-black" />
                  <span className="text-xs font-black uppercase tracking-widest text-black">{target.months} bulan</span>
                </div>
                <span className="text-xs font-black text-black">{formatRupiah(target.targetAmount)}</span>
              </div>
              <div className="h-4 overflow-hidden border-[2px] border-black bg-[#f3f4f6]">
                <div
                  className={`h-full border-r-[2px] border-black transition-all duration-300 ${
                    target.progress >= 100 ? 'bg-[#bbf7d0]' : target.progress >= 50 ? 'bg-[#fef08a]' : 'bg-[#fecaca]'
                  }`}
                  style={{ width: `${target.progress}%` }}
                />
              </div>
              <p className="mt-2 text-right text-[10px] font-black uppercase tracking-widest text-neutral-500">
                {target.progress}% tercapai
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
