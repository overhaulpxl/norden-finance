# Hostinger Managed Node.js Deployment

This guide deploys Norden Finance to Hostinger Managed Node.js hosting for:

- Domain: `nordenfinance.site`
- Production URL: `https://nordenfinance.site`
- App hosting: Hostinger Managed Node.js
- Database: existing external PostgreSQL database
- Auth: Firebase Auth
- Storage: Firebase Storage

This is not a VPS deployment. Do not use Nginx, PM2, `sudo`, `systemctl`, local PostgreSQL installation, Hostinger MySQL migration, or manual server setup.

## Required Safety Rules

- Keep `prisma/schema.prisma` datasource provider as `postgresql`.
- Keep `DATABASE_URL` pointed at the existing PostgreSQL database.
- Do not migrate to MySQL.
- Do not reset, truncate, drop, or rewrite production data.
- Do not run `prisma migrate reset` or `prisma db push --force-reset`.
- Do not delete Firebase Storage files.
- Do not commit `.env` files, database dumps, SQL backups, uploaded files, or secrets.
- Keep Vercel production available until Hostinger is fully verified.

## Hostinger Project Settings

Use these settings in Hostinger hPanel:

| Setting | Value |
|---|---|
| Framework | Next.js |
| Branch | `master` |
| Root Directory | `/` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Start Command | `npm run start` |
| Node Version | `20` from `.nvmrc` |

If Hostinger does not provide a migration hook, run the migration command manually before production start:

```bash
npm run db:migrate
```

This runs `prisma migrate deploy`, which applies existing migrations without resetting data.

## Environment Variables

Add these variables in Hostinger hPanel. Do not paste secrets into code or docs.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
NEXT_PUBLIC_APP_URL=https://nordenfinance.site

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

EMAIL_VERIFICATION_PROVIDER=firebase
RESEND_API_KEY=
EMAIL_FROM=

GEMINI_API_KEY=

CRON_SECRET=
SHORTCUT_TOKEN_SECRET=

STORAGE_PROVIDER=firebase
```

`DATABASE_URL` must stay PostgreSQL. Do not use Hostinger MySQL.

## Firebase Configuration

Firebase Auth remains active. In Firebase Console, add this authorized domain:

```text
nordenfinance.site
```

Keep the existing Vercel domain during migration until Hostinger has passed smoke tests:

```text
nordenfinance.vercel.app
```

Email verification uses:

```env
EMAIL_VERIFICATION_PROVIDER=firebase
NEXT_PUBLIC_APP_URL=https://nordenfinance.site
```

Verification links should redirect to:

```text
https://nordenfinance.site/auth/verified
```

## Storage Strategy

Firebase Storage remains the default provider:

```env
STORAGE_PROVIDER=firebase
```

Do not enable Hostinger local disk uploads yet. Hostinger Managed Node.js disk persistence must be proven before storing important files locally.

Only consider local upload storage after verifying that uploaded files survive:

1. App restart
2. GitHub redeploy

If files disappear after restart or redeploy, local disk storage is unsafe for important uploads. Continue using Firebase Storage or move to durable object storage such as Cloudflare R2 or S3. Do not delete old Firebase files.

## DNS And SSL

1. Connect `nordenfinance.site` to the Hostinger Managed Node.js app using hPanel instructions.
2. Enable SSL for `nordenfinance.site`.
3. Force HTTPS if Hostinger provides the option.
4. Use canonical domain `https://nordenfinance.site`.
5. If `www.nordenfinance.site` is configured, redirect it to `nordenfinance.site`.
6. Set `NEXT_PUBLIC_APP_URL=https://nordenfinance.site`.
7. Add `nordenfinance.site` to Firebase Authorized Domains.
8. Keep Vercel available until production is verified.

## Backup Before Deploy

Create a database backup before migration or deployment. Do not commit backup files.

Custom-format backup:

```bash
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > norden_backup_YYYYMMDD.dump
```

Plain SQL backup:

```bash
pg_dump --no-owner --no-acl "$DATABASE_URL" > norden_backup_YYYYMMDD.sql
```

The repository ignores `*.dump` and `*.sql`.

## Data Verification

Before Hostinger deployment, record read-only table counts:

```bash
npm run check:data-counts
```

After Hostinger deployment, run the same command with Hostinger production environment variables and compare counts.

Expected result: counts match before and after deployment. Some counts may increase only if users create new data during the migration window.

## Quality Gates

Run before merging and after merging to `master`:

```bash
npm run lint
npx tsc --noEmit
npx prisma validate
npx prisma generate
npm run build
npm run check:data-counts
```

Forbidden commands:

```bash
npx prisma migrate reset
npx prisma db push --force-reset
DROP DATABASE
DROP TABLE
TRUNCATE
sudo
pm2
systemctl
nginx reload
```

## Smoke Test Checklist

After deployment, verify:

1. `https://nordenfinance.site` loads.
2. HTTP redirects to HTTPS.
3. `www.nordenfinance.site` redirects to non-www if configured.
4. Homepage loads.
5. Login page loads.
6. Register page loads.
7. Existing user can login.
8. Existing wallets appear.
9. Existing transactions appear.
10. Existing balances match old production.
11. Dashboard does not create duplicate seed data.
12. Smart Input works.
13. Receipt upload works with Firebase Storage.
14. Payment proof upload works with Firebase Storage.
15. Old Firebase file URLs still open.
16. Email verification redirects to `nordenfinance.site`.
17. Shortcut/NFC URL uses `nordenfinance.site`.
18. No data loss.

## Rollback Plan

Keep the Vercel production deployment and its Firebase Authorized Domain active until Hostinger is verified.

If Hostinger deployment fails:

1. Keep DNS pointed to the last working production host or revert DNS to Vercel.
2. Do not run destructive database commands.
3. Do not change Prisma provider.
4. Keep Firebase Storage unchanged.
5. Compare `npm run check:data-counts` output against the pre-deploy record.
6. Fix Hostinger configuration or code on a branch, then redeploy.

