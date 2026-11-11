'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { assertNonEmpty, assertPositiveInt, assertValidDate } from '../../lib/validators';
import { sanitizeActionError, safeRevalidatePath } from '../../lib/actionErrors';

export async function addWishlistItem(data: {
  name: string;
  amount: number;
  url?: string;
  unlockDate?: string;
}) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;
    assertNonEmpty(data.name, 'Nama wishlist');
    assertPositiveInt(data.amount, 'Nominal');
    if (data.amount > 1_000_000_000_000) {
      throw new Error('Nominal wishlist melebihi batas maksimal');
    }
    assertValidDate(data.unlockDate, 'Tanggal unlock');
    if (data.url) {
      try {
        const parsedUrl = new URL(data.url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          throw new Error('Protokol URL tidak didukung');
        }
      } catch {
        throw new Error('URL wishlist tidak valid');
      }
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        name: data.name.trim().slice(0, 80),
        amount: data.amount,
        url: data.url ? data.url.trim().slice(0, 500) : null,
        unlockDate: data.unlockDate ? new Date(data.unlockDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'locked',
      },
    });

    await createAuditLog(userId, 'CREATE_WISHLIST', 'wishlistItem', item.id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menyimpan wishlist');
    return { success: false, error: message };
  }
}

export async function markWishlistBought(id: string, walletName?: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.wishlistItem.findFirst({
        where: { id, userId },
      });
      if (!existing) throw new Error('Wishlist item tidak ditemukan');
      if (existing.status === 'bought') throw new Error('Wishlist sudah dibeli');

      if (walletName) {
        const wallet = await tx.balance.findFirst({
          where: {
            userId,
            OR: [
              { id: walletName.trim() },
              { name: { equals: walletName.trim(), mode: 'insensitive' } },
            ],
          },
        });
        if (!wallet) throw new Error('Dompet tidak ditemukan');

        const category = await tx.category.upsert({
          where: { userId_name: { userId, name: 'Wishlist' } },
          update: {},
          create: { userId, name: 'Wishlist', type: 'keluar' },
        });

        await tx.balance.update({
          where: { id: wallet.id },
          data: { currentBalance: { decrement: existing.amount }, archivedAt: null },
        });

        await tx.transaction.create({
          data: {
            userId,
            categoryId: category.id,
            walletId: wallet.id,
            type: 'keluar',
            amount: existing.amount,
            note: `Beli Wishlist: ${existing.name}`,
            transactionDate: new Date(),
          },
        });
      }

      await tx.wishlistItem.update({
        where: { id },
        data: { status: 'bought' },
      });
    });

    await createAuditLog(userId, 'UPDATE_WISHLIST', 'wishlistItem', id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mengubah status wishlist');
    return { success: false, error: message };
  }
}

export async function deleteWishlistItem(id: string) {
  try {
    const { user } = await requireUser(true);
    const userId = user.uid;

    const existing = await prisma.wishlistItem.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Wishlist item tidak ditemukan');

    await prisma.wishlistItem.delete({ where: { id } });

    await createAuditLog(userId, 'DELETE_WISHLIST', 'wishlistItem', id);
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menghapus wishlist');
    return { success: false, error: message };
  }
}
