'use client';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../lib/haptics';
import { getOfflineQueue, syncOfflineQueue } from '../lib/offlineQueue';
import { useLanguage } from '../lib/i18n';
import { useRouter } from 'next/navigation';

export default function NetworkStatusIndicator() {
  const { lang } = useLanguage();
  const router = useRouter();
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

        const timer = setTimeout(() => {
          setShowReconnected(false);
          setSyncedCount(0);
        }, 4000);
        return () => clearTimeout(timer);
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
      window.removeEventListener('norden:offline-queue-changed', handleQueueChanged);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, router]);

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
                {lang === 'id' ? 'Koneksi Internet Terputus' : 'Offline Mode Active'}
              </p>
              <p className="text-[10px] font-bold text-red-700 truncate">
                {queueCount > 0
                  ? (lang === 'id' ? `${queueCount} transaksi tersimpan lokal & siap sync.` : `${queueCount} transactions saved locally.`)
                  : (lang === 'id' ? 'Transaksi tetap dapat dicatat & disimpan offline.' : 'Transactions will save locally until online.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 bg-white border border-black text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] active:translate-y-0.5 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3 h-3" /> {lang === 'id' ? 'Coba Lagi' : 'Retry'}
          </button>
        </div>
      ) : (
        <div className="bg-[#dcfce7] border-[2.5px] border-black p-3 shadow-[4px_4px_0px_0px_#000] flex items-center gap-2">
          <div className="p-1.5 bg-emerald-700 text-white border border-black shrink-0">
            {syncedCount > 0 ? <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" /> : <Wifi className="w-4 h-4 stroke-[2.5px]" />}
          </div>
          <div>
            <p className="text-xs font-black uppercase text-emerald-900 tracking-wider">
              {lang === 'id' ? 'Koneksi Terhubung Kembali' : 'Back Online'}
            </p>
            <p className="text-[10px] font-bold text-emerald-700">
              {syncedCount > 0
                ? (lang === 'id' ? `${syncedCount} transaksi offline berhasil disinkronkan!` : `${syncedCount} offline transactions synced!`)
                : (lang === 'id' ? 'Sistem online dan siap mencatat transaksi.' : 'System online and ready.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
