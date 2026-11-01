import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Check,
  MessageSquare,
  Wallet,
  Target,
  ShieldCheck,
  Download,
  RotateCcw,
  HelpCircle,
  Zap,
  Lock
} from 'lucide-react';
import ChatSandbox from '../components/ChatSandbox';
import BackToTop from '../components/BackToTop';
import LandingUX from '../components/LandingUX';
import BrandLogo from '../components/BrandLogo';
import LandingHeader from '../components/LandingHeader';
import JsonLd from '../components/JsonLd';
import {
  LANDING_MONTHLY_PRICE,
  LANDING_TRIAL_DAYS,
  LANDING_YEARLY_PRICE,
} from '../lib/landingFallbacks';
import { formatCurrency } from '../lib/format';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: {
    absolute: 'Norden Finance — Aplikasi Keuangan Pribadi',
  },
  description: 'Kelola keuangan pribadi lebih teratur dengan Norden Finance. Catat pemasukan dan pengeluaran, atur anggaran, pantau tabungan, dan kelola keuangan harian dalam satu aplikasi.',
  alternates: {
    canonical: '/',
  },
};

export default function LandingPage() {
  const trialDays = LANDING_TRIAL_DAYS;
  const monthlyPrice = LANDING_MONTHLY_PRICE;
  const yearlyPrice = LANDING_YEARLY_PRICE;
  const yearlySavingsPercent = Math.max(0, Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100));

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black selection:bg-black selection:text-[#FFE066] font-sans antialiased relative">
      <JsonLd />
      <LandingUX />

      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
          background-attachment: fixed;
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
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
          background-color: #000;
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

          <div className="inline-flex items-center gap-2 bg-[#FFE066] border-[2.5px] border-black px-3.5 py-1 text-[11px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] mb-6 reveal">
            <Zap className="w-3.5 h-3.5 stroke-[3px]" /> Personal Finance Operating System
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-black max-w-4xl leading-[1.05] mb-6 uppercase select-none reveal">
            Kelola Keuangan Pribadi <br />
            Lebih Teratur dengan Norden
          </h1>

          <p className="text-xs sm:text-sm font-bold text-neutral-600 max-w-2xl leading-relaxed mb-8 uppercase tracking-wide select-none reveal">
            Catat pemasukan dan pengeluaran harian dalam hitungan detik dengan Smart Input natural. <br className="hidden sm:inline" />
            Pantau seluruh rekening bank, e-wallet, pos anggaran, dan target tabungan dalam satu sistem terstruktur.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-14 reveal w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center brutal-btn bg-[#FFE066] text-black border-[3px] border-black text-xs sm:text-sm px-8 py-3.5 shadow-[4px_4px_0px_0px_#000] hover:bg-yellow-300 tracking-wider"
            >
              Mulai Trial {trialDays} Hari Gratis
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-center brutal-btn-light border-[3px] border-black text-xs sm:text-sm px-8 py-3.5 shadow-[4px_4px_0px_0px_#000] tracking-wider"
            >
              Masuk Akun
            </Link>
          </div>

          {/* Interactive Chat Sandbox Playground */}
          <div className="w-full max-w-4xl relative mt-2 reveal">
            <div className="brutal-card bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full overflow-hidden text-left aspect-[16/10] flex flex-col">

              {/* Window Topbar */}
              <div className="border-b-[3px] border-black px-4 py-3 bg-[#FAF9F5] flex justify-between items-center select-none">
                <div className="flex items-center gap-4">
                  <span className="font-black text-xs uppercase tracking-widest text-black">NORDEN SMART INPUT</span>
                  <span className="hidden sm:inline font-bold text-[10px] text-neutral-500 uppercase tracking-wider">Demo Interaktif Langsung</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-[#FFE066] border border-black inline-block" />
                  <span className="h-3 w-3 bg-[#bbf7d0] border border-black inline-block" />
                  <span className="h-3 w-3 bg-black border border-black inline-block" />
                </div>
              </div>

              {/* Chat Sandbox Body */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ChatSandbox />
              </div>
            </div>
            <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mt-3 text-center">
              Coba ketik transaksi seperti contoh di atas untuk melihat cara kerja Smart Input lokal Norden.
            </p>
          </div>
        </section>

        {/* Core Pillars / Features Section */}
        <section id="features" className="py-20 bg-white border-y-[3px] border-black relative scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 reveal">
              <span className="inline-block bg-[#FAF9F5] border-[2px] border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000]">
                Fitur Inti Produk
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase">
                Tiga Fondasi Utama Aplikasi Keuangan Norden
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 leading-relaxed uppercase tracking-wide">
                Dirancang khusus untuk memotong kerumitan spreadsheet dan memusatkan kendali finansial Anda.
              </p>
            </div>

            {/* 3 Pillar Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Pillar 1: Smart Input */}
              <div className="brutal-card p-6 sm:p-7 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between reveal">
                <div className="space-y-4">
                  <div className="w-12 h-12 border-[2.5px] border-black bg-[#bbf7d0] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#000]">
                    <MessageSquare className="w-6 h-6 stroke-[2.5px] text-black" />
                  </div>
                  <h3 className="text-xl font-black text-black uppercase tracking-wide">
                    1. Smart Input Cepat
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 font-bold leading-relaxed">
                    Ketik transaksi seperti chat biasa. Parser lokal kami mengenali nominal angka, wallet tujuan, kategori, dan tanggal secara deterministik tanpa jeda jaringan.
                  </p>

                  <div className="bg-[#FAF9F5] border-[2px] border-black p-3 space-y-2 text-xs font-bold">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-black pb-1">
                      Format Input Populer:
                    </p>
                    <p className="font-mono text-[11px] bg-white p-1 border border-black">kopi 25k gopay</p>
                    <p className="font-mono text-[11px] bg-white p-1 border border-black">gaji bca 5jt</p>
                    <p className="font-mono text-[11px] bg-white p-1 border border-black">transfer bca ke dana 100k</p>
                  </div>
                </div>

                <div className="pt-4 border-t-[2px] border-black mt-6 text-[11px] font-black uppercase tracking-wider text-neutral-700">
                  Didukung OCR pemindaian struk foto
                </div>
              </div>

              {/* Pillar 2: Multi-Wallet */}
              <div className="brutal-card p-6 sm:p-7 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between reveal">
                <div className="space-y-4">
                  <div className="w-12 h-12 border-[2.5px] border-black bg-[#FFE066] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#000]">
                    <Wallet className="w-6 h-6 stroke-[2.5px] text-black" />
                  </div>
                  <h3 className="text-xl font-black text-black uppercase tracking-wide">
                    2. Multi-Dompet & Saldo
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 font-bold leading-relaxed">
                    Pantau seluruh saldo likuid di satu tempat. Catat dan kelola mutasi kas tunai, rekening bank (BCA, BNI, Mandiri), dan saldo dompet digital (DANA, GoPay, OVO, ShopeePay) secara mandiri.
                  </p>

                  <div className="bg-[#FAF9F5] border-[2px] border-black p-3 space-y-2 text-xs font-bold">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-black pb-1">
                      Kemampuan Utama:
                    </p>
                    <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-800 stroke-[3px]" /> Transfer antar dompet instan</p>
                    <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-800 stroke-[3px]" /> Arsipkan dompet tanpa hapus data</p>
                    <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-800 stroke-[3px]" /> Lacak arus kas bersih bulanan</p>
                  </div>
                </div>

                <div className="pt-4 border-t-[2px] border-black mt-6 text-[11px] font-black uppercase tracking-wider text-neutral-700">
                  Sinkronisasi saldo otomatis saat transfer
                </div>
              </div>

              {/* Pillar 3: Goals & Planning */}
              <div className="brutal-card p-6 sm:p-7 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between reveal">
                <div className="space-y-4">
                  <div className="w-12 h-12 border-[2.5px] border-black bg-[#bfdbfe] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_#000]">
                    <Target className="w-6 h-6 stroke-[2.5px] text-black" />
                  </div>
                  <h3 className="text-xl font-black text-black uppercase tracking-wide">
                    3. Anggaran & Disiplin
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 font-bold leading-relaxed">
                    Kendalikan kebiasaan belanja dengan limit anggaran per kategori, monitor cicilan paylater serta utang piutang, dan susun dana darurat terukur.
                  </p>

                  <div className="bg-[#FAF9F5] border-[2px] border-black p-3 space-y-2 text-xs font-bold">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 border-b border-black pb-1">
                      Manajemen Risiko:
                    </p>
                    <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-800 stroke-[3px]" /> Peringatan batas budget 75% & 90%</p>
                    <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-800 stroke-[3px]" /> Target tabungan dengan estimasi waktu</p>
                    <p className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-800 stroke-[3px]" /> Kalkulator dana darurat 3-12 bulan</p>
                  </div>
                </div>

                <div className="pt-4 border-t-[2px] border-black mt-6 text-[11px] font-black uppercase tracking-wider text-neutral-700">
                  Pengingat tagihan in-app dan email
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="py-20 bg-[#FAF9F5] relative scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-14 items-center">

              <div className="reveal space-y-6">
                <span className="inline-block bg-[#FFE066] border-[2px] border-black px-3.5 py-1 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                  Filosofi Produk
                </span>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase leading-[1.05]">
                  Kenapa Memilih Norden Finance?
                </h2>
                <div className="space-y-4 text-xs sm:text-sm font-bold leading-relaxed text-neutral-700">
                  <p>
                    Banyak orang menyadari saldo rekeningnya berkurang, namun sering kali tidak tahu persis ke mana uang itu pergi setiap bulannya.
                  </p>
                  <p>
                    Nama <strong>Norden</strong> terinspirasi dari arah utara, kompas utama yang digunakan penjelajah untuk menemukan arah jalan. Dalam pengelolaan uang pribadi, utara melambangkan kejelasan, kendali, dan arah pertumbuhan finansial yang terukur.
                  </p>
                  <p>
                    Norden tidak dirancang sebagai aplikasi perbankan yang menahan dana Anda. Norden adalah alat pencatatan mandiri yang menempatkan kendali penuh di tangan Anda.
                  </p>
                </div>

                <div className="bg-black text-[#FFE066] border-[2.5px] border-black px-5 py-3.5 shadow-[4px_4px_0px_0px_#000] font-black uppercase tracking-widest text-xs inline-block">
                  Track your money. Find your direction.
                </div>
              </div>

              {/* Logo Meaning Box */}
              <div className="reveal">
                <div className="brutal-card p-6 sm:p-8 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000] space-y-5">
                  <div className="bg-[#FAF9F5] border-[2px] border-black p-8 flex items-center justify-center">
                    <BrandLogo variant="icon" className="w-32 h-auto" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-wider text-black mb-3">Makna Lambang Norden</h3>
                    <div className="space-y-2 text-xs font-bold leading-relaxed text-neutral-700">
                      <p>• <strong>Huruf N</strong> mewakili identitas Norden dan arah utara.</p>
                      <p>• <strong>Panah Menanjak</strong> melambangkan progres, akumulasi aset, dan arah pertumbuhan.</p>
                      <p>• <strong>Warna Kuning & Garis Hitam</strong> memberi kontras tajam, stabilitas, dan keterbacaan tinggi.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Trust, Security & Transparency Section */}
        <section className="py-20 bg-white border-t-[3px] border-black relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 reveal">
              <span className="inline-block bg-[#bbf7d0] border-[2px] border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000]">
                Transparansi & Keamanan
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase">
                Privasi dan Keamanan Data Finansial Anda
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 leading-relaxed uppercase tracking-wide">
                Kami percaya data keuangan Anda adalah milik Anda sepenuhnya.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <ShieldCheck className="w-7 h-7 text-black stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black">Isolasi Identitas Akun</h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Setiap transaksi dan saldo diisolasi berdasarkan Firebase UID pengguna. Pengguna lain tidak memiliki akses ke database catatan Anda.
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <Lock className="w-7 h-7 text-black stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black">Otentikasi Aman</h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Login diverifikasi langsung oleh Google Firebase Auth. Sesi server dilindungi cookie httpOnly dengan verifikasi token admin.
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <Download className="w-7 h-7 text-black stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black">Portabilitas Penuh</h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Unduh seluruh catatan transaksi kapan saja dalam format CSV, JSON, atau laporan PDF bulanan untuk arsip pribadi Anda.
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2.5px] border-black shadow-[4px_4px_0px_0px_#000] space-y-3 reveal">
                <RotateCcw className="w-7 h-7 text-black stroke-[2.5px]" />
                <h4 className="font-black text-sm uppercase tracking-wider text-black">Reset Data Fleksibel</h4>
                <p className="text-xs font-bold text-neutral-600 leading-relaxed">
                  Ingin memulai kembali dari nol? Anda dapat mereset seluruh transaksi dan dompet tanpa menghapus akun atau membatalkan langganan.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-[#FAF9F5] border-t-[3px] border-black relative scroll-mt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center max-w-2xl mx-auto space-y-3 mb-16 reveal">
              <span className="inline-block bg-[#FFE066] border-[2px] border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000]">
                Paket Langganan
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black uppercase">
                Pilihan Paket Langganan Norden Finance
              </h2>
              <p className="text-xs sm:text-sm font-bold text-neutral-600 leading-relaxed uppercase tracking-wide">
                Mulai dengan trial gratis 14 hari. Lanjutkan ke Pro atau tetap gunakan Free Basic.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

              {/* Trial Plan Card */}
              <div className="brutal-card bg-white p-7 flex flex-col justify-between border-[3px] border-black shadow-[6px_6px_0px_0px_#000] reveal">
                <div className="space-y-4">
                  <div className="border-b-2 border-black pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Uji Coba Penuh</span>
                    <h3 className="text-xl font-black text-black uppercase tracking-wider mt-0.5">Trial 14 Hari</h3>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-black tracking-tight">Rp 0</div>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide mt-1">
                      Akses penuh selama {trialDays} hari setelah onboarding
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs font-bold text-neutral-700 pt-3 border-t-2 border-neutral-100">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Unlimited pencatatan transaksi</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Multi-wallet (Bank, E-Wallet, Cash)</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Smart Input natural language parser</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Pemindaian struk foto (Receipt OCR)</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Ekspor data CSV, JSON & PDF</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Otomatisasi transaksi berulang</li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-8 block text-center brutal-btn-light border-[2.5px] border-black text-xs font-black uppercase tracking-wider py-3 shadow-[3px_3px_0px_0px_#000]"
                >
                  Daftar & Mulai Trial
                </Link>
              </div>

              {/* Pro Monthly Card */}
              <div className="brutal-card bg-white p-7 flex flex-col justify-between border-[3px] border-black shadow-[6px_6px_0px_0px_#000] reveal">
                <div className="space-y-4">
                  <div className="border-b-2 border-black pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Fleksibel Bulanan</span>
                    <h3 className="text-xl font-black text-black uppercase tracking-wider mt-0.5">Pro Bulanan</h3>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-black tracking-tight">
                      {formatCurrency(monthlyPrice)}
                      <span className="text-xs font-bold text-neutral-500"> / bulan</span>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide mt-1">
                      Perpanjangan per 30 hari via transfer manual
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs font-bold text-neutral-700 pt-3 border-t-2 border-neutral-100">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Seluruh fitur paket Trial tanpa batas</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Pengingat tagihan in-app & email</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Pemindaian struk berulang tanpa kuota</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Prioritas verifikasi pembayaran</li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=monthly"
                  className="mt-8 block text-center brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider py-3 shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300"
                >
                  Pilih Bulanan
                </Link>
              </div>

              {/* Pro Yearly Card */}
              <div className="brutal-card bg-white p-7 flex flex-col justify-between border-[3px] border-black shadow-[6px_6px_0px_0px_#000] relative reveal">
                {yearlySavingsPercent > 0 && (
                  <div className="absolute -top-4 right-5 bg-[#bbf7d0] text-black border-[2px] border-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
                    Hemat {yearlySavingsPercent}%
                  </div>
                )}

                <div className="space-y-4">
                  <div className="border-b-2 border-black pb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Paling Hemat</span>
                    <h3 className="text-xl font-black text-black uppercase tracking-wider mt-0.5">Pro Tahunan</h3>
                  </div>

                  <div>
                    <div className="text-4xl font-black text-black tracking-tight">
                      {formatCurrency(yearlyPrice)}
                      <span className="text-xs font-bold text-neutral-500"> / tahun</span>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide mt-1">
                      Setara {formatCurrency(Math.round(yearlyPrice / 12))} per bulan
                    </p>
                  </div>

                  <ul className="space-y-2.5 text-xs font-bold text-neutral-700 pt-3 border-t-2 border-neutral-100">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Seluruh fitur Pro selama 365 hari</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Hemat biaya dibandingkan paket bulanan</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-700 stroke-[3px]" /> Akses fitur baru yang akan datang</li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=yearly"
                  className="mt-8 block text-center brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider py-3 shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300"
                >
                  Pilih Tahunan
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 bg-white border-t-[3px] border-black relative scroll-mt-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">

            <div className="text-center space-y-3 mb-14 reveal">
              <span className="inline-block bg-[#FAF9F5] border-[2px] border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000]">
                FAQ
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-black uppercase">
                Pertanyaan yang Sering Diajukan Seputar Norden
              </h2>
            </div>

            <div className="space-y-4">

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2px] border-black shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" /> Apakah saya perlu kartu kredit untuk mendaftar?
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed pl-6">
                  Tidak. Anda dapat langsung mendaftar dengan akun Google atau email dan menikmati akses fitur penuh selama 14 hari tanpa memasukkan informasi kartu kredit sama sekali.
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2px] border-black shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" /> Apa yang terjadi setelah masa trial 14 hari selesai?
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed pl-6">
                  Akun Anda secara otomatis beralih ke paket Free Basic. Seluruh riwayat transaksi, mutasi saldo, dan dompet Anda tetap aman tersimpan. Anda tetap dapat mencatat transaksi manual dan mengekspor data Anda kapan saja.
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2px] border-black shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" /> Bagaimana metode pembayaran jika ingin upgrade ke Pro?
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed pl-6">
                  Kami mendukung transfer bank lokal (BCA, BNI) dan QRIS. Anda cukup mengunggah bukti transfer pada halaman upgrade, dan akses Pro sementara akan langsung aktif selagi menunggu verifikasi Admin.
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2px] border-black shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" /> Bisakah saya mengekspor data keuangan saya?
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed pl-6">
                  Ya. Norden menyediakan fitur ekspor satu klik dalam format file CSV, JSON, dan dokumen laporan bulanan PDF yang rapi dan terstruktur.
                </p>
              </div>

              <div className="brutal-card p-5 bg-[#FAF9F5] border-[2px] border-black shadow-[3px_3px_0px_0px_#000] space-y-1.5 reveal">
                <h4 className="font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 stroke-[2.5px]" /> Bagaimana jika saya ingin membersihkan catatan transaksi dan mulai ulang?
                </h4>
                <p className="text-xs sm:text-sm font-bold text-neutral-700 leading-relaxed pl-6">
                  Anda dapat menggunakan fitur Reset Data Keuangan di menu Pengaturan. Fitur ini membersihkan riwayat transaksi dan dompet secara aman tanpa menghapus akun login Anda atau masa aktif langganan Anda.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#FAF9F5] border-t-[3px] border-black pt-16 pb-12 px-4 sm:px-6 select-none">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-left font-bold text-xs uppercase tracking-wide">

            {/* Col 1: Brand & Bio */}
            <div className="space-y-3">
              <BrandLogo variant="horizontal" className="h-9 w-auto" />
              <p className="text-[11px] font-bold text-neutral-600 leading-relaxed lowercase first-letter:uppercase">
                Personal finance operating system untuk mencatat, melacak, dan mengarahkan keuangan pribadi Anda secara rapi.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h5 className="font-black text-black mb-3">Navigasi</h5>
              <ul className="space-y-2 text-neutral-600">
                <li><a href="#home" className="hover:text-black">Beranda</a></li>
                <li><a href="#features" className="hover:text-black">Fitur Utama</a></li>
                <li><a href="#philosophy" className="hover:text-black">Filosofi</a></li>
                <li><a href="#pricing" className="hover:text-black">Paket Harga</a></li>
                <li><a href="#faq" className="hover:text-black">Pertanyaan (FAQ)</a></li>
              </ul>
            </div>

            {/* Col 3: Legal & Akun */}
            <div>
              <h5 className="font-black text-black mb-3">Legal & Akun</h5>
              <ul className="space-y-2 text-neutral-600">
                <li><Link href="/legal/terms" className="hover:text-black">Syarat & Ketentuan</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-black">Kebijakan Privasi</Link></li>
                <li><Link href="/login" className="hover:text-black">Masuk Akun</Link></li>
                <li><Link href="/register" className="hover:text-black">Daftar Akun Baru</Link></li>
              </ul>
            </div>

            {/* Col 4: Kontak Resmi */}
            <div>
              <h5 className="font-black text-black mb-3">Kontak Resmi</h5>
              <ul className="space-y-2.5 text-neutral-600">
                <li>
                  <a
                    href="https://wa.me/6287882924651?text=Halo%20Norden%20Finance,%20saya%20tertarik%20untuk%20bertanya%20lebih%20lanjut%20mengenai%20layanan%20Norden."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-black flex items-center gap-2 group normal-case font-bold"
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
                    className="hover:text-black flex items-center gap-2 group normal-case font-bold"
                  >
                    <span className="font-black">Instagram:</span>
                    <span className="group-hover:underline">@norden.finance</span>
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Footer bottom */}
          <div className="max-w-6xl mx-auto border-t-[2px] border-black pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">
            <p>Norden Finance • Smart Financial Engine</p>
            <p>© 2026 Norden Finance. All rights reserved.</p>
          </div>
        </footer>

        {/* Back to top button */}
        <BackToTop />

      </div>
    </div>
  );
}
