'use client';

import { useState, useRef } from 'react';
import { Send, Loader2, Camera, RotateCcw } from 'lucide-react';
import { processInput, addExplicitTransaction, deleteTransaction } from '../app/actions';
import { compressReceiptImage } from '../lib/imageCompression';
import { useLanguage } from '../lib/i18n';
import { enqueueOfflineTransaction } from '../lib/offlineQueue';

interface ReceiptScan {
  amount: number;
  merchant?: string;
  note?: string;
  date?: string;
  items?: unknown;
  suggestedText: string;
}

export default function QuickInput() {
  const { lang } = useLanguage();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [undoTxId, setUndoTxId] = useState<string | null>(null);
  const [receiptScan, setReceiptScan] = useState<ReceiptScan | null>(null);
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
        ? { type: 'success', text: 'Transaksi dibatalkan.' }
        : { type: 'error', text: res.error || 'Gagal membatalkan transaksi' }
    );
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setMessage(null);

    try {
      const compressedFile = await compressReceiptImage(file);
      const formData = new FormData();
      formData.append('image', compressedFile);

      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.error && !data.suggestedText) throw new Error(data.error);

      if (data.amount && data.amount > 0) {
        const suggestedText = data.suggestedText || `${data.amount} ${data.note || data.merchant || 'belanja'} cash`;
        setReceiptScan({
          amount: data.amount,
          merchant: data.merchant,
          note: data.note,
          date: data.date,
          items: data.items,
          suggestedText,
        });
        setInput(suggestedText);
        setMessage({ type: 'success', text: `Auto-parser mendeteksi ${data.amount}. Silakan tinjau dan kirim.` });
      } else {
        setMessage({ type: 'success', text: `Foto struk "${file.name}" terlampir. Ketik nominal di Smart Input (contoh: "kopi 25rb cash").` });
      }
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : 'Gagal scan struk';
      setMessage({ type: 'error', text: `Lampiran tersimpan. Silakan ketik nominal manual: ${text}` });
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setMessage(null);

    const currentInput = input.trim();
    const isAcceptedReceipt = receiptScan && currentInput === receiptScan.suggestedText;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (isAcceptedReceipt && receiptScan) {
        enqueueOfflineTransaction({
          type: 'explicit',
          data: {
            type: 'keluar',
            amount: receiptScan.amount,
            category: 'Belanja',
            wallet: 'cash',
            note: receiptScan.merchant || receiptScan.note || 'Receipt',
            tags: ['receipt'],
            receiptMerchant: receiptScan.merchant,
            receiptItems: receiptScan.items,
            receiptDate: receiptScan.date,
          },
        });
      } else {
        enqueueOfflineTransaction({ type: 'smart', input: currentInput });
      }

      setInput('');
      setReceiptScan(null);
      setMessage({
        type: 'success',
        text: lang === 'id' ? '💾 Disimpan offline di HP. Otomatis disinkronkan saat terhubung internet.' : '💾 Saved offline. Will sync when back online.',
      });
      setTimeout(() => setMessage(null), 5000);
      setLoading(false);
      return;
    }

    try {
      const res = isAcceptedReceipt
        ? await addExplicitTransaction({
            type: 'keluar',
            amount: receiptScan.amount,
            category: 'Belanja',
            wallet: 'cash',
            note: receiptScan.merchant || receiptScan.note || 'Receipt',
            tags: ['receipt'],
            receiptMerchant: receiptScan.merchant,
            receiptItems: receiptScan.items,
            receiptDate: receiptScan.date,
          })
        : await processInput(currentInput);

      if (res.success) {
        const transactionId = 'transactionId' in res && typeof res.transactionId === 'string'
          ? res.transactionId
          : null;
        const action = 'action' in res ? res.action : undefined;
        const walletName = 'walletName' in res && typeof res.walletName === 'string'
          ? res.walletName
          : 'wallet';

        setInput('');
        setReceiptScan(null);
        if (transactionId) {
          setMessage({ type: 'success', text: lang === 'id' ? 'Transaksi berhasil ditambahkan.' : 'Transaction successfully added.' });
          startUndoWindow(transactionId);
        } else if (action === 'balance_update') {
          setMessage({ type: 'success', text: lang === 'id' ? `Saldo ${walletName} diperbarui.` : `${walletName} balance updated.` });
          setUndoTxId(null);
        } else {
          setMessage({ type: 'success', text: lang === 'id' ? 'Tersimpan.' : 'Saved.' });
          setUndoTxId(null);
        }
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: res.error || (lang === 'id' ? 'Gagal menyimpan' : 'Failed to save') });
      }
    } catch {
      // Offline fallback on dropped connection
      if (isAcceptedReceipt && receiptScan) {
        enqueueOfflineTransaction({
          type: 'explicit',
          data: {
            type: 'keluar',
            amount: receiptScan.amount,
            category: 'Belanja',
            wallet: 'cash',
            note: receiptScan.merchant || receiptScan.note || 'Receipt',
            tags: ['receipt'],
            receiptMerchant: receiptScan.merchant,
            receiptItems: receiptScan.items,
            receiptDate: receiptScan.date,
          },
        });
      } else {
        enqueueOfflineTransaction({ type: 'smart', input: currentInput });
      }

      setInput('');
      setReceiptScan(null);
      setMessage({
        type: 'success',
        text: lang === 'id' ? '💾 Koneksi terputus. Disimpan offline dan disinkronkan nanti.' : '💾 Connection lost. Saved offline and will sync later.',
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="brutal-card p-6 bg-white">
      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
        {lang === 'id' ? 'Catat Cepat (Smart Input)' : 'Quick Input (Smart Input)'}
      </h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
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
          className="brutal-btn-light px-4 flex items-center justify-center rounded-lg"
          title={lang === 'id' ? 'Scan Struk' : 'Scan Receipt'}
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Camera className="w-4 h-4 text-slate-600" />}
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === 'id' ? 'Cth: kopi 25rb gopay' : 'E.g.: 25k coffee cash'}
          className="flex-1 brutal-input px-4 py-3 text-xs font-semibold"
          disabled={loading || scanning}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="brutal-btn px-6 flex items-center justify-center min-w-[64px] rounded-lg"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {message && (
        <div className={`mt-4 flex items-center justify-between gap-3 p-3 border rounded-lg text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <span>{message.text}</span>
          {message.type === 'success' && undoTxId && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-2.5 py-1 font-bold text-emerald-800 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
