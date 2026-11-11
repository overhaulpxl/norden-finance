import { config } from 'dotenv';

config({ path: '.env.local' });
config({ path: '.env' });

const required = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'CRON_SECRET',
  'SHORTCUT_TOKEN_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
];

const missing = required.filter((key) => !process.env[key]?.trim());

const fbProjectId = process.env.FIREBASE_PROJECT_ID?.trim() || process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
const fbClientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() || process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
const fbPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim() || process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim();

if (!fbProjectId) {
  missing.push('FIREBASE_PROJECT_ID (or FIREBASE_ADMIN_PROJECT_ID)');
}
if (!fbClientEmail) {
  missing.push('FIREBASE_CLIENT_EMAIL (or FIREBASE_ADMIN_CLIENT_EMAIL)');
}
if (!fbPrivateKey) {
  missing.push('FIREBASE_PRIVATE_KEY (or FIREBASE_ADMIN_PRIVATE_KEY)');
}
const weak: string[] = [];

const cronSecret = process.env.CRON_SECRET || '';
if (cronSecret && cronSecret.length < 32) {
  weak.push('CRON_SECRET must be at least 32 characters.');
}

const shortcutSecret = process.env.SHORTCUT_TOKEN_SECRET || '';
if (shortcutSecret && shortcutSecret.length < 32) {
  weak.push('SHORTCUT_TOKEN_SECRET must be at least 32 characters for shortcut tokens.');
}
if (shortcutSecret && cronSecret && shortcutSecret === cronSecret) {
  weak.push('SHORTCUT_TOKEN_SECRET must be distinct from CRON_SECRET.');
}

const emailFrom = process.env.EMAIL_FROM || '';
if (emailFrom) {
  const rawEmail = emailFrom.includes('<') && emailFrom.includes('>')
    ? emailFrom.replace(/.*<([^>]+)>.*/, '$1').trim()
    : emailFrom.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    weak.push('EMAIL_FROM must be a valid email address or "Sender Name <email@domain.com>".');
  }
}

if (missing.length || weak.length) {
  console.error('Production readiness check failed.');
  if (missing.length) {
    console.error(`Missing env vars: ${missing.join(', ')}`);
  }
  for (const issue of weak) {
    console.error(issue);
  }
  process.exit(1);
}

console.log('Production readiness check passed.');
