'use client';

import { useMemo, useState } from 'react';
import { Balance, WishlistItem } from '../types';
import { formatRupiah } from '../lib/format';
import { addWishlistItem, deleteWishlistItem, markWishlistBought } from '../app/actions';
import { Loader2, Trash2, ExternalLink, Clock } from 'lucide-react';
import WalletSelect, { getActiveWallets } from './WalletSelect';

export default function Wishlist({ items, balances = [] }: { items: WishlistItem[]; balances?: Balance[] }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [url, setUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const activeWallets = useMemo(() => getActiveWallets(balances), [balances]);
  const currentSelectedMethod = activeWallets.some((wallet) => wallet.name === selectedMethod)
    ? selectedMethod
    : activeWallets[0]?.name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setLoading(true);
    setSuccess(null);
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10);

    const res = await addWishlistItem(name, numericAmount, url);
    if (res.success) {
      setName('');
      setAmount('');
      setUrl('');
      setShowForm(false);
      setSuccess('Wishlist berhasil ditambahkan!');
      setTimeout(() => setSuccess(null), 5000);
    }
    setLoading(false);
  };

  const handleBuy = async (id: string) => {
    setLoading(true);
    setSuccess(null);
    const res = await markWishlistBought(id, currentSelectedMethod);
    if (res.success) {
      setSuccess('Wishlist berhasil dibeli dan transaksi dicatat!');
      setTimeout(() => setSuccess(null), 5000);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus wishlist ini?')) {
      setSuccess(null);
      const res = await deleteWishlistItem(id);
      if (res.success) {
        setSuccess('Wishlist berhasil dihapus!');
        setTimeout(() => setSuccess(null), 5000);
      }
    }
  };

  const now = new Date();

  return (
    <div className="brutal-card p-6 bg-white select-none space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[3px] border-black pb-4 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-black uppercase tracking-wider">
            Wishlist & Cooldown Belanja
          </h3>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-0.5">
            Masa tunggu 3 hari untuk menahan keinginan belanja impulsif
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="brutal-btn-accent text-xs px-4 py-2 cursor-pointer shrink-0"
        >
          {showForm ? 'Batal' : '+ Tambah Wishlist'}
        </button>
      </div>

      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border-[3px] border-black bg-[#FAF9F5] p-5 space-y-3.5 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Nama Barang</label>
            <input type="text" placeholder="Contoh: Sepatu Olahraga" value={name} onChange={e => setName(e.target.value)} className="w-full brutal-input px-3.5 py-2 text-xs font-bold uppercase" required />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Perkiraan Harga (Rp)</label>
            <input type="text" placeholder="Contoh: 750000" value={amount} onChange={e => setAmount(e.target.value)} className="w-full brutal-input px-3.5 py-2 text-xs font-bold" required />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-black mb-1">Link Toko (Opsional)</label>
            <input type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="w-full brutal-input px-3.5 py-2 text-xs font-bold" />
          </div>
          <p className="text-[11px] font-bold text-neutral-600 bg-white border border-black p-2.5">
            Barang yang ditambahkan akan dikunci selama 3 hari sebagai periode pertimbangan sebelum dicatat sebagai pembelian.
          </p>
          <button type="submit" disabled={loading} className="w-full brutal-btn py-3 text-xs font-black uppercase tracking-wider flex justify-center items-center cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Simpan & Mulai Timer Cooldown'}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white border-[3px] border-dashed border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center px-4">
          <div className="p-2 border-[2px] border-black bg-[#FFE066] mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-black">🛍️</span>
          </div>
          <p className="text-sm font-black text-black uppercase tracking-wider">Belum ada barang di wishlist</p>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">Gunakan wishlist sebagai masa cooldown 3 hari untuk mencegah belanja impulsif.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            + Tambah Wishlist
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const unlockDate = item.unlockDate ? new Date(item.unlockDate) : new Date();
            const isLocked = item.status === 'locked' && now < unlockDate;
            const diffTime = Math.abs(unlockDate.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return (
              <div key={item.id} className={`relative p-4 border-[2px] border-black rounded-none flex flex-col group transition-all bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${item.status === 'bought' ? 'opacity-60 bg-neutral-50 shadow-none border-neutral-300' : isLocked ? 'bg-white' : 'bg-[#bbf7d0] border-black'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-base font-black uppercase tracking-wider block ${item.status === 'bought' ? 'line-through text-neutral-400' : 'text-black'}`}>
                      {item.name}
                    </span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-black mt-1 transition-colors uppercase tracking-wider">
                        <ExternalLink className="w-3 h-3 stroke-[2.5px]" /> Link Toko
                      </a>
                    )}
                  </div>
                  <span className={`text-base font-black tracking-wider ${item.status === 'bought' ? 'text-neutral-400' : 'text-black'}`}>{formatRupiah(item.amount)}</span>
                </div>

                {item.status === 'bought' ? (
                  <div className="text-[10px] font-black text-neutral-500 mt-3 pt-3 border-t-[2px] border-black flex items-center gap-1 uppercase tracking-widest">
                    ✓ Sudah Dibeli
                  </div>
                ) : isLocked ? (
                  <div className="mt-3 pt-3 border-t-[2px] border-black flex items-center gap-2 text-amber-700 font-black text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 stroke-[2.5px]" />
                    <span>Masa Tunggu: {diffDays} hari lagi</span>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t-[2px] border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Boleh dibeli! 🎉</span>
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
                        className="brutal-btn px-4 py-1.5 text-xs font-black uppercase cursor-pointer"
                      >
                        {loading ? '...' : 'Beli'}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute right-4 bottom-4 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
