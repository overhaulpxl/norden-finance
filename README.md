<p align="center">
  <img src="public/brand/norden-horizontal.png" alt="Norden Finance" width="240" />
</p>

<h1 align="center">Norden Finance</h1>

<p align="center">
  <strong>Track your money. Find your direction.</strong><br>
  Modern personal finance and expense tracking for individuals and creators.
</p>

<p align="center">
  <a href="https://nordenfinance.site"><strong>nordenfinance.site &rarr;</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase" alt="Firebase Auth" />
  <img src="https://img.shields.io/badge/Resend-Email-000000?style=flat-square&logo=resend" alt="Resend" />
</p>

---

## 🧭 About Norden Finance

**Norden Finance** is a personal finance platform designed to replace messy spreadsheets and complex accounting tools with a fast, engaging web application.

Built with a bold Neo-Brutalist design language, it combines **natural language expense logging** (`kopi 35k bca`, `makan siang 45k gopay`), **smart receipt scanning**, **multi-wallet balance tracking**, and **financial health analytics** to help you stay on top of your financial goals.

---

## ✨ Key Capabilities

### ⚡ Smart Logging
- **Natural Language Parsing**: Log expenses in natural Indonesian phrasing (`gaji 8jt bca`, `beli buku 120k cash`).
- **Smart Receipt Scanner**: Upload shopping receipts or invoices to extract total amount, date, and line items automatically.
- **Clipboard Intelligence**: Detects incoming bank SMS or push notifications copied to your clipboard and prefills transaction details.

### 🧠 Next-Gen Financial Intelligence
- **50/30/20 Ideal Allocator**: Automatically calculates Needs, Wants, and Savings targets from monthly income with one-click budget generation.
- **30-Day Cashflow Projection**: Forecasts forward liquidity factoring recurring bills, active balances, and upcoming paylater installments.
- **Budget Risk Forecasts**: Real-time burn-rate projection flagging overspend risks before month-end.
- **Financial Habits & Subscription Review**: Pattern detection for frequent expenses (coffee tracker, busiest spend day) and stale subscription audits.
- **Monthly Replay & Visual Share Cards**: Summary highlights and exportable high-res visual share cards (PNG) of monthly achievements and spend breakdowns.
- **Daily Discipline Missions**: Gamified daily objectives (No Spend Day, transaction streak, saving goal updates) to build mindful financial habits.

### 💼 Money & Wallet Management
- **Multi-Wallet Architecture**: Track Bank accounts (BCA, Mandiri, BNI, etc.), E-Wallets (GoPay, OVO, DANA, ShopeePay), and Physical Cash in one place.
- **Transfers & Net Deltas**: Real-time balance updates across wallets on transfers, edits, and reversals.
- **5-Second Undo**: Instant rollback window on accidental entries or deletions.
- **Debts & Receivables**: Monitor borrowed and lent money (*Hutang* & *Piutang*) with contact names and settlement statuses.
- **Paylater & Subscriptions**: Track multi-month installment schedules and recurring subscription billing cycles.

### 📊 Analytics & Reporting
- **Financial Health Score**: Dynamic rating (0–100) assessing savings rate, emergency reserve, and debt-to-income balance.
- **Client-Side Monthly Statement PDF**: Clean, branded vector PDF financial reports with zero external rendering services (`jsPDF`).
- **Data Export**: Complete data export to CSV (protected against CSV injection) and JSON formats anytime.
- **Category Budgets**: Set monthly limits per category with warning thresholds at 50%, 75%, and 90%.

### 🌐 Bilingual Localization
- **Full ID / EN Support**: Instant language switching between Indonesian (`id`) and English (`en`) across all dashboard widgets, reports, forms, and dialogs.

### 🔒 Privacy & Device Security
- **App Screen Lock**: Client-side 4-digit PIN lock with full physical keyboard support (number keys 0–9 & Backspace) on desktop, plus optional biometric unlock (WebAuthn / Touch ID / Face ID) on mobile.
- **Dual Reset Methods**: Reset forgotten PINs instantly using your account password or a 6-digit email confirmation OTP code with auto-unlock magic link.
- **Emergency Sign Out**: One-click emergency sign out option that cleanly wipes cached local PIN data to prevent lock loops.
- **Rate-Limited Actions**: Database-backed atomic rate limiting and timing-safe cryptographic comparisons on sensitive operations.

### ✉️ Custom Auth & Email System
- **Custom Domain Auth Handler**: In-app `/auth/action` handler for password reset and email verification, avoiding default Firebase screens.
- **Official Brand Email Templates**: Polished, responsive email notifications featuring the official Norden Finance logo.
- **Interactive Reset Form**: Live password length validation, confirmation match indicators, and show/hide visibility toggles.

### 🚀 3-Step Quick Start Onboarding
- **Workspace Activation Checklist**: Guides new users through creating a primary wallet, recording initial balance, and logging their first transaction.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/) + Firebase Admin SDK (Session Cookies)
- **File Storage**: [Supabase Storage](https://supabase.com/storage)
- **Email Service**: [Resend](https://resend.com/)
- **Charts & Export**: [Recharts](https://recharts.org/) & [jsPDF](https://github.com/parallax/jsPDF)

---

## 🚀 Quickstart

### Prerequisites

- **Node.js**: `v24+` (see `.nvmrc`)
- **PostgreSQL**: Local instance or hosted (e.g. Supabase, Neon)
- **Firebase Project**: Email/Password authentication enabled
- **Resend API Key**: (Optional for local testing; needed for email notifications)

### 1. Clone & Install

```bash
git clone https://github.com/overhaulpxl/norden-finance.git
cd norden-finance
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your database URL and Firebase credentials.

### 3. Database Migration

```bash
# Apply Prisma migrations
npx prisma migrate dev

# Generate client
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📋 Environment Configuration Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (pooled / PgBouncer) |
| `DIRECT_URL` | Direct PostgreSQL connection string (for migrations) |
| `NEXT_PUBLIC_APP_URL` | Base public URL (`https://nordenfinance.site` or `http://localhost:3000`) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Client SDK configuration keys |
| `FIREBASE_PROJECT_ID` | Firebase Service Account Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Client Email |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Private Key |
| `RESEND_API_KEY` | Resend API Key for transactional emails |
| `EMAIL_FROM` | Verified sender address (e.g. `Norden Finance <noreply@nordenfinance.site>`) |
| `CRON_SECRET` | Secret token for securing scheduled background jobs (`/api/cron/*`) |
| `SUPABASE_URL` | Supabase project URL for object storage |
| `SUPABASE_SECRET_KEY` | Supabase Service Role key |

---

## 🧪 Quality & Verification

Run these checks to verify code health:

```bash
# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Production build
npm run build
```

---

## 📄 License

Proprietary software. Copyright &copy; 2026 **Norden Finance**. All rights reserved.  
Crafted with focus by [@overhaulpxl](https://github.com/overhaulpxl).
