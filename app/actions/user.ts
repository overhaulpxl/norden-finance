'use server';

import { requireUser, SESSION_CONFIG } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { cookies } from 'next/headers';
import { buildShortcutEndpoint, getShortcutEndpointForUser, signShortcutToken } from '../../lib/shortcutToken';
import { executeFinancialDataReset } from '../../lib/financialReset';
import { getTrialDays } from '../../lib/data/loaders';
import { getAdminAuth } from '../../lib/firebaseAdmin';
import { sendPasswordResetEmail, sendPinResetEmail } from '../../lib/authEmail';
import { generatePinResetTokens, verifyPinResetToken } from '../../lib/pinResetToken';
import { assertRateLimit } from '../../lib/rateLimit';
import { assertNonEmpty, assertNonNegativeInt } from '../../lib/validators';
import { deleteUserStorageObjects } from '../../lib/storage';
import { sanitizeActionError, safeRevalidatePath } from '../../lib/actionErrors';

export async function completeOnboarding(data: {
  fullName: string;
  walletName: string;
  openingBalance: number;
}) {
  try {
    const { user } = await requireUser(false);
    const userId = user.uid;

    assertNonEmpty(data.fullName, 'Nama');
    assertNonEmpty(data.walletName, 'Nama wallet');
    assertNonNegativeInt(data.openingBalance, 'Saldo awal');
    if (data.openingBalance > 1_000_000_000_000) {
      throw new Error('Saldo awal terlalu besar');
    }

    const cleanFullName = data.fullName.trim().slice(0, 80);
    const walletName = data.walletName.trim().toUpperCase().slice(0, 50);

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
          fullName: cleanFullName,
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

    safeRevalidatePath('/dashboard');
    safeRevalidatePath('/onboarding');

    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menyelesaikan onboarding');
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

    safeRevalidatePath('/dashboard');
    safeRevalidatePath('/settings');
    return { success: true, counts: res.counts };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mereset data keuangan');
    return { success: false, error: message };
  }
}

export async function deleteUserAccountData() {
  try {
    const { user, profile } = await requireUser(false);
    const userId = user.uid;

    if (profile.role === 'admin') {
      throw new Error('Akun admin tidak dapat dihapus melalui menu pengaturan.');
    }

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
      await tx.setting.deleteMany({
        where: {
          key: {
            in: [`portfolio_assets_${userId}`, `user_avatar_${userId}`],
          },
        },
      });
      
      // Finally delete user profile
      await tx.profile.deleteMany({ where: { userId } });
    }, {
      maxWait: 5000,
      timeout: 20000,
    });

    try {
      await deleteUserStorageObjects(userId);
    } catch (storageError) {
      console.warn('User storage objects deletion skipped or failed:', storageError);
    }

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
    const message = sanitizeActionError(error, 'Gagal menghapus data akun');
    return { success: false, error: message };
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

    await assertRateLimit(`submit-feedback:${userId}`, 5, 15 * 60_000);

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        rating: data.rating,
        message: data.message.trim().slice(0, 1000),
        status: 'open',
      },
    });

    return { success: true, data: { id: feedback.id } };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mengirimkan ulasan');
    return { success: false, error: message };
  }
}

export async function getShortcutEndpoint() {
  try {
    const { user } = await requireUser(false);
    const result = await getShortcutEndpointForUser(user.uid);

    return { success: true, endpoint: result.endpoint, token: result.token };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal membuat endpoint shortcut');
    return { success: false, error: message };
  }
}

export async function regenerateShortcutToken() {
  try {
    const { user } = await requireUser(false);
    const profile = await prisma.profile.upsert({
      where: { userId: user.uid },
      create: {
        userId: user.uid,
        shortcutTokenVersion: 2,
        trialEndsAt: new Date(),
      },
      update: {
        shortcutTokenVersion: { increment: 1 },
      },
      select: { shortcutTokenVersion: true },
    });
    const version = profile?.shortcutTokenVersion ?? 2;
    const token = signShortcutToken(user.uid, version);

    return { success: true, endpoint: buildShortcutEndpoint(), token };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal reset token shortcut');
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

    // Rate limit: max 3 password reset requests per 15 minutes per email
    await assertRateLimit(`password-reset-email:${emailToUse}`, 3, 15 * 60_000);

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
      return { success: false, error: sendRes.error };
    }
    if ('skipped' in sendRes) {
      return { success: false, error: 'Layanan pengiriman email belum dikonfigurasi pada server.' };
    }

    return { success: true };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mengirim email reset password.');
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
      return { success: false, error: sendRes.error };
    }
    if ('skipped' in sendRes) {
      return { success: false, error: 'Layanan pengiriman email belum dikonfigurasi pada server.' };
    }

    // Return sessionToken ONLY to client (which strictly requires 6-digit OTP code to verify)
    return { success: true, email: user.email, token: sessionToken };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal mengirim email reset PIN.');
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
    const message = sanitizeActionError(error, 'Gagal memverifikasi kode reset PIN.');
    return { success: false, error: message };
  }
}

export async function saveUserAvatarAction(avatarBase64: string | null) {
  try {
    const { user } = await requireUser(false);
    const key = `user_avatar_${user.uid}`;

    if (!avatarBase64) {
      await prisma.setting.deleteMany({ where: { key } });
      safeRevalidatePath('/dashboard');
      return { success: true, avatarUrl: null };
    }

    if (avatarBase64.length > 2_500_000) {
      return { success: false, error: 'Ukuran foto terlalu besar setelah dikompresi.' };
    }

    const isDataUri =
      avatarBase64.startsWith('data:image/jpeg;base64,') ||
      avatarBase64.startsWith('data:image/png;base64,') ||
      avatarBase64.startsWith('data:image/webp;base64,');
    const isHttps = avatarBase64.startsWith('https://');

    if (!isDataUri && !isHttps) {
      return { success: false, error: 'Format foto profil harus berupa gambar JPEG, PNG, atau WebP.' };
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value: avatarBase64 },
      create: { key, value: avatarBase64 },
    });

    safeRevalidatePath('/dashboard');
    return { success: true, avatarUrl: avatarBase64 };
  } catch (error: unknown) {
    const message = sanitizeActionError(error, 'Gagal menyimpan foto profil.');
    return { success: false, error: message };
  }
}

export async function getUserAvatarAction() {
  try {
    const { user } = await requireUser(false);
    const key = `user_avatar_${user.uid}`;
    const setting = await prisma.setting.findUnique({ where: { key } });
    return { success: true, avatarUrl: setting?.value || null };
  } catch {
    return { success: false, avatarUrl: null };
  }
}


