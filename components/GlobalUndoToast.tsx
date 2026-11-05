'use client';

import { useState, useEffect, useRef } from 'react';
import { subscribeUndoToast, UndoToastItem } from '../lib/undoToast';
import { RotateCcw, X, Loader2, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export default function GlobalUndoToast() {
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
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] bg-[#18181b] text-white border-[3px] border-black p-4 shadow-[6px_6px_0px_0px_#FFE066] animate-in slide-in-from-bottom duration-300 select-none overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-[#FFE066] text-black border border-black shrink-0 flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_#000]">
          <CheckCircle2 className="w-4 h-4 stroke-[3px]" />
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-black uppercase tracking-wider text-[#FFE066] truncate">
            Aksi Tersimpan
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
            className="px-2.5 py-1.5 bg-[#FFE066] hover:bg-yellow-300 active:bg-yellow-400 text-black border-[2px] border-black text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RotateCcw className="w-3 h-3 stroke-[3px]" />
            )}
            <span>{loading ? 'Batal...' : 'Undo'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-neutral-400 hover:text-white border border-transparent hover:border-neutral-500 cursor-pointer"
            title="Tutup"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5px]" />
          </button>
        </div>
      </div>

      {/* Progress countdown indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
        <div
          className="h-full bg-[#FFE066] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
