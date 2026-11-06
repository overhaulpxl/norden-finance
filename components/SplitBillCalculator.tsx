'use client';

import React, { useState, useMemo } from 'react';
import { Users, Copy, Check, Calculator, Sparkles, Percent } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';

interface SplitBillCalculatorProps {
  onUseMyShare?: (amount: number, note: string) => void;
  defaultAmount?: number;
}

const TAX_PRESETS = [0, 5, 10, 11, 12];

export default function SplitBillCalculator({ onUseMyShare, defaultAmount = 0 }: SplitBillCalculatorProps) {
  const [totalBill, setTotalBill] = useState(() => (defaultAmount > 0 ? formatRupiahInput(defaultAmount.toString()) : ''));
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [billTitle, setBillTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const rawTotal = useMemo(() => parseRupiahInput(totalBill) || 0, [totalBill]);

  const taxAmount = useMemo(() => {
    if (taxPercent <= 0 || rawTotal <= 0) return 0;
    return Math.round((rawTotal * taxPercent) / 100);
  }, [rawTotal, taxPercent]);

  const grandTotal = useMemo(() => rawTotal + taxAmount, [rawTotal, taxAmount]);

  const perPersonShare = useMemo(() => {
    if (peopleCount <= 0 || grandTotal <= 0) return 0;
    return Math.ceil(grandTotal / peopleCount);
  }, [grandTotal, peopleCount]);

  const handleCopySummary = async () => {
    triggerHaptic('success');
    const titleText = billTitle.trim() ? `untuk *${billTitle.trim()}*` : '';
    const summary = [
      `🧾 *RINCIAN SPLIT BILL NORDEN* ${titleText}`,
      `💰 Total Tagihan: ${formatRupiah(rawTotal)}`,
      taxPercent > 0 ? `🏷️ Pajak/Tip (${taxPercent}%): ${formatRupiah(taxAmount)}` : null,
      taxPercent > 0 ? `💵 Total Akhir: ${formatRupiah(grandTotal)}` : null,
      `👥 Dibagi: ${peopleCount} orang`,
      `👉 *Patungan per Orang: ${formatRupiah(perPersonShare)}*`,
      ``,
      `Dicatat via Norden Finance ⚡`,
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleApplyMyShare = () => {
    if (onUseMyShare && perPersonShare > 0) {
      triggerHaptic('medium');
      const note = billTitle.trim() ? `Split Bill: ${billTitle.trim()} (Porsi 1/${peopleCount})` : `Split Bill (1/${peopleCount})`;
      onUseMyShare(perPersonShare, note);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_#000] space-y-4 select-none">
      <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-black dark:text-white">
          <Calculator className="w-4 h-4 stroke-[2.5px]" />
          Kalkulator Split Bill (Bagi Tagihan)
        </h3>
        <span
          className="text-[9px] font-black uppercase px-2 py-0.5 border border-black rounded shadow-[1px_1px_0px_0px_#000]"
          style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
        >
          Instant
        </span>
      </div>

      <div className="space-y-3">
        {/* Title / Description */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
            Nama Tagihan / Acara (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Makan Malam di Sushi Tei"
            value={billTitle}
            onChange={(e) => setBillTitle(e.target.value)}
            className="w-full brutal-input text-xs font-bold"
          />
        </div>

        {/* Total Bill Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Total Tagihan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Rp 150.000"
              value={totalBill}
              onChange={(e) => setTotalBill(formatRupiahInput(e.target.value))}
              className="w-full brutal-input text-sm font-black text-black dark:text-white"
            />
          </div>

          {/* People Count Counter */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
              Jumlah Orang
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setPeopleCount((p) => Math.max(2, p - 1));
                }}
                className="w-10 h-10 border-2 border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-black dark:text-white font-black text-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 h-10 border-2 border-black dark:border-neutral-700 rounded-xl bg-[#FAF9F5] dark:bg-neutral-800 text-black dark:text-white font-black text-sm flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#000]">
                <Users className="w-4 h-4" />
                <span>{peopleCount} Orang</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setPeopleCount((p) => p + 1);
                }}
                className="w-10 h-10 border-2 border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-black dark:text-white font-black text-lg shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Tip / Tax Presets */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1 flex items-center gap-1">
            <Percent className="w-3 h-3" /> Pajak / Service Tip (Opsional)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {TAX_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setTaxPercent(p);
                }}
                className={`px-3 py-1 text-xs font-black uppercase rounded-lg border-2 border-black dark:border-neutral-700 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000] ${
                  taxPercent === p
                    ? 'shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                }`}
                style={taxPercent === p ? { backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' } : {}}
              >
                {p === 0 ? 'Tanpa Pajak' : `${p}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Split Result Card */}
        {rawTotal > 0 && (
          <div className="p-3.5 border-2 border-black dark:border-neutral-700 rounded-xl bg-[#FAF9F5] dark:bg-neutral-800/80 shadow-[2.5px_2.5px_0px_0px_#000] space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
              <span>Total Akhir Tagihan:</span>
              <span className="font-black text-black dark:text-white">{formatRupiah(grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-neutral-300 dark:border-neutral-700 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                Bagian Tiap Orang ({peopleCount} org):
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
                {formatRupiah(perPersonShare)}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {rawTotal > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full sm:flex-1 py-2.5 px-3 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600 stroke-[3px]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Teks WhatsApp'}</span>
            </button>

            {onUseMyShare && (
              <button
                type="button"
                onClick={handleApplyMyShare}
                className="w-full sm:flex-1 py-2.5 px-3 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
              >
                <Sparkles className="w-4 h-4 stroke-[2.5px]" />
                <span>Catat Porsi Saya</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
