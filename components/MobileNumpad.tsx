'use client';

import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { formatRupiahInput, parseRupiahInput } from '../lib/format';

interface MobileNumpadProps {
  value: string;
  onChange: (value: string) => void;
  onDone?: () => void;
}

const INCREMENTS = [
  { label: '+10k', value: 10000 },
  { label: '+20k', value: 20000 },
  { label: '+50k', value: 50000 },
  { label: '+100k', value: 100000 },
];

export default function MobileNumpad({ value, onChange, onDone }: MobileNumpadProps) {
  const handleDigit = (digit: string) => {
    triggerHaptic('light');
    const rawNumber = parseRupiahInput(value) || 0;
    const rawString = rawNumber === 0 ? '' : rawNumber.toString();
    const newRawString = rawString + digit;
    onChange(formatRupiahInput(newRawString));
  };

  const handleDelete = () => {
    triggerHaptic('light');
    const rawNumber = parseRupiahInput(value) || 0;
    const rawString = rawNumber.toString();
    if (rawString.length <= 1) {
      onChange('');
    } else {
      const sliced = rawString.slice(0, -1);
      onChange(formatRupiahInput(sliced));
    }
  };

  const handleClear = () => {
    triggerHaptic('medium');
    onChange('');
  };

  const handleIncrement = (inc: number) => {
    triggerHaptic('selection');
    const current = parseRupiahInput(value) || 0;
    const next = current + inc;
    onChange(formatRupiahInput(next.toString()));
  };

  return (
    <div className="w-full bg-[#FAF9F5] dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl p-3 shadow-[3px_3px_0px_0px_#000] space-y-2 select-none">
      {/* Quick Increment Row */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-neutral-300 dark:border-neutral-700">
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5">
          {INCREMENTS.map((inc) => (
            <button
              key={inc.label}
              type="button"
              onClick={() => handleIncrement(inc.value)}
              className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-white dark:bg-neutral-800 text-black dark:text-white border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer hover:bg-neutral-50 shrink-0"
            >
              {inc.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-2 border-black dark:border-red-800 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1"
          title="Reset nominal"
        >
          <RotateCcw className="w-3 h-3 stroke-[2.5px]" />
          <span>C</span>
        </button>
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="py-3 text-base sm:text-lg font-black bg-white dark:bg-neutral-800 text-black dark:text-white border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleDelete}
          className="py-3 bg-amber-100 dark:bg-amber-950/60 text-black dark:text-amber-200 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center"
          aria-label="Hapus satu angka"
        >
          <Delete className="w-5 h-5 stroke-[2.5px]" />
        </button>
      </div>

      {onDone && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onDone();
          }}
          className="w-full mt-2 py-2 text-xs font-black uppercase tracking-wider border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
        >
          Selesai (OK)
        </button>
      )}
    </div>
  );
}
