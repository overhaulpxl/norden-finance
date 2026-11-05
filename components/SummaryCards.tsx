'use client';

import { Transaction, Balance } from '../types';
import { formatRupiah } from '../lib/format';
import { useHideBalance } from '../lib/HideBalanceContext';

export default function SummaryCards({ transactions, balances }: { transactions: Transaction[], balances: Balance[] }) {
  const { maskBalance } = useHideBalance();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  let totalMasuk = 0;
  let totalKeluar = 0;

  transactions.forEach(tx => {
    const txDate = new Date(tx.transactionDate);
    if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
      if (tx.type === 'masuk') totalMasuk += tx.amount;
      if (tx.type === 'keluar') totalKeluar += tx.amount;
    }
  });

  const saldoBersih = totalMasuk - totalKeluar;
  const totalSaldoReal = balances.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const selisih = totalSaldoReal - saldoBersih;

  const cards = [
    { title: 'Saldo Real', amount: totalSaldoReal },
    { title: 'Pemasukan', amount: totalMasuk },
    { title: 'Pengeluaran', amount: totalKeluar },
    { title: 'Saldo Bersih', amount: saldoBersih },
  ];

  return (
    <div className="space-y-4 select-none">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="brutal-card p-5 h-full flex flex-col justify-center bg-white border-[2px] border-black rounded-none shadow-[3px_3px_0px_0px_#000]">
            <p className="text-neutral-500 text-xs font-black mb-1.5 uppercase tracking-wider">{card.title}</p>
            <p className="text-xl font-black text-black tracking-wider">{maskBalance(formatRupiah(card.amount))}</p>
          </div>
        ))}
      </div>
      
      {selisih !== 0 && (
        <div className="text-xs text-neutral-800 font-bold flex items-center gap-2 border-[2px] border-black p-3 bg-red-50 rounded-none shadow-[2px_2px_0px_0px_#000]">
          <span>Selisih <strong className="text-red-600 font-black">{maskBalance(formatRupiah(Math.abs(selisih)))}</strong> antara catatan dan saldo asli.</span>
        </div>
      )}
    </div>
  );
}
