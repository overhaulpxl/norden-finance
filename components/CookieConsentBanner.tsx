'use client';

import { useSyncExternalStore } from 'react';
import { Cookie, X } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

const STORAGE_KEY = 'norden_cookie_consent_accepted';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('norden_cookie_consent_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('norden_cookie_consent_change', callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return true;
  }
}

function getServerSnapshot(): boolean {
  return true;
}

export default function CookieConsentBanner() {
  const { lang } = useLanguage();
  const isAccepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function handleAccept() {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
      window.dispatchEvent(new Event('norden_cookie_consent_change'));
    } catch {
      // Ignore storage errors
    }
  }

  if (isAccepted) return null;

  return (
    <div
      role="region"
      aria-label={lang === 'en' ? 'Cookie Consent Notice' : 'Pemberitahuan Persetujuan Cookie'}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none"
    >
      <div className="brutal-card p-4 bg-white dark:bg-neutral-900 border-[2.5px] border-black dark:border-neutral-700 shadow-[5px_5px_0px_0px_#000] flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#FFE066] border-2 border-black text-black shrink-0 shadow-[2px_2px_0px_0px_#000]">
              <Cookie className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
              {lang === 'en' ? 'Cookie Notice' : 'Pemberitahuan Cookie'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAccept}
            className="text-neutral-500 hover:text-black dark:hover:text-white p-1 transition-colors cursor-pointer"
            aria-label={lang === 'en' ? 'Dismiss notice' : 'Tutup pemberitahuan'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-bold text-neutral-600 dark:text-neutral-300 leading-relaxed">
          {lang === 'en'
            ? 'Norden uses essential cookies to keep your account session secure and active for up to 14 days.'
            : 'Norden menggunakan cookie penting untuk menjaga sesi akun Anda tetap aman dan aktif hingga 14 hari.'}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="w-full sm:w-auto px-4 py-2 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            {lang === 'en' ? 'Got It & Continue' : 'Paham & Lanjutkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
