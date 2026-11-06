'use client';

import { useState } from 'react';
import { Debt, DebtType } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { Loader2, Trash2, Plus } from 'lucide-react';
import { addDebt, toggleDebtSettled, deleteDebt } from '../app/actions';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';

export default function DebtList({ debts }: { debts: Debt[] }) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<DebtType>('piutang');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [tenor, setTenor] = useState('');
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('active');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person.trim() || !amount) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    triggerHaptic('medium');
    const numericAmount = parseRupiahInput(amount);
    const numericTenor = parseInt(tenor.replace(/\D/g, ''), 10);
    const numericInterest = parseFloat(interest);

    if (!numericAmount || numericAmount <= 0) {
      triggerHaptic('warning');
      setError(
        lang === 'id'
          ? 'Nominal harus berupa angka positif'
          : 'Amount must be a positive number'
      );
      setLoading(false);
      return;
    }

    const res = await addDebt({
      type: formType,
      person: person.trim(),
      amount: numericAmount,
      note: note.trim() || undefined,
      tenorMonths: !isNaN(numericTenor) ? numericTenor : undefined,
      interestRate: !isNaN(numericInterest) ? numericInterest : undefined,
    });

    if (res.success) {
      triggerHaptic('success');
      setPerson('');
      setAmount('');
      setNote('');
      setTenor('');
      setInterest('');
      setShowForm(false);
      setSuccess(
        lang === 'id' ? 'Catatan berhasil ditambahkan!' : 'Record successfully added!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(res.error || (lang === 'id' ? 'Gagal menyimpan' : 'Failed to save'));
    }
    setLoading(false);
  };

  const handleSettle = async (id: string) => {
    setSuccess(null);
    triggerHaptic('medium');
    const res = await toggleDebtSettled(id);
    if (res.success) {
      triggerHaptic('success');
      setSuccess(
        lang === 'id' ? 'Status pelunasan diperbarui!' : 'Settlement status updated!'
      );
      setTimeout(() => setSuccess(null), 4000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal mengubah status' : 'Failed to update status')
      );
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await deleteDebt(id);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (res.success) {
      triggerHaptic('medium');
      setSuccess(lang === 'id' ? 'Catatan berhasil dihapus!' : 'Record successfully deleted!');
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'id' ? 'Gagal menghapus catatan' : 'Failed to delete record')
      );
    }
  };

  const filteredDebts = debts.filter((d) => {
    if (filter === 'active') return !d.isSettled;
    if (filter === 'settled') return d.isSettled;
    return true;
  });

  const totalPiutang = debts
    .filter((d) => d.type === 'piutang' && !d.isSettled)
    .reduce((a, c) => a + c.amount, 0);
  const totalHutang = debts
    .filter((d) => d.type === 'hutang' && !d.isSettled)
    .reduce((a, c) => a + c.amount, 0);

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
          {lang === 'id' ? 'Utang & Piutang' : 'Debts & Receivables'}
        </h3>
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowForm(!showForm);
            setError(null);
          }}
          className="px-4 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer text-black flex items-center gap-1.5"
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
              ? '+ Catat Utang/Piutang'
              : '+ New Debt'}
          </span>
        </button>
      </div>

      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {error && (
        <div className="p-3 border-2 border-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4 animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 bg-[#FAF9F5] dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl p-4 shadow-[3px_3px_0px_0px_#000]">
        <div>
          <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">
            {lang === 'id' ? 'Piutang (Diberikan)' : 'Receivable (Owed to you)'}
          </p>
          <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400 tracking-wide">
            {maskBalance(formatRupiah(totalPiutang))}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1">
            {lang === 'id' ? 'Utang (Diterima)' : 'Debt (You owe)'}
          </p>
          <p className="text-base sm:text-lg font-black text-red-650 dark:text-red-400 tracking-wide">
            {maskBalance(formatRupiah(totalHutang))}
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mb-6 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4 rounded-xl shadow-[3px_3px_0px_0px_#000] animate-in fade-in duration-200 text-black dark:text-white"
        >
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as DebtType)}
            className="w-full brutal-input px-4 py-2 text-xs font-black uppercase bg-white dark:bg-neutral-900 cursor-pointer"
          >
            <option value="piutang">
              {lang === 'id'
                ? 'Piutang (Orang berhutang ke saya)'
                : 'Receivable (Someone owes me)'}
            </option>
            <option value="hutang">
              {lang === 'id' ? 'Hutang (Saya berhutang ke orang)' : 'Debt (I owe someone)'}
            </option>
          </select>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder={lang === 'id' ? 'Nama Orang / Pihak' : 'Person / Counterparty Name'}
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="flex-1 brutal-input px-4 py-2 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Nominal (Rp)"
              value={amount}
              onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
              className="flex-1 brutal-input px-4 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
              required
            />
          </div>
          <input
            type="text"
            placeholder={lang === 'id' ? 'Catatan (opsional)' : 'Note (optional)'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full brutal-input px-4 py-2 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder={lang === 'id' ? 'Tenor (Bulan)' : 'Tenor (Months)'}
              value={tenor}
              onChange={(e) => setTenor(e.target.value.replace(/\D/g, ''))}
              className="w-full brutal-input px-4 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
            />
            <input
              type="number"
              step="0.1"
              placeholder={lang === 'id' ? 'Bunga (%)' : 'Interest (%)'}
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
              className="w-full brutal-input px-4 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 border-2 border-black rounded-xl flex justify-center items-center shadow-[2px_2px_0px_0px_#000] cursor-pointer text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : lang === 'id' ? (
              'Simpan Catatan'
            ) : (
              'Save Record'
            )}
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-4 sm:gap-6 mb-6 border-b-2 border-black dark:border-neutral-700">
        {(['active', 'settled', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => {
              triggerHaptic('selection');
              setFilter(f);
            }}
            className={`text-xs pb-2.5 border-b-2 transition-all font-black uppercase tracking-wider mb-[-2px] cursor-pointer ${
              filter === f
                ? 'border-black dark:border-white text-black dark:text-white'
                : 'border-transparent text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
          >
            {f === 'active'
              ? lang === 'id'
                ? 'Aktif'
                : 'Active'
              : f === 'settled'
              ? lang === 'id'
                ? 'Lunas'
                : 'Settled'
              : lang === 'id'
              ? 'Semua'
              : 'All'}
          </button>
        ))}
      </div>

      {filteredDebts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-center px-4">
          <div
            className="p-2 border-2 border-black rounded-xl mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <span className="text-lg font-black text-black">🤝</span>
          </div>
          <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'id' ? 'Belum ada catatan utang/piutang' : 'No debt/receivable records yet'}
          </p>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
            {lang === 'id'
              ? 'Catat utang atau piutang agar pembayaran atau penagihan Anda tetap terjadwal.'
              : 'Track debts and receivables so your repayments and collections stay on schedule.'}
          </p>
          <button
            onClick={() => {
              setShowForm(true);
              setError(null);
            }}
            className="mt-4 px-4 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {lang === 'id' ? '+ Catat Baru' : '+ Add Record'}
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredDebts.map((d) => (
            <div
              key={d.id}
              className={`p-4 border-2 border-black dark:border-neutral-700 rounded-xl flex flex-col justify-between items-start group transition-all bg-white dark:bg-neutral-800 shadow-[2.5px_2.5px_0px_0px_#000] ${
                d.isSettled ? 'opacity-60 bg-neutral-100 dark:bg-neutral-850' : ''
              }`}
            >
              <div className="w-full flex justify-between items-start mb-2">
                <div>
                  <span
                    className={`text-sm sm:text-base font-black uppercase tracking-wider block mb-0.5 ${
                      d.isSettled
                        ? 'text-neutral-400 line-through'
                        : 'text-black dark:text-white'
                    }`}
                  >
                    {d.person}
                  </span>
                  {d.note && (
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block capitalize">
                      {d.note}
                    </span>
                  )}
                </div>
                <span
                  className={`text-base font-black tracking-wider ${
                    d.isSettled
                      ? 'text-neutral-400'
                      : d.type === 'hutang'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {maskBalance(formatRupiah(d.amount))}
                </span>
              </div>

              {d.tenorMonths && (
                <div className="w-full mt-2 pt-2 border-t-2 border-black dark:border-neutral-700">
                  <div className="flex justify-between text-[10px] font-black text-neutral-500 dark:text-neutral-400 mb-1 uppercase tracking-widest">
                    <span>
                      {lang === 'id' ? 'Tenor:' : 'Tenor:'} {d.tenorMonths}{' '}
                      {lang === 'id' ? 'bln' : 'mos'}
                    </span>
                    {d.interestRate && (
                      <span>
                        {lang === 'id' ? 'Bunga:' : 'Interest:'} {d.interestRate}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="w-full flex justify-between items-center mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                <button
                  onClick={() => handleSettle(d.id)}
                  className="px-3 py-1.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-700 text-black dark:text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                >
                  {d.isSettled
                    ? lang === 'id'
                      ? 'Batal Lunas'
                      : 'Undo Settle'
                    : lang === 'id'
                    ? 'Tandai Lunas'
                    : 'Mark as Settled'}
                </button>
                {confirmDeleteId === d.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                      {lang === 'id' ? 'Hapus?' : 'Delete?'}
                    </span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => handleDelete(d.id)}
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
                    onClick={() => setConfirmDeleteId(d.id)}
                    className="text-neutral-400 hover:text-red-500 transition-all p-1.5 cursor-pointer"
                    title={lang === 'id' ? 'Hapus catatan' : 'Delete record'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
