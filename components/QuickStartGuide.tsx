'use client';

import { useState } from 'react';
import { Balance, Transaction } from '../types';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Wallet, Coins, X } from 'lucide-react';

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
    <div className="border-[3px] border-black bg-white p-5 shadow-[5px_5px_0px_0px_#000] relative select-none animate-in fade-in duration-200">
      <div className="flex items-start justify-between border-b-2 border-black pb-3 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-black bg-[#FFE066] text-[10px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_#000] mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Panduan Pengguna Baru (3 Langkah)
          </span>
          <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-wider">
            Mulai Aktifkan Workspace Keuangan Anda
          </h3>
          <p className="text-xs font-bold text-neutral-600 mt-0.5">
            Selesaikan 3 langkah mudah ini untuk langsung merasakan otomatisasi Norden Finance.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-neutral-400 hover:text-black border border-transparent hover:border-black rounded-none cursor-pointer"
          title="Tutup panduan ini"
        >
          <X className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Step 1 */}
        <div
          className={`p-3.5 border-[2px] border-black ${
            step1Done ? 'bg-[#bbf7d0]' : 'bg-[#FAF9F5]'
          } shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-neutral-500">Langkah 1</span>
              {step1Done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-800 stroke-[3px]" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-400 stroke-[2px]" />
              )}
            </div>
            <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Buat Dompet Utama
            </h4>
            <p className="text-[11px] font-bold text-neutral-600 mt-1">
              {step1Done ? `Tersedia: ${activeBalances[0]?.name}` : 'Tambahkan rekening bank atau e-wallet (e.g. BCA, GoPay).'}
            </p>
          </div>
          {step1Done && (
            <span className="text-[10px] font-black text-emerald-800 uppercase mt-3 block">
              ✓ Selesai
            </span>
          )}
        </div>

        {/* Step 2 */}
        <div
          className={`p-3.5 border-[2px] border-black ${
            step2Done ? 'bg-[#bbf7d0]' : 'bg-[#FAF9F5]'
          } shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-neutral-500">Langkah 2</span>
              {step2Done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-800 stroke-[3px]" />
              ) : (
                <Circle className="w-4 h-4 text-neutral-400 stroke-[2px]" />
              )}
            </div>
            <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Masukkan Saldo Awal
            </h4>
            <p className="text-[11px] font-bold text-neutral-600 mt-1">
              {step2Done ? 'Saldo awal sudah terisi.' : 'Atur nominal uang tunai atau saldo rekening saat ini.'}
            </p>
          </div>
          {step2Done && (
            <span className="text-[10px] font-black text-emerald-800 uppercase mt-3 block">
              ✓ Selesai
            </span>
          )}
        </div>

        {/* Step 3 */}
        <div
          className={`p-3.5 border-[2px] border-black ${
            step3Done ? 'bg-[#bbf7d0]' : 'bg-[#FFE066]'
          } shadow-[2px_2px_0px_0px_#000] flex flex-col justify-between`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase text-neutral-800">Langkah 3</span>
              {step3Done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-800 stroke-[3px]" />
              ) : (
                <Circle className="w-4 h-4 text-black stroke-[2.5px]" />
              )}
            </div>
            <h4 className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Catat Transaksi 1
            </h4>
            <p className="text-[11px] font-bold text-neutral-800 mt-1">
              {step3Done ? 'Transaksi pertama berhasil dicatat.' : 'Coba ketik "kopi 20rb gopay" di Smart Input.'}
            </p>
          </div>

          {!step3Done && onNewTransaction && (
            <button
              onClick={onNewTransaction}
              className="mt-3 px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] flex items-center justify-center gap-1 cursor-pointer hover:bg-neutral-800"
            >
              <span>Coba Sekarang</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
