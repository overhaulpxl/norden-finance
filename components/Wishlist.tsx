'use client';

import { useMemo, useState } from 'react';
import { Balance, WishlistItem } from '../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../lib/format';
import { addWishlistItem, deleteWishlistItem, markWishlistBought } from '../app/actions';
import { Loader2, Trash2, ExternalLink, Clock } from 'lucide-react';
import WalletSelect, { getActiveWallets } from './WalletSelect';
import { useHideBalance } from '../lib/HideBalanceContext';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';

export default function Wishlist({
  items,
  balances = [],
}: {
  items: WishlistItem[];
  balances?: Balance[];
}) {
  const { lang } = useLanguage();
  const { maskBalance } = useHideBalance();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [url, setUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const activeWallets = useMemo(() => getActiveWallets(balances), [balances]);
  const currentSelectedMethod = activeWallets.some((wallet) => wallet.name === selectedMethod)
    ? selectedMethod
    : activeWallets[0]?.name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseRupiahInput(amount);
    if (!name.trim() || numericAmount <= 0) return;
    setLoading(true);
    setSuccess(null);
    triggerHaptic('medium');

    const res = await addWishlistItem(name.trim(), numericAmount, url.trim() || undefined);
    if (res.success) {
      triggerHaptic('success');
      setName('');
      setAmount('');
      setUrl('');
      setShowForm(false);
      setSuccess(
        lang === 'id' ? 'Wishlist berhasil ditambahkan!' : 'Wishlist item added successfully!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
    }
    setLoading(false);
  };

  const handleBuy = async (id: string) => {
    setLoading(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await markWishlistBought(id, currentSelectedMethod);
    if (res.success) {
      triggerHaptic('success');
      setSuccess(
        lang === 'id'
          ? 'Wishlist berhasil dibeli dan transaksi dicatat!'
          : 'Wishlist item bought and transaction recorded!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    setSuccess(null);
    triggerHaptic('medium');
    const res = await deleteWishlistItem(id);
    setDeleting(false);
    setConfirmDeleteId(null);
    if (res.success) {
      triggerHaptic('success');
      setSuccess(
        lang === 'id' ? 'Wishlist berhasil dihapus!' : 'Wishlist item deleted successfully!'
      );
      setTimeout(() => setSuccess(null), 5000);
    } else {
      triggerHaptic('warning');
    }
  };

  const now = new Date();

  return (
    <div className="brutal-card p-5 sm:p-6 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_#000] text-black dark:text-white select-none space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black dark:border-neutral-700 pb-4 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
            {lang === 'id' ? 'Wishlist & Cooldown Belanja' : 'Wishlist & Cooling-Off Period'}
          </h3>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-0.5">
            {lang === 'id'
              ? 'Masa tunggu 3 hari untuk menahan keinginan belanja impulsif'
              : '3-day cooling-off timer to prevent impulsive shopping'}
          </p>
        </div>
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowForm(!showForm);
          }}
          className="px-4 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer shrink-0 text-black"
          style={{
            backgroundColor: 'var(--theme-accent, #FFE066)',
            color: 'var(--theme-accent-text, #000000)',
          }}
        >
          {showForm
            ? lang === 'id'
              ? 'Batal'
              : 'Cancel'
            : lang === 'id'
            ? '+ Tambah Wishlist'
            : '+ Add Wishlist'}
        </button>
      </div>

      {success && (
        <div className="p-3 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 text-xs font-black uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_#000] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-800 p-5 space-y-3.5 rounded-xl shadow-[3px_3px_0px_0px_#000] text-black dark:text-white"
        >
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              {lang === 'id' ? 'Nama Barang' : 'Item Name'}
            </label>
            <input
              type="text"
              placeholder={lang === 'id' ? 'Contoh: Sepatu Olahraga' : 'E.g.: Running Shoes'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full brutal-input px-3.5 py-2 text-xs font-bold uppercase bg-white dark:bg-neutral-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              {lang === 'id' ? 'Perkiraan Harga (Rp)' : 'Estimated Price (Rp)'}
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 750.000"
              value={amount}
              onChange={(e) => setAmount(formatRupiahInput(e.target.value))}
              className="w-full brutal-input px-3.5 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1">
              {lang === 'id' ? 'Link Toko (Opsional)' : 'Store Link (Optional)'}
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full brutal-input px-3.5 py-2 text-xs font-bold bg-white dark:bg-neutral-900"
            />
          </div>
          <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-black dark:border-neutral-700 p-2.5 rounded-lg">
            {lang === 'id'
              ? 'Barang yang ditambahkan akan dikunci selama 3 hari sebagai periode pertimbangan sebelum dicatat sebagai pembelian.'
              : 'Added items will be locked for 3 days as a deliberation period before you can record them as bought.'}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider flex justify-center items-center shadow-[2px_2px_0px_0px_#000] cursor-pointer disabled:opacity-50 text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : lang === 'id' ? (
              'Simpan & Mulai Timer Cooldown'
            ) : (
              'Save & Start Cooling-Off Timer'
            )}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white dark:bg-neutral-900 border-2 border-dashed border-black dark:border-neutral-700 rounded-2xl shadow-[3px_3px_0px_0px_#000] text-center px-4">
          <div
            className="p-2 border-2 border-black rounded-xl mb-3 shadow-[2px_2px_0px_0px_#000] flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <span className="text-lg font-black text-black">🛍️</span>
          </div>
          <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
            {lang === 'id' ? 'Belum ada barang di wishlist' : 'No items in wishlist yet'}
          </p>
          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
            {lang === 'id'
              ? 'Gunakan wishlist sebagai masa cooldown 3 hari untuk mencegah belanja impulsif.'
              : 'Use the wishlist 3-day cooldown to prevent impulsive purchases.'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 border-2 border-black rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] cursor-pointer text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {lang === 'id' ? '+ Tambah Wishlist' : '+ Add Wishlist'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const unlockDate = item.unlockDate ? new Date(item.unlockDate) : new Date();
            const isLocked = item.status === 'locked' && now < unlockDate;
            const diffTime = Math.abs(unlockDate.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return (
              <div
                key={item.id}
                className={`relative p-4 border-2 border-black dark:border-neutral-700 rounded-xl flex flex-col group transition-all shadow-[2.5px_2.5px_0px_0px_#000] ${
                  item.status === 'bought'
                    ? 'opacity-60 bg-neutral-100 dark:bg-neutral-800'
                    : isLocked
                    ? 'bg-white dark:bg-neutral-800'
                    : 'bg-[#bbf7d0] dark:bg-emerald-950/70 text-black dark:text-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span
                      className={`text-base font-black uppercase tracking-wider block ${
                        item.status === 'bought'
                          ? 'line-through text-neutral-400'
                          : 'text-black dark:text-white'
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-black dark:hover:text-white mt-1 transition-colors uppercase tracking-wider"
                      >
                        <ExternalLink className="w-3 h-3 stroke-[2.5px]" />{' '}
                        {lang === 'id' ? 'Link Toko' : 'Store Link'}
                      </a>
                    )}
                  </div>
                  <span
                    className={`text-base font-black tracking-wider ${
                      item.status === 'bought' ? 'text-neutral-400' : 'text-black dark:text-white'
                    }`}
                  >
                    {maskBalance(formatRupiah(item.amount))}
                  </span>
                </div>

                {item.status === 'bought' ? (
                  <div className="text-[10px] font-black text-neutral-500 mt-3 pt-3 border-t-2 border-black dark:border-neutral-700 flex items-center gap-1 uppercase tracking-widest">
                    ✓ {lang === 'id' ? 'Sudah Dibeli' : 'Purchased'}
                  </div>
                ) : isLocked ? (
                  <div className="mt-3 pt-3 border-t-2 border-black dark:border-neutral-700 flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 stroke-[2.5px]" />
                    <span>
                      {lang === 'id'
                        ? `Masa Tunggu: ${diffDays} hari lagi`
                        : `Cooldown: ${diffDays} days left`}
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t-2 border-black dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                      {lang === 'id' ? 'Boleh dibeli! 🎉' : 'Cooling-off passed! 🎉'}
                    </span>
                    <div className="flex items-center gap-2">
                      <WalletSelect
                        wallets={balances}
                        value={currentSelectedMethod}
                        onChange={setSelectedMethod}
                        className="brutal-input px-2 py-1.5 text-xs w-28 font-black uppercase"
                        required
                      />
                      <button
                        onClick={() => handleBuy(item.id)}
                        disabled={loading || !currentSelectedMethod}
                        className="px-4 py-1.5 border-2 border-black rounded-lg text-xs font-black uppercase shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer text-black"
                        style={{
                          backgroundColor: 'var(--theme-accent, #FFE066)',
                          color: 'var(--theme-accent-text, #000000)',
                        }}
                      >
                        {loading ? '...' : lang === 'id' ? 'Beli' : 'Buy'}
                      </button>
                    </div>
                  </div>
                )}

                {confirmDeleteId === item.id ? (
                  <div className="absolute right-4 bottom-3 flex items-center gap-1.5 bg-white dark:bg-neutral-800 border-2 border-black dark:border-neutral-700 p-1 rounded-lg shadow-[1px_1px_0px_0px_#000]">
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                      {lang === 'id' ? 'Hapus?' : 'Delete?'}
                    </span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => handleDelete(item.id)}
                      className="px-2 py-0.5 bg-red-600 text-white border border-black rounded text-[10px] font-black uppercase hover:bg-red-700 cursor-pointer"
                    >
                      {lang === 'id' ? 'Ya' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white border border-black text-[10px] font-black uppercase hover:bg-neutral-300 rounded cursor-pointer"
                    >
                      {lang === 'id' ? 'Batal' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="absolute right-4 bottom-4 text-neutral-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all p-1.5 cursor-pointer"
                    title={lang === 'id' ? 'Hapus wishlist' : 'Delete item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
