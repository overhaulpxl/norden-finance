'use server';

import { requireUser } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '../../lib/audit';
import { PaymentStatus, PlanType, UserRole } from '@prisma/client';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { getPricingPlans } from '../../lib/data/loaders';
import { DEFAULT_MONTHLY_PRICE, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from '../../lib/constants';
import { sendEmail } from '../../lib/email';
import { getPaymentApprovedEmailHtml, getPaymentRejectedEmailHtml } from '../../lib/email/templates/paymentEmails';
import { executeFinancialDataReset } from '../../lib/financialReset';

async function sendPaymentStatusEmail({
  userId,
  type,
  adminNote,
}: {
  userId: string;
  type: 'approved' | 'rejected';
  adminNote?: string | null;
}) {
  try {
    const [firebaseUser, profile] = await Promise.all([
      getAdminAuth().getUser(userId),
      prisma.profile.findUnique({ where: { userId }, select: { fullName: true } }),
    ]);

    if (!firebaseUser.email) {
      console.warn('Payment email skipped: user email is missing.');
      return;
    }

    await sendEmail({
      to: firebaseUser.email,
      subject: type === 'approved' ? 'Norden Pro is now active' : 'Norden Pro payment needs review',
      html: type === 'approved'
        ? getPaymentApprovedEmailHtml({ userName: profile?.fullName || null })
        : getPaymentRejectedEmailHtml({ userName: profile?.fullName || null, adminNote }),
      text: type === 'approved'
        ? 'Your payment has been approved. Your Norden Pro subscription is now active.'
        : 'Your payment proof could not be verified. Please upload a new proof or contact support.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Payment email failed';
    console.warn('Payment email failed:', message);
  }
}

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
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    // Get payment request details
    const request = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Permintaan pembayaran tidak ditemukan');
    if (request.status !== PaymentStatus.pending) throw new Error('Permintaan ini sudah diproses');
    const pricingPlans = await getPricingPlans();
    const selectedPlan = request.billingType === 'monthly'
      ? pricingPlans.monthly
      : request.billingType === 'yearly'
        ? pricingPlans.yearly
        : null;
    if (!selectedPlan || request.amount !== selectedPlan.price) {
      throw new Error('Nominal pembayaran tidak sesuai paket');
    }

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Atomically update payment request status only if still pending (prevents race conditions)
      const updatedPayment = await tx.paymentRequest.updateMany({
        where: { id: requestId, status: PaymentStatus.pending },
        data: { status: PaymentStatus.approved },
      });

      if (updatedPayment.count === 0) {
        throw new Error('Permintaan pembayaran ini sudah diproses atau tidak lagi valid.');
      }

      // 2. Upsert subscription billing details (preserve already-paid future time upon renewal)
      const billingDays = request.billingType === 'monthly' ? 30 : 365;

      const existingBilling = await tx.billingSubscription.findFirst({
        where: {
          userId: request.userId,
          plan: PlanType.pro,
        },
        orderBy: { expiredAt: 'desc' },
      });

      let baseDate = new Date();
      if (
        existingBilling &&
        existingBilling.status === 'active' &&
        existingBilling.expiredAt &&
        existingBilling.expiredAt > new Date()
      ) {
        baseDate = new Date(existingBilling.expiredAt);
      }

      const expiredAt = new Date(baseDate);
      expiredAt.setDate(expiredAt.getDate() + billingDays);

      // Update user profile to Pro plan and sync expiry timestamp
      await tx.profile.update({
        where: { userId: request.userId },
        data: {
          plan: PlanType.pro,
          trialEndsAt: expiredAt,
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

    await createAuditLog(user.uid, 'APPROVE_PAYMENT', 'paymentRequest', requestId);
    await sendPaymentStatusEmail({ userId: request.userId, type: 'approved' });
    
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
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    await prisma.$transaction(async (tx) => {
      const request = await tx.paymentRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) throw new Error('Permintaan pembayaran tidak ditemukan');
      if (request.status !== PaymentStatus.pending) throw new Error('Permintaan ini sudah diproses');

      const updatedPayment = await tx.paymentRequest.updateMany({
        where: { id: requestId, status: PaymentStatus.pending },
        data: {
          status: PaymentStatus.rejected,
          adminNote: adminNote || null,
        },
      });

      if (updatedPayment.count === 0) {
        throw new Error('Permintaan pembayaran ini sudah diproses atau tidak lagi valid.');
      }

      // Reconcile profile.plan if user does not have another active entitlement
      const userProfile = await tx.profile.findUnique({
        where: { userId: request.userId },
        select: { trialEndsAt: true },
      });
      const activeBilling = await tx.billingSubscription.findFirst({
        where: { userId: request.userId, plan: PlanType.pro, status: 'active' },
      });
      const now = new Date();
      if (!activeBilling || (activeBilling.expiredAt && activeBilling.expiredAt <= now)) {
        if (userProfile && now >= userProfile.trialEndsAt) {
          await tx.profile.update({
            where: { userId: request.userId },
            data: { plan: PlanType.trial },
          });
        }
      }
    });

    const rejectedRequest = await prisma.paymentRequest.findUnique({
      where: { id: requestId },
      select: { userId: true, adminNote: true },
    });

    await createAuditLog(user.uid, 'REJECT_PAYMENT', 'paymentRequest', requestId);
    if (rejectedRequest) {
      await sendPaymentStatusEmail({
        userId: rejectedRequest.userId,
        type: 'rejected',
        adminNote: rejectedRequest.adminNote,
      });
    }
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
      } else if (newPlan === PlanType.trial && targetProfile.trialEndsAt && targetProfile.trialEndsAt > new Date()) {
        baseDate = new Date(targetProfile.trialEndsAt);
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

export async function resetUserFinancialDataByAdmin(targetUserId: string) {
  try {
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    if (!targetUserId || typeof targetUserId !== 'string' || !targetUserId.trim()) {
      throw new Error('Target pengguna tidak valid.');
    }

    const res = await executeFinancialDataReset(targetUserId, {
      userId: user.uid,
      role: 'admin',
    });

    revalidatePath('/norden-control-center');
    revalidatePath('/dashboard');

    return {
      success: true,
      targetName: res.targetName,
      counts: res.counts,
    };
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : '';
    if (
      rawMessage === 'Anda tidak memiliki akses untuk melakukan tindakan ini.' ||
      rawMessage === 'Target pengguna tidak valid.' ||
      rawMessage === 'ID pengguna target tidak valid.' ||
      rawMessage === 'Profil pengguna tidak ditemukan.'
    ) {
      return { success: false, error: rawMessage };
    }

    console.error('resetUserFinancialDataByAdmin database error:', error instanceof Error ? error.name : 'Unknown error');

    if (rawMessage.includes('Transaction') || rawMessage.includes('timeout') || rawMessage.includes('P2024')) {
      return {
        success: false,
        error: 'Reset data keuangan tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      };
    }

    return { success: false, error: 'Gagal mereset data keuangan pengguna karena gangguan sistem database.' };
  }
}

export async function deleteUserAccountByAdmin(targetUserId: string) {
  try {
    const { user, profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    if (targetUserId === user.uid) {
      throw new Error('Anda tidak dapat menghapus akun admin yang sedang digunakan.');
    }

    if (!targetUserId || typeof targetUserId !== 'string' || !targetUserId.trim()) {
      throw new Error('Target pengguna tidak valid.');
    }

    const targetProfile = await prisma.profile.findUnique({
      where: { userId: targetUserId },
      select: { id: true, fullName: true, role: true },
    });

    if (!targetProfile) {
      throw new Error('Profil pengguna tidak ditemukan.');
    }

    if (targetProfile.role === 'admin') {
      throw new Error('Akun dengan role admin tidak dapat dihapus. Turunkan role menjadi user terlebih dahulu.');
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId: targetUserId } });
      await tx.budget.deleteMany({ where: { userId: targetUserId } });
      await tx.category.deleteMany({ where: { userId: targetUserId } });
      await tx.balance.deleteMany({ where: { userId: targetUserId } });

      await tx.savingGoal.deleteMany({ where: { userId: targetUserId } });
      await tx.wishlistItem.deleteMany({ where: { userId: targetUserId } });
      await tx.debt.deleteMany({ where: { userId: targetUserId } });
      await tx.paylater.deleteMany({ where: { userId: targetUserId } });
      await tx.appSubscription.deleteMany({ where: { userId: targetUserId } });
      await tx.emergencyFundPlan.deleteMany({ where: { userId: targetUserId } });
      await tx.transactionTemplate.deleteMany({ where: { userId: targetUserId } });
      await tx.recurringTransaction.deleteMany({ where: { userId: targetUserId } });
      await tx.reminder.deleteMany({ where: { userId: targetUserId } });
      await tx.streak.deleteMany({ where: { userId: targetUserId } });
      await tx.achievement.deleteMany({ where: { userId: targetUserId } });
      await tx.notification.deleteMany({ where: { userId: targetUserId } });
      await tx.paymentRequest.deleteMany({ where: { userId: targetUserId } });
      await tx.billingSubscription.deleteMany({ where: { userId: targetUserId } });
      await tx.feedback.deleteMany({ where: { userId: targetUserId } });
      await tx.auditLog.deleteMany({ where: { userId: targetUserId } });
      await tx.profile.delete({ where: { userId: targetUserId } });
    }, {
      maxWait: 5000,
      timeout: 20000,
    });

    try {
      const adminAuth = getAdminAuth();
      if (adminAuth.deleteUser) {
        await adminAuth.deleteUser(targetUserId);
      }
    } catch (authError) {
      console.warn('Firebase Auth user deletion skipped or failed:', authError);
    }

    await createAuditLog(user.uid, `ADMIN_DELETE_USER_${targetProfile.role.toUpperCase()}`, 'profile', targetUserId);
    revalidatePath('/norden-control-center');
    revalidatePath('/dashboard');

    return { success: true, deletedName: targetProfile.fullName || 'Tanpa Nama' };
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : '';
    if (
      rawMessage === 'Anda tidak memiliki akses untuk melakukan tindakan ini.' ||
      rawMessage === 'Anda tidak dapat menghapus akun admin yang sedang digunakan.' ||
      rawMessage === 'Target pengguna tidak valid.' ||
      rawMessage === 'Profil pengguna tidak ditemukan.'
    ) {
      return { success: false, error: rawMessage };
    }

    console.error('deleteUserAccountByAdmin database error:', error instanceof Error ? error.name : 'Unknown error');

    if (rawMessage.includes('Transaction') || rawMessage.includes('timeout') || rawMessage.includes('P2024')) {
      return {
        success: false,
        error: 'Penghapusan akun tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      };
    }

    return { success: false, error: 'Gagal menghapus akun pengguna karena gangguan sistem database.' };
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
    let qrisImage = settingsMap.get('qris_image') || '';
    if (qrisImage.startsWith('qris/')) {
      try {
        const { getPublicUrl } = await import('../../lib/storage');
        qrisImage = getPublicUrl(qrisImage);
      } catch {
        // keep path if public url resolution fails
      }
    }

    return {
      success: true,
      data: {
        bca_number: settingsMap.get('bca_number') || '',
        bca_holder: settingsMap.get('bca_holder') || '',
        bca_active: settingsMap.get('bca_active') || 'false',
        bni_number: settingsMap.get('bni_number') || '',
        bni_holder: settingsMap.get('bni_holder') || '',
        bni_active: settingsMap.get('bni_active') || 'false',
        qris_image: qrisImage,
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
        data.qris_image.startsWith('data:')
      ) {
        throw new Error('Gambar QRIS aktif tidak valid');
      }

      const isCanonical = data.qris_image.startsWith('qris/') && !data.qris_image.includes('..') && !data.qris_image.includes('\\');
      const isSupabasePublicUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/qris\//.test(data.qris_image);
      const isDevMock = process.env.NODE_ENV !== 'production' && data.qris_image.startsWith('/api/mock-file?');
      const isLegacyFirebase = /^https:\/\/firebasestorage\.googleapis\.com\/|^https:\/\/storage\.googleapis\.com\//.test(data.qris_image);

      if (!isCanonical && !isSupabasePublicUrl && !isDevMock && !isLegacyFirebase) {
        throw new Error('Gambar QRIS aktif harus berupa referensi atau URL Supabase Storage yang valid');
      }

      // Canonicalize full Supabase public URL to qris/<filename> for storage in Setting
      if (isSupabasePublicUrl) {
        const match = data.qris_image.match(/(qris\/[^?#]+)/);
        if (match) {
          data.qris_image = match[1];
        }
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

export async function updatePricingSettings(data: {
  trial_days: number;
  monthly_price: number;
  yearly_price: number;
  trial_active: boolean;
  monthly_active: boolean;
  yearly_active: boolean;
}) {
  try {
    const { profile } = await requireUser(true);

    if (profile.role !== 'admin') {
      throw new Error('Anda tidak memiliki akses untuk melakukan tindakan ini.');
    }

    const trialDays = Math.round(Number(data.trial_days || DEFAULT_TRIAL_DAYS));
    const monthlyPrice = Math.round(Number(data.monthly_price || DEFAULT_MONTHLY_PRICE));
    const yearlyPrice = Math.round(Number(data.yearly_price || DEFAULT_YEARLY_PRICE));

    if (!Number.isFinite(trialDays) || trialDays < 1 || trialDays > 365) {
      throw new Error('Durasi trial harus antara 1 sampai 365 hari.');
    }
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
      throw new Error('Harga bulanan tidak valid.');
    }
    if (!Number.isFinite(yearlyPrice) || yearlyPrice < 0) {
      throw new Error('Harga tahunan tidak valid.');
    }

    await prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.setting.upsert({
          where: { key: 'trial_days' },
          update: { value: String(trialDays) },
          create: { key: 'trial_days', value: String(trialDays) },
        }),
        tx.setting.upsert({
          where: { key: 'monthly_price' },
          update: { value: String(monthlyPrice) },
          create: { key: 'monthly_price', value: String(monthlyPrice) },
        }),
        tx.setting.upsert({
          where: { key: 'yearly_price' },
          update: { value: String(yearlyPrice) },
          create: { key: 'yearly_price', value: String(yearlyPrice) },
        }),
      ]);

      const trialPlan = await tx.plan.findFirst({ where: { type: 'trial' } });
      if (trialPlan) {
        await tx.plan.update({
          where: { id: trialPlan.id },
          data: {
            name: 'Trial Plan',
            price: 0,
            type: 'trial',
            billingType: null,
            durationDays: trialDays,
            isActive: data.trial_active,
          },
        });
      } else {
        await tx.plan.create({
          data: {
            id: 'default-trial-plan',
            name: 'Trial Plan',
            price: 0,
            type: 'trial',
            billingType: null,
            durationDays: trialDays,
            isActive: data.trial_active,
          },
        });
      }

      const monthlyPlan = await tx.plan.findFirst({ where: { type: 'pro', billingType: 'monthly' } });
      if (monthlyPlan) {
        await tx.plan.update({
          where: { id: monthlyPlan.id },
          data: {
            name: 'Pro Monthly',
            price: monthlyPrice,
            type: 'pro',
            billingType: 'monthly',
            durationDays: null,
            isActive: data.monthly_active,
          },
        });
      } else {
        await tx.plan.create({
          data: {
            id: 'default-pro-monthly',
            name: 'Pro Monthly',
            price: monthlyPrice,
            type: 'pro',
            billingType: 'monthly',
            isActive: data.monthly_active,
          },
        });
      }

      const yearlyPlan = await tx.plan.findFirst({ where: { type: 'pro', billingType: 'yearly' } });
      if (yearlyPlan) {
        await tx.plan.update({
          where: { id: yearlyPlan.id },
          data: {
            name: 'Pro Yearly',
            price: yearlyPrice,
            type: 'pro',
            billingType: 'yearly',
            durationDays: null,
            isActive: data.yearly_active,
          },
        });
      } else {
        await tx.plan.create({
          data: {
            id: 'default-pro-yearly',
            name: 'Pro Yearly',
            price: yearlyPrice,
            type: 'pro',
            billingType: 'yearly',
            isActive: data.yearly_active,
          },
        });
      }
    });

    revalidatePath('/');
    revalidatePath('/upgrade');
    revalidatePath('/dashboard');
    revalidatePath('/norden-control-center');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memperbarui pengaturan harga';
    return { success: false, error: message };
  }
}
