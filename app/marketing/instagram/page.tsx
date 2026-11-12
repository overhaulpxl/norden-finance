'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface SlideItem {
  id: string;
  name: string;
  title: string;
  ratio: string;
  dimensions: string;
  src: string;
  description: string;
}

interface PfpItem {
  id: string;
  name: string;
  title: string;
  src: string;
  circleSrc: string;
  dimensions: string;
  description: string;
  tag: string;
  tagBg: string;
  textColor: string;
}

interface PinnedSlide {
  slideNumber: number;
  name: string;
  title: string;
  src: string;
  description: string;
}

interface PinnedPostItem {
  id: string;
  pinNumber: number;
  position: string;
  title: string;
  headline: string;
  tag: string;
  tagBg: string;
  textColor: string;
  description: string;
  caption: string;
  slides: PinnedSlide[];
}

const CAROUSEL_SLIDES: SlideItem[] = [
  {
    id: 'slide-1',
    name: 'Slide 1 — Wajah Baru Norden',
    title: 'WAJAH BARU NORDEN FINANCE',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/slide-1-reveal.png',
    description: 'Pembaruan tampilan Norden agar lebih sederhana, tegas, dan nyaman digunakan.',
  },
  {
    id: 'slide-2',
    name: 'Slide 2 — Filosofi Desain',
    title: 'DESAIN YANG PUNYA FUNGSI',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/slide-2-anatomy.png',
    description: '4 prinsip: Bentuk tegas, warna kuning fokus, kontras jelas, dan warna sesuai fungsi.',
  },
  {
    id: 'slide-3',
    name: 'Slide 3 — Sistem Identitas',
    title: 'LOGO NORDEN DI BERBAGAI UKURAN',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/slide-3-variants.png',
    description: '3 varian resmi: Horizontal Logo, Icon Mark, dan Favicon browser.',
  },
  {
    id: 'slide-4',
    name: 'Slide 4 — Fitur Nyata',
    title: 'FITUR YANG BISA KAMU PAKAI',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/slide-4-action.png',
    description: 'Smart Input bahasa alami, kelola multi-dompet, dan ringkasan keuangan teratur.',
  },
  {
    id: 'slide-5',
    name: 'Slide 5 — Mulai Mengenal',
    title: 'COBA SENDIRI NORDEN FINANCE',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/slide-5-cta.png',
    description: 'Trial Pro selama 14 hari tanpa kartu kredit dan tanpa tagihan otomatis.',
  },
];

const SQUARE_HERO: SlideItem = {
  id: 'post-square',
  name: 'Feed Post — 1:1 Square Hero',
  title: 'KENALI UANGMU BERSAMA NORDEN',
  ratio: '1:1',
  dimensions: '1080 × 1080 px',
  src: '/instagram/post-square-hero.png',
  description: 'Catat transaksi, kelola beberapa dompet, dan lihat gambaran keuanganmu dalam satu tempat.',
};

const PFP_VARIANTS: PfpItem[] = [
  {
    id: 'pfp-yellow',
    name: 'Varian 1 — Signature Yellow (Hero)',
    title: 'SIGNATURE YELLOW BADGE',
    src: '/instagram/pfp/pfp-signature-yellow.png',
    circleSrc: '/instagram/pfp/pfp-signature-yellow-circle-preview.png',
    dimensions: '1080 × 1080 px (1:1 Circle Safe)',
    description: 'Pilihan Utama: Background #FFE066 dengan simbol Norden pada bidang putih. Paling mudah dikenali di stories, komentar, dan DM.',
    tag: 'REKOMENDASI UTAMA',
    tagBg: '#FFE066',
    textColor: '#000000',
  },
  {
    id: 'pfp-white',
    name: 'Varian 2 — Pure White Minimalist',
    title: 'PURE WHITE CANVAS',
    src: '/instagram/pfp/pfp-pure-white.png',
    circleSrc: '/instagram/pfp/pfp-pure-white-circle-preview.png',
    dimensions: '1080 × 1080 px (1:1 Circle Safe)',
    description: 'Kontras Bersih: Background putih murni dengan simbol Norden kontras hitam. Cocok untuk tampilan minimal.',
    tag: 'CLEAN CONTRAST',
    tagBg: '#FFFFFF',
    textColor: '#000000',
  },
  {
    id: 'pfp-dark',
    name: 'Varian 3 — Obsidian Dark Mode',
    title: 'OBSIDIAN DARK FINTECH',
    src: '/instagram/pfp/pfp-obsidian-dark.png',
    circleSrc: '/instagram/pfp/pfp-obsidian-dark-circle-preview.png',
    dimensions: '1080 × 1080 px (1:1 Circle Safe)',
    description: 'Dark Mode: Background obsidian #0D0E11 dengan aksen kuning signature.',
    tag: 'DARK MODE',
    tagBg: '#18181B',
    textColor: '#FFE066',
  },
  {
    id: 'pfp-cream',
    name: 'Varian 4 — Brand Cream Canvas',
    title: 'WARM BRAND CREAM',
    src: '/instagram/pfp/pfp-brand-cream.png',
    circleSrc: '/instagram/pfp/pfp-brand-cream-circle-preview.png',
    dimensions: '1080 × 1080 px (1:1 Circle Safe)',
    description: 'App Canvas: Background krem #FAF9F5 mengikuti warna dasar website Norden Finance.',
    tag: 'APP CANVAS',
    tagBg: '#FAF9F5',
    textColor: '#000000',
  },
];

const PINNED_POSTS: PinnedPostItem[] = [
  {
    id: 'pin-1',
    pinNumber: 1,
    position: 'Slot 1 (Kiri) // Pinned Carousel',
    title: 'KENALAN DENGAN NORDEN FINANCE',
    headline: 'KENALI NORDEN FINANCE',
    tag: 'TENTANG NORDEN FINANCE',
    tagBg: '#FFE066',
    textColor: '#000000',
    description: 'Membantu pengguna memahami ke mana uang pergi lewat 4 pilar fungsional tanpa ilusi.',
    caption: `Kenalan dengan Norden Finance.

Kadang kita tahu berapa uang yang diterima setiap bulan, tetapi tidak benar-benar tahu ke mana uang itu pergi.

Ada pengeluaran rutin, transaksi kecil yang sering terlupakan, dan beberapa saldo yang tersebar di rekening atau e-wallet berbeda.

Norden dibuat untuk membantu merapikan semuanya dalam satu tempat.

Di sini kamu bisa:
- Mencatat pemasukan dan pengeluaran dengan Smart Input.
- Mengelola beberapa dompet dalam satu akun.
- Melihat ringkasan arus kas.
- Membuat anggaran dan target keuangan.
- Mengekspor laporan keuangan.

Kami juga ingin membuat pengalaman mengelola keuangan terasa lebih sederhana. Karena menurut kami, memahami uang sendiri tidak seharusnya terasa seperti pekerjaan tambahan.

Kenalan lebih dekat dengan Norden melalui tiga pinned post di profil ini.

Kamu juga bisa mencoba Norden Finance melalui trial Pro selama 14 hari.

Trial dimulai setelah setup awal selesai, tanpa perlu kartu kredit.

Mulai di nordenfinance.site

#NordenFinance #KelolaKeuangan #CatatKeuangan #PersonalFinance #FintechIndonesia`,
    slides: [
      {
        slideNumber: 1,
        name: 'Slide 1 — Cover',
        title: 'KENALI NORDEN FINANCE',
        src: '/instagram/pinned/pin-1-slide-1.png',
        description: 'Cover profil: Pengenalan 4 pilar pengelolaan keuangan pribadi Norden Finance.',
      },
      {
        slideNumber: 2,
        name: 'Slide 2 — Kenapa Norden Hadir?',
        title: 'UANG PERGI KE MANA?',
        src: '/instagram/pinned/pin-1-slide-2.png',
        description: 'Cerita di balik lahirnya Norden: Membantu melihat arus kas dengan lebih jelas.',
      },
      {
        slideNumber: 3,
        name: 'Slide 3 — Prinsip Desain',
        title: 'TAMPILAN PUNYA FUNGSI',
        src: '/instagram/pinned/pin-1-slide-3.png',
        description: '3 prinsip tampilan: Sederhana dan tegas, warna berbobot fungsi, dan angka mudah dibaca.',
      },
      {
        slideNumber: 4,
        name: 'Slide 4 — Penutup & CTA',
        title: 'MULAI ATUR KEUANGANMU',
        src: '/instagram/pinned/pin-1-slide-4.png',
        description: 'Langkah pertama: Mulai dengan 14 hari Trial Pro tanpa kartu kredit.',
      },
    ],
  },
  {
    id: 'pin-2',
    pinNumber: 2,
    position: 'Slot 2 (Tengah) // Pinned Carousel',
    title: 'CARA KERJA SMART INPUT & SCAN STRUK',
    headline: 'CATAT TRANSAKSI LEBIH PRAKTIS',
    tag: 'CARA KERJA NORDEN',
    tagBg: '#FFFFFF',
    textColor: '#000000',
    description: 'Mencatat pengeluaran secepat mengetik kalimat biasa atau foto struk belanjaan.',
    caption: `Mencatat keuangan sering kali bukan soal niat.

Kadang kita hanya sedang malas membuka aplikasi, memilih kategori, menentukan dompet, lalu mengisi banyak kolom untuk satu transaksi kecil.

Karena itu, Norden punya Smart Input.

Misalnya, kamu cukup menulis:
ayam geprek 18k cash

Atau:
bensin 50k bca

Norden akan membantu membaca informasi transaksi tersebut. Kamu tinggal memeriksa hasilnya sebelum menyimpan.

Selain itu, ada juga fitur scan struk untuk membantu membaca informasi dari foto struk belanja.

Dan kalau kamu punya beberapa rekening, e-wallet, atau uang tunai, semuanya bisa dikelola sebagai dompet terpisah dalam satu akun.

Tujuannya sederhana: membuat pencatatan keuangan lebih mudah dilakukan secara konsisten.

Karena catatan yang sederhana dan rutin jauh lebih berguna daripada rencana yang bagus tetapi tidak pernah dimulai.

Coba langsung di nordenfinance.site.

#NordenFinance #SmartInput #CatatPengeluaran #AplikasiKeuangan #FintechIndonesia`,
    slides: [
      {
        slideNumber: 1,
        name: 'Slide 1 — Cover',
        title: 'CATAT TRANSAKSI LEBIH PRAKTIS',
        src: '/instagram/pinned/pin-2-slide-1.png',
        description: 'Cover profil: Demo Smart Input sederhana "ayam geprek 18k cash".',
      },
      {
        slideNumber: 2,
        name: 'Slide 2 — Smart Input',
        title: 'TULIS TRANSAKSI SEPERTI BIASA',
        src: '/instagram/pinned/pin-2-slide-2.png',
        description: 'Contoh nyata: bensin 50k bca, gaji bulanan 8jt bni, kopi susu 22k gopay.',
      },
      {
        slideNumber: 3,
        name: 'Slide 3 — Scan Struk',
        title: 'SCAN STRUK LEBIH PRAKTIS',
        src: '/instagram/pinned/pin-2-slide-3.png',
        description: 'Bantuan OCR membaca nama toko dan total, lalu periksa sebelum disimpan.',
      },
      {
        slideNumber: 4,
        name: 'Slide 4 — Kelola Dompet',
        title: 'SEMUA DOMPET SATU TEMPAT',
        src: '/instagram/pinned/pin-2-slide-4.png',
        description: 'Kelola rekening, e-wallet, dan tunai secara mandiri tanpa linking bank otomatis.',
      },
    ],
  },
  {
    id: 'pin-3',
    pinNumber: 3,
    position: 'Slot 3 (Kanan) // Pinned Carousel',
    title: 'PANDUAN MEMULAI & PRIVASI',
    headline: 'MULAI PAKAI NORDEN FINANCE',
    tag: 'PANDUAN MEMULAI',
    tagBg: '#bbf7d0',
    textColor: '#064e3b',
    description: 'Panduan 3 langkah mulai, transparansi privasi zero bank linking, dan rincian trial.',
    caption: `Kalau kamu baru mengenal Norden Finance, ada beberapa hal yang mungkin ingin kamu ketahui sebelum mulai.

1. Bagaimana cara membuat akun?
Cukup buka website Norden, daftar menggunakan email, kemudian selesaikan pengaturan awal akunmu.

2. Apakah harus memasukkan kartu kredit?
Tidak. Kamu bisa mencoba trial Pro selama 14 hari tanpa memasukkan kartu kredit.
Trial dimulai setelah setup awal selesai.

3. Apakah Norden perlu terhubung dengan rekening bank?
Tidak. Norden tidak meminta kredensial mobile banking, PIN, atau OTP bank untuk menghubungkan rekeningmu.
Informasi saldo dan transaksi dicatat berdasarkan data yang kamu masukkan.

4. Apa yang terjadi setelah trial selesai?
Akses akan mengikuti paket Free Basic. Tidak ada tagihan otomatis. Kamu bisa memilih paket Pro secara terpisah apabila ingin melanjutkan.

5. Apakah harus mengunduh aplikasi?
Tidak perlu. Kamu bisa menggunakan Norden melalui browser di ponsel atau komputer.

Kalau masih penasaran, kamu bisa langsung mencobanya sendiri.

Buka nordenfinance.site dan kenali Norden dari catatan keuangan pertamamu.

#NordenFinance #TrialPro #AplikasiKeuangan #KelolaUang #FinansialPribadi`,
    slides: [
      {
        slideNumber: 1,
        name: 'Slide 1 — Cover',
        title: 'MULAI PAKAI NORDEN FINANCE',
        src: '/instagram/pinned/pin-3-slide-1.png',
        description: '3 langkah ringkas: Buka Norden, Buat Akun, Selesaikan Setup.',
      },
      {
        slideNumber: 2,
        name: 'Slide 2 — Privasi & Transparansi',
        title: 'DATA KEUANGAN TETAP DI TANGANMU',
        src: '/instagram/pinned/pin-3-slide-2.png',
        description: 'Tidak pernah meminta PIN/OTP m-banking. Pengguna memegang kendali data sendiri.',
      },
      {
        slideNumber: 3,
        name: 'Slide 3 — Fitur Trial Pro',
        title: 'KENALI FITUR TRIAL PRO',
        src: '/instagram/pinned/pin-3-slide-3.png',
        description: '14 hari akses penuh tanpa kartu kredit. Selesai trial, kembali ke Free Basic.',
      },
      {
        slideNumber: 4,
        name: 'Slide 4 — FAQ & Mulai',
        title: 'PUNYA PERTANYAAN? MULAI DI SINI',
        src: '/instagram/pinned/pin-3-slide-4.png',
        description: 'Jawaban atas pertanyaan seputar instalasi app, format ekspor, dan aktivasi trial.',
      },
    ],
  },
];

const FEED_LAUNCH_CAPTION = `Kami punya tampilan baru.

Norden Finance hadir dengan identitas visual yang lebih tegas, warna yang lebih terarah, dan tata letak yang dirancang supaya informasi keuangan lebih mudah dibaca.

Ada alasan di balik perubahan ini.

Kami ingin setiap bagian punya fungsi. Warna tidak hanya menjadi hiasan, angka penting mudah ditemukan, dan tampilan tetap nyaman digunakan sehari-hari.

Tapi tentu saja, perubahan ini bukan hanya tentang desain.

Norden tetap dibuat untuk membantu kamu:
- Mencatat pemasukan dan pengeluaran dengan lebih praktis.
- Mengelola beberapa dompet dalam satu akun.
- Melihat ringkasan arus kas.
- Mengatur anggaran dan target keuangan.
- Menyimpan laporan keuangan.

Semuanya berawal dari satu hal sederhana: memahami ke mana uang kita pergi.

Kenalan dengan tampilan baru Norden melalui carousel ini.

Kalau ingin mencoba sendiri, kamu bisa mulai dengan trial Pro 14 hari tanpa kartu kredit. Trial dimulai setelah setup awal selesai.

Kunjungi nordenfinance.site.

#NordenFinance #BrandIdentity #PersonalFinance #KelolaKeuangan #FintechIndonesia #NeoBrutalism`;

const SINGLE_SQUARE_CAPTION = `Mengelola keuangan tidak harus dimulai dengan sesuatu yang rumit.

Kamu bisa mulai dari mencatat kopi pagi, ongkos perjalanan, belanja bulanan, atau pemasukan yang baru diterima.

Dari catatan kecil itu, kamu bisa mulai melihat pola pengeluaran dan memahami kondisi keuanganmu sendiri.

Norden Finance membantu proses tersebut lewat Smart Input, pengelolaan beberapa dompet, anggaran, dan laporan keuangan.

Tidak perlu menghubungkan rekening bank. Catat informasi keuanganmu sesuai kebutuhan.

Kenali Norden di nordenfinance.site.

#NordenFinance #CatatKeuangan #AturUang #PersonalFinance #FintechIndonesia`;

export default function InstagramMarketingStudio() {
  const [activeTab, setActiveTab] = useState<'carousel' | 'pinned' | 'pfp' | 'square'>('pinned');
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [activePfpIdx, setActivePfpIdx] = useState(0);
  const [activePinIdx, setActivePinIdx] = useState(0);
  const [activePinSlideIdx, setActivePinSlideIdx] = useState(0);
  const [pfpCropMode, setPfpCropMode] = useState<'circle' | 'square'>('circle');
  const [copiedCaption, setCopiedCaption] = useState(false);

  const activeSlide = activeTab === 'carousel' ? CAROUSEL_SLIDES[activeSlideIdx] : SQUARE_HERO;
  const activePfp = PFP_VARIANTS[activePfpIdx];
  const activePin = PINNED_POSTS[activePinIdx];
  const activePinSlide = activePin.slides[activePinSlideIdx];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black font-sans selection:bg-[#FFE066] selection:text-black">
      {/* Background dot grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#C8C7C2 2px, transparent 2px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b-[3.5px] border-black">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
            >
              &larr; Beranda
            </Link>
            <span className="text-neutral-400 font-bold">/</span>
            <span className="px-2.5 py-1 bg-[#FFE066] border-[2px] border-black shadow-[2px_2px_0px_0px_#000] font-black text-xs uppercase tracking-widest">
              Marketing Asset Studio
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/instagram/INSTAGRAM_GUIDE.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#bbf7d0] transition-colors"
            >
              Baca Panduan MD &rarr;
            </a>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-10">
          <div className="inline-block mb-3 px-3 py-1 bg-[#bbf7d0] border-[2px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-widest text-emerald-950">
            Brand Launch & Content System // 2026
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none mb-3">
            Studio Konten Instagram Norden Finance
          </h1>
          <p className="text-base sm:text-lg font-bold text-neutral-700 max-w-3xl leading-relaxed">
            Aset visual dan copywriting resmi: 3 Pinned Post Carousel (masing-masing 4 slide), Feed Launch Carousel 5 Slide, 4 Varian PFP Circle-Safe, dan 1:1 Single Square Post.
          </p>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('pinned')}
            className={`px-5 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'pinned'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            📌 3 Pinned Carousel (3 Post × 4 Slide)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('carousel')}
            className={`px-5 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'carousel'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            Feed Launch Carousel (5 Slide)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pfp')}
            className={`px-5 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'pfp'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            Foto Profil / PFP (1:1 Circle Safe)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('square')}
            className={`px-5 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'square'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            Single Post (1:1 Square)
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Viewer (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* Stage Card */}
            <div className="w-full bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-4 sm:p-6 mb-6">
              {activeTab === 'pinned' ? (
                /* PINNED POST VIEWER */
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2.5px] border-black pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm uppercase tracking-wider">
                        PIN #{activePin.pinNumber} — Slide {activePinSlide.slideNumber} / 4
                      </span>
                      <span 
                        className="text-[11px] font-black px-2 py-0.5 border-[1.5px] border-black"
                        style={{ backgroundColor: activePin.tagBg, color: activePin.textColor }}
                      >
                        {activePin.tag}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-neutral-600">
                      4:5 • 1080 × 1350 px
                    </span>
                  </div>

                  {/* Rendered Pinned Slide Image */}
                  <div className="relative w-full flex items-center justify-center bg-[#FAF9F5] border-[3px] border-black overflow-hidden shadow-inner p-2 sm:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activePinSlide.src}
                      alt={activePinSlide.title}
                      className="w-full object-contain max-h-[600px] aspect-[4/5] border-[2px] border-black/20"
                    />
                  </div>

                  {/* Slide Meta & Description */}
                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-neutral-700">
                      {activePinSlide.description}
                    </p>
                    <a
                      href={activePinSlide.src}
                      download={`${activePin.id}-slide-${activePinSlide.slideNumber}.png`}
                      className="shrink-0 px-4 py-2 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                      Download Slide {activePinSlide.slideNumber} &darr;
                    </a>
                  </div>
                </>
              ) : activeTab === 'pfp' ? (
                /* PFP VIEWER */
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2.5px] border-black pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm uppercase tracking-wider">
                        {activePfp.name}
                      </span>
                      <span 
                        className="text-[11px] font-black px-2 py-0.5 border-[1.5px] border-black"
                        style={{ backgroundColor: activePfp.tagBg, color: activePfp.textColor }}
                      >
                        {activePfp.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-neutral-100 p-1 border-[2px] border-black">
                      <button
                        type="button"
                        onClick={() => setPfpCropMode('circle')}
                        className={`px-2 py-1 text-[11px] font-black uppercase transition-all ${
                          pfpCropMode === 'circle'
                            ? 'bg-[#FFE066] border-[1.5px] border-black shadow-[2px_2px_0px_#000]'
                            : 'bg-transparent text-neutral-600 hover:text-black'
                        }`}
                      >
                        ● Crop Lingkaran IG
                      </button>
                      <button
                        type="button"
                        onClick={() => setPfpCropMode('square')}
                        className={`px-2 py-1 text-[11px] font-black uppercase transition-all ${
                          pfpCropMode === 'square'
                            ? 'bg-[#FFE066] border-[1.5px] border-black shadow-[2px_2px_0px_#000]'
                            : 'bg-transparent text-neutral-600 hover:text-black'
                        }`}
                      >
                        ■ File Asli 1:1
                      </button>
                    </div>
                  </div>

                  <div className="relative w-full flex items-center justify-center bg-[#FAF9F5] border-[3px] border-black overflow-hidden shadow-inner p-4 sm:p-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pfpCropMode === 'circle' ? activePfp.circleSrc : activePfp.src}
                      alt={activePfp.name}
                      className="max-h-[460px] aspect-square object-contain transition-all"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-neutral-700">
                      {activePfp.description}
                    </p>
                    <a
                      href={activePfp.src}
                      download={`${activePfp.id}-1080x1080.png`}
                      className="shrink-0 px-4 py-2 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                      Download PFP (1080×1080) &darr;
                    </a>
                  </div>
                </>
              ) : (
                /* CAROUSEL & SQUARE VIEWER */
                <>
                  <div className="flex items-center justify-between border-b-[2.5px] border-black pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm uppercase tracking-wider">
                        {activeSlide.name}
                      </span>
                      <span className="text-[11px] font-black px-2 py-0.5 bg-[#bfdbfe] border-[1.5px] border-black">
                        {activeSlide.ratio}
                      </span>
                    </div>
                    <span className="font-bold text-xs text-neutral-600">
                      {activeSlide.dimensions}
                    </span>
                  </div>

                  <div className="relative w-full flex items-center justify-center bg-[#FAF9F5] border-[3px] border-black overflow-hidden shadow-inner p-2 sm:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeSlide.src}
                      alt={activeSlide.name}
                      className={`w-full object-contain border-[2px] border-black/20 ${
                        activeTab === 'carousel' ? 'max-h-[600px] aspect-[4/5]' : 'max-h-[500px] aspect-square'
                      }`}
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-neutral-700">
                      {activeSlide.description}
                    </p>
                    <a
                      href={activeSlide.src}
                      download={activeSlide.src.split('/').pop()}
                      className="shrink-0 px-4 py-2 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                      Download PNG &darr;
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Pinned Navigator (if Pinned tab active) */}
            {activeTab === 'pinned' && (
              <div className="w-full flex flex-col gap-5">
                {/* 1. Pilih Post Pin */}
                <div className="flex flex-col gap-2">
                  <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                    PILIH POSTINGAN PIN (1 DARI 3):
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {PINNED_POSTS.map((pin, idx) => {
                      const isSelected = activePinIdx === idx;
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => {
                            setActivePinIdx(idx);
                            setActivePinSlideIdx(0);
                          }}
                          className={`p-2 border-[2.5px] border-black text-left flex flex-col gap-1 transition-all ${
                            isSelected
                              ? 'bg-[#FFE066] shadow-[4px_4px_0px_0px_#000] -translate-y-1'
                              : 'bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pin.slides[0].src}
                            alt={pin.title}
                            className="w-full aspect-[4/5] object-cover border-[1.5px] border-black"
                          />
                          <span className="text-[10px] font-black uppercase truncate mt-0.5">
                            PIN #{pin.pinNumber}: {pin.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Pilih Slide di Post Pin Terpilih */}
                <div className="flex flex-col gap-2 pt-2 border-t-[2px] border-neutral-300">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                      SLIDE DALAM CAROUSEL PIN #{activePin.pinNumber} (4 SLIDE):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={activePinSlideIdx === 0}
                        onClick={() => setActivePinSlideIdx((prev) => Math.max(0, prev - 1))}
                        className="px-2.5 py-0.5 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 shadow-[2px_2px_0px_#000]"
                      >
                        &larr; Prev
                      </button>
                      <span className="font-black text-xs">
                        {activePinSlideIdx + 1} / 4
                      </span>
                      <button
                        type="button"
                        disabled={activePinSlideIdx === 3}
                        onClick={() => setActivePinSlideIdx((prev) => Math.min(3, prev + 1))}
                        className="px-2.5 py-0.5 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 shadow-[2px_2px_0px_#000]"
                      >
                        Next &rarr;
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {activePin.slides.map((sl, sIdx) => {
                      const isSelected = activePinSlideIdx === sIdx;
                      return (
                        <button
                          key={sl.slideNumber}
                          type="button"
                          onClick={() => setActivePinSlideIdx(sIdx)}
                          className={`p-1.5 border-[2px] border-black text-left flex flex-col gap-1 transition-all ${
                            isSelected
                              ? 'bg-[#FFE066] shadow-[3px_3px_0px_0px_#000] -translate-y-0.5'
                              : 'bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sl.src}
                            alt={sl.name}
                            className="w-full aspect-[4/5] object-cover border border-black"
                          />
                          <span className="text-[9px] font-black uppercase truncate">
                            Slide {sl.slideNumber}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Carousel Navigator (if Carousel active) */}
            {activeTab === 'carousel' && (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                    PILIH SLIDE CAROUSEL:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeSlideIdx === 0}
                      onClick={() => setActiveSlideIdx((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000]"
                    >
                      &larr; Prev
                    </button>
                    <span className="font-black text-xs">
                      {activeSlideIdx + 1} / {CAROUSEL_SLIDES.length}
                    </span>
                    <button
                      type="button"
                      disabled={activeSlideIdx === CAROUSEL_SLIDES.length - 1}
                      onClick={() => setActiveSlideIdx((prev) => Math.min(CAROUSEL_SLIDES.length - 1, prev + 1))}
                      className="px-3 py-1 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000]"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {CAROUSEL_SLIDES.map((slide, idx) => {
                    const isSelected = activeSlideIdx === idx;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveSlideIdx(idx)}
                        className={`p-1.5 border-[2.5px] border-black text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#FFE066] shadow-[4px_4px_0px_0px_#000] -translate-y-1'
                            : 'bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.src}
                          alt={slide.name}
                          className="w-full aspect-[4/5] object-cover border-[1.5px] border-black"
                        />
                        <span className="text-[10px] font-black uppercase truncate mt-0.5">
                          Slide {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PFP Navigator Grid (only if PFP active) */}
            {activeTab === 'pfp' && (
              <div className="w-full flex flex-col gap-3">
                <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                  PILIH VARIAN FOTO PROFIL:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PFP_VARIANTS.map((pfp, idx) => {
                    const isSelected = activePfpIdx === idx;
                    return (
                      <button
                        key={pfp.id}
                        type="button"
                        onClick={() => setActivePfpIdx(idx)}
                        className={`p-2 border-[2.5px] border-black text-left flex flex-col gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#FFE066] shadow-[4px_4px_0px_0px_#000] -translate-y-1'
                            : 'bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={pfp.circleSrc}
                          alt={pfp.name}
                          className="w-full aspect-square object-contain rounded-full border-[2px] border-black/30"
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase truncate">
                            {pfp.title}
                          </span>
                          <span className="text-[9px] font-bold text-neutral-600">
                            Varian {idx + 1}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Copywriting & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {activeTab === 'pinned' ? (
              /* PINNED POSTS ACTIONS & CAPTIONS */
              <>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      CAROUSEL ASET
                    </span>
                    <span className="font-black text-sm uppercase">UNDUH SEMUA SLIDE PIN #{activePin.pinNumber}</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Setiap pinned post terdiri dari 4 slide portrait (1080×1350 px) siap unggah sebagai carousel:
                  </p>

                  <div className="flex flex-col gap-2">
                    {activePin.slides.map((sl) => (
                      <div
                        key={sl.slideNumber}
                        className="flex items-center justify-between p-2.5 bg-[#FAF9F5] border-[2px] border-black"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs px-2 py-0.5 bg-[#FFE066] border border-black">
                            #{sl.slideNumber}
                          </span>
                          <span className="font-bold text-xs truncate max-w-[190px]">{sl.title}</span>
                        </div>
                        <a
                          href={sl.src}
                          download={`${activePin.id}-slide-${sl.slideNumber}.png`}
                          className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066] transition-colors"
                        >
                          PNG &darr;
                        </a>
                      </div>
                    ))}

                    <div className="mt-2 pt-3 border-t-[2px] border-neutral-200">
                      <a
                        href="/instagram/pinned/pinned-trifecta-showcase.png"
                        download="pinned-trifecta-showcase.png"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#bbf7d0] border-[2px] border-black shadow-[3px_3px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#86efac] transition-colors"
                      >
                        Unduh Overview 3-Pin Grid (3240×1500) &darr;
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#bfdbfe] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                        CAPTION PIN #{activePin.pinNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activePin.caption)}
                      className={`px-3 py-1 border-[2px] border-black font-black text-xs uppercase tracking-wider transition-all ${
                        copiedCaption
                          ? 'bg-[#bbf7d0] text-emerald-950'
                          : 'bg-[#FFE066] hover:translate-x-[1px] hover:translate-y-[1px]'
                      }`}
                    >
                      {copiedCaption ? 'Tersalin! ✓' : 'Salin Caption'}
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      readOnly
                      rows={14}
                      value={activePin.caption}
                      className="w-full p-3 bg-[#FAF9F5] border-[2.5px] border-black font-mono text-xs font-semibold leading-relaxed resize-none focus:outline-none"
                    />
                  </div>
                </div>
              </>
            ) : activeTab === 'pfp' ? (
              /* PFP ACTION CARDS */
              <>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      FOTO PROFIL
                    </span>
                    <span className="font-black text-sm uppercase">UNDUH SEMUA VARIAN</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Semua gambar 1080×1080 px PNG lossless, 100% circle-safe tanpa terpotong di feed maupun stories:
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {PFP_VARIANTS.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 bg-[#FAF9F5] border-[2px] border-black"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.circleSrc}
                            alt={p.name}
                            className="w-7 h-7 rounded-full border border-black/40"
                          />
                          <div className="flex flex-col">
                            <span className="font-bold text-xs truncate max-w-[160px]">{p.title}</span>
                            <span className="text-[10px] text-neutral-500 font-semibold">Varian #{idx + 1}</span>
                          </div>
                        </div>
                        <a
                          href={p.src}
                          download={`${p.id}-1080x1080.png`}
                          className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066] transition-colors"
                        >
                          PNG &darr;
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bio Instagram Rekomendasi */}
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 bg-[#bbf7d0] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      BIO REKOMENDASI
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`Norden Finance\nCatat transaksi. Pantau dompet. Pahami arus kas.\nTrial Pro 14 hari, tanpa kartu kredit.\nMulai di nordenfinance.site`)}
                      className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066]"
                    >
                      Salin Bio
                    </button>
                  </div>
                  <pre className="p-3 bg-[#FAF9F5] border-[2px] border-black font-mono text-xs leading-relaxed">
{`Norden Finance
Catat transaksi. Pantau dompet. Pahami arus kas.
Trial Pro 14 hari, tanpa kartu kredit.
Mulai di nordenfinance.site`}
                  </pre>
                </div>
              </>
            ) : (
              /* CAROUSEL & SQUARE ACTIONS */
              <>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      UNDUH CEPAT
                    </span>
                    <span className="font-black text-sm uppercase">DOWNLOAD GAMBAR SATUAN</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {CAROUSEL_SLIDES.map((s, idx) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 bg-[#FAF9F5] border-[2px] border-black"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs">#{idx + 1}</span>
                          <span className="font-bold text-xs truncate max-w-[170px]">{s.name}</span>
                        </div>
                        <a
                          href={s.src}
                          download={s.src.split('/').pop()}
                          className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066] transition-colors"
                        >
                          PNG &darr;
                        </a>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-2.5 bg-[#FAF9F5] border-[2px] border-black mt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs">#FEED</span>
                        <span className="font-bold text-xs truncate max-w-[170px]">Square Hero 1:1</span>
                      </div>
                      <a
                        href={SQUARE_HERO.src}
                        download="post-square-hero.png"
                        className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066] transition-colors"
                      >
                        PNG &darr;
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#bfdbfe] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                        COPYWRITING
                      </span>
                      <span className="font-black text-sm uppercase">
                        {activeTab === 'carousel' ? 'CAPTION FEED LAUNCH' : 'CAPTION SQUARE POST'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeTab === 'carousel' ? FEED_LAUNCH_CAPTION : SINGLE_SQUARE_CAPTION)}
                      className={`px-3 py-1 border-[2px] border-black font-black text-xs uppercase tracking-wider transition-all ${
                        copiedCaption
                          ? 'bg-[#bbf7d0] text-emerald-950'
                          : 'bg-[#FFE066] hover:translate-x-[1px] hover:translate-y-[1px]'
                      }`}
                    >
                      {copiedCaption ? 'Tersalin! ✓' : 'Salin Caption'}
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      readOnly
                      rows={14}
                      value={activeTab === 'carousel' ? FEED_LAUNCH_CAPTION : SINGLE_SQUARE_CAPTION}
                      className="w-full p-3 bg-[#FAF9F5] border-[2.5px] border-black font-mono text-xs font-semibold leading-relaxed resize-none focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Catatan Produksi Checklist */}
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-[#fecdd3] border-[2px] border-black font-black text-[11px] uppercase tracking-wider text-rose-950">
                  STANDAR BRAND
                </span>
                <span className="font-black text-sm uppercase">PRINSIP PRODUKSI KONTEN</span>
              </div>
              <ul className="flex flex-col gap-2 text-xs font-bold text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>Tone of voice natural, tenang, tidak berlebihan, dan dekat dengan keseharian.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>Gunakan istilah &quot;bantu membaca transaksi&quot; untuk Smart Input dan scan struk.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>Trial 14 hari dimulai setelah setup onboarding selesai, tanpa kartu kredit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>Zero Bank Linking: Pengguna memasukkan transaksi mandiri, tanpa hubung akun bank.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
