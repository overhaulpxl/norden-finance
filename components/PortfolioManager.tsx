'use client';

import React, { useState, useMemo } from 'react';
import { PortfolioAsset, AssetClass } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { useLanguage } from '../lib/i18n';
import { useHideBalance } from '../lib/HideBalanceContext';
import { triggerHaptic } from '../lib/haptics';
import {
  savePortfolioAsset,
  deletePortfolioAsset,
  revaluePortfolioAsset,
  refreshPortfolioLivePrices,
  getMarketBenchmarksAction,
} from '../app/actions';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Coins,
  LineChart,
  PieChart,
  Zap,
  Building,
  Layers,
  X,
  Check,
  Loader2,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface PortfolioManagerProps {
  initialAssets: PortfolioAsset[];
  onAssetChange?: (assets: PortfolioAsset[]) => void;
}

const ASSET_CLASS_META: Record<
  AssetClass,
  {
    labelId: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
    defaultUnit: string;
    bgBadge: string;
    borderBadge: string;
    textColor: string;
  }
> = {
  emas: {
    labelId: 'Emas',
    labelEn: 'Gold',
    icon: Coins,
    defaultUnit: 'gram',
    bgBadge: 'bg-amber-100 dark:bg-amber-950/70',
    borderBadge: 'border-black dark:border-neutral-700',
    textColor: 'text-black dark:text-amber-300',
  },
  saham: {
    labelId: 'Saham',
    labelEn: 'Stocks',
    icon: LineChart,
    defaultUnit: 'lot',
    bgBadge: 'bg-blue-100 dark:bg-blue-950/70',
    borderBadge: 'border-black dark:border-neutral-700',
    textColor: 'text-black dark:text-blue-300',
  },
  reksadana: {
    labelId: 'Reksadana',
    labelEn: 'Mutual Funds',
    icon: PieChart,
    defaultUnit: 'unit',
    bgBadge: 'bg-purple-100 dark:bg-purple-950/70',
    borderBadge: 'border-black dark:border-neutral-700',
    textColor: 'text-black dark:text-purple-300',
  },
  kripto: {
    labelId: 'Kripto',
    labelEn: 'Crypto',
    icon: Zap,
    defaultUnit: 'koin',
    bgBadge: 'bg-orange-100 dark:bg-orange-950/70',
    borderBadge: 'border-black dark:border-neutral-700',
    textColor: 'text-black dark:text-orange-300',
  },
  properti: {
    labelId: 'Properti',
    labelEn: 'Property',
    icon: Building,
    defaultUnit: 'unit',
    bgBadge: 'bg-emerald-100 dark:bg-emerald-950/70',
    borderBadge: 'border-black dark:border-neutral-700',
    textColor: 'text-black dark:text-emerald-300',
  },
  lainnya: {
    labelId: 'Lainnya',
    labelEn: 'Other',
    icon: Layers,
    defaultUnit: 'unit',
    bgBadge: 'bg-neutral-100 dark:bg-neutral-800',
    borderBadge: 'border-black dark:border-neutral-700',
    textColor: 'text-black dark:text-neutral-200',
  },
};

export default function PortfolioManager({
  initialAssets = [],
  onAssetChange,
}: PortfolioManagerProps) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const isId = lang === 'id';

  const [assets, setAssets] = useState<PortfolioAsset[]>(initialAssets);
  const [selectedFilter, setSelectedFilter] = useState<AssetClass | 'all'>('all');
  const [benchmarks, setBenchmarks] = useState<{
    goldIdrPerGram: number;
    ihsg: number;
    usdIdr: number;
    btIdr: number;
    updatedAt: string;
  } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await getMarketBenchmarksAction();
        if (isMounted && res.success && res.benchmarks) {
          setBenchmarks(res.benchmarks);
        }
      } catch {
        // ignore benchmark load error
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Modal Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [formClass, setFormClass] = useState<AssetClass>('emas');
  const [formName, setFormName] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('gram');
  const [formBuyPrice, setFormBuyPrice] = useState('');
  const [formCurrentPrice, setFormCurrentPrice] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [quoteSource, setQuoteSource] = useState<string | null>(null);
  const lastFetchedKeyRef = React.useRef<string>('');

  // Revaluation Quick Modal
  const [revalAsset, setRevalAsset] = useState<PortfolioAsset | null>(null);
  const [revalNewPrice, setRevalNewPrice] = useState('');

  // Delete inline confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // State feedback
  const [loading, setLoading] = useState(false);
  const [refreshingLive, setRefreshingLive] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Overall Portfolio Metrics
  const metrics = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    const classDistribution: Record<AssetClass, number> = {
      emas: 0,
      saham: 0,
      reksadana: 0,
      kripto: 0,
      properti: 0,
      lainnya: 0,
    };

    assets.forEach((a) => {
      const invested = a.buyPrice * a.quantity;
      const current = a.currentPrice * a.quantity;
      totalInvested += invested;
      totalCurrent += current;
      classDistribution[a.assetClass] = (classDistribution[a.assetClass] || 0) + current;
    });

    const netProfitRp = totalCurrent - totalInvested;
    const netProfitPct = totalInvested > 0 ? (netProfitRp / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      netProfitRp,
      netProfitPct,
      classDistribution,
    };
  }, [assets]);

  // Filtered Assets List
  const filteredAssets = useMemo(() => {
    if (selectedFilter === 'all') return assets;
    return assets.filter((a) => a.assetClass === selectedFilter);
  }, [assets, selectedFilter]);

  // Open Add Modal
  const handleOpenAdd = (presetClass: AssetClass = 'emas') => {
    triggerHaptic('light');
    setEditingAssetId(null);
    setFormClass(presetClass);
    const initialName =
      presetClass === 'emas'
        ? 'Emas Murni'
        : presetClass === 'kripto'
        ? 'Bitcoin'
        : presetClass === 'saham'
        ? 'Bank Central Asia'
        : presetClass === 'reksadana'
        ? 'AXA Saham Dinamis'
        : '';
    const initialSymbol =
      presetClass === 'emas'
        ? 'XAU'
        : presetClass === 'kripto'
        ? 'BTC'
        : presetClass === 'saham'
        ? 'BBCA'
        : presetClass === 'reksadana'
        ? 'BRK11'
        : '';
    setFormName(initialName);
    setFormSymbol(initialSymbol);
    setFormInstitution('');
    setFormQuantity('1');
    setFormUnit(ASSET_CLASS_META[presetClass].defaultUnit);
    setFormBuyPrice('');
    setFormCurrentPrice('');
    setFormNotes('');
    setQuoteSource(null);
    setError(null);
    setModalOpen(true);

    if (initialSymbol || initialName) {
      fetchLiveQuoteNow(presetClass, initialSymbol, initialName);
    }
  };

  // Immediate live quote fetcher without debounce
  const fetchLiveQuoteNow = async (assetClass: AssetClass, symbol: string, name: string) => {
    if (assetClass !== 'emas' && assetClass !== 'saham' && assetClass !== 'kripto' && assetClass !== 'reksadana') {
      setQuoteSource(null);
      return;
    }
    const cleanSymbol = symbol.trim();
    const cleanName = name.trim();
    if (!cleanSymbol && !cleanName) return;

    const currentKey = `${assetClass}:${cleanSymbol}:${cleanName}`;
    lastFetchedKeyRef.current = currentKey;
    setFetchingQuote(true);

    try {
      const params = new URLSearchParams({
        assetClass,
        symbol: cleanSymbol,
        name: cleanName,
      });
      const res = await fetch(`/api/market/quote?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const quote = data?.quote;
        if (quote?.priceIdr) {
          setFormCurrentPrice(formatRupiahInput(quote.priceIdr));
          setFormBuyPrice((prev) => (!prev || prev === '0' ? formatRupiahInput(quote.priceIdr) : prev));
          setQuoteSource(quote.source || 'Live Market');
          setError(null);
          return;
        }
      }
      setQuoteSource(null);
    } catch {
      setQuoteSource(null);
    } finally {
      setFetchingQuote(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (asset: PortfolioAsset) => {
    triggerHaptic('light');
    setEditingAssetId(asset.id);
    setFormClass(asset.assetClass);
    setFormName(asset.name);
    setFormSymbol(asset.symbol || '');
    setFormInstitution(asset.institution || '');
    setFormQuantity(String(asset.quantity));
    setFormUnit(asset.unit);
    setFormBuyPrice(formatRupiahInput(asset.buyPrice));
    setFormCurrentPrice(formatRupiahInput(asset.currentPrice));
    setFormNotes(asset.notes || '');
    setQuoteSource(null);
    lastFetchedKeyRef.current = `${asset.assetClass}:${asset.symbol || ''}:${asset.name}`;
    setError(null);
    setModalOpen(true);
  };

  // Debounced auto-fetch live quote as user types ticker or asset name
  React.useEffect(() => {
    if (!modalOpen) return;
    if (formClass !== 'emas' && formClass !== 'saham' && formClass !== 'kripto' && formClass !== 'reksadana') {
      return;
    }

    const cleanSymbol = formSymbol.trim();
    const cleanName = formName.trim();
    if (!cleanSymbol && !cleanName) {
      return;
    }

    const currentKey = `${formClass}:${cleanSymbol}:${cleanName}`;
    if (lastFetchedKeyRef.current === currentKey) {
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      setFetchingQuote(true);
      try {
        const params = new URLSearchParams({
          assetClass: formClass,
          symbol: cleanSymbol,
          name: cleanName,
        });
        const res = await fetch(`/api/market/quote?${params.toString()}`);
        if (!isCancelled && res.ok) {
          const data = await res.json();
          const quote = data?.quote;
          if (quote?.priceIdr) {
            lastFetchedKeyRef.current = currentKey;
            setFormCurrentPrice(formatRupiahInput(quote.priceIdr));
            setFormBuyPrice((prev) => (!prev || prev === '0' ? formatRupiahInput(quote.priceIdr) : prev));
            setQuoteSource(quote.source || 'Live Market');
            setError(null);
          } else {
            setQuoteSource(null);
          }
        } else if (!isCancelled) {
          setQuoteSource(null);
        }
      } catch {
        if (!isCancelled) setQuoteSource(null);
      } finally {
        if (!isCancelled) {
          setFetchingQuote(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [modalOpen, formClass, formSymbol, formName]);

  // Trigger bulk refresh of live prices
  const handleRefreshAllLivePrices = async () => {
    if (refreshingLive || assets.length === 0) return;
    setRefreshingLive(true);
    setRefreshNotice(null);
    triggerHaptic('medium');

    try {
      const res = await refreshPortfolioLivePrices();
      if (res.success && res.assets) {
        setAssets(res.assets);
        onAssetChange?.(res.assets);
        triggerHaptic('success');
        const count = res.updatedCount ?? 0;
        setRefreshNotice(
          isId
            ? `${count} aset berhasil diperbarui dengan harga live pasar.`
            : `${count} assets successfully synced with live market prices.`
        );
        setTimeout(() => setRefreshNotice(null), 5000);
      } else {
        triggerHaptic('warning');
        setRefreshNotice(res.error || (isId ? 'Gagal sinkronisasi harga live' : 'Failed to sync live prices'));
      }
    } catch {
      setRefreshNotice(isId ? 'Terjadi kesalahan saat sinkronisasi' : 'Error during price sync');
    } finally {
      setRefreshingLive(false);
    }
  };

  // Open Revaluation Modal
  const handleOpenRevalue = (asset: PortfolioAsset) => {
    triggerHaptic('light');
    setRevalAsset(asset);
    setRevalNewPrice(formatRupiahInput(asset.currentPrice));
    setError(null);
  };

  // Submit Add / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError(isId ? 'Nama aset wajib diisi' : 'Asset name required');
      triggerHaptic('warning');
      return;
    }

    const qty = parseFloat(formQuantity.replace(',', '.'));
    if (Number.isNaN(qty) || qty <= 0) {
      setError(isId ? 'Jumlah unit/kuantitas tidak valid' : 'Invalid quantity');
      triggerHaptic('warning');
      return;
    }

    const buyPrice = parseRupiahInput(formBuyPrice);
    const currentPrice = parseRupiahInput(formCurrentPrice);

    setLoading(true);
    setError(null);
    triggerHaptic('medium');

    const res = await savePortfolioAsset({
      id: editingAssetId || undefined,
      name: formName,
      symbol: formSymbol.trim() || undefined,
      assetClass: formClass,
      quantity: qty,
      unit: formUnit,
      buyPrice,
      currentPrice: currentPrice || buyPrice,
      institution: formInstitution,
      notes: formNotes,
    });

    setLoading(false);

    if (res.success && res.assets) {
      triggerHaptic('success');
      setAssets(res.assets);
      onAssetChange?.(res.assets);
      setModalOpen(false);
    } else {
      triggerHaptic('warning');
      setError(res.error || (isId ? 'Gagal menyimpan aset' : 'Failed to save asset'));
    }
  };

  // Submit Revaluation
  const handleSubmitRevalue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revalAsset) return;

    const newPrice = parseRupiahInput(revalNewPrice);
    setLoading(true);
    setError(null);
    triggerHaptic('medium');

    const res = await revaluePortfolioAsset(revalAsset.id, newPrice);
    setLoading(false);

    if (res.success) {
      triggerHaptic('success');
      const updated = assets.map((a) =>
        a.id === revalAsset.id ? { ...a, currentPrice: newPrice } : a
      );
      setAssets(updated);
      onAssetChange?.(updated);
      setRevalAsset(null);
    } else {
      triggerHaptic('warning');
      setError(res.error || (isId ? 'Gagal update harga' : 'Failed to update price'));
    }
  };

  // Delete Asset
  const handleDelete = async (id: string) => {
    setLoading(true);
    triggerHaptic('warning');
    const res = await deletePortfolioAsset(id);
    setLoading(false);
    setConfirmDeleteId(null);

    if (res.success) {
      triggerHaptic('success');
      const updated = assets.filter((a) => a.id !== id);
      setAssets(updated);
      onAssetChange?.(updated);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* ─── Portfolio Metrics Master Card ─── */}
      <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_#000] text-black dark:text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black dark:border-neutral-700 pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 border-2 border-black rounded-none bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                <Coins className="w-4 h-4 stroke-[2.5px]" />
              </span>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
                {isId ? 'Portofolio Aset & Investasi' : 'Asset & Investment Portfolio'}
              </h3>
            </div>
            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
              {isId
                ? 'Statistik Real-Time Emas • Saham • Kripto • Reksadana'
                : 'Real-Time Stats Gold • Stocks • Crypto • Mutual Funds'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRefreshAllLivePrices}
              disabled={refreshingLive || assets.length === 0}
              className="flex-1 sm:flex-none px-3.5 py-2 border-2 border-black dark:border-neutral-700 rounded-none text-xs font-black uppercase tracking-wider bg-white dark:bg-neutral-800 text-black dark:text-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
              title={isId ? 'Sinkronkan harga pasar terkini tanpa API key' : 'Sync live market quotes'}
            >
              <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5px] ${refreshingLive ? 'animate-spin' : ''}`} />
              <span>{refreshingLive ? (isId ? 'Sinkron...' : 'Syncing...') : (isId ? 'Update Harga Live' : 'Live Quotes')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('emas')}
              className="flex-1 sm:flex-none px-3.5 py-2 border-2 border-black rounded-none text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: 'var(--theme-accent, #FFE066)',
                color: 'var(--theme-accent-text, #000000)',
              }}
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              <span>{isId ? 'Tambah Aset' : 'Add Asset'}</span>
            </button>
          </div>
        </div>

        {refreshNotice && (
          <div className="mt-3 p-2.5 bg-[#bbf7d0] dark:bg-emerald-950/80 border-2 border-black text-black dark:text-emerald-200 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[3px]" />
            <span>{refreshNotice}</span>
          </div>
        )}

        {/* Market Benchmark Strip */}
        {benchmarks && (
          <div className="mt-4 p-2.5 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] flex flex-wrap items-center justify-between gap-2.5 text-xs font-black uppercase">
            <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
              <Zap className="w-3.5 h-3.5 stroke-[2.5px] text-[#FFE066]" />
              <span className="text-[10px] tracking-wider">{isId ? 'Pasar Terkini:' : 'Live Market:'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-neutral-500 dark:text-neutral-400">EMAS:</span>
                <span className="text-black dark:text-white font-mono">{formatRupiah(benchmarks.goldIdrPerGram)}/g</span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <div className="flex items-center gap-1">
                <span className="text-neutral-500 dark:text-neutral-400">IHSG:</span>
                <span className="text-black dark:text-white font-mono">{benchmarks.ihsg.toLocaleString('id-ID')}</span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <div className="flex items-center gap-1">
                <span className="text-neutral-500 dark:text-neutral-400">USD/IDR:</span>
                <span className="text-black dark:text-white font-mono">{formatRupiah(benchmarks.usdIdr)}</span>
              </div>
              <span className="text-neutral-300 dark:text-neutral-600">•</span>
              <div className="flex items-center gap-1">
                <span className="text-neutral-500 dark:text-neutral-400">BTC/IDR:</span>
                <span className="text-black dark:text-white font-mono">{formatRupiah(benchmarks.btIdr)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Metric Stat Cards ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
              {isId ? 'Total Nilai Terkini' : 'Current Market Value'}
            </p>
            <p className="text-base sm:text-lg font-black text-black dark:text-white mt-1 truncate">
              {maskBalance(formatRupiah(metrics.totalCurrent))}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
              {isId ? 'Total Modal Beli' : 'Invested Capital'}
            </p>
            <p className="text-base sm:text-lg font-black text-neutral-700 dark:text-neutral-300 mt-1 truncate">
              {maskBalance(formatRupiah(metrics.totalInvested))}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1">
              {metrics.netProfitRp >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 stroke-[3px]" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />
              )}
              {isId ? 'Keuntungan / Kerugian' : 'Unrealized PnL'}
            </p>
            <p
              className={`text-base sm:text-lg font-black mt-1 truncate ${
                metrics.netProfitRp >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {metrics.netProfitRp > 0 ? '+' : ''}
              {maskBalance(formatRupiah(metrics.netProfitRp))}
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 rounded-none shadow-[2px_2px_0px_0px_#000]">
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">
              {isId ? 'Imbal Hasil (%)' : 'Return Rate'}
            </p>
            <p
              className={`text-base sm:text-lg font-black mt-1 truncate ${
                metrics.netProfitPct >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {metrics.netProfitPct > 0 ? '+' : ''}
              {metrics.netProfitPct.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* ─── Asset Allocation Mini Bar ─── */}
        {metrics.totalCurrent > 0 && (
          <div className="mt-4 pt-3 border-t-2 border-neutral-100 dark:border-neutral-800 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
              {isId ? 'Distribusi Alokasi Portofolio' : 'Asset Allocation'}
            </span>
            <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-800 rounded-none overflow-hidden flex border border-black">
              {(Object.keys(ASSET_CLASS_META) as AssetClass[]).map((ac) => {
                const val = metrics.classDistribution[ac] || 0;
                if (val <= 0) return null;
                const pct = (val / metrics.totalCurrent) * 100;
                const colors: Record<AssetClass, string> = {
                  emas: 'bg-amber-400',
                  saham: 'bg-blue-500',
                  reksadana: 'bg-purple-500',
                  kripto: 'bg-orange-500',
                  properti: 'bg-emerald-500',
                  lainnya: 'bg-neutral-500',
                };
                return (
                  <div
                    key={ac}
                    style={{ width: `${pct}%` }}
                    className={`${colors[ac]} h-full transition-all`}
                    title={`${isId ? ASSET_CLASS_META[ac].labelId : ASSET_CLASS_META[ac].labelEn}: ${pct.toFixed(1)}%`}
                  />
                );
              })}
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
              {(Object.keys(ASSET_CLASS_META) as AssetClass[]).map((ac) => {
                const val = metrics.classDistribution[ac] || 0;
                if (val <= 0) return null;
                const pct = (val / metrics.totalCurrent) * 100;
                return (
                  <span
                    key={ac}
                    className="flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 border border-black rounded-none shadow-[1px_1px_0px_0px_#000]"
                  >
                    <span>{isId ? ASSET_CLASS_META[ac].labelId : ASSET_CLASS_META[ac].labelEn}:</span>
                    <span className="font-black">{pct.toFixed(1)}%</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Class Filter Chips ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setSelectedFilter('all');
          }}
          className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-none text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer shrink-0 transition-all ${
            selectedFilter === 'all'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
          }`}
        >
          {isId ? 'Semua Aset' : 'All Assets'} ({assets.length})
        </button>

        {(Object.keys(ASSET_CLASS_META) as AssetClass[]).map((ac) => {
          const meta = ASSET_CLASS_META[ac];
          const count = assets.filter((a) => a.assetClass === ac).length;
          const Icon = meta.icon;
          return (
            <button
              key={ac}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedFilter(ac);
              }}
              className={`px-3 py-1.5 border-2 border-black dark:border-neutral-700 rounded-none text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer shrink-0 flex items-center gap-1.5 transition-all ${
                selectedFilter === ac
                  ? 'bg-[#FFE066] text-black font-black'
                  : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span>{isId ? meta.labelId : meta.labelEn}</span>
              <span className="text-[10px] opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ─── Assets Grid ─── */}
      {filteredAssets.length === 0 ? (
        <div className="brutal-card p-12 text-center bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[4px_4px_0px_0px_#000] flex flex-col items-center justify-center gap-3">
          <div className="p-4 border-2 border-black rounded-none bg-[#FFE066] text-black shadow-[2px_2px_0px_0px_#000]">
            <Coins className="w-8 h-8 stroke-[2.5px]" />
          </div>
          <h4 className="text-base font-black uppercase tracking-wider text-black dark:text-white">
            {isId ? 'Belum Ada Aset Portofolio' : 'No Portfolio Assets Yet'}
          </h4>
          <p className="text-xs font-bold text-neutral-500 max-w-sm uppercase">
            {isId
              ? 'Catat tabungan emas, kepemilikan saham, reksadana, aset kripto, atau properti untuk melacak kekayaan bersih secara akurat.'
              : 'Record your gold, stocks, mutual funds, crypto holdings, or properties to track comprehensive net worth.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenAdd(selectedFilter === 'all' ? 'emas' : selectedFilter)}
            className="mt-2 px-4 py-2 border-2 border-black rounded-none text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)', color: '#000' }}
          >
            + {isId ? 'Tambah Aset Sekarang' : 'Add Asset Now'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const meta = ASSET_CLASS_META[asset.assetClass] || ASSET_CLASS_META.lainnya;
            const Icon = meta.icon;

            const invested = asset.buyPrice * asset.quantity;
            const current = asset.currentPrice * asset.quantity;
            const profitRp = current - invested;
            const profitPct = invested > 0 ? (profitRp / invested) * 100 : 0;
            const isProfit = profitRp >= 0;

            return (
              <div
                key={asset.id}
                className="brutal-card p-4 sm:p-5 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[3px_3px_0px_0px_#000] text-black dark:text-white flex flex-col justify-between gap-3 relative"
              >
                <div>
                  {/* Top Bar: Badge & Action Buttons */}
                  <div className="flex items-center justify-between gap-2 border-b-2 border-neutral-100 dark:border-neutral-800 pb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 ${meta.borderBadge} ${meta.bgBadge} ${meta.textColor} text-[10px] font-black uppercase rounded-none shadow-[1px_1px_0px_0px_#000]`}
                      >
                        <Icon className="w-3 h-3 stroke-[2.5px]" />
                        <span>{isId ? meta.labelId : meta.labelEn}</span>
                      </span>

                      {asset.symbol && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-black dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white rounded-none">
                          {asset.symbol}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenRevalue(asset)}
                        title={isId ? 'Perbarui Harga Terkini' : 'Update Current Price'}
                        className="p-1.5 border-2 border-black dark:border-neutral-700 rounded-none bg-neutral-100 dark:bg-neutral-800 hover:bg-[#FFE066] hover:text-black cursor-pointer shadow-[1px_1px_0px_0px_#000] transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 stroke-[2.5px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(asset)}
                        title={isId ? 'Edit Aset' : 'Edit Asset'}
                        className="p-1.5 border-2 border-black dark:border-neutral-700 rounded-none bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 cursor-pointer shadow-[1px_1px_0px_0px_#000] transition-colors"
                      >
                        <Edit2 className="w-3 h-3 stroke-[2.5px]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(confirmDeleteId === asset.id ? null : asset.id)}
                        title={isId ? 'Hapus Aset' : 'Delete Asset'}
                        className="p-1.5 border-2 border-black dark:border-neutral-700 rounded-none bg-neutral-100 dark:bg-neutral-800 hover:bg-red-500 hover:text-white cursor-pointer shadow-[1px_1px_0px_0px_#000] transition-colors"
                      >
                        <Trash2 className="w-3 h-3 stroke-[2.5px]" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation */}
                  {confirmDeleteId === asset.id && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-950/90 border-2 border-black text-black dark:text-white text-xs font-bold flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_#000]">
                      <span className="uppercase text-[10px] font-black text-red-900 dark:text-red-200">
                        {isId ? 'Hapus aset ini?' : 'Delete asset?'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDelete(asset.id)}
                          className="px-2 py-0.5 bg-red-600 text-white border border-black text-[10px] font-black uppercase cursor-pointer"
                        >
                          {isId ? 'Ya' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 bg-white text-black border border-black text-[10px] font-black uppercase cursor-pointer"
                        >
                          {isId ? 'Batal' : 'No'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Asset Title & Platform */}
                  <div className="mt-2.5">
                    <h4 className="font-black text-sm uppercase tracking-wider truncate">
                      {asset.name}
                    </h4>
                    <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
                      <span>{asset.institution || (isId ? 'Pribadi / Fisik' : 'Direct')}</span>
                      <span>•</span>
                      <span>
                        {asset.quantity} {asset.unit}
                      </span>
                    </p>
                  </div>

                  {/* Financial Values */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-[#FAF9F5] dark:bg-neutral-800/70 border-2 border-black dark:border-neutral-700 rounded-none text-left shadow-[1px_1px_0px_0px_#000]">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-neutral-500 block">
                        {isId ? 'Harga Beli Rata²' : 'Avg Buy Price'}
                      </span>
                      <span className="text-xs font-black truncate block mt-0.5">
                        {maskBalance(formatRupiah(asset.buyPrice))}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-neutral-500 block">
                        {isId ? 'Harga Terkini' : 'Current Price'}
                      </span>
                      <span className="text-xs font-black truncate block mt-0.5 text-blue-600 dark:text-blue-400">
                        {maskBalance(formatRupiah(asset.currentPrice))}
                      </span>
                    </div>
                  </div>

                  {asset.lastPriceUpdate && (
                    <div className="mt-1 text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest text-right">
                      Live: {new Date(asset.lastPriceUpdate).toLocaleTimeString()}
                    </div>
                  )}
                </div>

                {/* Bottom Strip: Total Value & PnL */}
                <div className="pt-2 border-t-2 border-neutral-200 dark:border-neutral-800 flex justify-between items-end">
                  <div>
                    <span className="text-[9px] font-black uppercase text-neutral-500 block">
                      {isId ? 'Total Nilai' : 'Total Value'}
                    </span>
                    <span className="text-sm font-black truncate block">
                      {maskBalance(formatRupiah(current))}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-black ${
                        isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}
                      {profitPct.toFixed(1)}%
                    </span>
                    <span className="text-[9px] font-bold text-neutral-500 block">
                      {isProfit ? '+' : ''}
                      {maskBalance(formatRupiah(profitRp))}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Modal Tambah / Edit Aset ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="brutal-card w-full max-w-lg bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[6px_6px_0px_0px_#000] text-black dark:text-white flex flex-col overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b-2 border-black dark:border-neutral-700 flex justify-between items-center bg-[#FAF9F5] dark:bg-neutral-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 border-2 border-black rounded-none bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  <Coins className="w-4 h-4 stroke-[2.5px]" />
                </span>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  {editingAssetId
                    ? isId
                      ? 'Edit Aset Portofolio'
                      : 'Edit Portfolio Asset'
                    : isId
                    ? 'Tambah Aset Portofolio'
                    : 'Add Portfolio Asset'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 border-2 border-black dark:border-neutral-700 rounded-none hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
              >
                <X className="w-4 h-4 stroke-[2.5px]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {error && (
                <div className="p-2.5 bg-red-100 dark:bg-red-950/70 border-2 border-black dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-black uppercase rounded-none flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5px]" />
                  <span>{error}</span>
                </div>
              )}

              {/* Asset Class Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  {isId ? 'Kategori Aset' : 'Asset Class'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(ASSET_CLASS_META) as AssetClass[]).map((ac) => {
                    const meta = ASSET_CLASS_META[ac];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={ac}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setFormClass(ac);
                          if (!editingAssetId) {
                            setFormUnit(meta.defaultUnit);
                            let nextSymbol = '';
                            let nextName = '';
                            if (ac === 'emas') {
                              nextSymbol = 'XAU';
                              nextName = 'Emas Murni';
                            } else if (ac === 'kripto') {
                              nextSymbol = 'BTC';
                              nextName = 'Bitcoin';
                            } else if (ac === 'saham') {
                              nextSymbol = 'BBCA';
                              nextName = 'Bank Central Asia';
                            } else if (ac === 'reksadana') {
                              nextSymbol = 'BRK11';
                              nextName = 'AXA Saham Dinamis';
                            }
                            setFormSymbol(nextSymbol);
                            setFormName(nextName);
                            setFormBuyPrice('');
                            setFormCurrentPrice('');
                            setQuoteSource(null);
                            if (nextSymbol || nextName) {
                              fetchLiveQuoteNow(ac, nextSymbol, nextName);
                            }
                          }
                        }}
                        className={`p-2 border-2 border-black dark:border-neutral-700 rounded-none text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000] ${
                          formClass === ac
                            ? 'bg-[#FFE066] text-black font-black'
                            : 'bg-white dark:bg-neutral-800 text-black dark:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 stroke-[2.5px]" />
                        <span>{isId ? meta.labelId : meta.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Asset Name & Ticker Symbol */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {isId ? 'Nama Aset' : 'Asset Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formClass === 'emas'
                        ? 'Antam Logam Mulia'
                        : formClass === 'saham'
                        ? 'Bank Central Asia'
                        : formClass === 'reksadana'
                        ? 'Sucorinvest Stable Fund'
                        : formClass === 'kripto'
                        ? 'Bitcoin'
                        : 'Nama Aset'
                    }
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                      {isId ? 'Ticker / Simbol' : 'Ticker / Symbol'}
                    </label>
                    <div className="flex items-center gap-1.5">
                      {fetchingQuote && (
                        <span className="text-[9px] font-black uppercase text-amber-500 dark:text-amber-400 flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          <span>{isId ? 'Sinkron harga...' : 'Fetching...'}</span>
                        </span>
                      )}
                      {!fetchingQuote && quoteSource && (
                        <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3px]" />
                          <span>{isId ? 'Harga Live' : 'Live Quote'}</span>
                        </span>
                      )}
                      {!fetchingQuote && !quoteSource && (
                        <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                          {isId ? 'Auto-Sync' : 'Auto-Sync'}
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder={
                      formClass === 'emas'
                        ? 'XAU / EMAS'
                        : formClass === 'saham'
                        ? 'BBCA atau BBCA.JK'
                        : formClass === 'kripto'
                        ? 'BTC atau ETH'
                        : 'Simbol / Kode'
                    }
                    value={formSymbol}
                    onChange={(e) => setFormSymbol(e.target.value.toUpperCase())}
                    className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none uppercase"
                  />

                  {/* Quick-select chips */}
                  {formClass === 'kripto' && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['BTC', 'ETH', 'SOL', 'BNB', 'DOGE', 'XRP'].map((coin) => (
                        <button
                          key={coin}
                          type="button"
                          onClick={() => {
                            setFormSymbol(coin);
                            let coinName = 'Bitcoin';
                            if (coin === 'ETH') coinName = 'Ethereum';
                            else if (coin === 'SOL') coinName = 'Solana';
                            else if (coin === 'BNB') coinName = 'BNB';
                            else if (coin === 'DOGE') coinName = 'Dogecoin';
                            else if (coin === 'XRP') coinName = 'XRP';
                            setFormName(coinName);
                            fetchLiveQuoteNow('kripto', coin, coinName);
                          }}
                          className={`px-1.5 py-0.5 border text-[9px] font-black uppercase rounded-none cursor-pointer transition-all ${
                            formSymbol === coin
                              ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white dark:bg-neutral-800 text-black dark:text-white border-black dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {coin}
                        </button>
                      ))}
                    </div>
                  )}

                  {formClass === 'saham' && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { s: 'BBCA', n: 'Bank Central Asia' },
                        { s: 'BBRI', n: 'Bank Rakyat Indonesia' },
                        { s: 'BMRI', n: 'Bank Mandiri' },
                        { s: 'TLKM', n: 'Telkom Indonesia' },
                        { s: 'ASII', n: 'Astra International' },
                        { s: 'BBNI', n: 'Bank Negara Indonesia' },
                      ].map((st) => (
                        <button
                          key={st.s}
                          type="button"
                          onClick={() => {
                            setFormSymbol(st.s);
                            setFormName(st.n);
                            fetchLiveQuoteNow('saham', st.s, st.n);
                          }}
                          className={`px-1.5 py-0.5 border text-[9px] font-black uppercase rounded-none cursor-pointer transition-all ${
                            formSymbol === st.s
                              ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white dark:bg-neutral-800 text-black dark:text-white border-black dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {st.s}
                        </button>
                      ))}
                    </div>
                  )}

                  {formClass === 'emas' && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { s: 'XAU', n: 'Emas Murni' },
                        { s: 'ANTAM', n: 'Antam Logam Mulia' },
                      ].map((g) => (
                        <button
                          key={g.s}
                          type="button"
                          onClick={() => {
                            setFormSymbol(g.s);
                            setFormName(g.n);
                            fetchLiveQuoteNow('emas', g.s, g.n);
                          }}
                          className={`px-1.5 py-0.5 border text-[9px] font-black uppercase rounded-none cursor-pointer transition-all ${
                            formSymbol === g.s
                              ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white dark:bg-neutral-800 text-black dark:text-white border-black dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {g.s}
                        </button>
                      ))}
                    </div>
                  )}

                  {formClass === 'reksadana' && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {[
                        { s: 'BRK11', n: 'AXA Saham Dinamis' },
                        { s: 'SUCOR', n: 'Sucorinvest Stable Fund' },
                        { s: 'BATAVIA', n: 'Batavia Dana Saham' },
                      ].map((r) => (
                        <button
                          key={r.s}
                          type="button"
                          onClick={() => {
                            setFormSymbol(r.s);
                            setFormName(r.n);
                            fetchLiveQuoteNow('reksadana', r.s, r.n);
                          }}
                          className={`px-1.5 py-0.5 border text-[9px] font-black uppercase rounded-none cursor-pointer transition-all ${
                            formSymbol === r.s
                              ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[1px_1px_0px_0px_#000]'
                              : 'bg-white dark:bg-neutral-800 text-black dark:text-white border-black dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                          }`}
                        >
                          {r.s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Institution / Platform */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  {isId ? 'Platform / Lembaga Penyimpan' : 'Platform / Custodian'}
                </label>
                <input
                  type="text"
                  placeholder={
                    formClass === 'emas'
                      ? 'Pegadaian / Brankas Pribadi'
                      : formClass === 'saham'
                      ? 'Ajaib / Stockbit / Mandiri Sekuritas'
                      : formClass === 'reksadana'
                      ? 'Bibit / Bareksa'
                      : formClass === 'kripto'
                      ? 'Indodax / Tokocrypto / Ledger'
                      : 'Fisik'
                  }
                  value={formInstitution}
                  onChange={(e) => setFormInstitution(e.target.value)}
                  className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {isId ? 'Jumlah / Kuantitas' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.00000001"
                    placeholder="10"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {isId ? 'Satuan' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="gram / lot / unit / koin"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {isId ? 'Harga Beli (per Satuan)' : 'Buy Price (per Unit)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={formBuyPrice}
                    onChange={(e) => setFormBuyPrice(formatRupiahInput(e.target.value))}
                    className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                    {isId ? 'Harga Terkini (per Satuan)' : 'Current Price (per Unit)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={formCurrentPrice}
                    onChange={(e) => setFormCurrentPrice(formatRupiahInput(e.target.value))}
                    className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                  />
                </div>
              </div>

              {/* Real-time Dynamic Calculation Preview */}
              {(() => {
                const previewQty = parseFloat(formQuantity) || 0;
                const previewBuy = parseRupiahInput(formBuyPrice) || 0;
                const previewCur = parseRupiahInput(formCurrentPrice) || 0;
                const previewTotalVal = previewQty * previewCur;
                const previewTotalCost = previewQty * previewBuy;
                const previewProfit = previewTotalVal - previewTotalCost;
                const previewPct = previewTotalCost > 0 ? (previewProfit / previewTotalCost) * 100 : 0;

                if (previewQty <= 0 || previewCur <= 0) return null;

                return (
                  <div className="p-2.5 bg-neutral-100 dark:bg-neutral-800/90 border-2 border-black dark:border-neutral-700 rounded-none flex items-center justify-between text-xs shadow-[2px_2px_0px_0px_#000]">
                    <div>
                      <span className="text-[9px] font-black uppercase text-neutral-500 block">
                        {isId ? 'Total Nilai Pasar' : 'Total Market Value'}
                      </span>
                      <span className="font-black text-sm text-black dark:text-white font-mono">
                        {formatRupiah(previewTotalVal)}
                      </span>
                      <span className="text-[9px] font-bold text-neutral-500 block">
                        {formQuantity} {formUnit} × {formatRupiah(previewCur)}
                      </span>
                    </div>
                    {previewTotalCost > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-neutral-500 block">
                          {isId ? 'Estimasi Untung/Rugi' : 'Estimated P/L'}
                        </span>
                        <span
                          className={`font-black text-xs font-mono ${
                            previewProfit >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {previewProfit >= 0 ? '+' : ''}
                          {formatRupiah(previewProfit)} ({previewProfit >= 0 ? '+' : ''}
                          {previewPct.toFixed(1)}%)
                        </span>
                        <span className="text-[9px] font-bold text-neutral-500 block">
                          {isId ? 'Modal' : 'Cost'}: {formatRupiah(previewTotalCost)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Optional Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  {isId ? 'Catatan (Opsional)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="Target investasi jangka panjang 5 tahun"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full brutal-input p-2.5 text-xs font-bold bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-black dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border-2 border-black rounded-none text-xs font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[#FFE066] text-black border-2 border-black rounded-none text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3px]" />}
                  <span>{loading ? (isId ? 'Menyimpan...' : 'Saving...') : (isId ? 'Simpan Aset' : 'Save Asset')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Revaluasi Cepat ─── */}
      {revalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="brutal-card w-full max-w-sm bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none shadow-[6px_6px_0px_0px_#000] text-black dark:text-white p-5 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-black dark:border-neutral-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 border-2 border-black rounded-none bg-[#FFE066] text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5px]" />
                </span>
                <h4 className="text-sm font-black uppercase tracking-wider">
                  {isId ? 'Update Harga Pasar' : 'Revalue Asset'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRevalAsset(null)}
                className="p-1 border-2 border-black rounded-none cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[2.5px]" />
              </button>
            </div>

            <div>
              <p className="text-xs font-black uppercase truncate">{revalAsset.name}</p>
              <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                {revalAsset.quantity} {revalAsset.unit}
              </p>
            </div>

            <form onSubmit={handleSubmitRevalue} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">
                  {isId ? 'Harga Terkini per Satuan' : 'New Current Price'}
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={revalNewPrice}
                  onChange={(e) => setRevalNewPrice(formatRupiahInput(e.target.value))}
                  className="w-full brutal-input p-2.5 text-sm font-black bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevalAsset(null)}
                  className="px-3 py-1.5 border-2 border-black rounded-none text-xs font-bold uppercase cursor-pointer"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#bbf7d0] dark:bg-emerald-800 text-black dark:text-white border-2 border-black rounded-none text-xs font-black uppercase shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                  <span>{isId ? 'Simpan' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
