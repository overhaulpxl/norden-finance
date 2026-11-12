'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Transaction, Balance, SavingGoal, Debt, WishlistItem, Paylater, Budget, AppSubscription, EmergencyFundPlan, TransactionTemplate, RecurringTransaction, Reminder, Achievement, PortfolioAsset } from '../types';
import Sidebar from './Sidebar';
import OverviewLayout from './OverviewLayout';
import BrandLogo from './BrandLogo';
import { Menu, Eye, EyeOff, Home, Wallet, Target, History, Plus, Search, Repeat2, FileText, Settings, HelpCircle, Loader2, ArrowDown, Calendar, Clock, Table } from 'lucide-react';
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
    <div className={`brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-6 ${className}`}>
      <div className="h-4 w-40 bg-neutral-200 dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 animate-pulse" />
      <div className="mt-5 space-y-3">
        <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 animate-pulse" />
        <div className="h-3 w-5/6 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 animate-pulse" />
        <div className="h-3 w-2/3 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 animate-pulse" />
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
const CashflowCalendar = dynamic(() => import('./CashflowCalendar'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const PortfolioManager = dynamic(() => import('./PortfolioManager'), {
  ssr: false,
  loading: () => <PanelSkeleton />,
});
const NotificationCenter = dynamic(() => import('./NotificationCenter'), {
  ssr: false,
  loading: () => (
    <div className="h-10 w-10 border-[2px] border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[2px_2px_0px_0px_#000] animate-pulse" />
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
  portfolioAssets?: PortfolioAsset[];
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
  portfolioAssets = [],
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
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [historyView, setHistoryView] = useState<'table' | 'calendar' | 'timeline'>('table');
  const pullDistanceRef = useRef(0);

  // Lock body scroll when mobile sidebar drawer is open to prevent background scrolling & gesture collision
  useEffect(() => {
    if (sidebarOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [sidebarOpen]);

  // Pull-to-Refresh & Auto-dismiss keyboard on mobile
  useEffect(() => {
    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Auto-dismiss keyboard when tapping outside input/textarea/select/button
      const target = e.target as HTMLElement | null;
      if (
        target &&
        !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) &&
        !target.closest('input, textarea, select, button, form')
      ) {
        if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          (document.activeElement as HTMLElement).blur();
        }
      }

      // Never trigger pull-to-refresh if touching inside sidebar aside or modal dialog
      if (target?.closest('aside') || target?.closest('[role="dialog"]')) {
        isPulling = false;
        return;
      }

      // Check if at top of page for pull-to-refresh
      if (window.scrollY <= 0 && e.touches.length === 1) {
        startY = e.touches[0].clientY;
        isPulling = true;
      } else {
        isPulling = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!isPulling || window.scrollY > 0 || target?.closest('aside') || target?.closest('[role="dialog"]')) return;
      const currentY = e.touches[0].clientY;
      const diffY = currentY - startY;
      if (diffY > 0) {
        const distance = Math.min(80, diffY * 0.4);
        pullDistanceRef.current = distance;
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling) return;
      isPulling = false;

      const currentDistance = pullDistanceRef.current;
      pullDistanceRef.current = 0;

      if (currentDistance >= 55) {
        triggerHaptic('medium');
        setRefreshing(true);
        setPullDistance(60);
        router.refresh();
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
        }, 1000);
      } else {
        setPullDistance(0);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [router]);

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
      } else if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    const handleOpenQuickInput = () => setShowModal(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('norden_open_quick_input', handleOpenQuickInput);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('norden_open_quick_input', handleOpenQuickInput);
    };
  }, []);

  const lastBottomNavTapRef = useRef<{ tab: string; time: number }>({ tab: '', time: 0 });

  const scrollToTop = () => {
    triggerHaptic('medium');
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    triggerHaptic('selection');
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const handleBottomNavClick = (tab: typeof activeTab) => {
    const now = Date.now();
    const isSameTab = lastBottomNavTapRef.current.tab === tab;
    const isDoubleTap = isSameTab && (now - lastBottomNavTapRef.current.time < 500);

    if (isDoubleTap) {
      lastBottomNavTapRef.current = { tab: '', time: 0 };
      scrollToTop();
      return;
    }

    lastBottomNavTapRef.current = { tab, time: now };
    handleTabChange(tab);
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
    <div className="flex min-h-screen w-full max-w-full overflow-x-hidden norden-canvas text-neutral-900 dark:text-neutral-100 selection:bg-[#FFE066] selection:text-black">
      <AppLockScreen userId={user.id} userEmail={user.email} />
      <WelcomeToast userId={user.id} fullName={user.fullName} />
      <GlobalUndoToast />
      <NetworkStatusIndicator />

      {/* Pull-to-Refresh Indicator on Mobile */}
      {pullDistance > 0 && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 lg:hidden flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-full shadow-[2px_2px_0px_0px_#000] text-black dark:text-white text-xs font-black uppercase tracking-wider transition-all"
          style={{ transform: `translate(-50%, ${Math.min(20, pullDistance * 0.3)}px)` }}
        >
          {refreshing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-black dark:text-white" />
              <span>{lang === 'id' ? 'Memperbarui...' : 'Refreshing...'}</span>
            </>
          ) : (
            <>
              <ArrowDown
                className="w-3.5 h-3.5 stroke-[3px] transition-transform duration-200"
                style={{ transform: pullDistance >= 55 ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
              <span>
                {pullDistance >= 55
                  ? lang === 'id'
                    ? 'Lepas untuk muat ulang'
                    : 'Release to refresh'
                  : lang === 'id'
                  ? 'Tarik untuk muat ulang'
                  : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] h-full max-h-dvh overflow-hidden transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:w-64 lg:z-30
        ${sidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none lg:pointer-events-auto'}
      `}>
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onNewTransaction={() => { triggerHaptic('medium'); setShowModal(true); setSidebarOpen(false); }}
          onClose={() => setSidebarOpen(false)}
          levelInfo={levelInfo}
        />
      </div>

      <div className="flex-1 lg:ml-64 w-full max-w-full min-w-0 flex flex-col min-h-screen">
        {/* Responsive Header (Desktop: Single Row, Mobile: Tier 1 Action Row + Tier 2 Dedicated Title Card) */}
        <header className="sticky top-0 z-30 w-full bg-[#FAF9F5]/95 dark:bg-neutral-900/95 backdrop-blur-md border-b-2 border-black dark:border-neutral-700 px-4 sm:px-6 lg:px-8 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 lg:py-4 select-none">
          {/* Top Row: Mobile Controls + Desktop Header */}
          <div className="flex justify-between items-center gap-2">
            {/* Desktop Page Title / Mobile Hamburger + Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setSidebarOpen(true); }}
                aria-label={lang === 'en' ? 'Open navigation menu' : 'Buka menu navigasi'}
                className="lg:hidden h-9 sm:h-10 w-9 sm:w-10 rounded-none border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0 cursor-pointer text-black dark:text-white flex items-center justify-center"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="lg:hidden flex items-center gap-1.5 shrink-0">
                <BrandLogo variant="icon" priority className="h-7 w-7" />
                <span className="font-black text-xs uppercase tracking-widest text-black dark:text-white">Norden</span>
              </div>
              <h2 className="hidden lg:flex items-center h-10 text-2xl lg:text-3xl font-black uppercase tracking-wider text-black dark:text-white truncate leading-none">
                {tabTitle}
              </h2>
            </div>

            {/* Header Actions (Search, Balance, Language, Level, Pro, Notification, New Transaction) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Quick Command / Search Palette Trigger */}
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setShowCommandPalette(true); }}
                title={lang === 'en' ? 'Search menu, quick actions, or transactions (Ctrl+K)' : 'Cari menu, aksi cepat, atau transaksi (Ctrl+K)'}
                className="h-9 sm:h-10 px-2.5 sm:px-3 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-black dark:text-white flex items-center justify-center gap-2 shrink-0"
              >
                <Search className="w-4 h-4 stroke-[2.5px]" />
                <kbd className="hidden md:inline-block px-1.5 py-0.5 border border-black dark:border-neutral-600 rounded-none bg-[#FAF9F5] dark:bg-neutral-900 text-[10px] font-mono font-black tracking-tight leading-none shadow-[1px_1px_0px_0px_#000]">
                  Ctrl K
                </kbd>
              </button>

              {/* Hide / Show Balance Toggle Button */}
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); toggleHideBalance(); }}
                title={isBalanceHidden ? t('btn_show_balance') : t('btn_hide_balance')}
                className={`h-9 sm:h-10 w-9 sm:w-10 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isBalanceHidden
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-black dark:text-amber-200'
                    : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                }`}
              >
                {isBalanceHidden ? <EyeOff className="w-4 h-4 stroke-[2.5px]" /> : <Eye className="w-4 h-4 stroke-[2.5px]" />}
              </button>

              {/* Language Switcher [ ID | EN ] */}
              <div className="h-9 sm:h-10 flex border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000] bg-white dark:bg-neutral-800 text-[11px] font-black uppercase tracking-wider overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => { triggerHaptic('selection'); setLang('id'); }}
                  className={`h-full px-2 sm:px-2.5 flex items-center justify-center transition-colors cursor-pointer ${
                    lang === 'id' ? 'font-black' : 'text-neutral-500 hover:text-black dark:hover:text-white'
                  }`}
                  style={lang === 'id' ? { backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' } : {}}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => { triggerHaptic('selection'); setLang('en'); }}
                  className={`h-full px-2 sm:px-2.5 flex items-center justify-center transition-colors cursor-pointer border-l-2 border-black dark:border-neutral-700 ${
                    lang === 'en' ? 'font-black' : 'text-neutral-500 hover:text-black dark:hover:text-white'
                  }`}
                  style={lang === 'en' ? { backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' } : {}}
                >
                  EN
                </button>
              </div>

              {/* Level and PRO badge (Desktop only) */}
              <div className="hidden sm:flex items-center gap-2">
                <span className={`h-9 sm:h-10 flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] text-black ${levelInfo.color}`}>
                  Lvl {levelInfo.level}: {levelInfo.name}
                </span>
                {user.effectivePlan === 'PRO_ACTIVE' && (
                  <span
                    className="h-9 sm:h-10 flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] gap-1"
                    style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
                  >
                    PRO
                  </span>
                )}
                {user.effectivePlan === 'PRO_PENDING' && (
                  <span className="h-9 sm:h-10 flex items-center bg-amber-200 text-black text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] gap-1">
                    PRO (REVIEW)
                  </span>
                )}
                {user.effectivePlan === 'FREE_BASIC' && (
                  <span className="h-9 sm:h-10 flex items-center bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000] gap-1">
                    FREE BASIC
                  </span>
                )}
              </div>

              <NotificationCenter />

              <button
                type="button"
                onClick={() => { triggerHaptic('medium'); setShowModal(true); }}
                className="brutal-btn-accent h-9 sm:h-10 px-3 sm:px-4 py-0 text-xs font-black uppercase tracking-wider cursor-pointer shrink-0 hidden sm:inline-flex items-center justify-center rounded-none shadow-[2px_2px_0px_0px_#000]"
                title={lang === 'en' ? 'Record new transaction' : 'Catat transaksi baru'}
              >
                <span>{t('btn_new_transaction')}</span>
              </button>
            </div>
          </div>

          {/* Tier 2: Mobile Dedicated Full-Width Page Title Card (Tap to scroll to top) */}
          <div 
            onClick={scrollToTop}
            className="lg:hidden mt-3 brutal-card p-3 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 flex items-center justify-between shadow-[2.5px_2.5px_0px_0px_#000] cursor-pointer active:translate-x-[1px] active:translate-y-[1px] transition-transform select-none rounded-none"
            title={lang === 'en' ? 'Tap to scroll to top' : 'Ketuk untuk kembali ke atas'}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="p-1.5 rounded-none border border-black dark:border-neutral-700 shadow-[1px_1px_0px_0px_#000] shrink-0"
                style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
              >
                {activeTab === 'overview' && <Home className="w-4 h-4 stroke-[2.5px]" />}
                {activeTab === 'wallet' && <Wallet className="w-4 h-4 stroke-[2.5px]" />}
                {activeTab === 'goals' && <Target className="w-4 h-4 stroke-[2.5px]" />}
                {activeTab === 'history' && <History className="w-4 h-4 stroke-[2.5px]" />}
                {activeTab === 'automation' && <Repeat2 className="w-4 h-4 stroke-[2.5px]" />}
                {activeTab === 'reports' && <FileText className="w-4 h-4 stroke-[2.5px]" />}
                {activeTab === 'settings' && <Settings className="w-4 h-4 stroke-[2.5px]" />}
                {activeTab === 'help' && <HelpCircle className="w-4 h-4 stroke-[2.5px]" />}
              </div>
              <h1 className="text-sm font-black uppercase tracking-wider text-black dark:text-white truncate">
                {tabTitle}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-black rounded-none shadow-[1px_1px_0px_0px_#000] text-black ${levelInfo.color}`}>
                Lvl {levelInfo.level}
              </span>
              {user.effectivePlan === 'PRO_ACTIVE' && (
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border border-black rounded-none shadow-[1px_1px_0px_0px_#000]"
                  style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
                >
                  PRO
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 min-w-0">
          {dataError && (
          <div className="mb-6 border-[3px] border-black dark:border-neutral-700 bg-[#ffccd5] dark:bg-red-950/80 p-4 text-xs font-black uppercase tracking-wider text-black dark:text-red-200 shadow-[3px_3px_0px_0px_#000] rounded-none">
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
            <div className="space-y-6">
              <BalanceCards balances={balances} />
              <PortfolioManager initialAssets={portfolioAssets} />
            </div>
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2.5px_2.5px_0px_0px_#000]">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setHistoryView('table');
                    }}
                    className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      historyView === 'table'
                        ? 'bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                        : 'text-neutral-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>{lang === 'id' ? 'Tabel Mutasi' : 'Table'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setHistoryView('calendar');
                    }}
                    className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      historyView === 'calendar'
                        ? 'bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                        : 'text-neutral-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>{lang === 'id' ? 'Kalender Arus Kas' : 'Cashflow Calendar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setHistoryView('timeline');
                    }}
                    className={`px-3 py-1.5 rounded-none text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      historyView === 'timeline'
                        ? 'bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                        : 'text-neutral-500 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>{lang === 'id' ? 'Lini Masa' : 'Timeline'}</span>
                  </button>
                </div>
              </div>

              {historyView === 'table' && (
                <div className="brutal-card p-4 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700">
                  <TransactionTable transactions={transactions} balances={balances} />
                </div>
              )}

              {historyView === 'calendar' && (
                <CashflowCalendar transactions={transactions} subscriptions={subscriptions} />
              )}

              {historyView === 'timeline' && (
                <FinancialTimeline transactions={transactions} />
              )}
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
              <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider">
                      {lang === 'id' ? 'Ekspor Data & Laporan' : 'Exports & Reports'}
                    </h3>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {lang === 'id'
                        ? 'Unduh cadangan data transaksi dan ringkasan laporan bulanan.'
                        : 'Download transaction backups and monthly summary reports.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="/api/export?format=csv"
                      className="px-3.5 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-none text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
                    >
                      CSV
                    </a>
                    <a
                      href="/api/export?format=json"
                      className="px-3.5 py-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-none text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
                    >
                      JSON
                    </a>
                    <a
                      href="/api/export?format=pdf"
                      className="px-3.5 py-2 border-2 border-black rounded-none text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer text-black"
                      style={{
                        backgroundColor: 'var(--theme-accent, #FFE066)',
                        color: 'var(--theme-accent-text, #000000)',
                      }}
                    >
                      {lang === 'id' ? 'Laporan PDF' : 'PDF Report'}
                    </a>
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
                walletCount: balances.filter((b) => !b.archivedAt).length,
                balanceTotal: balances
                  .filter((b) => !b.archivedAt)
                  .reduce((a, b) => a + b.currentBalance, 0),
              }}
            />
          )}

          {activeTab === 'help' && (
            <div className="brutal-card p-4 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700">
              <HelpPage />
            </div>
          )}
        </div>
      </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar (Soft-Neobrutalism + Dynamic Accent FAB) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t-2 border-black dark:border-neutral-700 safe-bottom shadow-[0px_-2px_0px_0px_rgba(0,0,0,1)] select-none">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            type="button"
            onClick={() => handleBottomNavClick('overview')}
            onDoubleClick={scrollToTop}
            title={lang === 'en' ? 'Home (Tap twice to scroll to top)' : 'Beranda (Ketuk 2 kali untuk kembali ke atas)'}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'overview' ? 'text-black dark:text-white font-black' : 'text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white font-bold'
            }`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.75px]' : 'stroke-[2px]'}`} />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{lang === 'id' ? 'Beranda' : 'Home'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleBottomNavClick('wallet')}
            onDoubleClick={scrollToTop}
            title={lang === 'en' ? 'Wallets (Tap twice to scroll to top)' : 'Dompet (Ketuk 2 kali untuk kembali ke atas)'}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'wallet' ? 'text-black dark:text-white font-black' : 'text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white font-bold'
            }`}
          >
            <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'stroke-[2.75px]' : 'stroke-[2px]'}`} />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{lang === 'id' ? 'Dompet' : 'Wallets'}</span>
          </button>

          {/* Floating Action Button (FAB) with Dynamic Accent Color */}
          <div className="relative -top-4 flex flex-col items-center justify-center px-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('medium');
                setShowModal(true);
              }}
              aria-label={lang === 'en' ? 'Record Transaction' : 'Catat Transaksi'}
              className="w-13 h-13 rounded-2xl border-2 border-black dark:border-neutral-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
            >
              <Plus className="w-7 h-7 stroke-[3px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleBottomNavClick('goals')}
            onDoubleClick={scrollToTop}
            title={lang === 'en' ? 'Goals (Tap twice to scroll to top)' : 'Target (Ketuk 2 kali untuk kembali ke atas)'}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'goals' ? 'text-black dark:text-white font-black' : 'text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white font-bold'
            }`}
          >
            <Target className={`w-5 h-5 ${activeTab === 'goals' ? 'stroke-[2.75px]' : 'stroke-[2px]'}`} />
            <span className="text-[10px] uppercase tracking-wider mt-0.5">{lang === 'id' ? 'Target' : 'Goals'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleBottomNavClick('history')}
            onDoubleClick={scrollToTop}
            title={lang === 'en' ? 'History (Tap twice to scroll to top)' : 'Riwayat (Ketuk 2 kali untuk kembali ke atas)'}
            className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
              activeTab === 'history' ? 'text-black dark:text-white font-black' : 'text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white font-bold'
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
          savingGoals={savingGoals}
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
