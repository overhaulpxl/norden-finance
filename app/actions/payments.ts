'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { createAuditLog } from '../../lib/audit';
import { PaymentStatus, PlanType } from '@prisma/client';
import { getPaymentSettings, getPricingPlans } from '../../lib/data/loaders';
import { assertRateLimit } from '../../lib/rateLimit';
import { sanitizeActionError, safeRevalidatePath } from '../../lib/actionErrors';

async function validatePaymentInput(data: {
  billingType: string;
  amount: number;
  paymentMethod: string;
  proofPath: string;
}, userId: string) {
  const [pricingPlans, paymentSettings] = await Promise.all([
    getPricingPlans(),
    getPaymentSettings(),
  ]);
  const selectedPlan = data.billingType === 'monthly'
    ? pricingPlans.monthly
    : data.billingType === 'yearly'
      ? pricingPlans.yearly
      : null;

  if (!selectedPlan) {
    throw new Error('Paket pembayaran tidak valid');
  }

  if (data.amount !== selectedPlan.price) {
    throw new Error('Nominal pembayaran tidak sesuai paket');
  }

  const activeMethods = new Set([
    paymentSettings.bca_active !== 'false' ? 'bca' : null,
    paymentSettings.bni_active !== 'false' ? 'bni' : null,
    paymentSettings.qris_active !== 'false' ? 'qris' : null,
  ].filter(Boolean));

  if (!activeMethods.has(data.paymentMethod)) {
    throw new Error('Metode pembayaran tidak valid');
  }

  if (
    !data.proofPath ||
    data.proofPath.length > 2048 ||
    data.proofPath.startsWith('data:')
  ) {
    throw new Error('Bukti pembayaran tidak valid');
  }

  // Canonical Supabase Storage reference: payment-proofs/<userId>/<filename>
  const isCanonicalProof =
    data.proofPath.startsWith(`payment-proofs/${userId}/`) &&
    !data.proofPath.includes('..') &&
    !data.proofPath.includes('\\');

  // Support development mock endpoints
  const isDevMock =
    process.env.NODE_ENV !== 'production' && data.proofPath.startsWith('/api/mock-file?');

  // Backward compatibility for existing records containing legacy Firebase storage URLs
  const isLegacyFirebaseProof =
    (/^https:\/\/firebasestorage\.googleapis\.com\/|^https:\/\/storage\.googleapis\.com\//.test(data.proofPath)) &&
    (data.proofPath.includes(`payment-proofs%2F${encodeURIComponent(userId)}%2F`) ||
     data.proofPath.includes(`payment-proofs/${userId}/`));

  if (!isCanonicalProof && !isLegacyFirebaseProof && !isDevMock) {
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

    await assertRateLimit(`submit-payment:${userId}`, 3, 60_000);
    await validatePaymentInput(data, userId);

    const inserted = await prisma.$transaction(async (tx) => {
      const existingPending = await tx.paymentRequest.findFirst({
        where: { userId, status: PaymentStatus.pending },
      });
      if (existingPending) {
        throw new Error('Masih ada permintaan upgrade yang menunggu review admin');
      }

      return tx.paymentRequest.create({
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
    });

    await createAuditLog(userId, 'CREATE_PAYMENT_REQUEST', 'paymentRequest', inserted.id);
    safeRevalidatePath('/upgrade');
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mengirim bukti pembayaran');
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

    const { getSignedUrl } = await import('../../lib/storage');
    const resolvedData = await Promise.all(data.map(async req => {
      let resolvedProof = req.proofPath;
      if (req.proofPath && req.proofPath.startsWith('payment-proofs/')) {
        try {
          resolvedProof = await getSignedUrl(req.proofPath, 60);
        } catch {
          // If resolution fails, keep canonical reference
        }
      }
      return {
        ...req,
        proofPath: resolvedProof,
      };
    }));

    return { success: true, data: resolvedData };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal memuat riwayat pembayaran');
    return { success: false, error: message };
  }
}
