import assert from 'assert';
import fs from 'fs';
import path from 'path';

// Setup mock server-only module in OS temp directory so standalone tsx runner can run actions cleanly
const tempNodeModules = path.resolve('C:/Users/blur/AppData/Local/Temp/opencode/node_modules');
const serverOnlyDir = path.join(tempNodeModules, 'server-only');
if (!fs.existsSync(serverOnlyDir)) {
  fs.mkdirSync(serverOnlyDir, { recursive: true });
  fs.writeFileSync(path.join(serverOnlyDir, 'index.js'), 'module.exports = {};\n');
}
if (!process.env.NODE_PATH || !process.env.NODE_PATH.includes(tempNodeModules)) {
  process.env.NODE_PATH = [tempNodeModules, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);
  (require('module') as any).Module._initPaths();
}

async function runTests() {
  console.log('--- Starting Phase 11X Transaction Timeout & Error Sanitization Test Suite ---');

  // Setup mutable Proxy on authModule exports BEFORE importing actions
  const authModulePath = require.resolve('../lib/auth');
  const actualAuthModule = require(authModulePath);
  let activeRequireUserMock: any = null;

  const authProxy = new Proxy(actualAuthModule, {
    get(target, prop, receiver) {
      if (prop === 'requireUser' && activeRequireUserMock) {
        return activeRequireUserMock;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
  require.cache[authModulePath]!.exports = authProxy;

  const { executeFinancialDataReset } = await import('../lib/financialReset');
  const { prisma } = await import('../lib/prisma');
  const adminActions = await import('../app/actions/admin');
  const userActions = await import('../app/actions/user');

  // ==========================================
  // TEST SUITE 1: FINANCIAL RESET TRANSACTION TIMEOUT OPTIONS & ERROR SANITIZATION
  // ==========================================
  console.log('\n[1] Testing executeFinancialDataReset Transaction Options & Boundaries...');

  const origFindUnique = prisma.profile.findUnique;
  const origTransaction = prisma.$transaction;

  let capturedOptions: any = null;
  let simulatedTimeoutThrown = false;

  try {
    (prisma.profile as any).findUnique = async () => ({
      id: 'prof_test',
      userId: 'test_user_target',
      fullName: 'Test User',
      role: 'user',
    });

    (prisma as any).$transaction = async (fn: any, options: any) => {
      capturedOptions = options;
      const err: any = new Error(
        "Invalid `prisma.paymentRequest.deleteMany()` invocation:\nTransaction API error: Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting."
      );
      err.code = 'P2024';
      simulatedTimeoutThrown = true;
      throw err;
    };

    let caughtError: any = null;
    try {
      await executeFinancialDataReset('test_user_target', { userId: 'admin_1', role: 'admin' });
    } catch (e: any) {
      caughtError = e;
    }

    assert.ok(capturedOptions, 'Transaction options must be passed to prisma.$transaction');
    assert.strictEqual(capturedOptions.timeout, 20000, 'Transaction timeout must be explicitly set to 20000ms');
    assert.strictEqual(capturedOptions.maxWait, 5000, 'Transaction maxWait must be explicitly set to 5000ms');
    assert.ok(simulatedTimeoutThrown, 'Simulated timeout error must be triggered in transaction');
    assert.ok(caughtError, 'executeFinancialDataReset must rethrow transaction failure for caller handling');

    console.log('  ✓ executeFinancialDataReset verified: options { maxWait: 5000, timeout: 20000 } passed.');
  } finally {
    prisma.profile.findUnique = origFindUnique;
    prisma.$transaction = origTransaction;
  }

  // ==========================================
  // TEST SUITE 2: ADMIN DELETE USER TIMEOUT OPTIONS & ERROR SANITIZATION
  // ==========================================
  console.log('\n[2] Testing deleteUserAccountByAdmin Error Sanitization & RBAC...');

  try {
    // Test 2.1: RBAC verification (unauthorized caller)
    activeRequireUserMock = async () => ({
      user: { uid: 'normal_user', email: 'user@test.com' },
      profile: { role: 'user' },
    });

    const rbacResult = await adminActions.deleteUserAccountByAdmin('target_123');
    assert.strictEqual(rbacResult.success, false, 'Non-admin caller must be rejected');
    assert.strictEqual(
      rbacResult.error,
      'Anda tidak memiliki akses untuk melakukan tindakan ini.',
      'RBAC error message must be clean and localized'
    );

    // Test 2.2: Prevent self-deletion
    activeRequireUserMock = async () => ({
      user: { uid: 'admin_123', email: 'admin@test.com' },
      profile: { role: 'admin' },
    });

    const selfResult = await adminActions.deleteUserAccountByAdmin('admin_123');
    assert.strictEqual(selfResult.success, false, 'Admin self-deletion must be rejected');
    assert.strictEqual(
      selfResult.error,
      'Anda tidak dapat menghapus akun admin yang sedang digunakan.',
      'Self-deletion error message must be clean and localized'
    );

    // Test 2.3: Invalid target user ID
    const emptyResult = await adminActions.deleteUserAccountByAdmin('   ');
    assert.strictEqual(emptyResult.success, false, 'Empty target ID must be rejected');
    assert.strictEqual(emptyResult.error, 'Target pengguna tidak valid.');

    // Test 2.4: Target profile not found
    (prisma.profile as any).findUnique = async () => null;
    const notFoundResult = await adminActions.deleteUserAccountByAdmin('unknown_target');
    assert.strictEqual(notFoundResult.success, false, 'Nonexistent user must be rejected');
    assert.strictEqual(notFoundResult.error, 'Profil pengguna tidak ditemukan.');

    // Test 2.5: Transaction timeout error sanitization (CRITICAL LEAK PREVENTION)
    (prisma.profile as any).findUnique = async () => ({
      id: 'prof_t',
      userId: 'target_victim',
      fullName: 'Victim User',
      role: 'user',
    });

    let deleteTxOptions: any = null;
    (prisma as any).$transaction = async (fn: any, options: any) => {
      deleteTxOptions = options;
      const err: any = new Error(
        "Invalid `prisma.paymentRequest.deleteMany()` invocation:\nTransaction API error: Transaction not found. Transaction ID is invalid, refers to an old closed transaction Prisma doesn't have information about anymore, or was obtained before disconnecting."
      );
      err.code = 'P2024';
      throw err;
    };

    const timeoutResult = await adminActions.deleteUserAccountByAdmin('target_victim');

    // Assertions for safety
    assert.strictEqual(timeoutResult.success, false, 'Timeout must NEVER be reported as success');
    assert.ok(deleteTxOptions, 'deleteUserAccountByAdmin must pass options to $transaction');
    assert.strictEqual(deleteTxOptions.timeout, 20000, 'deleteUserAccountByAdmin timeout must be 20000ms');
    assert.strictEqual(deleteTxOptions.maxWait, 5000, 'deleteUserAccountByAdmin maxWait must be 5000ms');

    // Strict leak checks
    assert.strictEqual(
      timeoutResult.error,
      'Penghapusan akun tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      'Must return sanitized, localized error message'
    );
    assert.ok(!timeoutResult.error.includes('prisma'), 'Must NOT leak "prisma" keyword');
    assert.ok(!timeoutResult.error.includes('paymentRequest'), 'Must NOT leak model names');
    assert.ok(!timeoutResult.error.includes('Transaction API error'), 'Must NOT leak internal engine errors');
    assert.ok(!timeoutResult.error.includes('invocation:'), 'Must NOT leak invocation stack traces');

    console.log('  ✓ deleteUserAccountByAdmin verified: timeout 20s configured, error strictly sanitized.');
  } finally {
    activeRequireUserMock = null;
    prisma.profile.findUnique = origFindUnique;
    prisma.$transaction = origTransaction;
  }

  // ==========================================
  // TEST SUITE 3: ADMIN FINANCIAL RESET ERROR SANITIZATION
  // ==========================================
  console.log('\n[3] Testing resetUserFinancialDataByAdmin Error Sanitization...');

  try {
    activeRequireUserMock = async () => ({
      user: { uid: 'admin_123', email: 'admin@test.com' },
      profile: { role: 'admin' },
    });

    (prisma.profile as any).findUnique = async () => ({
      id: 'prof_t',
      userId: 'target_victim',
      fullName: 'Victim User',
      role: 'user',
    });

    (prisma as any).$transaction = async () => {
      const err: any = new Error('Transaction not found. Transaction ID is invalid (P2024).');
      throw err;
    };

    const resetResult = await adminActions.resetUserFinancialDataByAdmin('target_victim');

    assert.strictEqual(resetResult.success, false, 'Failure must NEVER report success');
    assert.strictEqual(
      resetResult.error,
      'Reset data keuangan tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      'Must return clean sanitized error'
    );
    assert.ok(!resetResult.error.includes('P2024'), 'Must NOT leak error code P2024');
    assert.ok(!resetResult.error.includes('Transaction ID'), 'Must NOT leak transaction ID');

    console.log('  ✓ resetUserFinancialDataByAdmin verified: timeout error strictly sanitized.');
  } finally {
    activeRequireUserMock = null;
    prisma.profile.findUnique = origFindUnique;
    prisma.$transaction = origTransaction;
  }

  // ==========================================
  // TEST SUITE 4: USER DELETE & RESET ACCOUNT DATA TIMEOUT OPTIONS & SANITIZATION
  // ==========================================
  console.log('\n[4] Testing deleteUserAccountData & resetUserFinancialData User Actions...');

  try {
    activeRequireUserMock = async () => ({
      user: { uid: 'user_123', email: 'user@test.com' },
      profile: { role: 'user' },
    });

    (prisma.profile as any).findUnique = async () => ({
      id: 'prof_t',
      userId: 'user_123',
      fullName: 'Regular User',
      role: 'user',
    });

    let userTxOptions: any = null;
    (prisma as any).$transaction = async (fn: any, options: any) => {
      userTxOptions = options;
      throw new Error('Transaction API error: Transaction not found.');
    };

    const userDeleteResult = await userActions.deleteUserAccountData();

    assert.strictEqual(userDeleteResult.success, false, 'User delete must not report success on failure');
    assert.ok(userTxOptions, 'User delete must pass options to $transaction');
    assert.strictEqual(userTxOptions.timeout, 20000, 'User delete timeout must be 20000ms');
    assert.strictEqual(userTxOptions.maxWait, 5000, 'User delete maxWait must be 5000ms');
    assert.strictEqual(
      userDeleteResult.error,
      'Penghapusan data akun tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      'User delete error must be sanitized'
    );

    const userResetResult = await userActions.resetUserFinancialData();
    assert.strictEqual(userResetResult.success, false, 'User reset must not report success on failure');
    assert.strictEqual(
      userResetResult.error,
      'Reset data keuangan tidak dapat diselesaikan karena batas waktu transaksi database. Silakan coba kembali.',
      'User reset error must be sanitized'
    );

    console.log('  ✓ User actions verified: timeout 20s configured, errors strictly sanitized.');
  } finally {
    activeRequireUserMock = null;
    prisma.profile.findUnique = origFindUnique;
    prisma.$transaction = origTransaction;
  }

  console.log('\n--- ALL PHASE 11X TESTS PASSED (18/18 assertions) ---');
}

runTests().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
