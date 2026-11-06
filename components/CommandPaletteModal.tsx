'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Transaction, Balance } from '../types';
import {
  Search,
  X,
  Home,
  Wallet,
  Target,
  History,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  Eye,
  EyeOff,
  Lock,
  ArrowRightLeft,
  FileText,
  CreditCard,
  Bot,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '../lib/format';
import { getCategoryEmoji } from '../lib/categoryEmoji';
import { triggerHaptic } from '../lib/haptics';
import { useHideBalance } from '../lib/HideBalanceContext';
import { lockApp, isPinSet } from '../lib/appLock';
import { useLanguage } from '../lib/i18n';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onNewTransaction: () => void;
  transactions: Transaction[];
  balances: Balance[];
  userId: string;
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigate,
  onNewTransaction,
  transactions,
  balances,
  userId,
}: CommandPaletteModalProps) {
  const { lang } = useLanguage();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { isBalanceHidden, toggleHideBalance, maskBalance } = useHideBalance();

  const handleClose = useCallback(() => {
    setQuery('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const quickActions = useMemo(() => {
    const isEn = lang === 'en';
    return [
      {
        id: 'new-tx',
        title: isEn ? 'Record New Transaction' : 'Catat Transaksi Baru',
        subtitle: isEn ? 'Open Smart Input or manual entry' : 'Buka Smart Input dengan AI atau formulir manual',
        icon: Plus,
        category: isEn ? 'Quick Actions' : 'Aksi Cepat',
        action: () => {
          handleClose();
          onNewTransaction();
        },
      },
      {
        id: 'toggle-balance',
        title: isBalanceHidden
          ? (isEn ? 'Show Balance Amount' : 'Tampilkan Nominal Saldo')
          : (isEn ? 'Hide Balance Amount (Privacy Mode)' : 'Sembunyikan Nominal Saldo (Mode Privasi)'),
        subtitle: isBalanceHidden
          ? (isEn ? 'Reveal original balance figures' : 'Tampilkan kembali angka saldo asli')
          : (isEn ? 'Mask balances with asterisks (••••••)' : 'Tutupi saldo dengan asteris (••••••)'),
        icon: isBalanceHidden ? Eye : EyeOff,
        category: isEn ? 'Quick Actions' : 'Aksi Cepat',
        action: () => {
          toggleHideBalance();
          triggerHaptic('light');
          handleClose();
        },
      },
      {
        id: 'transfer',
        title: isEn ? 'Transfer Between Wallets' : 'Transfer Saldo Antar Dompet',
        subtitle: isEn ? 'Move balance from bank to e-wallet' : 'Pindah saldo dari rekening bank ke e-wallet',
        icon: ArrowRightLeft,
        category: isEn ? 'Quick Actions' : 'Aksi Cepat',
        action: () => {
          handleClose();
          onNavigate('wallet');
        },
      },
      ...(isPinSet(userId)
        ? [
            {
              id: 'lock-app',
              title: isEn ? 'Lock Screen Now (PIN)' : 'Kunci Layar Sekarang (PIN)',
              subtitle: isEn ? 'Activate 4-digit PIN security screen immediately' : 'Aktifkan layar pengaman 4-digit PIN segera',
              icon: Lock,
              category: isEn ? 'Quick Actions' : 'Aksi Cepat',
              action: () => {
                handleClose();
                triggerHaptic('medium');
                lockApp(userId);
              },
            },
          ]
        : []),
      {
        id: 'download-pdf',
        title: isEn ? 'Download Monthly PDF Report' : 'Unduh Laporan PDF Bulanan',
        subtitle: isEn ? 'Generate formal PDF summary of income & expenses' : 'Generate ringkasan PDF formal pemasukan & pengeluaran',
        icon: FileText,
        category: isEn ? 'Quick Actions' : 'Aksi Cepat',
        action: () => {
          handleClose();
          window.open('/api/export?format=pdf', '_blank');
        },
      },
    ];
  }, [lang, isBalanceHidden, onNewTransaction, handleClose, onNavigate, toggleHideBalance, userId]);

  const navItems = useMemo(() => {
    const isEn = lang === 'en';
    return [
      { id: 'overview', title: isEn ? 'Home & Overview' : 'Beranda & Ringkasan', subtitle: isEn ? 'Net worth, Safe-to-Spend & bills' : 'Kekayaan bersih, Safe-to-Spend & tagihan', icon: Home, tab: 'overview' },
      { id: 'wallet', title: isEn ? 'Wallets & Accounts' : 'Dompet & Rekening', subtitle: isEn ? 'Manage cash, bank & e-wallet balances' : 'Kelola kas, bank & saldo e-wallet', icon: Wallet, tab: 'wallet' },
      { id: 'goals', title: isEn ? 'Saving Goals & Wishlist' : 'Target Tabungan & Wishlist', subtitle: isEn ? 'Track savings & target funds' : 'Pantau impian & alokasi dana tabungan', icon: Target, tab: 'goals' },
      { id: 'debts', title: isEn ? 'Debts & Installments' : 'Utang, Piutang & Cicilan', subtitle: isEn ? 'Track loans & paylater schedule' : 'Pencatatan pinjaman & jadwal paylater', icon: CreditCard, tab: 'goals' },
      { id: 'history', title: isEn ? 'Transaction History' : 'Riwayat Transaksi', subtitle: isEn ? 'All movements, filters & export' : 'Semua mutasi, filter & ekspor CSV', icon: History, tab: 'history' },
      { id: 'reports', title: isEn ? 'Reports & Analytics' : 'Laporan & Analitik', subtitle: isEn ? 'Spending breakdown & recap' : 'Distribusi pengeluaran, kalender & rekap bulanan', icon: BarChart3, tab: 'reports' },
      { id: 'automation', title: isEn ? 'Automation & Subscriptions' : 'Otomasi & Langganan', subtitle: isEn ? 'Recurring transactions & reminders' : 'Transaksi berulang & pengingat otomatis', icon: Bot, tab: 'automation' },
      { id: 'settings', title: isEn ? 'Settings & Security' : 'Pengaturan & Keamanan Akun', subtitle: isEn ? 'PIN lock, reset data & Pro plan' : 'PIN lock, reset data, profil & paket Pro', icon: Settings, tab: 'settings' },
      { id: 'help', title: isEn ? 'Help & Support' : 'Pusat Bantuan & Kontak', subtitle: isEn ? 'WhatsApp admin & support email' : 'WhatsApp admin & email dukungan resmi', icon: HelpCircle, tab: 'help' },
    ];
  }, [lang]);

  // Filter actions & navigation based on query
  const q = query.toLowerCase().trim();

  const filteredActions = useMemo(() => {
    if (!q) return quickActions;
    return quickActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );
  }, [quickActions, q]);

  const filteredNav = useMemo(() => {
    if (!q) return navItems;
    return navItems.filter(
      (n) => n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q)
    );
  }, [navItems, q]);

  const matchedBalances = useMemo(() => {
    if (!q) return [];
    return balances
      .filter((b) => !b.archivedAt && (b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)))
      .slice(0, 4);
  }, [balances, q]);

  const matchedTransactions = useMemo(() => {
    if (!q || q.length < 2) return [];
    return transactions
      .filter((t) => {
        const cat = (t.category?.name || '').toLowerCase();
        const note = (t.note || '').toLowerCase();
        const wallet = (t.wallet?.name || '').toLowerCase();
        const tags = (t.tags || []).join(' ').toLowerCase();
        const amountStr = t.amount.toString();
        return (
          cat.includes(q) ||
          note.includes(q) ||
          wallet.includes(q) ||
          tags.includes(q) ||
          amountStr.includes(q)
        );
      })
      .slice(0, 5);
  }, [transactions, q]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-12 sm:pt-20 select-none animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative bg-white border-[3px] border-black w-full max-w-xl shadow-[8px_8px_0px_0px_#000] overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-3.5 sm:p-4 border-b-[2.5px] border-black bg-[#FAF9F5]">
          <Search className="w-5 h-5 text-black stroke-[3px] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={lang === 'en' ? 'Search menu, quick actions, or transactions...' : 'Cari menu, aksi cepat, atau transaksi...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs sm:text-sm font-black text-black outline-none uppercase placeholder:text-neutral-400 placeholder:normal-case"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5px]" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-black bg-white text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3 space-y-4 divide-y divide-neutral-200">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider px-2 block mb-1">
                {lang === 'en' ? 'Quick Actions' : 'Aksi Cepat'}
              </span>
              {filteredActions.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full text-left p-2.5 hover:bg-[#FFE066] active:bg-yellow-300 border border-transparent hover:border-black transition-all flex items-center justify-between gap-3 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-1.5 border border-black bg-white shadow-[1px_1px_0px_0px_#000] shrink-0">
                        <IconComponent className="w-4 h-4 stroke-[2.5px] text-black" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-black truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] font-bold text-neutral-500 group-hover:text-neutral-800 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Navigation Menus */}
          {filteredNav.length > 0 && (
            <div className="pt-3 space-y-1">
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider px-2 block mb-1">
                {lang === 'en' ? 'Menu Navigation' : 'Navigasi Menu'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredNav.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        triggerHaptic('light');
                        handleClose();
                        onNavigate(item.tab);
                      }}
                      className="text-left p-2 hover:bg-[#bfdbfe] active:bg-blue-200 border border-transparent hover:border-black transition-all flex items-center gap-2.5 group cursor-pointer"
                    >
                      <div className="p-1.5 border border-black bg-white shadow-[1px_1px_0px_0px_#000] shrink-0">
                        <IconComponent className="w-3.5 h-3.5 stroke-[2.5px] text-black" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-black truncate">
                          {item.title}
                        </p>
                        <p className="text-[9px] font-bold text-neutral-500 group-hover:text-neutral-800 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Balances / Wallets */}
          {matchedBalances.length > 0 && (
            <div className="pt-3 space-y-1">
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider px-2 block mb-1">
                {lang === 'en' ? 'Wallets & Accounts' : 'Dompet & Rekening'}
              </span>
              {matchedBalances.map((wallet) => (
                <div
                  key={wallet.id}
                  onClick={() => {
                    triggerHaptic('light');
                    handleClose();
                    onNavigate('wallet');
                  }}
                  className="p-2.5 border border-black bg-white hover:bg-[#FAF9F5] flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 border border-black bg-white shadow-[1px_1px_0px_0px_#000] shrink-0">
                      <Wallet className="w-4 h-4 stroke-[2.5px] text-black" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-black truncate">
                        {wallet.name}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide truncate">
                        {wallet.type}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black shrink-0 text-black">
                    {maskBalance(formatRupiah(wallet.currentBalance))}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Matched Transactions */}
          {matchedTransactions.length > 0 && (
            <div className="pt-3 space-y-1">
              <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider px-2 block mb-1">
                {lang === 'en' ? 'Transaction Results' : 'Hasil Pencarian Transaksi'}
              </span>
              {matchedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => {
                    triggerHaptic('light');
                    handleClose();
                    onNavigate('history');
                  }}
                  className="p-2.5 border border-black bg-white hover:bg-[#FAF9F5] flex items-center justify-between gap-3 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">{getCategoryEmoji(tx.category?.name)}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider text-black truncate">
                        {tx.category?.name || (lang === 'en' ? 'Other' : 'Lain-lain')}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-500 truncate">
                        {tx.note || tx.wallet?.name || '-'} • {formatTanggal(tx.transactionDate)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black shrink-0 ${
                      tx.type === 'masuk'
                        ? 'text-emerald-700'
                        : tx.type === 'transfer'
                        ? 'text-blue-700'
                        : 'text-black'
                    }`}
                  >
                    {tx.type === 'masuk' ? '+' : tx.type === 'transfer' ? '' : '-'}
                    {maskBalance(formatRupiah(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}

          {filteredActions.length === 0 && filteredNav.length === 0 && matchedBalances.length === 0 && matchedTransactions.length === 0 && (
            <div className="p-8 text-center space-y-1">
              <p className="text-xs font-black uppercase text-black">
                {lang === 'en' ? 'No matching menu or transactions found' : 'Tidak ada menu atau transaksi yang cocok'}
              </p>
              <p className="text-[11px] font-bold text-neutral-500">
                {lang === 'en' ? 'Try using shorter or different search keywords.' : 'Coba gunakan kata kunci pencarian yang lebih singkat.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-2.5 border-t-2 border-black bg-[#FAF9F5] flex items-center justify-between text-[10px] font-bold text-neutral-500 px-4">
          <span>{lang === 'en' ? 'Use ↑↓ to navigate' : 'Gunakan ↑↓ untuk navigasi'}</span>
          <span>{lang === 'en' ? 'ESC to close' : 'ESC untuk menutup'}</span>
        </div>
      </div>
    </div>
  );
}
