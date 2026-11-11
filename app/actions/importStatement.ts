'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { resolveCategory, updateStreak } from './transactions';

export async function importStatementTransactions(
  walletId: string,
  rows: Array<{
    dateStr: string;
    type: 'masuk' | 'keluar' | 'transfer';
    amount: number;
    description: string;
    category: string;
  }>
) {
  try {
    const { user } = await requireUser('basic');
    const userId = user.uid;

    if (!walletId) throw new Error('Pilih dompet tujuan untuk mutasi ini');
    if (!rows || rows.length === 0) throw new Error('Tidak ada transaksi yang dipilih untuk diimpor');

    if (rows.some((row) => (row.type as string) === 'transfer')) {
      throw new Error('Impor transaksi transfer belum didukung. Silakan pilih hanya pemasukan atau pengeluaran.');
    }

    let totalDelta = 0;
    const insertedIds: string[] = [];
    let resolvedWalletName = '';

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.balance.findFirst({
        where: { id: walletId, userId },
      });
      if (!wallet) throw new Error('Dompet tidak ditemukan');
      resolvedWalletName = wallet.name;

      for (const row of rows) {
        const categoryId = await resolveCategory(userId, row.category || 'Umum', row.type, tx);
        const txDate = new Date(row.dateStr);

        const created = await tx.transaction.create({
          data: {
            userId,
            walletId,
            categoryId,
            type: row.type,
            amount: row.amount,
            note: row.description || 'Import E-Statement',
            transactionDate: Number.isNaN(txDate.getTime()) ? new Date() : txDate,
            tags: ['#statement-import', wallet.name.toLowerCase()],
          },
        });

        insertedIds.push(created.id);

        if (row.type === 'masuk') totalDelta += row.amount;
        else if (row.type === 'keluar') totalDelta -= row.amount;
      }

      if (totalDelta !== 0) {
        await tx.balance.update({
          where: { id: walletId },
          data: {
            currentBalance: {
              increment: totalDelta,
            },
          },
        });
      }
    });

    await createAuditLog(userId, 'IMPORT_TRANSACTIONS', 'transaction', insertedIds[0] || 'bulk');
    await updateStreak(userId);
    revalidatePath('/dashboard');

    return {
      success: true,
      count: rows.length,
      walletName: resolvedWalletName,
      totalDelta,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengimpor mutasi rekening';
    return { success: false, error: message };
  }
}
