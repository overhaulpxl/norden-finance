'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, AppSubscription } from '../types';
import { formatRupiah } from '../lib/format';
import { useLanguage } from '../lib/i18n';
import { useHideBalance } from '../lib/HideBalanceContext';
import { triggerHaptic } from '../lib/haptics';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Sparkles,
} from 'lucide-react';

interface CashflowCalendarProps {
  transactions: Transaction[];
  subscriptions?: AppSubscription[];
}

function getDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatCompactRupiah(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${Math.round(amount / 1_000)}rb`;
  }
  return String(amount);
}

export default function CashflowCalendar({
  transactions,
  subscriptions = [],
}: CashflowCalendarProps) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const isId = lang === 'id';

  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth()); // 0-indexed
  const [selectedDayKey, setSelectedDayKey] = useState<string>(() => getDayKey(today));

  // Month navigation
  const prevMonth = () => {
    triggerHaptic('selection');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    triggerHaptic('selection');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    triggerHaptic('medium');
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDayKey(getDayKey(today));
  };

  const monthLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(d);
  }, [currentYear, currentMonth, isId]);

  // Aggregate transactions by date key
  const aggregatedData = useMemo(() => {
    const map = new Map<
      string,
      {
        income: number;
        expense: number;
        transfer: number;
        items: Transaction[];
      }
    >();

    transactions.forEach((tx) => {
      const d = new Date(tx.transactionDate);
      if (Number.isNaN(d.getTime())) return;
      const key = getDayKey(d);

      const existing = map.get(key) ?? {
        income: 0,
        expense: 0,
        transfer: 0,
        items: [],
      };

      if (tx.type === 'masuk') existing.income += tx.amount;
      else if (tx.type === 'keluar') existing.expense += tx.amount;
      else if (tx.type === 'transfer') existing.transfer += tx.amount;

      existing.items.push(tx);
      map.set(key, existing);
    });

    return map;
  }, [transactions]);

  // Calculate monthly metrics
  const monthlyStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let peakDayKey = '';
    let peakDayExpense = 0;

    aggregatedData.forEach((dayData, key) => {
      const [y, m] = key.split('-').map(Number);
      if (y === currentYear && m === currentMonth + 1) {
        totalIn += dayData.income;
        totalOut += dayData.expense;
        if (dayData.expense > peakDayExpense) {
          peakDayExpense = dayData.expense;
          peakDayKey = key;
        }
      }
    });

    return {
      income: totalIn,
      expense: totalOut,
      net: totalIn - totalOut,
      peakDayKey,
      peakDayExpense,
    };
  }, [aggregatedData, currentYear, currentMonth]);

  // Build grid calendar days
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Monday is index 0 in Indonesia / standard European calendar
    // In JS getDay(): Sunday=0, Monday=1 ... Saturday=6
    let startingWeekday = firstDayOfMonth.getDay() - 1;
    if (startingWeekday === -1) startingWeekday = 6; // Sunday becomes 6

    const days: Array<{
      date: Date;
      key: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Previous month padding days
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingWeekday - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDate - i);
      days.push({
        date: d,
        key: getDayKey(d),
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: getDayKey(d) === getDayKey(today),
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(currentYear, currentMonth, day);
      days.push({
        date: d,
        key: getDayKey(d),
        dayNumber: day,
        isCurrentMonth: true,
        isToday: getDayKey(d) === getDayKey(today),
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      const d = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date: d,
        key: getDayKey(d),
        dayNumber: day,
        isCurrentMonth: false,
        isToday: getDayKey(d) === getDayKey(today),
      });
    }

    return days;
  }, [currentYear, currentMonth, today]);

  // Weekday column headers (Senin - Minggu)
  const weekdays = useMemo(
    () => (isId ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    [isId]
  );

  // Selected Day Details
  const selectedDayData = aggregatedData.get(selectedDayKey) ?? {
    income: 0,
    expense: 0,
    transfer: 0,
    items: [],
  };

  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDayKey.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDayKey]);

  const selectedDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(selectedDateObj);
  }, [selectedDateObj, isId]);

  // Subscriptions due on selected day
  const selectedDaySubscriptions = useMemo(() => {
    const dayNum = selectedDateObj.getDate();
    return subscriptions.filter((s) => s.isActive && s.billingDay === dayNum);
  }, [subscriptions, selectedDateObj]);

  return (
    <div className="space-y-6 select-none">
      {/* ─── Top Header Card ─── */}
      <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black dark:border-neutral-700 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000]"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              <CalendarIcon className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
                {isId ? 'Kalender Arus Kas' : 'Cashflow Calendar'}
              </h3>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-0.5">
                {isId ? 'Peta visual pemasukan & pengeluaran harian' : 'Visual daily income & expense cashflow map'}
              </p>
            </div>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={jumpToToday}
              className="px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider bg-[#FAF9F5] dark:bg-neutral-800 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {isId ? 'Hari Ini' : 'Today'}
            </button>

            <div className="flex items-center border-2 border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 shadow-[2px_2px_0px_0px_#000] overflow-hidden">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 transition-colors cursor-pointer border-r-2 border-black dark:border-neutral-700"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3px]" />
              </button>
              <span className="px-3 py-1.5 text-xs font-black uppercase tracking-wider min-w-[130px] text-center">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 active:bg-neutral-200 transition-colors cursor-pointer border-l-2 border-black dark:border-neutral-700"
              >
                <ChevronRight className="w-4 h-4 stroke-[3px]" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Monthly Summary Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />
              {isId ? 'Pemasukan' : 'Income'}
            </p>
            <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {maskBalance(formatRupiah(monthlyStats.income))}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />
              {isId ? 'Pengeluaran' : 'Expense'}
            </p>
            <p className="text-sm sm:text-base font-black text-red-600 dark:text-red-400 mt-1 truncate">
              {maskBalance(formatRupiah(monthlyStats.expense))}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
              {isId ? 'Arus Kas Bersih' : 'Net Cashflow'}
            </p>
            <p
              className={`text-sm sm:text-base font-black mt-1 truncate ${
                monthlyStats.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {monthlyStats.net > 0 ? '+' : ''}
              {maskBalance(formatRupiah(monthlyStats.net))}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
              {isId ? 'Hari Terboros' : 'Peak Spend Day'}
            </p>
            <p className="text-sm sm:text-base font-black mt-1 truncate">
              {monthlyStats.peakDayExpense > 0
                ? `${monthlyStats.peakDayKey.split('-')[2]} ${new Intl.DateTimeFormat(isId ? 'id-ID' : 'en-US', { month: 'short' }).format(new Date(currentYear, currentMonth))} (${maskBalance(formatCompactRupiah(monthlyStats.peakDayExpense))})`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Content: Calendar Grid & Selected Day Drawer ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols on Desktop) */}
        <div className="lg:col-span-2 brutal-card p-4 sm:p-5 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {weekdays.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-1 text-[11px] font-black uppercase tracking-wider rounded-md ${
                  idx >= 5 ? 'text-red-600 dark:text-red-400' : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarGrid.map((cell) => {
              const dayData = aggregatedData.get(cell.key);
              const isSelected = selectedDayKey === cell.key;
              const dayBills = subscriptions.filter((s) => s.isActive && s.billingDay === cell.dayNumber);

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedDayKey(cell.key);
                  }}
                  className={`min-h-[64px] sm:min-h-[82px] p-1 sm:p-1.5 flex flex-col justify-between border-2 rounded-xl transition-all text-left cursor-pointer relative ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-neutral-850'
                      : 'bg-neutral-100 dark:bg-neutral-950/60 opacity-40'
                  } ${
                    isSelected
                      ? 'border-black dark:border-yellow-400 shadow-[3px_3px_0px_0px_#FFE066] dark:shadow-[3px_3px_0px_0px_rgba(255,224,102,0.4)] z-10'
                      : 'border-neutral-300 dark:border-neutral-800 hover:border-black dark:hover:border-neutral-600'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black rounded-md w-5 h-5 flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-[#FFE066] text-black border border-black font-black'
                          : isSelected
                          ? 'font-black text-black dark:text-white'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Bill indicator dot */}
                    {dayBills.length > 0 && cell.isCurrentMonth && (
                      <span
                        className="w-2 h-2 rounded-full bg-blue-500 border border-black shrink-0"
                        title={`${dayBills.length} tagihan rutin`}
                      />
                    )}
                  </div>

                  {/* Badges / Micro Numbers */}
                  <div className="space-y-0.5 mt-1 w-full overflow-hidden">
                    {dayData && dayData.income > 0 && (
                      <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-400/50 rounded px-1 py-0.2 truncate leading-tight">
                        +{formatCompactRupiah(dayData.income)}
                      </div>
                    )}
                    {dayData && dayData.expense > 0 && (
                      <div className="text-[9px] font-black text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/70 border border-red-400/50 rounded px-1 py-0.2 truncate leading-tight">
                        -{formatCompactRupiah(dayData.expense)}
                      </div>
                    )}
                    {dayData && dayData.income === 0 && dayData.expense === 0 && dayData.transfer > 0 && (
                      <div className="text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 rounded px-1 truncate leading-tight">
                        ~{formatCompactRupiah(dayData.transfer)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t-2 border-neutral-100 dark:border-neutral-800 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#FFE066] border border-black inline-block" />
              <span>{isId ? 'Hari Ini' : 'Today'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400 inline-block" />
              <span>{isId ? 'Pemasukan' : 'Income'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-400 inline-block" />
              <span>{isId ? 'Pengeluaran' : 'Expense'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 border border-black inline-block" />
              <span>{isId ? 'Tagihan Rutin' : 'Scheduled Bill'}</span>
            </div>
          </div>
        </div>

        {/* ─── Selected Day Detail Inspector ─── */}
        <div className="brutal-card p-5 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white flex flex-col">
          <div className="border-b-2 border-black dark:border-neutral-700 pb-3">
            <span className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
              {isId ? 'Rincian Mutasi Harian' : 'Daily Detail'}
            </span>
            <h4 className="text-sm font-black uppercase tracking-wider mt-0.5">
              {selectedDateFormatted}
            </h4>

            {/* Day mini badges */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg">
                <span className="text-[9px] font-bold uppercase text-neutral-500 block">Masuk</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {formatCompactRupiah(selectedDayData.income)}
                </span>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-lg">
                <span className="text-[9px] font-bold uppercase text-neutral-500 block">Keluar</span>
                <span className="text-xs font-black text-red-600 dark:text-red-400">
                  {formatCompactRupiah(selectedDayData.expense)}
                </span>
              </div>
              <div className="p-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg">
                <span className="text-[9px] font-bold uppercase text-neutral-500 block">Net</span>
                <span
                  className={`text-xs font-black ${
                    selectedDayData.income - selectedDayData.expense >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCompactRupiah(selectedDayData.income - selectedDayData.expense)}
                </span>
              </div>
            </div>
          </div>

          {/* Recurring bills due on this day */}
          {selectedDaySubscriptions.length > 0 && (
            <div className="my-3 p-3 bg-blue-50 dark:bg-blue-950/40 border-2 border-black dark:border-neutral-700 rounded-xl space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 stroke-[2.5px]" />
                {isId ? 'Tagihan Rutin Jatuh Tempo' : 'Scheduled Recurring Bills'}
              </span>
              <div className="space-y-1.5">
                {selectedDaySubscriptions.map((sub) => (
                  <div key={sub.id} className="flex justify-between items-center text-xs">
                    <span className="font-bold">{sub.name}</span>
                    <span className="font-black text-red-600 dark:text-red-400">
                      {formatRupiah(sub.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 max-h-[360px] pr-1">
            {selectedDayData.items.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 dark:text-neutral-500 text-xs font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 opacity-40 stroke-[2px]" />
                <span>{isId ? 'Tidak ada mutasi di tanggal ini.' : 'No transactions recorded on this date.'}</span>
              </div>
            ) : (
              selectedDayData.items.map((tx) => {
                const isIncome = tx.type === 'masuk';
                const isTransfer = tx.type === 'transfer';
                return (
                  <div
                    key={tx.id}
                    className="p-2.5 border-2 border-black dark:border-neutral-700 rounded-xl bg-[#FAF9F5] dark:bg-neutral-800 flex justify-between items-start gap-2 shadow-[2px_2px_0px_0px_#000]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 border border-black rounded text-[9px] font-black uppercase ${
                            isIncome
                              ? 'bg-emerald-300 text-black'
                              : isTransfer
                              ? 'bg-blue-300 text-black'
                              : 'bg-red-300 text-black'
                          }`}
                        >
                          {isIncome ? 'Masuk' : isTransfer ? 'Transfer' : 'Keluar'}
                        </span>
                        <span className="font-black text-xs truncate">
                          {tx.category?.name || (isTransfer ? 'Transfer' : 'Umum')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 truncate mt-1">
                        {tx.note || (isId ? 'Tanpa catatan' : 'No notes')}
                      </p>
                      {tx.wallet && (
                        <span className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500">
                          💳 {tx.wallet.name}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-xs font-black shrink-0 ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isTransfer
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isIncome ? '+ ' : isTransfer ? '~ ' : '- '}
                      {maskBalance(formatRupiah(tx.amount))}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
