import { createHmac, timingSafeEqual } from 'crypto';

type PinResetPayload = {
  userId: string;
  code: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.SHORTCUT_TOKEN_SECRET || process.env.CRON_SECRET;
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

export function generatePinResetToken(userId: string): { token: string; code: string } {
  // 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const exp = Date.now() + 15 * 60 * 1000; // 15 minutes
  const payloadStr = JSON.stringify({ userId, code, exp });
  const encodedPayload = base64UrlEncode(payloadStr);
  const signature = sign(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  return { token, code };
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

    if (code && payload.code !== code.trim()) {
      return { valid: false, error: 'Kode verifikasi 6-digit salah' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Gagal memverifikasi token reset' };
  }
}
