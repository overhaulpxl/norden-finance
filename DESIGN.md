# Norden Finance — Design System & Visual Direction

> **Design Archetype**: Functional Neo-Brutalism for Personal Finance.
> **Philosophy**: High-contrast, tactile, deterministic, and density-aware. No generic AI SaaS clichés, no ungrounded pastel blobs, no decorative noise.

---

## 1. Brand Identity & Visual Language

Norden Finance is a Personal Finance Operating System built for clarity, control, and long-term financial discipline. Its visual identity is **Neo-Brutalist**:

- **Sharp Geometry**: Absolute `0px` border-radius on cards, buttons, badges, tables, and inputs.
- **Hard Offsets**: Solid black hard-edge drop shadows (`box-shadow: 2px 2px 0px 0px #000`, `4px 4px 0px 0px #000`, or `8px 8px 0px 0px #000`). Never use blurred, floating ambient shadows.
- **Tactile Borders**: High-contrast pure black borders (`2px`, `2.5px`, or `3px solid #000000`).
- **Tactile Micro-Interactions**: Buttons depress on click (`transform: translate(2px, 2px)` with reduced shadow). Cards elevate slightly on hover (`translate(-1px, -1px)` with increased shadow).
- **Paper Canvas**: Backgrounds feature a tactile off-white paper canvas (`#FAF9F5`) with subtle geometric dot grid (`radial-gradient(#d1d1d1 1.5px, transparent 1.5px)` at `24px 24px` grid).

---

## 2. Color Palette & Financial Semantics

Color in Norden Finance is strictly functional and semantic. Every hue carries financial meaning.

### 2.1 Core Palette

| Role | Color Value | Tailwind Class / Variable | Semantic Usage |
|---|---|---|---|
| **Canvas Background** | `#FAF9F5` | `bg-[#FAF9F5]` | App shell, dashboard canvas, modal backdrop. |
| **Surface Card** | `#FFFFFF` | `bg-white` | Cards, tables, modals, input backgrounds. |
| **Primary Ink** | `#000000` | `text-black` / `border-black` | Borders, typography, active icons, hard shadows. |
| **Muted Ink** | `#64748B` / `#737373` | `text-neutral-500` / `text-slate-500` | Secondary metadata, timestamps, table column descriptions. |
| **Brand Accent (Yellow)** | `#FFE066` / `#F5D547` | `bg-[#FFE066]` | Logo mark, Pro badges, primary highlights, active status pill. |

### 2.2 Financial Direction & Status Colors

Never invert or randomize these semantic colors:

- **Income & Growth (Mint / Emerald)**:
  - Surface: `bg-[#bbf7d0]` (Mint 200) or `bg-emerald-100`
  - Ink: `text-emerald-950` / `text-emerald-800`
  - Indicator: `bg-emerald-500`
  - Usage: Pemasukan (income), target achieved, balance positive delta, Pro active badge.
- **Expense & Liability (Coral / Red)**:
  - Surface: `bg-[#ffccd5]` (Soft Coral) or `bg-red-100`
  - Ink: `text-red-950` / `text-red-700`
  - Border: `border-red-650` (`#dc2626`)
  - Usage: Pengeluaran (expense), utang (debt), danger zone, over-budget alert, payment rejected.
- **Transfer & Information (Sky Blue)**:
  - Surface: `bg-[#bfdbfe]` (Sky 200) or `bg-blue-100`
  - Ink: `text-blue-950` / `text-blue-800`
  - Indicator: `bg-blue-500`
  - Usage: Inter-wallet transfers, progress shimmer, informational notices, level 2 milestones.
- **Attention & Review (Amber / Gold)**:
  - Surface: `bg-[#fef08a]` (Yellow 200) or `bg-amber-100`
  - Ink: `text-amber-950` / `text-amber-800`
  - Usage: Pending payment review, trial countdown warning, reset caution cards.
- **Advanced & Projections (Purple)**:
  - Surface: `bg-[#c084fc]` (Purple 300)
  - Ink: `text-purple-950`
  - Usage: Smart forecasting, Level 5 Financial Navigator milestone.

---

## 3. Typography & Hierarchy

Font family: **Outfit** (`latin` subset) loaded via `next/font/google`.

### 3.1 Typographic Rules

- **Display & Section Titles**:
  - `font-black text-black uppercase tracking-wider` or `tracking-tight`.
  - Sizes: `text-xl sm:text-2xl lg:text-3xl`.
  - Always uppercase for headings to reinforce structural brutalist rhythm.
- **Financial Metric Displays**:
  - `font-black text-black tracking-wide`.
  - Sizes: `text-2xl sm:text-3xl xl:text-4xl`.
  - Format strictly as Indonesian Rupiah: `Rp 150.000` (thousands separated by dot, no trailing decimals unless explicitly fractional).
- **Badges, Eyebrows & Status Pills**:
  - `text-[10px] font-black uppercase tracking-widest px-2.5 py-1 border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`.
  - Clear, compact, high-contrast, zero-radius.
- **Body & Explanatory Text**:
  - `text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed`.
  - Avoid ultra-thin or light font weights (`font-light` / `font-thin` are prohibited).

---

## 4. Components & Layout Architecture

### 4.1 Card System (`.brutal-card`)

```css
.brutal-card {
  background-color: #ffffff;
  border: 3px solid #000000;
  border-radius: 0px !important;
  box-shadow: 4px 4px 0px 0px #000000;
  transition: all 0.2s ease-in-out;
}
.brutal-card:hover {
  box-shadow: 6px 6px 0px 0px #000000;
  transform: translate(-1px, -1px);
}
```

### 4.2 Button System (`.brutal-btn` & `.brutal-btn-light`)

- **Primary Button (`.brutal-btn`)**:
  - Solid black background, crisp white text, `2.5px solid #000`, `3.5px 3.5px 0px 0px #000` shadow.
  - Hover: `translate(1px, 1px)` with `2px 2px` shadow. Active: `translate(3px, 3px)` with zero shadow.
- **Light Button (`.brutal-btn-light`)**:
  - Solid white background, black text, identical brutalist border and offset shadow.
- **Disabled State**:
  - `disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-[original]`.

### 4.3 Form Inputs (`.brutal-input`)

- `border: 2.5px solid #000000; border-radius: 0px; box-shadow: 2.5px 2.5px 0px 0px #000000; font-weight: 700;`.
- Focus: `transform: translate(-1.5px, -1.5px); box-shadow: 4px 4px 0px 0px #000000; outline: none;`.

### 4.4 Data Density & Presentation Hierarchy

Do not force card grids onto every surface. Match UI layout to the specific financial user task:

| User Task | Layout Pattern | Justification |
|---|---|---|
| **Browsing 10+ transactions** | Bordered tabular data table (`table` with `border-collapse`, `border-[2px] border-black`, sticky headers) | Dense scanning, horizontal sorting, high information per vertical inch. |
| **Viewing wallet balances** | Compact tile grid (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6`) | Instant visual recognition of liquid accounts and balances. |
| **High-level financial pulse** | 3-column hero metric cards (Total Balance, Net Worth, Health Score) | Immediate cognitive grasp of overall trajectory. |
| **Budgets & Goals** | Progress-fill meters with bordered container | Visual comparison of limit vs actual spending. |
| **Single-item action (e.g. Reset, Upgrade)** | Focused dialog/card with explicit text confirmation gate | Maximum friction for destructive actions; zero accidental execution. |

---

## 5. Anti-Slop Quality Principles for Norden Finance

This section extends the official `antislop` guidelines (`miqdadbadjuber/anti-slop`) specifically for Norden Finance:

### 5.1 Prohibited Visual Anti-Patterns (Banned Slop)

1. **No Floating Glassmorphism**: Do not use heavy backdrop blurs, borderless translucent panels, or muddy white gradients that float without black structural borders.
2. **No Rounded Pill Cards**: Border-radius must remain `0px`. Never add `rounded-2xl`, `rounded-3xl`, or `rounded-full` to cards, modals, or form buttons.
3. **No Decorative Sparkle Emojis**: Do not add random sparkles (`✨`, `🪄`, `🌟`) or fireworks to financial tables or headers unless indicating a genuine level accomplishment.
4. **No Low-Contrast Gray-on-White**: Financial numbers, table labels, and button text must exceed WCAG AAA contrast ratio. No light gray text (`#cbd5e1`) on white backgrounds.
5. **No Fake Statistics or Stock Testimonials**: Every number, date, and chart point must represent verified user data or clear empty-state placeholders.
6. **No Redundant Brand Mark Stacking**: Never render the square icon mark stacked directly above the horizontal logo lockup. Use either the standalone icon or the full horizontal lockup.

### 5.2 Empty, Loading, and Error States

- **Loading Screens**: Single centered horizontal logo lockup with animated subtle bounce, high-contrast progress shimmer bar (`border-[3px] border-black`, `bg-[#bfdbfe]`), and rotating real-time action message pill.
- **Empty States**: Bordered dashed brutalist card (`border-[3px] border-dashed border-black`), large icon badge, brief description, and immediate action button (e.g. `"+ Tambah Dompet"`). Never leave an empty white void.
- **Error States**: Clear solid container with `border-[2px] border-black bg-red-100 text-red-700`. The error message must explain **why** and **what action to take** in plain Indonesian (e.g., `"Ketik RESET KEUANGAN dan centang kotak konfirmasi terlebih dahulu"`).
- **Destructive Confirmations**: Require explicit typed text gates (`RESET KEUANGAN` or `DELETE`) rather than casual "OK" dialogs.

---

## 6. Copywriting & Indonesian Voice Guidelines

Norden Finance communicates with users in clear, confident, respectful Indonesian:

- **Tone**: Pragmatic, direct, and empowering. Personal finance is serious; the software must feel reliable and objective.
- **Vocabulary**:
  - Use standard financial terms: `Pemasukan`, `Pengeluaran`, `Transfer`, `Saldo Dompet`, `Target Tabungan`, `Jatuh Tempo`, `Tagihan`.
  - Avoid ungrounded slang or excessive English buzzwords where clear Indonesian exists.
  - Avoid robotic machine translations.
- **Action Buttons**: Concrete imperative verbs in uppercase (e.g., `SIMPAN`, `TAMBAH TRANSAKSI`, `RESET DATA KEUANGAN`, `VERIFIKASI PEMBAYARAN`).

---

## 7. Responsive & Accessibility Standards

- **Mobile Viewports (360px - 640px)**:
  - Header displays hamburger toggle + compact official brand mark (`BrandLogo variant="icon"` at `h-8 w-8`) + truncated active tab title.
  - Horizontal scrolling for large transaction tables with persistent cell padding.
  - Touch targets minimum `44px × 44px`.
- **Keyboard Navigation**:
  - All interactive elements must show strong focus rings (`focus:ring-2 focus:ring-emerald-500` or `focus:translate-x-[-1px] focus:shadow-[4px_4px_0px_0px_#000]`).
- **Reduced Motion**:
  - Full support for `@media (prefers-reduced-motion: reduce)`: disables ambient bounce and shimmer animations immediately.
