import { PrismaClient } from '@prisma/client';
import { isMaintenanceMode, WRITE_OPERATIONS } from './maintenance';

let prismaInstance: PrismaClient;

if (typeof window === 'undefined') {
  const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

  if (!globalForPrisma.prisma) {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

    (client as any).$use(async (params: any, next: any) => {
      if (isMaintenanceMode() && WRITE_OPERATIONS.has(params.action)) {
        throw new Error(
          `MAINTENANCE_ACTIVE: Write operation "${params.model || 'raw'}.${params.action}" is blocked by system maintenance freeze.`
        );
      }
      return next(params);
    });

    globalForPrisma.prisma = client;
  }
  prismaInstance = globalForPrisma.prisma;
} else {
  throw new Error('Prisma can only be used on the server');
}

export const prisma = prismaInstance;
