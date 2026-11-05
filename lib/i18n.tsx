'use client';

import React, { createContext, useContext, useSyncExternalStore } from 'react';

export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Nav
    nav_home: 'Beranda',
    nav_wallet: 'Dompet & Saldo',
    nav_goals: 'Target & Utang',
    nav_history: 'Riwayat Transaksi',
    nav_automation: 'Otomatisasi',
    nav_reports: 'Laporan & Analisis',
    nav_settings: 'Pengaturan',
    nav_help: 'Bantuan',

    // Header & Actions
    btn_new_transaction: '+ Catat Transaksi',
    btn_new_tx_short: '+ Catat',
    btn_hide_balance: 'Sembunyikan Saldo',
    btn_show_balance: 'Tampilkan Saldo',
    search_placeholder: 'Cari transaksi...',

    // Financial Cards
    card_net_worth: 'Total Kekayaan Bersih',
    card_income: 'Pemasukan Bulan Ini',
    card_expense: 'Pengeluaran Bulan Ini',
    card_cashflow: 'Surplus Kas Bersih',
    card_active_wallets: 'Dompet Aktif',
    card_emergency_fund: 'Dana Darurat',

    // Common Buttons
    btn_save: 'Simpan',
    btn_cancel: 'Batal',
    btn_delete: 'Hapus',
    btn_edit: 'Ubah',
    btn_undo: 'Batal Transaksi',
    btn_close: 'Tutup',

    // Settings
    settings_security: 'Keamanan & Kata Sandi',
    settings_reset_email: 'Kirim Tautan Reset Password ke Email',
    settings_language: 'Bahasa Aplikasi',
    settings_danger_zone: 'Zona Bahaya',
    settings_reset_data: 'Reset Semua Data Keuangan',
    settings_delete_account: 'Hapus Akun Saya',

    // Status
    status_active: 'Aktif',
    status_settled: 'Lunas',
    status_over_budget: 'Over budget!',
    status_loading: 'Memuat...',
  },
  en: {
    // Nav
    nav_home: 'Home',
    nav_wallet: 'Wallets & Balance',
    nav_goals: 'Goals & Debts',
    nav_history: 'Transaction History',
    nav_automation: 'Automation',
    nav_reports: 'Reports & Analytics',
    nav_settings: 'Settings',
    nav_help: 'Help',

    // Header & Actions
    btn_new_transaction: '+ New Transaction',
    btn_new_tx_short: '+ Record',
    btn_hide_balance: 'Hide Balance',
    btn_show_balance: 'Show Balance',
    search_placeholder: 'Search transactions...',

    // Financial Cards
    card_net_worth: 'Total Net Worth',
    card_income: 'Income This Month',
    card_expense: 'Expense This Month',
    card_cashflow: 'Net Cashflow',
    card_active_wallets: 'Active Wallets',
    card_emergency_fund: 'Emergency Fund',

    // Common Buttons
    btn_save: 'Save',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete',
    btn_edit: 'Edit',
    btn_undo: 'Undo Transaction',
    btn_close: 'Close',

    // Settings
    settings_security: 'Security & Password',
    settings_reset_email: 'Send Password Reset Link to Email',
    settings_language: 'App Language',
    settings_danger_zone: 'Danger Zone',
    settings_reset_data: 'Reset All Financial Data',
    settings_delete_account: 'Delete My Account',

    // Status
    status_active: 'Active',
    status_settled: 'Settled',
    status_over_budget: 'Over budget!',
    status_loading: 'Loading...',
  },
} as const;

export type TranslationKey = keyof typeof translations['id'];

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'id',
  setLang: () => {},
  t: (key) => translations.id[key] || key,
});

const STORAGE_KEY = 'norden_app_language';

function subscribeLang(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('norden_lang_change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('norden_lang_change', callback);
  };
}

function getLangSnapshot(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

function getServerLangSnapshot(): Language {
  return 'id';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot);

  const setLang = (nextLang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
      document.documentElement.lang = nextLang;
      window.dispatchEvent(new Event('norden_lang_change'));
    } catch {
      // Ignore storage errors
    }
  };

  const t = (key: TranslationKey, fallback?: string): string => {
    const dict = translations[lang] || translations.id;
    return dict[key] || fallback || translations.id[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
