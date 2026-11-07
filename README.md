<p align="center">
  <img src="public/brand/norden-icon.svg" alt="Norden Finance" width="64" height="64" />
</p>

<h1 align="center">Norden Finance</h1>

<p align="center">
  <strong>Track your money. Find your direction.</strong>
</p>

<p align="center">
  <a href="https://nordenfinance.site">https://nordenfinance.site</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-DB-4169E1?style=flat-square&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/Supabase-Storage-3ECF8E?style=flat-square&logo=supabase" alt="Supabase Storage" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=flat-square&logo=google" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Resend-Email-000000?style=flat-square&logo=resend" alt="Resend" />
</p>

---

## 🧭 Overview & Brand Story

**Norden** (*North* in Germanic languages) serves as the ultimate personal financial compass. 

Designed for individuals and creators in Indonesia, **Norden Finance** replaces cluttered spreadsheets and cumbersome expense apps with a striking, highly engaging **Neo-Brutalist** web application. It combines **sub-second natural language input**, **smart receipt scanning**, **deep analytics**, and **habit-forming retention mechanics** to give users complete clarity over their financial trajectory.

---

## ✨ Features Matrix

### 🤖 AI-Powered Intelligence
| Feature | Capabilities |
|---|---|
| **Smart Input (AI Parser)** | Parses natural language Indonesian expressions like `kopi 35k cash`, `gaji bca 8jt`, or `transfer bca ke gopay 150k` into structured transactions (amount, type, category, wallet, date) using Google Gemini 1.5 Flash. |
| **Receipt Scanner (AI OCR)** | Extracts merchant names, timestamps, total amounts, and itemized breakdown from uploaded receipt images. |
| **Financial Advisory Insights** | Generates dynamic spending pattern diagnostics, savings rate feedback, and budget optimization recommendations. |

### 💰 Core Financial Engine
| Feature | Capabilities |
|---|---|
| **Multi-Wallet Architecture** | Manage Bank accounts (BCA, BNI, Mandiri), E-Wallets (GoPay, OVO, DANA, ShopeePay), and Cash in a single unified view. |
| **Atomic Balance Mutations** | Real-time balance calculations with net-delta adjustments on transaction edits and transfers. |
| **Smart Clipboard Helper** | Detects bank SMS / banking app push notifications from clipboard and auto-fills transaction inputs. |
| **Transaction CRUD & 5-Second Undo** | Instant optimistic mutations with time-windowed reversible undo actions. |
| **Global Search & Filter** | Live multi-criteria filtering across notes, categories, wallets, tags, and date ranges. |

### 📊 Analytics & Reporting
| Feature | Capabilities |
|---|---|
| **Financial Health Score** | Algorithm measuring savings rate, active liquidity, debt-to-income ratio, and emergency fund buffer (0–100 scale). |
| **Neo-Brutalist Monthly PDF** | Generates client-ready monthly financial statements using vector canvas drawing with zero external renderer dependencies (`jsPDF`). |
| **Export Formats (CSV / JSON)** | One-click export with automated CSV formula injection neutralization (CWE-1236 protection). |
| **Interactive Spending Charts** | Expense distribution by category and daily cashflow trends via Recharts. |
| **No-Spend Day Calendar** | Highlights spending-free days to build mindful financial discipline. |

### 🎯 Planning, Goals & Emergency Reserve
| Feature | Capabilities |
|---|---|
| **Category Budgets** | Set spending caps per category with threshold notifications at 50%, 75%, and 90%. |
| **Saving Goals** | Target-based savings tracking with progress bars, deposit history, and deadline indicators. |
| **Emergency Fund Calculator** | Calculates personal runway against 3, 6, and 12-month expense requirements with zero-division guards. |
| **Smart Wishlist** | Curate purchases with lock periods and affordability checks to curb impulse buying. |

### 💳 Liabilities, Paylater & Subscriptions
| Feature | Capabilities |
|---|---|
| **Debt & Receivable Tracker** | Manage *Hutang* (payables) and *Piutang* (receivables) with contact details, due dates, and settlement toggles. |
| **Paylater Installments** | Track multi-month installment schedules across platforms with automated balance sync. |
| **Recurring Subscriptions** | Schedule recurring fixed costs with billing day reminders. |

### ⚡ Automation & Mobile Shortcuts
| Feature | Capabilities |
|---|---|
| **Mobile OS Shortcuts & NFC** | Direct REST API endpoint (`POST /api/shortcut`) for Apple Shortcuts (iOS) and HTTP Shortcuts (Android). Log spending in < 2 seconds via NFC tap. |
| **Automated Recurring Cron** | Monthly automated transaction scheduling with concurrency mutexes to prevent double-charging (`GET/POST /api/cron/recurring`). |
| **Email & In-App Reminders** | Automated bill and budget alerts powered by Resend (`GET/POST /api/cron/reminders`). |

### 🛡️ Security, Privacy & Integrity
| Feature | Capabilities |
|---|---|
| **Database-Backed Rate Limiter** | Atomic PostgreSQL UPSERT rate limiting per IP and client token across all sensitive endpoints. |
| **CSRF & Origin Verification** | Strict origin validation (`assertSameOrigin`) with reverse-proxy header support (`x-forwarded-host`, `x-forwarded-proto`). |
| **HMAC-SHA256 Shortcut Tokens** | Signed capability tokens with instant version-based revocation when resetting endpoints. |
| **Timing-Safe Authentication** | Cryptographic constant-time comparison (`timingSafeEqual`) for all PIN resets, cron auth, and tokens. |
| **Stored XSS File Quarantine** | Image uploads strictly limited to raster images (JPEG, PNG, WebP) with 5MB payload caps. SVG files blocked to eliminate stored SVG script injection. |
| **Global Maintenance Freeze** | Instant fail-closed write freeze across all server actions, APIs, and raw queries via `MAINTENANCE_ACTIVE` 503 response. |
| **Session Cookie Security** | Server-side Firebase Admin session cookies with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes. |

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) | Server Components, Server Actions, Route Handlers |
| **UI Library** | [React 19](https://react.dev/) | Component rendering, concurrent transitions |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict end-to-end type safety |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Neo-Brutalist design tokens, utility classes |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Prisma 5](https://www.prisma.io/) | Relational database schema, connection pooling |
| **Authentication** | [Firebase Auth](https://firebase.google.com/) + Admin SDK | Client authentication & server session verification |
| **Object Storage** | [Supabase Storage](https://supabase.com/storage) | Secure payment proofs & merchant QRIS assets |
| **Artificial Intelligence** | [Google Gemini 1.5 Flash](https://ai.google.dev/) | Natural language financial parser & receipt OCR |
| **Email Delivery** | [Resend](https://resend.com/) | Transactional verification, reminder, and reset emails |
| **Data Visualization** | [Recharts 3](https://recharts.org/) | Responsive SVG charts and cashflow graphs |
| **Document Generation** | [jsPDF](https://github.com/parallax/jsPDF) + AutoTable | Serverless vector monthly report PDF engine |

---

## 📁 Project Structure

```
norden-finance/
├── app/
│   ├── actions/                   # Server Actions (CRUD, transactions, budgets, etc.)
│   ├── api/
│   │   ├── auth/                  # Session, registration, verification routes
│   │   ├── cron/                  # Recurring & reminder scheduled workers
│   │   ├── export/                # CSV, JSON, and PDF report stream handlers
│   │   ├── log/                   # Direct transaction logging API
│   │   ├── public/testimonials/   # Rate-limited public feedback feed
│   │   ├── scan-receipt/          # OCR image receipt processing
│   │   ├── shortcut/              # Signed Mobile Shortcut & NFC entrypoint
│   │   └── upload/                # Quarantined image upload endpoints
│   ├── dashboard/                 # Core user dashboard & financial hub
│   ├── norden-control-center/     # Admin panel (user, payment, & setting management)
│   ├── onboarding/                # New account initial configuration flow
│   ├── upgrade/                   # Norden Pro subscription & payment portal
│   └── page.tsx                   # Public Neo-Brutalist landing page
├── components/                    # 30+ modular Neo-Brutalist UI components
├── lib/
│   ├── achievements.ts            # Gamification badge sync engine
│   ├── aiParser.ts                # Google Gemini AI prompts & schema parsers
│   ├── audit.ts                   # Secure audit log recording
│   ├── auth.ts                    # Session cookie inspection & entitlement gates
│   ├── data/loaders.ts            # High-performance cached data loaders
│   ├── maintenance.ts             # Global write-freeze maintenance guard
│   ├── pdf/monthlyReport.ts       # Neo-Brutalist PDF layout & vector graphics
│   ├── prisma.ts                  # Extended Prisma Client with maintenance hooks
│   ├── rateLimit.ts               # PostgreSQL atomic rate limiting engine
│   ├── requestSecurity.ts         # Reverse-proxy aware CSRF & origin verification
│   └── storage.ts                 # Supabase Storage client & path sanitizers
├── prisma/
│   └── schema.prisma              # 20+ relational database models & indexes
├── public/                        # Static brand assets, icons, and fonts
└── types/                         # Shared TypeScript interfaces & enumerations
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18.18+` or `v20+`
- **PostgreSQL**: Local instance or hosted service (Supabase, Neon, AWS RDS)
- **Firebase Project**: Authentication enabled (Email/Password)
- **Supabase Project**: Storage buckets (`payment-proofs`, `qris`) created
- **Google Gemini API Key**: From Google AI Studio
- **Resend API Key**: (Optional for local dev, required for emails)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/overhaulpxl/norden-finance.git
cd norden-finance

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

### Database Setup

```bash
# Apply schema migrations to your development database
npx prisma migrate dev

# Generate Prisma Client types
npx prisma generate
```

### Running Locally

```bash
# Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Configure these variables inside `.env.local`:

```env
# ─── Database Connections ───
DATABASE_URL=postgresql://user:password@host:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/postgres

# ─── Public Application URL ───
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ─── Firebase Client SDK (Public) ───
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ─── Firebase Admin SDK (Server Only) ───
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ─── Google Gemini AI ───
GEMINI_API_KEY=your_gemini_api_key

# ─── Cron & Shortcut Security ───
CRON_SECRET=generate_at_least_32_random_characters
SHORTCUT_TOKEN_SECRET=generate_another_secret_for_shortcuts

# ─── Storage Configuration (Supabase Storage) ───
SUPABASE_URL=https://your_supabase_project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_key

# ─── Email Delivery (Resend) ───
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Norden Finance <noreply@nordenfinance.site>
EMAIL_VERIFICATION_PROVIDER=firebase # 'firebase' or 'resend'

# ─── Optional Maintenance Mode ───
MAINTENANCE_MODE=false
```

---

## 📱 Mobile OS Shortcuts & NFC Setup

Norden Finance enables hands-free, frictionless spending tracking directly from your phone's lock screen or via NFC tags:

1. Navigate to **Dashboard → Integrations**.
2. Copy your personal **Mobile Shortcut Endpoint URL**:
   ```
   https://nordenfinance.site/api/shortcut?token=<your_signed_hmac_token>
   ```
3. In **Apple Shortcuts** (iOS) or **HTTP Shortcuts** (Android):
   - Add a `Get Contents of URL` action.
   - Set method to `POST`.
   - Set Body type to `JSON` with `{ "text": "Shortcut Input" }`.
4. Trigger via Siri, Lock Screen Widget, or write the URL to an NFC sticker placed on your wallet or desk.
5. If your phone or NFC tag is misplaced, click **Reset Token** on the Integrations page to immediately revoke all previous links.

---

## 🎨 Neo-Brutalist Design Philosophy

The interface is built strictly around **Neo-Brutalist** UI principles:

- **Heavy Strokes**: `2.5px` to `3px` solid black borders (`border-black`).
- **Hard Block Shadows**: High-contrast, unblurred offset drop shadows (`4px 4px 0px 0px #000`).
- **Sharp Geometry**: Zero border-radius on buttons, cards, inputs, and modals (`rounded-none`).
- **High-Contrast Palette**: Cream/white canvases punctuated by `#FFE066` (Gold), `#4B6DFE` (Cobalt Blue), `#2ECC71` (Emerald Green), and `#FF6B6B` (Coral Red).
- **Physical Press Feedback**: Interactive active states shift translation by `2px` while reducing shadow depth to mimic physical buttons.

---

## 🧪 Testing, Quality & Production Verification

All commits must pass the three-tier quality gate:

```bash
# 1. TypeScript Static Analysis (Zero Errors)
npx tsc --noEmit

# 2. ESLint Code Hygiene (Zero Warnings)
npm run lint

# 3. Turbopack Production Build
npm run build
```

---

## 📄 License

Proprietary software. Copyright © 2026 **Norden Finance**. All rights reserved.

<p align="center">
  Crafted with focus by <a href="https://github.com/overhaulpxl">@overhaulpxl</a>
</p>
