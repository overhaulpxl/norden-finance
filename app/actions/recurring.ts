'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '../../lib/prisma';
import { requireUser } from '../../lib/auth';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt32 } from '../../lib/validators';
import { getUserEntitlement } from '../../lib/entitlements';
import type { TransactionType } from '../../types';
import type { Prisma } from '@prisma/client';

function normalizeTags(tags?: string[]) {
  return Array.from(new Set((tags || [])
    .map((tag) => tag.replace(/^#/, '').trim().toLowerCase())
    .filter((tag) => /^[a-z0-9_-]{1,32}$/i.test(tag))))
    .slice(0, 10);
}

function normalizeDay(day?: number) {
  const value = day || new Date().getDate();
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    throw new Error('Tanggal berulang harus 1-31');
  }
  return value;
}

function nextMonthlyRun(dayOfMonth: number, fromDate = new Date()) {
  const safeDay = Math.min(dayOfMonth, 28);
  const candidate = new Date(fromDate.getFullYear(), fromDate.getMonth(), safeDay, 9, 0, 0, 0);
  if (candidate <= fromDate) {
    candidate.setMonth(candidate.getMonth() + 1);
  }
  return candidate;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

async function resolveCategory(tx: DbClient, userId: string, categoryName: string, type: TransactionType) {
  const trimmed = categoryName.trim();
  const existing = await tx.category.findFirst({
    where: {
      userId,
      OR: [
        { id: trimmed },
        { name: { equals: trimmed, mode: 'insensitive' } },
      ],
    },
  });
  if (existing) return existing;

  const name = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return tx.category.upsert({
    where: { userId_name: { userId, name } },
    update: {},
    create: { userId, name, type },
  });
}

async function resolveWallet(tx: DbClient, userId: string, walletName: string) {
  const trimmed = walletName.trim();
  const existing = await tx.balance.findFirst({
    where: {
      userId,
      OR: [
        { id: trimmed },
        { name: { equals: trimmed, mode: 'insensitive' } },
      ],
    },
  });
  if (existing) {
    if (existing.archivedAt) {
      await tx.balance.update({
        where: { id: existing.id },
        data: { archivedAt: null },
      });
    }
    return existing;
  }

  const name = trimmed.toUpperCase();
  const ewallets = ['DANA', 'GOPAY', 'OVO', 'SHOPEEPAY', 'LINKAJA'];
  const cashNames = ['CASH', 'TUNAI'];
  let type = 'bank';
  if (ewallets.includes(name)) type = 'ewallet';
  if (cashNames.includes(name)) type = 'cash';

  return tx.balance.upsert({
    where: { userId_name: { userId, name } },
    update: { archivedAt: null },
    create: { userId, name, type, currentBalance: 0 },
  });
}

export async function addRecurringRule(data: {
  name: string;
  type: TransactionType;
  amount: number;
  categoryName: string;
  walletName: string;
  note?: string;
  tags?: string[];
  dayOfMonth?: number;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(data.name, 'Nama transaksi berulang');
    if (!['masuk', 'keluar'].includes(data.type)) throw new Error('Jenis transaksi berulang tidak valid');
    assertPositiveInt32(data.amount, 'Nominal');
    assertNonEmpty(data.categoryName, 'Kategori');
    assertNonEmpty(data.walletName, 'Dompet');
    const dayOfMonth = normalizeDay(data.dayOfMonth);

    const rule = await prisma.recurringTransaction.create({
      data: {
        userId,
        name: data.name.trim().slice(0, 80),
        type: data.type,
        amount: data.amount,
        categoryName: data.categoryName.trim().slice(0, 80),
        walletName: data.walletName.trim().toUpperCase().slice(0, 80),
        note: data.note?.trim().slice(0, 240) || null,
        tags: normalizeTags(data.tags),
        interval: 'monthly',
        dayOfMonth,
        nextRunAt: nextMonthlyRun(dayOfMonth),
      },
    });

    await createAuditLog(userId, 'CREATE_RECURRING_RULE', 'recurringTransaction', rule.id);
    revalidatePath('/dashboard');
    return { success: true, data: rule };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat transaksi berulang';
    return { success: false, error: message };
  }
}

export async function toggleRecurringRule(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Transaksi berulang tidak ditemukan');

    await prisma.recurringTransaction.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    await createAuditLog(userId, 'TOGGLE_RECURRING_RULE', 'recurringTransaction', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah transaksi berulang';
    return { success: false, error: message };
  }
}

export async function deleteRecurringRule(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Transaksi berulang tidak ditemukan');

    await prisma.recurringTransaction.delete({ where: { id } });
    await createAuditLog(userId, 'DELETE_RECURRING_RULE', 'recurringTransaction', id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghapus transaksi berulang';
    return { success: false, error: message };
  }
}

export async function processDueRecurringTransactions(limit = 50) {
  const now = new Date();
  const dueRules = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
    },
    orderBy: { nextRunAt: 'asc' },
    take: Math.min(Math.max(limit, 1), 100),
  });

  let createdCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const rule of dueRules) {
    try {
      // Re-evaluate user entitlement at execution time.
      // Pro automation rules must not run for users who have fallen back to Free Basic.
      const entitlement = await getUserEntitlement(rule.userId);
      if (!entitlement.canAccessProFeatures) {
        await prisma.recurringTransaction.update({
          where: { id: rule.id },
          data: {
            nextRunAt: nextMonthlyRun(rule.dayOfMonth, now),
          },
        });
        skippedCount += 1;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        const [category, wallet] = await Promise.all([
          resolveCategory(tx, rule.userId, rule.categoryName, rule.type as TransactionType),
          resolveWallet(tx, rule.userId, rule.walletName),
        ]);

        await tx.transaction.create({
          data: {
            userId: rule.userId,
            categoryId: category.id,
            walletId: wallet.id,
            type: rule.type,
            amount: rule.amount,
            note: rule.note || `Recurring: ${rule.name}`,
            tags: rule.tags,
            rawInput: `recurring:${rule.id}`,
            transactionDate: now,
          },
        });

        await tx.balance.update({
          where: { id: wallet.id },
          data: {
            currentBalance: {
              increment: rule.type === 'masuk' ? rule.amount : -rule.amount,
            },
          },
        });

        await tx.recurringTransaction.update({
          where: { id: rule.id },
          data: {
            lastRunAt: now,
            nextRunAt: nextMonthlyRun(rule.dayOfMonth, now),
          },
        });
      });
      createdCount += 1;
    } catch (err: unknown) {
      console.error(`Failed to process recurring rule ${rule.id} for user ${rule.userId}:`, err);
      failedCount += 1;
      try {
        if (err instanceof Error && err.message.includes('Profil pengguna tidak ditemukan')) {
          await prisma.recurringTransaction.update({
            where: { id: rule.id },
            data: { isActive: false },
          });
        } else {
          // Delay next attempt by 1 hour to prevent hot retry loops
          await prisma.recurringTransaction.update({
            where: { id: rule.id },
            data: { nextRunAt: new Date(Date.now() + 60 * 60 * 1000) },
          });
        }
      } catch (recoveryErr) {
        console.error(`Failed to update retry backoff for rule ${rule.id}:`, recoveryErr);
      }
    }
  }

  return { success: true, processedCount: dueRules.length, createdCount, skippedCount, failedCount };
}
