'use client';

import { useMemo, useState } from 'react';
import { SavingGoal, Transaction } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { Loader2, TrendingUp, Plus } from 'lucide-react';
import { addSavingGoal, updateSavingGoal, deleteSavingGoal } from '../app/actions';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';

interface SavingGoalsProps {
  goals: SavingGoal[];
  transactions?: Transaction[];
}

interface MonthlySavingPoint {
  key: string;
  label: string;
  saving: number;
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
}

function buildMonthlySavings(transactions: Transaction[], lang: string): MonthlySavingPoint[] {
  const monthMap = new Map<string, { date: Date; income: number; expense: number }>();
  const monthFormatter = new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    year: 'numeric',
  });

  transactions.forEach((tx) => {
    if (tx.type === 'transfer') return;
    const date = new Date(tx.transactionDate);
    if (Number.isNaN(date.getTime())) return;

    const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const key = getMonthKey(monthDate);
    const existing = monthMap.get(key) ?? { date: monthDate, income: 0, expense: 0 };

    if (tx.type === 'masuk') existing.income += tx.amount;
    if (tx.type === 'keluar') existing.expense += tx.amount;

    monthMap.set(key, existing);
  });

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([key, value]) => ({
      key,
      label: monthFormatter.format(value.date),
      saving: value.income - value.expense,
    }));
}

function buildGoalProjection(goal: SavingGoal, monthlySavings: MonthlySavingPoint[], lang: string) {
  const monthFormatter = new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    year: 'numeric',
  });

  const positiveMonths = monthlySavings.filter((point) => point.saving > 0);
  const avgMonthlySaving =
    positiveMonths.length > 0
      ? positiveMonths.reduce((sum, point) => sum + point.saving, 0) / positiveMonths.length
      : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const isCompleted = remaining <= 0;
  const hasProjection = isCompleted || (monthlySavings.length >= 2 && avgMonthlySaving > 0);
  const monthsToComplete = isCompleted ? 0 : Math.ceil(remaining / avgMonthlySaving);
  const completionDate = hasProjection ? addMonths(new Date(), monthsToComplete) : null;
  const boostedMonths =
    avgMonthlySaving > 0 ? Math.ceil(remaining / (avgMonthlySaving + 500000)) : null;
  const fasterByMonths = boostedMonths === null ? 0 : Math.max(monthsToComplete - boostedMonths, 0);

  let historicalValue = Math.max(
    0,
    goal.currentAmount - positiveMonths.reduce((sum, point) => sum + point.saving, 0)
  );

  const chartData = monthlySavings.map((point) => {
    historicalValue = Math.min(
      goal.currentAmount,
      Math.max(0, historicalValue + Math.max(point.saving, 0))
    );
    return {
      label: point.label,
      saved: Math.round(historicalValue),
      target: goal.targetAmount,
    };
  });

  if (hasProjection && !isCompleted) {
    let projectedValue = goal.currentAmount;
    for (let index = 1; index <= Math.min(monthsToComplete, 12); index += 1) {
      projectedValue = Math.min(goal.targetAmount, projectedValue + avgMonthlySaving);
      chartData.push({
        label: monthFormatter.format(addMonths(new Date(), index)),
        saved: Math.round(projectedValue),
        target: goal.targetAmount,
      });
    }
  } else if (chartData.length === 0) {
    chartData.push({
      label: lang === 'id' ? 'Saat ini' : 'Now',
      saved: goal.currentAmount,
      target: goal.targetAmount,
    });
  }

  return {
    avgMonthlySaving,
    completionDate,
    fasterByMonths,
    hasProjection,
    isCompleted,
    monthsToComplete,
    remaining,
    chartData,
  };
}

export default function SavingGoals({ goals, transactions = [] }: SavingGoalsProps) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const completionFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }),
    [lang]
  );

  const shortRupiahFormatter = useMemo(
    () =>
      new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [lang]
  );

  const monthlySavings = useMemo(
    () => buildMonthlySavings(transactions, lang),
    [transactions, lang]
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseRupiahInput(targetAmount);
    if (!name.trim() || amount <= 0) return;
    setLoading(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await addSavingGoal(name.trim(), amount);
    if (res.success) {
      triggerHaptic('success');
      setName('');
      setTargetAmount('');
      setShowForm(false);
      setSuccess(
        lang === 'id'
          ? 'Target tabungan berhasil ditambahkan!'
          : 'Saving goal added successfully!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
    }
    setLoading(false);
  };

  const handleUpdateCurrent = async (id: string) => {
    const amount = parseRupiahInput(editAmount);
    setLoading(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await updateSavingGoal(id, { currentAmount: amount });
    if (res.success) {
      triggerHaptic('success');
      setEditingId(null);
      setEditAmount('');
      setSuccess(
        lang === 'id'
          ? 'Progres target tabungan berhasil diperbarui!'
          : 'Saving goal progress updated!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await deleteSavingGoal(id);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (res.success) {
      triggerHaptic('medium');
      setSuccess(
        lang === 'id' ? 'Target tabungan berhasil dihapus!' : 'Saving goal deleted successfully!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
    }
  };

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
          {lang === 'id' ? 'Target Tabungan' : 'Saving Goals'}
        </h3>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowForm(!showForm);
          }}
          className="px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 text-black"
          style={{
            backgroundColor: 'var(--theme-accent, #FFE066)',
            color: 'var(--theme-accent-text, #000000)',
          }}
        >
          <Plus className="w-3.5 h-3.5 stroke-[3px]" />
          <span>
            {showForm
              ? lang === 'id'
                ? 'Batal'
                : 'Cancel'
              : lang === 'id'
              ? '+ Target Baru'
              : '+ New Goal'}
          </span>
        </button>
      </div>

      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 brutal-card bg-[#FAF9F5] dark:bg-neutral-800 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white"
        >
          <input
            type="text"
            placeholder={
              lang === 'id' ? 'Nama Target (Contoh: Macbook Pro)' : 'Goal Name (E.g.: Macbook Pro)'
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 brutal-input px-3.5 py-2 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
            required
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder={lang === 'id' ? 'Target Nominal (Rp)' : 'Target Amount (Rp)'}
            value={targetAmount}
            onChange={(e) => setTargetAmount(formatRupiahInput(e.target.value))}
            className="flex-1 brutal-input px-3.5 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider min-w-[90px] flex justify-center items-center cursor-pointer shadow-[2px_2px_0px_0px_#000] text-black disabled:opacity-50"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : lang === 'id' ? (
              'Simpan'
            ) : (
              'Save'
            )}
          </button>
        </form>
      )}

      {(!goals || goals.length === 0) && !showForm ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-center px-4">
          <div
            className="p-2 border-2 border-black rounded-xl mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <span className="text-lg font-black text-black">🎯</span>
          </div>
          <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'id' ? 'Belum ada target tabungan' : 'No saving goals yet'}
          </p>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
            {lang === 'id'
              ? 'Buat target pencapaian tabungan Anda untuk memotivasi menyisihkan saldo.'
              : 'Create saving targets to stay motivated in putting aside money.'}
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {lang === 'id' ? '+ Buat Target Baru' : '+ Create New Goal'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress =
              goal.targetAmount > 0
                ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
                : 0;
            const projection = buildGoalProjection(goal, monthlySavings, lang);
            const remaining = projection.remaining;
            return (
              <div
                key={goal.id}
                className="border-b-2 border-neutral-100 dark:border-neutral-800 pb-5 mb-5 last:border-0 last:pb-0 last:mb-0"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-black text-base sm:text-lg uppercase tracking-wider text-black dark:text-white">
                      {goal.title}
                    </h4>
                    <p className="text-xs sm:text-sm font-black text-neutral-600 dark:text-neutral-400 mt-1">
                      {maskBalance(formatRupiah(goal.currentAmount))} /{' '}
                      <span className="text-black dark:text-white">
                        {maskBalance(formatRupiah(goal.targetAmount))}
                      </span>
                      {remaining > 0 && (
                        <span className="text-neutral-400 font-bold">
                          {' '}
                          • {maskBalance(formatRupiah(remaining))}{' '}
                          {lang === 'id' ? 'tersisa' : 'left'}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg sm:text-xl font-black ${
                        progress >= 100
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-black dark:text-white'
                      }`}
                    >
                      {progress.toFixed(1)}%
                    </span>
                    {confirmDeleteId === goal.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                          {lang === 'id' ? 'Hapus?' : 'Delete?'}
                        </span>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => handleDelete(goal.id)}
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
                        onClick={() => setConfirmDeleteId(goal.id)}
                        className="text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:underline font-black text-xs uppercase tracking-wider cursor-pointer"
                      >
                        {lang === 'id' ? 'Hapus' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full bg-[#f3f4f6] dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-full h-4 mb-3 overflow-hidden shadow-[1px_1px_0px_0px_#000]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 border-r-2 border-black ${
                      progress >= 100 ? 'bg-[#bbf7d0] dark:bg-emerald-500' : 'bg-[#bfdbfe] dark:bg-blue-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {editingId === goal.id ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={lang === 'id' ? 'Saldo Saat Ini (Rp)' : 'Current Balance (Rp)'}
                      value={editAmount}
                      onChange={(e) => setEditAmount(formatRupiahInput(e.target.value))}
                      className="flex-1 max-w-[200px] brutal-input text-xs py-1.5 font-bold"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateCurrent(goal.id)}
                      disabled={loading}
                      className="px-3.5 py-1.5 border-2 border-black dark:border-neutral-700 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer text-black"
                      style={{
                        backgroundColor: 'var(--theme-accent, #FFE066)',
                        color: 'var(--theme-accent-text, #000000)',
                      }}
                    >
                      {lang === 'id' ? 'Simpan' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditAmount('');
                      }}
                      className="px-3 py-1.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer"
                    >
                      {lang === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setEditingId(goal.id);
                      setEditAmount(formatRupiahInput(goal.currentAmount));
                    }}
                    className="text-xs font-black text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors mt-1 underline uppercase tracking-wider cursor-pointer"
                  >
                    {lang === 'id' ? 'Perbarui Progres' : 'Update Progress'}
                  </button>
                )}

                {/* Projection Card */}
                <div className="mt-4 border-2 border-black dark:border-neutral-700 bg-[#f8fafc] dark:bg-neutral-800/80 p-4 rounded-xl shadow-[2px_2px_0px_0px_#000] text-black dark:text-white">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-black dark:text-white" />
                        <h5 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                          {lang === 'id' ? 'Proyeksi Target Tabungan' : 'Goal Projection'}
                        </h5>
                      </div>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                        {lang === 'id'
                          ? 'Estimasi dari surplus kas bulanan riil.'
                          : 'Estimated from real monthly cash surplus.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-right sm:min-w-[220px]">
                      <div className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                          {lang === 'id' ? 'Rata-rata' : 'Monthly Avg'}
                        </p>
                        <p className="text-xs font-black text-black dark:text-white">
                          {maskBalance(formatRupiah(projection.avgMonthlySaving))}
                          {lang === 'id' ? '/bln' : '/mo'}
                        </p>
                      </div>
                      <div className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 p-2 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000]">
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                          {lang === 'id' ? 'Estimasi' : 'Estimated'}
                        </p>
                        <p className="text-xs font-black text-black dark:text-white">
                          {projection.hasProjection
                            ? projection.isCompleted
                              ? lang === 'id'
                                ? 'Tercapai'
                                : 'Reached'
                              : `${projection.monthsToComplete} ${lang === 'id' ? 'bln' : 'mos'}`
                            : lang === 'id'
                            ? 'Butuh data'
                            : 'Need data'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={projection.chartData}
                        margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                      >
                        <CartesianGrid stroke="#d4d4d4" strokeDasharray="4 4" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#737373', fontSize: 10, fontWeight: 800 }}
                          tickLine={false}
                          axisLine={{ stroke: '#000000', strokeWidth: 1.5 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fill: '#737373', fontSize: 10, fontWeight: 800 }}
                          tickFormatter={(value) =>
                            shortRupiahFormatter.format(Number(value || 0))
                          }
                          tickLine={false}
                          axisLine={false}
                          width={56}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#ffffff',
                            border: '2px solid #000000',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            boxShadow: '2px 2px 0px 0px #000',
                          }}
                          itemStyle={{ color: '#000000', fontWeight: '900' }}
                          formatter={(value: unknown, name: unknown) => [
                            formatRupiah(Number(value || 0)),
                            name === 'target'
                              ? lang === 'id'
                                ? 'Target'
                                : 'Target'
                              : lang === 'id'
                              ? 'Proyeksi'
                              : 'Projected',
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="#a3a3a3"
                          strokeWidth={2}
                          dot={false}
                          strokeDasharray="6 5"
                        />
                        <Line
                          type="monotone"
                          dataKey="saved"
                          stroke="#000000"
                          strokeWidth={3}
                          dot={{
                            r: 3,
                            strokeWidth: 2,
                            fill: '#bbf7d0',
                            stroke: '#000000',
                          }}
                          activeDot={{
                            r: 5,
                            strokeWidth: 2,
                            fill: '#FFE066',
                            stroke: '#000000',
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div
                    className={`mt-4 border-2 border-black dark:border-neutral-700 p-3 text-xs font-bold leading-relaxed rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] text-black ${
                      projection.hasProjection
                        ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 dark:text-emerald-200'
                        : 'bg-[#fef08a] dark:bg-amber-950/80 dark:text-amber-200'
                    }`}
                  >
                    {projection.hasProjection && projection.completionDate ? (
                      projection.isCompleted ? (
                        <p>
                          {lang === 'id'
                            ? 'Target ini sudah tercapai. Pertahankan ritme tabungan Anda untuk target berikutnya.'
                            : 'This goal has been achieved. Keep up your savings rhythm for the next goal.'}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <p>
                            {lang === 'id'
                              ? `Dengan kecepatan saat ini, target diperkirakan tercapai pada ${completionFormatter.format(
                                  projection.completionDate
                                )}.`
                              : `At your current savings pace, this goal is projected to complete by ${completionFormatter.format(
                                  projection.completionDate
                                )}.`}
                          </p>
                          {projection.fasterByMonths > 0 && (
                            <p>
                              {lang === 'id'
                                ? `Jika Anda menambah Rp500.000 per bulan, target dapat tercapai ${projection.fasterByMonths} bulan lebih cepat.`
                                : `By adding Rp500,000 monthly, you could reach it ${projection.fasterByMonths} months earlier.`}
                            </p>
                          )}
                        </div>
                      )
                    ) : (
                      <p>
                        {lang === 'id'
                          ? 'Tambahkan minimal dua bulan transaksi dengan surplus positif agar Norden bisa menghitung estimasi selesai.'
                          : 'Add at least two months of positive surplus transactions for Norden to calculate completion estimates.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
