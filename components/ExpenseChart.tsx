'use client';

import { useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatRupiah } from '../lib/format';
import { useLanguage } from '../lib/i18n';
import { useHideBalance } from '../lib/HideBalanceContext';

const COLORS = [
  '#000000', // Black
  '#bbf7d0', // Mint
  '#fef08a', // Yellow
  '#bfdbfe', // Blue
  '#fecaca', // Red
  '#ddd6fe', // Purple
  '#fed7aa', // Orange
  '#f5d0fe', // Pink
];

export default function ExpenseChart({ transactions }: { transactions: Transaction[] }) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      if (
        tx.type === 'keluar' &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      ) {
        const catName = tx.category?.name || (lang === 'en' ? 'Other' : 'Lain-lain');
        categoryTotals[catName] = (categoryTotals[catName] || 0) + tx.amount;
      }
    });
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, currentMonth, currentYear, lang]);

  if (chartData.length === 0) {
    return (
      <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[3.5px_3.5px_0px_0px_#000] flex flex-col items-center justify-center min-h-[220px] select-none text-black dark:text-white">
        <h3 className="text-sm font-black uppercase tracking-wider mb-6 w-full text-left border-b-2 border-black dark:border-neutral-700 pb-2">
          {lang === 'en' ? 'Expense Distribution' : 'Distribusi Pengeluaran'}
        </h3>
        <p className="text-neutral-400 font-black text-xs uppercase tracking-widest">
          {lang === 'en'
            ? 'No expenses recorded this month.'
            : 'Tidak ada pengeluaran bulan ini.'}
        </p>
      </div>
    );
  }

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[3.5px_3.5px_0px_0px_#000] select-none text-black dark:text-white">
      <h3 className="text-sm font-black uppercase tracking-wider mb-6 border-b-2 border-black dark:border-neutral-700 pb-2">
        {lang === 'en' ? 'Expense Distribution' : 'Distribusi Pengeluaran'}
      </h3>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={55}
                paddingAngle={4}
                dataKey="value"
                stroke="#000000"
                strokeWidth={2}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                  color: '#000000',
                }}
                itemStyle={{ color: '#000000', fontWeight: '900' }}
                formatter={(value: unknown) => maskBalance(formatRupiah(Number(value || 0)))}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-1 gap-2 w-full">
          {chartData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-2 last:border-0 last:pb-0"
              >
                <div
                  className="w-3 h-3 rounded-full border border-black dark:border-neutral-700 flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1 min-w-0 flex justify-between items-center text-xs">
                  <div className="font-black uppercase tracking-wider truncate mr-2">
                    {item.name}
                  </div>
                  <div className="font-black tracking-wider shrink-0">
                    {maskBalance(formatRupiah(item.value))}{' '}
                    <span className="text-neutral-400 font-bold ml-1">({percentage}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
