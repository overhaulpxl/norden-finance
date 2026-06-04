import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

const EXPORT_ROW_LIMIT = 5000;

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function pdfText(value: string) {
  return value
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function buildSimplePdf(lines: string[]) {
  const content = [
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    `(Norden Finance Monthly Report) Tj`,
    '/F1 10 Tf',
    '0 -28 Td',
    ...lines.flatMap((line) => [`(${pdfText(line).slice(0, 95)}) Tj`, '0 -16 Td']),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'json';
  if (!['json', 'csv', 'pdf'].includes(format)) {
    return NextResponse.json({ error: 'Format tidak valid' }, { status: 400 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.uid, deletedAt: null },
    include: { category: true, wallet: true, transferToWallet: true },
    orderBy: { transactionDate: 'desc' },
    take: EXPORT_ROW_LIMIT,
  });
  const balances = await prisma.balance.findMany({
    where: { userId: user.uid, archivedAt: null },
    orderBy: { name: 'asc' },
  });
  const totalBalance = balances.reduce((sum, balance) => sum + balance.currentBalance, 0);

  const payload = transactions.map((tx) => ({
    id: tx.id,
    date: tx.transactionDate.toISOString(),
    type: tx.type,
    amount: tx.amount,
    category: tx.category?.name || null,
    wallet: tx.wallet?.name || null,
    transferToWallet: tx.transferToWallet?.name || null,
    note: tx.note,
    rawInput: tx.rawInput,
    tags: tx.tags,
    receiptMerchant: tx.receiptMerchant,
    receiptDate: tx.receiptDate?.toISOString() || null,
    receiptItems: tx.receiptItems,
  }));

  if (format === 'json') {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      rowLimit: EXPORT_ROW_LIMIT,
      balances: balances.map((balance) => ({
        id: balance.id,
        name: balance.name,
        type: balance.type,
        currentBalance: balance.currentBalance,
      })),
      totalBalance,
      transactions: payload,
    });
  }

  if (format === 'pdf') {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const monthlyTransactions = transactions.filter((tx) => {
      const date = tx.transactionDate;
      return date.getMonth() === month && date.getFullYear() === year;
    });
    const income = monthlyTransactions
      .filter((tx) => tx.type === 'masuk')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const expense = monthlyTransactions
      .filter((tx) => tx.type === 'keluar')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const transfer = monthlyTransactions
      .filter((tx) => tx.type === 'transfer')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const topCategory = Object.entries(
      monthlyTransactions
        .filter((tx) => tx.type === 'keluar')
        .reduce<Record<string, number>>((acc, tx) => {
          const name = tx.category?.name || 'Lain-lain';
          acc[name] = (acc[name] || 0) + tx.amount;
          return acc;
        }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    const lines = [
      `Generated: ${now.toISOString()}`,
      `Transactions this month: ${monthlyTransactions.length}`,
      `Income: Rp ${income.toLocaleString('id-ID')}`,
      `Expense: Rp ${expense.toLocaleString('id-ID')}`,
      `Transfer volume: Rp ${transfer.toLocaleString('id-ID')}`,
      `Cashflow: Rp ${(income - expense).toLocaleString('id-ID')}`,
      `Active wallet balance: Rp ${totalBalance.toLocaleString('id-ID')}`,
      `Largest expense category: ${topCategory ? `${topCategory[0]} - Rp ${topCategory[1].toLocaleString('id-ID')}` : 'None'}`,
      '',
      'Recent transactions:',
      ...payload.slice(0, 20).map((row) => `${row.date.slice(0, 10)} | ${row.type} | Rp ${row.amount.toLocaleString('id-ID')} | ${row.category || '-'} | ${row.note || '-'}`),
    ];

    return new NextResponse(buildSimplePdf(lines), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="norden-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  }

  const headers = ['id', 'date', 'type', 'amount', 'category', 'wallet', 'transferToWallet', 'note', 'rawInput', 'tags', 'receiptMerchant', 'receiptDate'];
  const csvPayload = payload.map((row) => ({
    ...row,
    tags: row.tags.join(' '),
  }));
  const rows = csvPayload.map((row) => headers.map((key) => csvEscape(row[key as keyof typeof row])).join(','));
  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="norden-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
