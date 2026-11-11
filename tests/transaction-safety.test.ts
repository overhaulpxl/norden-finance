import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma';
import { executeFinancialDataReset } from '../lib/financialReset';
import { resolveCategory, resolveWallet } from '../app/actions/transactions';

describe('Transaction Safety & Financial Reset', () => {
  const origFindUnique = prisma.profile.findUnique;
  const origTransaction = prisma.$transaction;

  afterEach(() => {
    prisma.profile.findUnique = origFindUnique;
    prisma.$transaction = origTransaction;
  });

  it('executeFinancialDataReset configures transaction timeout and deletes portfolio setting', async () => {
    let capturedOptions: { maxWait?: number; timeout?: number } | undefined;
    let deletedSettingKey: string | undefined;

    const mockTx = {
      transaction: { deleteMany: async () => ({ count: 2 }) },
      budget: { deleteMany: async () => ({ count: 1 }) },
      category: { deleteMany: async () => ({ count: 3 }), createMany: async () => ({ count: 6 }) },
      balance: { deleteMany: async () => ({ count: 2 }), create: async () => ({ id: 'bal_1' }) },
      savingGoal: { deleteMany: async () => ({ count: 0 }) },
      wishlistItem: { deleteMany: async () => ({ count: 0 }) },
      debt: { deleteMany: async () => ({ count: 0 }) },
      paylater: { deleteMany: async () => ({ count: 0 }) },
      appSubscription: { deleteMany: async () => ({ count: 0 }) },
      emergencyFundPlan: { deleteMany: async () => ({ count: 0 }) },
      transactionTemplate: { deleteMany: async () => ({ count: 0 }) },
      recurringTransaction: { deleteMany: async () => ({ count: 0 }) },
      reminder: { deleteMany: async () => ({ count: 0 }) },
      achievement: { deleteMany: async () => ({ count: 0 }) },
      streak: { deleteMany: async () => ({ count: 0 }) },
      notification: { deleteMany: async () => ({ count: 0 }) },
      setting: {
        deleteMany: async (args: { where: { key: string } }) => {
          deletedSettingKey = args.where.key;
          return { count: 1 };
        },
      },
      auditLog: { create: async () => ({ id: 'log_1' }) },
    };

    (prisma.profile as unknown as { findUnique: unknown }).findUnique = async () => ({
      id: 'prof_1',
      userId: 'user_reset_1',
      fullName: 'Reset User',
      role: 'user',
    });

    (prisma as unknown as { $transaction: unknown }).$transaction = async (
      fn: (tx: typeof mockTx) => Promise<unknown>,
      options?: { maxWait?: number; timeout?: number }
    ) => {
      capturedOptions = options;
      return fn(mockTx);
    };

    const result = await executeFinancialDataReset('user_reset_1', {
      userId: 'admin_1',
      role: 'admin',
    });

    assert.equal(result.success, true);
    assert.deepEqual(capturedOptions, { maxWait: 5000, timeout: 20000 });
    assert.equal(deletedSettingKey, 'portfolio_assets_user_reset_1');
  });

  it('resolveCategory rejects transfer category type', async () => {
    await assert.rejects(
      () => resolveCategory('user_1', 'Transfer', 'transfer'),
      /Kategori transfer tidak didukung/
    );
  });

  it('resolveCategory uses passed db client inside transaction', async () => {
    let usedTx = false;
    const mockDb = {
      category: {
        findFirst: async () => null,
        upsert: async (args: { create: { name: string; type: string } }) => {
          usedTx = true;
          assert.equal(args.create.name, 'Makanan');
          assert.equal(args.create.type, 'keluar');
          return { id: 'cat_tx_1' };
        },
      },
    };

    const categoryId = await resolveCategory(
      'user_1',
      'makanan',
      'keluar',
      mockDb as unknown as Parameters<typeof resolveCategory>[3]
    );

    assert.equal(usedTx, true);
    assert.equal(categoryId, 'cat_tx_1');
  });

  it('resolveWallet uses passed db client and unarchives archived wallets', async () => {
    let unarchivedId: string | undefined;
    const mockDb = {
      balance: {
        findFirst: async () => ({ id: 'wal_arch_1', archivedAt: new Date() }),
        update: async (args: { where: { id: string }; data: { archivedAt: null } }) => {
          unarchivedId = args.where.id;
          assert.equal(args.data.archivedAt, null);
          return { id: args.where.id };
        },
      },
    };

    const walletId = await resolveWallet(
      'user_1',
      'BCA',
      mockDb as unknown as Parameters<typeof resolveWallet>[2]
    );

    assert.equal(unarchivedId, 'wal_arch_1');
    assert.equal(walletId, 'wal_arch_1');
  });
});
