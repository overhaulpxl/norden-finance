<p align="center">
  <img src="public/brand/norden-icon.svg" alt="Norden Finance" width="64" height="64" />
</p>

<h1 align="center">Norden Finance</h1>

<p align="center">
  <strong>Premium personal finance tracker SaaS — powered by AI, built with Next.js & Neo-Brutalist design.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=flat-square&logo=google" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/PostgreSQL-DB-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="TailwindCSS" />
</p>

---

## 🎯 Overview

**Norden Finance** is a premium SaaS personal finance tracker designed for individuals in Indonesia. It helps users understand, control, and improve their financial condition through **fast AI-powered transaction capture**, **strong analytics**, and **habit-forming retention mechanics**.

Built with a striking **Neo-Brutalist UI** design language — bold borders, sharp shadows, uppercase typography, and vibrant accent colors.

---

## ✨ Features

### 🤖 AI-Powered Features

| Feature | Description |
|---------|-------------|
| **Smart Input (AI Parser)** | Type transactions in natural language like `kopi 35k cash` or `gaji bca 8jt` — Gemini AI auto-detects amount, type, wallet, category, and date |
| **Receipt Scanner (AI OCR)** | Upload a receipt photo — Gemini AI extracts merchant name, total payment, items purchased, and date automatically |
| **AI Financial Insights** | AI-powered analysis of spending patterns, largest categories, and savings opportunities |

### 💰 Core Financial Management

| Feature | Description |
|---------|-------------|
| **Multi-Wallet System** | Manage BCA, BNI, DANA, GoPay, OVO, ShopeePay, Cash, and custom wallets in one dashboard |
| **Transaction CRUD** | Full create, read, update, and soft-delete with 5-second undo action |
| **Inter-Wallet Transfer** | Instant transfer between wallets with automatic balance updates |
| **Balance Tracking** | Real-time total balance across all wallets |
| **Manual & Quick Input** | Dual-mode: AI chat-style quick input or traditional form entry |
| **Global Search** | Search across transactions, wallets, categories, hashtags, and notes |
| **Transaction Tags** | Tag transactions with custom hashtags for flexible categorization |

### 📊 Dashboard & Analytics

| Feature | Description |
|---------|-------------|
| **Financial Health Score** | Composite score analyzing savings ratio, expense trends, budget adherence, and emergency fund coverage |
| **Expense Charts** | Visual breakdown of spending by category with interactive Recharts graphs |
| **Monthly Recap** | Monthly snapshot showing income, expenses, net cashflow, and comparisons |
| **Financial Timeline** | Chronological view of all financial activities |
| **No-Spend Calendar** | Visual calendar highlighting days with zero spending |
| **Summary Cards** | At-a-glance metrics: total balance, monthly income, monthly expenses |

### 🎯 Planning & Goals

| Feature | Description |
|---------|-------------|
| **Budget Manager** | Set monthly spending limits per category with real-time tracking and alerts at 80%+ usage |
| **Saving Goals** | Create savings targets with progress tracking and deadline management |
| **Wishlist** | Track desired purchases with status (locked, ready, bought) and unlock dates |
| **Emergency Fund Tracker** | Track emergency fund against 3-month, 6-month, and 12-month expense targets |

### 💳 Debt & Billing

| Feature | Description |
|---------|-------------|
| **Debt Tracker** | Track hutang (payables) and piutang (receivables) with tenor, interest rates, and settlement status |
| **Paylater Manager** | Manage paylater installments across platforms with monthly payment tracking |
| **Subscription Manager** | Monitor active subscriptions with billing day alerts and monthly costs |

### 🔄 Automation Center

| Feature | Description |
|---------|-------------|
| **Transaction Templates** | Save and reuse frequently used transactions with one-click execution |
| **Favorite Templates** | Star templates for quick access |
| **Recurring Transactions** | Automate monthly transactions (salary, rent, subscriptions) with day-of-month scheduling |
| **Smart Reminders** | In-app and email reminders for bills, budgets, streaks, and trial expiry |

### 🔥 Retention & Gamification

| Feature | Description |
|---------|-------------|
| **Transaction Streaks** | Track consecutive days of transaction logging with current and best streak |
| **Achievements** | Unlock badges: 7-day streak, 30-day streak, 100 transactions, Rp1M balance, savings goal reached, 3-month emergency fund |
| **Momentum Center** | Unified hub for streaks, achievements, and smart reminders |

### 📄 Export & Reporting

| Feature | Description |
|---------|-------------|
| **PDF Reports** | Generate branded monthly PDF reports with income, expenses, charts, top categories, and ending balance |
| **CSV Export** | Download transaction data as CSV |
| **JSON Export** | Export raw data in JSON format |

### 🔐 Authentication & Security

| Feature | Description |
|---------|-------------|
| **Firebase Authentication** | Register, login, logout, forgot password, and email verification |
| **Server-Side Sessions** | Secure session cookie management via Firebase Admin SDK |
| **Onboarding Flow** | Guided setup: register → verify email → login → set name, first wallet, opening balance |
| **Rate Limiting** | API rate limiting to prevent abuse |
| **Input Validation** | Server-side validation on all inputs |
| **Audit Logging** | Track all critical actions for accountability |
| **Soft Delete** | Transactions are soft-deleted, never permanently lost |

### 💎 Subscription & Payments

| Feature | Description |
|---------|-------------|
| **Trial Plan** | 14-day free trial with full feature access |
| **Pro Monthly** | Rp 19,000/month |
| **Pro Yearly** | Rp 149,000/year (save 35%) |
| **Manual Payment** | Transfer to BCA/BNI/QRIS → upload proof → admin reviews and approves |

### 🛡️ Admin Control Center

| Feature | Description |
|---------|-------------|
| **Platform Statistics** | View total users, revenue, active subscriptions |
| **User Management** | View all users, manage roles (user/admin) |
| **Payment Approval** | Review, approve, or reject payment proof submissions |
| **Feedback Management** | View and manage user feedback |
| **Payment Configuration** | Manage bank accounts and payment methods |

### ⚖️ Legal & Account

| Feature | Description |
|---------|-------------|
| **Privacy Policy** | Full privacy policy page at `/legal/privacy` |
| **Terms of Service** | Full terms page at `/legal/terms` |
| **Account Deletion** | Secure flow: Settings → Delete Account → type `DELETE` → confirm password → delete all data |
| **Settings Page** | Manage profile, display name, preferences, and account actions |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router, Server Components, Server Actions) |
| **Language** | TypeScript 5 |
| **UI** | React 19 + TailwindCSS 4 |
| **Database** | PostgreSQL + Prisma ORM 5 |
| **Auth** | Firebase Authentication + Firebase Admin SDK |
| **Storage** | Firebase Storage (receipt uploads, payment proofs) |
| **AI** | Google Gemini AI (natural language parsing, OCR) |
| **Charts** | Recharts 3 |
| **PDF** | jsPDF + jsPDF-AutoTable |
| **Icons** | Lucide React |
| **Design** | Neo-Brutalist UI System |

---

## 📁 Project Structure

```
my-app/
├── app/
│   ├── actions/          # Server Actions (transactions, budgets, goals, etc.)
│   ├── api/              # API Routes (auth, export, receipt scan, cron)
│   ├── dashboard/        # Main dashboard page
│   ├── login/            # Login page
│   ├── register/         # Register page
│   ├── forgot-password/  # Password recovery
│   ├── onboarding/       # New user onboarding
│   ├── upgrade/          # Subscription upgrade
│   ├── legal/            # Privacy & Terms pages
│   ├── norden-control-center/  # Admin panel
│   └── page.tsx          # Landing page
├── components/           # 30 React components
│   ├── AppLayout.tsx     # Main app shell with sidebar
│   ├── QuickInputModal.tsx  # AI-powered transaction input
│   ├── TransactionTable.tsx # Transaction list with search
│   ├── BalanceCards.tsx   # Wallet balance display
│   ├── BudgetManager.tsx # Budget CRUD
│   ├── SavingGoals.tsx   # Savings goal tracker
│   ├── DebtList.tsx      # Debt & receivable tracker
│   ├── PaylaterList.tsx  # Paylater installment tracker
│   ├── SubscriptionManager.tsx # Subscription tracker
│   ├── EmergencyFundTracker.tsx # Emergency fund
│   ├── HealthScore.tsx   # Financial health score
│   ├── ExpenseChart.tsx  # Expense breakdown charts
│   ├── MomentumCenter.tsx # Streaks & achievements
│   ├── AutomationCenter.tsx # Templates, recurring, reminders
│   ├── MonthlyRecap.tsx  # Monthly financial snapshot
│   ├── NoSpendCalendar.tsx # No-spend day calendar
│   ├── FinancialTimeline.tsx # Transaction timeline
│   ├── Wishlist.tsx      # Wishlist manager
│   ├── SettingsPage.tsx  # User settings
│   ├── HelpPage.tsx      # Help & documentation
│   ├── Integrations.tsx  # Third-party integrations
│   └── ...
├── lib/                  # Utilities & services
│   ├── aiParser.ts       # Gemini AI integration
│   ├── auth.ts           # Auth helpers
│   ├── firebase.ts       # Firebase client config
│   ├── firebaseAdmin.ts  # Firebase Admin SDK
│   ├── prisma.ts         # Prisma client
│   ├── parser.ts         # Natural language parser
│   ├── format.ts         # Currency formatting
│   ├── rateLimit.ts      # Rate limiting
│   ├── validators.ts     # Input validation
│   └── ...
├── prisma/
│   ├── schema.prisma     # Database schema (20+ models)
│   └── migrations/       # Database migrations
├── types/
│   └── index.ts          # TypeScript type definitions
└── scripts/              # Admin utility scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Firebase project (Auth + Storage)
- Google Gemini API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/overhaulpxl/norden-finance.git
cd norden-finance

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in your DATABASE_URL, Firebase config, and GEMINI_API_KEY

# 4. Run database migrations
npx prisma migrate deploy
npx prisma generate

# 5. Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/norden"

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY=

# AI
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🎨 Design System

Norden uses a **Neo-Brutalist** design system characterized by:

- **Bold borders** — 2.5px–3px solid black borders on all components
- **Hard shadows** — Offset box shadows (`4px 4px 0px 0px #000`)
- **No border-radius** — Sharp corners throughout
- **Uppercase typography** — All-caps with wide letter-spacing
- **High contrast** — Black text on white/cream backgrounds
- **Accent colors** — `#FFE066` (gold), `#4B6DFE` (blue), `#2ECC71` (green), `#FF6B6B` (red)
- **Micro-animations** — Hover wiggle, float, heartbeat, and spring effects
- **Interactive feedback** — Active press-down with shadow reduction

---

## 📄 License

This project is **proprietary software**. All rights reserved.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/overhaulpxl">@overhaulpxl</a>
</p>
