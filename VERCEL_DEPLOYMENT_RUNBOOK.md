# 🚀 Vercel Production Deployment Runbook — Norden Finance

This runbook provides the definitive, repository-grounded deployment procedure for **Norden Finance** on **Vercel** with the primary production domain:

**`https://nordenfinance.site`**

---

## 1. Architecture & Project Status

### 1.1 Architecture Blueprint
```
[ User Browser / Mobile Client ]
              │ (HTTPS / TLS 1.3)
              ▼
[ Vercel Global Edge Network (CDN / Anycast DNS) ]
  • Overwrites and sanitizes x-forwarded-for with client IP
  • SSL Termination (Automated Let's Encrypt / DigiCert)
  • Domain Routing: nordenfinance.site (Primary)
  • Redirect: www.nordenfinance.site -> nordenfinance.site (HTTP 308)
              │
              ▼
[ Vercel Serverless Compute (Node.js 20.x, Next.js 16.2.7 App Router) ]
  ├── App Pages & UI (React 19 Server & Client Components)
  ├── Server Actions & API Route Handlers
  │     ├── Request Security: assertSameOrigin (CSRF Protection)
  │     ├── Rate Limiting: assertRateLimit via PostgreSQL RateLimitBucket
  │     ├── Auth Verification: Firebase Admin SDK (Cryptographic verifySessionCookie / verifyIdToken)
  │     └── File Storage Gateway: Firebase Storage Signed URLs
  └── Vercel Cron Runner: Authenticated GET to /api/cron/recurring (0 0 * * *)
              │
              ├── [ Firebase Auth & Storage (Google Cloud) ]
              │     • User Identity & Tokens (Firebase Auth)
              │     • Receipt & QRIS Assets (Firebase Storage)
              │
              └── [ Managed Cloud PostgreSQL (Singapore ap-southeast-1) ]
                    ├── Runtime Queries: Pooled Connection via Supavisor / PgBouncer
                    └── Migrations: Direct TCP Session Connection
```

### 1.2 Status Classification

To avoid assumptions, project aspects are classified into five distinct categories:

| Category | Topics | Current Status & Details |
| :--- | :--- | :--- |
| **Confirmed Facts** | Framework, Runtime, Target Domain | Next.js 16.2.7, Node.js 20.x, primary domain `https://nordenfinance.site`. |
| **Owner-Confirmed Facts** | GitHub–Vercel Integration | The GitHub repository is **already connected** to Vercel. **Do not create a new Vercel project, reconnect GitHub, or repeat repository import.** |
| **Repository-Derived Facts** | Database Schema, Auth, Rate Limits | Prisma 5.22.0 (`DATABASE_URL` + `DIRECT_URL`), Firebase Auth & Admin SDK (fail-closed, emulator lockout in prod), `lib/rateLimit.ts` (Node `net.isIP` validation, 429 Retry-After, 24h bucket pruning), `vercel.json` (daily cron). |
| **Dashboard-Dependent Items** | Vercel Git Branch, Exact DNS Records, Env Vars | Exact DNS values must be read from the existing Vercel project dashboard; Vercel production branch, root directory, and active environment variables must be inspected in dashboard. |
| **Undecided Items** | Production Database, Vercel Plan | Production database provider (Supabase vs. Neon), Vercel account plan (Hobby vs. Pro), hourly reminder execution architecture, authorization to commit and push working tree. |

---

## 2. Existing GitHub–Vercel Integration & Verification Procedure

The repository is already connected to an existing Vercel project. **Do not create a new project or reconnect GitHub.**

Before triggering any release build, verify the existing project configuration in the Vercel Dashboard through the following inspection steps:

1. **Project Identification:**
   - Log in to [Vercel Dashboard](https://vercel.com/) and navigate to the existing `norden-finance` project.
2. **Repository & Git Settings:**
   - Navigate to **Settings** > **Git**.
   - Confirm the connected repository matches `https://github.com/overhaulpxl/norden-finance`.
   - Confirm the configured **Production Branch** (e.g. `master` or `main`).
   - Check **Preview Deployment** behavior for pull requests and non-production branches.
3. **Build & Development Settings:**
   - Navigate to **Settings** > **General**.
   - Confirm **Framework Preset** is set to `Next.js`.
   - Confirm **Root Directory** is set to `./` (repository root).
   - Confirm **Build Command** is default or `npm run build`.
   - Confirm **Install Command** is default or `npm install`.
   - Confirm **Node.js Version** is set to `20.x`.
4. **Latest Deployment Review:**
   - Navigate to **Deployments**.
   - Inspect the commit hash and deployment status of the current production deployment to understand what version is currently live.
5. **Environment Variable Scope:**
   - Navigate to **Settings** > **Environment Variables**.
   - Verify which variables are already set for **Production**, **Preview**, and **Development**.

---

## 3. Git Working-Tree & Release Boundary

> [!WARNING]
> **Vercel builds strictly from Git commits pushed to the remote repository.**
> The local workspace currently contains extensive uncommitted modifications across Phases 2 through 10J. These uncommitted local changes **cannot** be deployed to Vercel until they are reviewed, committed, and pushed.

### Controlled Release Sequence
To deploy safely without unexpected side effects, follow this ordered procedure:

1. **Inspect Working Tree Diff:**
   - Review accumulated changes using `git status --short` and `git diff`.
   - Ensure no secrets, `.env` files, local credentials, or debug scripts are included.
2. **Run Local Verification Checks:**
   - Execute linter: `npm run lint`
   - Execute typecheck: `npx tsc --noEmit`
   - Validate Prisma schema: `npx prisma validate`
   - Run Phase 10J verification suite: `npx tsx scripts/test-phase10j-verification.ts`
   - Run production build: `npm run build`
3. **Owner Staging Decision:**
   - Review the release scope with the project owner.
   - Obtain **explicit owner approval** before staging and committing files.
4. **Commit & Push to Production Branch:**
   - Commit the verified changes with a clear conventional commit message.
   - Obtain **explicit owner approval** before pushing to the remote tracking branch (`master` / `main`).
5. **Monitor Vercel Build:**
   - Once pushed, Vercel will automatically trigger a deployment.
   - Inspect build logs in the Vercel dashboard and verify completion.
6. **Execute Smoke Tests:**
   - Perform the post-deployment smoke tests (Section 9) before declaring the release complete.

---

## 4. Production Custom Domain & DNS Procedure

Target primary production domain:

**`https://nordenfinance.site`**

Official Vercel References:
- [Vercel Custom Domains Documentation](https://vercel.com/docs/domains/set-up-custom-domain)
- [Vercel DNS & Nameservers Documentation](https://vercel.com/docs/domains/working-with-dns)

### 4.1 Step 1: Inspect Domain Configuration in Existing Vercel Project
1. In the existing Vercel project, navigate to **Settings** > **Domains**.
2. If `nordenfinance.site` is not already listed, enter `nordenfinance.site` and add it.
3. Configure the standard redirect: add `nordenfinance.site` as Primary and redirect `www.nordenfinance.site` to it (HTTP 308).
4. **Inspect the exact DNS records displayed in your Vercel dashboard.**

> [!IMPORTANT]
> Vercel documents standard examples:
> - Apex domain (`@`): A record pointing to `76.76.21.21` (or ALIAS/ANAME)
> - `www` subdomain: CNAME record pointing to `cname.vercel-dns-0.com` (or `cname.vercel-dns.com`)
>
> **Do not guess or assume these records.** Different Vercel projects or accounts may be assigned specific DNS targets. Always use the exact values displayed in your Vercel project's **Settings > Domains** screen.

### 4.2 Step 2: Review Existing DNS Records at Registrar
Before making changes at your domain registrar or DNS host:
1. Review all existing DNS records for `nordenfinance.site`.
2. **Preserve mail and verification records:** Ensure existing `MX`, `TXT` (SPF, DKIM, DMARC), or domain verification records are **not** deleted or modified, as doing so would disrupt email delivery.
3. Obtain **explicit owner approval** before modifying DNS records.

### 4.3 Step 3: Apply Required Records
Apply only the records required by Vercel:
- **Apex Record:** Point `@` (or `nordenfinance.site`) to the A or ALIAS record specified in Vercel.
- **Subdomain Record:** Point `www` to the CNAME target specified in Vercel.

### 4.4 Step 4: Verify SSL & Domain Status
- After DNS changes propagate, Vercel automatically requests and provisions an SSL/TLS certificate from Let's Encrypt / ZeroSSL.
- Confirm the domain status turns **Valid Configuration** (green checkmark) in Vercel.

### 4.5 Step 5: Authorize Domain in Firebase Console
Firebase Authentication blocks sign-in, OAuth popups, and email verification redirects from unauthorized origins.

1. Open [Firebase Console](https://console.firebase.google.com/) for your production project.
2. Navigate to **Authentication** > **Settings** > **Authorized domains**.
3. Add the following domains:
   - `nordenfinance.site`
   - `www.nordenfinance.site`
4. Click **Save**.

---

## 5. Environment Variable Inventory & Credential Safety

> [!CAUTION]
> ### Credential Safety Rules
> - **Never commit secrets to Git or include them in documentation, reports, or prompts.**
> - The project owner must enter all production secrets directly into **Vercel Project Settings > Environment Variables**.
> - Secrets include: database passwords, Firebase Admin private keys, Resend API keys, and Cron secrets.
> - Client-visible variables (`NEXT_PUBLIC_*`) are bundled into browser JavaScript and are readable by any website visitor. Never store private credentials in `NEXT_PUBLIC_*` variables.
> - **Firebase Auth Emulator must remain disabled in production.** Setting `FIREBASE_AUTH_EMULATOR_HOST` in production will cause `lib/firebaseAdmin.ts` to intentionally throw an error and abort server execution.

### Complete Inventory Table
Derived directly from codebase usage (`app`, `lib`, `prisma`, `scripts`):

| Variable Name | Exposure | Required? | Applicable Environments | Source / Provider | Purpose & Consequence if Missing | Safe Validation Method |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server-only | **REQUIRED** | Preview, Production | Database Provider (Supabase / Neon) | Pooled PostgreSQL connection string for Serverless runtime queries. If missing: application cannot start or query database (HTTP 500). | Checked at DB query execution. |
| `DIRECT_URL` | Server-only | **REQUIRED** | Production | Database Provider (Supabase / Neon) | Direct TCP connection string (port 5432) for running `npm run db:migrate`. If missing: Prisma migrations fail to acquire locks in transaction pooling mode. | Validated via `npx prisma validate`. |
| `NEXT_PUBLIC_APP_URL` | Client + Server | **REQUIRED** | Production | User / Vercel Domain | Canonical application URL (`https://nordenfinance.site`). Used for email verification links and mobile shortcuts. If missing: defaults to `https://nordenfinance.site`. | Inspected in `lib/appUrl.ts`. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client + Server | **REQUIRED** | Local, Preview, Production | Firebase Console (Web App) | Public API key for Firebase Client initialization. If missing: client cannot initialize auth or log in. | Validated in `lib/firebase.ts`. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client + Server | **REQUIRED** | Local, Preview, Production | Firebase Console (Web App) | Auth domain (e.g. `<project-id>.firebaseapp.com`). If missing: client auth fails. | Validated in `lib/firebase.ts`. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client + Server | **REQUIRED** | Local, Preview, Production | Firebase Console (Web App) | Firebase project ID. If missing: client cannot locate project. | Validated in `lib/firebase.ts`. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client + Server | **REQUIRED** | Local, Preview, Production | Firebase Console (Web App) | Firebase Storage bucket (e.g. `<project-id>.firebasestorage.app`). If missing: uploads and proof generation fail. | Validated in `lib/firebase.ts`. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client + Server | **REQUIRED** | Local, Preview, Production | Firebase Console (Web App) | Cloud Messaging sender ID. If missing: client config throws error. | Validated in `lib/firebase.ts`. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client + Server | **REQUIRED** | Local, Preview, Production | Firebase Console (Web App) | Firebase Web App ID (`1:xxx:web:xxx`). If missing: client config throws error. | Validated in `lib/firebase.ts`. |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Client + Server | Optional | Production | Firebase Console (Analytics) | Google Analytics measurement ID (`G-XXXXXX`). If missing: client analytics gracefully disabled. | Optional. |
| `FIREBASE_PROJECT_ID` (or `FIREBASE_ADMIN_PROJECT_ID`) | Server-only | **REQUIRED** | Production | Firebase Service Account JSON | Service account project ID for server-side token & session cookie verification. If missing: `lib/firebaseAdmin.ts` throws error (HTTP 500). | Checked at server startup. |
| `FIREBASE_CLIENT_EMAIL` (or `FIREBASE_ADMIN_CLIENT_EMAIL`) | Server-only | **REQUIRED** | Production | Firebase Service Account JSON | Service account client email. If missing: server auth verification fails. | Checked at server startup. |
| `FIREBASE_PRIVATE_KEY` (or `FIREBASE_ADMIN_PRIVATE_KEY`) | Server-only | **REQUIRED** | Production | Firebase Service Account JSON | Full RSA private key (including `-----BEGIN PRIVATE KEY-----` and `\n`). If missing: server auth verification fails. | Checked at server startup. |
| `CRON_SECRET` | Server-only | **REQUIRED** | Production | Owner Generated | Cryptographic token (min 32 characters) protecting `/api/cron/*` endpoints from unauthorized invocation. If missing: cron jobs fail closed (HTTP 500). | Checked in `lib/cronAuth.ts`. |
| `EMAIL_VERIFICATION_PROVIDER` | Server-only | **REQUIRED** | Production | Configuration | Set to `firebase` (default) or `resend`. In production without custom domain email: must be `firebase`. | Checked in `app/api/auth/register/route.ts`. |
| `EMAIL_FROM` | Server-only | Optional | Production | Resend Configuration | Sender display name & address (e.g. `Norden Finance <hello@nordenfinance.site>`). If missing: email sending fails. | Checked in `lib/email.ts`. |
| `RESEND_API_KEY` | Server-only | Optional | Production | Resend Console | API key for reminder and verification emails via Resend. If missing: email delivery is skipped. | Checked in `lib/email.ts`. |
| `ADMIN_EMAIL` | Server-only | Optional | Production | Owner Configuration | Admin email for payment notifications. | Documented in `.env.example`. |
| `SUPPORT_EMAIL` | Server-only | Optional | Production | Owner Configuration | Support contact email. | Documented in `.env.example`. |
| `STORAGE_PROVIDER` | Server-only | Optional | Production | Configuration | Set to `firebase`. | Checked in `lib/storage.ts`. |
| `NEXT_PUBLIC_USE_FIREBASE_AUTH_EMULATOR` | Client + Server | **FORBIDDEN** in Production | **Local Only** | Local Development | Must be `false` or completely absent in Production. If `true` in production: client points to localhost. | Enforced by `lib/firebase.ts`. |
| `FIREBASE_AUTH_EMULATOR_HOST` | Server-only | **FORBIDDEN** in Production | **Local Only** | Local Development | Must NOT be set in Production. `lib/firebaseAdmin.ts` will intentionally throw and crash if present in production. | Enforced by `lib/firebaseAdmin.ts:21`. |

---

## 6. Production Database Selection & Guidance

Official Supabase Reference:
- [Connecting to Postgres with Prisma](https://supabase.com/docs/guides/database/connecting-to-postgres)

### 6.1 Provider Comparison: Supabase vs. Neon Tech

| Evaluation Dimension | Option A: Supabase PostgreSQL (Primary Candidate) | Option B: Neon Tech Serverless PostgreSQL (Alternative) |
| :--- | :--- | :--- |
| **Region & Latency** | AWS Singapore (`ap-southeast-1`), ~15–30ms to Indonesia. | AWS Singapore (`ap-southeast-1`), ~15–30ms to Indonesia. |
| **Connection Pooling** | Built-in Supavisor Pooler (Port `6543`, transaction mode). Excellent for serverless scaling. | Built-in PgBouncer Pooler via `-pooler` connection string. |
| **Migration Handling** | Direct TCP connection on Port `5432` for `DIRECT_URL`. | Direct TCP connection on standard hostname for `DIRECT_URL`. |
| **Prisma 5.22.0 Support** | 100% compatible with `url` and `directUrl`. | 100% compatible with `url` and `directUrl`. |
| **Cold Starts** | None on active project (compute stays warm). | Free tier scales to zero after 5m idle (1–2s wake delay). |
| **Automated Backups** | Automated daily backups in dashboard; exportable via pg_dump. | Automated daily backups; instant point-in-time branch copies. |
| **API Exposure Risk** | **PostgREST Data API enabled by default.** Must be audited. | Pure PostgreSQL wire protocol; no REST API exposed. |

### 6.2 Supabase Data API & Authorization Architecture
Norden Finance uses **Firebase Authentication** as its identity provider. The Next.js server verifies Firebase session cookies and communicates directly with PostgreSQL using Prisma over port 6543/5432 using standard database user credentials (`postgres`).

**Important Architecture Notes:**
1. **The Supabase Data API (PostgREST) is NOT required** for Norden Finance to function. Prisma connects directly via the PostgreSQL wire protocol.
2. Incoming HTTP requests to Supabase's PostgREST API **do not** have Supabase Auth tokens and will not contain `auth.uid()`.
3. **Recommended Defense-in-Depth:**
   - In the Supabase Dashboard, review **Settings** > **API**.
   - If PostgREST is enabled, ensure Row Level Security (RLS) is enabled on all tables in the `public` schema without granting `anon` access policies, OR disable the Data API for `public` schema.
   - *Note: Do not claim the Data API has already been disabled; this must be verified in the Supabase dashboard by the owner upon provisioning.*

### 6.3 Connection String Mapping
From the database provider's dashboard, **copy the exact connection strings directly** (never construct them by guessing regional hostnames):
- **`DATABASE_URL` (Runtime Pooled):**
  Used by `@prisma/client` for horizontal serverless function queries.
  *Example (Supabase Pooler):*
  ```env
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
  ```
- **`DIRECT_URL` (Direct Session):**
  Used exclusively by `prisma migrate deploy` to acquire required migration advisory locks.
  *Example (Supabase Direct):*
  ```env
  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
  ```

---

## 7. Production Migration Procedure

### 7.1 Mandatory Migration Principles
- **Never use `prisma db push` in production.** `prisma db push` bypasses migration history, risks unrecorded schema divergence, and can cause unexpected column drops.
- **Always use `npm run db:migrate`** (which executes `prisma migrate deploy`).
- `prisma migrate deploy` reads the tracked migration files in `prisma/migrations/`, applies only unapplied migrations, and records execution in `_prisma_migrations`.

### 7.2 Migration Execution Steps
1. **Verify Connection Variables:**
   Ensure `DIRECT_URL` is available and points to the direct TCP session port (5432).
2. **Review Pending Migrations:**
   Check the current status against the remote database:
   ```bash
   npx prisma migrate status
   ```
3. **Execute Pre-Migration Backup:**
   If migrating a database that already contains data, create a point-in-time SQL dump:
   ```bash
   pg_dump -d "<DIRECT_URL>" -F c -f "backup_pre_migration.dump"
   ```
4. **Run the Migration Command:**
   ```bash
   npm run db:migrate
   ```
5. **Verify Database Schema:**
   Confirm that all 8 tracked migrations applied successfully and `npx prisma migrate status` reports `Database schema is up to date!`.

---

## 8. Vercel Plan & Cron Configuration

Official Vercel References:
- [Vercel Cron Jobs Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Managing Cron Jobs on Vercel](https://vercel.com/docs/cron-jobs/manage-cron-jobs)
- [Vercel General Pricing](https://vercel.com/pricing)

### 8.1 Published Vercel Cron Limits

| Feature | Vercel Hobby Plan (Free) | Vercel Pro Plan |
| :--- | :--- | :--- |
| **Max Cron Jobs** | Up to **100 cron jobs** per project | Up to **100 cron jobs** per project |
| **Max Frequency** | **Once per day** (once per 24 hours) | Sub-hourly (down to once per 1 minute) |
| **Execution Precision** | Invoked within the specified hour (not exact minute) | Precision scheduling |
| **Pricing** | Included in free tier | Subject to plan subscription & execution duration |

> [!NOTE]
> The owner should verify current plan terms at [vercel.com/pricing](https://vercel.com/pricing) before making any subscription changes.

### 8.2 Current Repository State & Options

The repository's `vercel.json` is currently configured for universal Hobby/Pro compliance:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/recurring",
      "schedule": "0 0 * * *"
    }
  ]
}
```
- **`/api/cron/recurring`:** Runs daily at `0 0 * * *` (UTC). Processes due recurring transactions and prunes expired rate-limit buckets older than 24 hours. Compatible with both Hobby and Pro.
- **`/api/cron/reminders`:** Currently **not registered in `vercel.json`**. The endpoint exists, supports authenticated `GET` and `POST`, and enforces Bearer auth via `CRON_SECRET`.

### 8.3 Cron Scheduling Architecture Decision

#### Option A: Vercel Hobby Plan (Free)
- Keep `vercel.json` with the single daily `/api/cron/recurring` job.
- For hourly email reminders (`/api/cron/reminders`):
  - Use an external free scheduler (such as [cron-job.org](https://cron-job.org/) or a scheduled GitHub Actions workflow).
  - Configure the external runner to send an HTTP GET or POST to `https://nordenfinance.site/api/cron/reminders`.
  - Set request header: `Authorization: Bearer <CRON_SECRET>`.
  - *Risk & Mitigation:* Ensure `CRON_SECRET` is kept confidential in the external scheduler's secrets vault.

#### Option B: Vercel Pro Plan
- If the owner confirms a Vercel Pro subscription:
  - Update `vercel.json` to register both jobs natively:
    ```json
    {
      "$schema": "https://openapi.vercel.sh/vercel.json",
      "crons": [
        {
          "path": "/api/cron/recurring",
          "schedule": "0 0 * * *"
        },
        {
          "path": "/api/cron/reminders",
          "schedule": "0 * * * *"
        }
      ]
    }
    ```
  - Both jobs will be managed and monitored natively inside the Vercel dashboard.

---

## 9. Release & Production Smoke-Test Checklist

Immediately following deployment, perform the following verification steps using a disposable synthetic test account:

- [ ] **Public Landing & Branding:** Visit `https://nordenfinance.site`. Confirm Neo-Brutalist layout, navbar, legal links (`/legal/privacy`, `/legal/terms`), and demo chat sandbox.
- [ ] **HTTPS & Redirects:** Visit `http://nordenfinance.site` (confirms HTTP -> HTTPS redirect) and `https://www.nordenfinance.site` (confirms 308 redirect to apex domain).
- [ ] **Registration & Verification:** Register a new user at `/register`. Confirm Firebase user creation and email verification banner.
- [ ] **Session & Cookie Security:** Log in at `/login`. Verify `__session` cookie is created with `HttpOnly`, `Secure`, and `SameSite=Lax`.
- [ ] **Onboarding & 14-Day Trial:** Complete `/onboarding`. Confirm trial starts immediately upon completion with active Pro entitlements.
- [ ] **Financial Operations:**
  - Create transaction via Smart Input modal.
  - Create wallet, transfer between wallets, update balances.
  - Verify balance calculations.
  - Export CSV transaction log (`/api/export`).
- [ ] **Security & Rate Limits:** Rapidly submit 12 requests to `/api/auth/register`. Confirm 11th request returns HTTP 429 Too Many Requests with `Retry-After`.
- [ ] **Cron Execution:**
  - In Vercel Dashboard > **Cron Jobs**, verify `/api/cron/recurring` is active.
  - Manually trigger cron from Vercel dashboard or via curl with Bearer token. Confirm HTTP 200 response with `rateLimitCleanup` object.
- [ ] **Fail-Closed Auth Verification:** Confirm server returns HTTP 500/401 when invalid auth cookies are provided; confirm zero mock auth fallbacks exist.

---

## 10. Monitoring & Rollback Procedures

### 10.1 Application Rollback (Instant)
If a critical runtime or frontend bug occurs after deployment:
1. Open Vercel Dashboard > **Deployments**.
2. Locate the previous stable deployment.
3. Click the three dots (`...`) and select **Instant Rollback**.
4. Vercel re-routes 100% of production traffic to the previous deployment in under 5 seconds without rebuilding.

### 10.2 Database Recovery Rules
> [!CAUTION]
> **Never restore an old database snapshot over a live production database that has processed user transactions.**
> Restoring a snapshot deletes all legitimate transactions created between the snapshot time and the rollback time.

1. **Additive Schema Principle:** All migrations in `prisma/migrations/` are additive. If a schema change needs reverting, write and deploy a new forward migration (`npm run db:migrate`).
2. **Automated Backups:** Ensure daily automated backups are active in the database dashboard (Supabase / Neon).
3. **Pre-Migration Dumps:** Always export a point-in-time `pg_dump` before applying any manual schema alterations.

---

## 11. Decisions Requiring Explicit Owner Approval

Before executing Phase 11 (Deployment), the owner must provide decisions on:

1. **Production Database Provider & Provisioning:**
   - Confirm **Supabase PostgreSQL** (Recommended) or **Neon Tech**.
   - Provide provisioned `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
2. **Vercel Plan Confirmation:**
   - Confirm whether the account is **Hobby (Free)** or **Pro**.
   - If Hobby: confirm using an external scheduler for `/api/cron/reminders`.
3. **Firebase Production Project:**
   - Provide production Firebase Admin Service Account credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
   - Add `nordenfinance.site` to Firebase Authorized Domains.
4. **DNS Record Authorization:**
   - Inspect required records in existing Vercel project and approve applying them at the domain registrar.
5. **Git Staging & Push Authorization:**
   - Review and authorize committing accumulated Phase 2–10J hardening changes to `master` and pushing to remote.

---

## 12. Official Documentation References

- [Vercel Custom Domains](https://vercel.com/docs/domains/set-up-custom-domain)
- [Vercel DNS & Routing](https://vercel.com/docs/domains/working-with-dns)
- [Vercel Cron Jobs Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- [Vercel Pricing Overview](https://vercel.com/pricing)
- [Supabase Prisma Connection Guide](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Firebase Auth Authorized Domains](https://firebase.google.com/docs/auth/web/start#auth-domain)
