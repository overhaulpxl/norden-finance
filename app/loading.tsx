'use client';

import { useEffect, useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import { useLanguage } from '../lib/i18n';

const MESSAGES_ID = [
  'Mengambil catatan transaksi...',
  'Menghitung saldo dompet & akun...',
  'Menganalisis ambang batas budget...',
  'Menyelaraskan target tabungan...',
  'Memproses pengingat tagihan...',
  'Mempersiapkan dashboard premium...',
];

const MESSAGES_EN = [
  'Fetching transaction records...',
  'Calculating wallet & account balances...',
  'Analyzing budget thresholds...',
  'Aligning savings goals...',
  'Processing bill reminders...',
  'Preparing premium dashboard...',
];

export default function Loading() {
  const { lang } = useLanguage();
  const messages = lang === 'en' ? MESSAGES_EN : MESSAGES_ID;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 800);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF9F5] dark:bg-neutral-950 select-none p-4 text-black dark:text-white">
      <style>{`
        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes subtle-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
      `}</style>

      <div className="relative max-w-sm w-full bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center flex flex-col items-center">
        <div
          className="flex items-center justify-center mb-4"
          style={{ animation: 'subtle-bounce 1.5s infinite ease-in-out' }}
        >
          <BrandLogo variant="horizontal" priority className="h-12 sm:h-14 w-auto" />
        </div>

        <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mt-1">
          Smart Financial Engine
        </p>

        <div className="w-full bg-[#FAF9F5] dark:bg-neutral-800 border-[3px] border-black dark:border-neutral-700 rounded-none h-6 overflow-hidden mt-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] relative">
          <div
            className="absolute inset-0 bg-[#bfdbfe] dark:bg-blue-600 border-r-[3px] border-black dark:border-neutral-700"
            style={{
              width: '50%',
              animation: 'progress-shimmer 1.5s infinite ease-in-out',
            }}
          />
        </div>

        <div className="flex items-center gap-2 mt-6 bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-full justify-center">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider truncate">
            {messages[messageIndex]}
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Sistem Norden</span>
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">100% Aman & Terenkripsi</span>
      </div>
    </div>
  );
}
