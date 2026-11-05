'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';

export default function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        triggerHaptic('success');
        setShowReconnected(true);
        const timer = setTimeout(() => setShowReconnected(false), 3500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      triggerHaptic('warning');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md select-none animate-in slide-in-from-top-2 duration-200">
      {!isOnline ? (
        <div className="bg-[#fee2e2] border-[2.5px] border-black p-3 shadow-[4px_4px_0px_0px_#000] flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-red-600 text-white border border-black shrink-0">
              <WifiOff className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-red-900 tracking-wider">
                Koneksi Internet Terputus
              </p>
              <p className="text-[10px] font-bold text-red-700 truncate">
                Data akan disinkronkan saat terhubung kembali.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 bg-white border border-black text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> Coba Lagi
          </button>
        </div>
      ) : (
        <div className="bg-[#dcfce7] border-[2.5px] border-black p-3 shadow-[4px_4px_0px_0px_#000] flex items-center gap-2">
          <div className="p-1.5 bg-emerald-700 text-white border border-black shrink-0">
            <Wifi className="w-4 h-4 stroke-[2.5px]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-emerald-900 tracking-wider">
              Koneksi Terhubung Kembali
            </p>
            <p className="text-[10px] font-bold text-emerald-700">
              Sistem kembali online dan siap mencatat transaksi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
