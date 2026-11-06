'use client';

import { Transaction } from '../types';
import { useLanguage } from '../lib/i18n';

export default function NoSpendCalendar({ transactions }: { transactions: Transaction[] }) {
  const { lang } = useLanguage();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  // Find which days have 'keluar' transactions
  const spendDays = new Set<number>();
  transactions.forEach((t) => {
    const d = new Date(t.transactionDate);
    if (d.getFullYear() === year && d.getMonth() === month && t.type === 'keluar') {
      spendDays.add(d.getDate());
    }
  });

  const dayHeaders =
    lang === 'id'
      ? ['M', 'S', 'S', 'R', 'K', 'J', 'S']
      : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="flex justify-between items-center mb-5 border-b-2 border-black dark:border-neutral-700 pb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
          {lang === 'id' ? 'Kalender Hari Hemat' : 'No-Spend Tracker'}
        </h3>
        <span className="text-[10px] font-black text-black bg-[#bbf7d0] dark:bg-emerald-400 border-2 border-black px-2.5 py-1 rounded-xl uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000]">
          {daysInMonth - spendDays.size}{' '}
          {lang === 'id' ? 'Hari Hemat' : 'No-Spend Days'}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {dayHeaders.map((d, i) => (
          <div
            key={i}
            className="text-[10px] text-center text-neutral-500 dark:text-neutral-400 mb-1 font-black uppercase"
          >
            {d}
          </div>
        ))}

        {blanks.map((b) => (
          <div key={`blank-${b}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const isSpend = spendDays.has(day);
          const isToday = day === today.getDate();
          const isFuture = day > today.getDate();

          let bgClasses = '';
          if (isFuture)
            bgClasses =
              'bg-neutral-100 dark:bg-neutral-800/40 border border-neutral-300 dark:border-neutral-700 opacity-40 text-neutral-400';
          else if (isSpend)
            bgClasses =
              'bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-400';
          else
            bgClasses =
              'bg-[#bbf7d0] dark:bg-emerald-950/80 border-2 border-black dark:border-neutral-700 text-black dark:text-emerald-200 font-black shadow-[1.5px_1.5px_0px_0px_#000]';

          return (
            <div
              key={day}
              title={
                isFuture
                  ? 'Future'
                  : isSpend
                  ? 'Spent money'
                  : lang === 'id'
                  ? 'Hari tanpa pengeluaran! 🎉'
                  : 'No spend day! 🎉'
              }
              className={`aspect-square flex items-center justify-center text-xs rounded-xl transition-transform ${bgClasses} ${
                isToday
                  ? 'ring-2 ring-black dark:ring-white border-2 border-black scale-105 z-10 font-black'
                  : ''
              }`}
            >
              <span>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
