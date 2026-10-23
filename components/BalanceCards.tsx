'use client';

import { useState } from 'react';
import { Balance } from '../types';
import { formatRupiah, formatMethodName } from '../lib/format';
import { ArchiveRestore, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { updateBalance, deleteBalance, restoreBalance } from '../app/actions';

export default function BalanceCards({ balances }: { balances: Balance[] }) {
  const router = useRouter();
  const [balanceOverrides, setBalanceOverrides] = useState<Record<string, Balance>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const localBalances = [
    ...Object.values(balanceOverrides).filter((override) => !balances.some((balance) => balance.id === override.id)),
    ...balances.map((balance) => balanceOverrides[balance.id] || balance),
  ];

  const activeBalances = localBalances.filter((balance) => !balance.archivedAt);
  const archivedBalances = localBalances.filter((balance) => balance.archivedAt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!method.trim() || !amount) return;

    setLoading(true);
    setSuccess(null);
    const numericAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;

    const res = await updateBalance(method, numericAmount, editingId);
    if (res.success) {
      if ('wallet' in res && res.wallet) {
        setBalanceOverrides((current) => ({ ...current, [res.wallet.id]: res.wallet }));
      }
      setMethod('');
      setAmount('');
      setEditingId(undefined);
      setIsEditing(false);
      setSuccess(editingId ? 'Dompet berhasil diperbarui!' : 'Dompet baru berhasil ditambahkan!');
      setTimeout(() => setSuccess(null), 5000);
      router.refresh();
    } else {
      alert(res.error || 'Gagal update saldo');
    }
    setLoading(false);
  };

  return (
    <div className="brutal-card p-6 bg-white select-none space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-[3px] border-black pb-4 gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-black uppercase tracking-wider">Dompet & Rekening Keuangan</h3>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-0.5">Kelola rekening bank, e-wallet, dan uang tunai harian Anda</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            if (isEditing) setEditingId(undefined);
          }}
          className="brutal-btn-accent text-xs px-4 py-2 cursor-pointer shrink-0"
        >
          {isEditing ? 'Batal' : '+ Tambah / Atur Dompet'}
        </button>
      </div>

      {success && (
        <div className="p-3 border-[2px] border-black bg-[#bbf7d0] text-black text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-in fade-in duration-200">
          {success}
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit} className="p-5 border-[3px] border-black bg-[#FAF9F5] flex flex-col sm:flex-row gap-3 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            placeholder="NAMA DOMPET (CONTOH: BCA, GOPAY, CASH)"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="flex-1 brutal-input px-3.5 py-2.5 text-xs font-black uppercase"
            required
          />
          <input
            type="text"
            placeholder="NOMINAL SALDO SAAT INI (RP)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 brutal-input px-3.5 py-2.5 text-xs font-bold"
            required
          />
          <button type="submit" disabled={loading} className="brutal-btn px-6 py-2.5 flex justify-center items-center min-w-[120px] disabled:opacity-50 cursor-pointer text-xs font-black uppercase tracking-wider">
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Simpan'}
          </button>
        </form>
      )}

      {(!localBalances || activeBalances.length === 0) && !isEditing ? (
        <div className="flex flex-col items-center justify-center py-10 bg-white border-[3px] border-dashed border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center px-4">
          <div className="p-2 border-[2px] border-black bg-[#FFE066] mb-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-black">💳</span>
          </div>
          <p className="text-sm font-black text-black uppercase tracking-wider">Belum ada dompet aktif</p>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide mt-1">Tambah dompet baru untuk mulai melacak saldo & mutasi transaksi Anda.</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            + Tambah Dompet Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {activeBalances.map(b => (
            <div
              key={b.id}
              className="brutal-card p-4 flex flex-col justify-between bg-white hover:bg-neutral-50 cursor-pointer relative group border-[2.5px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
              onClick={() => {
                setEditingId(b.id);
                setMethod(b.name);
                setAmount(b.currentBalance.toString());
                setIsEditing(true);
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 px-1.5 py-0.5 border border-black bg-[#FAF9F5]">
                    {b.type === 'cash' ? 'CASH' : b.type === 'ewallet' ? 'E-WALLET' : 'BANK'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Arsipkan dompet ${formatMethodName(b.name)}? Riwayat transaksi tetap aman.`)) {
                        setSuccess(null);
                        deleteBalance(b.id).then((res) => {
                          if (res.success && 'wallet' in res && res.wallet) {
                            setBalanceOverrides((current) => ({ ...current, [res.wallet.id]: res.wallet }));
                            setSuccess('Dompet berhasil diarsipkan!');
                            setTimeout(() => setSuccess(null), 4000);
                            router.refresh();
                          } else if (!res.success) {
                            alert(res.error || 'Gagal mengarsipkan dompet');
                          }
                        });
                      }
                    }}
                    className="text-neutral-500 hover:text-red-650 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 -mt-1 -mr-1 cursor-pointer"
                    title={`Arsipkan dompet ${formatMethodName(b.name)}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-xs sm:text-sm text-black uppercase font-black tracking-wider truncate mb-2">
                  {formatMethodName(b.name)}
                </h4>
              </div>
              <span className="text-base sm:text-xl font-black text-black tracking-wide">
                {formatRupiah(b.currentBalance)}
              </span>
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
                    onClick={() => {
                      setSuccess(null);
                      restoreBalance(balance.id).then((res) => {
                        if (res.success && 'wallet' in res && res.wallet) {
                          setBalanceOverrides((current) => ({ ...current, [res.wallet.id]: res.wallet }));
                          setSuccess('Dompet berhasil dipulihkan!');
                          setTimeout(() => setSuccess(null), 5000);
                          router.refresh();
                        } else if (!res.success) {
                          alert(res.error || 'Gagal memulihkan dompet');
                        }
                      });
                    }}
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
