'use client';

import { useState, useEffect } from 'react';
import { BellRing, CalendarCheck2, CheckCircle2, Flame, Trophy } from 'lucide-react';
import { Achievement, AppSubscription, Balance, Budget, EmergencyFundPlan, SavingGoal, Transaction } from '../types';
import { formatRupiah } from '../lib/format';
import { useLanguage } from '../lib/i18n';

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(left: Date, right: Date) {
  return Math.round((startOfDay(left).getTime() - startOfDay(right).getTime()) / 86_400_000);
}

function calculateStreaks(transactions: Transaction[], referenceDate: Date) {
  const days = Array.from(new Set(transactions.map((transaction) => dayKey(new Date(transaction.transactionDate)))))
    .sort()
    .map((key) => new Date(`${key}T12:00:00`));

  if (days.length === 0) return { current: 0, best: 0, lastActivity: null as Date | null };

  let best = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (daysBetween(days[index], days[index - 1]) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const today = startOfDay(referenceDate);
  const daySet = new Set(days.map(dayKey));
  const latest = days[days.length - 1];
  const latestGap = daysBetween(today, latest);
  let current = 0;

  if (latestGap <= 1) {
    const cursor = new Date(latest);
    while (daySet.has(dayKey(cursor))) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
  }

  return { current, best, lastActivity: latest };
}

function currentMonthExpense(transactions: Transaction[], referenceDate: Date) {
  return transactions
    .filter((transaction) => {
      const date = new Date(transaction.transactionDate);
      return transaction.type === 'keluar' && date.getMonth() === referenceDate.getMonth() && date.getFullYear() === referenceDate.getFullYear();
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

function subscriptionDueInDays(day: number, referenceDate: Date) {
  const target = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), Math.min(day, 31));
  if (target < startOfDay(referenceDate)) target.setMonth(target.getMonth() + 1);
  return daysBetween(target, referenceDate);
}

export default function MomentumCenter({
  transactions,
  balances,
  budgets,
  subscriptions,
  savingGoals,
  emergencyFundPlan,
  achievements: persistedAchievements,
  trialEndsAt,
}: {
  transactions: Transaction[];
  balances: Balance[];
  budgets: Budget[];
  subscriptions: AppSubscription[];
  savingGoals: SavingGoal[];
  emergencyFundPlan: EmergencyFundPlan | null;
  achievements: Achievement[];
  trialEndsAt?: string | null;
}) {
  const { t, lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      setMounted(true);
      setReferenceDate(new Date());
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  if (!mounted || !referenceDate) {
    return (
      <section className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-6 select-none animate-pulse text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
        <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-black dark:border-neutral-700 pb-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-black dark:text-white">
              <Flame className="h-5 w-5 stroke-[3px]" />
              {t('momentum_title')}
            </h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {t('momentum_subtitle')}
            </p>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="h-20 border-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"></div>
          <div className="h-20 border-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"></div>
        </div>
        <div className="mb-5 h-40 border-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"></div>
        <div className="h-40 border-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"></div>
      </section>
    );
  }

  const streaks = calculateStreaks(transactions, referenceDate);
  const totalBalance = balances.reduce((sum, balance) => sum + balance.currentBalance, 0);
  const monthlyExpense = emergencyFundPlan?.monthlyExpense || 0;
  const emergencyMonths = monthlyExpense > 0 ? totalBalance / monthlyExpense : 0;
  const monthExpense = currentMonthExpense(transactions, referenceDate);
  const todayKey = dayKey(referenceDate);
  const hasTransactionToday = transactions.some((transaction) => dayKey(new Date(transaction.transactionDate)) === todayKey);
  const daysSinceActivity = streaks.lastActivity ? Math.max(0, daysBetween(referenceDate, streaks.lastActivity)) : null;
  const persistedTitles = new Set(persistedAchievements.map((achievement) => achievement.title));

  const achievements = [
    {
      label: lang === 'en' ? '7-day streak' : '7 hari streak',
      complete: persistedTitles.has('7 Day Streak') || streaks.best >= 7,
      detail: `${Math.min(streaks.best, 7)}/${lang === 'en' ? '7 days' : '7 hari'}`,
    },
    {
      label: lang === 'en' ? '30-day streak' : '30 hari streak',
      complete: persistedTitles.has('30 Day Streak') || streaks.best >= 30,
      detail: `${Math.min(streaks.best, 30)}/${lang === 'en' ? '30 days' : '30 hari'}`,
    },
    {
      label: lang === 'en' ? 'First 100 transactions' : '100 transaksi pertama',
      complete: persistedTitles.has('100 Transactions') || transactions.length >= 100,
      detail: `${Math.min(transactions.length, 100)}/${lang === 'en' ? '100 txs' : '100 transaksi'}`,
    },
    {
      label: lang === 'en' ? 'Balance Rp1,000,000' : 'Saldo Rp1.000.000',
      complete: persistedTitles.has('Million Balance') || totalBalance >= 1_000_000,
      detail: formatRupiah(Math.min(totalBalance, 1_000_000)),
    },
    {
      label: lang === 'en' ? 'Saving goal reached' : 'Target tabungan tercapai',
      complete: persistedTitles.has('Saving Goal Reached') || savingGoals.some((goal) => goal.currentAmount >= goal.targetAmount),
      detail: savingGoals.length
        ? `${savingGoals.filter((goal) => goal.currentAmount >= goal.targetAmount).length}/${savingGoals.length} ${lang === 'en' ? 'goal' : 'goal'}`
        : (lang === 'en' ? 'No goals yet' : 'Belum ada goal'),
    },
    {
      label: lang === 'en' ? '3 months emergency fund' : 'Dana darurat 3 bulan',
      complete: persistedTitles.has('Emergency Fund 3 Months') || emergencyMonths >= 3,
      detail: monthlyExpense > 0
        ? `${emergencyMonths.toFixed(1)}/${lang === 'en' ? '3 months' : '3 bulan'}`
        : (lang === 'en' ? 'Set target first' : 'Isi target dulu'),
    },
  ];

  const reminders: Array<{ title: string; detail: string; tone: 'warning' | 'info' | 'success' }> = [];

  if (!hasTransactionToday) {
    reminders.push({
      title: lang === 'en' ? 'No transactions today' : 'Belum ada transaksi hari ini',
      detail: lang === 'en' ? 'Record a transaction to keep your streak alive.' : 'Catat satu transaksi agar streak tetap hidup.',
      tone: 'warning',
    });
  }

  if (daysSinceActivity !== null && daysSinceActivity >= 3) {
    reminders.push({
      title: lang === 'en' ? `${daysSinceActivity} days without activity` : `${daysSinceActivity} hari tanpa aktivitas`,
      detail: lang === 'en' ? 'Open quick input to record your latest transactions.' : 'Buka quick input dan rekam transaksi terakhir Anda.',
      tone: 'warning',
    });
  }

  if (budgets.length === 0) {
    reminders.push({
      title: lang === 'en' ? 'Budget not set yet' : 'Budget belum diatur',
      detail: lang === 'en' ? 'Set category budgets to control monthly spending.' : 'Buat budget kategori agar pengeluaran bulan ini punya batas.',
      tone: 'info',
    });
  } else {
    budgets.forEach((budget) => {
      const spent = transactions
        .filter((transaction) => {
          const date = new Date(transaction.transactionDate);
          return transaction.type === 'keluar' &&
            transaction.category?.name.toLowerCase() === budget.category?.name.toLowerCase() &&
            date.getMonth() === referenceDate.getMonth() &&
            date.getFullYear() === referenceDate.getFullYear();
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      const ratio = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
      if (ratio >= 0.8) {
        reminders.push({
          title: lang === 'en' ? `${budget.category?.name || 'Budget'} almost exhausted` : `${budget.category?.name || 'Budget'} hampir habis`,
          detail: lang === 'en' ? `${Math.round(ratio * 100)}% spent this month.` : `${Math.round(ratio * 100)}% terpakai bulan ini.`,
          tone: ratio >= 1 ? 'warning' : 'info',
        });
      }
    });
  }

  subscriptions
    .filter((subscription) => subscription.isActive)
    .forEach((subscription) => {
      const dueIn = subscriptionDueInDays(subscription.billingDay, referenceDate);
      if (dueIn <= 3) {
        reminders.push({
          title: lang === 'en' ? `${subscription.name} due soon` : `${subscription.name} jatuh tempo`,
          detail: dueIn === 0
            ? (lang === 'en' ? 'Bill due today.' : 'Tagihan hari ini.')
            : (lang === 'en' ? `Due in ${dueIn} days.` : `Dalam ${dueIn} hari.`),
          tone: 'info',
        });
      }
    });

  if (monthlyExpense > 0 && emergencyMonths < 1) {
    reminders.push({
      title: lang === 'en' ? 'Emergency fund needs attention' : 'Dana darurat belum aman',
      detail: lang === 'en' ? `Coverage at only ${emergencyMonths.toFixed(1)} months.` : `Coverage baru ${emergencyMonths.toFixed(1)} bulan.`,
      tone: 'warning',
    });
  }

  if (trialEndsAt) {
    const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - referenceDate.getTime()) / 86_400_000);
    if (daysLeft >= 0 && daysLeft <= 3) {
      reminders.push({
        title: lang === 'en' ? 'Trial ending soon' : 'Trial segera berakhir',
        detail: lang === 'en' ? `${daysLeft} days remaining to upgrade to Pro.` : `${daysLeft} hari tersisa untuk upgrade Pro.`,
        tone: 'info',
      });
    }
  }

  if (reminders.length === 0) {
    reminders.push({
      title: lang === 'en' ? 'All financial habits on track' : 'Semua kebiasaan finansial aman',
      detail: lang === 'en'
        ? `Monthly expense is ${formatRupiah(monthExpense)} with no urgent reminders.`
        : `Pengeluaran bulan ini ${formatRupiah(monthExpense)} dan tidak ada pengingat mendesak.`,
      tone: 'success',
    });
  }

  return (
    <section className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-6 select-none text-black dark:text-white shadow-[3px_3px_0px_0px_#000]">
      <div className="mb-6 flex items-start justify-between gap-4 border-b-2 border-black dark:border-neutral-700 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-black uppercase tracking-wider text-black dark:text-white">
            <Flame className="h-5 w-5 stroke-[3px]" />
            {t('momentum_title')}
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {t('momentum_subtitle')}
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="border-2 border-black dark:border-neutral-700 bg-[#fef08a] dark:bg-amber-950/70 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-amber-200">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black dark:text-amber-300">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            {t('momentum_current')}
          </p>
          <p className="mt-1 text-2xl font-black text-black dark:text-white">{streaks.current}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">{t('momentum_streak_label')}</p>
        </div>
        <div className="border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/70 p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black dark:text-emerald-200">
          <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-black dark:text-emerald-300">
            <Trophy className="h-3.5 w-3.5" />
            {t('momentum_best')}
          </p>
          <p className="mt-1 text-2xl font-black text-black dark:text-white">{streaks.best}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">{t('momentum_best_label')}</p>
        </div>
      </div>

      <div className="mb-5">
        <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-black dark:text-white">
          {lang === 'en' ? 'Achievements' : 'Pencapaian'}
        </h4>
        <div className="space-y-2">
          {achievements.map((achievement) => (
            <div key={achievement.label} className="flex items-center justify-between gap-3 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 shadow-[1.5px_1.5px_0px_0px_#000]">
              <div className="flex min-w-0 items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 flex-shrink-0 stroke-[3px] ${achievement.complete ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-300 dark:text-neutral-600'}`} />
                <span className="truncate text-[11px] font-black uppercase tracking-wider text-black dark:text-white">{achievement.label}</span>
              </div>
              <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{achievement.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black dark:text-white">
          <BellRing className="h-4 w-4 stroke-[3px]" />
          {lang === 'en' ? 'Smart Reminders' : 'Pengingat Pintar'}
        </h4>
        <div className="space-y-2">
          {reminders.slice(0, 5).map((reminder) => (
            <div
              key={`${reminder.title}-${reminder.detail}`}
              className={`border-2 border-black dark:border-neutral-700 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                reminder.tone === 'warning'
                  ? 'bg-[#fecaca] dark:bg-red-950/70 text-black dark:text-red-200'
                  : reminder.tone === 'success'
                  ? 'bg-[#bbf7d0] dark:bg-emerald-950/70 text-black dark:text-emerald-200'
                  : 'bg-[#dbeafe] dark:bg-blue-950/70 text-black dark:text-blue-200'
              }`}
            >
              <p className="text-[11px] font-black uppercase tracking-wider">{reminder.title}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wide opacity-80">{reminder.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
