'use client';

import { useState } from 'react';
import { AppSubscription } from '../types';
import { addSubscription, toggleSubscriptionActive, deleteSubscription } from '../app/actions';
import { formatRupiah } from '../lib/format';
import { Trash2, Calendar, CheckSquare, Square } from 'lucide-react';

interface SubscriptionManagerProps {
  subscriptions: AppSubscription[];
  isPro: boolean;
}

export default function SubscriptionManager({ subscriptions }: SubscriptionManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingDay, setBillingDay] = useState('');
  const [method, setMethod] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeSubscriptions = subscriptions.filter(s => s.isActive);
  const totalCost = activeSubscriptions.reduce((sum, s) => sum + s.amount, 0);

  function getBillingStatus(day: number) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let targetDate = new Date(currentYear, currentMonth, day);
    if (currentDay > day) {
      targetDate = new Date(currentYear, currentMonth + 1, day);
    }

    const timeDiff = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Besok';
    return `Dalam ${diffDays} hari (${targetDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`;
  }

  async function handleAddSubscription(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !amount || !billingDay || !method.trim()) {
      setError('Harap isi semua kolom');
      return;
    }

    const amtNum = parseInt(amount, 10);
    const dayNum = parseInt(billingDay, 10);

    if (isNaN(amtNum) || amtNum <= 0) {
      setError('Nominal harus berupa angka positif');
      return;
    }

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      setError('Tanggal tagihan harus antara 1 dan 31');
      return;
    }

    const res = await addSubscription({ name, amount: amtNum, billingDay: dayNum, method });
    if (res.success) {
      setName('');
      setAmount('');
      setBillingDay('');
      setMethod('');
      setShowForm(false);
    } else {
      setError(res.error || 'Gagal menyimpan');
    }
  }

  async function handleToggle(id: string) {
    await toggleSubscriptionActive(id);
  }

  async function handleDelete(id: string) {
    if (confirm('Hapus langganan ini?')) {
      await deleteSubscription(id);
    }
  }

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex justify-between items-center mb-6 border-b-[3px] border-black pb-4">
        <h3 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
          📅 Layanan Langganan
        </h3>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="brutal-btn-light text-xs px-4 py-2 cursor-pointer"
        >
          {showForm ? 'Batal' : 'Tambah'}
        </button>
      </div>

      {/* Summary Box */}
      <div className="p-4 bg-white border-[3px] border-black rounded-none mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Total Biaya Bulanan</p>
        <p className="text-2xl font-black text-black mt-1 tracking-wider">{formatRupiah(totalCost)}</p>
      </div>

      {showForm && (
        <form onSubmit={handleAddSubscription} className="mb-6 p-4 border-[3px] border-black bg-white space-y-4 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          {error && <p className="text-xs font-black text-red-650 uppercase tracking-wider">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-widest">Nama Layanan</label>
              <input 
                type="text" 
                placeholder="e.g. Netflix, Spotify" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full brutal-input p-2 text-xs font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-widest">Nominal per Bulan</label>
              <input 
                type="number" 
                placeholder="Rp" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="w-full brutal-input p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-widest">Tanggal Tagihan (1-31)</label>
              <input 
                type="number" 
                placeholder="e.g. 15" 
                value={billingDay} 
                onChange={e => setBillingDay(e.target.value)}
                className="w-full brutal-input p-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase mb-1 tracking-widest">Dompet Pembayaran</label>
              <select 
                value={method} 
                onChange={e => setMethod(e.target.value)}
                className="w-full brutal-input p-2 text-xs font-black uppercase"
              >
                <option value="">Pilih Wallet</option>
                <option value="dana">DANA</option>
                <option value="gopay">GoPay</option>
                <option value="ovo">OVO</option>
                <option value="bca">BCA</option>
                <option value="bni">BNI</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full brutal-btn py-2 text-xs font-black uppercase tracking-wider cursor-pointer">
            Simpan Langganan
          </button>
        </form>
      )}

      {subscriptions.length === 0 ? (
        <div className="border-[3px] border-black border-dashed p-6 text-center text-neutral-400 font-bold text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider bg-white">
          Belum ada layanan langganan yang dicatat.
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map(s => (
            <div 
              key={s.id} 
              className={`p-4 border-[2px] border-black rounded-none bg-white flex justify-between items-center transition-opacity shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                !s.isActive ? 'opacity-50 bg-neutral-50 shadow-none border-neutral-300' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggle(s.id)}
                  className="text-black hover:scale-105 transition-transform cursor-pointer"
                >
                  {s.isActive ? (
                    <CheckSquare className="w-5 h-5 text-black stroke-[3px]" />
                  ) : (
                    <Square className="w-5 h-5 text-neutral-400 stroke-[3px]" />
                  )}
                </button>
                <div>
                  <h4 className="text-sm font-black text-black uppercase tracking-wider">{s.name}</h4>
                  <p className="text-xs text-neutral-500 font-bold mt-0.5 uppercase tracking-wider">
                    {formatRupiah(s.amount)} / bulan • {s.method.toUpperCase()}
                  </p>
                  {s.isActive && (
                    <p className="text-[10px] font-black text-emerald-800 flex items-center gap-1 mt-1 uppercase tracking-widest">
                      <Calendar className="w-3.5 h-3.5 stroke-[2.5px]" /> Billing: {getBillingStatus(s.billingDay)}
                    </p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => handleDelete(s.id)}
                className="text-neutral-400 hover:text-red-500 transition-colors ml-4 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
