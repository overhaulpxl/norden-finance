'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt } from '../../lib/validators';
import { sanitizeActionError, safeRevalidatePath } from '../../lib/actionErrors';

export async function addPaylater(
  itemName: string,
  platform: string,
  totalAmount: number,
  tenorMonths: number
) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(itemName, 'Nama item');
    assertNonEmpty(platform, 'Platform');
    assertPositiveInt(totalAmount, 'Total paylater');
    if (totalAmount > 1_000_000_000_000) {
      throw new Error('Total paylater melebihi batas maksimal');
    }
    assertPositiveInt(tenorMonths, 'Tenor');
    if (tenorMonths > 120) throw new Error('Tenor terlalu panjang');

    const cleanItemName = itemName.trim().slice(0, 80);
    const cleanPlatform = platform.trim().slice(0, 50);
    const installmentAmount = Math.ceil(totalAmount / tenorMonths);

    const paylater = await prisma.paylater.create({
      data: {
        userId,
        itemName: cleanItemName,
        platform: cleanPlatform,
        totalAmount,
        installmentAmount,
        tenorMonths,
        monthsPaid: 0,
        isSettled: false,
      },
    });

    await createAuditLog(userId, 'CREATE_PAYLATER', 'paylater', paylater.id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menyimpan paylater');
    return { success: false, error: message };
  }
}

export async function payPaylaterInstallment(id: string, payMethod: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(payMethod, 'Dompet pembayaran');

    await prisma.$transaction(async (tx) => {
      const existing = await tx.paylater.findFirst({
        where: { id, userId },
      });
      if (!existing) throw new Error('Paylater tidak ditemukan');
      if (existing.isSettled || existing.monthsPaid >= existing.tenorMonths || existing.totalAmount <= 0) {
        throw new Error('Paylater sudah lunas');
      }

      const paymentAmount = Math.min(existing.installmentAmount, existing.totalAmount);
      const remainingAfterPayment = existing.totalAmount - paymentAmount;
      const nextMonthsPaid = existing.monthsPaid + 1;

      const wallet = await tx.balance.findFirst({
        where: {
          userId,
          OR: [
            { id: payMethod.trim() },
            { name: { equals: payMethod.trim(), mode: 'insensitive' } },
          ],
        },
      });
      if (!wallet) throw new Error('Dompet pembayaran tidak ditemukan');

      const category = await tx.category.upsert({
        where: { userId_name: { userId, name: 'Paylater' } },
        update: {},
        create: { userId, name: 'Paylater', type: 'keluar' },
      });

      await tx.balance.update({
        where: { id: wallet.id },
        data: { currentBalance: { decrement: paymentAmount }, archivedAt: null },
      });

      await tx.transaction.create({
        data: {
          userId,
          categoryId: category.id,
          type: 'keluar',
          amount: paymentAmount,
          walletId: wallet.id,
          note: `Bayar Cicilan: ${existing.itemName} (${existing.platform})`,
          transactionDate: new Date(),
        },
      });

      await tx.paylater.update({
        where: { id },
        data: {
          totalAmount: Math.max(0, remainingAfterPayment),
          monthsPaid: Math.min(existing.tenorMonths, nextMonthsPaid),
          isSettled: remainingAfterPayment <= 0 || nextMonthsPaid >= existing.tenorMonths,
        },
      });
    });

    await createAuditLog(userId, 'PAY_PAYLATER', 'paylater', id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal membayar cicilan');
    return { success: false, error: message };
  }
}

export async function deletePaylater(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.paylater.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Paylater tidak ditemukan');

    await prisma.paylater.delete({ where: { id } });

    await createAuditLog(userId, 'DELETE_PAYLATER', 'paylater', id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menghapus paylater');
    return { success: false, error: message };
  }
}
