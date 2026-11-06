'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppSubscription, Balance, Debt, Paylater } from '../types';
import { formatRupiah } from '../lib/format';
import { Clock, Check, Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { addExplicitTransaction, payPaylaterInstallment, toggleDebtSettled } from '../app/actions';
import { useHideBalance } from '../lib/HideBalanceContext';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

interface UpcomingBillsProps {
  subscriptions?: AppSubscription[];
  paylaters?: Paylater[];
  debts?: Debt[];
  balances?: Balance[];
}

interface BillItem {
  id: string;
  sourceType: 'subscription' | 'paylater' | 'debt';
  title: string;
  subtitle: string;
  amount: number;
  dueDateLabel: string;
  daysRemaining: number;
  method?: string;
}

export default function UpcomingBills({
  subscriptions = [],
  paylaters = [],
  debts = [],
  balances = [],
}: UpcomingBillsProps) {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const { maskBalance } = useHideBalance();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultWalletName = balances.find((b) => !b.archivedAt)?.name || 'Cash';

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const bills: BillItem[] = [];

  // 1. Subscriptions
  subscriptions
    .filter((s) => s.isActive)
    .forEach((s) => {
      let nextDate = new Date(currentYear, currentMonth, s.billingDay);
      if (currentDay > s.billingDay) {
        nextDate = new Date(currentYear, currentMonth + 1, s.billingDay);
      }
      const timeDiff = nextDate.getTime() - today.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24));

      bills.push({
        id: `sub_${s.id}`,
        sourceType: 'subscription',
        title: s.name,
        subtitle: `${lang === 'id' ? 'Langganan' : 'Subscription'} • ${s.method || (lang === 'id' ? 'Semua Dompet' : 'All Wallets')}`,
        amount: s.amount,
        daysRemaining: days,
        dueDateLabel: days === 0 
          ? (lang === 'id' ? 'Hari ini' : 'Today') 
          : days === 1 
          ? (lang === 'id' ? 'Besok' : 'Tomorrow') 
          : `${days} ${lang === 'id' ? 'hari lagi' : 'days left'}`,
        method: s.method || defaultWalletName,
      });
    });

  // 2. Paylaters
  paylaters
    .filter((p) => !p.isSettled)
    .forEach((p) => {
      let days = 30;
      if (p.dueDate) {
        const due = new Date(p.dueDate);
        const timeDiff = due.getTime() - today.getTime();
        days = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      bills.push({
        id: `pay_${p.id}`,
        sourceType: 'paylater',
        title: `${p.platform}: ${p.itemName}`,
        subtitle: lang === 'id' ? `Cicilan ke-${p.monthsPaid + 1}/${p.tenorMonths}` : `Installment ${p.monthsPaid + 1}/${p.tenorMonths}`,
        amount: p.installmentAmount,
        daysRemaining: days,
        dueDateLabel: days === 0 
          ? (lang === 'id' ? 'Hari ini' : 'Today') 
          : days === 1 
          ? (lang === 'id' ? 'Besok' : 'Tomorrow') 
          : days < 0 
          ? (lang === 'id' ? 'Jatuh tempo' : 'Overdue') 
          : `${days} ${lang === 'id' ? 'hari lagi' : 'days left'}`,
        method: defaultWalletName,
      });
    });

  // 3. Debts (Hutang aktif)
  debts
    .filter((d) => d.type === 'hutang' && !d.isSettled)
    .forEach((d) => {
      bills.push({
        id: `debt_${d.id}`,
        sourceType: 'debt',
        title: lang === 'id' ? `Hutang ke ${d.person}` : `Debt to ${d.person}`,
        subtitle: d.note ? `${lang === 'id' ? 'Catatan' : 'Note'}: ${d.note}` : (lang === 'id' ? 'Utang belum lunas' : 'Unsettled debt'),
        amount: d.amount,
        daysRemaining: 7, // General upcoming priority
        dueDateLabel: lang === 'id' ? 'Perlu dilunasi' : 'Due for payoff',
        method: defaultWalletName,
      });
    });

  // Sort upcoming bills by urgency
  bills.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const displayBills = bills.slice(0, 5);

  const handlePayBill = async (bill: BillItem) => {
    setProcessingId(bill.id);
    setErrorMsg(null);

    try {
      if (bill.sourceType === 'paylater') {
        const rawId = bill.id.replace('pay_', '');
        const res = await payPaylaterInstallment(rawId, bill.method || defaultWalletName);
        if (!res.success) throw new Error(res.error || 'Gagal membayar cicilan paylater');
      } else if (bill.sourceType === 'subscription') {
        const res = await addExplicitTransaction({
          type: 'keluar',
          amount: bill.amount,
          category: 'Tagihan',
          wallet: bill.method || defaultWalletName,
          note: `Bayar Langganan ${bill.title}`,
          transactionDate: new Date().toISOString(),
        });
        if (!res.success) throw new Error(res.error || 'Gagal mencatat pembayaran langganan');
      } else if (bill.sourceType === 'debt') {
        const rawId = bill.id.replace('debt_', '');
        const res = await toggleDebtSettled(rawId);
        if (!res.success) throw new Error(res.error || 'Gagal menyelesaikan utang');
      }

      setSuccessId(bill.id);
      triggerHaptic('success');
      router.refresh();
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err: unknown) {
      triggerHaptic('warning');
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses pembayaran');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 flex flex-col justify-between select-none shadow-[3px_3px_0px_0px_#000]">
      <div className="flex justify-between items-center mb-4 border-b-2 border-black dark:border-neutral-700 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-5 h-5 text-black dark:text-white stroke-[2.5px]" /> {t('bills_title')}
          </h3>
          <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-0.5">
            {t('bills_subtitle')}
          </p>
        </div>
        <span
          className="px-2 py-0.5 border border-black dark:border-neutral-700 rounded-md font-black text-[10px] uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#000]"
          style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
        >
          {bills.length} {t('bills_count_label')}
        </span>
      </div>

      {errorMsg && (
        <div className="mb-3 p-2.5 bg-red-100 dark:bg-red-950/50 border-2 border-black dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 font-bold text-xs uppercase flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {displayBills.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-black dark:border-neutral-700 rounded-xl p-4 bg-[#FAF9F5] dark:bg-neutral-800/40">
          <p className="text-xs font-black text-black dark:text-white uppercase tracking-wider">{t('bills_empty_title')}</p>
          <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 mt-1 uppercase tracking-wide">
            {t('bills_empty_desc')}
          </p>
        </div>
      ) : (
        <div className="divide-y-2 divide-neutral-100 space-y-2">
          {displayBills.map((bill) => {
            const isUrgent = bill.daysRemaining <= 3;
            const isSuccess = successId === bill.id;
            const isProcessing = processingId === bill.id;

            return (
              <div
                key={bill.id}
                className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2 border-2 border-black rounded-lg shrink-0 shadow-[1.5px_1.5px_0px_0px_#000] ${
                      isUrgent ? 'bg-[#fecaca] text-black animate-pulse' : 'bg-[#e0f2fe] text-black'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 stroke-[2.5px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xs uppercase tracking-wider text-black dark:text-white truncate">
                        {bill.title}
                      </h4>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 border border-black rounded ${
                          isUrgent ? 'bg-red-500 text-white' : 'bg-[#FFE066] text-black'
                        }`}
                      >
                        {bill.dueDateLabel}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-500 truncate mt-0.5">
                      {bill.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-black text-xs sm:text-sm text-black tracking-wider">
                    {maskBalance(formatRupiah(bill.amount))}
                  </span>

                  <button
                    onClick={() => handlePayBill(bill)}
                    disabled={isProcessing || isSuccess}
                    className={`px-2.5 py-1.5 border-[2px] border-black text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                      isSuccess
                        ? 'bg-[#bbf7d0] text-black'
                        : 'bg-[#FFE066] hover:bg-yellow-300 text-black'
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3px]" /> {t('bills_paid_label')}
                      </>
                    ) : (
                      t('bills_pay_btn')
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
