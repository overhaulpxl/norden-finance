'use client';

import { useState } from 'react';
import { AppSubscription, Balance } from '../types';
import {
  addSubscription,
  toggleSubscriptionActive,
  deleteSubscription,
  recordFamilySharingPayment,
} from '../app/actions';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { Trash2, Calendar, CheckSquare, Square, Plus, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import WalletSelect from './WalletSelect';
import { useHideBalance } from '../lib/HideBalanceContext';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

interface SubscriptionManagerProps {
  subscriptions: AppSubscription[];
  balances?: Balance[];
  isPro?: boolean;
}

export default function SubscriptionManager({
  subscriptions,
  balances = [],
}: SubscriptionManagerProps) {
  const { maskBalance } = useHideBalance();
  const { lang, t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [method, setMethod] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Family Sharing / Patungan Host States
  const [showSharingHelper, setShowSharingHelper] = useState(false);
  const [selectedSubForSharing, setSelectedSubForSharing] = useState<string>('');
  const [memberCount, setMemberCount] = useState<number>(5);
  const [customSubCost, setCustomSubCost] = useState<string>('');
  const [customChargePerMember, setCustomChargePerMember] = useState<string>('');
  const [reimbursePayer, setReimbursePayer] = useState<string>('');
  const [reimburseAmount, setReimburseAmount] = useState<string>('');
  const [reimburseWallet, setReimburseWallet] = useState<string>('');
  const [reimburseSubmitting, setReimburseSubmitting] = useState(false);
  const [sharingSuccess, setSharingSuccess] = useState<string | null>(null);

  const activeSubscriptions = subscriptions.filter((s) => s.isActive);
  const totalCost = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  const currentSharingSub = subscriptions.find(
    (s) => s.id === selectedSubForSharing || s.name.toLowerCase() === selectedSubForSharing.toLowerCase()
  );
  const effectiveTotalCost = parseRupiahInput(customSubCost) || currentSharingSub?.amount || 0;
  const fairSharePerPerson = memberCount > 0 ? Math.round(effectiveTotalCost / memberCount) : 0;
  const chargeAmountPerPerson = parseRupiahInput(customChargePerMember) || fairSharePerPerson;
  const hostNetCost = Math.max(0, effectiveTotalCost - chargeAmountPerPerson * Math.max(0, memberCount - 1));
  const monthlyHostSurplus = Math.max(
    0,
    chargeAmountPerPerson * Math.max(0, memberCount - 1) - fairSharePerPerson * Math.max(0, memberCount - 1)
  );

  function getBillingStatus(day: number) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let targetDate = new Date(currentYear, currentMonth, day);
    if (currentDay > day) {
      targetDate = new Date(currentYear, currentMonth + 1, day);
    }

    const timeDiff = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (diffDays === 0) return lang === 'en' ? 'Today' : 'Hari ini';
    if (diffDays === 1) return lang === 'en' ? 'Tomorrow' : 'Besok';
    return lang === 'en'
      ? `In ${diffDays} days (${targetDate.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
        })})`
      : `Dalam ${diffDays} hari (${targetDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        })})`;
  }

  async function handleAddSubscription(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    triggerHaptic('medium');

    const amtNum = parseRupiahInput(amount);
    const dayNum = parseInt(billingDay.replace(/\D/g, ''), 10);

    if (!name.trim() || !amtNum || !dayNum || !method.trim()) {
      triggerHaptic('warning');
      setError(
        lang === 'en'
          ? 'Please fill all fields correctly'
          : 'Harap isi semua kolom dengan benar'
      );
      return;
    }

    if (dayNum < 1 || dayNum > 31) {
      triggerHaptic('warning');
      setError(
        lang === 'en'
          ? 'Billing day must be between 1 and 31'
          : 'Tanggal tagihan harus antara 1 dan 31'
      );
      return;
    }

    const res = await addSubscription({
      name: name.trim(),
      amount: amtNum,
      billingDay: dayNum,
      method,
    });
    if (res.success) {
      triggerHaptic('success');
      setName('');
      setAmount('');
      setBillingDay('');
      setMethod('');
      setShowForm(false);
      setSuccess(
        lang === 'en'
          ? 'Subscription added successfully!'
          : 'Langganan berhasil ditambahkan!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error ||
          (lang === 'en' ? 'Failed to save subscription' : 'Gagal menyimpan langganan')
      );
    }
  }

  async function handleToggle(id: string) {
    setSuccess(null);
    triggerHaptic('light');
    await toggleSubscriptionActive(id);
    setSuccess(
      lang === 'en'
        ? 'Subscription status updated!'
        : 'Status langganan berhasil diperbarui!'
    );
    setTimeout(() => setSuccess(null), 5000);
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await deleteSubscription(id);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (res.success) {
      triggerHaptic('medium');
      setSuccess(
        lang === 'en'
          ? 'Subscription deleted successfully!'
          : 'Langganan berhasil dihapus!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error ||
          (lang === 'en' ? 'Failed to delete subscription' : 'Gagal menghapus langganan')
      );
    }
  }

  async function handleRecordSharingPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSharingSuccess(null);
    if (!reimbursePayer.trim() || !reimburseAmount || !reimburseWallet.trim()) {
      triggerHaptic('warning');
      setError(lang === 'en' ? 'Fill all sharing payment fields' : 'Isi nama teman, nominal, dan dompet tujuan');
      return;
    }
    const amtNum = parseRupiahInput(reimburseAmount);
    if (!amtNum || amtNum <= 0) {
      triggerHaptic('warning');
      setError(lang === 'en' ? 'Invalid payment amount' : 'Nominal setoran tidak valid');
      return;
    }

    setReimburseSubmitting(true);
    triggerHaptic('medium');
    const subName = currentSharingSub?.name || selectedSubForSharing || 'Family Plan';
    const res = await recordFamilySharingPayment({
      subscriptionName: subName,
      payerName: reimbursePayer.trim(),
      amountPaid: amtNum,
      expectedShare: fairSharePerPerson,
      destinationWallet: reimburseWallet,
    });
    setReimburseSubmitting(false);

    if (res.success) {
      triggerHaptic('success');
      const surplusMsg =
        res.surplus && res.surplus > 0
          ? ` (Surplus +${formatRupiah(res.surplus)} masuk kas jajan!)`
          : '';
      setSharingSuccess(
        lang === 'en'
          ? `Recorded payment from ${reimbursePayer} successfully!${surplusMsg}`
          : `Setoran patungan dari ${reimbursePayer} berhasil dicatat!${surplusMsg}`
      );
      setReimbursePayer('');
      setReimburseAmount('');
      setTimeout(() => setSharingSuccess(null), 6000);
    } else {
      triggerHaptic('warning');
      setError(
        res.error || (lang === 'en' ? 'Failed to record sharing payment' : 'Gagal mencatat setoran patungan')
      );
    }
  }

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="flex justify-between items-center mb-6 border-b-2 border-black dark:border-neutral-700 pb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-2">
          <span>📅</span>
          <span>{lang === 'en' ? 'Subscriptions' : 'Layanan Langganan'}</span>
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setShowSharingHelper(!showSharingHelper);
              if (!selectedSubForSharing && subscriptions.length > 0) {
                setSelectedSubForSharing(subscriptions[0].id);
              }
            }}
            className={`px-3 py-2 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 ${
              showSharingHelper
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span>{lang === 'en' ? 'Family Share' : 'Patungan Host'}</span>
          </button>

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
                <span>{lang === 'en' ? 'Add' : 'Tambah'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] mb-4 animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {/* Summary Box */}
      <div className="p-4 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl mb-6 shadow-[3px_3px_0px_0px_#000]">
        <p className="text-xs font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
          {lang === 'en' ? 'Total Monthly Cost' : 'Total Biaya Bulanan'}
        </p>
        <p className="text-2xl font-black mt-1 tracking-wider">
          {maskBalance(formatRupiah(totalCost))}
        </p>
      </div>

      {/* Family Sharing & Patungan Host Box */}
      {showSharingHelper && (
        <div className="mb-6 p-4 sm:p-5 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 rounded-xl shadow-[3px_3px_0px_0px_#000] space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black dark:border-neutral-700 pb-3">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 stroke-[2.5px] text-[#FFE066]" />
                <span>{lang === 'en' ? 'Family Sharing & Host Surplus' : 'Kalkulator Patungan & Kas Jajan Host'}</span>
              </h4>
              <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                {lang === 'en'
                  ? 'Calculate member split & record friend payments. Excess amount automatically goes to host spending wallet!'
                  : 'Hitung porsi adil & catat setoran teman. Kelebihan bayar otomatis masuk kas jajan host!'}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#FFE066] text-black border border-black rounded-lg text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
              Spotify / Netflix Family
            </span>
          </div>

          {sharingSuccess && (
            <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-800 dark:text-emerald-300" />
              <span>{sharingSuccess}</span>
            </div>
          )}

          {/* Calculator Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'en' ? 'Subscription' : 'Pilih Layanan Langganan'}
              </label>
              {subscriptions.length > 0 ? (
                <select
                  value={selectedSubForSharing}
                  onChange={(e) => {
                    setSelectedSubForSharing(e.target.value);
                    const found = subscriptions.find((s) => s.id === e.target.value);
                    if (found) setCustomSubCost(String(found.amount));
                  }}
                  className="w-full brutal-input p-2 text-xs font-bold bg-white dark:bg-neutral-900"
                >
                  {subscriptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatRupiah(s.amount)}/bln)
                    </option>
                  ))}
                  <option value="custom">{lang === 'en' ? '+ Custom Plan' : '+ Paket Lainnya'}</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Spotify Family"
                  value={selectedSubForSharing}
                  onChange={(e) => setSelectedSubForSharing(e.target.value)}
                  className="w-full brutal-input p-2 text-xs font-bold bg-white dark:bg-neutral-900"
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'en' ? 'Total Monthly Bill' : 'Total Tagihan Bulanan (Rp)'}
              </label>
              <input
                type="text"
                placeholder="e.g. 186.000"
                value={customSubCost ? formatRupiahInput(customSubCost) : currentSharingSub ? formatRupiah(currentSharingSub.amount) : ''}
                onChange={(e) => setCustomSubCost(e.target.value.replace(/\D/g, ''))}
                className="w-full brutal-input p-2 text-xs font-bold bg-white dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                {lang === 'en' ? 'Total Members (inc. Host)' : 'Total Anggota (Termasuk Host)'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={memberCount}
                  onChange={(e) => setMemberCount(Math.max(2, parseInt(e.target.value || '2', 10)))}
                  className="w-full brutal-input p-2 text-xs font-bold bg-white dark:bg-neutral-900"
                />
                <span className="text-xs font-bold text-neutral-500 shrink-0">orang</span>
              </div>
            </div>
          </div>

          {/* Benefit Card */}
          <div className="p-3 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Porsi Adil / Orang</p>
              <p className="text-xs sm:text-sm font-black mt-0.5">{formatRupiah(fairSharePerPerson)}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Ditagih ke Teman</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <input
                  type="text"
                  placeholder={formatRupiah(fairSharePerPerson)}
                  value={customChargePerMember ? formatRupiahInput(customChargePerMember) : ''}
                  onChange={(e) => setCustomChargePerMember(e.target.value.replace(/\D/g, ''))}
                  className="w-24 text-center border-b border-black dark:border-white font-black text-xs bg-transparent focus:outline-none"
                />
              </div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Beban Bersih Host</p>
              <p className="text-xs sm:text-sm font-black mt-0.5 text-blue-600 dark:text-blue-400">
                {formatRupiah(hostNetCost)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Cuan / Jajan Host</p>
              <p className={`text-xs sm:text-sm font-black mt-0.5 ${monthlyHostSurplus > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'}`}>
                {monthlyHostSurplus > 0 ? `+${formatRupiah(monthlyHostSurplus)}` : 'Rp 0'}
              </p>
            </div>
          </div>

          {/* Quick Record Reimbursement Form */}
          <form onSubmit={handleRecordSharingPayment} className="pt-2 border-t-2 border-black dark:border-neutral-700 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 stroke-[2.5px]" />
              <h5 className="text-xs font-black uppercase tracking-wider">
                {lang === 'en' ? 'Quick Record: Friend Payment Arrived' : 'Catat 1-Klik: Setoran Teman Masuk'}
              </h5>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  {lang === 'en' ? "Friend's Name" : 'Nama Teman'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Budi, Sarah"
                  value={reimbursePayer}
                  onChange={(e) => setReimbursePayer(e.target.value)}
                  className="w-full brutal-input p-2 text-xs font-bold bg-white dark:bg-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  {lang === 'en' ? 'Amount Received' : 'Nominal Diterima'}
                </label>
                <input
                  type="text"
                  placeholder={formatRupiah(chargeAmountPerPerson || 40000)}
                  value={reimburseAmount ? formatRupiahInput(reimburseAmount) : ''}
                  onChange={(e) => setReimburseAmount(e.target.value.replace(/\D/g, ''))}
                  className="w-full brutal-input p-2 text-xs font-bold bg-white dark:bg-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  {lang === 'en' ? 'Destination Pocket/Wallet' : 'Masuk Dompet / Rekening Jajan'}
                </label>
                <WalletSelect
                  wallets={balances}
                  value={reimburseWallet}
                  onChange={setReimburseWallet}
                  className="w-full brutal-input p-2 text-xs font-bold bg-white dark:bg-neutral-900"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={reimburseSubmitting}
              className="w-full py-2.5 bg-[#bbf7d0] dark:bg-emerald-800 text-black dark:text-white border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5px]" />
              <span>
                {reimburseSubmitting
                  ? (lang === 'en' ? 'Recording...' : 'Mencatat...')
                  : (lang === 'en' ? 'Record Payment & Credit Wallet' : 'Catat Setoran & Tambah Saldo Jajan')}
              </span>
            </button>
          </form>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAddSubscription}
          className="mb-6 p-4 sm:p-5 border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 space-y-4 rounded-xl shadow-[3px_3px_0px_0px_#000] animate-in fade-in duration-200"
        >
          {error && (
            <p className="text-xs font-black text-red-650 dark:text-red-400 uppercase tracking-wider">
              ❌ {error}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1 tracking-widest text-neutral-600 dark:text-neutral-400">
                {lang === 'en' ? 'Service Name' : 'Nama Layanan'}
              </label>
              <input
                type="text"
                placeholder="e.g. Netflix, Spotify"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full brutal-input p-2.5 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 tracking-widest text-neutral-600 dark:text-neutral-400">
                {lang === 'en' ? 'Monthly Cost (Rp)' : 'Nominal per Bulan (Rp)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder={lang === 'en' ? 'E.g.: 186.000' : 'Contoh: 186.000'}
                value={amount}
                onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
                className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 tracking-widest text-neutral-600 dark:text-neutral-400">
                {lang === 'en' ? 'Billing Day (1-31)' : 'Tanggal Tagihan (1-31)'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder={lang === 'en' ? 'E.g.: 15' : 'Contoh: 15'}
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value.replace(/\D/g, ''))}
                className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1 tracking-widest text-neutral-600 dark:text-neutral-400">
                {lang === 'en' ? 'Payment Wallet' : 'Dompet Pembayaran'}
              </label>
              <WalletSelect
                wallets={balances}
                value={method}
                onChange={setMethod}
                className="w-full brutal-input p-2.5 text-xs font-black uppercase bg-white dark:bg-neutral-900"
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
            {lang === 'en' ? 'Save Subscription' : 'Simpan Langganan'}
          </button>
        </form>
      )}

      {subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-center px-4">
          <div
            className="p-2 border-2 border-black rounded-xl mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <span className="text-lg font-black text-black">📅</span>
          </div>
          <p className="text-sm font-black uppercase tracking-wider">
            {lang === 'en' ? 'No active subscriptions' : 'Belum ada layanan langganan'}
          </p>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
            {lang === 'en'
              ? 'Track recurring subscriptions (Netflix, Spotify, Cloud, etc.) here.'
              : 'Catat layanan langganan rutin bulanan Anda (Netflix, Spotify, Cloud, dll) di sini.'}
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
            + {lang === 'en' ? 'Add New Subscription' : 'Tambah Langganan Baru'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((s) => (
            <div
              key={s.id}
              className={`p-4 border-2 border-black dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 flex justify-between items-center transition-all shadow-[2.5px_2.5px_0px_0px_#000] ${
                !s.isActive
                  ? 'opacity-50 bg-neutral-50 dark:bg-neutral-850 shadow-none border-neutral-300 dark:border-neutral-700'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggle(s.id)}
                  className="text-black dark:text-white hover:scale-105 transition-transform cursor-pointer shrink-0"
                >
                  {s.isActive ? (
                    <CheckSquare className="w-5 h-5 stroke-[2.5px]" />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-400 stroke-[2.5px]" />
                  )}
                </button>
                <div className="min-w-0">
                  <h4 className="text-sm font-black uppercase tracking-wider truncate">{s.name}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold mt-0.5 uppercase tracking-wider truncate">
                    {maskBalance(formatRupiah(s.amount))} / {lang === 'en' ? 'mo' : 'bulan'} •{' '}
                    {s.method.toUpperCase()}
                  </p>
                  {s.isActive && (
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 stroke-[2.5px]" />{' '}
                      {lang === 'en' ? 'Billing:' : 'Tagihan:'} {getBillingStatus(s.billingDay)}
                    </p>
                  )}
                </div>
              </div>

              {confirmDeleteId === s.id ? (
                <div className="flex items-center gap-1.5 ml-4 shrink-0">
                  <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                    {lang === 'en' ? 'Delete?' : 'Hapus?'}
                  </span>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => handleDelete(s.id)}
                    className="px-2 py-0.5 bg-red-600 text-white border border-black rounded text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] hover:bg-red-700 cursor-pointer"
                  >
                    {lang === 'en' ? 'Yes' : 'Ya'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white border border-black text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] hover:bg-neutral-300 rounded cursor-pointer"
                  >
                    {lang === 'en' ? 'Cancel' : 'Batal'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(s.id)}
                  className="text-neutral-400 hover:text-red-500 transition-colors ml-4 cursor-pointer p-1 shrink-0"
                  title={lang === 'en' ? 'Delete subscription' : 'Hapus langganan'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
