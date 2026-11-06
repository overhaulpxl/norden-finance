'use client';

import { useState } from 'react';
import { Budget, Transaction } from '../types';
import { addBudget, deleteBudget } from '../app/actions';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { Trash2, AlertTriangle, Plus } from 'lucide-react';
import { useHideBalance } from '../lib/HideBalanceContext';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

interface BudgetManagerProps {
  budgets: Budget[];
  transactions: Transaction[];
  isPro?: boolean;
}

export default function BudgetManager({ budgets, transactions }: BudgetManagerProps) {
  const { maskBalance } = useHideBalance();
  const { lang, t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Calculate current month spending per budget category
  const budgetsWithSpending = budgets.map((budget) => {
    const spending = transactions
      .filter(
        (t) =>
          t.type === 'keluar' &&
          t.category?.name.toLowerCase() === budget.category?.name.toLowerCase() &&
          new Date(t.transactionDate) >= startOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const percentage = budget.monthlyLimit > 0 ? (spending / budget.monthlyLimit) * 100 : 0;
    const isExceeded = spending > budget.monthlyLimit;

    return {
      ...budget,
      spending,
      percentage,
      isExceeded,
    };
  });

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    triggerHaptic('medium');

    const limitNum = parseRupiahInput(limit);

    if (!category.trim() || limitNum <= 0) {
      triggerHaptic('warning');
      setError(
        lang === 'id'
          ? 'Harap isi kategori dan limit bulanan dengan angka positif'
          : 'Please enter category and a positive monthly limit'
      );
      return;
    }

    const res = await addBudget(category, limitNum);
    if (res.success) {
      triggerHaptic('success');
      setCategory('');
      setLimit('');
      setShowForm(false);
      setSuccess(
        lang === 'id' ? 'Budget bulanan berhasil ditambahkan!' : 'Monthly budget added!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(res.error || (lang === 'id' ? 'Gagal menambahkan budget' : 'Failed to add budget'));
    }
  }

  async function handleDeleteBudget(id: string) {
    setDeleting(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await deleteBudget(id);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (res.success) {
      triggerHaptic('medium');
      setSuccess(
        lang === 'id' ? 'Budget bulanan berhasil dihapus!' : 'Monthly budget deleted!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(res.error || (lang === 'id' ? 'Gagal menghapus budget' : 'Failed to delete budget'));
    }
  }

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="flex justify-between items-center mb-6 border-b-2 border-black dark:border-neutral-700 pb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-2">
          <span>🎯</span>
          <span>{t('budget_title')}</span>
        </h3>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowForm(!showForm);
            setError(null);
          }}
          className="px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 text-black"
          style={{
            backgroundColor: 'var(--theme-accent, #FFE066)',
            color: 'var(--theme-accent-text, #000000)',
          }}
        >
          {showForm ? (
            t('btn_cancel')
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[3px]" />
              <span>{t('budget_manage')}</span>
            </>
          )}
        </button>
      </div>

      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAddBudget}
          className="mb-6 p-4 sm:p-5 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 space-y-4 rounded-xl shadow-[3px_3px_0px_0px_#000] animate-in fade-in duration-200 text-black dark:text-white"
        >
          {error && (
            <p className="text-xs font-black text-red-650 dark:text-red-400 uppercase tracking-wider">
              ❌ {error}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 tracking-widest text-neutral-600 dark:text-neutral-400">
                {t('budget_category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full brutal-input p-2.5 text-xs font-black uppercase bg-white dark:bg-neutral-900 cursor-pointer"
                required
              >
                <option value="">{lang === 'id' ? 'Pilih Kategori' : 'Select Category'}</option>
                <option value="makan">{lang === 'id' ? 'Makan' : 'Food'}</option>
                <option value="transport">Transport</option>
                <option value="langganan">{lang === 'id' ? 'Langganan' : 'Subscription'}</option>
                <option value="topup">Top Up</option>
                <option value="belanja">{lang === 'id' ? 'Belanja' : 'Shopping'}</option>
                <option value="cicilan">{lang === 'id' ? 'Cicilan' : 'Installment'}</option>
                <option value="lain-lain">{lang === 'id' ? 'Lain-lain' : 'Others'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 tracking-widest text-neutral-600 dark:text-neutral-400">
                {t('budget_limit')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder={lang === 'id' ? 'Contoh: 500.000' : 'E.g.: 500.000'}
                value={limit}
                onChange={(e) => setLimit(formatRupiahInput(e.target.value))}
                className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-[2px_2px_0px_0px_#000] text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {t('budget_save')}
          </button>
        </form>
      )}

      {budgetsWithSpending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-center px-4">
          <div
            className="p-2 border-2 border-black rounded-xl mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <span className="text-lg font-black text-black">📊</span>
          </div>
          <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            {t('budget_empty_title')}
          </p>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
            {t('budget_empty_desc')}
          </p>
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setError(null);
            }}
            className="mt-4 px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {t('budget_add_new')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {budgetsWithSpending.map((b) => (
            <div
              key={b.id}
              className={`p-4 border-2 border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 shadow-[2.5px_2.5px_0px_0px_#000] text-black dark:text-white ${
                b.isExceeded ? 'bg-red-50/70 dark:bg-red-950/40 border-red-400' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-black dark:text-white bg-[#FAF9F5] dark:bg-neutral-900 px-2 py-0.5 border border-black dark:border-neutral-700 rounded-md shadow-[1px_1px_0px_0px_#000]">
                    {b.category?.name}
                  </span>
                  {b.isExceeded && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-red-650 dark:text-red-400 uppercase tracking-widest">
                      <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5px]" />{' '}
                      {lang === 'id' ? 'Melebihi Budget!' : 'Over budget!'}
                    </span>
                  )}
                </div>
                {confirmDeleteId === b.id ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                      {lang === 'id' ? 'Hapus?' : 'Delete?'}
                    </span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => handleDeleteBudget(b.id)}
                      className="px-2 py-0.5 bg-red-600 text-white border border-black rounded text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] hover:bg-red-700 cursor-pointer"
                    >
                      {lang === 'id' ? 'Ya' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white border border-black text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] hover:bg-neutral-300 rounded cursor-pointer"
                    >
                      {lang === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(b.id)}
                    className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                    title={lang === 'id' ? 'Hapus budget' : 'Delete budget'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex justify-between items-end text-xs font-black mt-2 tracking-wider">
                <span>{maskBalance(formatRupiah(b.spending))}</span>
                <span className="text-neutral-500 dark:text-neutral-400 font-bold uppercase">
                  Limit: {maskBalance(formatRupiah(b.monthlyLimit))}
                </span>
              </div>

              {/* Progress bar container */}
              <div className="w-full bg-[#f3f4f6] dark:bg-neutral-750 border-2 border-black dark:border-neutral-700 h-3.5 rounded-full overflow-hidden mt-2 relative shadow-[1px_1px_0px_0px_#000]">
                <div
                  className={`h-full rounded-full transition-all duration-500 border-r-2 border-black ${
                    b.isExceeded
                      ? 'bg-red-500'
                      : b.percentage >= 80
                      ? 'bg-[#fef08a] dark:bg-amber-400'
                      : 'bg-[#bbf7d0] dark:bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-end mt-1 text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {Math.round(b.percentage)}% {lang === 'id' ? 'terpakai' : 'spent'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
