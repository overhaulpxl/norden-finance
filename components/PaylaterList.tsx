'use client';

import { useState } from 'react';
import { Paylater } from '../types';
import { formatRupiah } from '../lib/format';
import { addPaylater, payPaylaterInstallment, deletePaylater } from '../app/actions';
import { Plus, Trash2, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

export default function PaylaterList({ paylaters }: { paylaters: Paylater[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [itemName, setItemName] = useState('');
  const [platform, setPlatform] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [tenorMonths, setTenorMonths] = useState('');
  
  const [payMethod, setPayMethod] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(totalAmount.replace(/\D/g, ''), 10);
    const tenor = parseInt(tenorMonths, 10);
    
    if (!itemName || !platform || !amount || !tenor) return;
    
    setLoading(true);
    await addPaylater(itemName, platform, amount, tenor);
    setShowAdd(false);
    setItemName('');
    setPlatform('');
    setTotalAmount('');
    setTenorMonths('');
    setLoading(false);
  };

  const handlePay = async (id: string) => {
    if (!payMethod.trim()) {
      alert('Masukkan dompet/metode pembayaran');
      return;
    }
    setLoading(true);
    await payPaylaterInstallment(id, payMethod);
    setPayingId(null);
    setPayMethod('');
    setLoading(false);
  };

  const activePaylaters = paylaters.filter(p => !p.isSettled);
  const settledPaylaters = paylaters.filter(p => p.isSettled);

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-lg font-black text-black uppercase tracking-wider">Paylater & Cicilan</h2>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="brutal-btn-light text-xs px-4 py-2 flex items-center gap-2 cursor-pointer"
        >
          {showAdd ? 'Batal' : <><Plus className="w-4 h-4" /> Tambah Cicilan</>}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="mb-6 border-[3px] border-black bg-white p-4 space-y-4 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black mb-1 uppercase tracking-widest">Nama Barang / Transaksi</label>
              <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="e.g. iPhone 15 Pro" className="w-full brutal-input px-4 py-2.5 text-sm font-bold uppercase" required />
            </div>
            <div>
              <label className="block text-xs font-black text-black mb-1 uppercase tracking-widest">Platform</label>
              <input type="text" value={platform} onChange={e => setPlatform(e.target.value)} placeholder="e.g. SPayLater, GoPayLater" className="w-full brutal-input px-4 py-2.5 text-sm font-bold uppercase" required />
            </div>
            <div>
              <label className="block text-xs font-black text-black mb-1 uppercase tracking-widest">Total Harga (Rp)</label>
              <input type="text" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="e.g. 15000000" className="w-full brutal-input px-4 py-2.5 text-sm font-bold" required />
            </div>
            <div>
              <label className="block text-xs font-black text-black mb-1 uppercase tracking-widest">Tenor (Bulan)</label>
              <input type="number" min="1" value={tenorMonths} onChange={e => setTenorMonths(e.target.value)} placeholder="e.g. 12" className="w-full brutal-input px-4 py-2.5 text-sm font-bold" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full brutal-btn py-3 flex justify-center items-center gap-2 cursor-pointer">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : 'Simpan Cicilan'}
          </button>
        </form>
      )}

      {activePaylaters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePaylaters.map(p => {
            const progress = (p.monthsPaid / p.tenorMonths) * 100;
            return (
              <div key={p.id} className="border-[2px] border-black rounded-none p-4 bg-white relative group shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-black text-base uppercase tracking-wider">{p.itemName}</h3>
                    <p className="text-[10px] font-black text-black border-[2px] border-black bg-white px-2 py-0.5 rounded-none inline-block mt-1 uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">{p.platform}</p>
                  </div>
                  <button 
                    onClick={() => deletePaylater(p.id)} 
                    className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Cicilan bulanan</p>
                    <p className="font-black text-black text-lg tracking-wider">{formatRupiah(p.installmentAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total: {formatRupiah(p.totalAmount)}</p>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
                    <span className="text-black">{p.monthsPaid} bulan</span>
                    <span className="text-neutral-400">{p.tenorMonths} bulan</span>
                  </div>
                  <div className="w-full bg-[#f3f4f6] border-[2px] border-black rounded-none h-3 overflow-hidden shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    <div className="bg-[#bfdbfe] h-full rounded-none transition-all duration-500 border-r-[2px] border-black" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {payingId === p.id ? (
                  <div className="flex gap-2 items-center mt-4">
                    <input 
                      type="text" 
                      value={payMethod} 
                      onChange={e => setPayMethod(e.target.value)} 
                      placeholder="Dompet (e.g. bca)" 
                      className="flex-1 brutal-input px-3 py-2 text-xs uppercase font-black" 
                      autoFocus
                    />
                    <button onClick={() => handlePay(p.id)} disabled={loading} className="brutal-btn px-4 py-2 text-xs cursor-pointer">Bayar</button>
                    <button onClick={() => setPayingId(null)} className="brutal-btn-light px-4 py-2 text-xs cursor-pointer">Batal</button>
                  </div>
                ) : (
                  <button onClick={() => setPayingId(p.id)} className="w-full brutal-btn-light py-2 mt-4 flex justify-center items-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer">
                    Bayar Bulan Ini <ChevronRight className="w-4 h-4 stroke-[3px]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {settledPaylaters.length > 0 && (
        <div className="mt-8 pt-6 border-t-[3px] border-black">
          <h3 className="text-sm font-black text-black mb-4 uppercase tracking-wider">Lunas 🎉</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settledPaylaters.map(p => (
              <div key={p.id} className="border-[2px] border-black bg-[#bbf7d0] p-4 rounded-none flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-90">
                <div>
                  <h4 className="font-black text-neutral-600 line-through uppercase tracking-wider">{p.itemName}</h4>
                  <p className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest">{p.platform} • {p.tenorMonths} Bulan</p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-700 w-5 h-5" />
                  <button onClick={() => deletePaylater(p.id)} className="text-neutral-500 hover:text-red-500 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
