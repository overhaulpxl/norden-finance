'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  PiggyBank,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { Balance, EmergencyFundPlan, Transaction } from '../types';
import { MIN_EMERGENCY_MONTHLY_EXPENSE } from '../lib/constants';
import { formatCoverageMonths, formatCurrency } from '../lib/format';
import { updateEmergencyFundPlan } from '../app/actions';
import { useHideBalance } from '../lib/HideBalanceContext';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

function estimateMonthlyExpense(transactions: Transaction[]) {
  const now = new Date();
  const monthTotals = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.type === 'keluar')
    .forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      const monthsAgo =
        (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
      if (monthsAgo < 0 || monthsAgo > 2) return;

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthTotals.set(key, (monthTotals.get(key) || 0) + transaction.amount);
    });

  const totals = Array.from(monthTotals.values()).filter((value) => value > 0);
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((sum, value) => sum + value, 0) / totals.length);
}

function parseCurrencyInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { state: 'empty' as const, value: null };

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return { state: 'invalid' as const, value: null };

  const numericValue = Number(digits);
  if (!Number.isFinite(numericValue)) return { state: 'invalid' as const, value: null };
  if (numericValue === 0) return { state: 'zero' as const, value: 0 };
  return { state: 'valid' as const, value: numericValue };
}

function formatInputValue(value: number) {
  return value > 0 ? formatCurrency(value) : '';
}

export default function EmergencyFundTracker({
  transactions,
  balances,
  emergencyFundPlan,
}: {
  transactions: Transaction[];
  balances: Balance[];
  emergencyFundPlan: EmergencyFundPlan | null;
}) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const estimatedExpense = useMemo(() => estimateMonthlyExpense(transactions), [transactions]);
  const [savedMonthlyExpense, setSavedMonthlyExpense] = useState(
    () => emergencyFundPlan?.monthlyExpense || 0
  );
  const totalBalance = balances
    .filter((wallet) => !wallet.archivedAt)
    .reduce((sum, wallet) => sum + wallet.currentBalance, 0);
  const availableBalance = Math.max(0, totalBalance);
  const [input, setInput] = useState(() =>
    formatInputValue(emergencyFundPlan?.monthlyExpense || 0)
  );
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const parsedInput = parseCurrencyInput(input);
  const hasWalletBalance = balances.some(
    (wallet) => !wallet.archivedAt && wallet.currentBalance !== 0
  );
  const hasExpenseData =
    savedMonthlyExpense > 0 || estimatedExpense > 0 || parsedInput.state !== 'empty';
  const calculationSource =
    savedMonthlyExpense > 0 ? 'saved' : estimatedExpense > 0 ? 'estimate' : 'manual';
  const monthlyExpense = savedMonthlyExpense > 0 ? savedMonthlyExpense : estimatedExpense;
  const isMonthlyExpenseRealistic = monthlyExpense >= MIN_EMERGENCY_MONTHLY_EXPENSE;
  const canCalculate = monthlyExpense > 0 && isMonthlyExpenseRealistic;
  const coverageMonths = canCalculate ? availableBalance / monthlyExpense : 0;
  const recommendationAvailable =
    !savedMonthlyExpense && estimatedExpense >= MIN_EMERGENCY_MONTHLY_EXPENSE;
  const lowInputWarning =
    parsedInput.state === 'valid' && parsedInput.value < MIN_EMERGENCY_MONTHLY_EXPENSE;

  const inputMessage = useMemo(() => {
    if (parsedInput.state === 'empty') return null;
    if (parsedInput.state === 'zero')
      return lang === 'id'
        ? 'Masukkan pengeluaran bulanan terlebih dahulu.'
        : 'Please enter monthly expense first.';
    if (parsedInput.state === 'invalid')
      return lang === 'id' ? 'Nominal tidak valid.' : 'Invalid amount.';
    if (lowInputWarning)
      return lang === 'id'
        ? 'Masukkan pengeluaran bulanan yang realistis.'
        : 'Enter a realistic monthly expense.';
    return null;
  }, [lowInputWarning, parsedInput.state, lang]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseCurrencyInput(input);

    if (parsed.state === 'empty' || parsed.state === 'zero') {
      setStatus({
        type: 'error',
        text:
          lang === 'id'
            ? 'Masukkan pengeluaran bulanan terlebih dahulu.'
            : 'Enter monthly expense first.',
      });
      return;
    }

    if (parsed.state !== 'valid' || parsed.value === null) {
      setStatus({
        type: 'error',
        text: lang === 'id' ? 'Nominal tidak valid.' : 'Invalid amount.',
      });
      return;
    }

    if (parsed.value < MIN_EMERGENCY_MONTHLY_EXPENSE) {
      setStatus({
        type: 'error',
        text:
          lang === 'id'
            ? 'Masukkan pengeluaran bulanan yang realistis.'
            : 'Enter a realistic monthly expense.',
      });
      return;
    }

    setSaving(true);
    setStatus(null);
    triggerHaptic('medium');
    const result = await updateEmergencyFundPlan(parsed.value);
    setSaving(false);

    if (result.success) {
      triggerHaptic('success');
      setSavedMonthlyExpense(parsed.value);
      setInput(formatInputValue(parsed.value));
      setStatus({
        type: 'success',
        text:
          lang === 'id'
            ? 'Target dana darurat diperbarui.'
            : 'Emergency fund target updated.',
      });
    } else {
      triggerHaptic('warning');
      setStatus({
        type: 'error',
        text:
          result.error ||
          (lang === 'id' ? 'Gagal menyimpan dana darurat.' : 'Failed to save emergency fund.'),
      });
    }
  }

  function useRecommendation() {
    if (!recommendationAvailable) return;
    triggerHaptic('selection');
    setInput(formatInputValue(estimatedExpense));
    setStatus(null);
  }

  const targets = [3, 6, 12].map((months) => {
    const targetAmount = monthlyExpense * months;
    const progress =
      canCalculate && targetAmount > 0
        ? Math.min(100, Math.max(0, (availableBalance / targetAmount) * 100))
        : 0;
    const remaining = Math.max(0, targetAmount - availableBalance);
    return { months, targetAmount, progress, remaining };
  });

  return (
    <section className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 sm:p-6 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="mb-6 grid gap-4 border-b-2 border-black dark:border-neutral-700 pb-5 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-black uppercase tracking-wider">
            <div
              className="p-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              <ShieldCheck className="h-4 w-4 stroke-[2.5px]" />
            </div>
            <span>{lang === 'id' ? 'Dana Darurat' : 'Emergency Fund'}</span>
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {lang === 'id'
              ? 'Dihitung dari 3, 6, dan 12 bulan pengeluaran hidup Anda.'
              : 'Calculated across 3, 6, and 12 months of living expenses.'}
          </p>
        </div>
        <div className="border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 px-4 py-3 text-left rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] sm:min-w-44 sm:text-right text-black dark:text-emerald-200">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-950 dark:text-emerald-300">
            {lang === 'id' ? 'Coverage Dana Darurat' : 'Emergency Coverage'}
          </p>
          <p className="mt-0.5 text-xl sm:text-2xl font-black">
            {formatCoverageMonths(coverageMonths)}
          </p>
          <p className="text-[9px] font-black uppercase tracking-widest opacity-80">
            {lang === 'id' ? 'Coverage saat ini' : 'Current coverage'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            {lang === 'id' ? 'Pengeluaran Bulanan (Rp)' : 'Monthly Expense (Rp)'}
          </span>
          <input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setStatus(null);
            }}
            onBlur={() => {
              const parsed = parseCurrencyInput(input);
              if (parsed.state === 'valid' && parsed.value !== null)
                setInput(formatInputValue(parsed.value));
            }}
            inputMode="numeric"
            className="brutal-input px-3.5 py-2 text-xs font-black bg-white dark:bg-neutral-800"
            placeholder={lang === 'id' ? 'Contoh: Rp 3.000.000' : 'E.g.: Rp 3,000,000'}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-auto min-h-10 px-5 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 text-black"
          style={{
            backgroundColor: 'var(--theme-accent, #FFE066)',
            color: 'var(--theme-accent-text, #000000)',
          }}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin text-black" />
          ) : (
            <PiggyBank className="h-4 w-4 text-black stroke-[2.5px]" />
          )}
          <span>{lang === 'id' ? 'Simpan' : 'Save'}</span>
        </button>
      </form>

      {inputMessage && (
        <div className="mb-4 flex items-start gap-2 border-2 border-black dark:border-neutral-700 bg-[#fef08a] dark:bg-amber-950/80 text-black dark:text-amber-200 p-3 text-xs font-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 stroke-[3px]" />
          <span>{inputMessage}</span>
        </div>
      )}

      {recommendationAvailable && (
        <div className="mb-5 flex flex-col gap-3 border-2 border-black dark:border-neutral-700 bg-[#e0f2fe] dark:bg-blue-950/80 text-black dark:text-blue-200 p-4 rounded-xl shadow-[2px_2px_0px_0px_#000] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 stroke-[3px]" />
            <p className="text-xs font-black leading-relaxed">
              {lang === 'id'
                ? `Rata-rata pengeluaran bulanan Anda sekitar ${formatCurrency(
                    estimatedExpense
                  )}. Gunakan nilai ini?`
                : `Your 3-month average monthly expense is around ${formatCurrency(
                    estimatedExpense
                  )}. Use this?`}
            </p>
          </div>
          <button
            type="button"
            onClick={useRecommendation}
            className="px-3 py-1.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
          >
            {lang === 'id' ? 'Gunakan Rekomendasi' : 'Use Recommendation'}
          </button>
        </div>
      )}

      {status && (
        <div
          className={`mb-5 border-2 border-black dark:border-neutral-700 p-3 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-200 ${
            status.type === 'success'
              ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
              : 'bg-[#fecaca] dark:bg-red-950/80 text-black dark:text-red-200'
          }`}
        >
          {status.text}
        </div>
      )}

      {!hasWalletBalance && !hasExpenseData ? (
        <div className="border-2 border-dashed border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 text-center rounded-xl">
          <p className="text-sm font-black uppercase tracking-wider">
            {lang === 'id'
              ? 'Belum cukup data untuk menghitung dana darurat.'
              : 'Not enough data to calculate emergency fund.'}
          </p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500 dark:text-neutral-400">
            {lang === 'id'
              ? 'Tambahkan transaksi atau isi pengeluaran bulanan secara manual.'
              : 'Add transactions or enter monthly expense manually.'}
          </p>
        </div>
      ) : !canCalculate ? (
        <div className="border-2 border-dashed border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 text-center rounded-xl">
          <p className="text-sm font-black uppercase tracking-wider">
            {monthlyExpense === 0
              ? lang === 'id'
                ? 'Masukkan pengeluaran bulanan terlebih dahulu.'
                : 'Enter monthly expense first.'
              : lang === 'id'
              ? 'Masukkan pengeluaran bulanan yang realistis.'
              : 'Enter a realistic monthly expense.'}
          </p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-500 dark:text-neutral-400">
            {lang === 'id'
              ? 'Target 3, 6, dan 12 bulan akan muncul setelah nominal pengeluaran valid.'
              : '3, 6, and 12-month targets will appear once expense is valid.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800/80 p-3 rounded-xl text-xs font-bold leading-relaxed shadow-[1.5px_1.5px_0px_0px_#000]">
            {lang === 'id' ? (
              <>
                Saldo Anda saat ini cukup untuk sekitar{' '}
                <span className="font-black text-black dark:text-white">
                  {formatCoverageMonths(coverageMonths)}
                </span>{' '}
                pengeluaran.
                {calculationSource === 'estimate'
                  ? ' Perhitungan memakai rata-rata pengeluaran 3 bulan terakhir.'
                  : ''}
              </>
            ) : (
              <>
                Your current balance covers approximately{' '}
                <span className="font-black text-black dark:text-white">
                  {formatCoverageMonths(coverageMonths)}
                </span>{' '}
                of living expenses.
                {calculationSource === 'estimate'
                  ? ' Based on your recent 3-month average expense.'
                  : ''}
              </>
            )}
          </div>
          {targets.map((target) => (
            <div
              key={target.months}
              className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 stroke-[2.5px]" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {lang === 'id'
                      ? `Target ${target.months} Bulan`
                      : `${target.months}-Month Target`}
                  </span>
                </div>
                <span className="text-right text-xs sm:text-sm font-black">
                  {maskBalance(formatCurrency(target.targetAmount))}
                </span>
              </div>
              <div className="mb-3 grid gap-1 text-xs font-bold text-neutral-600 dark:text-neutral-400 sm:grid-cols-2">
                <p>
                  {lang === 'id' ? 'Saldo Saat Ini:' : 'Current Balance:'}{' '}
                  <span className="font-black text-black dark:text-white">
                    {maskBalance(formatCurrency(totalBalance))}
                  </span>
                </p>
                <p className="sm:text-right">
                  {lang === 'id' ? 'Progres:' : 'Progress:'}{' '}
                  <span className="font-black text-black dark:text-white">
                    {target.progress.toFixed(1)}%
                  </span>
                </p>
              </div>
              <div
                className="h-3.5 overflow-hidden border-2 border-black dark:border-neutral-700 bg-[#f3f4f6] dark:bg-neutral-750 rounded-full shadow-[1px_1px_0px_0px_#000]"
                aria-label={`Progress target ${target.months} bulan`}
              >
                <div
                  className={`h-full border-r-2 border-black rounded-full transition-all duration-300 ${
                    target.progress >= 100
                      ? 'bg-[#bbf7d0] dark:bg-emerald-500'
                      : target.progress >= 50
                      ? 'bg-[#fef08a] dark:bg-amber-400'
                      : 'bg-[#fecaca] dark:bg-red-400'
                  }`}
                  style={{ width: `${target.progress}%` }}
                />
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs font-black">
                {target.progress >= 100 ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 stroke-[2.5px] text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <PiggyBank className="mt-0.5 h-4 w-4 shrink-0 stroke-[2.5px]" />
                )}
                <p>
                  {target.progress >= 100
                    ? lang === 'id'
                      ? 'Target tercapai! 🎉'
                      : 'Target achieved! 🎉'
                    : lang === 'id'
                    ? `Masih perlu ${maskBalance(formatCurrency(target.remaining))}`
                    : `Needs ${maskBalance(formatCurrency(target.remaining))} more`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
