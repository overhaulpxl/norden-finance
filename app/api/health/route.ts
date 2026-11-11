import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMaintenanceMode } from '@/lib/maintenance';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = performance.now();
  const maintenance = isMaintenanceMode();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round((performance.now() - startTime) * 10) / 10;

    return NextResponse.json(
      {
        status: maintenance ? 'maintenance' : 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        latencyMs,
        maintenance,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (error: unknown) {
    const latencyMs = Math.round((performance.now() - startTime) * 10) / 10;
    console.error('Database health check failed:', error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        latencyMs,
        maintenance,
        error: 'Database connection check failed',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  }
}
