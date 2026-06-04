'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { PaymentStatus, PlanType } from '@prisma/client';

const PLAN_PRICES: Record<string, number> = {
  monthly: 19000,
  yearly: 149000,
};

const PAYMENT_METHODS = new Set(['bca', 'bni', 'qris']);

function validatePaymentInput(data: {
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
}, userId: string) {
  if (!Object.hasOwn(PLAN_PRICES, data.billingType)) {
    throw new Error('Paket pembayaran tidak valid');
  }

  if (data.amount !== PLAN_PRICES[data.billingType]) {
    throw new Error('Nominal pembayaran tidak sesuai paket');
  }

  if (!PAYMENT_METHODS.has(data.paymentMethod)) {
    throw new Error('Metode pembayaran tidak valid');
  }

  if (
    !data.proofPath ||
    data.proofPath.length > 2048 ||
    data.proofPath.startsWith('data:') ||
    (
      !/^https:\/\/firebasestorage\.googleapis\.com\/|^https:\/\/storage\.googleapis\.com\//.test(data.proofPath) &&
      !(process.env.NODE_ENV !== 'production' && data.proofPath.startsWith('/api/mock-file?'))
    )
  ) {
    throw new Error('Bukti pembayaran tidak valid');
  }

  const expectedPath = `payment-proofs%2F${encodeURIComponent(userId)}%2F`;
  const expectedRawPath = `payment-proofs/${userId}/`;
  if (!data.proofPath.includes(expectedPath) && !data.proofPath.includes(expectedRawPath)) {
    throw new Error('Bukti pembayaran harus diunggah dari akun ini');
  }
}

export async function submitPaymentRequest(data: {
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
}) {
  try {
    const { user } = await requireUser(false); // Can request upgrade even if trial ended
    const userId = user.uid;
    validatePaymentInput(data, userId);

    const existingPending = await prisma.paymentRequest.findFirst({
      where: { userId, status: PaymentStatus.pending },
    });
    if (existingPending) {
      throw new Error('Masih ada permintaan upgrade yang menunggu review admin');
    }

    const inserted = await prisma.paymentRequest.create({
      data: {
        userId,
        plan: PlanType.pro,
        billingType: data.billingType,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        proofPath: data.proofPath,
        status: PaymentStatus.pending,
      },
    });

    await createAuditLog(userId, 'CREATE_PAYMENT_REQUEST', 'paymentRequest', inserted.id);
    revalidatePath('/upgrade');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim bukti pembayaran';
    return { success: false, error: message };
  }
}

export async function getPaymentRequests() {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;

    const data = await prisma.paymentRequest.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat riwayat pembayaran';
    return { success: false, error: message };
  }
}
