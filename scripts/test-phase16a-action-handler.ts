import assert from 'assert';
import fs from 'fs';
import admin from 'firebase-admin';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { getSafeContinueUrl, mapFirebaseAuthError } from '../lib/authActionUtils';

const saPath = 'C:\\Users\\blur\\Downloads\\norden-finance-firebase-adminsdk-fbsvc-d16af5134a.json';

async function runPhase16aTests() {
  console.log('================================================================');
  console.log('PHASE 16A: NORDEN CUSTOM FIREBASE EMAIL ACTION HANDLER TESTS');
  console.log('================================================================\n');

  // ------------------------------------------------------------------
  // 1. OPEN-REDIRECT PREVENTION & SAFE CONTINUE URL
  // ------------------------------------------------------------------
  console.log('1. Testing Open-Redirect Prevention (getSafeContinueUrl):');

  const urlTestCases: [string | null, string, string][] = [
    [null, '/dashboard', 'null fallback'],
    ['', '/dashboard', 'empty string fallback'],
    ['   ', '/dashboard', 'whitespace fallback'],
    ['/dashboard', '/dashboard', 'standard relative internal route'],
    ['/upgrade?plan=pro', '/upgrade?plan=pro', 'relative route with query params'],
    ['/dashboard#overview', '/dashboard#overview', 'relative route with hash'],
    ['https://www.nordenfinance.site/dashboard', '/dashboard', 'approved production www hostname'],
    ['https://nordenfinance.site/login', '/login', 'approved production apex hostname'],
    ['http://localhost:3000/dashboard', '/dashboard', 'approved localhost hostname'],
    ['https://norden-preview-zaidaans-projects.vercel.app/upgrade', '/upgrade', 'approved preview vercel hostname in dev'],
    ['https://evil.com/phishing', '/dashboard', 'unauthorized external domain rejected'],
    ['https://malicious.org/stealer?code=123', '/dashboard', 'malicious.org rejected'],
    ['//evil.com/phishing', '/dashboard', 'protocol-relative URL rejected'],
    ['/\\evil.com', '/dashboard', 'backslash-relative URL rejected'],
    ['javascript:alert(1)', '/dashboard', 'javascript: scheme rejected'],
    ['data:text/html,<script>alert(1)</script>', '/dashboard', 'data: scheme rejected'],
  ];

  for (const [input, expected, description] of urlTestCases) {
    const result = getSafeContinueUrl(input);
    assert.strictEqual(
      result,
      expected,
      `Safe URL validation failed for ${description}: got "${result}", expected "${expected}"`
    );
    console.log(`  ✓ [PASS] ${description}: "${input}" -> "${result}"`);
  }

  // Verify that in Production mode, preview domains are rejected
  const oldNodeEnv = process.env.NODE_ENV;
  try {
    (process.env as any).NODE_ENV = 'production';
    const prodPreviewResult = getSafeContinueUrl('https://norden-preview-zaidaans-projects.vercel.app/upgrade');
    assert.strictEqual(prodPreviewResult, '/dashboard', 'Preview domains must be rejected in production mode');
    console.log('  ✓ [PASS] Preview domain safely rejected in production mode: -> "/dashboard"');
  } finally {
    (process.env as any).NODE_ENV = oldNodeEnv;
  }

  // ------------------------------------------------------------------
  // 2. ERROR TRANSLATION & USER CLARITY
  // ------------------------------------------------------------------
  console.log('\n2. Testing Firebase Auth Error Mapping (mapFirebaseAuthError):');

  const errorCases: [{ code: string; message?: string }, string][] = [
    [{ code: 'auth/expired-action-code' }, 'Tautan aksi telah kadaluarsa. Silakan ajukan permintaan baru.'],
    [{ code: 'auth/invalid-action-code' }, 'Tautan aksi tidak valid atau sudah pernah digunakan sebelumnya.'],
    [{ code: 'auth/user-disabled' }, 'Akun pengguna ini telah dinonaktifkan.'],
    [{ code: 'auth/user-not-found' }, 'Akun pengguna tidak ditemukan.'],
    [{ code: 'auth/weak-password' }, 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.'],
    [{ code: 'auth/unknown-error', message: 'Something broke' }, 'Something broke'],
  ];

  for (const [err, expected] of errorCases) {
    const msg = mapFirebaseAuthError(err, 'Default message');
    assert.strictEqual(msg, expected, `Error mapping failed for ${err.code}`);
    console.log(`  ✓ [PASS] ${err.code} mapped to: "${msg}"`);
  }

  // ------------------------------------------------------------------
  // 3. FIREBASE AUTH ACTION CODE INTEGRATION
  // ------------------------------------------------------------------
  console.log('\n3. Testing Firebase Auth Action Code Integration:');

  assert.ok(fs.existsSync(saPath), 'Service account file required');
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

  const adminAppName = `test-admin-${Date.now()}`;
  const adminApp = admin.initializeApp(
    {
      credential: admin.credential.cert(sa),
      projectId: sa.project_id,
    },
    adminAppName
  );

  const clientConfig = {
    apiKey: 'AIzaSyBLbnAnZLiRKpLQojKdiQQDBklq64CMJqY',
    authDomain: 'norden-finance.firebaseapp.com',
    projectId: 'norden-finance',
  };

  const clientAppName = `test-client-${Date.now()}`;
  const clientApp = initializeApp(clientConfig, clientAppName);
  const clientAuth = getAuth(clientApp);

  const testEmail = `test-phase16a-${Date.now()}@nordenfinance.site`;
  const initialPassword = 'InitialSecretPass123!';
  const updatedPassword = 'NewStrongPassword456!';

  console.log(`  Creating test user: ${testEmail}...`);
  const userRecord = await adminApp.auth().createUser({
    email: testEmail,
    password: initialPassword,
    emailVerified: false,
  });
  console.log(`  ✓ User created (uid: ${userRecord.uid}, emailVerified: false)`);

  try {
    // -------------------------------------------------------------
    // Test Mode: verifyEmail
    // -------------------------------------------------------------
    console.log('\n  --- Testing Mode: verifyEmail ---');
    const verifyLink = await adminApp.auth().generateEmailVerificationLink(testEmail);
    const verifyUrl = new URL(verifyLink);
    const verifyOobCode = verifyUrl.searchParams.get('oobCode')!;
    assert.ok(verifyOobCode, 'Must receive verifyEmail oobCode');
    console.log('  1. Generated genuine verifyEmail action code.');

    // Apply action code
    await applyActionCode(clientAuth, verifyOobCode);
    console.log('  2. applyActionCode succeeded via Client SDK.');

    // Check user record
    const verifiedUser = await adminApp.auth().getUser(userRecord.uid);
    assert.strictEqual(verifiedUser.emailVerified, true, 'User emailVerified must be true');
    console.log('  3. User emailVerified confirmed === true in Firebase.');

    // Already-consumed code
    try {
      await applyActionCode(clientAuth, verifyOobCode);
      assert.fail('applyActionCode should fail on already-consumed code');
    } catch (err: any) {
      assert.strictEqual(err.code, 'auth/invalid-action-code', 'Already-consumed code must fail with auth/invalid-action-code');
      console.log('  4. Already-consumed verify code correctly rejected (auth/invalid-action-code).');
    }

    // Invalid action code
    try {
      await applyActionCode(clientAuth, 'fabricated-invalid-oob-code-123');
      assert.fail('applyActionCode should fail on invalid code');
    } catch (err: any) {
      assert.strictEqual(err.code, 'auth/invalid-action-code', 'Invalid code must fail with auth/invalid-action-code');
      console.log('  5. Fabricated invalid code correctly rejected (auth/invalid-action-code).');
    }

    // -------------------------------------------------------------
    // Test Mode: resetPassword
    // -------------------------------------------------------------
    console.log('\n  --- Testing Mode: resetPassword ---');
    const resetLink = await adminApp.auth().generatePasswordResetLink(testEmail);
    const resetUrl = new URL(resetLink);
    const resetOobCode = resetUrl.searchParams.get('oobCode')!;
    assert.ok(resetOobCode, 'Must receive resetPassword oobCode');
    console.log('  1. Generated genuine resetPassword action code.');

    // Step A: Verify code before accepting new password
    const verifiedEmail = await verifyPasswordResetCode(clientAuth, resetOobCode);
    assert.strictEqual(verifiedEmail.toLowerCase(), testEmail.toLowerCase(), 'verifyPasswordResetCode must return target email');
    console.log(`  2. verifyPasswordResetCode verified target email: ${verifiedEmail}`);

    // Step B: Confirm password reset with new password
    await confirmPasswordReset(clientAuth, resetOobCode, updatedPassword);
    console.log('  3. confirmPasswordReset succeeded.');

    // Step C: Verify user can sign in with new password
    const loginCred = await signInWithEmailAndPassword(clientAuth, testEmail, updatedPassword);
    assert.strictEqual(loginCred.user.email?.toLowerCase(), testEmail.toLowerCase(), 'Login with new password must succeed');
    console.log('  4. Successfully signed in with new password.');

    // Step D: Verify old password no longer works
    try {
      await signInWithEmailAndPassword(clientAuth, testEmail, initialPassword);
      assert.fail('Old password should not work after reset');
    } catch (err: any) {
      assert.strictEqual(err.code, 'auth/invalid-credential', 'Old password must fail with auth/invalid-credential');
      console.log('  5. Old password rejected with auth/invalid-credential.');
    }

    // Step E: Already-consumed reset code
    try {
      await confirmPasswordReset(clientAuth, resetOobCode, 'AnotherPassword789!');
      assert.fail('confirmPasswordReset should fail on consumed code');
    } catch (err: any) {
      assert.strictEqual(err.code, 'auth/invalid-action-code', 'Consumed reset code must fail with auth/invalid-action-code');
      console.log('  6. Consumed reset code correctly rejected (auth/invalid-action-code).');
    }

    // -------------------------------------------------------------
    // Test Mode: recoverEmail
    // -------------------------------------------------------------
    console.log('\n  --- Testing Mode: recoverEmail ---');
    // Verify checkActionCode handles invalid recovery code
    try {
      await checkActionCode(clientAuth, 'fabricated-recovery-code-456');
      assert.fail('checkActionCode should fail on fabricated code');
    } catch (err: any) {
      assert.strictEqual(err.code, 'auth/invalid-action-code', 'Fabricated recovery code must fail with auth/invalid-action-code');
      console.log('  1. Fabricated recoverEmail code correctly rejected (auth/invalid-action-code).');
    }

  } finally {
    // Clean up temporary user
    await adminApp.auth().deleteUser(userRecord.uid);
    console.log(`\n  Cleaned up temporary user ${userRecord.uid}.`);
    await adminApp.delete();
  }

  console.log('\n================================================================');
  console.log('ALL PHASE 16A ACTION HANDLER TESTS PASSED PERFECTLY!');
  console.log('================================================================\n');
}

runPhase16aTests().catch((err) => {
  console.error('\nTests failed:', err);
  process.exit(1);
});
