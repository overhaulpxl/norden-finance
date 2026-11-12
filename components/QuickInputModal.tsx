'use client';

import { useState, useRef, useEffect, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  Send,
  Loader2,
  Camera,
  X,
  RotateCcw,
  Sparkles,
  Mic,
  MicOff,
  ClipboardPaste,
  Calculator,
  FileText,
  Smartphone,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  processInput,
  addExplicitTransaction,
  addTransferTransaction,
  addRecurringTransaction,
  deleteTransaction,
} from '../app/actions';
import { Balance, SavingGoal } from '../types';
import WalletSelect, { getActiveWallets } from './WalletSelect';
import { formatCurrency, formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { compressReceiptImage } from '../lib/imageCompression';
import { scanReceiptOffline } from '../lib/receiptOcr';
import { triggerHaptic } from '../lib/haptics';
import { triggerUndoToast } from '../lib/undoToast';
import { getCategoryEmoji } from '../lib/categoryEmoji';
import { enqueueOfflineTransaction } from '../lib/offlineQueue';
import { parseBankNotificationText } from '../lib/smartClipboard';
import MobileNumpad from './MobileNumpad';
import SplitBillCalculator from './SplitBillCalculator';
import { useLanguage } from '../lib/i18n';

const QUICK_AMOUNT_INCREMENTS_ID = [
  { label: '+10rb', value: 10000 },
  { label: '+20rb', value: 20000 },
  { label: '+50rb', value: 50000 },
  { label: '+100rb', value: 100000 },
];

const QUICK_AMOUNT_INCREMENTS_EN = [
  { label: '+10k', value: 10000 },
  { label: '+20k', value: 20000 },
  { label: '+50k', value: 50000 },
  { label: '+100k', value: 100000 },
];

const QUICK_EXPENSE_CATEGORIES_ID = [
  'Makan',
  'Transport',
  'Belanja',
  'Tagihan',
  'Kopi',
  'Hiburan',
  'Kesehatan',
];

const QUICK_EXPENSE_CATEGORIES_EN = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Coffee',
  'Entertainment',
  'Health',
];

const QUICK_INCOME_CATEGORIES_ID = [
  'Gaji',
  'Bonus',
  'Freelance',
  'Dividen',
  'Penjualan',
  'Hadiah',
];

const QUICK_INCOME_CATEGORIES_EN = [
  'Salary',
  'Bonus',
  'Freelance',
  'Dividend',
  'Sales',
  'Gift',
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  txId?: string | null;
}

type ModalTab = 'quick' | 'manual' | 'split';

export default function QuickInputModal({
  balances,
  savingGoals = [],
  onClose,
  onSuccess,
}: {
  balances: Balance[];
  savingGoals?: SavingGoal[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { lang } = useLanguage();
  const router = useRouter();
  const emptySubscribe = () => () => {};
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [mode, setMode] = useState<ModalTab>('quick');

  // Quick/Chat mode states
  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init',
      sender: 'ai',
      text:
        lang === 'en'
          ? 'Hello! I am Norden AI Parser. Type your transaction in natural language (e.g. "dinner 15k cash" or "gopay balance 200k"). I will automatically record it to your database.'
          : 'Halo! Saya Norden AI Parser. Silakan ketik transaksi Anda seperti chat biasa (contoh: "makan soto 15k cash" atau "saldo gopay 200k"). Saya akan mencatatnya ke database Anda secara otomatis.',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      triggerHaptic('light');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'en' ? 'en-US' : 'id-ID';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        triggerHaptic('medium');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        triggerHaptic('warning');
      };

      recognition.onend = () => {
        setIsListening(false);
        triggerHaptic('light');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Manual mode states
  const [mType, setMType] = useState<'masuk' | 'keluar' | 'transfer'>('keluar');
  const [mAmount, setMAmount] = useState('');
  const [mCategory, setMCategory] = useState('');
  const [mMethod, setMMethod] = useState('');
  const [mToMethod, setMToMethod] = useState('');
  const [mNote, setMNote] = useState('');
  const [mTags, setMTags] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [isAllocateGoal, setIsAllocateGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  // Receipt Image Attachment states
  const [receiptImageThumbnail, setReceiptImageThumbnail] = useState<string | null>(null);
  const [receiptImageName, setReceiptImageName] = useState<string | null>(null);
  const [receiptCompressing, setReceiptCompressing] = useState(false);

  // Common states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [undoTxId, setUndoTxId] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeWallets = useMemo(() => getActiveWallets(balances), [balances]);
  const currentMethod = activeWallets.some((wallet) => wallet.name === mMethod)
    ? mMethod
    : activeWallets[0]?.name || '';
  const currentToMethod = activeWallets.some((wallet) => wallet.name === mToMethod) ? mToMethod : '';

  const refreshAfterMutation = () => {
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.refresh();
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (mode === 'quick') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, loading, mode]);

  // Handle Escape key and body scroll lock
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setMessage(null);
      setUndoTxId(null);
      onClose();
    }, 5000);
  };

  // Smart Clipboard Handler
  const handleSmartClipboard = async () => {
    triggerHaptic('selection');
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        setMessage({
          type: 'error',
          text: lang === 'en' ? 'Clipboard not supported in this browser.' : 'Clipboard tidak didukung pada browser ini.',
        });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setMessage({
          type: 'error',
          text: lang === 'en' ? 'Clipboard is empty. Copy SMS / WA transaction notification first.' : 'Clipboard kosong. Salin teks SMS / WA transaksi dulu.',
        });
        return;
      }

      const parsed = parseBankNotificationText(text);
      if (parsed.success && parsed.amount) {
        triggerHaptic('success');
        setMode('manual');
        setMAmount(formatRupiahInput(parsed.amount.toString()));
        setMType(parsed.type);
        if (parsed.category) setMCategory(parsed.category);
        if (parsed.merchant) setMNote(parsed.merchant);

        if (parsed.source) {
          const matched = activeWallets.find((w) =>
            w.name.toLowerCase().includes(parsed.source!.toLowerCase())
          );
          if (matched) setMMethod(matched.name);
        }

        setMessage({
          type: 'success',
          text:
            lang === 'en'
              ? `📋 Bank notification detected: ${parsed.type === 'masuk' ? 'Income' : 'Expense'} ${formatRupiah(parsed.amount)} (${parsed.merchant || parsed.category})`
              : `📋 Notifikasi Bank terdeteksi: ${parsed.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} ${formatRupiah(parsed.amount)} (${parsed.merchant || parsed.category})`,
        });
      } else {
        triggerHaptic('warning');
        setMessage({
          type: 'error',
          text:
            lang === 'en'
              ? 'Clipboard text not recognized as a bank/e-wallet notification.'
              : 'Teks di clipboard tidak terdeteksi sebagai notifikasi bank/e-wallet.',
        });
      }
    } catch {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text: lang === 'en' ? 'Failed to read clipboard. Please grant clipboard permissions.' : 'Gagal membaca clipboard. Berikan izin akses clipboard.',
      });
    }
  };

  // Chat send handler
  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsgText = text.trim();
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: userMsgText,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      triggerHaptic('success');
      enqueueOfflineTransaction({ type: 'smart', input: userMsgText });
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text:
            lang === 'en'
              ? '💾 [Offline Mode] Transaction saved locally. Will sync to server automatically when back online.'
              : '💾 [Offline Mode] Transaksi disimpan di memori HP. Otomatis disinkronkan ke server saat internet kembali.',
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await processInput(userMsgText);
      let aiText = '';
      let txId: string | null = null;

      if (res.success && 'result' in res && res.result) {
        triggerHaptic('success');
        refreshAfterMutation();
        const amountVal = res.result.amount;
        const formattedAmount = formatCurrency(amountVal);

        if (res.action === 'balance_update') {
          aiText =
            lang === 'en'
              ? `✅ ${res.walletName} balance updated to ${formattedAmount}.`
              : `✅ Saldo ${res.walletName} berhasil diperbarui menjadi ${formattedAmount}.`;
        } else if (res.result.type === 'transfer') {
          const fromWallet = res.walletName || (lang === 'en' ? 'Source wallet' : 'Dompet asal');
          const toWallet = res.transferToWalletName || res.result.transferToMethod || (lang === 'en' ? 'Destination wallet' : 'Dompet tujuan');
          aiText =
            lang === 'en'
              ? `✅ Successfully transferred ${formattedAmount} from ${fromWallet} to ${toWallet}.`
              : `✅ Berhasil transfer ${formattedAmount} dari ${fromWallet} ke ${toWallet}.`;
        } else {
          const item = res.result.note && res.result.note !== '-' ? res.result.note : (lang === 'en' ? 'Transaction' : 'Transaksi');
          const wallet = res.walletName || 'Cash';
          const category = res.result.category || (lang === 'en' ? 'Other' : 'Lain-lain');
          aiText =
            lang === 'en'
              ? `✅ Recorded ${item} for ${formattedAmount} via ${wallet} (${category}).`
              : `✅ Berhasil mencatat ${item} sebesar ${formattedAmount} via ${wallet} (${category}).`;
        }

        if ('transactionId' in res && typeof res.transactionId === 'string') {
          txId = res.transactionId;
        }
      } else {
        triggerHaptic('warning');
        aiText =
          lang === 'en'
            ? `❌ Sorry, I didn't catch that. Try typing: "coffee 20k cash" or "salary 5m bca".\n\nError details: ${res.error || 'Unrecognized format'}`
            : `❌ Maaf, saya kurang paham. Coba ketik seperti: "makan 20rb cash" atau "gaji 5jt bca".\n\nDetail error: ${res.error || 'Format tidak dikenali'}`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: aiText,
          txId,
        },
      ]);
    } catch {
      triggerHaptic('warning');
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'ai',
          text: lang === 'en' ? '❌ An error occurred while processing your input.' : '❌ Terjadi kesalahan saat memproses input Anda.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUndoChat = async (transactionId: string, messageId: string) => {
    triggerHaptic('medium');
    const res = await deleteTransaction(transactionId);
    if (res.success) {
      triggerHaptic('success');
      refreshAfterMutation();
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, text: `${m.text}\n\n↩️ [${lang === 'en' ? 'Transaction has been undone' : 'Transaksi telah dibatalkan'}]`, txId: null }
            : m
        )
      );
    } else {
      triggerHaptic('warning');
      alert(res.error || (lang === 'en' ? 'Failed to undo transaction.' : 'Gagal membatalkan transaksi.'));
    }
  };

  // Option B: Receipt Image Attachment & Thumbnail
  const handleReceiptAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptCompressing(true);
    triggerHaptic('light');

    try {
      const compressed = await compressReceiptImage(file);
      const url = URL.createObjectURL(compressed);
      setReceiptImageThumbnail(url);
      setReceiptImageName(file.name);

      // 100% Offline Client-Side Tesseract OCR
      try {
        const ocrData = await scanReceiptOffline(compressed);
        if (ocrData.amount > 0 || ocrData.suggestedText) {
          const autoText = ocrData.suggestedText || `${ocrData.amount} ${ocrData.merchant || 'Belanja'} cash`;
          setInput(autoText);

          // Also populate manual fields if user switches to manual tab
          setMAmount(formatRupiahInput(String(ocrData.amount)));
          if (ocrData.category) setMCategory(ocrData.category);
          setMNote(ocrData.merchant || 'Struk');

          triggerHaptic('success');
          setMessage({
            type: 'success',
            text:
              lang === 'en'
                ? `📷 Receipt detected: Rp ${ocrData.amount.toLocaleString()} (${ocrData.merchant}). Press Enter or Catat.`
                : `📷 Struk terdeteksi: Rp ${ocrData.amount.toLocaleString('id-ID')} (${ocrData.merchant}). Siap dicatat.`,
          });
          return;
        }
      } catch (scanErr) {
        console.warn('Tesseract offline OCR error, keeping thumbnail:', scanErr);
      }

      triggerHaptic('success');
      setMessage({
        type: 'success',
        text:
          lang === 'en'
            ? `📷 Receipt photo "${file.name}" attached. Type details in Smart Input.`
            : `📷 Foto struk "${file.name}" terlampir. Masukkan nominal & catatan di Smart Input.`,
      });
    } catch {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text: lang === 'en' ? 'Failed to compress receipt image.' : 'Gagal mengompresi gambar struk.',
      });
    } finally {
      setReceiptCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveReceiptImage = () => {
    triggerHaptic('light');
    if (receiptImageThumbnail) {
      URL.revokeObjectURL(receiptImageThumbnail);
    }
    setReceiptImageThumbnail(null);
    setReceiptImageName(null);
  };



  // Manual submit handler
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    clearCloseTimer();
    setUndoTxId(null);

    const amount = parseRupiahInput(mAmount);
    if (!amount || amount <= 0) {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text: lang === 'en' ? 'Amount must be greater than 0' : 'Nominal harus lebih dari 0',
      });
      return;
    }

    if (mType === 'transfer' && (!currentMethod || !currentToMethod)) {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text: lang === 'en' ? 'Select source and destination wallets for transfer' : 'Pilih dompet asal dan dompet tujuan transfer',
      });
      return;
    }

    if (mType === 'transfer' && currentMethod.toLowerCase() === currentToMethod.toLowerCase()) {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text: lang === 'en' ? 'Source and destination wallets cannot be the same' : 'Dompet asal dan tujuan tidak boleh sama',
      });
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    const tagsArray = mTags
      ? mTags
          .split(' ')
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    let res: { success: boolean; transactionId?: string; error?: string };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      triggerHaptic('success');
      if (mType === 'transfer') {
        enqueueOfflineTransaction({
          type: 'transfer',
          amount,
          fromWallet: currentMethod,
          toWallet: currentToMethod,
          note: mNote,
          tags: tagsArray,
        });
      } else {
        enqueueOfflineTransaction({
          type: 'explicit',
          data: {
            type: mType,
            amount,
            category: mCategory,
            method: currentMethod,
            note: mNote,
            tags: tagsArray,
          },
        });
      }
      setMAmount('');
      setMCategory('');
      setMNote('');
      setMTags('');
      setMToMethod('');
      setIsRecurring(false);
      setMessage({
        type: 'success',
        text: lang === 'en' ? '💾 Saved to local memory! Automatically syncs when back online.' : '💾 Disimpan di memori HP! Otomatis disinkronkan saat online.',
      });
      setLoading(false);
      scheduleClose();
      return;
    }

    try {
      if (mType === 'transfer') {
        res = await addTransferTransaction(
          amount,
          currentMethod,
          currentToMethod,
          mNote,
          tagsArray,
          isAllocateGoal ? selectedGoalId : undefined
        );
      } else {
        res = await addExplicitTransaction({
          type: mType,
          amount,
          category: mCategory,
          wallet: currentMethod,
          note: mNote,
          tags: tagsArray,
          transactionDate: new Date().toISOString(),
        });

        if (res.success && isRecurring) {
          await addRecurringTransaction({
            type: mType,
            amount,
            category: mCategory,
            method: currentMethod,
            note: mNote || (lang === 'en' ? `Routine: ${mCategory}` : `Rutin: ${mCategory}`),
          });
        }
      }
    } catch {
      res = { success: false, error: lang === 'en' ? 'Connection failed. Try again.' : 'Koneksi gagal. Coba lagi.' };
    }

    if (res.success) {
      triggerHaptic('success');
      refreshAfterMutation();
      setMAmount('');
      setMCategory('');
      setMNote('');
      setMTags('');
      setMToMethod('');
      setIsRecurring(false);
      setShowNumpad(false);

      if (res.transactionId) {
        const createdId = res.transactionId;
        setUndoTxId(createdId);
        triggerUndoToast({
          message: `${mType === 'masuk' ? (lang === 'en' ? 'Income' : 'Pemasukan') : mType === 'transfer' ? 'Transfer' : (lang === 'en' ? 'Expense' : 'Pengeluaran')} ${formatRupiah(amount)}`,
          onUndo: async () => {
            await deleteTransaction(createdId);
            refreshAfterMutation();
          },
        });
      }

      setMessage({
        type: 'success',
        text: lang === 'en' ? 'Transaction saved successfully!' : 'Transaksi berhasil disimpan!',
      });
      scheduleClose();
    } else {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: res.error || (lang === 'en' ? 'Failed to save' : 'Gagal menyimpan') });
    }

    setLoading(false);
  };

  const handleUndo = async () => {
    if (loading || !undoTxId) return;

    const targetId = undoTxId;
    clearCloseTimer();
    setUndoTxId(null);
    setLoading(true);

    const res = await deleteTransaction(targetId);
    if (res.success) {
      triggerHaptic('success');
      refreshAfterMutation();
      setMessage({
        type: 'success',
        text: lang === 'en' ? 'Transaction undone successfully.' : 'Transaksi berhasil dibatalkan.',
      });
    } else {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text: res.error || (lang === 'en' ? 'Failed to undo transaction.' : 'Gagal membatalkan transaksi.'),
      });
    }

    setLoading(false);
  };

  const handleQuickAmount = (increment: number) => {
    triggerHaptic('selection');
    const current = parseRupiahInput(mAmount) || 0;
    const next = current + increment;
    setMAmount(formatRupiahInput(next.toString()));
  };

  const handleClearAmount = () => {
    triggerHaptic('light');
    setMAmount('');
  };

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-2xl shadow-[4px_4px_0px_0px_#000] animate-in zoom-in-95 duration-200 text-black dark:text-white">
        {/* Header */}
        <div className="px-5 py-3.5 border-b-2 border-black dark:border-neutral-700 flex justify-between items-center bg-white dark:bg-neutral-900 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              <Sparkles className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <h2 className="font-black text-sm sm:text-base uppercase tracking-wider text-black dark:text-white">
              {lang === 'en' ? 'Record Transaction' : 'Catat Transaksi'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSmartClipboard}
              title={lang === 'en' ? 'Paste from Bank Notification / SMS' : 'Tempel dari Notifikasi Bank / SMS'}
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-50"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Paste Bank' : 'Tempel Bank'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              aria-label={lang === 'en' ? 'Close modal' : 'Tutup modal'}
              className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-black"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* 3 Tabs with Soft-Neobrutalism Navigation */}
        <div className="grid grid-cols-3 border-b-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shrink-0 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('quick');
            }}
            className={`py-2.5 px-1 border-r-2 border-black dark:border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'quick' ? 'bg-white dark:bg-neutral-900 font-black' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
            style={
              mode === 'quick'
                ? {
                    borderBottom: '2px solid var(--theme-accent, #FFE066)',
                  }
                : {}
            }
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span>{lang === 'en' ? 'Quick AI' : 'AI Cepat'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('manual');
            }}
            className={`py-2.5 px-1 border-r-2 border-black dark:border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'manual' ? 'bg-white dark:bg-neutral-900 font-black' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
            style={
              mode === 'manual'
                ? {
                    borderBottom: '2px solid var(--theme-accent, #FFE066)',
                  }
                : {}
            }
          >
            <FileText className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span>{lang === 'en' ? 'Manual Form' : 'Formulir'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('split');
            }}
            className={`py-2.5 px-1 transition-all cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'split' ? 'bg-white dark:bg-neutral-900 font-black' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
            style={
              mode === 'split'
                ? {
                    borderBottom: '2px solid var(--theme-accent, #FFE066)',
                  }
                : {}
            }
          >
            <Calculator className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span>Split Bill</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* TAB 1: Smart AI Chat Mode */}
          {mode === 'quick' && (
            <div className="space-y-3.5">
              {/* Chat-style log */}
              <div className="h-[250px] bg-[#FAF9F5] dark:bg-neutral-950 border-2 border-black dark:border-neutral-700 rounded-xl p-3 sm:p-4 overflow-y-auto flex flex-col gap-3 relative shadow-[2px_2px_0px_0px_#000]">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`self-${msg.sender === 'user' ? 'end bg-[#DCF8C6] text-black' : 'start bg-white dark:bg-neutral-800 text-black dark:text-white'} border-2 border-black dark:border-neutral-700 p-2.5 max-w-[85%] rounded-xl shadow-[2px_2px_0px_0px_#000] flex gap-2 items-start transition-all animate-in fade-in duration-200 z-10`}
                  >
                    {msg.sender === 'ai' && (
                      <Sparkles className="w-4 h-4 stroke-[2.5px] text-[#4B6DFE] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span
                        className={`text-[9px] font-black block mb-0.5 uppercase ${msg.sender === 'user' ? 'text-neutral-700' : 'text-[#4B6DFE]'}`}
                      >
                        {msg.sender === 'user' ? (lang === 'en' ? 'You' : 'Anda') : 'Norden AI'}
                      </span>
                      <p className="text-[11px] font-bold leading-snug whitespace-pre-line">
                        {msg.text}
                      </p>

                      {msg.txId && (
                        <button
                          type="button"
                          onClick={() => handleUndoChat(msg.txId!, msg.id)}
                          className="mt-2 text-[9px] font-black text-red-600 dark:text-red-400 hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 stroke-[2.5px]" /> {lang === 'en' ? 'Undo' : 'Batal / Undo'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="self-start bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 p-2.5 max-w-[85%] rounded-xl shadow-[2px_2px_0px_0px_#000] flex gap-1.5 items-center z-10 text-black dark:text-white">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {lang === 'en' ? 'Recording...' : 'Mencatat...'}
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSend(lang === 'en' ? 'starbucks coffee 55k bca' : 'kopi starbucks 55k bca')}
                  className="bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 text-[10px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] rounded-lg cursor-pointer"
                  disabled={loading}
                >
                  {lang === 'en' ? '☕ Coffee 55k BCA' : '☕ Kopi 55k BCA'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSend(lang === 'en' ? 'salary 12m bca' : 'gaji masuk 12jt bca')}
                  className="bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 text-[10px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] rounded-lg cursor-pointer"
                  disabled={loading}
                >
                  {lang === 'en' ? '💼 Salary 12m BCA' : '💼 Gaji 12jt BCA'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSend(lang === 'en' ? 'uber 22k cash' : 'gojek 22rb cash')}
                  className="bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 text-[10px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] rounded-lg cursor-pointer"
                  disabled={loading}
                >
                  {lang === 'en' ? '🚗 Ride 22k Cash' : '🚗 Gojek 22rb Cash'}
                </button>
              </div>

              {/* Receipt Thumbnail Preview */}
              {receiptImageThumbnail && (
                <div className="p-2 bg-[#FAF9F5] dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-xl flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_#000]">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={receiptImageThumbnail}
                      alt="Receipt preview"
                      className="w-9 h-9 object-cover rounded-md border border-black shadow-[1px_1px_0px_0px_#000]"
                    />
                    <span className="text-[11px] font-black truncate">
                      {receiptImageName || (lang === 'id' ? 'Struk terlampir' : 'Receipt attached')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveReceiptImage}
                    className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
                    title={lang === 'id' ? 'Hapus lampiran struk' : 'Remove receipt attachment'}
                    aria-label={lang === 'id' ? 'Hapus lampiran struk' : 'Remove receipt attachment'}
                  >
                    <X className="w-4 h-4 stroke-[2.5px]" />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex gap-2 items-center"
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleReceiptAttachment}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || receiptCompressing}
                  className="p-2.5 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center rounded-xl"
                  title={lang === 'en' ? 'Attach Receipt (Option B)' : 'Lampirkan Struk (Opsi B)'}
                >
                  {receiptCompressing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 stroke-[2.5px]" />
                  )}
                </button>

                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    disabled={loading}
                    className={`p-2.5 border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center rounded-xl ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                    }`}
                    title={
                      isListening
                        ? (lang === 'en' ? 'Recording voice... Tap to stop' : 'Sedang merekam suara... Ketuk untuk berhenti')
                        : (lang === 'en' ? 'Speak to record transaction' : 'Bicara untuk mencatat transaksi')
                    }
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4 stroke-[2.5px]" />
                    ) : (
                      <Mic className="w-4 h-4 stroke-[2.5px]" />
                    )}
                  </button>
                )}

                <div
                  className={`flex-1 flex border-2 border-black dark:border-neutral-700 rounded-xl p-1 shadow-[2px_2px_0px_0px_#000] items-center ${
                    isListening ? 'bg-red-50 dark:bg-red-950/40' : 'bg-white dark:bg-neutral-800'
                  }`}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isListening
                        ? (lang === 'en' ? 'Listening to your voice...' : 'Mendengarkan suara Anda...')
                        : (lang === 'en' ? 'e.g. lunch 15k cash...' : 'Beli makan siang 15k cash...')
                    }
                    className="flex-1 text-xs font-bold pl-2 bg-transparent focus:outline-none placeholder-neutral-400 text-black dark:text-white"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="border-2 border-black rounded-lg p-1.5 cursor-pointer shadow-[1px_1px_0px_0px_#000] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--theme-accent, #FFE066)',
                      color: 'var(--theme-accent-text, #000000)',
                    }}
                  >
                    <Send className="w-3.5 h-3.5 stroke-[2.5px]" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Manual Form Mode */}
          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setMType('keluar');
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer ${
                    mType === 'keluar'
                      ? 'bg-[#fecaca] dark:bg-red-950/80 text-black dark:text-red-200 font-black'
                      : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Expense' : 'Pengeluaran'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setMType('masuk');
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer ${
                    mType === 'masuk'
                      ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 font-black'
                      : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                  }`}
                >
                  {lang === 'en' ? 'Income' : 'Pemasukan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setMType('transfer');
                  }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer ${
                    mType === 'transfer'
                      ? 'bg-[#bfdbfe] dark:bg-blue-950/80 text-black dark:text-blue-200 font-black'
                      : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                  }`}
                >
                  Transfer
                </button>
              </div>

              {/* Nominal & Wallet Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {lang === 'en' ? 'Amount (Rp)' : 'Nominal (Rp)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNumpad(!showNumpad)}
                      className="text-[10px] font-black uppercase text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>{showNumpad ? (lang === 'en' ? 'Close Numpad' : 'Tutup Numpad') : (lang === 'en' ? 'Touch Keypad' : 'Keypad Touch')}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder={lang === 'en' ? 'e.g. 50,000' : 'Contoh: 50.000'}
                    value={mAmount}
                    onChange={(e) => setMAmount(formatRupiahInput(e.target.value))}
                    className="w-full brutal-input text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {mType === 'transfer' ? (lang === 'en' ? 'From Wallet' : 'Dari Wallet') : 'Wallet'}
                  </label>
                  <WalletSelect
                    wallets={balances}
                    value={currentMethod}
                    onChange={setMMethod}
                    className="w-full brutal-input text-xs uppercase font-bold"
                    required
                  />
                </div>
              </div>

              {/* Mobile Touch Numpad Drawer */}
              {showNumpad && (
                <div className="animate-in fade-in zoom-in-95 duration-150">
                  <MobileNumpad
                    value={mAmount}
                    onChange={setMAmount}
                    onDone={() => setShowNumpad(false)}
                  />
                </div>
              )}

              {/* Quick Nominal Increment Chips */}
              {!showNumpad && (
                <div className="flex flex-wrap items-center gap-1.5 -mt-1">
                  <span className="text-[9px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mr-0.5">
                    {lang === 'en' ? 'Add:' : 'Tambah:'}
                  </span>
                  {(lang === 'en' ? QUICK_AMOUNT_INCREMENTS_EN : QUICK_AMOUNT_INCREMENTS_ID).map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleQuickAmount(chip.value)}
                      className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white dark:bg-neutral-800 text-black dark:text-white border border-black dark:border-neutral-700 rounded-md shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                  {mAmount && (
                    <button
                      type="button"
                      onClick={handleClearAmount}
                      className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-black dark:border-red-800 rounded-md shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}

              {/* Transfer Target / Category */}
              {mType === 'transfer' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                      {lang === 'en' ? 'To Destination Wallet' : 'Ke Wallet Tujuan'}
                    </label>
                    <WalletSelect
                      wallets={balances}
                      value={currentToMethod}
                      onChange={setMToMethod}
                      className="w-full brutal-input text-xs uppercase font-bold"
                      required
                    />
                  </div>

                  {savingGoals && savingGoals.length > 0 && (
                    <div className="p-3 bg-[#fef9c3] dark:bg-yellow-950/30 border-2 border-black dark:border-neutral-700 rounded-xl space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAllocateGoal}
                          onChange={(e) => {
                            triggerHaptic('selection');
                            setIsAllocateGoal(e.target.checked);
                            if (e.target.checked && !selectedGoalId && savingGoals.length > 0) {
                              setSelectedGoalId(savingGoals[0].id);
                            }
                          }}
                          className="w-4 h-4 accent-black dark:accent-yellow-400 rounded cursor-pointer"
                        />
                        <span className="text-xs font-black uppercase text-black dark:text-white">
                          {lang === 'en' ? 'Link to Saving Goal' : 'Alokasikan ke Target Tabungan'}
                        </span>
                      </label>
                      {isAllocateGoal && (
                        <div>
                          <p className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                            {lang === 'en'
                              ? 'Transfer amount will automatically increase this goal progress:'
                              : 'Nominal transfer akan otomatis menambah progres tabungan target ini:'}
                          </p>
                          <select
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            className="w-full brutal-input text-xs font-bold bg-white dark:bg-neutral-800"
                          >
                            {savingGoals.map((g) => (
                              <option key={g.id} value={g.id}>
                                🎯 {g.title} ({formatRupiah(g.currentAmount)} / {formatRupiah(g.targetAmount)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {lang === 'en' ? 'Category' : 'Kategori'}
                    </label>
                    <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400">
                      {lang === 'en' ? 'Quick pick or type' : 'Pilih cepat atau ketik'}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'e.g. food, transport' : 'e.g. makan, transport'}
                    value={mCategory}
                    onChange={(e) => setMCategory(e.target.value)}
                    className="w-full brutal-input text-xs font-bold"
                    required
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {(mType === 'masuk'
                      ? (lang === 'en' ? QUICK_INCOME_CATEGORIES_EN : QUICK_INCOME_CATEGORIES_ID)
                      : (lang === 'en' ? QUICK_EXPENSE_CATEGORIES_EN : QUICK_EXPENSE_CATEGORIES_ID)
                    ).map((cat) => {
                      const isSelected = mCategory.toLowerCase().trim() === cat.toLowerCase();
                      const emoji = getCategoryEmoji(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            triggerHaptic('selection');
                            setMCategory(cat);
                          }}
                          className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider border border-black dark:border-neutral-700 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#FFE066] text-black font-black'
                              : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{cat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Note & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {lang === 'en' ? 'Note (Optional)' : 'Catatan (Opsional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'e.g. Office lunch' : 'e.g. Makan siang kantor'}
                    value={mNote}
                    onChange={(e) => setMNote(e.target.value)}
                    className="w-full brutal-input text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {lang === 'en' ? 'Tags (Optional)' : 'Tag (Opsional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'e.g. #food #work' : 'e.g. #makan #kerja'}
                    value={mTags}
                    onChange={(e) => setMTags(e.target.value)}
                    className="w-full brutal-input text-xs font-bold"
                  />
                </div>
              </div>

              {/* Recurring Switch */}
              {mType !== 'transfer' && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => {
                      triggerHaptic('selection');
                      setIsRecurring(e.target.checked);
                    }}
                    className="w-4 h-4 border-2 border-black rounded accent-black cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    {lang === 'en' ? 'Recurring monthly (Bill / Routine subscription)' : 'Berulang tiap bulan (Tagihan / Langganan rutin)'}
                  </span>
                </label>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full brutal-btn py-2.5 mt-4 flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]"
                style={{
                  backgroundColor: 'var(--theme-accent, #FFE066)',
                  color: 'var(--theme-accent-text, #000000)',
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <Send className="w-4 h-4 stroke-[2.5px]" />
                )}
                <span>{lang === 'en' ? 'Save Transaction' : 'Simpan Transaksi'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: Split Bill Calculator Mode */}
          {mode === 'split' && (
            <div>
              <SplitBillCalculator
                defaultAmount={parseRupiahInput(mAmount) || 0}
                onUseMyShare={(amount, note) => {
                  setMode('manual');
                  setMAmount(formatRupiahInput(amount.toString()));
                  setMNote(note);
                  setMCategory(lang === 'en' ? 'Food' : 'Makan');
                  setMessage({
                    type: 'success',
                    text:
                      lang === 'en'
                        ? `Split bill share ${formatRupiah(amount)} applied to Manual Form!`
                        : `Porsi split bill ${formatRupiah(amount)} diterapkan ke Formulir Manual!`,
                  });
                }}
              />
            </div>
          )}

          {/* Alert Message Banner */}
          {message && (
            <div
              className={`mt-4 flex items-center justify-between gap-3 text-xs font-black p-3 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000] uppercase tracking-wider animate-in fade-in duration-200 ${
                message.type === 'success'
                  ? 'bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200'
                  : 'bg-[#fecaca] dark:bg-red-950/80 text-black dark:text-red-200'
              }`}
            >
              <span className="leading-snug">{message.text}</span>
              {message.type === 'success' && undoTxId && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-black dark:border-neutral-600 bg-white dark:bg-neutral-800 px-2.5 py-1 font-black text-black dark:text-white transition-colors cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                >
                  <RotateCcw className="h-3.5 w-3.5 stroke-[2.5px]" />
                  Undo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
