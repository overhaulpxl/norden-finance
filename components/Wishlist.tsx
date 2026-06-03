'use client';

import { useState } from 'react';
import { WishlistItem } from '../types';
import { formatRupiah } from '../lib/format';
import { addWishlistItem, deleteWishlistItem, markWishlistBought } from '../app/actions';
import { Loader2, Trash2, ExternalLink, Clock } from 'lucide-react';

export default function Wishlist({ items }: { items: WishlistItem[] }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [url, setUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('cash');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setLoading(true);
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10);
    
    await addWishlistItem(name, numericAmount, url);
    setName('');
    setAmount('');
    setUrl('');
    setShowForm(false);
    setLoading(false);
  };

  const handleBuy = async (id: string) => {
    setLoading(true);
    await markWishlistBought(id, selectedMethod);
    setLoading(false);
  };

  const now = new Date();

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
        <h3 className="text-lg font-black text-black uppercase tracking-wider">Impulse Control (Wishlist)</h3>
        <button onClick={() => setShowForm(!showForm)} className="brutal-btn-light text-xs px-4 py-2 cursor-pointer">
          {showForm ? 'Cancel' : '+ New Item'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 border-[3px] border-black bg-white p-4 space-y-4 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <input type="text" placeholder="Item Name (e.g. Shoes)" value={name} onChange={e => setName(e.target.value)} className="w-full brutal-input px-4 py-2.5 text-sm font-bold uppercase" required />
          <input type="text" placeholder="Price" value={amount} onChange={e => setAmount(e.target.value)} className="w-full brutal-input px-4 py-2.5 text-sm font-bold" required />
          <input type="url" placeholder="Store Link (Optional)" value={url} onChange={e => setUrl(e.target.value)} className="w-full brutal-input px-4 py-2.5 text-sm font-bold" />
          <p className="text-xs font-bold text-neutral-600">Barang ini akan dikunci dalam masa tunggu (cooldown) 3 hari untuk menahan keinginan belanja impulsif.</p>
          <button type="submit" disabled={loading} className="w-full brutal-btn py-3 flex justify-center items-center cursor-pointer">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : 'Save & Start Timer'}
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <div className="text-neutral-400 font-bold text-sm py-8 text-center bg-white border-[3px] border-black border-dashed rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">No items in wishlist.</div>
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
                      <select 
                        value={selectedMethod} 
                        onChange={e => setSelectedMethod(e.target.value)} 
                        className="brutal-input px-2 py-1.5 text-xs w-28 font-black uppercase"
                      >
                        <option value="cash">CASH</option>
                        <option value="bca">BCA</option>
                        <option value="bni">BNI</option>
                        <option value="dana">DANA</option>
                        <option value="gopay">GoPay</option>
                        <option value="ovo">OVO</option>
                      </select>
                      <button 
                        onClick={() => handleBuy(item.id)}
                        disabled={loading}
                        className="brutal-btn px-4 py-1.5 text-xs font-black uppercase cursor-pointer"
                      >
                        {loading ? '...' : 'Beli'}
                      </button>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => deleteWishlistItem(item.id)}
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
