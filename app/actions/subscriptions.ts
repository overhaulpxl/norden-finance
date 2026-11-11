'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt, assertPositiveInt32 } from '../../lib/validators';
import { addRecurringRule } from './recurring';
import { resolveCategory, resolveWallet, updateStreak } from './transactions';
import type { TransactionType } from '../../types';
import { sanitizeActionError, safeRevalidatePath } from '../../lib/actionErrors';

export async function addSubscription(data: {
  name: string;
  amount: number;
  billingDay: number;
  method: string;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(data.name, 'Nama subscription');
    assertNonEmpty(data.method, 'Metode pembayaran');
    assertPositiveInt(data.amount, 'Nominal');
    if (data.amount > 1_000_000_000) {
      throw new Error('Nominal subscription terlalu besar');
    }
    if (!Number.isInteger(data.billingDay) || data.billingDay < 1 || data.billingDay > 31) {
      throw new Error('Tanggal tagihan harus 1-31');
    }

    const sub = await prisma.appSubscription.create({
      data: {
        userId,
        name: data.name.trim().slice(0, 80),
        amount: data.amount,
        billingDay: data.billingDay,
        method: data.method.trim().slice(0, 50),
        isActive: true,
      },
    });

    await createAuditLog(userId, 'CREATE_SUBSCRIPTION', 'appSubscription', sub.id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menyimpan subscription');
    return { success: false, error: message };
  }
}

export async function addRecurringTransaction(data: {
  type: string;
  amount: number;
  category: string;
  method: string;
  note?: string;
  tags?: string[];
}) {
  try {
    assertPositiveInt32(data.amount, 'Nominal');
    assertNonEmpty(data.method, 'Metode pembayaran');
    const recurring = await addRecurringRule({
      name: data.note || data.category || 'Transaksi berulang',
      type: data.type as TransactionType,
      amount: data.amount,
      categoryName: data.category,
      walletName: data.method,
      note: data.note,
      tags: data.tags,
    });
    if (!recurring.success) return recurring;

    await addSubscription({
      name: data.note || data.category || 'Recurring Bill',
      amount: data.amount,
      billingDay: new Date().getDate(),
      method: data.method,
    });

    return recurring;
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal membuat transaksi berulang');
    return { success: false, error: message };
  }
}

export async function toggleSubscriptionActive(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.appSubscription.findFirst({
        where: { id, userId },
      });
      if (!existing) throw new Error('Subscription tidak ditemukan');

      await tx.appSubscription.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });
    });

    await createAuditLog(userId, 'UPDATE_SUBSCRIPTION', 'appSubscription', id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mengubah status subscription');
    return { success: false, error: message };
  }
}

export async function deleteSubscription(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.appSubscription.findFirst({
        where: { id, userId },
      });
      if (!existing) throw new Error('Subscription tidak ditemukan');

      await tx.appSubscription.delete({ where: { id } });
    });

    await createAuditLog(userId, 'DELETE_SUBSCRIPTION', 'appSubscription', id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menghapus subscription');
    return { success: false, error: message };
  }
}

/**
 * Record reimbursement / payment received from friends for shared/family subscriptions.
 * Excess payment beyond expected share automatically becomes surplus/jajan host.
 */
export async function recordFamilySharingPayment(data: {
  subscriptionName: string;
  payerName: string;
  amountPaid: number;
  expectedShare?: number;
  destinationWallet: string;
}) {
  try {
    const { user } = await requireUser('basic');
    const userId = user.uid;

    assertPositiveInt(data.amountPaid, 'Nominal setoran');
    assertNonEmpty(data.payerName, 'Nama teman');
    assertNonEmpty(data.destinationWallet, 'Dompet tujuan');
    assertNonEmpty(data.subscriptionName, 'Nama langganan');

    const surplus = data.expectedShare && data.expectedShare > 0
      ? Math.max(0, data.amountPaid - data.expectedShare)
      : 0;

    const note = `Patungan ${data.subscriptionName.trim()} dari ${data.payerName.trim()}${
      surplus > 0 ? ` (Surplus Host: Rp ${Math.round(surplus).toLocaleString('id-ID')})` : ''
    }`;

    const newTx = await prisma.$transaction(async (tx) => {
      const [walletId, categoryId] = await Promise.all([
        resolveWallet(userId, data.destinationWallet, tx),
        resolveCategory(userId, 'Patungan Langganan', 'masuk', tx),
      ]);

      const created = await tx.transaction.create({
        data: {
          userId,
          categoryId,
          walletId,
          type: 'masuk',
          amount: data.amountPaid,
          note,
          tags: ['#patungan', '#family-sharing', data.subscriptionName.toLowerCase().replace(/\s+/g, '-')],
        },
      });

      await tx.balance.update({
        where: { id: walletId },
        data: { currentBalance: { increment: data.amountPaid }, archivedAt: null },
      });

      return created;
    });

    await createAuditLog(userId, 'CREATE_TRANSACTION', 'transaction', newTx.id);
    await updateStreak(userId);
    safeRevalidatePath('/dashboard');
    return { success: true, transactionId: newTx.id, surplus };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mencatat setoran patungan');
    return { success: false, error: message };
  }
}
