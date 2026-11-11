'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface WelcomeToastProps {
  userId: string;
  fullName?: string | null;
}

export default function WelcomeToast({ userId, fullName }: WelcomeToastProps) {
  const { lang } = useLanguage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const key = `norden_welcomed_${userId}`;
    const welcomed = localStorage.getItem(key);
    if (!welcomed) {
      // Trigger welcome message with delay to avoid cascading render lint issue
      const timer = setTimeout(() => setShow(true), 100);
      localStorage.setItem(key, 'true');
      return () => clearTimeout(timer);
    }
  }, [userId]);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 left-4 sm:left-auto max-w-sm w-[calc(100%-2rem)] sm:w-full z-50 bg-[#fef08a] dark:bg-amber-950/90 border-2 border-black dark:border-neutral-700 p-4 rounded-none shadow-[4px_4px_0px_0px_#000] animate-in slide-in-from-bottom duration-300 select-none text-black dark:text-white">
      <div className="flex gap-3">
        <div
          className="flex-shrink-0 p-1.5 border-2 border-black rounded-none text-black flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000]"
          style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
        >
          <Check className="w-5 h-5 stroke-[3px]" />
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-black uppercase tracking-wider">
            {lang === 'en'
              ? `Welcome to Norden${fullName ? `, ${fullName}` : ''}!`
              : `Selamat datang di Norden${fullName ? `, ${fullName}` : ''}!`}
          </p>
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-300 uppercase tracking-wide mt-1 leading-relaxed">
            {lang === 'en'
              ? 'Start organizing your finances today.'
              : 'Yuk atur keuanganmu mulai hari ini.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="flex-shrink-0 p-1.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-850 rounded-none shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer h-fit self-start"
        >
          <X className="w-3.5 h-3.5 stroke-[3px]" />
        </button>
      </div>
    </div>
  );
}
