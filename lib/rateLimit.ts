import net from 'net';
import { NextResponse } from 'next/server';
import { prisma } from './prisma';

/**
 * Thrown when an endpoint exceeds its rate limit threshold.
 */
export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;
  readonly resetAt: Date;

  constructor(
    message = 'Terlalu banyak request. Coba lagi nanti.',
    retryAfterSeconds = 60,
    resetAt?: Date
  ) {
    super(message);
    this.name = 'RateLimitExceededError';
    this.retryAfterSeconds = Math.max(1, Math.round(retryAfterSeconds));
    this.resetAt = resetAt || new Date(Date.now() + this.retryAfterSeconds * 1000);
  }
}

/**
 * Thrown in production when a client IP cannot be verified from trusted edge headers.
 */
export class RateLimitIpError extends Error {
  constructor(message = 'Tidak dapat menentukan alamat IP klien yang valid.') {
    super(message);
    this.name = 'RateLimitIpError';
  }
}

/**
 * Standard HTTP 429 response helper with Retry-After header.
 */
export function rateLimitResponse(
  error: RateLimitExceededError | Error,
  customMessage?: string
): NextResponse {
  const retryAfter =
    error instanceof RateLimitExceededError ? error.retryAfterSeconds : 60;
  const message =
    customMessage || error.message || 'Terlalu banyak request. Coba lagi nanti.';

  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Extract and validate the public client IP address from request headers.
 * Under Vercel's default topology, Vercel Edge sanitizes and overwrites x-forwarded-for.
 */
export function extractClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const candidate = forwardedFor || realIp || null;

  if (candidate && net.isIP(candidate) !== 0) {
    return candidate;
  }
  return null;
}

/**
 * Generate a deterministic rate limit key scoped by endpoint and client IP.
 */
export function rateLimitKey(request: Request, scope: string): string {
  const ip = extractClientIp(request);
  if (ip) {
    return `${scope}:${ip}`;
  }

  // Allow localhost / loopback in development and local test harnesses
  if (process.env.NODE_ENV !== 'production') {
    return `${scope}:127.0.0.1`;
  }

  // In production, reject unidentifiable clients rather than collapsing into a DoS-prone shared key
  throw new RateLimitIpError();
}

/**
 * Atomic PostgreSQL-backed rate limit counter.
 */
export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  const resetAt = new Date(Date.now() + windowMs);
  const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" <= NOW() THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt"
  `;

  const row = rows[0];
  const count = row?.count || 0;
  const currentResetAt = row?.resetAt ? new Date(row.resetAt) : resetAt;

  if (count > limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((currentResetAt.getTime() - Date.now()) / 1000)
    );
    throw new RateLimitExceededError(
      'Terlalu banyak request. Coba lagi nanti.',
      retryAfterSeconds,
      currentResetAt
    );
  }
}

/**
 * Prune expired RateLimitBucket records older than the retention threshold.
 * Default retention is 24 hours beyond expiry, ensuring active windows are undisturbed.
 */
export async function cleanupExpiredRateLimits(
  olderThanMs = 24 * 60 * 60 * 1000
): Promise<{ deletedCount: number }> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const deletedCount = await prisma.$executeRaw`
    DELETE FROM "RateLimitBucket"
    WHERE "resetAt" < ${cutoff}
  `;
  return { deletedCount: Number(deletedCount) };
}
