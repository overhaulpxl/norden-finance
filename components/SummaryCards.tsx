'use client';

import { Transaction, Balance } from '../types';
import { formatRupiah } from '../lib/format';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';

export default function SummaryCards({
  transactions,
  balances,
}: {
  transactions: Transaction[];
  balances: Balance[];
}) {
  const { maskBalance } = useHideBalance();
  const { lang } = useLanguage();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let totalMasuk = 0;
  let totalKeluar = 0;

  transactions.forEach((tx) => {
    const txDate = new Date(tx.transactionDate);
    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      if (tx.type === 'masuk') totalMasuk += tx.amount;
      if (tx.type === 'keluar') totalKeluar += tx.amount;
    }
  });

  const saldoBersih = totalMasuk - totalKeluar;
  const totalSaldoReal = balances.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const selisih = totalSaldoReal - saldoBersih;

  const cards = [
    { title: lang === 'id' ? 'Saldo Real' : 'Actual Balance', amount: totalSaldoReal },
    { title: lang === 'id' ? 'Pemasukan' : 'Income', amount: totalMasuk },
    { title: lang === 'id' ? 'Pengeluaran' : 'Expense', amount: totalKeluar },
    { title: lang === 'id' ? 'Saldo Bersih' : 'Net Cashflow', amount: saldoBersih },
  ];

  return (
    <div className="space-y-4 select-none">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="brutal-card p-5 h-full flex flex-col justify-center bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white"
          >
            <p className="text-neutral-500 dark:text-neutral-400 text-xs font-black mb-1.5 uppercase tracking-wider">
              {card.title}
            </p>
            <p className="text-xl font-black tracking-wider">
              {maskBalance(formatRupiah(card.amount))}
            </p>
          </div>
        ))}
      </div>

      {selisih !== 0 && (
        <div className="text-xs text-neutral-800 dark:text-neutral-200 font-bold flex items-center gap-2 border-2 border-black dark:border-neutral-700 p-3 bg-red-50 dark:bg-red-950/70 rounded-xl shadow-[2px_2px_0px_0px_#000]">
          <span>
            {lang === 'id' ? 'Selisih ' : 'Discrepancy '}
            <strong className="text-red-600 dark:text-red-400 font-black">
              {maskBalance(formatRupiah(Math.abs(selisih)))}
            </strong>
            {lang === 'id'
              ? ' antara catatan dan saldo asli.'
              : ' between records and actual balance.'}
          </span>
        </div>
      )}
    </div>
  );
}
