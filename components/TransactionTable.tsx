'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Balance, Transaction } from '../types';
import { formatRupiah, formatTanggal, formatMethodName } from '../lib/format';
import { Search, Trash2, Edit2, Check, X, Download, ArrowDownRight, ArrowUpRight, ArrowRightLeft, RotateCcw, Loader2 } from 'lucide-react';
import { updateTransaction, deleteTransaction, addExplicitTransaction, restoreTransaction } from '../app/actions';
import WalletSelect from './WalletSelect';
import { getCategoryEmoji } from '../lib/categoryEmoji';
import { triggerHaptic } from '../lib/haptics';
import { triggerUndoToast } from '../lib/undoToast';
import { useHideBalance } from '../lib/HideBalanceContext';

export default function TransactionTable({ transactions, balances = [] }: { transactions: Transaction[]; balances?: Balance[] }) {
  const router = useRouter();
  const { maskBalance } = useHideBalance();
  const [transactionOverrides, setTransactionOverrides] = useState<Record<string, Transaction>>({});
  const [deletedTransactionIds, setDeletedTransactionIds] = useState<Set<string>>(() => new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterTag, setFilterTag] = useState('all');

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

  const months = Array.from(new Set(visibleTransactions.map(t => {
    const d = new Date(t.transactionDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();

  const categories = Array.from(new Set(visibleTransactions.map(t => t.category?.name || 'Lain-lain'))).sort();
  const methods = Array.from(new Set(visibleTransactions.map(t => t.wallet?.name || 'Lain-lain'))).sort();

  const uniqueTags = Array.from(new Set(
    visibleTransactions.flatMap((t) => t.tags || [])
  )).sort();

  const filtered = visibleTransactions.filter(t => {
    const tags = t.tags || [];
    const query = searchQuery.toLowerCase();
    const haystack = [
      t.category?.name || 'Lain-lain',
      t.note || '',
      t.wallet?.name || '',
      t.rawInput || '',
      ...tags.map((tag) => `#${tag}`)
    ].join(' ').toLowerCase();
    const matchesSearch = !query || haystack.includes(query);

    const d = new Date(t.transactionDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const matchesMonth = filterMonth === 'all' || monthKey === filterMonth;

    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || (t.category?.name || 'Lain-lain') === filterCategory;
    const matchesMethod = filterMethod === 'all' || (t.wallet?.name || 'Lain-lain') === filterMethod;
    const matchesTag = filterTag === 'all' || tags.includes(filterTag);

    return matchesSearch && matchesMonth && matchesType && matchesCategory && matchesMethod && matchesTag;
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

  const exportTransactionsToCSV = (txList: Transaction[]) => {
    if (txList.length === 0) return;
    const headers = ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Metode', 'Keterangan', 'Tags'];
    const rows = txList.map(t => [
      formatTanggal(t.transactionDate),
      t.type,
      t.category?.name || 'Lain-lain',
      t.amount,
      t.wallet?.name || 'Lain-lain',
      t.note || '-',
      (t.tags || []).join(' ')
    ]);
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csvContent = [headers.map(escapeCsv).join(','), ...rows.map(row => row.map(escapeCsv).join(','))].join("\n");
    const encodedUri = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `norden-export-${new Date().toISOString().split('T')[0]}.csv`);
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
      setError('Pilih wallet terlebih dahulu');
      return;
    }

    setError(null);
    setSuccess(null);
    setPendingMutationId(id);
    const tags = editTags.split(/\s+/).map(tag => tag.replace(/^#/, '').trim()).filter(Boolean);
    const res = await updateTransaction(id, { amount, note: editNote, wallet: editMethod, tags });
    if (res.success) {
      const wallet = balances.find((balance) => balance.name === editMethod);
      const currentTransaction = visibleTransactions.find((transaction) => transaction.id === id);
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
      setSuccess('Transaksi berhasil diperbarui!');
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else {
      setError(res.error || 'Gagal memperbarui transaksi');
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
      setSuccess('Transaksi berhasil dihapus!');
      setTimeout(() => setSuccess(null), 5000);

      // Trigger floating undo notification
      triggerUndoToast({
        message: `Transaksi "${targetTx?.category?.name || 'Lain-lain'}" (${formatRupiah(targetTx?.amount || 0)}) telah dihapus.`,
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
      setError(res.error || 'Gagal menghapus transaksi');
    }
    setPendingMutationId(null);
  };

  const [repeatingId, setRepeatingId] = useState<string | null>(null);
  const [activeDetailTx, setActiveDetailTx] = useState<Transaction | null>(null);

  const handleRepeat = async (tx: Transaction) => {
    if (pendingMutationId || repeatingId) return;
    setError(null);
    setSuccess(null);
    setRepeatingId(tx.id);

    try {
      const res = await addExplicitTransaction({
        type: tx.type,
        amount: tx.amount,
        category: tx.category?.name || 'Lain-lain',
        wallet: tx.wallet?.name || 'Cash',
        note: tx.note ? `${tx.note} (Ulang)` : 'Transaksi Diulang',
        transactionDate: new Date().toISOString(),
        tags: tx.tags || [],
      });

      if (!res.success) {
        throw new Error(res.error || 'Gagal mengulangi transaksi');
      }

      triggerHaptic('success');
      setSuccess(`Transaksi "${tx.category?.name || 'Lain-lain'}" berhasil dicatat untuk hari ini!`);
      setTimeout(() => setSuccess(null), 4000);

      const newTxId = 'transactionId' in res && typeof res.transactionId === 'string' ? res.transactionId : null;
      if (newTxId) {
        triggerUndoToast({
          message: `Transaksi "${tx.category?.name || 'Lain-lain'}" (${formatRupiah(tx.amount)}) berhasil dicatat ulang.`,
          onUndo: async () => {
            await deleteTransaction(newTxId);
            router.refresh();
          },
        });
      }

      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengulangi transaksi');
    } finally {
      setRepeatingId(null);
    }
  };

  const isFilterActive = searchQuery !== '' || filterMonth !== 'all' || filterType !== 'all' || filterCategory !== 'all' || filterMethod !== 'all' || filterTag !== 'all';
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

  const selectClass = "bg-white border-[2.5px] border-black text-black font-black text-xs rounded-none px-3 py-2 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider appearance-none cursor-pointer";

  return (
    <div className="select-none space-y-4">
      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 border-[2px] border-black bg-[#fecaca] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* Filter Tray & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-[#FAF9F5] border-[2px] border-black p-3.5 shadow-[3px_3px_0px_0px_#000]">
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black stroke-[3px]" />
          <input
            type="text"
            placeholder="Cari transaksi, catatan, tag..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full brutal-input pl-9 pr-4 py-2 text-xs font-bold uppercase"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className={selectClass}>
            <option value="all">Semua Bulan</option>
            {months.map(m => {
              const [y, mo] = m.split('-');
              const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
              return <option key={m} value={m}>{label}</option>;
            })}
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}>
            <option value="all">Semua Jenis</option>
            <option value="masuk">Pemasukan (+)</option>
            <option value="keluar">Pengeluaran (-)</option>
            <option value="transfer">Transfer (⇆)</option>
          </select>

          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectClass}>
            <option value="all">Semua Kategori</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>

          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className={selectClass}>
            <option value="all">Semua Dompet</option>
            {methods.map(m => <option key={m} value={m}>{formatMethodName(m)}</option>)}
          </select>

          {uniqueTags.length > 0 && (
            <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className={selectClass}>
              <option value="all">Semua Tag</option>
              {uniqueTags.map(tag => <option key={tag} value={tag}>#{tag}</option>)}
            </select>
          )}

          {isFilterActive && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-2 border-[2px] border-black bg-[#fecaca] hover:bg-red-200 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-colors"
              title="Bersihkan semua filter"
            >
              Reset ({activeFilterCount})
            </button>
          )}

          {filtered.length > 0 && (
            <button
              onClick={() => exportTransactionsToCSV(filtered)}
              className="brutal-btn-light px-3 py-2 text-xs flex items-center gap-1.5 font-black uppercase tracking-wider cursor-pointer ml-auto lg:ml-0"
              title="Unduh data hasil filter sebagai CSV"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5px]" /> Ekspor CSV
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
          className={`px-3 py-1.5 border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 ${
            filterType === 'all' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          Semua ({transactions.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType('keluar');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            filterType === 'keluar' ? 'bg-[#fecaca] text-black ring-2 ring-black' : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <span>Pengeluaran ({transactions.filter((t) => t.type === 'keluar').length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType('masuk');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            filterType === 'masuk' ? 'bg-[#bbf7d0] text-black ring-2 ring-black' : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          <span>Pemasukan ({transactions.filter((t) => t.type === 'masuk').length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterType('transfer');
            triggerHaptic('light');
          }}
          className={`px-3 py-1.5 border-[2px] border-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            filterType === 'transfer' ? 'bg-[#bfdbfe] text-black ring-2 ring-black' : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
          <span>Transfer ({transactions.filter((t) => t.type === 'transfer').length})</span>
        </button>
      </div>

      {/* Filtered Financial Summary Strip */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#FAF9F5] border-[2px] border-black p-3 shadow-[2.5px_2.5px_0px_0px_#000]">
          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block">
              Pengeluaran
            </span>
            <p className="text-xs sm:text-sm font-black text-red-700 truncate">
              -{maskBalance(formatRupiah(filteredSummary.expense))}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block">
              Pemasukan
            </span>
            <p className="text-xs sm:text-sm font-black text-emerald-700 truncate">
              +{maskBalance(formatRupiah(filteredSummary.income))}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 space-y-0.5 border-t sm:border-t-0 sm:border-l border-neutral-300 pt-1.5 sm:pt-0 sm:pl-3">
            <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block">
              Arus Kas Bersih
            </span>
            <p className={`text-xs sm:text-sm font-black truncate ${
              filteredSummary.net >= 0 ? 'text-emerald-800' : 'text-red-800'
            }`}>
              {filteredSummary.net >= 0 ? '+' : ''}{maskBalance(formatRupiah(filteredSummary.net))}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white border-[3px] border-black border-dashed rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-6 space-y-3">
            <p className="text-black font-black text-sm uppercase tracking-wider">Tidak ada transaksi ditemukan</p>
            <p className="text-neutral-500 font-bold text-xs uppercase tracking-wide">
              {isFilterActive ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter aktif.' : 'Belum ada transaksi tercatat pada sistem.'}
            </p>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider"
              >
                Bersihkan Filter
              </button>
            )}
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="border-[2px] border-black rounded-none p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]">
              <div
                className="flex items-start sm:items-center gap-3 min-w-0 flex-1 cursor-pointer sm:cursor-default"
                onClick={() => {
                  if (editingId !== t.id && deletingId !== t.id) {
                    setActiveDetailTx(t);
                    triggerHaptic('light');
                  }
                }}
              >
                <div className={`p-2 rounded-none border-[2px] border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0 ${
                  t.type === 'masuk' ? 'bg-[#bbf7d0] text-black' :
                  t.type === 'transfer' ? 'bg-[#bfdbfe] text-black' :
                  'bg-[#fecaca] text-black'
                }`}>
                  {t.type === 'masuk' ? <ArrowDownRight className="w-4 h-4 stroke-[3px]" /> :
                   t.type === 'transfer' ? <ArrowRightLeft className="w-4 h-4 stroke-[3px]" /> :
                   <ArrowUpRight className="w-4 h-4 stroke-[3px]" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm shrink-0 select-none">{getCategoryEmoji(t.category?.name)}</span>
                    <h4 className="font-black text-xs sm:text-sm text-black uppercase tracking-wider truncate">
                      {t.category?.name || 'Lain-lain'}
                    </h4>
                  </div>

                  {editingId === t.id ? (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        className="bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black outline-none font-bold uppercase"
                        placeholder="Catatan..."
                      />
                      <WalletSelect
                        wallets={balances}
                        value={editMethod}
                        onChange={setEditMethod}
                        className="w-24 bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black outline-none uppercase font-black"
                        required
                      />
                      <input
                        type="text"
                        value={editTags}
                        onChange={e => setEditTags(e.target.value)}
                        className="w-24 bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black outline-none font-bold uppercase"
                        placeholder="#tags..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                        <span className="text-black font-black truncate max-w-[200px]">{t.note || '-'}</span>
                        <span className="h-1 w-1 rounded-none bg-black shrink-0" />
                        <span className="text-black font-black shrink-0">{formatMethodName(t.wallet?.name || 'Lain-lain')}</span>
                        <span className="h-1 w-1 rounded-none bg-black shrink-0" />
                        <span className="text-neutral-500 shrink-0">{formatTanggal(t.transactionDate)}</span>
                      </div>
                      {(t.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {(t.tags || []).map((tag) => (
                            <span key={tag} className="border border-black bg-[#e0f2fe] px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider text-black">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                <div className="text-left sm:text-right">
                  {editingId === t.id ? (
                    <input
                      type="text"
                      value={editAmount}
                      onChange={e => setEditAmount(e.target.value)}
                      className="w-28 bg-white border-[2px] border-black rounded-none px-2.5 py-1 text-xs text-black font-black outline-none text-right"
                      autoFocus
                    />
                  ) : (
                    <span className={`text-sm sm:text-base font-black tracking-wider ${
                      t.type === 'masuk' ? 'text-emerald-700' :
                      t.type === 'transfer' ? 'text-blue-700' :
                      'text-black'
                    }`}>
                      {t.type === 'masuk' ? '+' : t.type === 'transfer' ? '' : '-'}{maskBalance(formatRupiah(t.amount))}
                    </span>
                  )}
                </div>

                {/* Visible on mobile touch devices, hover on desktop */}
                <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end shrink-0">
                  {editingId === t.id ? (
                    <>
                      <button disabled={pendingMutationId === t.id} onClick={() => handleEditSave(t.id)} className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-none transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50" title="Simpan perubahan"><Check className="w-4 h-4 stroke-[3px]" /></button>
                      <button disabled={pendingMutationId === t.id} onClick={() => setEditingId(null)} className="p-1.5 text-neutral-500 hover:bg-neutral-50 rounded-none transition-colors border border-transparent hover:border-black cursor-pointer disabled:opacity-50" title="Batal"><X className="w-4 h-4 stroke-[3px]" /></button>
                    </>
                  ) : deletingId === t.id ? (
                    <>
                      <button disabled={pendingMutationId === t.id} onClick={() => handleDelete(t.id)} className="px-2 py-0.5 bg-red-600 text-white border border-black rounded-none text-[10px] font-black uppercase cursor-pointer disabled:opacity-50" title="Konfirmasi hapus">Ya</button>
                      <button disabled={pendingMutationId === t.id} onClick={() => setDeletingId(null)} className="px-2 py-0.5 bg-white text-black border border-black rounded-none text-[10px] font-black uppercase cursor-pointer disabled:opacity-50" title="Batal">Batal</button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRepeat(t)}
                        disabled={repeatingId === t.id}
                        className="p-1.5 text-neutral-600 hover:text-black hover:bg-[#FFE066] rounded-none transition-colors cursor-pointer disabled:opacity-40"
                        title="Ulangi transaksi ini untuk hari ini (1-Klik)"
                      >
                        {repeatingId === t.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button onClick={() => { setEditingId(t.id); setEditAmount(t.amount.toString()); setEditNote(t.note || ''); setEditMethod(t.wallet?.name || ''); setEditTags((t.tags || []).map(tag => `#${tag}`).join(' ')); }} className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-none transition-colors cursor-pointer" title="Edit transaksi"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeletingId(t.id)} className="p-1.5 text-neutral-600 hover:text-red-650 hover:bg-red-50 rounded-none transition-colors cursor-pointer" title="Hapus transaksi"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
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
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveDetailTx(null)}
          />

          {/* Sheet panel */}
          <div className="relative bg-white border-t-[3px] border-black p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] rounded-none animate-in slide-in-from-bottom duration-200 z-10 space-y-4 max-h-[85vh] overflow-y-auto safe-bottom">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl select-none">{getCategoryEmoji(activeDetailTx.category?.name)}</span>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-black">
                    {activeDetailTx.category?.name || 'Lain-lain'}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
                    {activeDetailTx.type === 'masuk' ? 'Pemasukan' : activeDetailTx.type === 'transfer' ? 'Transfer' : 'Pengeluaran'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDetailTx(null)}
                className="p-1.5 border border-black bg-neutral-100 hover:bg-neutral-200 text-black cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            {/* Amount */}
            <div className="p-4 bg-[#FAF9F5] border-[2px] border-black text-center">
              <span className="text-[10px] font-black uppercase text-neutral-500 block mb-0.5">
                Total Transaksi
              </span>
              <h2 className={`text-2xl font-black ${
                activeDetailTx.type === 'masuk' ? 'text-emerald-700' :
                activeDetailTx.type === 'transfer' ? 'text-blue-700' :
                'text-black'
              }`}>
                {activeDetailTx.type === 'masuk' ? '+' : activeDetailTx.type === 'transfer' ? '' : '-'}{maskBalance(formatRupiah(activeDetailTx.amount))}
              </h2>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
              <div className="p-2.5 border border-black bg-white">
                <span className="text-[10px] text-neutral-500 uppercase block font-black">Dompet</span>
                <span className="text-black font-black uppercase truncate block mt-0.5">
                  {formatMethodName(activeDetailTx.wallet?.name || 'Lain-lain')}
                </span>
              </div>
              <div className="p-2.5 border border-black bg-white">
                <span className="text-[10px] text-neutral-500 uppercase block font-black">Tanggal</span>
                <span className="text-black font-black truncate block mt-0.5">
                  {formatTanggal(activeDetailTx.transactionDate)}
                </span>
              </div>
              <div className="p-2.5 border border-black bg-white col-span-2">
                <span className="text-[10px] text-neutral-500 uppercase block font-black">Catatan</span>
                <span className="text-black font-bold block mt-0.5">
                  {activeDetailTx.note || '-'}
                </span>
              </div>
              {(activeDetailTx.tags || []).length > 0 && (
                <div className="p-2.5 border border-black bg-white col-span-2">
                  <span className="text-[10px] text-neutral-500 uppercase block font-black mb-1">Tag</span>
                  <div className="flex flex-wrap gap-1">
                    {(activeDetailTx.tags || []).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-[#e0f2fe] border border-black text-[9px] font-black uppercase">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => {
                  const tx = activeDetailTx;
                  setActiveDetailTx(null);
                  handleRepeat(tx);
                }}
                className="py-3 px-2 border-[2px] border-black bg-[#FFE066] hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex flex-col items-center justify-center gap-1 active:translate-y-0.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-[10px]">Ulangi</span>
              </button>

              <button
                onClick={() => {
                  const tx = activeDetailTx;
                  setActiveDetailTx(null);
                  setEditingId(tx.id);
                  setEditAmount(tx.amount.toString());
                  setEditNote(tx.note || '');
                  setEditMethod(tx.wallet?.name || '');
                  setEditTags((tx.tags || []).map(tag => `#${tag}`).join(' '));
                }}
                className="py-3 px-2 border-[2px] border-black bg-white hover:bg-neutral-100 text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex flex-col items-center justify-center gap-1 active:translate-y-0.5 cursor-pointer"
              >
                <Edit2 className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-[10px]">Ubah</span>
              </button>

              <button
                onClick={() => {
                  const tx = activeDetailTx;
                  setActiveDetailTx(null);
                  setDeletingId(tx.id);
                }}
                className="py-3 px-2 border-[2px] border-black bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] flex flex-col items-center justify-center gap-1 active:translate-y-0.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 stroke-[2.5px]" />
                <span className="text-[10px]">Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
