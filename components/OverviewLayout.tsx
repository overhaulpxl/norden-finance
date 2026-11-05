'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Transaction, Balance, Debt, WishlistItem, Budget, AppSubscription, EmergencyFundPlan, SavingGoal, Achievement, Paylater } from '../types';
import { formatRupiah } from '../lib/format';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Wallet, Scale, Sparkles, SlidersHorizontal, Calendar, Coins } from 'lucide-react';
import { addCustomNotification } from '../app/actions/notifications';
import { useLanguage } from '../lib/i18n';
import { useHideBalance } from '../lib/HideBalanceContext';
import { getCategoryEmoji } from '../lib/categoryEmoji';

function WidgetSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`brutal-card bg-white border-[3px] border-black p-6 ${className}`}>
      <div className="h-4 w-36 bg-neutral-200 border-2 border-black animate-pulse" />
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="h-16 bg-neutral-100 border-2 border-neutral-200 animate-pulse" />
        <div className="h-16 bg-neutral-100 border-2 border-neutral-200 animate-pulse" />
        <div className="h-16 bg-neutral-100 border-2 border-neutral-200 animate-pulse" />
      </div>
    </div>
  );
}

const MonthlyRecap = dynamic(() => import('./MonthlyRecap'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const HealthScore = dynamic(() => import('./HealthScore'), {
  ssr: false,
  loading: () => <WidgetSkeleton className="h-full min-h-[160px]" />,
});
const NoSpendCalendar = dynamic(() => import('./NoSpendCalendar'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const ExpenseChart = dynamic(() => import('./ExpenseChart'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const BudgetManager = dynamic(() => import('./BudgetManager'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const SubscriptionManager = dynamic(() => import('./SubscriptionManager'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const EmergencyFundTracker = dynamic(() => import('./EmergencyFundTracker'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const MomentumCenter = dynamic(() => import('./MomentumCenter'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const UpcomingBills = dynamic(() => import('./UpcomingBills'), {
  ssr: false,
  loading: () => <WidgetSkeleton />,
});
const QuickStartGuide = dynamic(() => import('./QuickStartGuide'), {
  ssr: false,
});
const WeeklyInsightBanner = dynamic(() => import('./WeeklyInsightBanner'), {
  ssr: false,
});
const PWAInstallBanner = dynamic(() => import('./PWAInstallBanner'), {
  ssr: false,
});

interface OverviewProps {
  transactions: Transaction[];
  balances: Balance[];
  debts: Debt[];
  wishlist: WishlistItem[];
  savingGoals: SavingGoal[];
  budgets: Budget[];
  subscriptions: AppSubscription[];
  paylaters?: Paylater[];
  emergencyFundPlan: EmergencyFundPlan | null;
  achievements: Achievement[];
  user: {
    id: string;
    email: string;
    plan: 'trial' | 'pro';
    effectivePlan?: string;
    fullName?: string;
    trialEndsAt?: string | null;
  };
  onNewTransaction?: () => void;
}

const DEFAULT_TOP_WIDGETS = [
  { id: 'total-balance', name: 'Total Saldo', visible: true },
  { id: 'safe-to-spend', name: 'Safe-to-Spend Harian', visible: true },
  { id: 'net-worth', name: 'Kekayaan Bersih', visible: true },
  { id: 'health-score', name: 'Kesehatan Finansial', visible: true },
];

const DEFAULT_WIDGETS = [
  { id: 'upcoming-bills', name: 'Tagihan Mendatang', visible: true, column: 'left' as const },
  { id: 'recent-transactions', name: 'Transaksi Terbaru', visible: true, column: 'left' as const },
  { id: 'expense-chart', name: 'Distribusi Pengeluaran', visible: true, column: 'left' as const },
  { id: 'monthly-recap', name: 'Rekap Bulanan', visible: true, column: 'left' as const },
  { id: 'budget-manager', name: 'Kontrol Anggaran', visible: true, column: 'right' as const },
  { id: 'momentum-center', name: 'Disiplin & Pengingat', visible: true, column: 'right' as const },
  { id: 'no-spend-calendar', name: 'Kalender Hemat', visible: true, column: 'right' as const },
  { id: 'emergency-fund', name: 'Dana Darurat', visible: true, column: 'right' as const },
  { id: 'subscription-manager', name: 'Tagihan Berulang', visible: true, column: 'right' as const },
];

function readStoredWidgets<T extends Array<{ id: string }>>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;

    const parsed = JSON.parse(saved) as T;
    const missingDefaults = fallback.filter((widget) => !parsed.some((savedWidget) => savedWidget.id === widget.id));
    return [...parsed, ...missingDefaults] as T;
  } catch {
    return fallback;
  }
}

export default function OverviewLayout({ 
  transactions, 
  balances, 
  debts, 
  budgets,
  subscriptions,
  paylaters = [],
  emergencyFundPlan,
  savingGoals,
  achievements,
  user,
  onNewTransaction,
}: OverviewProps) {
  const { lang, t } = useLanguage();
  const { maskBalance } = useHideBalance();
  const activeBalances = useMemo(() => balances.filter(b => !b.archivedAt), [balances]);
  const totalBalance = useMemo(() => activeBalances.reduce((acc, curr) => acc + curr.currentBalance, 0), [activeBalances]);

  // Net Worth Calculation: Total Balance + Piutang - Utang
  const activePiutang = useMemo(() => debts
    .filter(d => d.type === 'piutang' && !d.isSettled)
    .reduce((acc, curr) => acc + curr.amount, 0), [debts]);

  const activeUtang = useMemo(() => debts
    .filter(d => d.type === 'hutang' && !d.isSettled)
    .reduce((acc, curr) => acc + curr.amount, 0), [debts]);

  const netWorth = totalBalance + activePiutang - activeUtang;

  // Monthly flow calculations
  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyFlow = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(tx => {
      const d = new Date(tx.transactionDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (tx.type === 'masuk') income += tx.amount;
        if (tx.type === 'keluar') expense += tx.amount;
      }
    });
    return {
      income,
      expense,
      net: income - expense,
    };
  }, [transactions, currentMonth, currentYear]);

  // Safe-to-Spend Calculation: Sisa budget bulan ini ÷ sisa hari dalam bulan
  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentYear, currentMonth]);
  const remainingDays = useMemo(() => Math.max(1, daysInMonth - now.getDate() + 1), [daysInMonth, now]);

  const totalMonthlyBudgetLimit = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
  }, [budgets]);

  const remainingBudget = useMemo(() => {
    if (totalMonthlyBudgetLimit > 0) {
      return Math.max(0, totalMonthlyBudgetLimit - monthlyFlow.expense);
    }
    if (monthlyFlow.income > monthlyFlow.expense) {
      return monthlyFlow.income - monthlyFlow.expense;
    }
    return Math.max(0, totalBalance);
  }, [totalMonthlyBudgetLimit, monthlyFlow, totalBalance]);

  const safeToSpendDaily = useMemo(() => {
    return Math.round(remainingBudget / remainingDays);
  }, [remainingBudget, remainingDays]);

  // Get recent 6 transactions sorted by date
  const recentTransactions = useMemo(() => [...transactions].sort((a, b) =>
    new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  ).slice(0, 6), [transactions]);

  const isPro = user.effectivePlan === 'PRO_ACTIVE' || user.effectivePlan === 'TRIAL' || user.effectivePlan === 'PRO_PENDING';

  // Layout customization state
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [topWidgets, setTopWidgets] = useState<typeof DEFAULT_TOP_WIDGETS>(() =>
    readStoredWidgets(`norden_top_widgets_${user.id}`, DEFAULT_TOP_WIDGETS)
  );
  const [columnWidgets, setColumnWidgets] = useState<typeof DEFAULT_WIDGETS>(() =>
    readStoredWidgets(`norden_column_widgets_${user.id}`, DEFAULT_WIDGETS)
  );

  const handleToggleCustomize = () => {
    if (isCustomizing) {
      setSuccess('Tata letak dashboard berhasil disimpan!');
      addCustomNotification(
        'Tata letak disimpan',
        'Anda berhasil menyesuaikan susunan widget dashboard Norden Finance Anda.',
        'LAYOUT_UPDATE'
      );
      setTimeout(() => setSuccess(null), 4000);
    }
    setIsCustomizing(!isCustomizing);
  };

  const handleToggleTopWidget = (id: string) => {
    const updated = topWidgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setTopWidgets(updated);
    if (user?.id) {
      localStorage.setItem(`norden_top_widgets_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleMoveTopWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...topWidgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setTopWidgets(updated);
      if (user?.id) {
        localStorage.setItem(`norden_top_widgets_${user.id}`, JSON.stringify(updated));
      }
    }
  };

  const handleToggleColumnWidget = (id: string) => {
    const updated = columnWidgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setColumnWidgets(updated);
    if (user?.id) {
      localStorage.setItem(`norden_column_widgets_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleMoveColumnWidget = (index: number, direction: 'up' | 'down') => {
    const updated = [...columnWidgets];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < updated.length) {
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      setColumnWidgets(updated);
      if (user?.id) {
        localStorage.setItem(`norden_column_widgets_${user.id}`, JSON.stringify(updated));
      }
    }
  };

  const handleSwitchColumnWidget = (id: string) => {
    const updated = columnWidgets.map(w => w.id === id ? { ...w, column: w.column === 'left' ? 'right' as const : 'left' as const } : w);
    setColumnWidgets(updated);
    if (user?.id) {
      localStorage.setItem(`norden_column_widgets_${user.id}`, JSON.stringify(updated));
    }
  };

  const handleResetLayout = () => {
    setTopWidgets(DEFAULT_TOP_WIDGETS);
    setColumnWidgets(DEFAULT_WIDGETS);
    if (user?.id) {
      localStorage.removeItem(`norden_top_widgets_${user.id}`);
      localStorage.removeItem(`norden_column_widgets_${user.id}`);
    }
    setSuccess('Tata letak dashboard dikembalikan ke default!');
    addCustomNotification(
      'Tata letak direset',
      'Susunan widget dashboard telah dikembalikan ke pengaturan awal pabrik.',
      'LAYOUT_RESET'
    );
    setTimeout(() => setSuccess(null), 4000);
  };

  const formattedMonth = useMemo(() => {
    return now.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
  }, [now, lang]);

  const renderColumnWidget = (id: string) => {
    switch (id) {
      case 'upcoming-bills':
        return (
          <UpcomingBills
            key={id}
            subscriptions={subscriptions}
            paylaters={paylaters}
            debts={debts}
            balances={balances}
          />
        );
      case 'recent-transactions':
        return (
          <div key={id} className="brutal-card p-6 flex flex-col bg-white border-[3px] border-black">
            <div className="flex justify-between items-center mb-5 border-b-[3px] border-black pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-black uppercase tracking-wider">Aktivitas Transaksi Terbaru</h3>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mt-0.5">Catatan pengeluaran, pemasukan, dan transfer terakhir</p>
              </div>
              {onNewTransaction && (
                <button
                  onClick={onNewTransaction}
                  className="px-3 py-1.5 border-[2px] border-black bg-[#FFE066] text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  + Tambah
                </button>
              )}
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-black p-6 bg-[#FAF9F5]">
                <p className="text-sm font-black text-black uppercase tracking-wider">Belum Ada Transaksi Tercatat</p>
                <p className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-wide">
                  Mulai catat transaksi pertama Anda dengan Smart Input atau formulir cepat.
                </p>
                {onNewTransaction && (
                  <button
                    onClick={onNewTransaction}
                    className="mt-4 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    + Catat Transaksi Pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y-2 divide-neutral-100">
                {recentTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-9 h-9 border-[2px] border-black rounded-none flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                        t.type === 'masuk' ? 'bg-[#bbf7d0] text-black' : 
                        t.type === 'transfer' ? 'bg-[#bfdbfe] text-black' : 
                        'bg-[#fecaca] text-black'
                      }`}>
                        {t.type === 'masuk' ? <ArrowDownRight className="w-4 h-4 stroke-[3px]" /> : 
                         t.type === 'transfer' ? <ArrowRightLeft className="w-4 h-4 stroke-[3px]" /> : 
                         <ArrowUpRight className="w-4 h-4 stroke-[3px]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-black text-black uppercase tracking-wider truncate flex items-center gap-1.5">
                          <span className="text-sm shrink-0 select-none">{getCategoryEmoji(t.category?.name)}</span>
                          <span className="truncate">{t.category?.name || 'Lain-lain'}</span>
                        </p>
                        <p className="text-[11px] font-bold text-neutral-500 truncate mt-0.5">
                          {t.note || t.wallet?.name || 'Lain-lain'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span className={`text-xs sm:text-sm font-black block tracking-wider ${
                        t.type === 'masuk' ? 'text-emerald-700' : 
                        t.type === 'transfer' ? 'text-blue-700' : 
                        'text-black'
                      }`}>
                        {t.type === 'masuk' ? '+' : t.type === 'transfer' ? '' : '-'}{maskBalance(formatRupiah(t.amount))}
                      </span>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                        {new Date(t.transactionDate).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'expense-chart':
        return <ExpenseChart key={id} transactions={transactions} />;
      case 'monthly-recap':
        return <MonthlyRecap key={id} transactions={transactions} />;
      case 'no-spend-calendar':
        return <NoSpendCalendar key={id} transactions={transactions} />;
      case 'budget-manager':
        return <BudgetManager key={id} budgets={budgets} transactions={transactions} isPro={isPro} />;
      case 'subscription-manager':
        return <SubscriptionManager key={id} subscriptions={subscriptions} balances={balances} isPro={isPro} />;
      case 'emergencyFundPlan':
      case 'emergency-fund':
        return <EmergencyFundTracker key={id} transactions={transactions} balances={balances} emergencyFundPlan={emergencyFundPlan} />;
      case 'momentum-center':
        return <MomentumCenter key={id} transactions={transactions} balances={balances} budgets={budgets} subscriptions={subscriptions} savingGoals={savingGoals} emergencyFundPlan={emergencyFundPlan} achievements={achievements} trialEndsAt={user.trialEndsAt} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Overview Context Header & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 border-[2px] border-black bg-[#FAF9F5] text-xs font-black uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedMonth}</span>
          </div>

          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[1.5px_1.5px_0px_0px_#000] ${
            user.effectivePlan === 'PRO_ACTIVE'
              ? 'bg-[#FFE066] text-black'
              : user.effectivePlan === 'PRO_PENDING'
              ? 'bg-amber-200 text-black'
              : user.effectivePlan === 'TRIAL'
              ? 'bg-[#bbf7d0] text-black'
              : 'bg-neutral-200 text-neutral-800'
          }`}>
            {user.effectivePlan === 'PRO_ACTIVE'
              ? 'PRO 👑'
              : user.effectivePlan === 'PRO_PENDING'
              ? 'PRO (REVIEW ⏳)'
              : user.effectivePlan === 'TRIAL'
              ? 'TRIAL ⚡'
              : 'FREE BASIC 🌱'}
          </span>
        </div>

        <button 
          onClick={handleToggleCustomize}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-[2px] border-black bg-white hover:bg-neutral-50 text-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{isCustomizing ? 'Selesai & Simpan' : 'Atur Tata Letak'}</span>
        </button>
      </div>

      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {/* Layout Customizer Panel */}
      {isCustomizing && (
        <div className="brutal-card p-6 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-black">Kustomisasi Tata Letak Dashboard</h3>
            <button 
              onClick={handleResetLayout}
              className="px-3 py-1 text-[10px] font-black uppercase bg-[#fecaca] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              Kembalikan Default
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-3">Kartu Metrik Utama (Atas)</h4>
              <div className="space-y-2">
                {topWidgets.map((widget, index) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 border-2 border-black bg-[#FAF9F5] text-xs font-bold uppercase">
                    <span className="flex items-center gap-2">
                      <span className="text-neutral-400 font-mono">#{index + 1}</span>
                      {widget.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleToggleTopWidget(widget.id)}
                        className={`px-2 py-1 border border-black font-black text-[10px] uppercase ${widget.visible ? 'bg-[#bbf7d0]' : 'bg-[#fecaca]'}`}
                      >
                        {widget.visible ? 'Tampil' : 'Sembunyi'}
                      </button>
                      <button 
                        disabled={index === 0}
                        onClick={() => handleMoveTopWidget(index, 'up')}
                        className="px-2 py-1 border border-black bg-white disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button 
                        disabled={index === topWidgets.length - 1}
                        onClick={() => handleMoveTopWidget(index, 'down')}
                        className="px-2 py-1 border border-black bg-white disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-3">Widget Konten Dashboard</h4>
              <div className="space-y-2">
                {columnWidgets.map((widget, index) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 border-2 border-black bg-[#FAF9F5] text-xs font-bold uppercase">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-black text-black">{widget.name}</span>
                      <span className="text-[9px] text-neutral-400 tracking-wider">
                        KOLOM: {widget.column === 'left' ? 'KIRI' : 'KANAN'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => handleToggleColumnWidget(widget.id)}
                        className={`px-2 py-1 border border-black font-black text-[10px] uppercase ${widget.visible ? 'bg-[#bbf7d0]' : 'bg-[#fecaca]'}`}
                      >
                        {widget.visible ? 'Tampil' : 'Sembunyi'}
                      </button>
                      <button 
                        disabled={index === 0}
                        onClick={() => handleMoveColumnWidget(index, 'up')}
                        className="px-2 py-1 border border-black bg-white disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button 
                        disabled={index === columnWidgets.length - 1}
                        onClick={() => handleMoveColumnWidget(index, 'down')}
                        className="px-2 py-1 border border-black bg-white disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button 
                        onClick={() => handleSwitchColumnWidget(widget.id)}
                        className="px-2 py-1 border border-black bg-[#bfdbfe]"
                        title="Pindah kolom"
                      >
                        ⇆
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {topWidgets
          .filter(w => w.visible)
          .map(w => {
            if (w.id === 'total-balance') {
              return (
                <div key={w.id} className="brutal-card p-6 bg-black text-white flex flex-col justify-between border-[3px] border-black shadow-[5px_5px_0px_0px_#000]">
                  <div>
                    <p className="text-xs font-black text-[#bbf7d0] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 stroke-[2.5px]" /> {lang === 'id' ? 'Total Saldo Dompet' : 'Total Wallet Balance'}
                    </p>
                    <h2 className="text-3xl xl:text-4xl font-black text-white truncate">{maskBalance(formatRupiah(totalBalance))}</h2>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-700 flex justify-between items-center text-[11px] font-bold">
                    <span className="text-neutral-400 uppercase tracking-wide">
                      {activeBalances.length} {lang === 'id' ? 'Dompet Aktif' : 'Active Wallets'}
                    </span>
                    <span className="text-[#bbf7d0] uppercase tracking-wide font-black">
                      {lang === 'id' ? 'Arus Kas: ' : 'Cashflow: '}{monthlyFlow.net >= 0 ? '+' : ''}{maskBalance(formatRupiah(monthlyFlow.net))}
                    </span>
                  </div>
                </div>
              );
            }
            if (w.id === 'safe-to-spend') {
              return (
                <div key={w.id} className="brutal-card p-6 bg-[#FAF9F5] text-black flex flex-col justify-between border-[3px] border-black shadow-[5px_5px_0px_0px_#000]">
                  <div>
                    <p className="text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 stroke-[2.5px] text-amber-600" /> {lang === 'id' ? 'Aman Dibelanjakan Hari Ini' : 'Safe to Spend Today'}
                    </p>
                    <h2 className="text-3xl xl:text-4xl font-black truncate text-black">
                      {maskBalance(formatRupiah(safeToSpendDaily))}
                    </h2>
                  </div>

                  <div className="mt-4 pt-3 border-t-2 border-black flex justify-between items-center text-[10px] sm:text-[11px] font-bold">
                    <span className="text-neutral-600 uppercase tracking-wide">
                      {lang === 'id' ? `Sisa ${remainingDays} Hari` : `${remainingDays} Days Left`}
                    </span>
                    <span className="text-black uppercase tracking-wide font-black truncate ml-2">
                      {lang === 'id' ? 'Sisa: ' : 'Rem.: '}{maskBalance(formatRupiah(remainingBudget))}
                    </span>
                  </div>
                </div>
              );
            }
            if (w.id === 'net-worth') {
              return (
                <div key={w.id} className="brutal-card p-6 bg-white text-black flex flex-col justify-between border-[3px] border-black shadow-[5px_5px_0px_0px_#000]">
                  <div>
                    <p className="text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 stroke-[2.5px]" /> {t('card_net_worth')} (Net Worth)
                    </p>
                    <h2 className={`text-3xl xl:text-4xl font-black truncate ${netWorth >= 0 ? 'text-black' : 'text-red-600'}`}>
                      {maskBalance(formatRupiah(netWorth))}
                    </h2>
                  </div>
                  <div className="text-[10px] font-bold text-black mt-4 flex justify-between uppercase tracking-wider border-t-2 border-black pt-3">
                    <span className="text-red-700 font-black">{lang === 'id' ? 'Utang' : 'Debt'}: {maskBalance(formatRupiah(activeUtang))}</span>
                    <span className="text-emerald-700 font-black">{lang === 'id' ? 'Piutang' : 'Receivable'}: {maskBalance(formatRupiah(activePiutang))}</span>
                  </div>
                </div>
              );
            }
            if (w.id === 'health-score') {
              return (
                <div key={w.id} className="md:col-span-2 lg:col-span-1">
                  <HealthScore transactions={transactions} balances={balances} debts={debts} />
                </div>
              );
            }
            return null;
          })}
      </div>

      {/* Quick Start Guide for New Onboarding Users */}
      <QuickStartGuide
        balances={balances}
        transactions={transactions}
        onNewTransaction={onNewTransaction}
        userId={user.id}
      />

      {/* Weekly Smart Spending Insight Banner */}
      <WeeklyInsightBanner
        transactions={transactions}
        userId={user.id}
      />

      {/* PWA Mobile App Installation Prompt */}
      <PWAInstallBanner />

      {/* Smart Input & Quick Entry Callout Banner */}
      {onNewTransaction && (
        <div className="border-[3px] border-black bg-[#FFE066] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-black stroke-[2.5px]" />
              <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-wider">
                Catat Transaksi Instan (Smart Input)
              </h3>
            </div>
            <p className="text-xs font-bold text-neutral-800 leading-relaxed">
              Ketik cepat: <span className="font-mono bg-white px-1.5 py-0.5 border border-black font-black text-[11px]">kopi 25k gopay</span>, <span className="font-mono bg-white px-1.5 py-0.5 border border-black font-black text-[11px]">gaji 5jt bca</span>, atau <span className="font-mono bg-white px-1.5 py-0.5 border border-black font-black text-[11px]">transfer bca ke dana 100k</span>.
            </p>
          </div>

          <button
            onClick={onNewTransaction}
            className="brutal-btn px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-black text-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0"
          >
            + Catat Sekarang
          </button>
        </div>
      )}

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Wider, Primary Activity & Distribution) */}
        <div className="lg:col-span-2 space-y-6">
          {columnWidgets
            .filter(w => w.column === 'left' && w.visible)
            .map(w => renderColumnWidget(w.id))}
        </div>
        
        {/* Right Column (Planning, Budgets & Discipline) */}
        <div className="space-y-6">
          {columnWidgets
            .filter(w => w.column === 'right' && w.visible)
            .map(w => renderColumnWidget(w.id))}
        </div>
      </div>
    </div>
  );
}
