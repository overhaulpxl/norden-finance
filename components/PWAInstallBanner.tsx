'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import { subscribePwaPrompt, promptPwaInstall, isPwaInstalled, isIosDevice } from '../lib/pwa';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

export default function PWAInstallBanner() {
  const { lang } = useLanguage();
  const [canPrompt, setCanPrompt] = useState(false);
  const [isIos] = useState(() => isIosDevice());
  const [isInstalled, setIsInstalled] = useState(() => isPwaInstalled());
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('norden_pwa_banner_dismissed') === 'true';
  });

  useEffect(() => {
    const unsubscribe = subscribePwaPrompt((canInstall) => {
      setCanPrompt(canInstall);
    });

    return () => unsubscribe();
  }, []);

  if (isInstalled || dismissed) return null;
  // If not iOS and cannot prompt, do not show banner
  if (!isIos && !canPrompt) return null;

  const handleInstallClick = async () => {
    triggerHaptic('medium');
    if (isIos) {
      setShowIosGuide(!showIosGuide);
    } else {
      const outcome = await promptPwaInstall();
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('norden_pwa_banner_dismissed', 'true');
  };

  return (
    <div className="border-2 border-black dark:border-neutral-700 bg-[#FFE066] p-4 shadow-[4px_4px_0px_0px_#000] relative select-none animate-in fade-in duration-200 text-black">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_#000] shrink-0">
            <Smartphone className="w-5 h-5 text-black stroke-[2.5px]" />
          </div>

          <div className="space-y-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">
              {lang === 'id' ? 'Aplikasi Mobile PWA' : 'PWA Mobile App'}
            </span>
            <h4 className="text-xs sm:text-sm font-black text-black uppercase tracking-wider">
              {lang === 'id' ? 'Pasang Norden di Layar Utama HP' : 'Add Norden to Home Screen'}
            </h4>
            <p className="text-xs font-bold text-neutral-800 leading-snug">
              {lang === 'id'
                ? 'Buka aplikasi secepat kilat tanpa perlu mengetik URL, hemat kuota dan layar penuh.'
                : 'Launch fast without typing URLs, saves data and opens full screen.'}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3.5 py-2 bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
                <span>
                  {isIos
                    ? (showIosGuide
                        ? (lang === 'id' ? 'Tutup Petunjuk' : 'Close Guide')
                        : (lang === 'id' ? 'Petunjuk Pasang di iPhone' : 'Install Guide for iPhone'))
                    : (lang === 'id' ? 'Pasang Aplikasi' : 'Install App')}
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-black/50 hover:text-black border border-transparent hover:border-black rounded-none cursor-pointer shrink-0"
          title={lang === 'id' ? 'Tutup banner ini' : 'Dismiss this banner'}
        >
          <X className="w-4 h-4 stroke-[2.5px]" />
        </button>
      </div>

      {/* iOS Safari Step-by-Step Instructions */}
      {showIosGuide && (
        <div className="mt-4 p-3.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 text-black dark:text-white space-y-2 text-xs font-bold shadow-[2px_2px_0px_0px_#000] animate-in fade-in slide-in-from-top-1">
          <p className="font-black text-black dark:text-white uppercase tracking-wider">
            {lang === 'id' ? 'Cara Pasang di Safari iOS:' : 'How to Install on iOS Safari:'}
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-neutral-800 dark:text-neutral-200">
            <li className="flex items-center gap-1.5">
              <span>{lang === 'id' ? '1. Ketuk tombol ' : '1. Tap the '}<strong>{lang === 'id' ? 'Bagikan (Share)' : 'Share'}</strong></span>
              <Share className="w-3.5 h-3.5 inline stroke-[2.5px]" />
              <span>{lang === 'id' ? 'di bilah bawah Safari.' : 'button in Safari.'}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span>{lang === 'id' ? '2. Gulir ke bawah lalu pilih ' : '2. Scroll down and select '}<strong>{lang === 'id' ? 'Tambah ke Layar Utama' : 'Add to Home Screen'}</strong></span>
              <PlusSquare className="w-3.5 h-3.5 inline stroke-[2.5px]" />.
            </li>
            <li>
              {lang === 'id' ? '3. Ketuk ' : '3. Tap '}<strong>{lang === 'id' ? 'Tambah' : 'Add'}</strong>{lang === 'id' ? ' di sudut kanan atas. Selesai!' : ' in the top right corner. Done!'}
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
