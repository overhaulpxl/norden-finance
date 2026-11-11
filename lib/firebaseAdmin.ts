import { getApps, initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function envWithFallback(primary: string, fallback: string): string | undefined {
  return process.env[primary] || process.env[fallback];
}

function requiredEnvWithFallback(primary: string, fallback: string): string {
  const value = envWithFallback(primary, fallback);
  if (!value) {
    throw new Error(`${primary} or ${fallback} is required for Firebase Admin`);
  }
  return value;
}

function ensureFirebaseAdminApp() {
  if (getApps().length > 0) return;

  if (process.env.NODE_ENV === 'production') {
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      throw new Error('FIREBASE_AUTH_EMULATOR_HOST cannot be used in production.');
    }
    const serviceAccount: ServiceAccount = {
      projectId: requiredEnvWithFallback('FIREBASE_PROJECT_ID', 'FIREBASE_ADMIN_PROJECT_ID'),
      clientEmail: requiredEnvWithFallback('FIREBASE_CLIENT_EMAIL', 'FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: requiredEnvWithFallback('FIREBASE_PRIVATE_KEY', 'FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
    };

    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return;
  }

  // Non-production local emulator
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-norden-finance',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return;
  }

  // Non-production configured credentials
  const isConfigured =
    envWithFallback('FIREBASE_PROJECT_ID', 'FIREBASE_ADMIN_PROJECT_ID') &&
    envWithFallback('FIREBASE_CLIENT_EMAIL', 'FIREBASE_ADMIN_CLIENT_EMAIL') &&
    envWithFallback('FIREBASE_PRIVATE_KEY', 'FIREBASE_ADMIN_PRIVATE_KEY');

  if (isConfigured) {
    const serviceAccount: ServiceAccount = {
      projectId: requiredEnvWithFallback('FIREBASE_PROJECT_ID', 'FIREBASE_ADMIN_PROJECT_ID'),
      clientEmail: requiredEnvWithFallback('FIREBASE_CLIENT_EMAIL', 'FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: requiredEnvWithFallback('FIREBASE_PRIVATE_KEY', 'FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n'),
    };

    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return;
  }

  throw new Error(
    'Firebase Admin is not configured. Either configure Firebase service account credentials (FIREBASE_PROJECT_ID, etc.) or enable the local Auth Emulator (FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099).'
  );
}

export function getAdminAuth() {
  if (process.env.NODE_ENV === 'production') {
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      throw new Error('FIREBASE_AUTH_EMULATOR_HOST cannot be used in production.');
    }
    const isConfigured =
      envWithFallback('FIREBASE_PROJECT_ID', 'FIREBASE_ADMIN_PROJECT_ID') &&
      envWithFallback('FIREBASE_CLIENT_EMAIL', 'FIREBASE_ADMIN_CLIENT_EMAIL') &&
      envWithFallback('FIREBASE_PRIVATE_KEY', 'FIREBASE_ADMIN_PRIVATE_KEY');

    if (!isConfigured) {
      throw new Error('Firebase Admin environment variables (FIREBASE_ADMIN_PROJECT_ID, etc.) are required in production.');
    }

    ensureFirebaseAdminApp();
    return getAuth();
  }

  const isConfigured =
    envWithFallback('FIREBASE_PROJECT_ID', 'FIREBASE_ADMIN_PROJECT_ID') &&
    envWithFallback('FIREBASE_CLIENT_EMAIL', 'FIREBASE_ADMIN_CLIENT_EMAIL') &&
    envWithFallback('FIREBASE_PRIVATE_KEY', 'FIREBASE_ADMIN_PRIVATE_KEY');

  const isEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

  if (isConfigured || isEmulator) {
    ensureFirebaseAdminApp();
    return getAuth();
  }

    // Fail closed: Never return an unverified JWT decoder
  throw new Error(
    'Firebase Admin authentication is not configured. Either configure Firebase service account credentials (FIREBASE_PROJECT_ID, etc.) or enable the local Auth Emulator (FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099).'
  );
}
