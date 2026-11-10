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
    btn_new_transaction: 'Catat Transaksi',
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

    // Overview Layout & Customization
    btn_customize_layout: 'Atur Tata Letak',
    btn_done_save: 'Selesai & Simpan',
    btn_reset_default: 'Kembalikan Default',
    layout_customize_title: 'Kustomisasi Tata Letak Dashboard',

    // Financial Health Score
    health_score_title: 'Skor Kesehatan Finansial',
    health_very_healthy: 'Sangat Sehat',
    health_good: 'Cukup Baik',
    health_warning: 'Waspada',
    health_critical: 'Kritis',
    health_no_data: 'Belum Ada Data',
    health_msg_very_healthy: 'Keuangan aman. Pertahankan gaya hidup ini.',
    health_msg_good: 'Perlu tingkatkan tabungan darurat atau kurangi pengeluaran.',
    health_msg_warning: 'Pengeluaran hampir melebihi batas aman. Hati-hati utang.',
    health_msg_critical: 'Segera pangkas pengeluaran non-esensial dan lunasi utang.',
    health_msg_no_data: 'Mulai catat transaksi pertama Anda.',

    // Smart Input Callout Banner
    banner_smart_input_title: 'Catat Transaksi Instan (Smart Input)',
    banner_smart_input_btn: '+ Catat Sekarang',

    // Recent Transactions
    recent_tx_title: 'Aktivitas Transaksi Terbaru',
    recent_tx_subtitle: 'Catatan pengeluaran, pemasukan, dan transfer terakhir',
    recent_tx_empty_title: 'Belum Ada Transaksi Tercatat',
    recent_tx_empty_desc: 'Mulai catat transaksi pertama Anda dengan Smart Input atau formulir cepat.',
    recent_tx_empty_btn: '+ Catat Transaksi Pertama',

    // Category Budgets
    budget_title: 'Budget Kategori',
    budget_manage: 'Atur Budget',
    budget_empty_title: 'Belum ada budget bulanan',
    budget_empty_desc: 'Atur budget per kategori untuk membatasi pengeluaran Anda tiap bulan.',
    budget_add_new: '+ Atur Budget Baru',
    budget_save: 'Simpan Budget',
    budget_category: 'Kategori',
    budget_limit: 'Limit Bulanan (Rp)',

    // Upcoming Bills
    bills_title: 'Tagihan Mendatang (Upcoming Bills)',
    bills_subtitle: 'Pengingat jatuh tempo langganan, cicilan, dan utang',
    bills_empty_title: 'Semua Tagihan Aman!',
    bills_empty_desc: 'Tidak ada cicilan atau langganan aktif yang mendekati jatuh tempo.',
    bills_count_label: 'Tagihan',
    bills_pay_btn: 'Bayar & Catat',
    bills_paid_label: 'Tercatat',

    // Momentum Center
    momentum_title: 'Momentum Center',
    momentum_subtitle: 'Streak, achievement, dan pengingat pintar.',
    momentum_streak_label: 'hari streak',
    momentum_best_label: 'hari terbaik',
    momentum_current: 'Current',
    momentum_best: 'Best',

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
    btn_new_transaction: 'New Transaction',
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

    // Overview Layout & Customization
    btn_customize_layout: 'Customize Layout',
    btn_done_save: 'Done & Save',
    btn_reset_default: 'Reset to Default',
    layout_customize_title: 'Customize Dashboard Layout',

    // Financial Health Score
    health_score_title: 'Financial Health Score',
    health_very_healthy: 'Very Healthy',
    health_good: 'Good',
    health_warning: 'Warning',
    health_critical: 'Critical',
    health_no_data: 'No Data Yet',
    health_msg_very_healthy: 'Finances secure. Keep up this lifestyle.',
    health_msg_good: 'Boost emergency savings or curb spending.',
    health_msg_warning: 'Spending near safety threshold. Watch your debt.',
    health_msg_critical: 'Cut non-essential spend immediately and pay off debt.',
    health_msg_no_data: 'Start recording your first transaction.',

    // Smart Input Callout Banner
    banner_smart_input_title: 'Record Transaction Instantly (Smart Input)',
    banner_smart_input_btn: '+ Record Now',

    // Recent Transactions
    recent_tx_title: 'Recent Transactions',
    recent_tx_subtitle: 'Latest recorded expenses, income, and transfers',
    recent_tx_empty_title: 'No Transactions Recorded Yet',
    recent_tx_empty_desc: 'Start recording your first transaction with Smart Input or quick form.',
    recent_tx_empty_btn: '+ Record First Transaction',

    // Category Budgets
    budget_title: 'Category Budgets',
    budget_manage: 'Manage Budget',
    budget_empty_title: 'No monthly budgets yet',
    budget_empty_desc: 'Set category budgets to cap your monthly spending.',
    budget_add_new: '+ Set New Budget',
    budget_save: 'Save Budget',
    budget_category: 'Category',
    budget_limit: 'Monthly Limit (Rp)',

    // Upcoming Bills
    bills_title: 'Upcoming Bills',
    bills_subtitle: 'Due date reminders for subscriptions, installments, and debts',
    bills_empty_title: 'All Bills Clear!',
    bills_empty_desc: 'No active installments or subscriptions nearing due date.',
    bills_count_label: 'Bills',
    bills_pay_btn: 'Pay & Record',
    bills_paid_label: 'Recorded',

    // Momentum Center
    momentum_title: 'Momentum Center',
    momentum_subtitle: 'Streaks, achievements, and smart reminders.',
    momentum_streak_label: 'day streak',
    momentum_best_label: 'day best',
    momentum_current: 'Current',
    momentum_best: 'Best',

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
