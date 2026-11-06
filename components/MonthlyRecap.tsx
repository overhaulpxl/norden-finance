'use client';

import { useMemo } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../lib/format';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';

export default function MonthlyRecap({ transactions }: { transactions: Transaction[] }) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const monthlyData = useMemo(() => {
    const map: Record<string, { masuk: number; keluar: number }> = {};
    transactions
      .filter((t) => t.type !== 'transfer')
      .forEach((tx) => {
        const d = new Date(tx.transactionDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = { masuk: 0, keluar: 0 };
        if (tx.type === 'masuk') map[key].masuk += tx.amount;
        if (tx.type === 'keluar') map[key].keluar += tx.amount;
      });
    return Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => {
        const [y, m] = month.split('-');
        const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString(
          lang === 'id' ? 'id-ID' : 'en-US',
          { month: 'long', year: 'numeric' }
        );
        return { key: month, label, ...data, net: data.masuk - data.keluar };
      });
  }, [transactions, lang]);

  if (monthlyData.length === 0) {
    return (
      <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] flex flex-col items-center justify-center min-h-[200px] select-none text-black dark:text-white">
        <h3 className="text-sm font-black uppercase tracking-wider mb-6 w-full text-left border-b-2 border-black dark:border-neutral-700 pb-2">
          {lang === 'id' ? 'Rekap Bulanan' : 'Monthly Recap'}
        </h3>
        <p className="text-neutral-400 dark:text-neutral-500 font-black text-xs uppercase tracking-widest">
          {lang === 'id' ? 'Belum ada data transaksi.' : 'No transaction data yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] select-none text-black dark:text-white">
      <h3 className="text-sm font-black uppercase tracking-wider mb-6 border-b-2 border-black dark:border-neutral-700 pb-2">
        {lang === 'id' ? 'Rekap Bulanan' : 'Monthly Recap'}
      </h3>
      <div className="space-y-4">
        {monthlyData.map((m) => {
          const surplus = m.masuk - m.keluar;
          return (
            <div
              key={m.key}
              className="border-b-2 border-neutral-100 dark:border-neutral-800 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  {m.label}
                </span>
                <span
                  className={`text-base font-black tracking-wider ${
                    surplus >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-black dark:text-white'
                  }`}
                >
                  {surplus >= 0 ? '+' : '-'}
                  {maskBalance(formatRupiah(Math.abs(surplus)))}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest block">
                    {lang === 'id' ? 'Pemasukan' : 'Income'}
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs tracking-wider">
                    {maskBalance(formatRupiah(m.masuk))}
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest block">
                    {lang === 'id' ? 'Pengeluaran' : 'Expense'}
                  </span>
                  <span className="font-black text-red-600 dark:text-red-400 text-xs tracking-wider">
                    {maskBalance(formatRupiah(m.keluar))}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
