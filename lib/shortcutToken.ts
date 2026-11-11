import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from './prisma';
import { getUserEntitlement } from './entitlements';
import { getPublicAppUrl } from './appUrl';

type ShortcutTokenPayload = {
  userId: string;
  version: number;
  exp?: number;
};

export const SHORTCUT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getShortcutSecret(): string {
  const secret = process.env.SHORTCUT_TOKEN_SECRET;

  if (secret?.trim()) {
    return secret.trim();
  }

  throw new Error('Shortcut token secret is not configured.');
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

export function signShortcutToken(userId: string, version: number, ttlMs = SHORTCUT_TOKEN_TTL_MS) {
  const exp = Date.now() + ttlMs;
  const payload = base64UrlEncode(JSON.stringify({ userId, version, exp }));
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function buildShortcutEndpoint() {
  return `${getShortcutAppUrl()}/api/shortcut`;
}

export async function getShortcutEndpointForUser(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { shortcutTokenVersion: true },
  });

  if (!profile) {
    throw new Error('Profil tidak ditemukan.');
  }

  const token = signShortcutToken(userId, profile.shortcutTokenVersion);

  return {
    endpoint: buildShortcutEndpoint(),
    token,
  };
}

export function parseShortcutToken(token: string): ShortcutTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [payload, signature] = parts;

    if (!payload || !signature || !isSafeEqual(signature, signPayload(payload))) {
      return null;
    }

    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<ShortcutTokenPayload>;

    if (typeof parsed.userId !== 'string' || !parsed.userId || typeof parsed.version !== 'number') {
      return null;
    }

    if (parsed.exp && typeof parsed.exp === 'number' && Date.now() > parsed.exp) {
      return null;
    }

    return {
      userId: parsed.userId,
      version: parsed.version,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export async function validateShortcutToken(token: string) {
  const parsed = parseShortcutToken(token);
  if (!parsed) return null;

  try {
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
