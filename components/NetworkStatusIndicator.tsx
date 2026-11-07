'use client';

import { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { getOfflineQueue, syncOfflineQueue } from '../lib/offlineQueue';
import { useLanguage } from '../lib/i18n';
import { useRouter } from 'next/navigation';

export default function NetworkStatusIndicator() {
  const { lang } = useLanguage();
  const router = useRouter();
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [queueCount, setQueueCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return getOfflineQueue().length;
  });
  const [syncedCount, setSyncedCount] = useState<number>(0);

  useEffect(() => {
    const handleQueueChanged = (e: Event) => {
      const custom = e as CustomEvent<{ count: number }>;
      setQueueCount(custom.detail?.count ?? getOfflineQueue().length);
    };

    window.addEventListener('norden:offline-queue-changed', handleQueueChanged);

    const handleOnline = async () => {
      setIsOnline(true);
      if (wasOffline) {
        triggerHaptic('success');
        setShowReconnected(true);

        // Attempt automatic background sync of offline transactions
        const { synced } = await syncOfflineQueue();
        if (synced > 0) {
          setSyncedCount(synced);
          router.refresh();
        }

        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          setShowReconnected(false);
          setSyncedCount(0);
        }, 4000);
      }
    };

    const handleOffline = () => {
      triggerHaptic('warning');
      setIsOnline(false);
      setWasOffline(true);
      setQueueCount(getOfflineQueue().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      window.removeEventListener('norden:offline-queue-changed', handleQueueChanged);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, router]);

  if (isOnline && !showReconnected) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md select-none animate-in slide-in-from-top-2 duration-200">
      {!isOnline ? (
        <div className="bg-[#fee2e2] dark:bg-red-950/90 border-2 border-black dark:border-neutral-700 p-3 rounded-2xl shadow-[4px_4px_0px_0px_#000] flex items-center justify-between gap-2.5 text-black dark:text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 bg-red-600 text-white border border-black rounded-lg shadow-[1px_1px_0px_0px_#000] shrink-0">
              <WifiOff className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-red-900 dark:text-red-200 tracking-wider">
                {lang === 'id' ? 'Koneksi Internet Terputus' : 'Offline Mode Active'}
              </p>
              <p className="text-[10px] font-bold text-red-700 dark:text-red-300 truncate">
                {queueCount > 0
                  ? lang === 'id'
                    ? `${queueCount} transaksi tersimpan lokal & siap sync.`
                    : `${queueCount} transactions saved locally.`
                  : lang === 'id'
                  ? 'Transaksi tetap dapat dicatat & disimpan offline.'
                  : 'Transactions will save locally until online.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1 shrink-0 text-black dark:text-white"
          >
            <RefreshCw className="w-3 h-3" /> {lang === 'id' ? 'Coba Lagi' : 'Retry'}
          </button>
        </div>
      ) : (
        <div className="bg-[#dcfce7] dark:bg-emerald-950/90 border-2 border-black dark:border-neutral-700 p-3 rounded-2xl shadow-[4px_4px_0px_0px_#000] flex items-center gap-2.5 text-black dark:text-white">
          <div className="p-1.5 bg-emerald-700 text-white border border-black rounded-lg shadow-[1px_1px_0px_0px_#000] shrink-0">
            {syncedCount > 0 ? (
              <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
            ) : (
              <Wifi className="w-4 h-4 stroke-[2.5px]" />
            )}
          </div>
          <div>
            <p className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 tracking-wider">
              {lang === 'id' ? 'Koneksi Terhubung Kembali' : 'Back Online'}
            </p>
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              {syncedCount > 0
                ? lang === 'id'
                  ? `${syncedCount} transaksi offline berhasil disinkronkan!`
                  : `${syncedCount} offline transactions synced!`
                : lang === 'id'
                ? 'Sistem online dan siap mencatat transaksi.'
                : 'System online and ready.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
