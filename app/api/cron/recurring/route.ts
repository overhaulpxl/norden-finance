import { NextResponse } from 'next/server';
import { processDueRecurringTransactions } from '../../../actions/recurring';
import { verifyCronAuthorization } from '../../../../lib/cronAuth';
import { cleanupExpiredRateLimits } from '../../../../lib/rateLimit';
import { isMaintenanceMode } from '../../../../lib/maintenance';

async function handleCron(request: Request) {
  const authCheck = verifyCronAuthorization(request);
  if (!authCheck.authorized) {
    return authCheck.response!;
  }

  if (isMaintenanceMode()) {
    return NextResponse.json(
      { status: 'skipped', reason: 'maintenance_freeze_active' },
      { status: 503 }
    );
  }

  // 1. Process recurring financial transactions
  const recurringResult = await processDueRecurringTransactions();

  // 2. Perform bounded rate-limit bucket cleanup (24-hour buffer)
  let rateLimitCleanup: { deletedCount: number } | { error: string } = { deletedCount: 0 };
  try {
    rateLimitCleanup = await cleanupExpiredRateLimits();
  } catch (cleanupError: unknown) {
    const errorMsg = cleanupError instanceof Error ? cleanupError.message : 'Cleanup failed';
    console.error('Rate limit bucket cleanup error:', errorMsg);
    rateLimitCleanup = { error: errorMsg };
  }

  return NextResponse.json({
    ...recurringResult,
    rateLimitCleanup,
  });
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
