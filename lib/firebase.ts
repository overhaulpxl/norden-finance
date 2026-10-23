import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics, type Analytics } from 'firebase/analytics';

function requiredPublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required for Firebase client config`);
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredPublicEnv('NEXT_PUBLIC_FIREBASE_API_KEY', process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: requiredPublicEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: requiredPublicEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: requiredPublicEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: requiredPublicEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: requiredPublicEnv('NEXT_PUBLIC_FIREBASE_APP_ID', process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (guard against multiple initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Connect client to Auth Emulator only in development when explicitly enabled
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR === 'true'
) {
  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || 'http://127.0.0.1:9099';
  if (!(auth as { emulatorConfig?: unknown }).emulatorConfig) {
    connectAuthEmulator(auth, emulatorHost, { disableWarnings: true });
  }
}

export let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export default app;
