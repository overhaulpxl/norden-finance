'use client';

import { useState, useEffect, useRef } from 'react';
import { subscribeUndoToast, UndoToastItem } from '../lib/undoToast';
import { RotateCcw, X, Loader2, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

export default function GlobalUndoToast() {
  const { lang } = useLanguage();
  const [toast, setToast] = useState<UndoToastItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeUndoToast((item) => {
      // Clear any existing active timer
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      setToast(item);
      setLoading(false);
      setProgress(100);

      const duration = item.duration || 5000;
      const stepTime = 50;
      const stepDecrement = (stepTime / duration) * 100;

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev <= stepDecrement) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - stepDecrement;
        });
      }, stepTime);

      timerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!toast) return null;

  const handleUndo = async () => {
    if (loading) return;
    setLoading(true);
    triggerHaptic('medium');

    try {
      await toast.onUndo();
    } catch {
      // Ignore undo error
    } finally {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setToast(null);
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setToast(null);
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] bg-[#18181b] text-white border-2 border-black dark:border-neutral-700 rounded-2xl p-4 shadow-[4px_4px_0px_0px_#000] animate-in slide-in-from-bottom duration-300 select-none overflow-hidden">
      <div className="flex items-start gap-3">
        <div
          className="p-1.5 text-black border border-black rounded-lg shrink-0 flex items-center justify-center shadow-[1px_1px_0px_0px_#000]"
          style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
        >
          <CheckCircle2 className="w-4 h-4 stroke-[3px]" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p
            className="text-xs font-black uppercase tracking-wider truncate"
            style={{ color: 'var(--theme-accent, #FFE066)' }}
          >
            {lang === 'en' ? 'Action Saved' : 'Aksi Tersimpan'}
          </p>
          <p className="text-xs font-bold text-neutral-200 mt-0.5 line-clamp-2 leading-snug">
            {toast.message}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={loading}
            className="px-2.5 py-1.5 border-2 border-black rounded-xl text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1 cursor-pointer disabled:opacity-50 text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin text-black" />
            ) : (
              <RotateCcw className="w-3 h-3 stroke-[3px] text-black" />
            )}
            <span>{loading ? (lang === 'en' ? 'Undoing...' : 'Batal...') : 'Undo'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-neutral-400 hover:text-white border border-transparent hover:border-neutral-600 rounded-lg cursor-pointer"
            title={lang === 'en' ? 'Close' : 'Tutup'}
          >
            <X className="w-3.5 h-3.5 stroke-[2.5px]" />
          </button>
        </div>
      </div>

      {/* Progress countdown indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
        <div
          className="h-full transition-all duration-75 ease-linear"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--theme-accent, #FFE066)',
          }}
        />
      </div>
    </div>
  );
}
