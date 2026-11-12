'use client';

import { useState, useMemo } from 'react';
import { Debt } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';
import { Calculator, Sparkles, TrendingDown, ShieldCheck, ChevronRight } from 'lucide-react';

interface DebtPayoffSimulatorProps {
  debts: Debt[];
}

type Strategy = 'snowball' | 'avalanche';

interface SimulationResult {
  strategy: Strategy;
  monthsToPayoff: number;
  projectedDate: string;
  totalInterestPaid: number;
  order: Array<{
    id: string;
    person: string;
    amount: number;
    interestRate: number;
    monthsToClear: number;
  }>;
}

export default function DebtPayoffSimulator({ debts }: DebtPayoffSimulatorProps) {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [extraMonthlyBudget, setExtraMonthlyBudget] = useState('300000');
  const [activeStrategy, setActiveStrategy] = useState<Strategy>('snowball');

  // Filter active debts (liabilities only)
  const activeHutang = useMemo(() => {
    return debts.filter((d) => d.type === 'hutang' && !d.isSettled && d.amount > 0);
  }, [debts]);

  // Sample mock debts if user has no debt entered yet (for simulation preview)
  const isDemo = activeHutang.length === 0;
  const debtsToSimulate = useMemo(() => {
    if (activeHutang.length > 0) {
      return activeHutang;
    }
    // Demo debts for realistic simulation
    return [
      {
        id: 'demo-1',
        userId: 'demo',
        person: 'Kartu Kredit Bank',
        amount: 6000000,
        type: 'hutang' as const,
        isSettled: false,
        interestRate: 21,
        tenorMonths: 12,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-2',
        userId: 'demo',
        person: 'Pinjaman Kerabat',
        amount: 2000000,
        type: 'hutang' as const,
        isSettled: false,
        interestRate: 0,
        tenorMonths: 6,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-3',
        userId: 'demo',
        person: 'Paylater Belanja',
        amount: 1200000,
        type: 'hutang' as const,
        isSettled: false,
        interestRate: 15,
        tenorMonths: 3,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [activeHutang]);

  const extraMonthlyAmount = parseRupiahInput(extraMonthlyBudget) || 0;

  // Run payoff simulations
  const { snowball, avalanche, interestSaved } = useMemo(() => {
    const calculateStrategy = (strat: Strategy): SimulationResult => {
      // Clone debts to avoid mutating
      const items = debtsToSimulate.map((d) => ({
        id: d.id,
        person: d.person,
        balance: d.amount,
        originalAmount: d.amount,
        interestRate: d.interestRate || 0,
        // Approximate minimum monthly payment (3% of balance or minimum Rp 50.000)
        minPayment: Math.max(50000, Math.round(d.amount / Math.max(1, d.tenorMonths || 12))),
        monthsToClear: 0,
      }));

      // Sort according to strategy:
      // Snowball: lowest balance first
      // Avalanche: highest interest rate first
      if (strat === 'snowball') {
        items.sort((a, b) => a.balance - b.balance);
      } else {
        items.sort((a, b) => b.interestRate - a.interestRate);
      }

      let currentMonth = 0;
      let totalInterest = 0;
      const maxMonthsCap = 360; // 30 years ceiling

      while (items.some((i) => i.balance > 0) && currentMonth < maxMonthsCap) {
        currentMonth++;
        let availableExtra = extraMonthlyAmount;

        // 1. Accrue monthly interest & pay minimums
        for (const item of items) {
          if (item.balance > 0) {
            const monthlyInterest = (item.balance * (item.interestRate / 100)) / 12;
            totalInterest += monthlyInterest;
            item.balance += monthlyInterest;

            const payment = Math.min(item.balance, item.minPayment);
            item.balance -= payment;
            if (item.balance <= 0 && item.monthsToClear === 0) {
              item.monthsToClear = currentMonth;
            }
          }
        }

        // 2. Pour extra budget into the top priority active debt
        for (const item of items) {
          if (item.balance > 0 && availableExtra > 0) {
            const extraPay = Math.min(item.balance, availableExtra);
            item.balance -= extraPay;
            availableExtra -= extraPay;
            if (item.balance <= 0 && item.monthsToClear === 0) {
              item.monthsToClear = currentMonth;
            }
          }
        }
      }

      // Project target month and year
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + currentMonth, 1);
      const projectedDate = targetDate.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
        month: 'long',
        year: 'numeric',
      });

      return {
        strategy: strat,
        monthsToPayoff: currentMonth,
        projectedDate,
        totalInterestPaid: Math.round(totalInterest),
        order: items.map((i) => ({
          id: i.id,
          person: i.person,
          amount: i.originalAmount,
          interestRate: i.interestRate,
          monthsToClear: i.monthsToClear || currentMonth,
        })),
      };
    };

    const sb = calculateStrategy('snowball');
    const av = calculateStrategy('avalanche');
    const diff = Math.max(0, sb.totalInterestPaid - av.totalInterestPaid);

    return { snowball: sb, avalanche: av, interestSaved: diff };
  }, [debtsToSimulate, extraMonthlyAmount, lang]);

  const currentResult = activeStrategy === 'snowball' ? snowball : avalanche;

  return (
    <div className="mb-6 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_#000] text-black dark:text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black dark:border-neutral-700 pb-3 mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-500 fill-amber-400 stroke-[2.5px]" />
            {lang === 'id'
              ? 'Simulator Pelunasan Utang (Snowball vs Avalanche)'
              : 'Debt Payoff Simulator (Snowball vs Avalanche)'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide mt-0.5">
            {lang === 'id'
              ? 'Bandingkan strategi pelunasan dan estimasi tanggal bebas utang'
              : 'Compare payoff strategies and project your debt-free date'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsOpen((prev) => !prev);
          }}
          className="px-3 py-1.5 bg-[#FFE066] text-black border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5"
        >
          <span>{isOpen ? (lang === 'id' ? 'Tutup Simulator' : 'Close Simulator') : (lang === 'id' ? 'Buka Simulator' : 'Open Simulator')}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isDemo && !isOpen && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          💡 {lang === 'id'
            ? 'Buka simulator untuk mencoba proyeksi bebas utang menggunakan metode Snowball atau Avalanche.'
            : 'Open simulator to preview debt-free projections using Snowball or Avalanche method.'}
        </p>
      )}

      {isOpen && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {isDemo && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <span>
                ℹ️ {lang === 'id'
                  ? 'Mode Simulasi Contoh: Anda belum memiliki catatan utang aktif. Menampilkan simulasi dengan data sampel.'
                  : 'Sample Simulation Mode: No active debts recorded. Simulating with sample data.'}
              </span>
            </div>
          )}

          {/* Extra monthly payment input */}
          <div className="p-4 bg-[#FAF9F5] dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[3px_3px_0px_0px_#000] space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block">
              {lang === 'id'
                ? 'Alokasi Pembayaran Ekstra Bulanan (Di Luar Cicilan Minimum)'
                : 'Extra Monthly Payment Budget (Above Minimums)'}
            </label>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-xs">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(extraMonthlyBudget)}
                onChange={(e) => setExtraMonthlyBudget(e.target.value.replace(/\D/g, ''))}
                className="flex-1 brutal-input px-3 py-2 text-xs font-black bg-white dark:bg-neutral-900"
                placeholder="300.000"
              />
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              {lang === 'id'
                ? 'Semakin besar alokasi ekstra, semakin cepat utang lunas dan semakin sedikit bunga yang dibayarkan.'
                : 'Higher extra payments accelerate debt clearance and reduce cumulative interest.'}
            </p>
          </div>

          {/* Strategy comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Snowball Card */}
            <div
              onClick={() => {
                triggerHaptic('selection');
                setActiveStrategy('snowball');
              }}
              className={`p-4 border-2 border-black dark:border-neutral-700 rounded-xl cursor-pointer transition-all ${
                activeStrategy === 'snowball'
                  ? 'bg-[#FFE066] text-black shadow-[4px_4px_0px_0px_#000]'
                  : 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border border-black rounded bg-white text-black">
                  {lang === 'id' ? 'Psikologis' : 'Psychological'}
                </span>
                {activeStrategy === 'snowball' && <span className="text-xs font-black">✓ AKTIF</span>}
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider mb-1">
                {lang === 'id' ? 'Metode Snowball' : 'Snowball Method'}
              </h4>
              <p className="text-xs font-medium leading-relaxed mb-3">
                {lang === 'id'
                  ? 'Melunasi saldo terkecil lebih dulu untuk momentum psikologis dan memangkas jumlah pinjaman cepat.'
                  : 'Pay off smallest balances first to gain quick psychological wins and eliminate accounts.'}
              </p>
              <div className="pt-2 border-t border-black/20 dark:border-white/20 text-xs font-bold space-y-1">
                <div className="flex justify-between">
                  <span>{lang === 'id' ? 'Estimasi Lunas:' : 'Payoff Target:'}</span>
                  <span className="font-black">{snowball.projectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'id' ? 'Durasi Waktu:' : 'Duration:'}</span>
                  <span className="font-black">{snowball.monthsToPayoff} {lang === 'id' ? 'Bulan' : 'Months'}</span>
                </div>
                <div className="flex justify-between text-[11px] opacity-85">
                  <span>{lang === 'id' ? 'Estimasi Total Bunga:' : 'Total Interest:'}</span>
                  <span>{formatRupiah(snowball.totalInterestPaid)}</span>
                </div>
              </div>
            </div>

            {/* Avalanche Card */}
            <div
              onClick={() => {
                triggerHaptic('selection');
                setActiveStrategy('avalanche');
              }}
              className={`p-4 border-2 border-black dark:border-neutral-700 rounded-xl cursor-pointer transition-all ${
                activeStrategy === 'avalanche'
                  ? 'bg-[#bbf7d0] text-black shadow-[4px_4px_0px_0px_#000]'
                  : 'bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border border-black rounded bg-white text-black">
                  {lang === 'id' ? 'Hemat Bunga' : 'Cost Efficient'}
                </span>
                {activeStrategy === 'avalanche' && <span className="text-xs font-black">✓ AKTIF</span>}
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider mb-1">
                {lang === 'id' ? 'Metode Avalanche' : 'Avalanche Method'}
              </h4>
              <p className="text-xs font-medium leading-relaxed mb-3">
                {lang === 'id'
                  ? 'Melunasi bunga tertinggi lebih dulu untuk meminimalkan beban biaya bunga jangka panjang.'
                  : 'Pay off highest interest rate debts first to mathematically minimize total interest costs.'}
              </p>
              <div className="pt-2 border-t border-black/20 dark:border-white/20 text-xs font-bold space-y-1">
                <div className="flex justify-between">
                  <span>{lang === 'id' ? 'Estimasi Lunas:' : 'Payoff Target:'}</span>
                  <span className="font-black">{avalanche.projectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>{lang === 'id' ? 'Durasi Waktu:' : 'Duration:'}</span>
                  <span className="font-black">{avalanche.monthsToPayoff} {lang === 'id' ? 'Bulan' : 'Months'}</span>
                </div>
                <div className="flex justify-between text-[11px] opacity-85">
                  <span>{lang === 'id' ? 'Estimasi Total Bunga:' : 'Total Interest:'}</span>
                  <span>{formatRupiah(avalanche.totalInterestPaid)}</span>
                </div>
              </div>
            </div>
          </div>

          {interestSaved > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'id'
                  ? `Metode Avalanche menghemat sekitar ${formatRupiah(interestSaved)} dari total beban bunga dibanding Snowball.`
                  : `Avalanche method saves approximately ${formatRupiah(interestSaved)} in interest compared to Snowball.`}
              </span>
            </div>
          )}

          {/* Payoff Sequence Timeline */}
          <div className="space-y-2 pt-2">
            <h5 className="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>
                {lang === 'id'
                  ? `Urutan Prioritas Pelunasan (${activeStrategy === 'snowball' ? 'Snowball: Saldo Terkecil' : 'Avalanche: Bunga Tertinggi'}):`
                  : `Payoff Sequence (${activeStrategy === 'snowball' ? 'Snowball: Smallest Balance' : 'Avalanche: Highest Interest'}):`}
              </span>
            </h5>
            <div className="space-y-2">
              {currentResult.order.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black font-mono font-black text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-black uppercase tracking-wider text-black dark:text-white">
                        {item.person}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-bold">
                        {formatRupiah(item.amount)} {item.interestRate > 0 ? `• Bunga ${item.interestRate}%` : '• Bunga 0%'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700 border border-black rounded text-[10px] font-black uppercase tracking-wider">
                      ~ {item.monthsToClear} {lang === 'id' ? 'Bulan' : 'Mos'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl text-[11px] text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-neutral-700 dark:text-neutral-300" />
            <span>
              {lang === 'id'
                ? 'Catatan: Hasil di atas merupakan estimasi matematis berdasarkan suku bunga tahunan konstan dan alokasi pembayaran ekstra.'
                : 'Note: Results are mathematical estimates based on constant annual interest rates and extra monthly allocations.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
