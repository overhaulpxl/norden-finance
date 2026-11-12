'use client';

import Link from 'next/link';
import {
  Check,
  Download,
  HelpCircle,
  Lock,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Target,
  Wallet,
  Zap,
} from 'lucide-react';
import ChatSandbox from './ChatSandbox';
import BackToTop from './BackToTop';
import LandingUX from './LandingUX';
import BrandLogo from './BrandLogo';
import LandingHeader from './LandingHeader';
import TestimonialsCarousel from './TestimonialsCarousel';
import { useLanguage } from '../lib/i18n';
import { formatCurrency } from '../lib/format';
import type { PublicTestimonial } from '../lib/landingFallbacks';

type LandingClientProps = {
  testimonials: PublicTestimonial[];
  trialDays: number;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlySavingsPercent: number;
};

export default function LandingClient({
  testimonials,
  trialDays,
  monthlyPrice,
  yearlyPrice,
  yearlySavingsPercent,
}: LandingClientProps) {
  const { lang } = useLanguage();

  return (
    <div className="landing-page min-h-screen bg-[#FAF9F5] dark:bg-[#0e0e11] text-black dark:text-neutral-100 selection:bg-black selection:text-[#FFE066] font-sans antialiased relative transition-colors">
      <LandingUX />

      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
          background-attachment: fixed;
        }
        :where(.dark) .bg-paper-dots,
        .dark .bg-paper-dots {
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1.5px, transparent 1.5px);
        }

        .reveal {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        .nav-link-custom {
          position: relative;
        }
        .nav-link-custom::after {
          content: '';
          position: absolute;
          width: 100%;
          transform: scaleX(0);
          height: 3px;
          bottom: -2px;
          left: 0;
          background-color: currentColor;
          transform-origin: bottom right;
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .nav-link-custom:hover::after {
          transform: scaleX(1);
          transform-origin: bottom left;
        }
      `}</style>

      {/* Grid Pattern Background Layer */}
      <div className="absolute inset-0 bg-paper-dots pointer-events-none opacity-80 z-0" />

      <div className="relative z-10">

        {/* Navigation Header */}
        <LandingHeader />

        {/* Hero Section */}
        <section id="home" className="pt-20 pb-16 max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center relative scroll-mt-32">

          <div className="inline-flex items-center gap-2 bg-[#FFE066] border-[2.5px] border-black text-black px-3.5 py-1 text-[11px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] mb-6 reveal">
            <Zap className="w-3.5 h-3.5 stroke-[3px]" /> Personal Finance Operating System
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-black dark:text-white max-w-5xl mx-auto leading-[1.1] mb-6 uppercase select-none reveal">
            <span className="inline-block whitespace-nowrap">
              {lang === 'en' ? 'Manage Personal Finances' : 'Kelola Keuangan Pribadi'}
            </span> <br />
            <span className="inline-block whitespace-nowrap">
              {lang === 'en' ? 'More Organized with Norden' : 'Lebih Teratur dengan Norden'}
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 max-w-5xl mx-auto leading-relaxed mb-8 uppercase tracking-wide select-none reveal lg:whitespace-nowrap">
            {lang === 'en'
              ? 'Track daily income and expenses in seconds with natural Smart Input.'
              : 'Catat pemasukan dan pengeluaran harian dalam hitungan detik dengan Smart Input natural.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-8 reveal w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center brutal-btn bg-[#FFE066] text-black border-[3px] border-black text-xs sm:text-sm px-8 py-3.5 shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-300 tracking-wider"
            >
              {lang === 'en'
                ? `Start Free ${trialDays}-Day Trial`
                : `Mulai Trial ${trialDays} Hari Gratis`}
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-center brutal-btn-light border-[3px] border-black dark:border-neutral-700 text-xs sm:text-sm px-8 py-3.5 shadow-[4px_4px_0px_0px_#000] tracking-wider"
            >
              {lang === 'en' ? 'Log In' : 'Masuk Akun'}
            </Link>
          </div>

          {/* Trust Highlights Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12 text-[11px] font-black uppercase tracking-wider text-neutral-800 dark:text-neutral-200 reveal">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
              {lang === 'en' ? '100% Ad-Free' : '100% Bebas Iklan'}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
              {lang === 'en' ? 'No Credit Card' : 'Tanpa Kartu Kredit'}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
              {lang === 'en' ? 'Deterministic Local Parser' : 'Parser Lokal Deterministik'}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700 hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3px]" />
              {lang === 'en' ? 'CSV & PDF Export' : 'Ekspor CSV & PDF'}
            </span>
          </div>

          {/* Interactive Chat Sandbox Playground */}
          <div className="w-full max-w-4xl relative mt-2 reveal">
            <div className="brutal-card bg-white dark:bg-neutral-900 border-[3px] border-black dark:border-neutral-700 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full overflow-hidden text-left aspect-[16/10] flex flex-col">

              {/* Window Topbar */}
              <div className="border-b-[3px] border-black dark:border-neutral-700 px-4 py-3 bg-[#FAF9F5] dark:bg-neutral-800 flex justify-between items-center select-none transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-black text-xs uppercase tracking-widest text-black dark:text-white">NORDEN SMART INPUT</span>
                  <span className="hidden sm:inline font-bold text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {lang === 'en' ? 'Live Interactive Demo' : 'Demo Interaktif Langsung'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#FFE066] border border-black inline-block" />
                  <span className="h-3 w-3 bg-[#bbf7d0] border border-black inline-block" />
                  <span className="h-3 w-3 bg-black dark:bg-neutral-600 border border-black inline-block" />
                </div>
              </div>

              {/* Chat Sandbox Body */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChatSandbox />
              </div>
            </div>
            <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mt-3 text-center">
              {lang === 'en'
                ? 'Try typing a transaction above to experience Norden\'s local Smart Input in real time.'
                : 'Coba ketik transaksi seperti contoh di atas untuk melihat cara kerja Smart Input lokal Norden.'}
            </p>
          </div>
        </section>

        {/* Core Pillars / Features Section */}
        <section id="features" className="py-20 bg-white dark:bg-neutral-900 border-y-[3px] border-black dark:border-neutral-700 relative scroll-mt-24 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center max-w-5xl mx-auto space-y-3 mb-16 reveal">
              <span className="inline-block bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 px-3 py-1 font-black text-[10px] uppercase tracking-widest text-black dark:text-white shadow-[1.5px_1.5px_0px_0px_#000]">
                {lang === 'en' ? 'Core Features' : 'Fitur Inti Produk'}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black dark:text-white uppercase lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'Three Core Pillars of Norden Finance'
                  : 'Tiga Fondasi Utama Aplikasi Keuangan Norden'}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed uppercase tracking-wide lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'Designed to eliminate spreadsheet complexity and centralize your financial control.'
                  : 'Dirancang khusus untuk memotong kerumitan spreadsheet dan memusatkan kendali finansial Anda.'}
              </p>
            </div>

            {/* 3 Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Pillar 1: Smart Input */}
              <div className="brutal-card p-6 sm:p-7 bg-white dark:bg-neutral-800 text-black dark:text-white border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between reveal">
                <div className="space-y-4">
                  <div className="w-12 h-12 border-[2.5px] border-black bg-[#bbf7d0] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#000]">
                    <MessageSquare className="w-6 h-6 stroke-[2.5px] text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-black dark:text-white uppercase tracking-wide whitespace-nowrap">
                    {lang === 'en' ? '1. Fast Smart Input' : '1. Smart Input Cepat'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-bold leading-relaxed">
                    {lang === 'en'
                      ? 'Log transactions just like chatting. Our deterministic local parser identifies amounts, target wallets, categories, and dates instantly without network lag.'
                      : 'Ketik transaksi seperti chat biasa. Parser lokal kami mengenali nominal angka, wallet tujuan, kategori, dan tanggal secara deterministik tanpa jeda jaringan.'}
                  </p>

                  <div className="bg-[#FAF9F5] dark:bg-neutral-900 border-[2px] border-black dark:border-neutral-700 p-3.5 space-y-2.5 text-neutral-900 dark:text-neutral-100">
                    <div className="flex items-center justify-between border-b-[1.5px] border-black dark:border-neutral-700 pb-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-black dark:text-white">
                        {lang === 'en' ? 'Popular Input Formats:' : 'Format Input Populer:'}
                      </span>
                      <span className="text-[10px] font-extrabold bg-[#bbf7d0] border border-black px-1.5 py-0.5 uppercase text-black">
                        {lang === 'en' ? 'Instant' : 'Instan'}
                      </span>
                    </div>
                    <div className="space-y-1.5 font-mono text-xs font-bold">
                      <div className="bg-white dark:bg-neutral-800 text-black dark:text-white px-2.5 py-1.5 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] flex items-center justify-between">
                        <span>kopi 25k gopay</span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans font-extrabold">Rp 25.000</span>
                      </div>
                      <div className="bg-white dark:bg-neutral-800 text-black dark:text-white px-2.5 py-1.5 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] flex items-center justify-between">
                        <span>gaji bca 5jt</span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans font-extrabold">Rp 5.000.000</span>
                      </div>
                      <div className="bg-white dark:bg-neutral-800 text-black dark:text-white px-2.5 py-1.5 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000] flex items-center justify-between">
                        <span>transfer bca ke dana 100k</span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans font-extrabold">
                          {lang === 'en' ? 'Inter-wallet' : 'Pindah Buku'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-[2px] border-black dark:border-neutral-700 mt-6 text-[11px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-black dark:text-[#FFE066] stroke-[3px]" />
                  {lang === 'en' ? 'Powered by photo receipt OCR scanning' : 'Didukung OCR pemindaian struk foto'}
                </div>
              </div>

              {/* Pillar 2: Multi-Wallet */}
              <div className="brutal-card p-6 sm:p-7 bg-white dark:bg-neutral-800 text-black dark:text-white border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between reveal">
                <div className="space-y-4">
                  <div className="w-12 h-12 border-[2.5px] border-black bg-[#FFE066] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#000]">
                    <Wallet className="w-6 h-6 stroke-[2.5px] text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-black dark:text-white uppercase tracking-wide whitespace-nowrap">
                    {lang === 'en' ? '2. Multi-Wallet & Balances' : '2. Multi-Dompet & Saldo'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-bold leading-relaxed">
                    {lang === 'en'
                      ? 'Monitor all liquid balances in one place. Independently track cash, bank accounts (BCA, BNI, Mandiri), and e-wallets (DANA, GoPay, OVO, ShopeePay).'
                      : 'Pantau seluruh saldo likuid di satu tempat. Catat dan kelola mutasi kas tunai, rekening bank (BCA, BNI, Mandiri), dan saldo dompet digital (DANA, GoPay, OVO, ShopeePay) secara mandiri.'}
                  </p>

                  <div className="bg-[#FAF9F5] dark:bg-neutral-900 border-[2px] border-black dark:border-neutral-700 p-3.5 space-y-2.5 text-neutral-900 dark:text-neutral-100">
                    <div className="flex items-center justify-between border-b-[1.5px] border-black dark:border-neutral-700 pb-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-black dark:text-white">
                        {lang === 'en' ? 'Key Capabilities:' : 'Kemampuan Utama:'}
                      </span>
                      <span className="text-[10px] font-extrabold bg-[#FFE066] border border-black px-1.5 py-0.5 uppercase text-black">
                        {lang === 'en' ? 'Realtime' : 'Realtime'}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000]">
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px] shrink-0" />
                        <span className="text-black dark:text-white font-extrabold">
                          {lang === 'en' ? 'Instant inter-wallet transfers' : 'Transfer antar dompet instan'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000]">
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px] shrink-0" />
                        <span className="text-black dark:text-white font-extrabold">
                          {lang === 'en' ? 'Archive wallets without data loss' : 'Arsipkan dompet tanpa hapus data'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000]">
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px] shrink-0" />
                        <span className="text-black dark:text-white font-extrabold">
                          {lang === 'en' ? 'Track monthly net cashflow' : 'Lacak arus kas bersih bulanan'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-[2px] border-black dark:border-neutral-700 mt-6 text-[11px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-black dark:text-[#FFE066] stroke-[3px]" />
                  {lang === 'en' ? 'Automatic balance sync on transfer' : 'Sinkronisasi saldo otomatis saat transfer'}
                </div>
              </div>

              {/* Pillar 3: Goals & Planning */}
              <div className="brutal-card p-6 sm:p-7 bg-white dark:bg-neutral-800 text-black dark:text-white border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between reveal">
                <div className="space-y-4">
                  <div className="w-12 h-12 border-[2.5px] border-black bg-[#bfdbfe] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#000]">
                    <Target className="w-6 h-6 stroke-[2.5px] text-black" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-black dark:text-white uppercase tracking-wide whitespace-nowrap">
                    {lang === 'en' ? '3. Budgets & Discipline' : '3. Anggaran & Disiplin'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-bold leading-relaxed">
                    {lang === 'en'
                      ? 'Control spending habits with category budget limits, monitor paylater installments and loans, and build a measured emergency fund.'
                      : 'Kendalikan kebiasaan belanja dengan limit anggaran per kategori, monitor cicilan paylater serta utang piutang, dan susun dana darurat terukur.'}
                  </p>

                  <div className="bg-[#FAF9F5] dark:bg-neutral-900 border-[2px] border-black dark:border-neutral-700 p-3.5 space-y-2.5 text-neutral-900 dark:text-neutral-100">
                    <div className="flex items-center justify-between border-b-[1.5px] border-black dark:border-neutral-700 pb-1.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-black dark:text-white">
                        {lang === 'en' ? 'Risk Management:' : 'Manajemen Risiko:'}
                      </span>
                      <span className="text-[10px] font-extrabold bg-[#bfdbfe] border border-black px-1.5 py-0.5 uppercase text-black">
                        {lang === 'en' ? 'Controlled' : 'Terkontrol'}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000]">
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px] shrink-0" />
                        <span className="text-black dark:text-white font-extrabold">
                          {lang === 'en' ? 'Budget threshold alerts at 75% & 90%' : 'Peringatan batas budget 75% & 90%'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000]">
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px] shrink-0" />
                        <span className="text-black dark:text-white font-extrabold">
                          {lang === 'en' ? 'Savings goals with time estimates' : 'Target tabungan dengan estimasi waktu'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-neutral-800 p-2 border-[1.5px] border-black dark:border-neutral-700 shadow-[2px_2px_0px_0px_#000]">
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px] shrink-0" />
                        <span className="text-black dark:text-white font-extrabold">
                          {lang === 'en' ? 'Emergency fund calculator 3-12 months' : 'Kalkulator dana darurat 3-12 bulan'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-[2px] border-black dark:border-neutral-700 mt-6 text-[11px] font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-black dark:text-[#FFE066] stroke-[3px]" />
                  {lang === 'en' ? 'In-app and email bill reminders' : 'Pengingat tagihan in-app dan email'}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* User Reviews & Testimonials Section */}
        <section id="testimonials" className="py-20 bg-[#FAF9F5] dark:bg-[#0e0e11] border-b-[3px] border-black dark:border-neutral-700 relative scroll-mt-24 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center max-w-5xl mx-auto space-y-3 mb-14 reveal">
              <span className="inline-block bg-[#FFE066] border-[2px] border-black text-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000]">
                {lang === 'en' ? 'User Reviews' : 'Ulasan Pengguna'}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black dark:text-white uppercase lg:whitespace-nowrap">
                {lang === 'en' ? 'What Norden Users Are Saying' : 'Apa Kata Pengguna Norden?'}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed uppercase tracking-wide lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'Real stories from active users who switched to independent personal finance management.'
                  : 'Cerita nyata dari pengguna aktif yang beralih ke pencatatan keuangan pribadi mandiri.'}
              </p>
            </div>

            <div className="reveal">
              <TestimonialsCarousel testimonials={testimonials} />
            </div>

          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="py-20 bg-[#FAF9F5] dark:bg-[#0e0e11] relative scroll-mt-24 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">

              <div className="reveal space-y-6">
                <span className="inline-block bg-[#FFE066] border-[2px] border-black text-black px-3.5 py-1 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                  {lang === 'en' ? 'Product Philosophy' : 'Filosofi Produk'}
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-[28px] xl:text-3xl font-black tracking-tight text-black dark:text-white uppercase leading-tight lg:whitespace-nowrap">
                  {lang === 'en' ? 'Why Choose Norden Finance?' : 'Kenapa Memilih Norden Finance?'}
                </h2>
                <div className="space-y-4 text-xs sm:text-sm font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                  <p>
                    {lang === 'en'
                      ? 'Many notice their account balances shrinking, but rarely know exactly where money goes each month.'
                      : 'Banyak orang menyadari saldo rekeningnya berkurang, namun sering kali tidak tahu persis ke mana uang itu pergi setiap bulannya.'}
                  </p>
                  <p>
                    {lang === 'en' ? (
                      <>
                        The name <strong>Norden</strong> is inspired by the North, the primary compass point explorers use to find direction. In personal finance, North symbolizes clarity, control, and a steady direction for financial growth.
                      </>
                    ) : (
                      <>
                        Nama <strong>Norden</strong> terinspirasi dari arah utara, kompas utama yang digunakan penjelajah untuk menemukan arah jalan. Dalam pengelolaan uang pribadi, utara melambangkan kejelasan, kendali, dan arah pertumbuhan finansial yang terukur.
                      </>
                    )}
                  </p>
                  <p>
                    {lang === 'en'
                      ? 'Norden is not a banking app holding your funds. Norden is an independent tracking engine placing complete control firmly in your hands.'
                      : 'Norden tidak dirancang sebagai aplikasi perbankan yang menahan dana Anda. Norden adalah alat pencatatan mandiri yang menempatkan kendali penuh di tangan Anda.'}
                  </p>
                </div>

                <div className="bg-black dark:bg-neutral-900 text-[#FFE066] border-[2.5px] border-black dark:border-neutral-700 px-5 py-3.5 shadow-[4px_4px_0px_0px_#000] font-black uppercase tracking-widest text-xs inline-block">
                  Track your money. Find your direction.
                </div>
              </div>

              {/* Logo Meaning Box */}
              <div className="reveal">
                <div className="brutal-card p-6 sm:p-8 bg-white dark:bg-neutral-850 border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000] space-y-5">
                  <div className="bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 p-8 flex items-center justify-center">
                    <BrandLogo variant="icon" theme="auto" className="w-32 h-auto" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white mb-3">
                      {lang === 'en' ? 'Meaning Behind the Norden Logo' : 'Makna Lambang Norden'}
                    </h3>
                    <div className="space-y-2 text-xs font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {lang === 'en' ? (
                        <>
                          <p>• <strong>Letter N</strong> represents Norden identity and the true north compass direction.</p>
                          <p>• <strong>Ascending Arrow</strong> symbolizes progress, asset accumulation, and growth.</p>
                          <p>• <strong>Yellow &amp; Black Lines</strong> deliver sharp contrast, rock-solid stability, and high readability.</p>
                        </>
                      ) : (
                        <>
                          <p>• <strong>Huruf N</strong> mewakili identitas Norden dan arah utara.</p>
                          <p>• <strong>Panah Menanjak</strong> melambangkan progres, akumulasi aset, dan arah pertumbuhan.</p>
                          <p>• <strong>Warna Kuning &amp; Garis Hitam</strong> memberi kontras tajam, stabilitas, dan keterbacaan tinggi.</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Trust, Security & Transparency Section */}
        <section className="py-20 bg-white dark:bg-neutral-900 border-t-[3px] border-black dark:border-neutral-700 relative transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center max-w-5xl mx-auto space-y-3 mb-16 reveal">
              <span className="inline-block bg-[#bbf7d0] border-[2px] border-black text-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000]">
                {lang === 'en' ? 'Transparency & Security' : 'Transparansi & Keamanan'}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black dark:text-white uppercase lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'Your Financial Privacy and Security'
                  : 'Privasi dan Keamanan Data Finansial Anda'}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed uppercase tracking-wide lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'We firmly believe your financial data belongs entirely to you.'
                  : 'Kami percaya data keuangan Anda adalah milik Anda sepenuhnya.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2.5px] border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <ShieldCheck className="w-7 h-7 text-black dark:text-[#FFE066] stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                  {lang === 'en' ? 'Identity Isolation' : 'Isolasi Identitas Akun'}
                </h4>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {lang === 'en'
                    ? 'Every transaction and balance is isolated by Firebase UID. No other user can access your financial ledger.'
                    : 'Setiap transaksi dan saldo diisolasi berdasarkan Firebase UID pengguna. Pengguna lain tidak memiliki akses ke database catatan Anda.'}
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2.5px] border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <Lock className="w-7 h-7 text-black dark:text-[#FFE066] stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                  {lang === 'en' ? 'Secure Auth' : 'Otentikasi Aman'}
                </h4>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {lang === 'en'
                    ? 'Logins are verified directly by Google Firebase Auth. Server sessions are guarded by httpOnly cookies with admin token verification.'
                    : 'Login diverifikasi langsung oleh Google Firebase Auth. Sesi server dilindungi cookie httpOnly dengan verifikasi token admin.'}
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2.5px] border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <Download className="w-7 h-7 text-black dark:text-[#FFE066] stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                  {lang === 'en' ? 'Full Portability' : 'Portabilitas Penuh'}
                </h4>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {lang === 'en'
                    ? 'Download all transaction records anytime in CSV, JSON, or formatted monthly PDF reports for your private archives.'
                    : 'Unduh seluruh catatan transaksi kapan saja dalam format CSV, JSON, atau laporan PDF bulanan untuk arsip pribadi Anda.'}
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2.5px] border-black dark:border-neutral-700 shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <RotateCcw className="w-7 h-7 text-black dark:text-[#FFE066] stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black dark:text-white">
                  {lang === 'en' ? 'Flexible Reset' : 'Reset Data Fleksibel'}
                </h4>
                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {lang === 'en'
                    ? 'Want a clean slate? Safely reset your transactions and wallets anytime without deleting your account or subscription.'
                    : 'Ingin memulai kembali dari nol? Anda dapat mereset seluruh transaksi dan dompet tanpa menghapus akun atau membatalkan langganan.'}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-[#FAF9F5] dark:bg-[#0e0e11] border-t-[3px] border-black dark:border-neutral-700 relative scroll-mt-24 transition-colors">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center max-w-5xl mx-auto space-y-3 mb-16 reveal">
              <span className="inline-block bg-[#FFE066] border-[2px] border-black text-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000]">
                {lang === 'en' ? 'Pricing Plans' : 'Paket Langganan'}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-black dark:text-white uppercase lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'Norden Finance Subscription Plans'
                  : 'Pilihan Paket Langganan Norden Finance'}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed uppercase tracking-wide lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'Start with a 14-day free trial. Continue with Pro or stay on Free Basic.'
                  : 'Mulai dengan trial gratis 14 hari. Lanjutkan ke Pro atau tetap gunakan Free Basic.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

              {/* Trial Plan Card */}
              <div className="brutal-card bg-white dark:bg-neutral-850 p-7 flex flex-col justify-between border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000] reveal">
                <div className="space-y-4">
                  <div className="border-b-2 border-black dark:border-neutral-700 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {lang === 'en' ? 'Full Trial' : 'Uji Coba Penuh'}
                    </span>
                    <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-wider mt-0.5">
                      {lang === 'en' ? `${trialDays}-Day Trial` : `Trial ${trialDays} Hari`}
                    </h3>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-black dark:text-white tracking-tight">Rp 0</div>
                    <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mt-3 min-h-[34px] flex items-center leading-normal">
                      {lang === 'en'
                        ? `Full access for ${trialDays} days after onboarding`
                        : `Akses penuh selama ${trialDays} hari setelah onboarding`}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 pt-3 border-t-2 border-neutral-100 dark:border-neutral-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Unlimited transaction records' : 'Unlimited pencatatan transaksi'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Multi-wallet (Bank, E-Wallet, Cash)' : 'Multi-wallet (Bank, E-Wallet, Cash)'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Smart Input natural language parser' : 'Smart Input natural language parser'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Receipt OCR scanning' : 'Pemindaian struk foto (Receipt OCR)'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'CSV, JSON & PDF data export' : 'Ekspor data CSV, JSON & PDF'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Recurring transaction automation' : 'Otomatisasi transaksi berulang'}
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 block text-center brutal-btn-light border-[2.5px] border-black dark:border-neutral-700 text-xs font-black uppercase tracking-wider py-3 shadow-[3px_3px_0px_0px_#000]"
                >
                  {lang === 'en' ? 'Register & Start Trial' : 'Daftar & Mulai Trial'}
                </Link>
              </div>

              {/* Pro Monthly Card */}
              <div className="brutal-card bg-white dark:bg-neutral-850 p-7 flex flex-col justify-between border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000] reveal">
                <div className="space-y-4">
                  <div className="border-b-2 border-black dark:border-neutral-700 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {lang === 'en' ? 'Flexible Monthly' : 'Fleksibel Bulanan'}
                    </span>
                    <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-wider mt-0.5">
                      {lang === 'en' ? 'Pro Monthly' : 'Pro Bulanan'}
                    </h3>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-black dark:text-white tracking-tight">
                      {formatCurrency(monthlyPrice)}
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                        {lang === 'en' ? ' / month' : ' / bulan'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mt-3 min-h-[34px] flex items-center leading-normal">
                      {lang === 'en'
                        ? '30-day renewal via manual transfer'
                        : 'Perpanjangan per 30 hari via transfer manual'}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 pt-3 border-t-2 border-neutral-100 dark:border-neutral-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'All Trial features with no limits' : 'Seluruh fitur paket Trial tanpa batas'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'In-app & email bill reminders' : 'Pengingat tagihan in-app & email'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Unlimited receipt OCR scanning' : 'Pemindaian struk berulang tanpa kuota'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Priority payment verification' : 'Prioritas verifikasi pembayaran'}
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=monthly"
                  className="mt-8 block text-center brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider py-3 shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300"
                >
                  {lang === 'en' ? 'Choose Monthly' : 'Pilih Bulanan'}
                </Link>
              </div>

              {/* Pro Yearly Card */}
              <div className="brutal-card bg-white dark:bg-neutral-850 p-7 flex flex-col justify-between border-[3px] border-black dark:border-neutral-700 shadow-[6px_6px_0px_0px_#000] relative reveal">
                {yearlySavingsPercent > 0 && (
                  <div className="absolute -top-4 right-5 bg-[#bbf7d0] text-black border-[2px] border-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                    {lang === 'en' ? `Save ${yearlySavingsPercent}%` : `Hemat ${yearlySavingsPercent}%`}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="border-b-2 border-black dark:border-neutral-700 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      {lang === 'en' ? 'Best Value' : 'Paling Hemat'}
                    </span>
                    <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-wider mt-0.5">
                      {lang === 'en' ? 'Pro Yearly' : 'Pro Tahunan'}
                    </h3>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-black dark:text-white tracking-tight">
                      {formatCurrency(yearlyPrice)}
                      <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                        {lang === 'en' ? ' / year' : ' / tahun'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide mt-3 min-h-[34px] flex items-center leading-normal">
                      {lang === 'en'
                        ? `Equivalent to ${formatCurrency(Math.round(yearlyPrice / 12))} / month`
                        : `Setara ${formatCurrency(Math.round(yearlyPrice / 12))} per bulan`}
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs font-bold text-neutral-700 dark:text-neutral-300 pt-3 border-t-2 border-neutral-100 dark:border-neutral-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'All Pro features for 365 days' : 'Seluruh fitur Pro selama 365 hari'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Significant savings vs monthly plan' : 'Hemat biaya dibandingkan paket bulanan'}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 stroke-[3px]" />
                      {lang === 'en' ? 'Priority access to upcoming features' : 'Akses fitur baru yang akan datang'}
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=yearly"
                  className="mt-8 block text-center brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider py-3 shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300"
                >
                  {lang === 'en' ? 'Choose Yearly' : 'Pilih Tahunan'}
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-white dark:bg-neutral-900 border-t-[3px] border-black dark:border-neutral-700 relative scroll-mt-24 transition-colors">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">

            <div className="text-center space-y-3 mb-14 reveal">
              <span className="inline-block bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 px-3 py-1 font-black text-[10px] uppercase tracking-widest text-black dark:text-white shadow-[1.5px_1.5px_0px_0px_#000]">
                FAQ
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-[32px] xl:text-4xl font-black tracking-tight text-black dark:text-white uppercase lg:whitespace-nowrap">
                {lang === 'en'
                  ? 'Frequently Asked Questions About Norden'
                  : 'Pertanyaan yang Sering Diajukan Seputar Norden'}
              </h2>
            </div>

            <div className="space-y-4">

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" />
                  {lang === 'en' ? 'Do I need a credit card to sign up?' : 'Apakah saya perlu kartu kredit untuk mendaftar?'}
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed pl-6">
                  {lang === 'en'
                    ? 'No. You can immediately register with your Google account or email and enjoy 14 days of full feature access without entering any credit card information.'
                    : 'Tidak. Anda dapat langsung mendaftar dengan akun Google atau email dan menikmati akses fitur penuh selama 14 hari tanpa memasukkan informasi kartu kredit sama sekali.'}
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" />
                  {lang === 'en' ? 'What happens after the 14-day trial ends?' : 'Apa yang terjadi setelah masa trial 14 hari selesai?'}
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed pl-6">
                  {lang === 'en'
                    ? 'Your account automatically transitions to the Free Basic plan. All your transaction history, wallet balances, and settings remain safe. You can continue logging manual transactions and exporting data anytime.'
                    : 'Akun Anda secara otomatis beralih ke paket Free Basic. Seluruh riwayat transaksi, mutasi saldo, dan dompet Anda tetap aman tersimpan. Anda tetap dapat mencatat transaksi manual dan mengekspor data Anda kapan saja.'}
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" />
                  {lang === 'en' ? 'How can I pay to upgrade to Pro?' : 'Bagaimana metode pembayaran jika ingin upgrade ke Pro?'}
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed pl-6">
                  {lang === 'en'
                    ? 'We support local bank transfers (BCA, BNI) and QRIS. Simply upload your transfer receipt on the upgrade page, and temporary Pro access is granted immediately while awaiting Admin verification.'
                    : 'Kami mendukung transfer bank lokal (BCA, BNI) dan QRIS. Anda cukup mengunggah bukti transfer pada halaman upgrade, dan akses Pro sementara akan langsung aktif selagi menunggu verifikasi Admin.'}
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" />
                  {lang === 'en' ? 'Can I export my financial data?' : 'Bisakah saya mengekspor data keuangan saya?'}
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed pl-6">
                  {lang === 'en'
                    ? 'Yes. Norden provides one-click exports in CSV, JSON, and neatly formatted monthly PDF reports for your records.'
                    : 'Ya. Norden menyediakan fitur ekspor satu klik dalam format file CSV, JSON, dan dokumen laporan bulanan PDF yang rapi dan terstruktur.'}
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] dark:bg-neutral-800 border-[2px] border-black dark:border-neutral-700 shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" />
                  {lang === 'en' ? 'What if I want to clear all data and start fresh?' : 'Bagaimana jika saya ingin membersihkan catatan transaksi dan mulai ulang?'}
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 leading-relaxed pl-6">
                  {lang === 'en'
                    ? 'You can use the Reset Financial Data feature in the Settings menu. It safely cleans transaction and wallet history without deleting your login account or subscription period.'
                    : 'Anda dapat menggunakan fitur Reset Data Keuangan di menu Pengaturan. Fitur ini membersihkan riwayat transaksi dan dompet secara aman tanpa menghapus akun login Anda atau masa aktif langganan Anda.'}
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#FAF9F5] dark:bg-[#0e0e11] border-t-[3px] border-black dark:border-neutral-700 pt-16 pb-12 px-4 sm:px-6 select-none transition-colors">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left font-bold text-xs uppercase tracking-wide">

            {/* Col 1: Brand & Bio */}
            <div className="space-y-3">
              <BrandLogo variant="horizontal" theme="auto" className="h-9 w-auto" />
              <p className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 leading-relaxed lowercase first-letter:uppercase">
                {lang === 'en'
                  ? 'Personal finance operating system to record, track, and direct your personal finances with clarity.'
                  : 'Personal finance operating system untuk mencatat, melacak, dan mengarahkan keuangan pribadi Anda secara rapi.'}
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h5 className="font-black text-black dark:text-white mb-3">
                {lang === 'en' ? 'Navigation' : 'Navigasi'}
              </h5>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><a href="#home" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Home' : 'Beranda'}</a></li>
                <li><a href="#features" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Features' : 'Fitur Utama'}</a></li>
                <li><a href="#testimonials" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'User Reviews' : 'Ulasan Pengguna'}</a></li>
                <li><a href="#philosophy" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Philosophy' : 'Filosofi'}</a></li>
                <li><a href="#pricing" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Pricing' : 'Paket Harga'}</a></li>
                <li><a href="#faq" className="hover:text-black dark:hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Col 3: Legal & Akun */}
            <div>
              <h5 className="font-black text-black dark:text-white mb-3">
                {lang === 'en' ? 'Legal & Account' : 'Legal & Akun'}
              </h5>
              <ul className="space-y-2 text-neutral-600 dark:text-neutral-400">
                <li><Link href="/legal/terms" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Terms of Service' : 'Syarat & Ketentuan'}</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi'}</Link></li>
                <li><Link href="/login" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Log In' : 'Masuk Akun'}</Link></li>
                <li><Link href="/register" className="hover:text-black dark:hover:text-white transition-colors">{lang === 'en' ? 'Register' : 'Daftar Akun Baru'}</Link></li>
              </ul>
            </div>

            {/* Col 4: Kontak Resmi */}
            <div>
              <h5 className="font-black text-black dark:text-white mb-3">
                {lang === 'en' ? 'Official Contact' : 'Kontak Resmi'}
              </h5>
              <ul className="space-y-2.5 text-neutral-600 dark:text-neutral-400">
                <li>
                  <a
                    href="https://wa.me/6287882924651?text=Halo%20Norden%20Finance,%20saya%20tertarik%20untuk%20bertanya%20lebih%20lanjut%20mengenai%20layanan%20Norden."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black dark:hover:text-white flex items-center gap-2 group normal-case font-bold transition-colors"
                  >
                    <span className="font-black">WhatsApp:</span>
                    <span className="group-hover:underline">+62 878-8292-4651</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/norden.finance"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black dark:hover:text-white flex items-center gap-2 group normal-case font-bold transition-colors"
                  >
                    <span className="font-black">Instagram:</span>
                    <span className="group-hover:underline">@norden.finance</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="max-w-6xl mx-auto border-t-[2px] border-black dark:border-neutral-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-bold text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
            <p>Norden Finance • Smart Financial Engine</p>
            {/* Note: antislop R-02 em dash override requested by user to match GitHub repository README */}
            <p className="normal-case sm:uppercase">
              Copyright &copy; 2026 Norden Finance &mdash;{' '}
              <a
                href="https://github.com/overhaulpxl"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-black dark:hover:text-white transition-colors"
              >
                @overhaulpxl
              </a>
              . All rights reserved.
            </p>
          </div>
        </footer>

        {/* Back to top button */}
        <BackToTop />

      </div>
    </div>
  );
}
