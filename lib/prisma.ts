import { PrismaClient } from '@prisma/client';
import {
  isMaintenanceMode,
  WRITE_OPERATIONS,
  assertRawExecutionBlocked,
  assertRawQueryAllowed,
} from './maintenance';

function createExtendedClient() {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

  const extended = baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (isMaintenanceMode() && WRITE_OPERATIONS.has(operation)) {
            throw new Error(
              `MAINTENANCE_ACTIVE: Write operation "${model}.${operation}" is blocked by system maintenance freeze.`
            );
          }
          return query(args);
        },
      },
      async $executeRaw({ args, query }) {
        assertRawExecutionBlocked('$executeRaw');
        return query(args);
      },
      async $executeRawUnsafe({ args, query }) {
        assertRawExecutionBlocked('$executeRawUnsafe');
        return query(args);
      },
      async $queryRaw({ args, query }) {
        assertRawQueryAllowed(args);
        return query(args);
      },
      async $queryRawUnsafe({ args, query }) {
        assertRawQueryAllowed(args);
        return query(args);
      },
    },
  });

  // Guard interactive transactions so tx closures also enforce maintenance freeze
  const originalTransaction = extended.$transaction.bind(extended);
  const guardedTransaction = (async (...args: unknown[]) => {
    if (typeof args[0] === 'function') {
      const userCallback = args[0] as (tx: unknown) => unknown;
      return originalTransaction(async (tx: object) => {
        const guardedTx = new Proxy(tx, {
          get(target, prop, receiver) {
            const orig = Reflect.get(target, prop, receiver);
            if (typeof prop === 'string' && typeof orig === 'object' && orig !== null) {
              return new Proxy(orig, {
                get(modelTarget, modelProp) {
                  if (typeof modelProp === 'string' && WRITE_OPERATIONS.has(modelProp)) {
                    if (isMaintenanceMode()) {
                      return () => {
                        throw new Error(
                          `MAINTENANCE_ACTIVE: Write operation "${prop}.${modelProp}" in interactive transaction is blocked by system maintenance freeze.`
                        );
                      };
                    }
                  }
                  return Reflect.get(modelTarget, modelProp);
                },
              });
            }
            if (prop === '$executeRaw' || prop === '$executeRawUnsafe') {
              return () => {
                assertRawExecutionBlocked(String(prop));
              };
            }
            if (prop === '$queryRaw' || prop === '$queryRawUnsafe') {
              return (queryArgs: unknown) => {
                assertRawQueryAllowed(queryArgs);
                return (orig as (arg: unknown) => unknown).call(target, queryArgs);
              };
            }
            return orig;
          },
        });
        return userCallback(guardedTx);
      }, args[1] as Parameters<typeof originalTransaction>[1]);
    }
    return (originalTransaction as unknown as (...a: unknown[]) => unknown)(...args);
  }) as typeof extended.$transaction;

  (extended as { $transaction: typeof guardedTransaction }).$transaction = guardedTransaction;

  return extended;
}

type ExtendedPrismaClient = PrismaClient;

let prismaInstance: ExtendedPrismaClient;

if (typeof window === 'undefined') {
  const globalForPrisma = globalThis as unknown as { prisma: ExtendedPrismaClient | undefined };

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createExtendedClient() as unknown as PrismaClient;
  }
  prismaInstance = globalForPrisma.prisma;
} else {
  throw new Error('Prisma can only be used on the server');
}

export const prisma = prismaInstance;
