import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { getMonthlyReportData } from '../../../lib/data/loaders';
import {
  assertRateLimit,
  rateLimitKey,
  RateLimitExceededError,
  RateLimitIpError,
  rateLimitResponse,
} from '../../../lib/rateLimit';

const EXPORT_ROW_LIMIT = 5000;

function csvEscape(value: unknown): string {
  let text = String(value ?? '');
  // Neutralize CSV formula injection (CWE-1236)
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  try {
    await assertRateLimit(rateLimitKey(request, 'api-export'), 15, 60_000);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    if (!['json', 'csv', 'pdf'].includes(format)) {
      return NextResponse.json({ error: 'Format tidak valid' }, { status: 400 });
    }

    const yearStr = searchParams.get('year');
    const monthStr = searchParams.get('month');
    const now = new Date();
    let validatedYear: number | null = null;
    let validatedMonth: number | null = null;

    if (yearStr !== null) {
      validatedYear = parseInt(yearStr, 10);
      if (Number.isNaN(validatedYear) || validatedYear < 1970 || validatedYear > 2100) {
        return NextResponse.json({ error: 'Parameter tahun tidak valid' }, { status: 400 });
      }
    }

    if (monthStr !== null) {
      validatedMonth = parseInt(monthStr, 10);
      if (Number.isNaN(validatedMonth) || validatedMonth < 1 || validatedMonth > 12) {
        return NextResponse.json({ error: 'Parameter bulan tidak valid (1-12)' }, { status: 400 });
      }
    }

    if (format === 'pdf') {
      const { generateMonthlyReportPdf } = await import('../../../lib/pdf/monthlyReport');
      const year = validatedYear ?? now.getFullYear();
      const month = validatedMonth ?? (now.getMonth() + 1);
      const reportData = await getMonthlyReportData(user.uid, month, year);
      const pdfBuffer = generateMonthlyReportPdf(reportData);

      const fileName = `Norden_Report_${reportData.year}_${reportData.month}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      });
    }

    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (validatedYear !== null || validatedMonth !== null) {
      const year = validatedYear ?? now.getFullYear();
      if (validatedMonth !== null) {
        dateFilter = {
          gte: new Date(year, validatedMonth - 1, 1),
          lte: new Date(year, validatedMonth, 0, 23, 59, 59, 999),
        };
      } else {
        dateFilter = {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31, 23, 59, 59, 999),
        };
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.uid,
        deletedAt: null,
        ...(dateFilter ? { transactionDate: dateFilter } : {}),
      },
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
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
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
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitResponse(error);
    }
    if (error instanceof RateLimitIpError) {
      return NextResponse.json({ error: 'Terlalu banyak permintaan dari IP ini.' }, { status: 400 });
    }
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}
