import { NextResponse } from 'next/server';
import { processDueEmailReminders } from '../../../actions/reminders';
import { verifyCronAuthorization } from '../../../../lib/cronAuth';
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

  const result = await processDueEmailReminders();
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}
