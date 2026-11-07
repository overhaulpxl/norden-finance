'use client';

import { Home, Wallet, Target, History, Plus, FileText, Settings, HelpCircle, LogOut, Shield, Repeat2 } from 'lucide-react';
import React, { useTransition } from 'react';
import { logoutAction } from '../app/authActions';
import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { useLanguage } from '../lib/i18n';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: SidebarTab) => void;
  onNewTransaction: () => void;
  user: {
    email: string;
    plan: 'trial' | 'pro';
    effectivePlan?: string;
    fullName?: string;
    trialEndsAt?: string | null;
    role?: string;
  };
  levelInfo: {
    level: number;
    name: string;
    color: string;
  };
}

type SidebarTab = 'overview' | 'wallet' | 'goals' | 'history' | 'automation' | 'reports' | 'settings' | 'help';

export default function Sidebar({ activeTab, setActiveTab, onNewTransaction, user, levelInfo }: SidebarProps) {
  const [isPending, startTransition] = useTransition();
  const [now] = React.useState(() => Date.now());
  const { t, lang } = useLanguage();

  const menuItems = [
    { id: 'overview', label: t('nav_home'), icon: Home },
    { id: 'wallet', label: t('nav_wallet'), icon: Wallet },
    { id: 'goals', label: t('nav_goals'), icon: Target },
    { id: 'history', label: t('nav_history'), icon: History },
    { id: 'automation', label: t('nav_automation'), icon: Repeat2 },
  ] as const;

  const secondaryItems: Array<{ id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'reports', label: t('nav_reports'), icon: FileText },
    { id: 'settings', label: t('nav_settings'), icon: Settings },
    { id: 'help', label: t('nav_help'), icon: HelpCircle },
  ];

  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const logoutTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, []);

  function handleLogout() {
    if (!confirmLogout) {
      setConfirmLogout(true);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = setTimeout(() => setConfirmLogout(false), 3000);
      return;
    }
    startTransition(async () => {
      await logoutAction();
      window.location.href = '/login';
    });
  }

  // Calculate trial days remaining
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <aside className="w-64 bg-[#FAF9F5] dark:bg-[#121215] text-black dark:text-white border-r-[3px] border-black dark:border-neutral-800 h-screen fixed left-0 top-0 flex flex-col pt-6 pb-6 z-10 select-none">
      {/* Logo */}
      <div className="px-6 mb-8">
        <BrandLogo variant="horizontal" priority className="h-12 w-auto" />
      </div>

      {/* CTA Button */}
      <div className="px-6 mb-8">
        <button 
          type="button"
          onClick={onNewTransaction}
          className="w-full border-2 border-black dark:border-neutral-700 font-black uppercase text-xs py-3 shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.15)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all rounded-xl cursor-pointer flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
        >
          <Plus className="w-4 h-4 stroke-[3px]" />
          {t('btn_new_transaction')}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 cursor-pointer ${
                isActive 
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] translate-x-[-1px] translate-y-[-1px]' 
                  : 'text-neutral-700 dark:text-neutral-300 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 stroke-[2.5px] ${isActive ? 'text-[#2ECC71]' : 'text-neutral-500 dark:text-neutral-400'}`} />
              {item.label}
            </button>
          );
        })}

        <div className="pt-4 pb-1">
          <p className="px-3 text-[9px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
            {lang === 'id' ? 'Lainnya' : 'Other'}
          </p>
        </div>
        
        {secondaryItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-2 cursor-pointer ${
                isActive 
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] translate-x-[-1px] translate-y-[-1px]' 
                  : 'text-neutral-700 dark:text-neutral-300 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-4.5 h-4.5 stroke-[2.5px] ${isActive ? 'text-[#2ECC71]' : 'text-neutral-500 dark:text-neutral-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Trial Banner */}
      {user.plan === 'trial' && trialDaysLeft !== null && (
        <div className="px-4 mb-3">
          <div className="p-3 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.1)] text-center">
            <p className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-wider">Trial</p>
            <p className="text-sm font-black text-black dark:text-white mt-0.5">
              {lang === 'id' ? `${trialDaysLeft} hari tersisa` : `${trialDaysLeft} days left`}
            </p>
            <a href="/upgrade" className="text-[10px] font-black text-black dark:text-white underline hover:opacity-80 transition-opacity mt-1.5 block">
              {lang === 'id' ? 'Upgrade ke Pro' : 'Upgrade to Pro'}
            </a>
          </div>
        </div>
      )}

      {/* Admin Panel Link */}
      {user.role === 'admin' && (
        <div className="px-4 mb-3">
          <Link 
            href="/norden-control-center" 
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-black dark:border-neutral-700 font-black uppercase text-xs rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer text-center"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
          >
            <Shield className="w-4 h-4 stroke-[2.5px]" />
            Admin Panel
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className="px-4 mt-auto">
        <div className="p-3 border-2 border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 shadow-[2.5px_2.5px_0px_0px_#000] dark:shadow-[2.5px_2.5px_0px_0px_rgba(255,255,255,0.1)] flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border-2 border-black dark:border-neutral-600 bg-[#2ECC71] flex items-center justify-center text-black font-black text-xs shrink-0">
              {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-black dark:text-white truncate leading-tight uppercase tracking-wider">{user.fullName || 'User'}</p>
              <p className="text-[8px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide truncate mt-0.5">Lvl {levelInfo.level}: {levelInfo.name}</p>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-black dark:border-neutral-700 inline-block mt-1 leading-none ${
                user.effectivePlan === 'PRO_ACTIVE'
                  ? 'bg-[#FFE066] text-black'
                  : user.effectivePlan === 'PRO_PENDING'
                  ? 'bg-amber-200 dark:bg-amber-950/80 text-black dark:text-amber-200'
                  : user.effectivePlan === 'TRIAL'
                  ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
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
          </div>
          <button 
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 border-2 border-black dark:border-neutral-700 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 mt-1 cursor-pointer bg-black text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            <LogOut className="w-3.5 h-3.5 stroke-[2.5px]" />
            {isPending
              ? (lang === 'id' ? 'Keluar...' : 'Logging out...')
              : confirmLogout
              ? (lang === 'id' ? 'Ulangi klik' : 'Click again')
              : (lang === 'id' ? 'Keluar Akun' : 'Log Out')}
          </button>
        </div>
      </div>
    </aside>
  );
}
