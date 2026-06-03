'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

export async function searchEverything(query: string) {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;
    const q = query.trim();

    if (!q || q.length < 2) {
      return { success: true, data: { transactions: [], categories: [], wallets: [] } };
    }

    const [transactions, categories, wallets] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          deletedAt: null,
          OR: [
            { note: { contains: q, mode: 'insensitive' } },
            { receiptMerchant: { contains: q, mode: 'insensitive' } },
            { tags: { hasSome: [q.toLowerCase()] } },
          ],
        },
        include: { category: true, wallet: true },
        take: 20,
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.category.findMany({
        where: {
          userId,
          name: { contains: q, mode: 'insensitive' },
        },
        take: 10,
      }),
      prisma.balance.findMany({
        where: {
          userId,
          name: { contains: q, mode: 'insensitive' },
          archivedAt: null,
        },
        take: 10,
      }),
    ]);

    return {
      success: true,
      data: {
        transactions,
        categories,
        wallets,
      }
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return { success: false, error: message };
  }
}
