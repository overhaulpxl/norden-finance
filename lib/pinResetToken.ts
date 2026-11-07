import { createHmac, timingSafeEqual, randomInt, randomBytes } from 'crypto';

type MagicLinkPayload = {
  userId: string;
  exp: number;
  type: 'magic_link';
  jti: string;
};

type OtpSessionPayload = {
  userId: string;
  exp: number;
  type: 'otp_session';
  codeHash: string;
};

type LegacyPayload = {
  userId: string;
  code: string;
  exp: number;
  type?: undefined;
};

type PinResetPayload = MagicLinkPayload | OtpSessionPayload | LegacyPayload;

function getSecret(): string {
  const secret =
    process.env.SHORTCUT_TOKEN_SECRET ||
    process.env.CRON_SECRET ||
    process.env.FIREBASE_PRIVATE_KEY;
  if (secret && secret.trim()) {
    return secret.trim();
  }
  return 'norden-pin-reset-fallback-secret-2026';
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str, 'utf8').toString('base64url');
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, 'base64url').toString('utf8');
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function hashOtpCode(code: string): string {
  return createHmac('sha256', getSecret()).update(`otp:${code.trim()}`).digest('hex');
}

/**
 * Generate PIN reset tokens:
 * 1. `magicToken`: Capability token embedded ONLY in the emailed link URL.
 * 2. `sessionToken`: Client token returned to the lock screen modal; strictly requires the 6-digit OTP to verify.
 * 3. `code`: 6-digit OTP sent to user email.
 */
export function generatePinResetTokens(userId: string): {
  code: string;
  magicToken: string;
  sessionToken: string;
} {
  const code = randomInt(100000, 1000000).toString();
  const exp = Date.now() + 15 * 60 * 1000; // 15 minutes

  // 1. Magic Link Token - ONLY included in the emailed link
  const magicPayload: MagicLinkPayload = {
    userId,
    exp,
    type: 'magic_link',
    jti: randomBytes(16).toString('hex'),
  };
  const magicEncoded = base64UrlEncode(JSON.stringify(magicPayload));
  const magicToken = `${magicEncoded}.${sign(magicEncoded)}`;

  // 2. OTP Session Token - returned in API to modal, requires matching 6-digit OTP code to verify
  const sessionPayload: OtpSessionPayload = {
    userId,
    exp,
    type: 'otp_session',
    codeHash: hashOtpCode(code),
  };
  const sessionEncoded = base64UrlEncode(JSON.stringify(sessionPayload));
  const sessionToken = `${sessionEncoded}.${sign(sessionEncoded)}`;

  return { code, magicToken, sessionToken };
}

/**
 * Backward compatibility alias for single token generation.
 */
export function generatePinResetToken(userId: string): { token: string; code: string } {
  const { code, magicToken } = generatePinResetTokens(userId);
  return { token: magicToken, code };
}

export function verifyPinResetToken(
  token: string,
  userId: string,
  code?: string
): { valid: boolean; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Format token tidak valid' };
    }

    const [encodedPayload, signature] = parts;
    const expectedSignature = sign(encodedPayload);

    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expSigBuf.length || !timingSafeEqual(sigBuf, expSigBuf)) {
      return { valid: false, error: 'Tanda tangan token tidak sah' };
    }

    const payload: PinResetPayload = JSON.parse(base64UrlDecode(encodedPayload));

    if (payload.userId !== userId) {
      return { valid: false, error: 'Token bukan milik pengguna ini' };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, error: 'Kode reset telah kadaluarsa (lebih dari 15 menit)' };
    }

    // Flow A: Magic link token (bearer authority from private email inbox)
    if (payload.type === 'magic_link') {
      return { valid: true };
    }

    // Flow B: OTP session token (client modal submission, strictly requires matching 6-digit code)
    if (payload.type === 'otp_session') {
      const cleanCode = code?.trim() || '';
      if (!cleanCode || cleanCode.length !== 6) {
        return { valid: false, error: 'Kode verifikasi 6-digit wajib diisi' };
      }

      const inputHash = hashOtpCode(cleanCode);
      const inputHashBuf = Buffer.from(inputHash);
      const expectedHashBuf = Buffer.from(payload.codeHash || '');

      if (
        inputHashBuf.length !== expectedHashBuf.length ||
        !timingSafeEqual(inputHashBuf, expectedHashBuf)
      ) {
        return { valid: false, error: 'Kode verifikasi 6-digit salah' };
      }

      return { valid: true };
    }

    // Legacy fallback (if any older payload is still valid within 15 mins)
    if ('code' in payload && payload.code) {
      if (!code || payload.code !== code.trim()) {
        return { valid: false, error: 'Kode verifikasi 6-digit salah' };
      }
      return { valid: true };
    }

    return { valid: false, error: 'Tipe token tidak valid' };
  } catch {
    return { valid: false, error: 'Gagal memverifikasi token reset' };
  }
}
