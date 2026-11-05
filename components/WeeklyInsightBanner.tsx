'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../lib/format';
import { Sparkles, TrendingDown, TrendingUp, X, CheckCircle2 } from 'lucide-react';
import { getCategoryEmoji } from '../lib/categoryEmoji';

interface WeeklyInsightBannerProps {
  transactions: Transaction[];
  userId: string;
}

export default function WeeklyInsightBanner({ transactions, userId }: WeeklyInsightBannerProps) {
  const now = useMemo(() => new Date(), []);
  const weekNumber = useMemo(() => {
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }, [now]);

  const storageKey = `norden_weekly_insight_dismissed_${userId}_${now.getFullYear()}_w${weekNumber}`;
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(storageKey) === 'true';
  });

  const insight = useMemo(() => {
    const nowTime = now.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    const thisWeekExpenses = transactions.filter((t) => {
      if (t.type !== 'keluar') return false;
      const txTime = new Date(t.transactionDate).getTime();
      return txTime >= nowTime - sevenDaysMs && txTime <= nowTime;
    });

    const lastWeekExpenses = transactions.filter((t) => {
      if (t.type !== 'keluar') return false;
      const txTime = new Date(t.transactionDate).getTime();
      return txTime >= nowTime - fourteenDaysMs && txTime < nowTime - sevenDaysMs;
    });

    const thisWeekTotal = thisWeekExpenses.reduce((sum, t) => sum + t.amount, 0);
    const lastWeekTotal = lastWeekExpenses.reduce((sum, t) => sum + t.amount, 0);

    // Category breakdown for this week
    const catMap: Record<string, number> = {};
    thisWeekExpenses.forEach((t) => {
      const cat = t.category?.name || 'Lain-lain';
      catMap[cat] = (catMap[cat] || 0) + t.amount;
    });

    let topCategory = '';
    let topCategoryAmount = 0;
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    });

    let trend: 'down' | 'up' | 'stable' = 'stable';
    let percentChange = 0;

    if (lastWeekTotal > 0) {
      percentChange = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
      if (percentChange < -3) trend = 'down';
      else if (percentChange > 3) trend = 'up';
    }

    return {
      thisWeekTotal,
      lastWeekTotal,
      trend,
      percentChange: Math.abs(percentChange),
      topCategory,
      topCategoryAmount,
      txCount: thisWeekExpenses.length,
    };
  }, [transactions, now]);

  if (isDismissed) return null;
  // If user has zero transactions this week and zero last week, hide banner
  if (insight.thisWeekTotal === 0 && insight.lastWeekTotal === 0) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };

  return (
    <div className="border-[3px] border-black bg-[#FAF9F5] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] relative select-none animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`p-2 border-[2px] border-black shrink-0 shadow-[2px_2px_0px_0px_#000] ${
              insight.trend === 'down'
                ? 'bg-[#bbf7d0] text-black'
                : insight.trend === 'up'
                ? 'bg-[#fed7aa] text-black'
                : 'bg-[#FFE066] text-black'
            }`}
          >
            {insight.trend === 'down' ? (
              <TrendingDown className="w-5 h-5 stroke-[2.5px]" />
            ) : insight.trend === 'up' ? (
              <TrendingUp className="w-5 h-5 stroke-[2.5px]" />
            ) : (
              <Sparkles className="w-5 h-5 stroke-[2.5px]" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-white shadow-[1px_1px_0px_0px_#000]">
                Ringkasan Mingguan Cerdas
              </span>
              {insight.trend === 'down' && (
                <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hemat {insight.percentChange}%
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-black text-black leading-snug">
              {insight.trend === 'down'
                ? `Hebat! Pengeluaran 7 hari terakhir kamu turun ${insight.percentChange}% dibanding minggu lalu (${formatRupiah(insight.thisWeekTotal)} vs ${formatRupiah(insight.lastWeekTotal)}).`
                : insight.trend === 'up'
                ? `Pengeluaran 7 hari terakhir naik ${insight.percentChange}% dibanding minggu lalu (${formatRupiah(insight.thisWeekTotal)} vs ${formatRupiah(insight.lastWeekTotal)}).`
                : `Total pengeluaran 7 hari terakhir: ${formatRupiah(insight.thisWeekTotal)} dari ${insight.txCount} transaksi.`}
            </p>

            {insight.topCategory && (
              <p className="text-xs font-bold text-neutral-600 flex items-center gap-1.5 pt-0.5">
                <span>Alokasi tertinggi minggu ini:</span>
                <span className="font-black text-black inline-flex items-center gap-1 bg-white px-2 py-0.5 border border-black text-[11px]">
                  <span>{getCategoryEmoji(insight.topCategory)}</span>
                  <span>{insight.topCategory} ({formatRupiah(insight.topCategoryAmount)})</span>
                </span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-neutral-400 hover:text-black border border-transparent hover:border-black rounded-none cursor-pointer shrink-0"
          title="Tutup ringkasan ini"
        >
          <X className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>
    </div>
  );
}
