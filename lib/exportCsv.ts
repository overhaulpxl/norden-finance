import { Transaction } from '../types';

export function exportTransactionsToCSV(transactions: Transaction[], filename?: string): void {
  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Metode', 'Keterangan', 'Raw Input'];
  
  const rows = transactions.map(tx => [
    new Date(tx.transactionDate).toLocaleString('id-ID'),
    tx.type,
    tx.category?.name || 'Lain-lain',
    tx.amount.toString(),
    tx.wallet?.name || 'Lain-lain',
    (tx.note || '').replace(/,/g, ';'),
    (tx.rawInput || '').replace(/,/g, ';'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Add BOM for proper Excel encoding
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `rekap-keuangan-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
