import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from './prisma';
import { getUserEntitlement } from './entitlements';
import { getPublicAppUrl } from './appUrl';

type ShortcutTokenPayload = {
  userId: string;
  version: number;
};

function getShortcutSecret() {
  const secret = process.env.SHORTCUT_TOKEN_SECRET || process.env.CRON_SECRET;

  if (secret?.trim()) {
    return secret.trim();
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Shortcut token secret is not configured.');
  }

  return 'development-shortcut-token-secret-change-before-production';
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(payload: string) {
  return createHmac('sha256', getShortcutSecret()).update(payload).digest('base64url');
}

function isSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function getShortcutAppUrl() {
  return getPublicAppUrl();
}

export function signShortcutToken(userId: string, version: number) {
  const payload = base64UrlEncode(JSON.stringify({ userId, version }));
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function buildShortcutEndpoint(token: string) {
  return `${getShortcutAppUrl()}/api/shortcut?token=${encodeURIComponent(token)}`;
}

export async function getShortcutEndpointForUser(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { shortcutTokenVersion: true },
  });

  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

  return buildShortcutEndpoint(signShortcutToken(userId, profile.shortcutTokenVersion));
}

export async function validateShortcutToken(token: string) {
  try {
    const [payload, signature] = token.split('.');

    if (!payload || !signature || !isSafeEqual(signature, signPayload(payload))) {
      return null;
    }

    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<ShortcutTokenPayload>;

    if (typeof parsed.userId !== 'string' || !parsed.userId || typeof parsed.version !== 'number') {
      return null;
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: parsed.userId },
      select: { shortcutTokenVersion: true },
    });

    if (!profile || profile.shortcutTokenVersion !== parsed.version) {
      return null;
    }

    return parsed.userId;
  } catch {
    return null;
  }
}

export async function assertShortcutWriteAccess(userId: string) {
  const entitlement = await getUserEntitlement(userId);

  if (!entitlement.onboardingCompleted) {
    throw new Error('Selesaikan onboarding terlebih dahulu.');
  }

  if (!entitlement.canWriteBasicFinance) {
    throw new Error('Akses shortcut tidak tersedia.');
  }

  return entitlement;
}
