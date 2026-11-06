'use client';

import { Transaction } from '../types';
import { formatRupiah } from '../lib/format';
import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, CalendarDays } from 'lucide-react';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function FinancialTimeline({ transactions }: { transactions: Transaction[] }) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, transaction) => {
    const key = monthKey(new Date(transaction.transactionDate));
    acc[key] = acc[key] || [];
    acc[key].push(transaction);
    return acc;
  }, {});

  const months = Object.entries(grouped)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  return (
    <section className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="mb-6 flex items-center justify-between gap-3 border-b-2 border-black dark:border-neutral-700 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black uppercase tracking-wider">
            <div
              className="p-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              <CalendarDays className="h-4 w-4 stroke-[2.5px]" />
            </div>
            <span>{lang === 'id' ? 'Lini Masa Finansial' : 'Financial Timeline'}</span>
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {lang === 'id'
              ? 'Riwayat bulanan dari transaksi, dompet, kategori, dan tag.'
              : 'Monthly timeline of transactions, wallets, categories, and tags.'}
          </p>
        </div>
      </div>

      {months.length === 0 ? (
        <div className="border-2 border-dashed border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 text-center text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 rounded-xl">
          {lang === 'id'
            ? 'Timeline akan muncul setelah transaksi pertama dicatat.'
            : 'Timeline will appear once your first transaction is recorded.'}
        </div>
      ) : (
        <div className="space-y-6">
          {months.map(([key, items]) => {
            const monthDate = new Date(`${key}-01T12:00:00`);
            const income = items
              .filter((item) => item.type === 'masuk')
              .reduce((sum, item) => sum + item.amount, 0);
            const expense = items
              .filter((item) => item.type === 'keluar')
              .reduce((sum, item) => sum + item.amount, 0);
            const net = income - expense;

            return (
              <div
                key={key}
                className="grid gap-3 border-l-2 border-black dark:border-neutral-700 pl-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                      {monthDate.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {items.length} {lang === 'id' ? 'transaksi' : 'transactions'}, net{' '}
                      {maskBalance(formatRupiah(net))}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-wider">
                    <span className="border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/70 text-black dark:text-emerald-200 px-2 py-1 rounded-lg shadow-[1px_1px_0px_0px_#000]">
                      In {maskBalance(formatRupiah(income))}
                    </span>
                    <span className="border-2 border-black dark:border-neutral-700 bg-[#fecaca] dark:bg-red-950/70 text-black dark:text-red-200 px-2 py-1 rounded-lg shadow-[1px_1px_0px_0px_#000]">
                      Out {maskBalance(formatRupiah(expense))}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.slice(0, 8).map((transaction) => {
                    const Icon =
                      transaction.type === 'masuk'
                        ? ArrowDownRight
                        : transaction.type === 'transfer'
                        ? ArrowRightLeft
                        : ArrowUpRight;
                    const tags = transaction.tags || [];
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between gap-3 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0 stroke-[2.5px] text-black dark:text-white" />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black uppercase tracking-wider text-black dark:text-white">
                              {transaction.note ||
                                transaction.category?.name ||
                                (lang === 'id' ? 'Transaksi' : 'Transaction')}
                            </p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                              {transaction.wallet?.name || '-'}{' '}
                              {tags.length ? `#${tags.join(' #')}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-black text-black dark:text-white">
                          {maskBalance(formatRupiah(transaction.amount))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
