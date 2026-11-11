import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma';
import { GET } from '../app/api/health/route';

describe('Health Check API (/api/health)', () => {
  const origQueryRaw = prisma.$queryRaw;
  const origMaintenanceMode = process.env.MAINTENANCE_MODE;

  afterEach(() => {
    prisma.$queryRaw = origQueryRaw;
    if (origMaintenanceMode === undefined) {
      delete process.env.MAINTENANCE_MODE;
    } else {
      process.env.MAINTENANCE_MODE = origMaintenanceMode;
    }
  });

  it('returns healthy status and 200 when database responds', async () => {
    delete process.env.MAINTENANCE_MODE;
    (prisma as unknown as { $queryRaw: unknown }).$queryRaw = async () => [{ '?column?': 1 }];

    const res = await GET();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store, max-age=0, must-revalidate');

    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.database, 'connected');
    assert.equal(data.maintenance, false);
    assert.ok(typeof data.latencyMs === 'number');
    assert.ok(typeof data.timestamp === 'string');
  });

  it('reports maintenance status when maintenance mode is active', async () => {
    process.env.MAINTENANCE_MODE = 'true';
    (prisma as unknown as { $queryRaw: unknown }).$queryRaw = async () => [{ '?column?': 1 }];

    const res = await GET();
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, 'maintenance');
    assert.equal(data.database, 'connected');
    assert.equal(data.maintenance, true);
  });

  it('returns unhealthy and 503 when database query throws', async () => {
    (prisma as unknown as { $queryRaw: unknown }).$queryRaw = async () => {
      throw new Error('Connection refused at 5432');
    };

    const res = await GET();
    assert.equal(res.status, 503);

    const data = await res.json();
    assert.equal(data.status, 'unhealthy');
    assert.equal(data.database, 'disconnected');
    assert.equal(data.error, 'Database connection check failed');
  });
});
