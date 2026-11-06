'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
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
  Plus,
  Trash2,
  FileText,
  Smartphone,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  processInput,
  addExplicitTransaction,
  addTransferTransaction,
  addRecurringTransaction,
  deleteTransaction,
} from '../app/actions';
import { Balance } from '../types';
import WalletSelect, { getActiveWallets } from './WalletSelect';
import { formatCurrency, formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { compressReceiptImage } from '../lib/imageCompression';
import { triggerHaptic } from '../lib/haptics';
import { triggerUndoToast } from '../lib/undoToast';
import { getCategoryEmoji } from '../lib/categoryEmoji';
import { enqueueOfflineTransaction } from '../lib/offlineQueue';
import { parseBankNotificationText } from '../lib/smartClipboard';
import MobileNumpad from './MobileNumpad';
import SplitBillCalculator from './SplitBillCalculator';

const QUICK_AMOUNT_INCREMENTS = [
  { label: '+10rb', value: 10000 },
  { label: '+20rb', value: 20000 },
  { label: '+50rb', value: 50000 },
  { label: '+100rb', value: 100000 },
];

const QUICK_EXPENSE_CATEGORIES = [
  'Makan',
  'Transport',
  'Belanja',
  'Tagihan',
  'Kopi',
  'Hiburan',
  'Kesehatan',
];

const QUICK_INCOME_CATEGORIES = [
  'Gaji',
  'Bonus',
  'Freelance',
  'Dividen',
  'Penjualan',
  'Hadiah',
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  txId?: string | null;
}

interface ReceiptRowItem {
  id: string;
  name: string;
  qty: string;
  price: string;
}

type ModalTab = 'quick' | 'manual' | 'receipt' | 'split';

export default function QuickInputModal({
  balances,
  onClose,
  onSuccess,
}: {
  balances: Balance[];
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ModalTab>('quick');

  // Quick/Chat mode states
  const [input, setInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'ai',
      text: 'Halo! Saya Norden AI Parser. Silakan ketik transaksi Anda seperti chat biasa (contoh: "makan soto 15k cash" atau "saldo gopay 200k"). Saya akan mencatatnya ke database Anda secara otomatis.',
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
      recognition.lang = 'id-ID';
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

  // Option B: Receipt Attachment & 3-Column Quick Entry Sheet
  const [receiptImageThumbnail, setReceiptImageThumbnail] = useState<string | null>(null);
  const [receiptImageName, setReceiptImageName] = useState<string | null>(null);
  const [receiptMerchant, setReceiptMerchant] = useState('');
  const [receiptWallet, setReceiptWallet] = useState('');
  const [receiptCategory, setReceiptCategory] = useState('Belanja');
  const [receiptCompressing, setReceiptCompressing] = useState(false);
  const [receiptRows, setReceiptRows] = useState<ReceiptRowItem[]>([
    { id: '1', name: '', qty: '1', price: '' },
    { id: '2', name: '', qty: '1', price: '' },
  ]);

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
        setMessage({ type: 'error', text: 'Clipboard tidak didukung pada browser ini.' });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setMessage({ type: 'error', text: 'Clipboard kosong. Salin teks SMS / WA transaksi dulu.' });
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
          text: `📋 Notifikasi Bank terdeteksi: ${parsed.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'} ${formatRupiah(parsed.amount)} (${parsed.merchant || parsed.category})`,
        });
      } else {
        triggerHaptic('warning');
        setMessage({
          type: 'error',
          text: 'Teks di clipboard tidak terdeteksi sebagai notifikasi bank/e-wallet.',
        });
      }
    } catch {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: 'Gagal membaca clipboard. Berikan izin akses clipboard.' });
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
          text: '💾 [Offline Mode] Transaksi disimpan di memori HP. Otomatis disinkronkan ke server saat internet kembali.',
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
          aiText = `✅ Saldo ${res.walletName} berhasil diperbarui menjadi ${formattedAmount}.`;
        } else {
          const item = res.result.note && res.result.note !== '-' ? res.result.note : 'Transaksi';
          const wallet = res.walletName || 'Cash';
          const category = res.result.category || 'Lain-lain';
          aiText = `✅ Berhasil mencatat ${item} sebesar ${formattedAmount} via ${wallet} (${category}).`;
        }

        if ('transactionId' in res && typeof res.transactionId === 'string') {
          txId = res.transactionId;
        }
      } else {
        triggerHaptic('warning');
        aiText = `❌ Maaf, saya kurang paham. Coba ketik seperti: "makan 20rb cash" atau "gaji 5jt bca".\n\nDetail error: ${res.error || 'Format tidak dikenali'}`;
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
          text: '❌ Terjadi kesalahan saat memproses input Anda.',
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
            ? { ...m, text: `${m.text}\n\n↩️ [Transaksi telah dibatalkan]`, txId: null }
            : m
        )
      );
    } else {
      triggerHaptic('warning');
      alert(res.error || 'Gagal membatalkan transaksi.');
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
      setMode('receipt');
      triggerHaptic('success');
      setMessage({
        type: 'success',
        text: `📷 Foto struk "${file.name}" terlampir. Isi rincian cepat di bawah.`,
      });
    } catch {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: 'Gagal mengompresi gambar struk.' });
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

  // Option B: 3-Column Sheet Row Operations
  const handleAddReceiptRow = () => {
    triggerHaptic('light');
    setReceiptRows((prev) => [
      ...prev,
      { id: Math.random().toString(), name: '', qty: '1', price: '' },
    ]);
  };

  const handleRemoveReceiptRow = (id: string) => {
    triggerHaptic('light');
    setReceiptRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const handleUpdateReceiptRow = (id: string, field: 'name' | 'qty' | 'price', value: string) => {
    setReceiptRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === 'price') {
          return { ...row, price: formatRupiahInput(value) };
        }
        return { ...row, [field]: value };
      })
    );
  };

  // Total Subtotal of Option B Sheet
  const receiptSubtotal = useMemo(() => {
    return receiptRows.reduce((sum, row) => sum + (parseRupiahInput(row.price) || 0), 0);
  }, [receiptRows]);

  // Option B: Save Directly
  const handleSaveReceiptSheet = async () => {
    if (receiptSubtotal <= 0) {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: 'Isi harga minimal satu item pada struk.' });
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    const wallet = receiptWallet || currentMethod || 'Cash';
    const validRows = receiptRows.filter(
      (r) => r.name.trim() || (parseRupiahInput(r.price) || 0) > 0
    );

    try {
      const res = await addExplicitTransaction({
        type: 'keluar',
        amount: receiptSubtotal,
        category: receiptCategory || 'Belanja',
        wallet,
        note: receiptMerchant.trim() ? `Struk: ${receiptMerchant.trim()}` : 'Struk Belanja (Opsi B)',
        tags: ['receipt', 'option-b'],
        receiptMerchant: receiptMerchant.trim() || undefined,
        receiptItems: validRows,
        receiptDate: new Date().toISOString(),
      });

      if (res.success) {
        triggerHaptic('success');
        refreshAfterMutation();
        if (res.transactionId) {
          const createdId = res.transactionId;
          setUndoTxId(createdId);
          triggerUndoToast({
            message: `Struk ${formatRupiah(receiptSubtotal)} dicatat`,
            onUndo: async () => {
              await deleteTransaction(createdId);
              refreshAfterMutation();
            },
          });
        }
        setMessage({
          type: 'success',
          text: `✅ Struk ${receiptMerchant || 'Belanja'} (${formatRupiah(receiptSubtotal)}) berhasil disimpan!`,
        });
        setReceiptRows([
          { id: '1', name: '', qty: '1', price: '' },
          { id: '2', name: '', qty: '1', price: '' },
        ]);
        setReceiptMerchant('');
        handleRemoveReceiptImage();
        scheduleClose();
      } else {
        triggerHaptic('warning');
        setMessage({ type: 'error', text: res.error || 'Gagal menyimpan transaksi struk.' });
      }
    } catch {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem saat menyimpan.' });
    } finally {
      setLoading(false);
    }
  };

  // Transfer Receipt Total to Manual Form
  const handleTransferReceiptToManual = () => {
    triggerHaptic('selection');
    setMAmount(formatRupiahInput(receiptSubtotal.toString()));
    setMNote(receiptMerchant ? `Struk: ${receiptMerchant}` : 'Struk Belanja');
    setMCategory(receiptCategory || 'Belanja');
    setMode('manual');
    setMessage({
      type: 'success',
      text: `Total struk ${formatRupiah(receiptSubtotal)} dipindahkan ke Formulir Manual.`,
    });
  };

  // Manual submit handler
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearCloseTimer();
    setUndoTxId(null);

    const amount = parseRupiahInput(mAmount);
    if (!amount || amount <= 0) {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: 'Nominal harus lebih dari 0' });
      return;
    }

    if (mType === 'transfer' && (!currentMethod || !currentToMethod)) {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: 'Pilih dompet asal dan dompet tujuan transfer' });
      return;
    }

    if (mType === 'transfer' && currentMethod.toLowerCase() === currentToMethod.toLowerCase()) {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: 'Dompet asal dan tujuan tidak boleh sama' });
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
            receiptItems: receiptRows.length > 0 ? receiptRows : undefined,
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
        text: '💾 Disimpan di memori HP! Otomatis disinkronkan saat online.',
      });
      setLoading(false);
      scheduleClose();
      return;
    }

    try {
      if (mType === 'transfer') {
        res = await addTransferTransaction(amount, currentMethod, currentToMethod, mNote, tagsArray);
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
            note: mNote || `Rutin: ${mCategory}`,
          });
        }
      }
    } catch {
      res = { success: false, error: 'Koneksi gagal. Coba lagi.' };
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
          message: `${mType === 'masuk' ? 'Pemasukan' : mType === 'transfer' ? 'Transfer' : 'Pengeluaran'} ${formatRupiah(amount)}`,
          onUndo: async () => {
            await deleteTransaction(createdId);
            refreshAfterMutation();
          },
        });
      }

      setMessage({ type: 'success', text: 'Transaksi berhasil disimpan!' });
      scheduleClose();
    } else {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: res.error || 'Gagal menyimpan' });
    }

    setLoading(false);
  };

  const handleUndo = async () => {
    if (!undoTxId) return;

    const targetId = undoTxId;
    clearCloseTimer();
    setUndoTxId(null);
    setLoading(true);

    const res = await deleteTransaction(targetId);
    if (res.success) {
      triggerHaptic('success');
      refreshAfterMutation();
      setMessage({ type: 'success', text: 'Transaksi berhasil dibatalkan.' });
    } else {
      triggerHaptic('warning');
      setMessage({ type: 'error', text: res.error || 'Gagal membatalkan transaksi.' });
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
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
              Catat Transaksi
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSmartClipboard}
              title="Tempel dari Notifikasi Bank / SMS"
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-50"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tempel Bank</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              aria-label="Tutup modal"
              className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-black"
            >
              <X className="w-5 h-5 stroke-[2.5px]" />
            </button>
          </div>
        </div>

        {/* 4 Tabs with Soft-Neobrutalism Navigation */}
        <div className="grid grid-cols-4 border-b-2 border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 shrink-0 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider">
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
            <span>AI Cepat</span>
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
            <span>Formulir</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setMode('receipt');
            }}
            className={`py-2.5 px-1 border-r-2 border-black dark:border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'receipt' ? 'bg-white dark:bg-neutral-900 font-black' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-700'
            }`}
            style={
              mode === 'receipt'
                ? {
                    borderBottom: '2px solid var(--theme-accent, #FFE066)',
                  }
                : {}
            }
          >
            <Camera className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span>Struk (B)</span>
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
                        {msg.sender === 'user' ? 'Anda' : 'Norden AI'}
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
                          <RotateCcw className="w-3 h-3 stroke-[2.5px]" /> Batal / Undo
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="self-start bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 p-2.5 max-w-[85%] rounded-xl shadow-[2px_2px_0px_0px_#000] flex gap-1.5 items-center z-10 text-black dark:text-white">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      Mencatat...
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSend('kopi starbucks 55k bca')}
                  className="bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 text-[10px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] rounded-lg cursor-pointer"
                  disabled={loading}
                >
                  ☕ Kopi 55k BCA
                </button>
                <button
                  type="button"
                  onClick={() => handleSend('gaji masuk 12jt bca')}
                  className="bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 text-[10px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] rounded-lg cursor-pointer"
                  disabled={loading}
                >
                  💼 Gaji 12jt BCA
                </button>
                <button
                  type="button"
                  onClick={() => handleSend('gojek 22rb cash')}
                  className="bg-white dark:bg-neutral-800 border border-black dark:border-neutral-700 text-[10px] font-black px-2 py-1 shadow-[1.5px_1.5px_0px_0px_#000] rounded-lg cursor-pointer"
                  disabled={loading}
                >
                  🚗 Gojek 22rb Cash
                </button>
              </div>

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
                  title="Lampirkan Struk (Opsi B)"
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
                        ? 'Sedang merekam suara... Ketuk untuk berhenti'
                        : 'Bicara untuk mencatat transaksi'
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
                      isListening ? 'Mendengarkan suara Anda...' : 'Beli makan siang 15k cash...'
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
                  Pengeluaran
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
                  Pemasukan
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
                      Nominal (Rp)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNumpad(!showNumpad)}
                      className="text-[10px] font-black uppercase text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>{showNumpad ? 'Tutup Numpad' : 'Keypad Touch'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 50.000"
                    value={mAmount}
                    onChange={(e) => setMAmount(formatRupiahInput(e.target.value))}
                    className="w-full brutal-input text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {mType === 'transfer' ? 'Dari Wallet' : 'Wallet'}
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
                  <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mr-0.5">
                    Tambah:
                  </span>
                  {QUICK_AMOUNT_INCREMENTS.map((chip) => (
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
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Ke Wallet Tujuan
                  </label>
                  <WalletSelect
                    wallets={balances}
                    value={currentToMethod}
                    onChange={setMToMethod}
                    className="w-full brutal-input text-xs uppercase font-bold"
                    required
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      Kategori
                    </label>
                    <span className="text-[9px] font-bold text-neutral-500">Pilih cepat atau ketik</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. makan, transport"
                    value={mCategory}
                    onChange={(e) => setMCategory(e.target.value)}
                    className="w-full brutal-input text-xs font-bold"
                    required
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {(mType === 'masuk' ? QUICK_INCOME_CATEGORIES : QUICK_EXPENSE_CATEGORIES).map(
                      (cat) => {
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
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Note & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Makan siang kantor"
                    value={mNote}
                    onChange={(e) => setMNote(e.target.value)}
                    className="w-full brutal-input text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Tag (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #makan #kerja"
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
                    Berulang tiap bulan (Tagihan / Langganan rutin)
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
                <span>Simpan Transaksi</span>
              </button>
            </form>
          )}

          {/* TAB 3: Option B: Receipt Attachment + 3-Column Quick Entry Sheet */}
          {mode === 'receipt' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#FAF9F5] dark:bg-neutral-800/80 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2.5px_2.5px_0px_0px_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {receiptImageThumbnail ? (
                    <div className="relative w-14 h-14 shrink-0 rounded-xl border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_#000]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={receiptImageThumbnail}
                        alt="Thumbnail struk"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveReceiptImage}
                        className="absolute top-0 right-0 p-0.5 bg-red-600 text-white cursor-pointer"
                        title="Hapus foto struk"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-14 h-14 shrink-0 rounded-xl border-2 border-dashed border-black dark:border-neutral-600 bg-white dark:bg-neutral-900 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-neutral-400 stroke-[2px]" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-black dark:text-white truncate">
                      {receiptImageName || 'Lampiran Struk (Opsi B)'}
                    </p>
                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {receiptImageThumbnail
                        ? 'Foto tersimpan di memori perangkat. Rincian cepat diisi di bawah.'
                        : 'Unggah/foto struk, lalu catat cepat 3-kolom tanpa cloud OCR.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
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
                    disabled={receiptCompressing}
                    className="w-full sm:w-auto px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-lg text-xs font-black uppercase tracking-wider bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {receiptCompressing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <span>{receiptImageThumbnail ? 'Ganti Foto' : 'Ambil/Unggah Foto'}</span>
                  </button>
                </div>
              </div>

              {/* Merchant, Wallet & Category for Receipt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Nama Toko / Tempat
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Indomaret, Hokben, Apotek"
                    value={receiptMerchant}
                    onChange={(e) => setReceiptMerchant(e.target.value)}
                    className="w-full brutal-input text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    Bayar Pakai Wallet
                  </label>
                  <WalletSelect
                    wallets={balances}
                    value={receiptWallet || currentMethod}
                    onChange={setReceiptWallet}
                    className="w-full brutal-input text-xs uppercase font-bold"
                    required
                  />
                </div>
              </div>

              {/* Category Quick Chips for Receipt */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  Kategori Struk
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {QUICK_EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setReceiptCategory(cat);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border border-black dark:border-neutral-700 rounded-md shadow-[1px_1px_0px_0px_#000] cursor-pointer ${
                        receiptCategory === cat
                          ? 'bg-[#FFE066] text-black font-black'
                          : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Column Sheet Table */}
              <div className="border-2 border-black dark:border-neutral-700 rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_#000] bg-white dark:bg-neutral-900">
                <div className="px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-b-2 border-black dark:border-neutral-700 flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                  <span>Lembar Masuk Cepat (3 Kolom)</span>
                  <button
                    type="button"
                    onClick={handleAddReceiptRow}
                    className="px-2 py-0.5 border border-black dark:border-neutral-600 rounded bg-white dark:bg-neutral-700 text-black dark:text-white flex items-center gap-1 cursor-pointer shadow-[1px_1px_0px_0px_#000]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  <div className="grid grid-cols-[1fr_80px_110px_36px] gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-50 dark:bg-neutral-900">
                    <div>Nama Barang</div>
                    <div>Qty / Ket.</div>
                    <div>Harga (Rp)</div>
                    <div className="text-center">Aksi</div>
                  </div>

                  {receiptRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_80px_110px_36px] gap-2 p-2.5 items-center"
                    >
                      <input
                        type="text"
                        placeholder={`Barang #${index + 1}`}
                        value={row.name}
                        onChange={(e) => handleUpdateReceiptRow(row.id, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-bold border border-black dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="1 pcs"
                        value={row.qty}
                        onChange={(e) => handleUpdateReceiptRow(row.id, 'qty', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-bold border border-black dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none text-center"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={row.price}
                        onChange={(e) => handleUpdateReceiptRow(row.id, 'price', e.target.value)}
                        className="w-full px-2 py-1 text-xs font-black border border-black dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white focus:outline-none text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveReceiptRow(row.id)}
                        disabled={receiptRows.length <= 1}
                        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Subtotal Footer */}
                <div className="p-3 bg-[#FAF9F5] dark:bg-neutral-800 border-t-2 border-black dark:border-neutral-700 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                    Total Rincian Struk:
                  </span>
                  <span className="text-base font-black text-black dark:text-white">
                    {formatRupiah(receiptSubtotal)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTransferReceiptToManual}
                  disabled={receiptSubtotal <= 0}
                  className="w-full sm:w-auto px-4 py-2.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Salin ke Formulir</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveReceiptSheet}
                  disabled={loading || receiptSubtotal <= 0}
                  className="flex-1 w-full py-2.5 px-4 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: 'var(--theme-accent, #FFE066)',
                    color: 'var(--theme-accent-text, #000000)',
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3px]" />
                  )}
                  <span>Simpan Transaksi Struk ({formatRupiah(receiptSubtotal)})</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Split Bill Calculator Mode */}
          {mode === 'split' && (
            <div>
              <SplitBillCalculator
                defaultAmount={parseRupiahInput(mAmount) || 0}
                onUseMyShare={(amount, note) => {
                  setMode('manual');
                  setMAmount(formatRupiahInput(amount.toString()));
                  setMNote(note);
                  setMCategory('Makan');
                  setMessage({
                    type: 'success',
                    text: `Porsi split bill ${formatRupiah(amount)} diterapkan ke Formulir Manual!`,
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
    </div>
  );
}
