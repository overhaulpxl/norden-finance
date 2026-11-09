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
  <img src="https://img.shields.io/badge/Gemini_1.5-AI-4285F4?style=flat-square&logo=google" alt="Google Gemini" />
</p>

---

## 🧭 About Norden Finance

**Norden Finance** is a personal finance platform designed to replace messy spreadsheets and complex accounting tools with a fast, engaging web application.

Built with a bold Neo-Brutalist design language, it combines **natural language expense logging** (`kopi 35k bca`, `makan siang 45k gopay`), **AI receipt scanning**, **multi-wallet balance tracking**, and **financial health analytics** to help you stay on top of your financial goals.

---

## ✨ Key Capabilities

### ⚡ Smart Logging & AI
- **Natural Language Parsing**: Log expenses in natural Indonesian phrasing (`gaji 8jt bca`, `beli buku 120k cash`). Powered by Google Gemini 1.5 Flash.
- **Smart Receipt Scanner**: Upload shopping receipts or invoices to extract total amount, date, and line items automatically.
- **Clipboard Intelligence**: Detects incoming bank SMS or push notifications copied to your clipboard and prefills transaction details.
- **Mobile Shortcuts & NFC**: Trigger quick expense logging in under 2 seconds via Apple Shortcuts, Android HTTP Shortcuts, or NFC tags (`/api/shortcut`).

### 💼 Money & Wallet Management
- **Multi-Wallet Architecture**: Track Bank accounts (BCA, Mandiri, BNI, etc.), E-Wallets (GoPay, OVO, DANA, ShopeePay), and Physical Cash in one place.
- **Transfers & Net Deltas**: Real-time balance updates across wallets on transfers, edits, and reversals.
- **5-Second Undo**: Instant rollback window on accidental entries or deletions.
- **Debts & Receivables**: Monitor borrowed and lent money (*Hutang* & *Piutang*) with contact names and settlement statuses.
- **Paylater & Subscriptions**: Track multi-month installment schedules and recurring subscription billing cycles.

### 📊 Analytics & Reporting
- **Financial Health Score**: Dynamic rating (0–100) assessing savings rate, emergency reserve, and debt-to-income balance.
- **Client-Side Monthly Statement PDF**: Clean, branded vector PDF financial reports with zero external rendering services (`jsPDF`).
- **Data Export**: Complete data export to CSV and JSON formats anytime.
- **Category Budgets**: Set monthly limits per category with warning thresholds at 50%, 75%, and 90%.

### 🔒 Privacy & Device Security
- **App Screen Lock**: Client-side 4-digit PIN lock with optional biometric unlock (WebAuthn / Touch ID / Face ID).
- **Dual Reset Methods**: Reset forgotten PINs instantly using your account password or a 6-digit email confirmation code.
- **Emergency Sign Out**: One-click emergency sign out option that cleanly wipes cached local PIN data to prevent lock loops.
- **Rate-Limited Actions**: Database-backed atomic rate limiting and timing-safe cryptographic comparisons on sensitive operations.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Firebase Auth](https://firebase.google.com/) + Firebase Admin SDK (Session Cookies)
- **File Storage**: [Supabase Storage](https://supabase.com/storage)
- **AI Engine**: [Google Gemini 1.5 Flash](https://ai.google.dev/)
- **Email Service**: [Resend](https://resend.com/)
- **Charts & Export**: [Recharts](https://recharts.org/) & [jsPDF](https://github.com/parallax/jsPDF)

---

## 🚀 Quickstart

### Prerequisites

- **Node.js**: `v24+` (see `.nvmrc`)
- **PostgreSQL**: Local instance or hosted (e.g. Supabase, Neon)
- **Firebase Project**: Email/Password authentication enabled
- **Google Gemini API Key**: For AI transaction parsing & receipt OCR
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

Fill in your database URL, Firebase credentials, and API keys.

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
| `GEMINI_API_KEY` | Google Gemini API Key for NLP & OCR |
| `RESEND_API_KEY` | Resend API Key for transactional emails |
| `EMAIL_FROM` | Verified sender address (e.g. `Norden Finance <noreply@nordenfinance.site>`) |
| `CRON_SECRET` | Secret token for securing scheduled background jobs (`/api/cron/*`) |
| `SHORTCUT_TOKEN_SECRET` | Secret key for signing mobile shortcut HMAC tokens |
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

## 📱 Mobile OS Shortcut Setup

To log expenses on-the-go via iOS Shortcuts, Android, or NFC tags:

1. Open **Dashboard &rarr; Integrations**.
2. Copy your signed shortcut endpoint URL:
   ```
   https://nordenfinance.site/api/shortcut?token=<your_signed_token>
   ```
3. In **Apple Shortcuts** (iOS) or **HTTP Shortcuts** (Android):
   - Action: `Get Contents of URL` / HTTP POST
   - Method: `POST`
   - Headers: `Content-Type: application/json`
   - Body: `{ "text": "kopi 25k bca" }`
4. Tap your NFC sticker or run the shortcut from your lock screen widget.

---

## 📄 License

Proprietary software. Copyright &copy; 2026 **Norden Finance**. All rights reserved.  
Crafted with focus by [@overhaulpxl](https://github.com/overhaulpxl).
