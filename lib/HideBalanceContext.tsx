'use client';

import React, { createContext, useContext, useSyncExternalStore } from 'react';

interface HideBalanceContextType {
  isBalanceHidden: boolean;
  toggleHideBalance: () => void;
  maskBalance: (formattedString: string) => string;
}

const HideBalanceContext = createContext<HideBalanceContextType>({
  isBalanceHidden: false,
  toggleHideBalance: () => {},
  maskBalance: (val) => val,
});

const STORAGE_KEY = 'norden_hide_balance';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('norden_balance_toggle', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('norden_balance_toggle', callback);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function HideBalanceProvider({ children }: { children: React.ReactNode }) {
  const isBalanceHidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleHideBalance = () => {
    try {
      const next = !getSnapshot();
      localStorage.setItem(STORAGE_KEY, String(next));
      window.dispatchEvent(new Event('norden_balance_toggle'));
    } catch {
      // Ignore storage errors
    }
  };

  const maskBalance = (formattedString: string): string => {
    if (!isBalanceHidden) return formattedString;
    return 'Rp ••••••••';
  };

  return (
    <HideBalanceContext.Provider value={{ isBalanceHidden, toggleHideBalance, maskBalance }}>
      {children}
    </HideBalanceContext.Provider>
  );
}

export function useHideBalance() {
  return useContext(HideBalanceContext);
}
