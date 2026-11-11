'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { resolveCategory, updateStreak } from './transactions';
import { sanitizeActionError, safeRevalidatePath } from '../../lib/actionErrors';

const MAX_IMPORT_ROWS = 500;

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

    if (!walletId || typeof walletId !== 'string') throw new Error('Pilih dompet tujuan untuk mutasi ini');
    if (!rows || rows.length === 0) throw new Error('Tidak ada transaksi yang dipilih untuk diimpor');

    if (rows.length > MAX_IMPORT_ROWS) {
      throw new Error(`Maksimal 500 transaksi per impor (diterima: ${rows.length})`);
    }

    if (rows.some((row) => (row.type as string) === 'transfer')) {
      throw new Error('Impor transaksi transfer belum didukung. Silakan pilih hanya pemasukan atau pengeluaran.');
    }

    // Validate each row before opening the transaction
    for (const [idx, row] of rows.entries()) {
      if (row.type !== 'masuk' && row.type !== 'keluar') {
        throw new Error(`Jenis mutasi baris ke-${idx + 1} tidak valid. Pilih hanya pemasukan atau pengeluaran.`);
      }
      if (!Number.isFinite(row.amount) || row.amount <= 0 || row.amount > 1_000_000_000_000) {
        throw new Error(`Nominal baris ke-${idx + 1} tidak valid`);
      }
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

      // In-memory category cache for this transaction batch to avoid redundant DB queries
      const categoryCache = new Map<string, string>();

      for (const row of rows) {
        const rawCategory = (row.category || 'Umum').trim().slice(0, 80);
        const cacheKey = `${row.type}:${rawCategory.toLowerCase()}`;

        let categoryId = categoryCache.get(cacheKey);
        if (!categoryId) {
          categoryId = await resolveCategory(userId, rawCategory, row.type, tx);
          categoryCache.set(cacheKey, categoryId);
        }

        const txDate = new Date(row.dateStr);

        const created = await tx.transaction.create({
          data: {
            userId,
            walletId,
            categoryId,
            type: row.type,
            amount: row.amount,
            note: (row.description || 'Import E-Statement').trim().slice(0, 240),
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
            archivedAt: null,
          },
        });
      }
    }, {
      maxWait: 5000,
      timeout: 20000,
    });

    await createAuditLog(userId, 'IMPORT_TRANSACTIONS', 'transaction', insertedIds[0] || 'bulk');
    await updateStreak(userId);
    safeRevalidatePath('/dashboard');

    return {
      success: true,
      count: rows.length,
      walletName: resolvedWalletName,
      totalDelta,
    };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mengimpor mutasi rekening');
    return { success: false, error: message };
  }
}
