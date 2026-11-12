'use client';

import React, { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Balance } from '../types';
import WalletSelect from './WalletSelect';
import { parseStatementCSV, ParsedStatementRow } from '../lib/parsers/statementParser';
import { importStatementTransactions } from '../app/actions';
import { formatRupiah } from '../lib/format';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Check,
} from 'lucide-react';

interface ImportStatementModalProps {
  balances: Balance[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const emptySubscribe = () => () => {};

export default function ImportStatementModal({
  balances,
  isOpen,
  onClose,
  onSuccess,
}: ImportStatementModalProps) {
  const { lang } = useLanguage();
  const isId = lang === 'id';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [targetWalletId, setTargetWalletId] = useState<string>(() => balances[0]?.id || '');
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedStatementRow[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [detectedBank, setDetectedBank] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Lock body scroll and handle Escape key for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerHaptic('light');
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        processCSVText(content);
      }
    };
    reader.readAsText(file);
  };

  const processCSVText = (text: string) => {
    setError(null);
    const result = parseStatementCSV(text);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.rows.length === 0) {
      setError(
        isId
          ? 'Tidak ada baris transaksi yang berhasil dibaca. Pastikan format file sesuai.'
          : 'No transactions found in this file/text. Please check the format.'
      );
      return;
    }

    setDetectedBank(result.detectedBank);
    setParsedRows(result.rows);
    setSelectedRowIds(new Set(result.rows.map((r) => r.id)));
    triggerHaptic('success');
  };

  const toggleRow = (id: string) => {
    triggerHaptic('selection');
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    triggerHaptic('selection');
    if (selectedRowIds.size === parsedRows.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(parsedRows.map((r) => r.id)));
    }
  };

  // Selected totals
  const selectedRows = parsedRows.filter((r) => selectedRowIds.has(r.id));
  const selectedIncome = selectedRows.filter((r) => r.type === 'masuk').reduce((sum, r) => sum + r.amount, 0);
  const selectedExpense = selectedRows.filter((r) => r.type === 'keluar').reduce((sum, r) => sum + r.amount, 0);

  const handleExecuteImport = async () => {
    if (!targetWalletId) {
      setError(isId ? 'Pilih dompet tujuan terlebih dahulu' : 'Select target wallet first');
      triggerHaptic('warning');
      return;
    }
    if (selectedRows.length === 0) {
      setError(isId ? 'Pilih minimal 1 transaksi untuk diimpor' : 'Select at least 1 transaction');
      triggerHaptic('warning');
      return;
    }

    setLoading(true);
    setError(null);
    triggerHaptic('medium');

    const res = await importStatementTransactions(
      targetWalletId,
      selectedRows.map((r) => ({
        dateStr: r.dateStr,
        type: r.type,
        amount: r.amount,
        description: r.description,
        category: r.category,
      }))
    );

    setLoading(false);

    if (res.success) {
      triggerHaptic('success');
      setSuccessMsg(
        isId
          ? `Berhasil mengimpor ${res.count} transaksi ke dompet ${res.walletName}!`
          : `Successfully imported ${res.count} transactions into ${res.walletName}!`
      );
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } else {
      triggerHaptic('warning');
      setError(res.error || (isId ? 'Gagal mengimpor mutasi' : 'Import failed'));
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-statement-title"
        className="brutal-card w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[6px_6px_0px_0px_#000] text-black dark:text-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-black dark:border-neutral-700 flex justify-between items-center bg-[#FAF9F5] dark:bg-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 border-2 border-black dark:border-neutral-700 rounded-xl shadow-[2px_2px_0px_0px_#000]"
              style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: 'var(--theme-accent-text, #000000)' }}
            >
              <UploadCloud className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <div>
              <h3 id="import-statement-title" className="text-sm sm:text-base font-black uppercase tracking-wider">
                {isId ? 'Import Mutasi E-Statement' : 'Import Bank Statement'}
              </h3>
              <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                BCA • Mandiri • GoPay • CSV Generic
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label={isId ? 'Tutup modal import' : 'Close import modal'}
            className="p-2 border-2 border-black dark:border-neutral-700 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer transition-colors shadow-[1.5px_1.5px_0px_0px_#000] min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4 stroke-[2.5px]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-950/70 border-2 border-black dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/70 border-2 border-black dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Target Wallet Selection */}
          <div className="p-3 bg-[#FAF9F5] dark:bg-neutral-800/60 border-2 border-black dark:border-neutral-700 rounded-xl space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              {isId ? '1. Pilih Dompet / Rekening Tujuan Masuknya Mutasi:' : '1. Target Wallet for this statement:'}
            </label>
            <WalletSelect
              wallets={balances}
              value={targetWalletId}
              onChange={setTargetWalletId}
              className="w-full brutal-input text-xs font-bold bg-white dark:bg-neutral-900"
            />
          </div>

          {/* Upload or Paste Area */}
          {parsedRows.length === 0 ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-black dark:border-neutral-700 rounded-xl p-6 sm:p-8 text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <div
                  className="p-3 border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]"
                  style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: '#000' }}
                >
                  <FileText className="w-6 h-6 stroke-[2.5px]" />
                </div>
                <p className="text-xs font-black uppercase tracking-wider">
                  {isId ? 'Klik untuk Unggah Berkas CSV / Mutasi Rekening' : 'Click to Upload CSV / Statement File'}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
                  Mendukung berkas e-statement BCA, Mandiri Livin, GoPay, dan CSV standar
                </p>
              </div>

              {/* Or Paste Raw Text */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 mb-1">
                  {isId ? 'Atau Tempel (Paste) Teks CSV di Bawah Ini:' : 'Or Paste CSV Text Below:'}
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="01/11/2026,Kopi Janji Jiwa,22000,keluar&#10;02/11/2026,Gaji Bulanan,7500000,masuk"
                  className="w-full brutal-input p-2.5 text-xs font-mono bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-xl"
                />
                <button
                  type="button"
                  disabled={!rawText.trim()}
                  onClick={() => processCSVText(rawText)}
                  className="mt-2 w-full py-2.5 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px]"
                  style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: '#000' }}
                >
                  {isId ? 'Proses Teks Mutasi ⚡' : 'Parse Statement Text ⚡'}
                </button>
              </div>
            </div>
          ) : (
            /* Live Preview & Row Selection */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl border-2 border-black dark:border-neutral-700">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#FFE066] text-black border border-black rounded text-[10px] font-black uppercase">
                    Bank: {detectedBank}
                  </span>
                  <span className="text-xs font-black uppercase">
                    {selectedRowIds.size} / {parsedRows.length} {isId ? 'Dipilih' : 'Selected'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleAll}
                  className="px-2.5 py-1 text-[10px] font-black uppercase border border-black rounded-lg bg-white dark:bg-neutral-700 shadow-[1px_1px_0px_0px_#000] cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                >
                  {selectedRowIds.size === parsedRows.length ? (isId ? 'Batalkan Semua' : 'Deselect All') : (isId ? 'Pilih Semua' : 'Select All')}
                </button>
              </div>

              {/* Financial Preview Strip */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-lg">
                  <span className="text-[9px] font-bold uppercase text-neutral-500 block">Total Masuk</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    +{formatRupiah(selectedIncome)}
                  </span>
                </div>
                <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-300 rounded-lg">
                  <span className="text-[9px] font-bold uppercase text-neutral-500 block">Total Keluar</span>
                  <span className="text-xs font-black text-red-600 dark:text-red-400">
                    -{formatRupiah(selectedExpense)}
                  </span>
                </div>
              </div>

              {/* Table Rows Preview */}
              <div className="max-h-60 overflow-y-auto border-2 border-black dark:border-neutral-700 rounded-xl divide-y-2 divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {parsedRows.map((row) => {
                  const isChecked = selectedRowIds.has(row.id);
                  const isIncome = row.type === 'masuk';
                  return (
                    <div
                      key={row.id}
                      onClick={() => toggleRow(row.id)}
                      className={`p-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-yellow-50/60 dark:bg-yellow-950/20' : 'opacity-40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by wrapper onClick
                          className="w-4 h-4 accent-black rounded cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                              {row.dateStr}
                            </span>
                            <span className="font-black truncate">{row.description}</span>
                          </div>
                          <span className="text-[9px] font-bold text-neutral-500 uppercase">
                            📁 {row.category}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`font-black shrink-0 ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatRupiah(row.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setParsedRows([]);
                  setRawText('');
                }}
                className="text-[10px] font-bold uppercase underline text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                ← {isId ? 'Unggah Berkas Lain' : 'Upload Different File'}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {parsedRows.length > 0 && (
          <div className="p-4 border-t-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer hover:bg-neutral-100"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={loading || selectedRows.length === 0}
              onClick={handleExecuteImport}
              className="flex-1 py-2.5 bg-[#bbf7d0] dark:bg-emerald-800 text-black dark:text-white border-2 border-black dark:border-neutral-700 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3px]" />
              )}
              <span>
                {loading
                  ? (isId ? 'Mengimpor...' : 'Importing...')
                  : (isId
                      ? `Import ${selectedRows.length} Transaksi ⚡`
                      : `Import ${selectedRows.length} Transactions ⚡`)}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
