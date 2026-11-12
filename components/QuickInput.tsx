'use client';

import { useState, useRef } from 'react';
import { Send, Loader2, Camera, RotateCcw, X, ClipboardPaste } from 'lucide-react';
import { processInput, deleteTransaction } from '../app/actions';
import { compressReceiptImage } from '../lib/imageCompression';
import { scanReceiptOffline } from '../lib/receiptOcr';
import { useLanguage } from '../lib/i18n';
import { enqueueOfflineTransaction } from '../lib/offlineQueue';
import { parseBankNotificationText } from '../lib/smartClipboard';
import { triggerHaptic } from '../lib/haptics';

export default function QuickInput() {
  const { lang } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [undoTxId, setUndoTxId] = useState<string | null>(null);
  const [receiptThumbnail, setReceiptThumbnail] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  };

  const startUndoWindow = (transactionId: string) => {
    clearUndoTimer();
    setUndoTxId(transactionId);
    undoTimerRef.current = setTimeout(() => {
      setUndoTxId(null);
      undoTimerRef.current = null;
    }, 5000);
  };

  const handleUndo = async () => {
    if (!undoTxId) return;

    const targetId = undoTxId;
    clearUndoTimer();
    setUndoTxId(null);
    setLoading(true);

    const res = await deleteTransaction(targetId);
    setMessage(
      res.success
        ? { type: 'success', text: lang === 'id' ? 'Transaksi dibatalkan.' : 'Transaction cancelled.' }
        : { type: 'error', text: res.error || (lang === 'id' ? 'Gagal membatalkan' : 'Failed to undo') }
    );
    setLoading(false);
  };

  // Option B: Client-side 100% Offline Tesseract OCR & Instant Thumbnail
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setMessage(null);
    triggerHaptic('light');

    try {
      const compressedFile = await compressReceiptImage(file);
      const url = URL.createObjectURL(compressedFile);
      setReceiptThumbnail(url);
      setReceiptName(file.name);

      // 100% Offline Client-Side Tesseract OCR
      try {
        const ocrResult = await scanReceiptOffline(compressedFile);
        if (ocrResult.amount > 0 || ocrResult.suggestedText) {
          setInput(ocrResult.suggestedText || `${ocrResult.amount} ${ocrResult.merchant || 'Belanja'} cash`);
          triggerHaptic('success');
          setMessage({
            type: 'success',
            text:
              lang === 'id'
                ? `✅ Struk terdeteksi (Tesseract OCR): Rp ${ocrResult.amount.toLocaleString('id-ID')} (${ocrResult.merchant})`
                : `✅ Receipt detected (Tesseract OCR): Rp ${ocrResult.amount.toLocaleString('id-ID')} (${ocrResult.merchant})`,
          });
          return;
        }
      } catch (ocrErr) {
        console.warn('Tesseract OCR failed, keeping thumbnail:', ocrErr);
      }

      triggerHaptic('success');
      setMessage({
        type: 'success',
        text:
          lang === 'id'
            ? `📷 Foto struk "${file.name}" terlampir. Masukkan nominal atau ketik rincian.`
            : `📷 Receipt "${file.name}" attached. Type amount or detail.`,
      });
    } catch (error: unknown) {
      triggerHaptic('warning');
      const text =
        error instanceof Error
          ? error.message
          : lang === 'id'
          ? 'Gagal memproses struk'
          : 'Failed to process receipt';
      setMessage({ type: 'error', text: `${text}` });
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveReceipt = () => {
    triggerHaptic('light');
    if (receiptThumbnail) {
      URL.revokeObjectURL(receiptThumbnail);
    }
    setReceiptThumbnail(null);
    setReceiptName(null);
  };

  // Smart Clipboard Paste
  const handlePasteClipboard = async () => {
    triggerHaptic('selection');
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        setMessage({
          type: 'error',
          text: lang === 'id' ? 'Clipboard tidak didukung.' : 'Clipboard not supported.',
        });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setMessage({
          type: 'error',
          text: lang === 'id' ? 'Clipboard kosong.' : 'Clipboard is empty.',
        });
        return;
      }

      const parsed = parseBankNotificationText(text);
      if (parsed.success && parsed.amount) {
        triggerHaptic('success');
        const formatted = `${parsed.merchant || parsed.category} ${parsed.amount} ${parsed.source || 'cash'}`.toLowerCase();
        setInput(formatted);
        setMessage({
          type: 'success',
          text:
            lang === 'id'
              ? `📋 Terdeteksi: ${parsed.merchant || parsed.category} (${parsed.amount}). Klik Kirim.`
              : `📋 Detected: ${parsed.merchant || parsed.category} (${parsed.amount}). Click Send.`,
        });
      } else {
        triggerHaptic('warning');
        setMessage({
          type: 'error',
          text: lang === 'id' ? 'Bukan notifikasi mutasi bank yang valid.' : 'Not a valid bank text.',
        });
      }
    } catch {
      triggerHaptic('warning');
      setMessage({
        type: 'error',
        text: lang === 'id' ? 'Gagal membaca clipboard.' : 'Failed to read clipboard.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setMessage(null);
    triggerHaptic('medium');

    const currentInput = input.trim();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineTransaction({ type: 'smart', input: currentInput });
      setInput('');
      handleRemoveReceipt();
      setMessage({
        type: 'success',
        text:
          lang === 'id'
            ? '💾 Disimpan offline di HP. Otomatis disinkronkan saat terhubung internet.'
            : '💾 Saved offline. Will sync when back online.',
      });
      setTimeout(() => setMessage(null), 5000);
      setLoading(false);
      return;
    }

    try {
      const res = await processInput(currentInput);

      if (res.success) {
        triggerHaptic('success');
        const transactionId =
          'transactionId' in res && typeof res.transactionId === 'string'
            ? res.transactionId
            : null;
        const action = 'action' in res ? res.action : undefined;
        const walletName =
          'walletName' in res && typeof res.walletName === 'string' ? res.walletName : 'wallet';

        setInput('');
        handleRemoveReceipt();
        if (transactionId) {
          setMessage({
            type: 'success',
            text:
              lang === 'id'
                ? 'Transaksi berhasil ditambahkan.'
                : 'Transaction successfully added.',
          });
          startUndoWindow(transactionId);
        } else if (action === 'balance_update') {
          setMessage({
            type: 'success',
            text:
              lang === 'id'
                ? `Saldo ${walletName} diperbarui.`
                : `${walletName} balance updated.`,
          });
          setUndoTxId(null);
        } else {
          setMessage({ type: 'success', text: lang === 'id' ? 'Tersimpan.' : 'Saved.' });
          setUndoTxId(null);
        }
        setTimeout(() => setMessage(null), 5000);
      } else {
        triggerHaptic('warning');
        setMessage({
          type: 'error',
          text: res.error || (lang === 'id' ? 'Gagal menyimpan' : 'Failed to save'),
        });
      }
    } catch {
      enqueueOfflineTransaction({ type: 'smart', input: currentInput });
      setInput('');
      handleRemoveReceipt();
      setMessage({
        type: 'success',
        text:
          lang === 'id'
            ? '💾 Koneksi terputus. Disimpan offline dan disinkronkan nanti.'
            : '💾 Connection lost. Saved offline and will sync later.',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white select-none">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-xs font-black uppercase tracking-wider">
          {lang === 'id' ? 'Catat Cepat (Smart Input)' : 'Quick Input (Smart Input)'}
        </h2>
        <button
          type="button"
          onClick={handlePasteClipboard}
          className="text-[10px] font-black uppercase tracking-wider px-2 py-1 border border-black dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer"
          title={lang === 'id' ? 'Tempel teks notifikasi mutasi bank' : 'Paste bank notification text'}
        >
          <ClipboardPaste className="w-3 h-3" />
          <span>{lang === 'id' ? 'Tempel Mutasi' : 'Paste SMS'}</span>
        </button>
      </div>

      {/* Option B Receipt Thumbnail Preview */}
      {receiptThumbnail && (
        <div className="mb-3 p-2 bg-[#FAF9F5] dark:bg-neutral-800 border border-black dark:border-neutral-700 rounded-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={receiptThumbnail}
              alt="Receipt preview"
              className="w-9 h-9 object-cover rounded-md border border-black shadow-[1px_1px_0px_0px_#000]"
            />
            <span className="text-[11px] font-bold truncate">
              {receiptName || (lang === 'id' ? 'Struk terlampir' : 'Receipt attached')}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveReceipt}
            className="p-1 text-red-600 hover:text-red-800 cursor-pointer"
            title={lang === 'id' ? 'Hapus lampiran struk' : 'Remove receipt attachment'}
            aria-label={lang === 'id' ? 'Hapus lampiran struk' : 'Remove receipt attachment'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || scanning}
          className="px-3.5 py-2.5 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center rounded-xl cursor-pointer"
          title={lang === 'id' ? 'Lampirkan Struk (Opsi B)' : 'Attach Receipt (Option B)'}
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin text-black dark:text-white" />
          ) : (
            <Camera className="w-4 h-4 stroke-[2.5px] text-black dark:text-white" />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === 'id' ? 'Cth: kopi 25rb gopay' : 'E.g.: 25k coffee cash'}
          className="flex-1 brutal-input px-3.5 py-2 text-xs font-bold"
          disabled={loading || scanning}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 flex items-center justify-center min-w-[56px] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--theme-accent, #FFE066)',
            color: 'var(--theme-accent-text, #000000)',
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 stroke-[2.5px]" />
          )}
        </button>
      </form>

      {/* Quick Amount Suggestion Chips */}
      <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 shrink-0">
          {lang === 'id' ? 'Nominal:' : 'Amount:'}
        </span>
        {['10rb', '20rb', '50rb', '100rb', '200rb', '500rb'].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setInput((prev) => {
                const trimmed = prev.trim();
                if (!trimmed) return amt;
                const amountSuffixRegex = /(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta)?$/i;
                if (amountSuffixRegex.test(trimmed)) {
                  return trimmed.replace(amountSuffixRegex, amt);
                }
                return `${trimmed} ${amt}`;
              });
            }}
            className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border border-black dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white hover:bg-[#FFE066] hover:text-black dark:hover:bg-[#FFE066] dark:hover:text-black transition-colors cursor-pointer shrink-0"
          >
            +{amt}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`mt-3 flex items-center justify-between gap-3 p-2.5 border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-bold ${
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-black bg-white dark:bg-neutral-800 px-2 py-0.5 font-black text-black dark:text-white transition-colors cursor-pointer shadow-[1px_1px_0px_0px_#000]"
            >
              <RotateCcw className="h-3.5 w-3.5 stroke-[2.5px]" />
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
