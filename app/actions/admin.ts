'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { PaymentStatus, PlanType, UserRole } from '@prisma/client';

const PLAN_PRICES: Record<string, number> = {
  monthly: 19000,
  yearly: 149000,
};

export async function getPendingPaymentRequests() {
  try {
    const { profile } = await requireUser(false);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses ke halaman ini.');
    }

    const pendingRequests = await prisma.paymentRequest.findMany({
      where: {
        status: PaymentStatus.pending,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // We need to fetch names for each user from profiles
    const userIds = pendingRequests.map(r => r.userId);
    const profiles = await prisma.profile.findMany({
      where: {
        userId: { in: userIds },
      },
    });

    const profilesMap = new Map(profiles.map(p => [p.userId, p]));

    const data = pendingRequests.map(req => {
      const userProfile = profilesMap.get(req.userId);
      return {
        ...req,
        profiles: userProfile ? { full_name: userProfile.fullName } : null,
      };
    });

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat permintaan pembayaran';
    return { success: false, error: message };
  }
}

export async function approvePaymentRequest(requestId: string) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    // Get payment request details
    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Permintaan pembayaran tidak ditemukan');
    if (request.status !== PaymentStatus.pending) throw new Error('Permintaan ini sudah diproses');
    if (request.amount !== PLAN_PRICES[request.billingType]) {
      throw new Error('Nominal pembayaran tidak sesuai paket');
    }

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update payment request status
      await tx.paymentRequest.update({
        where: { id: requestId },
        data: { status: PaymentStatus.approved },
      });

      // 2. Update user profile to Pro plan
      await tx.profile.update({
        where: { userId: request.userId },
        data: { plan: PlanType.pro },
      });

      // 3. Upsert subscription billing details
      const billingDays = request.billingType === 'monthly' ? 30 : 365;
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + billingDays);

      const existingBilling = await tx.billingSubscription.findFirst({
        where: {
          userId: request.userId,
          plan: PlanType.pro,
        },
      });

      if (existingBilling) {
        await tx.billingSubscription.update({
          where: { id: existingBilling.id },
          data: {
            status: 'active',
            startedAt: new Date(),
            expiredAt,
          },
        });
      } else {
        await tx.billingSubscription.create({
          data: {
            userId: request.userId,
            plan: PlanType.pro,
            status: 'active',
            startedAt: new Date(),
            expiredAt,
          },
        });
      }
    });

    const callerUser = await requireUser(true);
    await createAuditLog(callerUser.user.uid, 'APPROVE_PAYMENT', 'paymentRequest', requestId);
    
    revalidatePath('/norden-control-center');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyetujui pembayaran';
    return { success: false, error: message };
  }
}

export async function rejectPaymentRequest(requestId: string, adminNote: string) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    await prisma.$transaction(async (tx) => {
      const request = await tx.paymentRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) throw new Error('Permintaan pembayaran tidak ditemukan');
      if (request.status !== PaymentStatus.pending) throw new Error('Permintaan ini sudah diproses');

      await tx.paymentRequest.update({
        where: { id: requestId },
        data: {
          status: PaymentStatus.rejected,
          adminNote: adminNote || null,
        },
      });
    });

    const callerUser = await requireUser(true);
    await createAuditLog(callerUser.user.uid, 'REJECT_PAYMENT', 'paymentRequest', requestId);
    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menolak pembayaran';
    return { success: false, error: message };
  }
}

export async function getAllUsers() {
  try {
    const { profile } = await requireUser(false);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses ke data ini.');
    }

    const users = await prisma.profile.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Serialize Dates to strings for Client Components compatibility
    const serializedUsers = users.map(u => ({
      ...u,
      trialStartedAt: u.trialStartedAt.toISOString(),
      trialEndsAt: u.trialEndsAt.toISOString(),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return { success: true, data: serializedUsers };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat daftar pengguna';
    return { success: false, error: message };
  }
}

export async function updateUserPlanManually(targetUserId: string, newPlan: PlanType, days: number = 30) {
  try {
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    if (!Number.isInteger(days) || days < 1 || days > 3660) {
      throw new Error('Durasi paket tidak valid');
    }

    await prisma.$transaction(async (tx) => {
      const targetProfile = await tx.profile.findUnique({
        where: { userId: targetUserId }
      });
      if (!targetProfile) throw new Error('Profil pengguna tidak ditemukan');

      let baseDate = new Date();
      
      const existingBilling = await tx.billingSubscription.findFirst({
        where: { userId: targetUserId, plan: PlanType.pro, status: 'active' },
      });

      if (newPlan === PlanType.pro && existingBilling && existingBilling.expiredAt && existingBilling.expiredAt > new Date()) {
        baseDate = new Date(existingBilling.expiredAt);
      }

      const expiredAt = new Date(baseDate);
      expiredAt.setDate(expiredAt.getDate() + days);

      await tx.profile.update({
        where: { userId: targetUserId },
        data: { 
          plan: newPlan,
          trialEndsAt: expiredAt
        },
      });

      if (newPlan === PlanType.pro) {
        if (existingBilling) {
          await tx.billingSubscription.update({
            where: { id: existingBilling.id },
            data: {
              status: 'active',
              expiredAt,
            },
          });
        } else {
          await tx.billingSubscription.create({
            data: {
              userId: targetUserId,
              plan: PlanType.pro,
              status: 'active',
              startedAt: new Date(),
              expiredAt,
            },
          });
        }
      } else {
        await tx.billingSubscription.updateMany({
          where: { userId: targetUserId, plan: PlanType.pro },
          data: { status: 'cancelled' },
        });
      }
    });

    await createAuditLog(user.uid, `MANUAL_PLAN_UPDATE_${newPlan.toUpperCase()}_DAYS_${days}`, 'profile', targetUserId);
    revalidatePath('/norden-control-center');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal merubah paket pengguna';
    return { success: false, error: message };
  }
}

export async function updateUserRoleManually(targetUserId: string, newRole: UserRole) {
  try {
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    if (targetUserId === user.uid && newRole !== UserRole.admin) {
      throw new Error('Anda tidak dapat menurunkan role Anda sendiri.');
    }

    await prisma.profile.update({
      where: { userId: targetUserId },
      data: { role: newRole },
    });

    await createAuditLog(user.uid, `MANUAL_ROLE_UPDATE_${newRole.toUpperCase()}`, 'profile', targetUserId);
    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal merubah role pengguna';
    return { success: false, error: message };
  }
}

export async function updateFeedbackStatus(feedbackId: string, newStatus: string) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    if (!['open', 'reviewed', 'closed'].includes(newStatus)) {
      throw new Error('Status umpan balik tidak valid');
    }

    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: newStatus },
    });

    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengubah status umpan balik';
    return { success: false, error: message };
  }
}

export async function getPaymentSettings() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = new Map(settings.map(s => [s.key, s.value]));
    return {
      success: true,
      data: {
        bca_number: settingsMap.get('bca_number') || '',
        bca_holder: settingsMap.get('bca_holder') || '',
        bca_active: settingsMap.get('bca_active') || 'false',
        bni_number: settingsMap.get('bni_number') || '',
        bni_holder: settingsMap.get('bni_holder') || '',
        bni_active: settingsMap.get('bni_active') || 'false',
        qris_image: settingsMap.get('qris_image') || '',
        qris_active: settingsMap.get('qris_active') || 'false',
      }
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat pengaturan pembayaran';
    return { success: false, error: message };
  }
}

export async function updatePaymentSettings(data: {
  bca_number: string;
  bca_holder: string;
  bca_active: string;
  bni_number: string;
  bni_holder: string;
  bni_active: string;
  qris_image: string;
  qris_active: string;
}) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }
    if (data.bca_active === 'true' && (!data.bca_number.trim() || !data.bca_holder.trim())) {
      throw new Error('Nomor dan nama pemilik BCA wajib diisi jika BCA aktif');
    }
    if (data.bni_active === 'true' && (!data.bni_number.trim() || !data.bni_holder.trim())) {
      throw new Error('Nomor dan nama pemilik BNI wajib diisi jika BNI aktif');
    }
    if (data.qris_active === 'true') {
      if (
        !data.qris_image ||
        data.qris_image.startsWith('data:') ||
        (
          !/^https:\/\/firebasestorage\.googleapis\.com\/|^https:\/\/storage\.googleapis\.com\//.test(data.qris_image) &&
          !(process.env.NODE_ENV !== 'production' && data.qris_image.startsWith('/api/mock-file?'))
        )
      ) {
        throw new Error('Gambar QRIS aktif harus berupa URL Firebase Storage');
      }
    }

    const keys = Object.keys(data) as Array<keyof typeof data>;
    for (const key of keys) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: data[key] },
        create: { key, value: data[key] },
      });
    }

    revalidatePath('/norden-control-center');
    revalidatePath('/upgrade');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui pengaturan pembayaran';
    return { success: false, error: message };
  }
}
