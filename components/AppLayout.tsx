'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Transaction, Balance, SavingGoal, Debt, WishlistItem, Paylater, Budget, AppSubscription, EmergencyFundPlan, TransactionTemplate, RecurringTransaction, Reminder, Achievement } from '../types';
import Sidebar from './Sidebar';
import OverviewLayout from './OverviewLayout';
import BrandLogo from './BrandLogo';
import { Menu, Eye, EyeOff, Home, Wallet, Target, History, Plus, Search } from 'lucide-react';
const WelcomeToast = dynamic(() => import('./WelcomeToast'), {
  ssr: false,
});
const AppLockScreen = dynamic(() => import('./AppLockScreen'), {
  ssr: false,
});
const GlobalUndoToast = dynamic(() => import('./GlobalUndoToast'), {
  ssr: false,
});
const NetworkStatusIndicator = dynamic(() => import('./NetworkStatusIndicator'), {
  ssr: false,
});
const CommandPaletteModal = dynamic(() => import('./CommandPaletteModal'), {
  ssr: false,
});
import { useLanguage } from '../lib/i18n';
import { useHideBalance } from '../lib/HideBalanceContext';
import { registerServiceWorker } from '../lib/pwa';
import { triggerHaptic } from '../lib/haptics';

function PanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`brutal-card bg-white border-[3px] border-black p-6 ${className}`}>
      <div className="h-4 w-40 bg-neutral-200 border-2 border-black animate-pulse" />
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full bg-neutral-100 border border-neutral-200 animate-pulse" />
        <div className="h-3 w-5/6 bg-neutral-100 border border-neutral-200 animate-pulse" />
        <div className="h-3 w-2/3 bg-neutral-100 border border-neutral-200 animate-pulse" />
      </div>
    </div>
  );
}

const BalanceCards = dynamic(() => import('./BalanceCards'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const SavingGoals = dynamic(() => import('./SavingGoals'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const DebtList = dynamic(() => import('./DebtList'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const Wishlist = dynamic(() => import('./Wishlist'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const TransactionTable = dynamic(() => import('./TransactionTable'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const MonthlyRecap = dynamic(() => import('./MonthlyRecap'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const ExpenseChart = dynamic(() => import('./ExpenseChart'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const QuickInputModal = dynamic(() => import('./QuickInputModal'), {
  ssr: false,
  loading: () => null,
});
const PaylaterList = dynamic(() => import('./PaylaterList'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const SettingsPage = dynamic(() => import('./SettingsPage'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const HelpPage = dynamic(() => import('./HelpPage'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const AutomationCenter = dynamic(() => import('./AutomationCenter'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const FinancialTimeline = dynamic(() => import('./FinancialTimeline'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const NotificationCenter = dynamic(() => import('./NotificationCenter'), {
  ssr: false,
  loading: () => (
    <div className="h-10 w-10 border-[2px] border-black bg-white shadow-[2px_2px_0px_0px_#000] animate-pulse" />
  ),
});
const NextGenIntelligence = dynamic(() => import('./NextGenIntelligence'), {
  ssr: false,
  loading: () => <PanelSkeleton className="min-h-[320px]" />,
});

interface AppLayoutProps {
  user: {
    id: string;
    email: string;
    plan: 'trial' | 'pro';
    effectivePlan?: string;
    fullName?: string;
    trialEndsAt?: string | null;
    role?: string;
  };
  transactions: Transaction[];
  balances: Balance[];
  savingGoals: SavingGoal[];
  debts: Debt[];
  wishlist: WishlistItem[];
  paylaters: Paylater[];
  budgets: Budget[];
  subscriptions: AppSubscription[];
  emergencyFundPlan: EmergencyFundPlan | null;
  templates: TransactionTemplate[];
  recurringTransactions: RecurringTransaction[];
  reminders: Reminder[];
  achievements: Achievement[];
  trialDays: number;
  pricingPlans: {
    monthly: { price: number; name: string } | null;
    yearly: { price: number; name: string } | null;
  };
  dataError?: string | null;
}

export default function AppLayout({
  user,
  transactions,
  balances,
  savingGoals,
  debts,
  wishlist,
  paylaters,
  budgets,
  subscriptions,
  emergencyFundPlan,
  templates,
  recurringTransactions,
  reminders,
  achievements,
  trialDays,
  pricingPlans,
  dataError
}: AppLayoutProps) {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { isBalanceHidden, toggleHideBalance } = useHideBalance();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallet' | 'goals' | 'history' | 'automation' | 'reports' | 'settings' | 'help'>(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      const validTabs = ['overview', 'wallet', 'goals', 'history', 'automation', 'reports', 'settings', 'help'];
      if (tabParam && validTabs.includes(tabParam)) {
        return tabParam as 'overview' | 'wallet' | 'goals' | 'history' | 'automation' | 'reports' | 'settings' | 'help';
      }
    }
    return 'overview';
  });
  const [showModal, setShowModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('action') === 'new_tx';
    }
    return false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global shortcuts and Service Worker initialization
  useEffect(() => {
    registerServiceWorker();

    // Clean URL query params if shortcut was used
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('action') || url.searchParams.has('tab')) {
        url.searchParams.delete('action');
        url.searchParams.delete('tab');
        const cleanUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '');
        window.history.replaceState({}, '', cleanUrl);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (tab: typeof activeTab) => {
    triggerHaptic('selection');
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const levelInfo = (() => {
    const txCount = transactions.length;
    const budgetCount = budgets.length;
    const goalCount = savingGoals.length;
    if (txCount >= 100 && goalCount >= 1) return { level: 5, name: 'Financial Navigator', color: 'bg-[#c084fc]' }; // purple
    if (txCount >= 50 && budgetCount >= 2) return { level: 4, name: 'Budget Master', color: 'bg-[#4ade80]' }; // green
    if (txCount >= 20 && (budgetCount >= 1 || goalCount >= 1)) return { level: 3, name: 'Smart Planner', color: 'bg-[#facc15]' }; // yellow
    if (txCount >= 5) return { level: 2, name: 'Consistent Tracker', color: 'bg-[#60a5fa]' }; // blue
    return { level: 1, name: 'Beginner Saver', color: 'bg-[#a3a3a3]' }; // gray
  })();

  const tabTitle = {
    overview: t('nav_home'),
    wallet: t('nav_wallet'),
    goals: t('nav_goals'),
    history: t('nav_history'),
    automation: t('nav_automation'),
    reports: t('nav_reports'),
    settings: t('nav_settings'),
    help: t('nav_help'),
  }[activeTab];

  return (
    <div className="flex min-h-screen bg-[#FAF9F5]" style={{ backgroundImage: 'radial-gradient(#d1d1d1 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>
      <AppLockScreen userId={user.id} userEmail={user.email} />
      <WelcomeToast userId={user.id} fullName={user.fullName} />
      <GlobalUndoToast />
      <NetworkStatusIndicator />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar user={user} activeTab={activeTab} setActiveTab={handleTabChange} onNewTransaction={() => { setShowModal(true); setSidebarOpen(false); }} levelInfo={levelInfo} />
      </div>

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 min-w-0">
        <header className="flex justify-between items-center mb-6 lg:mb-8 border-b-[3px] border-black pb-4 select-none">
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => { triggerHaptic('light'); setSidebarOpen(true); }}
              aria-label="Buka menu navigasi"
              className="lg:hidden rounded-none border-[2px] border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000] transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
            <div className="lg:hidden shrink-0">
              <BrandLogo variant="icon" priority className="h-7 w-7" />
            </div>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-wider text-black truncate">
              {tabTitle}
            </h2>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Command / Search Palette Trigger */}
            <button
              type="button"
              onClick={() => { triggerHaptic('light'); setShowCommandPalette(true); }}
              title="Cari menu, aksi cepat, atau transaksi (⌘K)"
              className="p-2 border-[2px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer bg-white hover:bg-neutral-50 text-black flex items-center gap-1.5"
            >
              <Search className="w-4 h-4 stroke-[2.5px]" />
              <kbd className="hidden md:inline-block px-1 py-0 border border-black bg-[#FAF9F5] text-[9px] font-black uppercase">
                ⌘K
              </kbd>
            </button>

            {/* Hide / Show Balance Toggle Button */}
            <button
              type="button"
              onClick={() => { triggerHaptic('light'); toggleHideBalance(); }}
              title={isBalanceHidden ? t('btn_show_balance') : t('btn_hide_balance')}
              className={`p-2 border-[2px] border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer ${
                isBalanceHidden ? 'bg-amber-100 text-black' : 'bg-white text-black'
              }`}
            >
              {isBalanceHidden ? <EyeOff className="w-4 h-4 stroke-[2.5px]" /> : <Eye className="w-4 h-4 stroke-[2.5px]" />}
            </button>

            {/* Language Switcher [ ID | EN ] */}
            <div className="flex border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white text-[11px] font-black uppercase tracking-wider overflow-hidden">
              <button
                type="button"
                onClick={() => setLang('id')}
                className={`px-2 py-1.5 transition-colors cursor-pointer ${
                  lang === 'id' ? 'bg-[#FFE066] text-black font-black' : 'bg-white text-neutral-500 hover:text-black'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1.5 transition-colors cursor-pointer border-l-[1.5px] border-black ${
                  lang === 'en' ? 'bg-[#FFE066] text-black font-black' : 'bg-white text-neutral-500 hover:text-black'
                }`}
              >
                EN
              </button>
            </div>

            {/* Level and PRO badge (Desktop only) */}
            <div className="hidden sm:flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${levelInfo.color}`}>
                Lvl {levelInfo.level}: {levelInfo.name}
              </span>
              {user.effectivePlan === 'PRO_ACTIVE' && (
                <span className="bg-[#FFE066] text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                  👑 PRO
                </span>
              )}
              {user.effectivePlan === 'PRO_PENDING' && (
                <span className="bg-amber-200 text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                  ⏳ PRO (REVIEW)
                </span>
              )}
              {user.effectivePlan === 'FREE_BASIC' && (
                <span className="bg-neutral-200 text-neutral-800 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                  🌱 FREE BASIC
                </span>
              )}
            </div>

            <NotificationCenter />

            <button
              onClick={() => setShowModal(true)}
              className="brutal-btn px-3 sm:px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer shrink-0"
              title="Catat transaksi baru"
            >
              <span className="hidden sm:inline">{t('btn_new_transaction')}</span>
              <span className="sm:hidden font-black">{t('btn_new_tx_short')}</span>
            </button>
          </div>
        </header>

        {dataError && (
          <div className="mb-6 border-[3px] border-black bg-[#ffccd5] p-4 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] rounded-none">
            {dataError}
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'overview' && (
            <OverviewLayout
              user={user}
              transactions={transactions}
              balances={balances}
              debts={debts}
              wishlist={wishlist}
              savingGoals={savingGoals}
              budgets={budgets}
              subscriptions={subscriptions}
              paylaters={paylaters}
              emergencyFundPlan={emergencyFundPlan}
              achievements={achievements}
              onNewTransaction={() => setShowModal(true)}
            />
          )}

          {activeTab === 'wallet' && (
            <BalanceCards balances={balances} />
          )}

          {activeTab === 'goals' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Wishlist items={wishlist} balances={balances} />
                <SavingGoals goals={savingGoals} transactions={transactions} />
              </div>
              <div className="space-y-6">
                <PaylaterList paylaters={paylaters} balances={balances} />
                <DebtList debts={debts} />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="brutal-card p-4 sm:p-6 bg-white">
                <TransactionTable transactions={transactions} balances={balances} />
              </div>
              <FinancialTimeline transactions={transactions} />
            </div>
          )}

          {activeTab === 'automation' && (
            <AutomationCenter
              templates={templates}
              recurringTransactions={recurringTransactions}
              reminders={reminders}
              balances={balances}
            />
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <NextGenIntelligence
                transactions={transactions}
                balances={balances}
                budgets={budgets}
                subscriptions={subscriptions}
                savingGoals={savingGoals}
                debts={debts}
                paylaters={paylaters}
                achievements={achievements}
              />
              <div className="brutal-card bg-white p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">Exports & Reports</h3>
                    <p className="text-sm text-slate-500">Download data transaksi dan laporan bulanan.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href="/api/export?format=csv" className="brutal-btn-light min-h-11 text-sm">CSV</a>
                    <a href="/api/export?format=json" className="brutal-btn-light min-h-11 text-sm">JSON</a>
                    <a href="/api/export?format=pdf" className="brutal-btn min-h-11 text-sm">PDF Report</a>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MonthlyRecap transactions={transactions} />
                <ExpenseChart transactions={transactions} />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              user={user}
              trialDays={trialDays}
              pricingPlans={pricingPlans}
              stats={{
                transactionCount: transactions.length,
                walletCount: balances.length,
                balanceTotal: balances.reduce((a, b) => a + b.currentBalance, 0),
              }}
            />
          )}

          {activeTab === 'help' && (
            <div className="brutal-card p-4 sm:p-6 bg-white">
              <HelpPage />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-[3px] border-black safe-bottom shadow-[0px_-2px_0px_0px_rgba(0,0,0,1)] select-none">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'overview' ? 'text-black font-black' : 'text-neutral-400 hover:text-black font-bold'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.75px]' : 'stroke-[2px]'}`} />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{lang === 'id' ? 'Beranda' : 'Home'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('wallet')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'wallet' ? 'text-black font-black' : 'text-neutral-400 hover:text-black font-bold'
            }`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'stroke-[2.75px]' : 'stroke-[2px]'}`} />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{lang === 'id' ? 'Dompet' : 'Wallets'}</span>
          </button>

          {/* Floating Action Button (FAB) */}
          <div className="relative -top-4 flex flex-col items-center justify-center px-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setShowModal(true);
              }}
              aria-label="Catat Transaksi"
              className="w-13 h-13 rounded-full bg-[#FFE066] hover:bg-[#FFD633] text-black border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-7 h-7 stroke-[3px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleTabChange('goals')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'goals' ? 'text-black font-black' : 'text-neutral-400 hover:text-black font-bold'
            }`}
          >
            <Target className={`w-5 h-5 ${activeTab === 'goals' ? 'stroke-[2.75px]' : 'stroke-[2px]'}`} />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{lang === 'id' ? 'Target' : 'Goals'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'history' ? 'text-black font-black' : 'text-neutral-400 hover:text-black font-bold'
            }`}
          >
            <History className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.75px]' : 'stroke-[2px]'}`} />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{lang === 'id' ? 'Riwayat' : 'History'}</span>
          </button>
        </div>
      </nav>

      {showModal && (
        <QuickInputModal
          balances={balances}
          onClose={() => setShowModal(false)}
          onSuccess={() => router.refresh()}
        />
      )}

      {showCommandPalette && (
        <CommandPaletteModal
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
          onNavigate={(tab) => handleTabChange(tab as typeof activeTab)}
          onNewTransaction={() => setShowModal(true)}
          transactions={transactions}
          balances={balances}
          userId={user.id}
        />
      )}
    </div>
  );
}
