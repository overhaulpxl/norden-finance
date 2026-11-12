# Product Requirements Document (PRD)

## Norden Finance

**Product:** Norden Finance  
**Platform:** Responsive Web Application (Desktop & Mobile Web) + iOS Shortcuts / Webhook API  
**Status:** Live / Active Production  
**Version:** 1.0  
**Primary User:** Individu, Freelancer, & Profesional Muda di Indonesia (Smart Money Trackers)  
**Product Type:** SaaS Personal Financial Management & Wealth Intelligence Platform  

---

# 1. Product Overview

Norden Finance adalah platform pencatatan keuangan pribadi modern (personal financial operating system) berbasis SaaS yang dirancang khusus untuk memenuhi dinamika ekosistem finansial di Indonesia.

Aplikasi menggabungkan kemudahan pencatatan transaksi super-cepat berbasis Artificial Intelligence (AI) dengan analisis kesehatan keuangan mendalam, manajemen multi-dompet (Bank, E-Wallet, Tunai), automasi recurring, pelacakan kewajiban (Hutang, Piutang, Paylater), serta sistem retensi berbasis gamifikasi.

> **"Track your money. Find your direction."**  
> Mengubah rutinitas pencatatan keuangan dari pekerjaan administratif yang membosankan menjadi kebiasaan harian yang interaktif, visual, dan memotivasi.

Norden Finance dibangun menggunakan bahasa visual **Neo-Brutalism** (garis tegas hitam, drop-shadow tajam, tipografi uppercase, dan palet warna energetik) yang mencerminkan ketegasan dalam mengelola uang.

---

# 2. Product Vision

## "The Ultimate Financial Compass for Modern Individuals."

Pengguna membuka Norden Finance dan dalam 3 detik dapat langsung memahami kondisi finansialnya:

* Total kekayaan bersih (Net Worth) lintas semua rekening dan e-wallet.
* Arus kas bulan berjalan (Pemasukan, Pengeluaran, Net Cashflow).
* Skor Kesehatan Keuangan (Financial Health Score 0–100).
* Status anggaran kategori (apakah mendekati batas limit 80%+).
* Kewajiban mendesak (Cicilan Paylater, Jatuh Tempo Hutang, Tagihan Langganan).
* Streak pencatatan harian dan pencapaian finansial (Achievements).

---

# 3. Problem Statement

Pencatatan keuangan tradisional di Indonesia menghadapi 4 kendala utama:

```text
High Friction Input
→ Form input manual yang lambat membuat pengguna malas mencatat pengeluaran kecil (kopi, parkir).

Fragmented Financial Landscape
→ Saldo tersebar di BCA, BNI, Mandiri, GoPay, OVO, DANA, ShopeePay, dan Uang Tunai.

Paylater & Micro-Debt Trap
→ Kemudahan cicilan paylater (Shopee PayLater, GoPay Later) dan hutang informal sulit terlacak.

Lack of Retention & Habit Loops
→ Mayoritas pengguna berhenti mencatat setelah 7 hari karena tidak ada feedback visual atau gamifikasi.
```

Norden Finance menjawab masalah ini dengan pendekatan:
1. **Zero-Friction Capture:** Input bahasa alami (`kopi 35k cash`) dan scan struk foto AI.
2. **Unified Liquidity Hub:** Multi-dompet dengan saldo riil dan transfer antar-dompet otomatis.
3. **Structured Liability Tracking:** Modul khusus Paylater, Hutang, dan Piutang.
4. **Behavioral Gamification:** Streak harian, badge penghargaan, dan kalender No-Spend.

---

# 4. Goals

## Primary Goals

1. **Natural Language Input:** Memproses input teks santai menjadi transaksi terstruktur dalam < 1 detik.
2. **AI Optical Scanner:** Ekstraksi otomatis merchant, total bayar, item belanja, dan tanggal dari foto struk belanja.
3. **Comprehensive Multi-Wallet:** Mengelola saldo multi-bank, e-wallet, dan cash dengan kalkulasi saldo otomatis.
4. **Actionable Financial Score:** Menyediakan skor kesehatan keuangan objektif (0–100) berdasarkan rasio tabungan, dana darurat, dan beban hutang.
5. **Budget Adherence:** Mencegah overspending dengan notifikasi visual saat kategori melewati batas 80% dan 100%.
6. **Complete Liability Control:** Memonitor tenor, cicilan bulanan, dan sisa kewajiban Paylater serta Hutang/Piutang.
7. **Cross-Platform Accessibility:** Akses lancar dari Web Desktop, Mobile Browser, dan iOS Shortcuts via NFC/Action Button.
8. **Retention Mechanics:** Membangun kebiasaan mencatat harian lewat Transaction Streaks dan Unlockable Badges.
9. **Automasi Transaksi:** Eksekusi transaksi rutin bulanan (recurring) dan template transaksi favorit sekali klik.
10. **Laporan & Portabilitas Data:** Export laporan bulanan format PDF formal, CSV, dan JSON.

## Secondary Goals

* Mengurangi drop-off pengguna baru lewat onboarding interaktif 3-langkah.
* Mendukung monetisasi mandiri (Subscription Pro Bulanan/Tahunan) dengan pembayaran lokal (BCA, BNI, QRIS).
* Panel Admin terpusat untuk approval pembayaran, audit log, dan feedback pengguna.
* Kemampuan offline-resilient dan fallback aman saat layanan eksternal AI mengalami limit.

---

# 5. Non-Goals

Norden Finance tidak bertujuan untuk:

* Menjadi bank digital atau penyedia pinjaman (Bukan P2P lending atau aggregator pinjol).
* Mengakses API rekening bank secara langsung melalui open-banking / scraping kredensial pengguna (menghindari risiko sekuritas perbankan).
* Melakukan eksekusi pembayaran atau transfer uang sungguhan keluar dari aplikasi.
* Menyimpan kredensial perbankan atau PIN transaksi pengguna.
* Menggantikan peran konsultan pajak resmi atau penasihat investasi berlisensi (OJK).

---

# 6. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT INTERFACES                             │
│                                                                        │
│   Web Desktop (Next.js 16)      Mobile Web PWA      iOS Shortcuts/NFC  │
└───────────────────┬───────────────────┬───────────────────┬────────────┘
                    │                   │                   │
                    ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SECURITY & GATEWAY LAYER                        │
│                                                                        │
│   • Origin Validation (CSRF)          • Rate Limiting (In-Memory/DB)   │
│   • Firebase Admin Session Cookies    • HMAC Token Auth (Shortcuts)    │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION CORE ENGINE                        │
│                                                                        │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │ Server Actions       │  │ API Routes          │  │ Cron Runners   │ │
│  │ (Dashboard, Wallets, │  │ (/api/shortcut,     │  │ (Recurring,    │ │
│  │  Budgets, Debts)     │  │  /api/scan-receipt) │  │  Reminders)    │ │
│  └──────────┬───────────┘  └──────────┬──────────┘  └────────┬───────┘ │
│             │                         │                      │         │
│             ▼                         ▼                      ▼         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      BUSINESS LOGIC SUBSYSTEMS                    │ │
│  │                                                                   │ │
│  │ • Natural Language Parser (Heuristic Regex + Gemini 1.5 Flash)    │ │
│  │ • Financial Health Score Calculator                               │ │
│  │ • Wallet Balance Delta Engine                                     │ │
│  │ • Streak & Achievement Evaluator                                  │ │
│  │ • Branded PDF Generation Engine (jspdf / pdfkit)                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
┌───────────────────────────────────────┐   ┌────────────────────────────┐
│          DATA PERSISTENCE             │   │     EXTERNAL SERVICES      │
│                                       │   │                            │
│  • PostgreSQL Database                │   │  • Google Gemini AI        │
│  • Prisma ORM 5 (Connection Pooling)  │   │  • Firebase Authentication │
│  • Audit Logging Subsystem            │   │  • Firebase Storage (SaaS) │
│                                       │   │  • Resend / SMTP Email     │
└───────────────────────────────────────┘   └────────────────────────────┘
```

---

# 7. Source of Truth & Data Ownership

| Entitas Data | Source of Truth | Keterangan Sinkronisasi |
|---|---|---|
| User Credentials | Firebase Auth | Autentikasi email/password, verifikasi email, session token |
| User Profile & Plan | PostgreSQL (`Profile`) | Status langganan (Trial/Pro), masa aktif, role admin |
| Transaksi Keuangan | PostgreSQL (`Transaction`) | Data master transaksi (`masuk`, `keluar`, `transfer`), tags, soft delete |
| Saldo Dompet | PostgreSQL (`Balance`) | Diupdate secara transaksional saat mutasi terjadi |
| Anggaran Kategori | PostgreSQL (`Budget`) | Limit bulanan per kategori per user |
| Tujuan Tabungan | PostgreSQL (`SavingGoal`) | Target nominal, progres terkumpul, deadline |
| Bukti Pembayaran / Struk | Firebase Storage | File gambar receipt dan bukti transfer pembayaran |
| Token Shortcut Ponsel | PostgreSQL + HMAC | Validasi integrasi instan iOS / NFC Shortcut |

---

# 8. Multi-Wallet & Account Management

Dompet (`Balance`) merepresentasikan akun penyimpan likuiditas pengguna.

## Kategori Akun yang Didukung
* **Bank:** BCA, BNI, Mandiri, BRI, Bank Jago, SeaBank, Blu by BCA, dll.
* **E-Wallet:** GoPay, OVO, DANA, ShopeePay, LinkAja.
* **Cash / Tunai:** Dompet fisik, petty cash.
* **Lain-lain:** Akun custom yang ditentukan pengguna.

## Aturan Bisnis Dompet
1. Setiap dompet unik berdasarkan kombinasi `[userId, name]`.
2. **Kalkulasi Saldo Riil:**
   * Transaksi `masuk` menambah `currentBalance`.
   * Transaksi `keluar` mengurangi `currentBalance`.
   * Transaksi `transfer` memotong saldo `walletId` dan menambah saldo `transferToWalletId`.
3. **Pengarsipan Dompet (Soft Archive):**
   * Dompet yang tidak lagi digunakan dapat diarsipkan (`archivedAt`).
   * Dompet terarsip tidak muncul di pilihan transaksi baru, tetapi histori transaksi masa lalunya tetap utuh.
   * Dompet terarsip dapat dipulihkan (*restore*) kapan saja.

---

# 9. Smart Input Engine (Natural Language & Rule-Based)

Smart Input memungkinkan pencatatan transaksi super-cepat tanpa mengisi dropdown satu per satu.

## 1. Dual-Engine Pipeline

```text
User Text Input: "kopi kenangan 35k gopay"
                    │
                    ▼
       ┌────────────────────────┐
       │   Fast Heuristic       │
       │   Regex Parser         │
       └───────────┬────────────┘
                   │
         [Match Detected?]
          ├── YA ──► Eksekusi Transaksi Instan (0 ms network cost)
          └── TIDAK (Ambiguitas)
                   │
                   ▼
       ┌────────────────────────┐
       │   Google Gemini AI     │
       │   (gemini-1.5-flash)   │
       └───────────┬────────────┘
                   │
                   ▼
       Ekstraksi Parameter Terstruktur:
       { amount: 35000, type: 'keluar', wallet: 'gopay', category: 'makan', note: 'kopi kenangan' }
```

## 2. Aturan Heuristik Indonesia
* **Nominal:**
  * `35k` / `35rb` / `35 ribu` $\rightarrow$ `35.000`
  * `1.5jt` / `1,5 juta` $\rightarrow$ `1.500.000`
  * Angka mentah `25000` $\rightarrow$ `25.000`
* **Metode Pembayaran (Aliases):**
  * `tunai`, `uang tunai` $\rightarrow$ `cash`
  * `go-pay`, `gojek` $\rightarrow$ `gopay`
  * `spay`, `shopee pay` $\rightarrow$ `shopeepay`
  * `bca`, `bni`, `seabank`, `jago`, `blu`, `dana`, `ovo`.
* **Klasifikasi Tipe & Kategori:**
  * Kata kunci `gaji`, `bonus`, `refund`, `terima` $\rightarrow$ Tipe `masuk`.
  * Kata kunci `ayam`, `nasi`, `kopi`, `jajan` $\rightarrow$ Kategori `makan`.
  * Kata kunci `bensin`, `gojek`, `grab`, `parkir`, `tol` $\rightarrow$ Kategori `transport`.
  * Kata kunci `transfer dari bca ke gopay 100k` $\rightarrow$ Tipe `transfer`.

---

# 10. AI Receipt Scanner (Optical OCR)

Fitur untuk memindai struk belanja fisik secara langsung menggunakan kamera atau unggah berkas foto.

## Alur Kerja OCR:
1. Pengguna mengunggah foto struk belanja (JPG/PNG/WEBP).
2. Sistem mengompresi gambar dan mengirimkan payload base64 ke endpoint `/api/scan-receipt`.
3. Gemini AI memproses gambar dengan *system prompt* terarah untuk mengekstraksi:
   * **Merchant Name** (e.g., "Indomaret Point", "Starbucks").
   * **Total Belanja** (angka final setelah diskon/pajak).
   * **Daftar Barang (Itemized)** (nama barang, kuantitas, harga).
   * **Tanggal Transaksi** (jika terbaca pada struk).
4. Hasil OCR disajikan dalam mode verifikasi (Review Card) sebelum disimpan. Pengguna dapat mengubah dompet atau kategori dalam satu sentuhan.

---

# 11. Transaction Lifecycle & Auditability

## 1. Operasi CRUD & Soft Delete
* **Create:** Validasi schema, pemotongan/penambahan saldo dompet, update streak, sinkronisasi achievement.
* **Update:** Rollback selisih saldo lama, terapkan saldo baru, log audit trail.
* **Soft Delete:** Transaksi tidak pernah langsung dihapus permanen dari basis data; field `deletedAt` diisi timestamp pembatalan.
* **5-Second Undo Action:** Sesaat setelah mencatat transaksi via modal cepat, toast undo interaktif muncul memungkinkan pembatalan instan tanpa membuka tabel riwayat.

## 2. Hashtags & Metadata
* Pengguna dapat menyematkan tag fleksibel dengan format hashtag (e.g., `#liburanbali`, `#proyekkantor`).
* Tag mendukung filter laporan multi-dimensi independen dari kategori standar.

---

# 12. Budget Management & Category Enforcement

Pengguna dapat menetapkan pagu pengeluaran bulanan per kategori.

## Status Anggaran
```text
  0% — 79%  : Normal (Aman / Hijau)
 80% — 99%  : Warning Alert (Kuning / Mendekati Batas)
100%+       : Overbudget (Merah / Melampaui Batas)
```

## Fitur Unggulan Anggaran
* **Visual Progress Bar:** Menampilkan persentase real-time penggunaan budget.
* **Sisa Kuota Harian:** Menghitung sisa nominal yang boleh dibelanjakan per hari hingga akhir bulan agar tidak overbudget.
* **Dashboard Alert:** Peringatan langsung pada panel atas dashboard saat ada kategori kritis.

---

# 13. Financial Health Scoring & Intelligence Engine

Financial Health Score adalah metrik komposit tunggal (0–100) yang mengukur ketahanan finansial pengguna setiap bulan.

## Komponen Formula Skor:

| Dimensi | Bobot | Kriteria Evaluasi |
|---|---|---|
| **Savings Rate** | 30 Poin | Porsi tabungan dari pemasukan (`[Pemasukan - Pengeluaran] / Pemasukan`). Penuh jika $\ge 20\%$. |
| **Emergency Fund Coverage** | 40 Poin | Rasio total saldo likuid terhadap rata-rata pengeluaran bulanan. Penuh jika mencapai minimal 3 bulan biaya hidup. |
| **Debt-to-Balance Ratio** | 30 Poin | Rasio total hutang belum lunas terhadap total saldo kas. Penuh jika rasio hutang $\le 0\%$, skor 0 jika hutang melampaui $50\%$ dari saldo. |

## Klasifikasi Skor:
* **80 – 100:** *Sangat Sehat* (Keuangan prima, likuiditas kuat).
* **60 – 79:** *Cukup Baik* (Perlu ekspansi dana darurat atau rem belanja konsumtif).
* **40 – 59:** *Perlu Perhatian* (Rasio tabungan tipis atau beban cicilan mulai menekan).
* **0 – 39:** *Kritis* (Defisit arus kas atau hutang melebihi kapasitas likuiditas).

---

# 14. Planning, Goals & Emergency Fund Architecture

## 1. Saving Goals (Target Menabung)
* Menetapkan target tabungan spesifik (misal: "Beli Laptop", "DP Rumah").
* Input progress berkala dengan progress bar persentase.
* Estimasi tanggal tercapai berdasarkan kecepatan menabung rata-rata.

## 2. Emergency Fund Tracker (Dana Darurat)
* Pengguna memasukkan estimasi pengeluaran wajib bulanan.
* Kalkulator otomatis menyediakan 3 tingkatan target:
  * **Level 1 (Pemula):** 3x Pengeluaran Bulanan.
  * **Level 2 (Menengah):** 6x Pengeluaran Bulanan.
  * **Level 3 (Aman):** 12x Pengeluaran Bulanan.
* Melacak posisi saldo riil terhadap target ideal dana darurat.

## 3. Wishlist Impulse Protection (Rem Belanja)
* Konsep *Delayed Gratification*: Barang impian dicatat dengan status `locked` dan waktu tunggu (misal: 14 atau 30 hari).
* Mencegah pembelian impulsif; tombol beli hanya aktif (`ready`) setelah masa tunggu habis dan pengguna mengevaluasi ulang keputusannya.

---

# 15. Debt & Liability Engine

## 1. Hutang & Piutang (Debt Tracker)
* **Hutang (Payable):** Kewajiban yang harus dibayar kepada orang/lembaga lain.
* **Piutang (Receivable):** Uang pengguna yang dipinjam oleh orang lain.
* Mencatat nama rekan, tanggal pinjam, tenor, suku bunga (opsional), dan histori cicilan bertahap hingga status `isSettled = true`.

## 2. Paylater & Cicilan Multi-Platform
* Dirancang khusus untuk fenomena cicilan modern di Indonesia (Shopee PayLater, GoPay Later, Kredivo, Akulaku, Kartu Kredit).
* **Field Khusus:** Platform, Nama Barang, Total Pinjaman, Cicilan per Bulan, Tenor (Bulan), Bulan Berjalan (`monthsPaid`), dan Tanggal Jatuh Tempo.
* Otomatis mengkalkulasi beban cicilan bulanan yang harus disisihkan dari penghasilan.

---

# 16. Subscription & Recurring Financial Automation

## 1. Subscription Manager
* Memonitor tagihan berulang berbasis layanan (Netflix, Spotify, Cloud Storage, Internet Rumah, Gym).
* Menampilkan tanggal tagih bulanan (Billing Day 1–31) dan metode pembayaran yang didebit.
* Menghitung total komitmen pengeluaran tetap per bulan.

## 2. Recurring Transactions Engine
* Menjalankan mutasi transaksi otomatis terjadwal (misal: Gaji tanggal 25, Sewa Kos tanggal 1).
* Dipicu secara andal melalui cron job terjadwal (`/api/cron/recurring`) dengan otentikasi header `CRON_SECRET`.

## 3. Transaction Templates & Favorites
* Menyimpan template transaksi yang sering diulang (misal: "Bensin Mingguan Motor Rp35.000 via BCA").
* Dapat dieksekusi dalam 1 klik dari dashboard tanpa mengetik ulang.

---

# 17. Apple Shortcuts & External Integrations

Norden Finance menyediakan integrasi kelas satu dengan ekosistem perangkat bergerak tanpa harus merilis aplikasi native app store.

## Mekanisme Integrasi:
1. Setiap pengguna mendapatkan URL endpoint webhook unik yang diamankan dengan token kriptografi HMAC via header:
   ```text
   POST https://www.nordenfinance.site/api/shortcut
   Header: Authorization: Bearer {SIGNED_HMAC_TOKEN}
   Payload: { "text": "kopi kenangan 35k gopay" }
   ```
2. **Apple Shortcuts iOS:**
   * Pengguna menginstal shortcut sekali klik.
   * Shortcut dapat dipicu via:
     * **Action Button** (iPhone 15 Pro ke atas).
     * **Siri Voice Command** ("Hey Siri, catat pengeluaran").
     * **NFC Tag** (Tap stiker NFC di dompet atau meja kerja).
     * **Back Tap** (Ketuk 2x punggung iPhone).
3. **Siklus Eksekusi:** Input suara/teks dikirim ke server, diproses oleh Smart Input, dicatat ke database, dan menghasilkan balasan audio/notifikasi konfirmasi dalam waktu < 800 ms.

---

# 18. Momentum Center, Streaks & Gamification

Untuk melawan *habit drop-off*, Norden Finance menerapkan mekanisme psikologi perilaku:

## 1. Daily Transaction Streaks
* Melacak jumlah hari berturut-turut pengguna mencatat minimal satu transaksi.
* Menyimpan rekor `currentStreak` dan `longestStreak`.
* Jika pengguna melewatkan satu hari kalender, streak kembali ke 0.

## 2. Achievement Badges (Prestasi)
Sistem membuka penghargaan otomatis (`unlockedAt`) saat kriteria terpenuhi:
* 🎯 **First Step:** Mencatat transaksi pertama.
* 🔥 **Habit Starter:** Mencapai streak 7 hari berturut-turut.
* ⚡ **Financial Master:** Mencapai streak 30 hari berturut-turut.
* 💯 **Century Club:** Mencatat total 100 transaksi.
* 💰 **First Million:** Mencapai total saldo likuid Rp 1.000.000.
* 🛡️ **Safety Net:** Mengumpulkan dana darurat minimal 3 bulan pengeluaran.
* 🏆 **Goal Crusher:** Menyelesaikan salah satu Saving Goal 100%.

## 3. No-Spend Calendar
* Kalender visual interaktif yang menandai hari-hari di mana pengguna berhasil menahan diri dengan **nol pengeluaran** (Zero Expense Day).
* Memotivasi pengguna memperbanyak kotak hijau (hari hemat) dalam satu bulan kalender.

---

# 19. Reporting, Analytics & Data Export

## 1. Visual Expense Breakdown
* Diagram donat interaktif (Donut Chart Recharts) dengan rincian persentase pengeluaran per kategori.
* Grafik tren arus kas (Income vs Expense) bulanan.

## 2. PDF Monthly Report
* Pembuatan berkas PDF resmi berkualitas cetak menggunakan `jspdf` & `jspdf-autotable`.
* Berisi ringkasan eksekutif:
  * Total Pemasukan, Total Pengeluaran, Net Cashflow.
  * Tabel komprehensif pengeluaran terbesar per kategori.
  * Mutasi saldo awal dan saldo akhir per dompet.
  * Lembar rincian transaksi lengkap bulan tersebut.

## 3. Ekspor Data Terbuka
* **CSV Export:** Berkas spreadsheet kompatibel dengan Microsoft Excel dan Google Sheets.
* **JSON Export:** Data mentah terstruktur untuk backup pribadi atau analisis kustom.

---

# 20. Notification & Reminder System

## Kanal Pengiriman:
1. **In-App Notification Center:** Notifikasi lonceng di pojok kanan atas aplikasi dengan status baca/belum baca.
2. **Email Reminders (Resend API):** Pengiriman email otomatis untuk tagihan jatuh tempo dan peringatan kritis.

## Pemicu Notifikasi (Trigger Events):
* Kategori belanja melampaui batas anggaran (80% dan 100%).
* Tagihan langganan (Subscription) mendekati tanggal penagihan (H-3 dan H-1).
* Cicilan Paylater atau Hutang mendekati tanggal jatuh tempo.
* Peringatan masa percobaan (Trial Expiry Reminder) pada H-3 dan H-1 sebelum trial habis.
* Streak reminder jika menjelang malam pengguna belum mencatat transaksi sama sekali.

---

# 21. User Lifecycle, Auth & Onboarding Flow

## 1. Registrasi & Verifikasi
```text
Register (Form / Google)
       ↓
Email Verification Sent (Firebase Auth)
       ↓
User Mengklik Tautan Verifikasi (/auth/verified)
       ↓
Session Token Server Dibuat (Firebase Admin Cookie)
       ↓
Redirect ke Flow Onboarding
```

## 2. Onboarding Wizard (3-Step Guided Setup)
* **Langkah 1:** Pengenalan dan konfirmasi nama panggilan.
* **Langkah 2:** Inisialisasi dompet pertama (Pilih bank/e-wallet utama, misal: BCA).
* **Langkah 3:** Masukkan saldo awal pembuka.
* Selesai $\rightarrow$ Flag `onboardingCompleted = true` dan langsung diarahkan ke Dashboard dengan data awal yang siap digunakan.

## 3. Account Deletion (Self-Service Data Wiping)
Sesuai standar privasi data (GDPR/UU PDP Indonesia):
* Pengguna dapat menghapus akun secara mandiri di halaman Settings.
* Konfirmasi keamanan dengan mengetik kata `DELETE` dan verifikasi ulang kata sandi.
* Semua entitas transaksi, dompet, riwayat, dan data profil dihapus secara kaskade dari basis data.

---

# 22. Monetization, Plans & Payment Flow

Norden Finance mengusung model freemium/trial-to-paid yang transparan tanpa jebakan langganan tersembunyi.

## Paket Langganan

| Paket | Harga | Durasi | Fitur |
|---|---|---|---|
| **Free Trial** | Rp 0 | 14 Hari | Akses penuh seluruh fitur Pro, Smart Input, AI Scanner, & Export |
| **Pro Monthly** | Rp 19.000 | 1 Bulan | Akses tanpa batas, unlimited dompet, priority AI OCR, backup PDF |
| **Pro Yearly** | Rp 149.000 | 1 Tahun | Hemat 35%, seluruh fitur Pro bulanan + priority feature updates |

## Alur Pembayaran Manual Indonesia:
1. Pengguna memilih paket di halaman `/upgrade`.
2. Sistem menyajikan nomor rekening resmi (BCA, BNI) atau kode QRIS dinamis.
3. Pengguna melakukan transfer bank/e-wallet dan mengunggah tangkapan layar bukti transfer.
4. Berkas tersimpan aman di Firebase Storage dan record tercatat di tabel `PaymentRequest` dengan status `pending`.
5. Admin memverifikasi bukti di Admin Panel; jika sah, status diubah ke `approved` dan masa aktif `Profile` otomatis diperpanjang.

---

# 23. Admin Control Center (Norden Control Center)

Dashboard khusus untuk pemilik dan administrator platform pada rute terisolasi `/norden-control-center`.

## Kemampuan Admin:
* **Statistik Pertumbuhan:** Total pengguna terdaftar, pengguna aktif, conversion rate trial ke pro, total pendapatan (MRR/ARR).
* **Payment Verification Queue:** Daftar bukti bayar yang menunggu review lengkap dengan pratinjau gambar struk, tombol Approve (perpanjang otomatis), dan Reject (dengan alasan).
* **User Management:** Pencarian pengguna, inspeksi status paket, dan eskalasi/revokasi role admin.
* **Feedback Inbox:** Membaca pesan kritik, saran, dan rating kepuasan (1–5 bintang) dari pengguna.
* **Payment Configuration:** Mengubah nomor rekening bank penerima dan gambar QRIS langsung dari UI tanpa deploy ulang kode.

---

# 24. Database Schema & Data Models

Basis data relasional diorkestrasi menggunakan **PostgreSQL** dan **Prisma ORM 5**.

```text
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Profile     │       │     Balance     │       │    Category     │
│─────────────────│       │─────────────────│       │─────────────────│
│ userId (PK)     │       │ id (PK)         │       │ id (PK)         │
│ fullName        │       │ userId          │       │ userId          │
│ role            │       │ name            │       │ name            │
│ plan            │◄──────┤ type            │       │ type            │
│ trialEndsAt     │       │ currentBalance  │       └────────┬────────┘
│ shortcutVersion │       │ archivedAt      │                │
└─────────────────┘       └────────┬────────┘                │
                                   │                         │
                                   │  ┌──────────────────────┘
                                   ▼  ▼
                        ┌────────────────────────┐
                        │      Transaction       │
                        │────────────────────────│
                        │ id (PK)                │
                        │ userId                 │
                        │ categoryId (FK)        │
                        │ walletId (FK)          │
                        │ transferToWalletId(FK) │
                        │ type (masuk/keluar/tf) │
                        │ amount                 │
                        │ note                   │
                        │ tags (String[])        │
                        │ receiptMerchant        │
                        │ transactionDate        │
                        │ deletedAt (Soft)       │
                        └────────────────────────┘
```

## Entitas Pelengkap:
* `Budget`: Relasi 1-ke-1 antara User dan Kategori untuk limit bulanan.
* `SavingGoal`: Pencatatan target tabungan dengan deadline dan akumulasi saldo.
* `Debt`: Pencatatan hutang/piutang, tenor, suku bunga, dan status lunas.
* `Paylater`: Pencatatan pinjaman cicilan paylater platform e-commerce.
* `AppSubscription`: Pengingat tagihan bulanan berulang.
* `TransactionTemplate`: Template transaksi cepat dan favorit.
* `RecurringTransaction`: Jadwal eksekusi transaksi otomatis bulanan.
* `Streak` & `Achievement`: Data gamifikasi dan konsistensi pengguna.
* `PaymentRequest`: Log pengajuan pembayaran langganan pengguna.
* `AuditLog`: Log audit keamanan setiap mutasi kritis.

---

# 25. Security, Rate Limiting & Audit Logging

## 1. Autentikasi & Session
* Menggunakan Firebase Authentication Client untuk flow login/register.
* Menggunakan Firebase Admin SDK di server untuk mencetak **HTTP-Only, Secure, SameSite Session Cookie**.
* Mencegah eksploitasi pencurian token via Client-Side XSS.

## 2. Request Security & Origin Enforcement
* Seluruh Server Actions dan API Route memvalidasi header `Origin` dan `Host` guna menangkal serangan Cross-Site Request Forgery (CSRF).
* Endpoint shortcut publik `/api/shortcut` mewajibkan token bertanda tangan kriptografi HMAC SHA-256 yang divalidasi terhadap `Profile.shortcutTokenVersion`.

## 3. Rate Limiting Protection
* Dilengkapi algoritma sliding-window rate limiting pada level database dan in-memory (`RateLimitBucket`):
  * OCR Scan Struk: Maksimal 10 request / menit per user (mencegah pembengkakan biaya API Gemini).
  * API Shortcut: Maksimal 30 request / menit per user.
  * Auth / Reset Password: Proteksi anti brute-force.

## 4. Audit Trail
* Setiap penambahan saldo drastis, penghapusan dompet, atau perubahan data keuangan mencatat rekam jejak di tabel `AuditLog` mencakup `userId`, `action`, `entity`, dan timestamp.

---

# 26. Design System & UI Principles

Norden Finance mengusung identitas visual **Neo-Brutalism** yang khas di kancah aplikasi finansial:

```text
┌─────────────────────────────────────────────────────────────┐
│  NEO-BRUTALIST DESIGN TOKEN MATRIX                          │
├───────────────────┬─────────────────────────────────────────┤
│ Border Styling    │ Solid 3px — 4px Black border (#000000)  │
│ Shadow System     │ Hard-edge offset: 4px 4px 0px 0px #000  │
│ Radius Geometry   │ Sharp 0px (No rounded corners on cards) │
│ Palette Accents   │ High-contrast Yellow (#FFE066),         │
│                   │ Mint Green (#BBF7D0), Vibrant Cyan,     │
│                   │ Soft Lavender, Electric Coral           │
│ Typography        │ Bold grotesque, high-contrast,          │
│                   │ prominent uppercase label indicators    │
│ Micro-Interactions│ Tactile press effect: active translate  │
│                   │ (translate-x-[2px] translate-y-[2px])   │
└───────────────────┴─────────────────────────────────────────┘
```

Prinsip ini menegaskan transparansi dan kontrol: uang adalah hal yang konkret, dan UI menyajikannya tanpa ilusi gradasi halus yang menyamarkan angka.

---

# 27. Performance & Optimization Strategies

1. **Lazy Loading dengan `next/dynamic`:**
   Komponen visual berat seperti Recharts (`ExpenseChart`), modal chat AI (`QuickInputModal`), PDF viewer, dan tab sekunder dipecah menjadi chunk terpisah dengan skeleton loader.
2. **Runtime Dynamic Imports:**
   Pustaka raksasa seperti `@google/generative-ai` dan engine PDF hanya dimuat ke memori server saat endpoint terkait benar-benar dipanggil.
3. **Database Query Pruning:**
   Pemanggilan data dashboard menggunakan `select` spesifik dan paginasi ketat (limit 50 transaksi aktif) untuk meminimalkan beban memori Node.js dan latensi PostgreSQL.
4. **Optimistic UI Updates:**
   Aksi mutasi dompet dan update transaksi langsung diperbarui pada antarmuka lokal sebelum respons server selesai, menghasilkan *perceived latency* 0 ms bagi pengguna.

---

# 28. Error Handling & Resilience

* **Graceful Degradation AI:** Jika API Gemini gagal, habis kuota, atau bermasalah jaringan, sistem otomatis beralih ke Parser Heuristik Lokal tanpa membuat transaksi gagal dicatat.
* **Database Connection Timeout Safety:** Loader data dilengkapi blok `.catch()` cadangan dengan nilai default fallback agar dashboard tidak mengalami *white screen of death* saat koneksi database tersendat.
* **User-Friendly Error States:** Pesan kegagalan diterjemahkan ke dalam bahasa Indonesia yang manusiawi dan memberikan solusi instruksional.

---

# 29. Acceptance Criteria & Definition of Done

Sebuah modul atau fitur baru di Norden Finance dinyatakan **Done** hanya jika memenuhi kriteria:

```text
[UI Neo-Brutalist]
       +
[Domain Logic & Server Validation]
       +
[PostgreSQL Database Persistence via Prisma]
       +
[Optimistic UI Update / Loading State]
       +
[Zero TypeScript Compilation Warnings (`tsc --noEmit` Pass)]
       +
[Audit Log Integration (jika entitas sensitif)]
       +
[Mobile Responsive Layout Verification]
```

---

# 30. Product Roadmap (Future Phases)

## Phase 2 — Smart Automations & Sharing
* **Monthly Wrapped:** Kilas balik keuangan bulanan dalam format Instagram Story-ready yang dapat dibagikan ke media sosial.
* **Shared Wallet / Household Mode:** Kolaborasi pencatatan keuangan antara pasangan/keluarga dengan hak akses terpisah.
* **Split Bill Calculator:** Fitur hitung patungan makan/nongkrong terintegrasi langsung dengan mutasi dompet.

## Phase 3 — Intelligent Wealth Advisory
* **AI Financial Advisor Chatbot:** Asisten pintar interaktif berbasis Gemini Pro yang memberikan saran penghematan konkret berdasarkan pola pengeluaran unik pengguna.
* **Cashflow Forecasting:** Proyeksi saldo kas 30 hari ke depan berdasarkan pola recurring, tagihan paylater, dan tren belanja masa lalu.

---

# 31. Final Product Definition

Norden Finance adalah:

> **Personal Financial Operating System terlengkap, tercepat, dan paling menarik secara visual di Indonesia.**

Alur Utama Kehidupan Finansial:

```text
CAPTURE (Smart Input / Receipt Scan / Shortcut)
   ↓
ORGANIZE (Multi-Wallet & Categorization)
   ↓
EVALUATE (Health Score & Budget Adherence)
   ↓
CONTROL (Paylater, Debt & Subscriptions)
   ↓
MOTIVATE (Streaks, Badges & No-Spend Days)
   ↓
WEALTH FREEDOM (Emergency Fund & Goal Achievement)
```

Norden Finance tidak sekadar mencatat ke mana perginya uang; platform ini mengembalikan kendali navigasi finansial ke tangan pengguna.
