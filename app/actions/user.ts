'use server';

import { requireUser, SESSION_CONFIG } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { buildShortcutEndpoint, getShortcutEndpointForUser, signShortcutToken } from '../../lib/shortcutToken';
import { executeFinancialDataReset } from '../../lib/financialReset';
import { getTrialDays } from '../../lib/data/loaders';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { sendPasswordResetEmail, sendPinResetEmail } from '../../lib/authEmail';
import { generatePinResetTokens, verifyPinResetToken } from '../../lib/pinResetToken';
import { assertRateLimit } from '../../lib/rateLimit';

export async function completeOnboarding(data: {
  fullName: string;
  walletName: string;
  openingBalance: number;
}) {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;
    const walletName = data.walletName.trim().toUpperCase();

    if (!data.fullName.trim()) throw new Error('Nama wajib diisi');
    if (!walletName) throw new Error('Nama wallet wajib diisi');
    if (!Number.isFinite(data.openingBalance) || data.openingBalance < 0) {
      throw new Error('Saldo awal tidak valid');
    }

    const currentProfile = await prisma.profile.findUnique({
      where: { userId },
      select: { onboardingCompleted: true, trialStartedAt: true, trialEndsAt: true },
    });

    if (!currentProfile) {
      throw new Error('Profil pengguna tidak ditemukan.');
    }

    // Trial starts ONLY upon completing onboarding for the first time
    const shouldActivateTrial = !currentProfile.onboardingCompleted;
    const now = new Date();
    const trialDays = await getTrialDays();
    const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { userId },
        data: {
          fullName: data.fullName.trim(),
          onboardingCompleted: true,
          ...(shouldActivateTrial ? { trialStartedAt: now, trialEndsAt } : {}),
        },
      });

      if (shouldActivateTrial) {
        await tx.billingSubscription.updateMany({
          where: { userId, plan: 'trial' },
          data: {
            startedAt: now,
            expiredAt: trialEndsAt,
            status: 'trial',
          },
        });
      }

      const ewallets = ['DANA', 'GOPAY', 'OVO', 'SHOPEEPAY', 'LINKAJA'];
      const cashNames = ['CASH', 'TUNAI'];
      let walletType = 'bank';
      if (ewallets.includes(walletName)) walletType = 'ewallet';
      if (cashNames.includes(walletName)) walletType = 'cash';

      await tx.balance.upsert({
        where: { userId_name: { userId, name: walletName } },
        update: { currentBalance: data.openingBalance, type: walletType, archivedAt: null },
        create: {
          userId,
          name: walletName,
          type: walletType,
          currentBalance: data.openingBalance,
        },
      });
    });

    revalidatePath('/dashboard');
    revalidatePath('/onboarding');

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menyelesaikan onboarding';
    return { success: false, error: message };
  }
}

export async function resetUserFinancialData() {
  try {
    const { user } = await requireUser(false);
    const res = await executeFinancialDataReset(user.uid, {
      userId: user.uid,
      role: 'user',
    });

    revalidatePath('/dashboard');
    revalidatePath('/settings');
    return { success: true, counts: res.counts };
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : '';
    if (rawMessage === 'Anda harus login terlebih dahulu.') {
      return { success: false, error: rawMessage };
    }

    console.error('resetUserFinancialData database error:', error instanceof Error ? error.name : 'Unknown error');

    if (rawMessage.includes('Transaction') || rawMessage.includes('timeout') || rawMessage.includes('P2024')) {
      return {
        success: false,
        error: 'Reset data keuangan tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      };
    }

    return { success: false, error: 'Gagal mereset data keuangan karena gangguan sistem database.' };
  }
}

export async function deleteUserAccountData() {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;

    // Delete everything in a secure transaction
    await prisma.$transaction(async (tx) => {
      // Delete child models referencing Category / Balance first
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });
      await tx.balance.deleteMany({ where: { userId } });
      
      // Delete other client models
      await tx.savingGoal.deleteMany({ where: { userId } });
      await tx.wishlistItem.deleteMany({ where: { userId } });
      await tx.debt.deleteMany({ where: { userId } });
      await tx.paylater.deleteMany({ where: { userId } });
      await tx.appSubscription.deleteMany({ where: { userId } });
      await tx.emergencyFundPlan.deleteMany({ where: { userId } });
      await tx.transactionTemplate.deleteMany({ where: { userId } });
      await tx.recurringTransaction.deleteMany({ where: { userId } });
      await tx.reminder.deleteMany({ where: { userId } });
      await tx.streak.deleteMany({ where: { userId } });
      await tx.achievement.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.paymentRequest.deleteMany({ where: { userId } });
      await tx.billingSubscription.deleteMany({ where: { userId } });
      await tx.feedback.deleteMany({ where: { userId } });
      await tx.auditLog.deleteMany({ where: { userId } });
      
      // Finally delete user profile
      await tx.profile.deleteMany({ where: { userId } });
    }, {
      maxWait: 5000,
      timeout: 20000,
    });

    try {
      const adminAuth = getAdminAuth();
      if (adminAuth.deleteUser) {
        await adminAuth.deleteUser(userId);
      }
    } catch (authError) {
      console.warn('Firebase Auth user deletion skipped or failed:', authError);
    }

    // Clear session cookie on server
    const cookieStore = await cookies();
    cookieStore.set(SESSION_CONFIG.name, '', {
      ...SESSION_CONFIG.options,
      maxAge: 0,
    });

    return { success: true };
  } catch (error: unknown) {
    const rawMessage = error instanceof Error ? error.message : '';
    if (rawMessage === 'Anda harus login terlebih dahulu.') {
      return { success: false, error: rawMessage };
    }

    console.error('deleteUserAccountData database error:', error instanceof Error ? error.name : 'Unknown error');

    if (rawMessage.includes('Transaction') || rawMessage.includes('timeout') || rawMessage.includes('P2024')) {
      return {
        success: false,
        error: 'Penghapusan data akun tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      };
    }

    return { success: false, error: 'Gagal menghapus data akun karena gangguan sistem database.' };
  }
}

export async function submitFeedback(data: {
  rating: number;
  message: string;
}) {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;

    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      throw new Error('Rating harus bernilai 1 sampai 5');
    }
    if (!data.message || !data.message.trim()) {
      throw new Error('Pesan ulasan wajib diisi');
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        rating: data.rating,
        message: data.message.trim(),
        status: 'open',
      },
    });

    return { success: true, data: { id: feedback.id } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirimkan ulasan';
    return { success: false, error: message };
  }
}

export async function getShortcutEndpoint() {
  try {
    const { user } = await requireUser(false);
    const endpoint = await getShortcutEndpointForUser(user.uid);

    return { success: true, endpoint };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal membuat endpoint shortcut';
    return { success: false, error: message };
  }
}

export async function regenerateShortcutToken() {
  try {
    const { user } = await requireUser(false);
    const profile = await prisma.profile.update({
      where: { userId: user.uid },
      data: { shortcutTokenVersion: { increment: 1 } },
      select: { shortcutTokenVersion: true },
    });
    const token = signShortcutToken(user.uid, profile.shortcutTokenVersion);

    return { success: true, endpoint: buildShortcutEndpoint(token) };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal reset token shortcut';
    return { success: false, error: message };
  }
}

export async function sendPasswordResetLinkAction(targetEmail?: string) {
  try {
    let emailToUse = targetEmail?.trim().toLowerCase();
    let userName: string | undefined;

    // Resolve from authenticated session if not provided
    if (!emailToUse) {
      try {
        const { user } = await requireUser(false);
        if (user.email) {
          emailToUse = user.email.toLowerCase();
        }
      } catch {
        // Not authenticated
      }
    }

    if (!emailToUse) {
      return { success: false, error: 'Alamat email wajib diisi.' };
    }

    // Verify user exists in Firebase Admin
    const adminAuth = getAdminAuth();
    try {
      const userRecord = await adminAuth.getUserByEmail(emailToUse);
      userName = userName || userRecord.displayName || undefined;
    } catch {
      return { success: false, error: 'Alamat email tidak terdaftar di sistem.' };
    }

    const sendRes = await sendPasswordResetEmail({
      email: emailToUse,
      userName,
    });

    if ('error' in sendRes && sendRes.error) {
      return { success: false, error: `Gagal mengirim email: ${sendRes.error}` };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim email reset password.';
    return { success: false, error: message };
  }
}

export async function requestPinResetAction(targetUserId?: string) {
  try {
    const { user } = await requireUser(false);
    const userId = targetUserId || user.uid;

    if (userId !== user.uid) {
      return { success: false, error: 'Akses ditolak.' };
    }

    if (!user.email) {
      return { success: false, error: 'Alamat email pengguna tidak ditemukan.' };
    }

    // Rate limit: maximum 3 email reset requests per 15 minutes per user
    await assertRateLimit(`pin-reset-request:${userId}`, 3, 15 * 60_000);

    const { code, magicToken, sessionToken } = generatePinResetTokens(userId);
    const adminAuth = getAdminAuth();
    let userName: string | undefined;
    try {
      const userRecord = await adminAuth.getUser(userId);
      userName = userRecord.displayName || undefined;
    } catch {
      // ignore
    }

    // Send magic link and OTP code to user's private email
    const sendRes = await sendPinResetEmail({
      email: user.email,
      code,
      token: magicToken, // Capability token ONLY embedded in email link
      userName,
    });

    if ('error' in sendRes && sendRes.error) {
      return { success: false, error: `Gagal mengirim email: ${sendRes.error}` };
    }

    // Return sessionToken ONLY to client (which strictly requires 6-digit OTP code to verify)
    return { success: true, email: user.email, token: sessionToken };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim email reset PIN.';
    return { success: false, error: message };
  }
}

export async function confirmPinResetCodeAction(input: {
  userId: string;
  token: string;
  code?: string;
}) {
  try {
    const { user } = await requireUser(false);
    if (user.uid !== input.userId) {
      return { success: false, error: 'Sesi akun tidak cocok.' };
    }

    // Rate limit verification attempts: maximum 5 attempts per 15 minutes per user
    await assertRateLimit(`pin-reset-verify:${user.uid}`, 5, 15 * 60_000);

    const verification = verifyPinResetToken(input.token, input.userId, input.code);
    if (!verification.valid) {
      return { success: false, error: verification.error || 'Verifikasi reset PIN gagal.' };
    }

    // Enforce single-use token consumption
    if (verification.signature) {
      const consumedKey = `consumed-pin-token:${verification.signature}`;
      const alreadyConsumed = await prisma.rateLimitBucket.findUnique({
        where: { key: consumedKey },
      });
      if (alreadyConsumed) {
        return { success: false, error: 'Tautan atau kode reset PIN ini sudah pernah digunakan.' };
      }

      await prisma.rateLimitBucket.upsert({
        where: { key: consumedKey },
        create: {
          key: consumedKey,
          count: 1,
          resetAt: new Date(verification.exp || Date.now() + 15 * 60 * 1000),
        },
        update: { count: { increment: 1 } },
      });
    }

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memverifikasi kode reset PIN.';
    return { success: false, error: message };
  }
}


