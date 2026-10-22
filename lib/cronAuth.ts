import crypto from 'crypto';
import { NextResponse } from 'next/server';

export interface CronAuthResult {
  authorized: boolean;
  response?: NextResponse;
}

/**
 * Validates that an incoming cron request carries the expected CRON_SECRET Bearer token.
 * Used by both GET (Vercel Cron) and POST (manual/external cron runners).
 */
export function verifyCronAuthorization(request: Request): CronAuthResult {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Server configuration error: CRON_SECRET is not configured' },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Missing Authorization header' },
        { status: 401 }
      ),
    };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Invalid Authorization format' },
        { status: 401 }
      ),
    };
  }

  const providedSecret = match[1].trim();
  const bufExpected = Buffer.from(expectedSecret);
  const bufProvided = Buffer.from(providedSecret);

  const isValid =
    bufExpected.length === bufProvided.length &&
    crypto.timingSafeEqual(bufExpected, bufProvided);

  if (!isValid) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized: Invalid secret' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
