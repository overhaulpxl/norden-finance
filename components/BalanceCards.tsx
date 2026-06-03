'use client';

import { useState } from 'react';
import { Balance } from '../types';
import { formatRupiah, formatMethodName } from '../lib/format';
import { ArchiveRestore, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateBalance, deleteBalance, restoreBalance } from '../app/actions';

export default function BalanceCards({ balances }: { balances: Balance[] }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const activeBalances = balances.filter((balance) => !balance.archivedAt);
  const archivedBalances = balances.filter((balance) => balance.archivedAt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method.trim() || !amount) return;

    setLoading(true);
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
    
    const res = await updateBalance(method, numericAmount, editingId);
    if (res.success) {
      setMethod('');
      setAmount('');
      setEditingId(undefined);
      setIsEditing(false);
      router.refresh();
    } else {
      alert(res.error || 'Gagal update saldo');
    }
    setLoading(false);
  };

  return (
    <div className="brutal-card p-6 bg-white select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h3 className="text-lg font-black text-black uppercase tracking-wider">Wallets & Accounts</h3>
        <button 
          onClick={() => {
            setIsEditing(!isEditing);
            if (isEditing) setEditingId(undefined);
          }}
          className="brutal-btn-light text-xs px-4 py-2 cursor-pointer"
        >
          {isEditing ? 'Cancel' : '+ Manage Wallet'}
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="mb-6 brutal-card bg-white p-5 flex flex-col sm:flex-row gap-3 border-[3px] border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2">
          <input type="text" placeholder="Method (e.g. BNI, Cash)" value={method} onChange={(e) => setMethod(e.target.value)} className="flex-1 brutal-input px-4 py-2.5 text-sm uppercase" required />
          <input type="text" placeholder="Amount (e.g. 1900000)" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 brutal-input px-4 py-2.5 text-sm" required />
          <button type="submit" disabled={loading} className="brutal-btn px-6 py-2.5 flex justify-center items-center min-w-[100px] disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Save'}
          </button>
        </form>
      )}

      {(!balances || activeBalances.length === 0) && !isEditing ? (
        <div className="text-neutral-400 font-bold text-sm py-8 text-center bg-white border-[3px] border-dashed border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">No wallets found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {activeBalances.map(b => (
            <div 
              key={b.id} 
              className="brutal-card p-4 flex flex-col bg-white hover:bg-neutral-50 cursor-pointer relative group border-[2px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              onClick={() => {
                setEditingId(b.id);
                setMethod(b.name);
                setAmount(b.currentBalance.toString());
                setIsEditing(true);
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-neutral-500 uppercase font-black tracking-wider">{formatMethodName(b.name)}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Arsipkan dompet ${formatMethodName(b.name)}? Riwayat transaksi tetap aman.`)) {
                      deleteBalance(b.id).then(() => router.refresh());
                    }
                  }}
                  className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 -mt-1 -mr-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xl font-black text-black tracking-wide">{formatRupiah(b.currentBalance)}</span>
            </div>
          ))}
        </div>
      )}

      {archivedBalances.length > 0 && (
        <div className="mt-6 border-t-[3px] border-black pt-5">
          <h4 className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">Archived Wallets</h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {archivedBalances.map((balance) => (
              <div key={balance.id} className="border-[2px] border-black bg-neutral-100 p-3 opacity-80">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black">{formatMethodName(balance.name)}</span>
                  <button
                    type="button"
                    onClick={() => restoreBalance(balance.id).then(() => router.refresh())}
                    className="border border-black bg-white p-1 text-black transition-colors hover:bg-[#bbf7d0] cursor-pointer"
                    title="Restore wallet"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5 stroke-[3px]" />
                  </button>
                </div>
                <span className="text-sm font-black text-neutral-700">{formatRupiah(balance.currentBalance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
