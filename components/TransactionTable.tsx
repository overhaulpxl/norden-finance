'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Balance, Transaction } from '../types';
import { formatRupiah, formatTanggal, formatMethodName } from '../lib/format';
import {
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  RotateCcw,
  Loader2,
  Calendar,
  SlidersHorizontal,
  Plus,
} from 'lucide-react';
import {
  updateTransaction,
  deleteTransaction,
  addExplicitTransaction,
  restoreTransaction,
} from '../app/actions';
import WalletSelect from './WalletSelect';
import { getCategoryEmoji } from '../lib/categoryEmoji';
import { triggerHaptic } from '../lib/haptics';
import { triggerUndoToast } from '../lib/undoToast';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';

function getDateGroupLabel(dateStr: string | Date, lang: 'id' | 'en'): string {
  const d = new Date(dateStr);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return lang === 'id' ? 'Hari Ini' : 'Today';
  if (isYesterday) return lang === 'id' ? 'Kemarin' : 'Yesterday';

  return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Swipeable Transaction Row Component
interface SwipeableRowProps {
  transaction: Transaction;
  lang: 'id' | 'en';
  maskBalance: (val: string) => string;
  balances: Balance[];
  isEditing: boolean;
  isDeleting: boolean;
  isPending: boolean;
  isRepeating: boolean;
  editAmount: string;
  editNote: string;
  editMethod: string;
  editTags: string;
  onEditAmountChange: (val: string) => void;
  onEditNoteChange: (val: string) => void;
  onEditMethodChange: (val: string) => void;
  onEditTagsChange: (val: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onStartEdit: () => void;
  onStartDelete: () => void;
  onRepeat: () => void;
  onOpenDetail: () => void;
}

function SwipeableTransactionRow({
  transaction: t,
  lang,
  maskBalance,
  balances,
  isEditing,
  isDeleting,
  isPending,
  isRepeating,
  editAmount,
  editNote,
  editMethod,
  editTags,
  onEditAmountChange,
  onEditNoteChange,
  onEditMethodChange,
  onEditTagsChange,
  onEditSave,
  onEditCancel,
  onDeleteConfirm,
  onDeleteCancel,
  onStartEdit,
  onStartDelete,
  onRepeat,
  onOpenDetail,
}: SwipeableRowProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing || isDeleting) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isEditing || isDeleting) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Detect if horizontal or vertical scroll
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipe.current) {
      // Dampen swipe past 90px
      const clamped = Math.max(-95, Math.min(95, diffX));
      setSwipeOffset(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (isEditing || isDeleting) return;
    setIsSwiping(false);

    if (swipeOffset < -60) {
      // Swiped Left -> trigger delete
      triggerHaptic('medium');
      onStartDelete();
    } else if (swipeOffset > 60) {
      // Swiped Right -> trigger repeat
      triggerHaptic('medium');
      onRepeat();
    }

    // Reset offset with spring
    setSwipeOffset(0);
    isHorizontalSwipe.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] bg-white dark:bg-neutral-900 group">
      {/* Background action reveals on swipe */}
      <div className="absolute inset-0 flex items-center justify-between pointer-events-none select-none px-4">
        {/* Right swipe reveal (Quick Repeat) */}
        <div
          className={`flex items-center gap-1.5 text-xs font-black uppercase text-black transition-opacity ${
            swipeOffset > 25 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ color: 'var(--theme-accent-text, #000000)' }}
        >
          <div
            className="p-1.5 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5px]" />
          </div>
          <span className="text-[10px] font-black">{lang === 'id' ? 'Ulangi' : 'Repeat'}</span>
        </div>

        {/* Left swipe reveal (Delete) */}
        <div
          className={`flex items-center gap-1.5 text-xs font-black uppercase text-red-600 transition-opacity ml-auto ${
            swipeOffset < -25 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="text-[10px] font-black">{lang === 'id' ? 'Hapus' : 'Delete'}</span>
          <div className="p-1.5 rounded-lg border border-black bg-red-500 text-white shadow-[1px_1px_0px_0px_#000]">
            <Trash2 className="w-4 h-4 stroke-[2.5px]" />
          </div>
        </div>
      </div>

      {/* Foreground card content with swipe transform */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        className="relative bg-white dark:bg-neutral-900 p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 z-10"
      >
        <div
          className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer sm:cursor-default"
          onClick={() => {
            if (!isEditing && !isDeleting) {
              onOpenDetail();
              triggerHaptic('light');
            }
          }}
        >
          <div
            className={`p-2 rounded-xl border-2 border-black dark:border-neutral-700 shadow-[1px_1px_0px_0px_#000] shrink-0 ${
              t.type === 'masuk'
                ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
                : t.type === 'transfer'
                ? 'bg-[#bfdbfe] dark:bg-blue-950/80 text-black dark:text-blue-200'
                : 'bg-[#fecaca] dark:bg-red-950/80 text-black dark:text-red-200'
            }`}
          >
            {t.type === 'masuk' ? (
              <ArrowDownRight className="w-4 h-4 stroke-[3px]" />
            ) : t.type === 'transfer' ? (
              <ArrowRightLeft className="w-4 h-4 stroke-[3px]" />
            ) : (
              <ArrowUpRight className="w-4 h-4 stroke-[3px]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm shrink-0 select-none">
                {getCategoryEmoji(t.category?.name)}
              </span>
              <h4 className="font-black text-xs sm:text-sm text-black dark:text-white uppercase tracking-wider truncate">
                {t.category?.name || (lang === 'en' ? 'Other' : 'Lain-lain')}
              </h4>
            </div>

            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => onEditNoteChange(e.target.value)}
                  className="bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-black dark:text-white outline-none font-bold uppercase"
                  placeholder={lang === 'en' ? 'Note...' : 'Catatan...'}
                />
                <WalletSelect
                  wallets={balances}
                  value={editMethod}
                  onChange={onEditMethodChange}
                  className="w-24 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-black dark:text-white outline-none uppercase font-black"
                  required
                />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => onEditTagsChange(e.target.value)}
                  className="w-24 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-black dark:text-white outline-none font-bold uppercase"
                  placeholder="#tags..."
                />
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                  <span className="text-black dark:text-white font-black truncate max-w-[200px]">
                    {t.note || '-'}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-black dark:bg-neutral-500 shrink-0" />
                  <span className="text-neutral-700 dark:text-neutral-300 font-black shrink-0">
                    {formatMethodName(t.wallet?.name || (lang === 'en' ? 'Other' : 'Lain-lain'))}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-black dark:bg-neutral-500 shrink-0" />
                  <span className="text-neutral-500 dark:text-neutral-400 shrink-0">
                    {formatTanggal(t.transactionDate)}
                  </span>
                </div>
                {(t.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {(t.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="border border-black dark:border-neutral-700 rounded-md bg-[#e0f2fe] dark:bg-blue-950/70 px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider text-black dark:text-blue-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100 dark:border-neutral-800">
          <div className="text-left sm:text-right">
            {isEditing ? (
              <input
                type="text"
                value={editAmount}
                onChange={(e) => onEditAmountChange(e.target.value)}
                className="w-28 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-black dark:text-white font-black outline-none text-right"
                autoFocus
              />
            ) : (
              <span
                className={`text-sm sm:text-base font-black tracking-wider ${
                  t.type === 'masuk'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : t.type === 'transfer'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-black dark:text-white'
                }`}
              >
                {t.type === 'masuk' ? '+' : t.type === 'transfer' ? '' : '-'}
                {maskBalance(formatRupiah(t.amount))}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end shrink-0">
            {isEditing ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onEditSave}
                  className="p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50"
                  title={lang === 'en' ? 'Save changes' : 'Simpan perubahan'}
                >
                  <Check className="w-4 h-4 stroke-[3px]" />
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onEditCancel}
                  className="p-1.5 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50"
                  title={lang === 'en' ? 'Cancel' : 'Batal'}
                >
                  <X className="w-4 h-4 stroke-[3px]" />
                </button>
              </>
            ) : isDeleting ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onDeleteConfirm}
                  className="px-2 py-0.5 bg-red-600 text-white border border-black rounded-lg text-[10px] font-black uppercase cursor-pointer disabled:opacity-50 shadow-[1px_1px_0px_0px_#000]"
                  title={lang === 'en' ? 'Confirm delete' : 'Konfirmasi hapus'}
                >
                  {lang === 'en' ? 'Yes' : 'Ya'}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onDeleteCancel}
                  className="px-2 py-0.5 bg-white dark:bg-neutral-800 text-black dark:text-white border border-black dark:border-neutral-700 rounded-lg text-[10px] font-black uppercase cursor-pointer disabled:opacity-50"
                  title={lang === 'en' ? 'Cancel' : 'Batal'}
                >
                  {lang === 'en' ? 'Cancel' : 'Batal'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onRepeat}
                  disabled={isRepeating}
                  className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  title={
                    lang === 'en'
                      ? 'Repeat this transaction for today (1-Click)'
                      : 'Ulangi transaksi ini untuk hari ini (1-Klik)'
                  }
                >
                  {isRepeating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  title={lang === 'en' ? 'Edit transaction' : 'Edit transaksi'}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onStartDelete}
                  className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title={lang === 'en' ? 'Delete transaction' : 'Hapus transaksi'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionTable({
  transactions,
  balances = [],
}: {
  transactions: Transaction[];
  balances?: Balance[];
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const [transactionOverrides, setTransactionOverrides] = useState<Record<string, Transaction>>({});
  const [deletedTransactionIds, setDeletedTransactionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editMethod, setEditMethod] = useState('');
  const [editTags, setEditTags] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingMutationId, setPendingMutationId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleTransactions = transactions
    .filter((transaction) => !deletedTransactionIds.has(transaction.id))
    .map((transaction) => transactionOverrides[transaction.id] || transaction);

  const months = Array.from(
    new Set(
      visibleTransactions.map((t) => {
        const d = new Date(t.transactionDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  )
    .sort()
    .reverse();

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const categories = Array.from(
    new Set(visibleTransactions.map((t) => t.category?.name || 'Lain-lain'))
  ).sort();
  const methods = Array.from(
    new Set(visibleTransactions.map((t) => t.wallet?.name || 'Lain-lain'))
  ).sort();

  const uniqueTags = Array.from(
    new Set(visibleTransactions.flatMap((t) => t.tags || []))
  ).sort();

  const filtered = visibleTransactions.filter((t) => {
    const tags = t.tags || [];
    const query = searchQuery.toLowerCase();
    const haystack = [
      t.category?.name || 'Lain-lain',
      t.note || '',
      t.wallet?.name || '',
      t.rawInput || '',
      ...tags.map((tag) => `#${tag}`),
    ]
      .join(' ')
      .toLowerCase();
    const matchesSearch = !query || haystack.includes(query);

    const d = new Date(t.transactionDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const matchesMonth = filterMonth === 'all' || monthKey === filterMonth;

    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory =
      filterCategory === 'all' || (t.category?.name || 'Lain-lain') === filterCategory;
    const matchesMethod =
      filterMethod === 'all' || (t.wallet?.name || 'Lain-lain') === filterMethod;
    const matchesTag = filterTag === 'all' || tags.includes(filterTag);

    return (
      matchesSearch &&
      matchesMonth &&
      matchesType &&
      matchesCategory &&
      matchesMethod &&
      matchesTag
    );
  });

  const filteredSummary = (() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.type === 'masuk') income += tx.amount;
      else if (tx.type === 'keluar') expense += tx.amount;
    }
    return {
      income,
      expense,
      net: income - expense,
    };
  })();

  // Group filtered transactions by Date
  const groupedTransactions = (() => {
    const map = new Map<
      string,
      { label: string; items: Transaction[]; expense: number; income: number }
    >();

    for (const t of filtered) {
      const d = new Date(t.transactionDate);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          label: getDateGroupLabel(t.transactionDate, lang),
          items: [],
          expense: 0,
          income: 0,
        });
      }

      const group = map.get(dateKey)!;
      group.items.push(t);
      if (t.type === 'keluar') group.expense += t.amount;
      if (t.type === 'masuk') group.income += t.amount;
    }

    return Array.from(map.entries()).map(([key, data]) => ({
      dateKey: key,
      label: data.label,
      items: data.items,
      totalExpense: data.expense,
      totalIncome: data.income,
    }));
  })();

  const exportTransactionsToCSV = (txList: Transaction[]) => {
    if (txList.length === 0) return;
    const isEn = lang === 'en';
    const headers = isEn
      ? ['Date', 'Type', 'Category', 'Amount', 'Wallet', 'Note', 'Tags']
      : ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Metode', 'Keterangan', 'Tags'];
    const otherLabel = isEn ? 'Other' : 'Lain-lain';
    const rows = txList.map((t) => [
      formatTanggal(t.transactionDate),
      t.type,
      t.category?.name || otherLabel,
      t.amount,
      t.wallet?.name || otherLabel,
      t.note || '-',
      (t.tags || []).join(' '),
    ]);
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');
    const encodedUri = URL.createObjectURL(
      new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    );
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `norden-export-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const handleEditSave = async (id: string) => {
    if (pendingMutationId) return;
    const amount = parseInt(editAmount.replace(/\D/g, ''), 10);
    if (!amount) return;
    if (!editMethod.trim()) {
      setError(lang === 'en' ? 'Select a wallet first' : 'Pilih wallet terlebih dahulu');
      return;
    }

    setError(null);
    setSuccess(null);
    setPendingMutationId(id);
    const tags = editTags
      .split(/\s+/)
      .map((tag) => tag.replace(/^#/, '').trim())
      .filter(Boolean);
    const res = await updateTransaction(id, {
      amount,
      note: editNote,
      wallet: editMethod,
      tags,
    });
    if (res.success) {
      const wallet = balances.find((balance) => balance.name === editMethod);
      const currentTransaction = visibleTransactions.find(
        (transaction) => transaction.id === id
      );
      if (currentTransaction) {
        setTransactionOverrides((current) => ({
          ...current,
          [id]: {
            ...currentTransaction,
            amount,
            note: editNote,
            tags,
            wallet: wallet
              ? {
                  id: wallet.id,
                  name: wallet.name,
                  type: wallet.type,
                  currentBalance: wallet.currentBalance,
                  userId: wallet.userId,
                  archivedAt: wallet.archivedAt,
                  createdAt: wallet.createdAt,
                  updatedAt: wallet.updatedAt,
                }
              : currentTransaction.wallet,
          },
        }));
      }
      setEditingId(null);
      triggerHaptic('success');
      setSuccess(lang === 'en' ? 'Transaction updated successfully!' : 'Transaksi berhasil diperbarui!');
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else {
      setError(res.error || (lang === 'en' ? 'Failed to update transaction' : 'Gagal memperbarui transaksi'));
    }
    setPendingMutationId(null);
  };

  const handleDelete = async (id: string) => {
    if (pendingMutationId) return;
    const targetTx = transactions.find((t) => t.id === id);
    setError(null);
    setSuccess(null);
    setPendingMutationId(id);
    const res = await deleteTransaction(id);
    if (res.success) {
      setDeletedTransactionIds((current) => {
        const next = new Set(current);
        next.add(id);
        return next;
      });
      setDeletingId(null);
      triggerHaptic('medium');
      setSuccess(lang === 'en' ? 'Transaction deleted successfully!' : 'Transaksi berhasil dihapus!');
      setTimeout(() => setSuccess(null), 5000);

      // Trigger floating undo notification
      const categoryLabel = targetTx?.category?.name || (lang === 'en' ? 'Other' : 'Lain-lain');
      const amountLabel = formatRupiah(targetTx?.amount || 0);
      triggerUndoToast({
        message: lang === 'en'
          ? `Transaction "${categoryLabel}" (${amountLabel}) deleted.`
          : `Transaksi "${categoryLabel}" (${amountLabel}) telah dihapus.`,
        onUndo: async () => {
          await restoreTransaction(id);
          setDeletedTransactionIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
          router.refresh();
        },
      });

      router.refresh();
    } else {
      setError(res.error || (lang === 'en' ? 'Failed to delete transaction' : 'Gagal menghapus transaksi'));
    }
    setPendingMutationId(null);
  };

  const [repeatingId, setRepeatingId] = useState<string | null>(null);
  const [activeDetailTx, setActiveDetailTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!mobileFilterOpen && !activeDetailTx) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileFilterOpen(false);
        setActiveDetailTx(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileFilterOpen, activeDetailTx]);

  const handleRepeat = async (tx: Transaction) => {
    if (pendingMutationId || repeatingId) return;
    setError(null);
    setSuccess(null);
    setRepeatingId(tx.id);

    try {
      const res = await addExplicitTransaction({
        type: tx.type,
        amount: tx.amount,
        category: tx.category?.name || (lang === 'en' ? 'Other' : 'Lain-lain'),
        wallet: tx.wallet?.name || 'Cash',
        note: tx.note
          ? `${tx.note} (${lang === 'en' ? 'Repeat' : 'Ulang'})`
          : (lang === 'en' ? 'Repeated Transaction' : 'Transaksi Diulang'),
        transactionDate: new Date().toISOString(),
        tags: tx.tags || [],
      });

      if (!res.success) {
        throw new Error(res.error || (lang === 'en' ? 'Failed to repeat transaction' : 'Gagal mengulangi transaksi'));
      }

      triggerHaptic('success');
      const repeatCatLabel = tx.category?.name || (lang === 'en' ? 'Other' : 'Lain-lain');
      setSuccess(
        lang === 'en'
          ? `Transaction "${repeatCatLabel}" successfully recorded for today!`
          : `Transaksi "${repeatCatLabel}" berhasil dicatat untuk hari ini!`
      );
      setTimeout(() => setSuccess(null), 4000);

      const newTxId =
        'transactionId' in res && typeof res.transactionId === 'string'
          ? res.transactionId
          : null;
      if (newTxId) {
        triggerUndoToast({
          message: lang === 'en'
            ? `Transaction "${repeatCatLabel}" (${formatRupiah(tx.amount)}) successfully repeated.`
            : `Transaksi "${repeatCatLabel}" (${formatRupiah(tx.amount)}) berhasil dicatat ulang.`,
          onUndo: async () => {
            await deleteTransaction(newTxId);
            router.refresh();
          },
        });
      }

      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : (lang === 'en' ? 'An error occurred while repeating transaction' : 'Terjadi kesalahan saat mengulangi transaksi')
      );
    } finally {
      setRepeatingId(null);
    }
  };

  const isFilterActive =
    searchQuery !== '' ||
    filterMonth !== 'all' ||
    filterType !== 'all' ||
    filterCategory !== 'all' ||
    filterMethod !== 'all' ||
    filterTag !== 'all';
  const activeFilterCount = [
    searchQuery !== '',
    filterMonth !== 'all',
    filterType !== 'all',
    filterCategory !== 'all',
    filterMethod !== 'all',
    filterTag !== 'all',
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterMonth('all');
    setFilterType('all');
    setFilterCategory('all');
    setFilterMethod('all');
    setFilterTag('all');
  };

  const selectClass =
    'bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 text-black dark:text-white font-black text-xs rounded-xl px-3 py-2 outline-none shadow-[2px_2px_0px_0px_#000] uppercase tracking-wider appearance-none cursor-pointer';

  return (
    <div className="select-none space-y-4">
      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#fecaca] dark:bg-red-950/80 text-black dark:text-red-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Filter Tray & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-[#FAF9F5] dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl p-3.5 shadow-[3px_3px_0px_0px_#000]">
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-white stroke-[3px]" />
          <input
            type="text"
            placeholder={
              lang === 'en'
                ? 'Search transactions, notes, tags...'
                : 'Cari transaksi, catatan, tag...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full brutal-input pl-9 pr-4 py-2 text-xs font-bold uppercase"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Mobile Filter Button (opens Bottom Sheet) */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMobileFilterOpen(true);
            }}
            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer text-black dark:text-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span>{lang === 'en' ? 'Filters' : 'Filter'}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FFE066] text-black border border-black flex items-center justify-center text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Desktop Filter Dropdowns (hidden on mobile) */}
          <div className="hidden lg:flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className={selectClass}
            >
              <option value="all">{lang === 'en' ? 'All Months' : 'Semua Bulan'}</option>
              {months.map((m) => {
                const [y, mo] = m.split('-');
                const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString(
                  lang === 'en' ? 'en-US' : 'id-ID',
                  { month: 'short', year: 'numeric' }
                );
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={selectClass}
            >
              <option value="all">
                {lang === 'en' ? 'All Categories' : 'Semua Kategori'}
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className={selectClass}
            >
              <option value="all">{lang === 'en' ? 'All Wallets' : 'Semua Dompet'}</option>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {formatMethodName(m)}
                </option>
              ))}
            </select>

            {uniqueTags.length > 0 && (
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className={selectClass}
              >
                <option value="all">{lang === 'en' ? 'All Tags' : 'Semua Tag'}</option>
                {uniqueTags.map((tag) => (
                  <option key={tag} value={tag}>
                    #{tag}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-2 border-2 border-black dark:border-neutral-700 bg-[#fecaca] dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-900 text-black dark:text-red-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-colors"
              title={lang === 'en' ? 'Clear all active filters' : 'Bersihkan semua filter'}
            >
              Reset ({activeFilterCount})
            </button>
          )}

          {filtered.length > 0 && (
            <button
              type="button"
              onClick={() => exportTransactionsToCSV(filtered)}
              className="brutal-btn-light px-3 py-2 text-xs flex items-center gap-1.5 font-black uppercase tracking-wider cursor-pointer ml-auto lg:ml-0"
              title={
                lang === 'en'
                  ? 'Download filtered data as CSV'
                  : 'Unduh data hasil filter sebagai CSV'
              }
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5px]" />{' '}
              {lang === 'en' ? 'Export CSV' : 'Ekspor CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Quick Filter Chips for Mobile / 1-Tap Switching */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            setFilterType('all');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 ${
            filterType === 'all'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
          }`}
        >
          {lang === 'en' ? 'All' : 'Semua'} ({transactions.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType('keluar');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            filterType === 'keluar'
              ? 'bg-[#fecaca] dark:bg-red-950/80 text-black dark:text-red-200 ring-2 ring-black dark:ring-neutral-400 font-black'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <span>
            {lang === 'en' ? 'Expenses' : 'Pengeluaran'} (
            {transactions.filter((t) => t.type === 'keluar').length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType('masuk');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            filterType === 'masuk'
              ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 ring-2 ring-black dark:ring-neutral-400 font-black'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          <span>
            {lang === 'en' ? 'Income' : 'Pemasukan'} (
            {transactions.filter((t) => t.type === 'masuk').length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType('transfer');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            filterType === 'transfer'
              ? 'bg-[#bfdbfe] dark:bg-blue-950/80 text-black dark:text-blue-200 ring-2 ring-black dark:ring-neutral-400 font-black'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
          <span>
            {lang === 'en' ? 'Transfer' : 'Transfer'} (
            {transactions.filter((t) => t.type === 'transfer').length})
          </span>
        </button>

        <div className="h-5 w-[2px] bg-neutral-300 dark:bg-neutral-700 shrink-0 mx-1" />

        <button
          type="button"
          onClick={() => {
            setFilterMonth('all');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 ${
            filterMonth === 'all'
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black font-black'
              : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
          }`}
        >
          {lang === 'en' ? 'All Months' : 'Semua Bulan'}
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterMonth(currentMonthKey);
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 ${
            filterMonth === currentMonthKey
              ? 'bg-[#FFE066] text-black font-black ring-2 ring-black dark:ring-neutral-400'
              : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
          }`}
        >
          {lang === 'en' ? 'This Month' : 'Bulan Ini'}
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterMonth(lastMonthKey);
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 ${
            filterMonth === lastMonthKey
              ? 'bg-[#FFE066] text-black font-black ring-2 ring-black dark:ring-neutral-400'
              : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100'
          }`}
        >
          {lang === 'en' ? 'Last Month' : 'Bulan Lalu'}
        </button>
      </div>

      {/* Filtered Financial Summary Strip */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#FAF9F5] dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl p-3 shadow-[2.5px_2.5px_0px_0px_#000]">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider block">
              {lang === 'en' ? 'Expense' : 'Pengeluaran'}
            </span>
            <p className="text-xs sm:text-sm font-black text-red-700 dark:text-red-400 truncate">
              -{maskBalance(formatRupiah(filteredSummary.expense))}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider block">
              {lang === 'en' ? 'Income' : 'Pemasukan'}
            </span>
            <p className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400 truncate">
              +{maskBalance(formatRupiah(filteredSummary.income))}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-0.5 border-t sm:border-t-0 sm:border-l border-neutral-300 dark:border-neutral-700 pt-1.5 sm:pt-0 sm:pl-3">
            <span className="text-[9px] font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider block">
              {lang === 'en' ? 'Net Cashflow' : 'Arus Kas Bersih'}
            </span>
            <p
              className={`text-xs sm:text-sm font-black truncate ${
                filteredSummary.net >= 0
                  ? 'text-emerald-800 dark:text-emerald-400'
                  : 'text-red-800 dark:text-red-400'
              }`}
            >
              {filteredSummary.net >= 0 ? '+' : ''}
              {maskBalance(formatRupiah(filteredSummary.net))}
            </p>
          </div>
        </div>
      )}

      {/* Date-Grouped Transactions with Swipe Gestures */}
      <div className="space-y-5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 border-dashed rounded-2xl shadow-[2px_2px_0px_0px_#000] p-6 space-y-3">
            <p className="text-black dark:text-white font-black text-sm uppercase tracking-wider">
              {lang === 'en' ? 'No transactions found' : 'Tidak ada transaksi ditemukan'}
            </p>
            <p className="text-neutral-500 dark:text-neutral-400 font-bold text-xs uppercase tracking-wide">
              {isFilterActive
                ? lang === 'en'
                  ? 'Try adjusting your search terms or clearing active filters.'
                  : 'Coba sesuaikan kata kunci pencarian atau bersihkan filter aktif.'
                : lang === 'en'
                ? 'No transactions recorded yet.'
                : 'Belum ada transaksi tercatat pada sistem.'}
            </p>
            {isFilterActive ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider"
              >
                {lang === 'en' ? 'Clear Filters' : 'Bersihkan Filter'}
              </button>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    window.dispatchEvent(new Event('norden_open_quick_input'));
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFE066] hover:bg-yellow-300 text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer rounded-xl"
                >
                  <Plus className="w-4 h-4 stroke-[3px]" />
                  {lang === 'en' ? 'Record First Transaction' : 'Catat Transaksi Pertama'}
                </button>
              </div>
            )}
          </div>
        ) : (
          groupedTransactions.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Sticky Date Group Header */}
              <div className="sticky top-0 z-20 flex items-center justify-between py-1.5 px-3 bg-[#FAF9F5] dark:bg-neutral-800/90 backdrop-blur-xs border-2 border-black dark:border-neutral-700 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 stroke-[2.5px] text-neutral-600 dark:text-neutral-300" />
                  <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    {group.label}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                    • {group.items.length} {lang === 'id' ? 'transaksi' : 'tx'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-black">
                  {group.totalExpense > 0 && (
                    <span className="text-red-600 dark:text-red-400">
                      -{maskBalance(formatRupiah(group.totalExpense))}
                    </span>
                  )}
                  {group.totalIncome > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      +{maskBalance(formatRupiah(group.totalIncome))}
                    </span>
                  )}
                </div>
              </div>

              {/* Group Transactions with Swipe Gestures */}
              <div className="space-y-2">
                {group.items.map((t) => (
                  <SwipeableTransactionRow
                    key={t.id}
                    transaction={t}
                    lang={lang}
                    maskBalance={maskBalance}
                    balances={balances}
                    isEditing={editingId === t.id}
                    isDeleting={deletingId === t.id}
                    isPending={pendingMutationId === t.id}
                    isRepeating={repeatingId === t.id}
                    editAmount={editAmount}
                    editNote={editNote}
                    editMethod={editMethod}
                    editTags={editTags}
                    onEditAmountChange={setEditAmount}
                    onEditNoteChange={setEditNote}
                    onEditMethodChange={setEditMethod}
                    onEditTagsChange={setEditTags}
                    onEditSave={() => handleEditSave(t.id)}
                    onEditCancel={() => setEditingId(null)}
                    onDeleteConfirm={() => handleDelete(t.id)}
                    onDeleteCancel={() => setDeletingId(null)}
                    onStartEdit={() => {
                      setEditingId(t.id);
                      setEditAmount(t.amount.toString());
                      setEditNote(t.note || '');
                      setEditMethod(t.wallet?.name || '');
                      setEditTags((t.tags || []).map((tag) => `#${tag}`).join(' '));
                    }}
                    onStartDelete={() => setDeletingId(t.id)}
                    onRepeat={() => handleRepeat(t)}
                    onOpenDetail={() => setActiveDetailTx(t)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Bottom Sheet for Transaction Detail */}
      {activeDetailTx && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveDetailTx(null)}
          />

          {/* Sheet panel */}
          <div className="relative bg-white dark:bg-neutral-900 border-t-2 border-black dark:border-neutral-700 p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] rounded-t-2xl animate-in slide-in-from-bottom duration-200 z-10 space-y-4 max-h-[85vh] overflow-y-auto safe-bottom text-black dark:text-white">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">
                  {getCategoryEmoji(activeDetailTx.category?.name)}
                </span>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                    {activeDetailTx.category?.name || (lang === 'en' ? 'Other' : 'Lain-lain')}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                    {activeDetailTx.type === 'masuk'
                      ? lang === 'en'
                        ? 'Income'
                        : 'Pemasukan'
                      : activeDetailTx.type === 'transfer'
                      ? lang === 'en'
                        ? 'Transfer'
                        : 'Transfer'
                      : lang === 'en'
                      ? 'Expense'
                      : 'Pengeluaran'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDetailTx(null)}
                className="p-1.5 border border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-black dark:text-white cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            {/* Amount */}
            <div className="p-4 bg-[#FAF9F5] dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl text-center shadow-[2px_2px_0px_0px_#000]">
              <span className="text-[10px] font-black uppercase text-neutral-500 dark:text-neutral-400 block mb-0.5">
                {lang === 'en' ? 'Total Amount' : 'Total Transaksi'}
              </span>
              <h2
                className={`text-2xl font-black ${
                  activeDetailTx.type === 'masuk'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : activeDetailTx.type === 'transfer'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-black dark:text-white'
                }`}
              >
                {activeDetailTx.type === 'masuk' ? '+' : activeDetailTx.type === 'transfer' ? '' : '-'}
                {maskBalance(formatRupiah(activeDetailTx.amount))}
              </h2>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
              <div className="p-2.5 border border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase block font-black">
                  {lang === 'en' ? 'Wallet' : 'Dompet'}
                </span>
                <span className="text-black dark:text-white font-black uppercase truncate block mt-0.5">
                  {formatMethodName(
                    activeDetailTx.wallet?.name || (lang === 'en' ? 'Other' : 'Lain-lain')
                  )}
                </span>
              </div>
              <div className="p-2.5 border border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase block font-black">
                  {lang === 'en' ? 'Date' : 'Tanggal'}
                </span>
                <span className="text-black dark:text-white font-black truncate block mt-0.5">
                  {formatTanggal(activeDetailTx.transactionDate)}
                </span>
              </div>
              <div className="p-2.5 border border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 col-span-2">
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase block font-black">
                  {lang === 'en' ? 'Note' : 'Catatan'}
                </span>
                <span className="text-black dark:text-white font-bold block mt-0.5">
                  {activeDetailTx.note || '-'}
                </span>
              </div>
              {(activeDetailTx.tags || []).length > 0 && (
                <div className="p-2.5 border border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 col-span-2">
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase block font-black mb-1">
                    {lang === 'en' ? 'Tags' : 'Tag'}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(activeDetailTx.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-[#e0f2fe] dark:bg-blue-950/70 border border-black dark:border-neutral-700 rounded-md text-[9px] font-black uppercase text-black dark:text-blue-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const tx = activeDetailTx;
                  setActiveDetailTx(null);
                  handleRepeat(tx);
                }}
                className="py-3 px-2 border-2 border-black dark:border-neutral-700 rounded-xl text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex flex-col items-center justify-center gap-1 active:translate-y-0.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-accent, #FFE066)',
                  color: 'var(--theme-accent-text, #000000)',
                }}
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-[10px]">{lang === 'en' ? 'Repeat' : 'Ulangi'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tx = activeDetailTx;
                  setActiveDetailTx(null);
                  setEditingId(tx.id);
                  setEditAmount(tx.amount.toString());
                  setEditNote(tx.note || '');
                  setEditMethod(tx.wallet?.name || '');
                  setEditTags((tx.tags || []).map((tag) => `#${tag}`).join(' '));
                }}
                className="py-3 px-2 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex flex-col items-center justify-center gap-1 active:translate-y-0.5 cursor-pointer rounded-xl"
              >
                <Edit2 className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-[10px]">{lang === 'en' ? 'Edit' : 'Ubah'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tx = activeDetailTx;
                  setActiveDetailTx(null);
                  setDeletingId(tx.id);
                }}
                className="py-3 px-2 border-2 border-black dark:border-neutral-700 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex flex-col items-center justify-center gap-1 active:translate-y-0.5 cursor-pointer rounded-xl"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-[10px]">{lang === 'en' ? 'Delete' : 'Hapus'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative bg-white dark:bg-neutral-900 border-t-[3px] border-black dark:border-neutral-700 rounded-t-2xl shadow-[0px_-4px_0px_0px_#000] p-5 max-h-[85vh] overflow-y-auto space-y-5 animate-in slide-in-from-bottom duration-200 z-10 text-black dark:text-white safe-bottom">
            <div className="w-12 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-auto -mt-1 mb-2" />

            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black dark:border-neutral-700 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 stroke-[2.5px] text-black dark:text-white" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                  {lang === 'en' ? 'Filter Transactions' : 'Filter Transaksi'}
                </h3>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#FFE066] text-black text-[10px] font-black border border-black rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-lg border-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white cursor-pointer"
                aria-label={lang === 'en' ? 'Close filter' : 'Tutup filter'}
              >
                <X className="w-4 h-4 stroke-[3px]" />
              </button>
            </div>

            {/* Filter by Month */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                {lang === 'en' ? 'Month' : 'Bulan'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setFilterMonth('all'); triggerHaptic('light'); }}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                    filterMonth === 'all'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                  }`}
                >
                  {lang === 'en' ? 'All Months' : 'Semua Bulan'}
                </button>
                {months.map((m) => {
                  const [y, mo] = m.split('-');
                  const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString(
                    lang === 'en' ? 'en-US' : 'id-ID',
                    { month: 'short', year: 'numeric' }
                  );
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setFilterMonth(m); triggerHaptic('light'); }}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                        filterMonth === m
                          ? 'bg-[#FFE066] text-black font-black shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter by Category */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                {lang === 'en' ? 'Category' : 'Kategori'}
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => { setFilterCategory('all'); triggerHaptic('light'); }}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                    filterCategory === 'all'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                  }`}
                >
                  {lang === 'en' ? 'All Categories' : 'Semua Kategori'}
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setFilterCategory(cat); triggerHaptic('light'); }}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                      filterCategory === cat
                        ? 'bg-[#FFE066] text-black font-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Wallet */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                {lang === 'en' ? 'Wallet' : 'Dompet'}
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setFilterMethod('all'); triggerHaptic('light'); }}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                    filterMethod === 'all'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                  }`}
                >
                  {lang === 'en' ? 'All Wallets' : 'Semua Dompet'}
                </button>
                {methods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => { setFilterMethod(method); triggerHaptic('light'); }}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                      filterMethod === method
                        ? 'bg-[#FFE066] text-black font-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                    }`}
                  >
                    {formatMethodName(method)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags if any */}
            {uniqueTags.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  Tag
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setFilterTag('all'); triggerHaptic('light'); }}
                    className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                      filterTag === 'all'
                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-[2px_2px_0px_0px_#000]'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                    }`}
                  >
                    {lang === 'en' ? 'All Tags' : 'Semua Tag'}
                  </button>
                  {uniqueTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => { setFilterTag(tag); triggerHaptic('light'); }}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 ${
                        filterTag === tag
                          ? 'bg-[#FFE066] text-black font-black shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-3 border-t-2 border-black dark:border-neutral-700">
              {isFilterActive && (
                <button
                  type="button"
                  onClick={() => { handleResetFilters(); triggerHaptic('medium'); }}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 bg-red-100 dark:bg-red-950/80 text-black dark:text-red-200 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  {lang === 'en' ? 'Reset All' : 'Reset Semua'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setMobileFilterOpen(false); triggerHaptic('light'); }}
                className="flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black dark:border-neutral-700 bg-[#FFE066] text-black shadow-[2px_2px_0px_0px_#000] cursor-pointer"
              >
                {lang === 'en' ? 'Apply Filter' : 'Terapkan Filter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
