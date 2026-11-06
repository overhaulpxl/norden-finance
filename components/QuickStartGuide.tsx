'use client';

import { useState } from 'react';
import { Balance, Transaction } from '../types';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Wallet, Coins, X } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface QuickStartGuideProps {
  balances: Balance[];
  transactions: Transaction[];
  onNewTransaction?: () => void;
  userId: string;
}

export default function QuickStartGuide({
  balances,
  transactions,
  onNewTransaction,
  userId,
}: QuickStartGuideProps) {
  const { lang } = useLanguage();
  const isId = lang === 'id';

  const storageKey = `norden_quickstart_dismissed_${userId}`;
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storageKey) === 'true';
  });

  const activeBalances = balances.filter((b) => !b.archivedAt);
  const totalBalance = activeBalances.reduce((sum, b) => sum + b.currentBalance, 0);

  const step1Done = activeBalances.length > 0;
  const step2Done = totalBalance > 0;
  const step3Done = transactions.length > 0;

  const allDone = step1Done && step2Done && step3Done;

  if (isDismissed || allDone) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };

  return (
    <div className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 shadow-[4px_4px_0px_0px_#000] rounded-xl relative select-none animate-in fade-in duration-200 text-black dark:text-white">
      <div className="flex items-start justify-between border-b-2 border-black dark:border-neutral-700 pb-3 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-black bg-[#FFE066] text-black text-[10px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_#000] mb-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5" /> {isId ? 'Panduan Pengguna Baru (3 Langkah)' : 'New User Guide (3 Steps)'}
          </span>
          <h3 className="text-sm sm:text-base font-black text-black dark:text-white uppercase tracking-wider">
            {isId ? 'Mulai Aktifkan Workspace Keuangan Anda' : 'Activate Your Financial Workspace'}
          </h3>
          <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-0.5">
            {isId
              ? 'Selesaikan 3 langkah mudah ini untuk langsung merasakan otomatisasi Norden Finance.'
              : 'Complete these 3 easy steps to experience Norden Finance automation immediately.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-neutral-400 hover:text-black dark:hover:text-white border border-transparent hover:border-black rounded-lg cursor-pointer"
          title={isId ? 'Tutup panduan ini' : 'Dismiss this guide'}
        >
          <X className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Step 1 */}
        <div
          className={`p-3.5 border-2 border-black dark:border-neutral-700 rounded-xl ${
            step1Done
              ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-100'
              : 'bg-[#FAF9F5] dark:bg-neutral-800 text-black dark:text-white'
          } shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase ${step1Done ? 'text-emerald-900 dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {isId ? 'Langkah 1' : 'Step 1'}
              </span>
              {step1Done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-emerald-300 stroke-[3px]" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-400 stroke-[2px]" />
              )}
            </div>
            <h4 className={`font-black text-xs uppercase tracking-wider flex items-center gap-1.5 ${step1Done ? 'text-black dark:text-emerald-100' : 'text-black dark:text-white'}`}>
              <Wallet className="w-3.5 h-3.5" /> {isId ? 'Buat Dompet Utama' : 'Create Primary Wallet'}
            </h4>
            <p className={`text-[11px] font-bold mt-1 ${step1Done ? 'text-emerald-950 dark:text-emerald-200' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {step1Done
                ? `${isId ? 'Tersedia' : 'Available'}: ${activeBalances[0]?.name}`
                : (isId ? 'Tambahkan rekening bank atau e-wallet (e.g. BCA, GoPay).' : 'Add a bank account or e-wallet (e.g. BCA, GoPay).')}
            </p>
          </div>
          {step1Done && (
            <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase mt-3 block">
              {isId ? '✓ Selesai' : '✓ Done'}
            </span>
          )}
        </div>

        {/* Step 2 */}
        <div
          className={`p-3.5 border-2 border-black dark:border-neutral-700 rounded-xl ${
            step2Done
              ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-100'
              : 'bg-[#FAF9F5] dark:bg-neutral-800 text-black dark:text-white'
          } shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase ${step2Done ? 'text-emerald-900 dark:text-emerald-300' : 'text-neutral-500 dark:text-neutral-400'}`}>
                {isId ? 'Langkah 2' : 'Step 2'}
              </span>
              {step2Done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-emerald-300 stroke-[3px]" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-400 stroke-[2px]" />
              )}
            </div>
            <h4 className={`font-black text-xs uppercase tracking-wider flex items-center gap-1.5 ${step2Done ? 'text-black dark:text-emerald-100' : 'text-black dark:text-white'}`}>
              <Coins className="w-3.5 h-3.5" /> {isId ? 'Masukkan Saldo Awal' : 'Set Initial Balance'}
            </h4>
            <p className={`text-[11px] font-bold mt-1 ${step2Done ? 'text-emerald-950 dark:text-emerald-200' : 'text-neutral-600 dark:text-neutral-400'}`}>
              {step2Done
                ? (isId ? 'Saldo awal sudah terisi.' : 'Initial balance is set.')
                : (isId ? 'Atur nominal uang tunai atau saldo rekening saat ini.' : 'Set current cash or bank account balance.')}
            </p>
          </div>
          {step2Done && (
            <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase mt-3 block">
              {isId ? '✓ Selesai' : '✓ Done'}
            </span>
          )}
        </div>

        {/* Step 3 */}
        <div
          className={`p-3.5 border-2 border-black dark:border-neutral-700 rounded-xl ${
            step3Done
              ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-100'
              : 'bg-[#FFE066] text-black'
          } shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-black uppercase ${step3Done ? 'text-emerald-900 dark:text-emerald-300' : 'text-neutral-800'}`}>
                {isId ? 'Langkah 3' : 'Step 3'}
              </span>
              {step3Done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-800 dark:text-emerald-300 stroke-[3px]" />
              ) : (
                <Circle className="w-4 h-4 text-black stroke-[2.5px]" />
              )}
            </div>
            <h4 className={`font-black text-xs uppercase tracking-wider flex items-center gap-1.5 ${step3Done ? 'text-black dark:text-emerald-100' : 'text-black'}`}>
              <Sparkles className="w-3.5 h-3.5" /> {isId ? 'Catat Transaksi 1' : 'Log First Transaction'}
            </h4>
            <p className="text-[11px] font-bold text-neutral-800 mt-1">
              {step3Done
                ? (isId ? 'Transaksi pertama berhasil dicatat.' : 'First transaction recorded.')
                : (isId ? 'Coba ketik "kopi 20rb gopay" di Smart Input.' : 'Try typing "coffee 20k gopay" in Smart Input.')}
            </p>
          </div>

          {!step3Done && onNewTransaction && (
            <button
              type="button"
              onClick={onNewTransaction}
              className="mt-3 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] flex items-center justify-center gap-1 cursor-pointer hover:bg-neutral-800 rounded-lg"
            >
              <span>{isId ? 'Coba Sekarang' : 'Try Now'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
