'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarClock, Check, Loader2, Play, Plus, Star, Trash2 } from 'lucide-react';
import type {
  Balance,
  Reminder,
  RecurringTransaction,
  TransactionTemplate,
  TransactionType,
} from '../types';
import { formatRupiah, formatRupiahInput } from '../lib/format';
import WalletSelect, { getActiveWallets } from './WalletSelect';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';
import {
  addRecurringRule,
  addReminder,
  completeReminder,
  deleteRecurringRule,
  deleteReminder,
  deleteTransactionTemplate,
  toggleRecurringRule,
  toggleTemplateFavorite,
  upsertTransactionTemplate,
  useTransactionTemplate as runTransactionTemplate,
} from '../app/actions';

type ActionResult = { success: boolean; error?: string };

function splitTags(value: string) {
  return value
    .split(/\s+/)
    .map((tag) => tag.replace(/^#/, '').trim())
    .filter(Boolean);
}

function toNumber(value: string) {
  return parseInt(value.replace(/\D/g, ''), 10) || 0;
}

function todayInputValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export default function AutomationCenter({
  templates,
  recurringTransactions,
  reminders,
  balances = [],
}: {
  templates: TransactionTemplate[];
  recurringTransactions: RecurringTransaction[];
  reminders: Reminder[];
  balances?: Balance[];
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<TransactionType>('keluar');
  const [templateAmount, setTemplateAmount] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateWallet, setTemplateWallet] = useState('');
  const [templateNote, setTemplateNote] = useState('');
  const [templateTags, setTemplateTags] = useState('');
  const [templateFavorite, setTemplateFavorite] = useState(false);

  const [recurringName, setRecurringName] = useState('');
  const [recurringType, setRecurringType] = useState<TransactionType>('keluar');
  const [recurringAmount, setRecurringAmount] = useState('');
  const [recurringCategory, setRecurringCategory] = useState('');
  const [recurringWallet, setRecurringWallet] = useState('');
  const [recurringDay, setRecurringDay] = useState(String(new Date().getDate()));
  const [recurringNote, setRecurringNote] = useState('');
  const [recurringTags, setRecurringTags] = useState('');

  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderBody, setReminderBody] = useState('');
  const [reminderDueAt, setReminderDueAt] = useState(todayInputValue());
  const [reminderChannel, setReminderChannel] = useState('in_app');

  const openReminders = useMemo(
    () => reminders.filter((reminder) => !reminder.completedAt),
    [reminders]
  );
  const completedReminders = reminders.length - openReminders.length;
  const activeWallets = useMemo(() => getActiveWallets(balances), [balances]);
  const currentTemplateWallet = activeWallets.some((wallet) => wallet.name === templateWallet)
    ? templateWallet
    : activeWallets[0]?.name || '';
  const currentRecurringWallet = activeWallets.some((wallet) => wallet.name === recurringWallet)
    ? recurringWallet
    : activeWallets[0]?.name || '';

  const runAction = async (
    key: string,
    action: () => Promise<ActionResult>,
    successText: string
  ) => {
    setBusy(key);
    setMessage(null);
    triggerHaptic('medium');
    const result = await action();
    if (result.success) {
      triggerHaptic('success');
      setMessage({ type: 'success', text: successText });
      router.refresh();
    } else {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text:
          result.error ||
          (lang === 'id' ? 'Gagal memproses aksi.' : 'Action failed. Please try again.'),
      });
    }
    setBusy(null);
  };

  const handleTemplateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!currentTemplateWallet) {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text:
          lang === 'id'
            ? 'Tambah dompet dulu sebelum membuat template.'
            : 'Add a wallet before creating a template.',
      });
      return;
    }
    runAction(
      'template:create',
      async () => {
        const result = await upsertTransactionTemplate({
          name: templateName,
          type: templateType,
          amount: toNumber(templateAmount),
          categoryName: templateCategory,
          walletName: currentTemplateWallet,
          note: templateNote,
          tags: splitTags(templateTags),
          isFavorite: templateFavorite,
        });
        if (result.success) {
          setTemplateName('');
          setTemplateAmount('');
          setTemplateCategory('');
          setTemplateNote('');
          setTemplateTags('');
          setTemplateFavorite(false);
        }
        return result;
      },
      lang === 'id' ? 'Template transaksi berhasil disimpan!' : 'Template saved successfully!'
    );
  };

  const handleRecurringSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!currentRecurringWallet) {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text:
          lang === 'id'
            ? 'Tambah dompet dulu sebelum membuat aturan transaksi berulang.'
            : 'Add a wallet before creating a recurring rule.',
      });
      return;
    }
    runAction(
      'recurring:create',
      async () => {
        const result = await addRecurringRule({
          name: recurringName,
          type: recurringType,
          amount: toNumber(recurringAmount),
          categoryName: recurringCategory,
          walletName: currentRecurringWallet,
          note: recurringNote,
          tags: splitTags(recurringTags),
          dayOfMonth: Number(recurringDay),
        });
        if (result.success) {
          setRecurringName('');
          setRecurringAmount('');
          setRecurringCategory('');
          setRecurringNote('');
          setRecurringTags('');
        }
        return result;
      },
      lang === 'id'
        ? 'Aturan transaksi berulang berhasil disimpan!'
        : 'Recurring rule saved successfully!'
    );
  };

  const handleReminderSubmit = (event: FormEvent) => {
    event.preventDefault();
    runAction(
      'reminder:create',
      async () => {
        const result = await addReminder({
          title: reminderTitle,
          body: reminderBody,
          channel: reminderChannel,
          dueAt: reminderDueAt,
        });
        if (result.success) {
          setReminderTitle('');
          setReminderBody('');
          setReminderDueAt(todayInputValue());
          setReminderChannel('in_app');
        }
        return result;
      },
      lang === 'id' ? 'Pengingat berhasil disimpan!' : 'Reminder saved successfully!'
    );
  };

  const inputClass =
    'brutal-input w-full px-3 py-2 text-xs font-bold rounded-xl border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 text-black dark:text-white placeholder-neutral-400';
  const selectClass =
    'w-full bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 px-3 py-2 text-xs font-black uppercase tracking-wider outline-none shadow-[2px_2px_0px_0px_#000] rounded-xl text-black dark:text-white cursor-pointer';

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider">
              {lang === 'id' ? 'Otomatisasi Finansial' : 'Financial Automation'}
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {lang === 'id'
                ? 'Template, transaksi berulang, dan pengingat tersimpan aman di database.'
                : 'Templates, recurring transactions, and reminders now live in the database.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-center text-[10px] font-black uppercase tracking-wider">
            <span className="border-2 border-black dark:border-neutral-700 bg-[#fef3c7] dark:bg-amber-950/70 text-black dark:text-amber-200 px-3 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000]">
              {templates.length} {lang === 'id' ? 'template' : 'templates'}
            </span>
            <span className="border-2 border-black dark:border-neutral-700 bg-[#bfdbfe] dark:bg-blue-950/70 text-black dark:text-blue-200 px-3 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000]">
              {recurringTransactions.length} {lang === 'id' ? 'berulang' : 'recurring'}
            </span>
            <span className="border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/70 text-black dark:text-emerald-200 px-3 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000]">
              {openReminders.length} {lang === 'id' ? 'aktif' : 'open'}
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 border-2 border-black dark:border-neutral-700 px-3.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-150 ${
              message.type === 'success'
                ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
                : 'bg-[#fecaca] dark:bg-red-950/80 text-black dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* 3 Pillars Grid */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* PILLAR 1: Templates */}
        <section className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <div
                className="p-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
                style={{
                  backgroundColor: 'var(--theme-accent, #FFE066)',
                  color: 'var(--theme-accent-text, #000000)',
                }}
              >
                <Star className="h-4 w-4 stroke-[2.5px]" />
              </div>
              <span>{lang === 'id' ? 'Template Transaksi' : 'Templates'}</span>
            </h3>
            <span className="text-[10px] font-bold text-neutral-400">1-Click</span>
          </div>

          <form onSubmit={handleTemplateSubmit} className="space-y-3">
            <input
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? 'Nama template (cth: Makan Siang)' : 'Template name'}
              required
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={templateType}
                onChange={(event) => setTemplateType(event.target.value as TransactionType)}
                className={selectClass}
              >
                <option value="keluar">{lang === 'id' ? 'Pengeluaran' : 'Expense'}</option>
                <option value="masuk">{lang === 'id' ? 'Pemasukan' : 'Income'}</option>
              </select>
              <input
                value={templateAmount}
                onChange={(event) => setTemplateAmount(formatRupiahInput(event.target.value))}
                className={inputClass}
                placeholder={lang === 'id' ? 'Nominal (Rp)' : 'Amount'}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <input
                value={templateCategory}
                onChange={(event) => setTemplateCategory(event.target.value)}
                className={inputClass}
                placeholder={lang === 'id' ? 'Kategori' : 'Category'}
                required
              />
              <WalletSelect
                wallets={balances}
                value={currentTemplateWallet}
                onChange={setTemplateWallet}
                className={selectClass}
                required
              />
            </div>
            <input
              value={templateNote}
              onChange={(event) => setTemplateNote(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? 'Catatan (Opsional)' : 'Note (Optional)'}
            />
            <input
              value={templateTags}
              onChange={(event) => setTemplateTags(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? '#tag (cth: #makan #harian)' : '#tags'}
            />
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black dark:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={templateFavorite}
                onChange={(event) => setTemplateFavorite(event.target.checked)}
                className="h-4 w-4 accent-black rounded cursor-pointer"
              />
              <span>{lang === 'id' ? 'Favorit (Pin ke Beranda)' : 'Favorite'}</span>
            </label>
            <button
              type="submit"
              disabled={busy === 'template:create'}
              className="flex w-full items-center justify-center gap-2 py-2.5 px-4 text-xs font-black uppercase tracking-wider border-2 border-black rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              {busy === 'template:create' ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <Plus className="h-4 w-4 stroke-[2.5px] text-black" />
              )}
              <span>{lang === 'id' ? 'Simpan Template' : 'Save Template'}</span>
            </button>
          </form>

          {/* Template List */}
          <div className="mt-5 space-y-2 flex-1">
            {templates.length === 0 ? (
              <div className="border-2 border-dashed border-black dark:border-neutral-700 rounded-xl p-4 text-center text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {lang === 'id' ? 'Belum ada template transaksi.' : 'No templates yet.'}
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 rounded-xl shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black uppercase tracking-wider text-black dark:text-white">
                        {template.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {template.categoryName} • {template.walletName} •{' '}
                        {formatRupiah(template.amount)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `template:use:${template.id}`,
                            () => runTransactionTemplate(template.id),
                            lang === 'id'
                              ? 'Transaksi dicatat dari template.'
                              : 'Transaction created from template.'
                          )
                        }
                        className="border border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 p-1.5 rounded-lg shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                        title={lang === 'id' ? 'Gunakan template' : 'Use template'}
                      >
                        <Play className="h-3.5 w-3.5 stroke-[3px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `template:star:${template.id}`,
                            () => toggleTemplateFavorite(template.id),
                            lang === 'id' ? 'Status favorit diperbarui.' : 'Favorite updated.'
                          )
                        }
                        className={`border border-black dark:border-neutral-700 p-1.5 rounded-lg shadow-[1px_1px_0px_0px_#000] cursor-pointer ${
                          template.isFavorite
                            ? 'bg-[#fef08a] dark:bg-amber-400 text-black'
                            : 'bg-white dark:bg-neutral-700 text-black dark:text-white'
                        }`}
                        title={lang === 'id' ? 'Favorit' : 'Favorite'}
                      >
                        <Star className="h-3.5 w-3.5 stroke-[3px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `template:delete:${template.id}`,
                            () => deleteTransactionTemplate(template.id),
                            lang === 'id' ? 'Template dihapus.' : 'Template deleted.'
                          )
                        }
                        className="border border-black dark:border-neutral-700 bg-white dark:bg-neutral-700 p-1.5 rounded-lg hover:bg-[#fecaca] hover:text-black dark:hover:bg-red-950 dark:hover:text-red-200 text-black dark:text-white shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                        title={lang === 'id' ? 'Hapus' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[3px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* PILLAR 2: Recurring Transactions */}
        <section className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <div
                className="p-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
                style={{
                  backgroundColor: 'var(--theme-accent, #FFE066)',
                  color: 'var(--theme-accent-text, #000000)',
                }}
              >
                <CalendarClock className="h-4 w-4 stroke-[2.5px]" />
              </div>
              <span>{lang === 'id' ? 'Transaksi Berulang' : 'Recurring Rules'}</span>
            </h3>
            <span className="text-[10px] font-bold text-neutral-400">Bulanan</span>
          </div>

          <form onSubmit={handleRecurringSubmit} className="space-y-3">
            <input
              value={recurringName}
              onChange={(event) => setRecurringName(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? 'Nama aturan (cth: Langganan Netflix)' : 'Rule name'}
              required
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={recurringType}
                onChange={(event) => setRecurringType(event.target.value as TransactionType)}
                className={selectClass}
              >
                <option value="keluar">{lang === 'id' ? 'Pengeluaran' : 'Expense'}</option>
                <option value="masuk">{lang === 'id' ? 'Pemasukan' : 'Income'}</option>
              </select>
              <input
                value={recurringAmount}
                onChange={(event) => setRecurringAmount(formatRupiahInput(event.target.value))}
                className={inputClass}
                placeholder={lang === 'id' ? 'Nominal (Rp)' : 'Amount'}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={recurringCategory}
                onChange={(event) => setRecurringCategory(event.target.value)}
                className={inputClass}
                placeholder={lang === 'id' ? 'Kategori' : 'Category'}
                required
              />
              <WalletSelect
                wallets={balances}
                value={currentRecurringWallet}
                onChange={setRecurringWallet}
                className={selectClass}
                required
              />
              <input
                value={recurringDay}
                onChange={(event) => setRecurringDay(event.target.value)}
                className={inputClass}
                placeholder={lang === 'id' ? 'Tgl (1-31)' : 'Day (1-31)'}
                required
              />
            </div>
            <input
              value={recurringNote}
              onChange={(event) => setRecurringNote(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? 'Catatan (Opsional)' : 'Note (Optional)'}
            />
            <input
              value={recurringTags}
              onChange={(event) => setRecurringTags(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? '#tag (cth: #tagihan #rutin)' : '#tags'}
            />
            <button
              type="submit"
              disabled={busy === 'recurring:create'}
              className="flex w-full items-center justify-center gap-2 py-2.5 px-4 text-xs font-black uppercase tracking-wider border-2 border-black rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              {busy === 'recurring:create' ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <Plus className="h-4 w-4 stroke-[2.5px] text-black" />
              )}
              <span>{lang === 'id' ? 'Simpan Transaksi Berulang' : 'Save Recurring Rule'}</span>
            </button>
          </form>

          {/* Recurring Rules List */}
          <div className="mt-5 space-y-2 flex-1">
            {recurringTransactions.length === 0 ? (
              <div className="border-2 border-dashed border-black dark:border-neutral-700 rounded-xl p-4 text-center text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {lang === 'id'
                  ? 'Belum ada aturan transaksi berulang.'
                  : 'No recurring rules yet.'}
              </div>
            ) : (
              recurringTransactions.map((rule) => (
                <div
                  key={rule.id}
                  className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 rounded-xl shadow-[2px_2px_0px_0px_#000]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black uppercase tracking-wider text-black dark:text-white">
                        {rule.name}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {lang === 'id' ? 'Tgl' : 'Day'} {rule.dayOfMonth} • {rule.categoryName} •{' '}
                        {formatRupiah(rule.amount)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `recurring:toggle:${rule.id}`,
                            () => toggleRecurringRule(rule.id),
                            lang === 'id'
                              ? 'Status aturan berulang diperbarui.'
                              : 'Recurring rule updated.'
                          )
                        }
                        className={`border border-black dark:border-neutral-700 px-2 py-1 text-[9px] font-black uppercase rounded-lg shadow-[1px_1px_0px_0px_#000] cursor-pointer ${
                          rule.isActive
                            ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                        }`}
                      >
                        {rule.isActive
                          ? lang === 'id'
                            ? 'Aktif'
                            : 'On'
                          : lang === 'id'
                          ? 'Mati'
                          : 'Off'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `recurring:delete:${rule.id}`,
                            () => deleteRecurringRule(rule.id),
                            lang === 'id' ? 'Aturan berulang dihapus.' : 'Recurring rule deleted.'
                          )
                        }
                        className="border border-black dark:border-neutral-700 bg-white dark:bg-neutral-700 p-1.5 rounded-lg hover:bg-[#fecaca] hover:text-black dark:hover:bg-red-950 dark:hover:text-red-200 text-black dark:text-white shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                        title={lang === 'id' ? 'Hapus' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[3px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* PILLAR 3: Reminders & Alerts */}
        <section className="brutal-card bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 p-5 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <div
                className="p-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
                style={{
                  backgroundColor: 'var(--theme-accent, #FFE066)',
                  color: 'var(--theme-accent-text, #000000)',
                }}
              >
                <Bell className="h-4 w-4 stroke-[2.5px]" />
              </div>
              <span>{lang === 'id' ? 'Pengingat & Tagihan' : 'Reminders'}</span>
            </h3>
            <span className="text-[10px] font-bold text-neutral-400">Jadwal</span>
          </div>

          <form onSubmit={handleReminderSubmit} className="space-y-3">
            <input
              value={reminderTitle}
              onChange={(event) => setReminderTitle(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? 'Judul pengingat (cth: Bayar Listrik)' : 'Reminder title'}
              required
            />
            <input
              value={reminderBody}
              onChange={(event) => setReminderBody(event.target.value)}
              className={inputClass}
              placeholder={lang === 'id' ? 'Pesan pengingat / rincian' : 'Reminder message'}
              required
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="date"
                value={reminderDueAt}
                onChange={(event) => setReminderDueAt(event.target.value)}
                className={inputClass}
                required
              />
              <select
                value={reminderChannel}
                onChange={(event) => setReminderChannel(event.target.value)}
                className={selectClass}
              >
                <option value="in_app">{lang === 'id' ? 'Dalam Aplikasi' : 'In App'}</option>
                <option value="email">{lang === 'id' ? 'Antrean Email' : 'Email Queue'}</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={busy === 'reminder:create'}
              className="flex w-full items-center justify-center gap-2 py-2.5 px-4 text-xs font-black uppercase tracking-wider border-2 border-black rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              {busy === 'reminder:create' ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <Plus className="h-4 w-4 stroke-[2.5px] text-black" />
              )}
              <span>{lang === 'id' ? 'Simpan Pengingat' : 'Save Reminder'}</span>
            </button>
          </form>

          {/* Reminders List */}
          <div className="mt-5 space-y-2 flex-1">
            {reminders.length === 0 ? (
              <div className="border-2 border-dashed border-black dark:border-neutral-700 rounded-xl p-4 text-center text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {lang === 'id' ? 'Belum ada pengingat.' : 'No reminders yet.'}
              </div>
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`border-2 border-black dark:border-neutral-700 p-3 rounded-xl shadow-[2px_2px_0px_0px_#000] ${
                    reminder.completedAt
                      ? 'bg-neutral-100 dark:bg-neutral-800/50 opacity-60'
                      : 'bg-white dark:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`truncate text-xs font-black uppercase tracking-wider ${
                          reminder.completedAt
                            ? 'line-through text-neutral-500'
                            : 'text-black dark:text-white'
                        }`}
                      >
                        {reminder.title}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {reminder.body}
                      </p>
                      {reminder.channel === 'email' && (
                        <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                          {reminder.emailSentAt
                            ? lang === 'id'
                              ? `Email terkirim ${new Date(reminder.emailSentAt).toLocaleDateString('id-ID')}`
                              : `Email sent ${new Date(reminder.emailSentAt).toLocaleDateString('en-US')}`
                            : reminder.emailLastError
                            ? lang === 'id'
                              ? `Email gagal (${reminder.emailAttemptCount}/3)`
                              : `Email failed (${reminder.emailAttemptCount}/3)`
                            : lang === 'id'
                            ? 'Email dalam antrean'
                            : 'Email queued'}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5 items-center">
                      {!reminder.completedAt && (
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              `reminder:complete:${reminder.id}`,
                              () => completeReminder(reminder.id),
                              lang === 'id' ? 'Pengingat selesai!' : 'Reminder completed!'
                            )
                          }
                          className="border border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 p-1.5 rounded-lg shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                          title={lang === 'id' ? 'Tandai selesai' : 'Complete'}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3px]" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            `reminder:delete:${reminder.id}`,
                            () => deleteReminder(reminder.id),
                            lang === 'id' ? 'Pengingat dihapus.' : 'Reminder deleted.'
                          )
                        }
                        className="border border-black dark:border-neutral-700 bg-white dark:bg-neutral-700 p-1.5 rounded-lg hover:bg-[#fecaca] hover:text-black dark:hover:bg-red-950 dark:hover:text-red-200 text-black dark:text-white shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                        title={lang === 'id' ? 'Hapus' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5 stroke-[3px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {completedReminders > 0 && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 text-center">
              {lang === 'id'
                ? `${completedReminders} pengingat selesai tersimpan di riwayat.`
                : `${completedReminders} completed reminders kept for history.`}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
