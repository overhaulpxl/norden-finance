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

interface HighlightStorySlide {
  slideNumber: number;
  title: string;
  src: string;
  description: string;
}

interface HighlightItem {
  id: string;
  name: string;
  title: string;
  icon: string;
  tagBg: string;
  coverSrc: string;
  description: string;
  stories: HighlightStorySlide[];
}

interface InteractiveStorySlide {
  slideNumber: number;
  label: string;
  title: string;
  src: string;
  description: string;
  instructions: string;
}

interface InteractiveThemeItem {
  id: string;
  name: string;
  title: string;
  category: string;
  tagBg: string;
  description: string;
  slides: InteractiveStorySlide[];
}

const CHEATSHEET_SLIDES: SlideItem[] = [
  {
    id: 'cs-01',
    name: 'Slide 1: Cover Cheat Sheet',
    title: 'SMART INPUT CHEAT SHEET',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/cheatsheet/slide-01.png',
    description: 'Tulis transaksi seperti biasa. Norden membantu membaca nominal, kategori, diskon, dan dompet yang kamu gunakan.',
  },
  {
    id: 'cs-02',
    name: 'Slide 2: Diskon & Pajak Restoran',
    title: 'HITUNG DISKON DAN PAJAK',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/cheatsheet/slide-02.png',
    description: 'makan siang 120k bca diskon 20% & sushi 350k mandiri diskon 10% + tax 10%. Diskon dihitung lebih dulu, lalu pajak dari harga setelah diskon.',
  },
  {
    id: 'cs-03',
    name: 'Slide 3: Mutasi Saldo & Tarik Tunai',
    title: 'TARIK TUNAI BUKAN PENGELUARAN',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/cheatsheet/slide-03.png',
    description: 'tarik tunai 500k bca ke cash & transfer 200k bni ke gopay. Uang berpindah antar-dompet tanpa menambah pengeluaran.',
  },
  {
    id: 'cs-04',
    name: 'Slide 4: Bensin Literan, Valas, dan Emas',
    title: 'CATAT BENSIN VALAS DAN EMAS',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/cheatsheet/slide-04.png',
    description: 'isi bensin pertamax 20 liter bca, beli 100 usd bca, & beli emas 2 gram bsi. Smart Input mengenali literan BBM, kurs valas, dan aset emas.',
  },
  {
    id: 'cs-05',
    name: 'Slide 5: Rangkuman & CTA',
    title: 'SIMPAN DULU COBA NANTI',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/cheatsheet/slide-05.png',
    description: 'Simpan postingan ini supaya contoh inputnya bisa kamu lihat lagi saat mencatat transaksi. Coba trial Pro 14 hari tanpa kartu kredit di nordenfinance.site.',
  },
];

const HIGHLIGHTS_DATA: HighlightItem[] = [
  {
    id: 'hl-fitur',
    name: 'Highlight 1: FITUR',
    title: 'FITUR UTAMA NORDEN FINANCE',
    icon: '✦',
    tagBg: '#FFE066',
    coverSrc: '/instagram/highlights/cover-fitur.png',
    description: 'Cover sorotan kuning dengan ikon brand mark Norden dalam badge brutalist. Berisi 3 story pilar fitur inti.',
    stories: [
      {
        slideNumber: 1,
        title: 'Semua Dompet Satu Tempat',
        src: '/instagram/highlights/story-fitur-1.png',
        description: 'Pisahkan rekening bank, e-wallet, dan uang tunai sebagai dompet yang berbeda. Kamu bisa melihat catatan saldonya dari satu tempat.',
      },
      {
        slideNumber: 2,
        title: 'Tulis Transaksi Seperti Biasa',
        src: '/instagram/highlights/story-fitur-2.png',
        description: 'Coba tulis "kopi susu 22k gopay". Norden membantu membaca nominal, kategori, dan dompet dari kalimat tersebut. Periksa hasilnya sebelum disimpan.',
      },
      {
        slideNumber: 3,
        title: 'Laporan Keuangan Siap Disimpan',
        src: '/instagram/highlights/story-fitur-3.png',
        description: 'Simpan ringkasan keuangan untuk dilihat kembali. Tersedia pilihan ekspor PDF, CSV, dan JSON.',
      },
    ],
  },
  {
    id: 'hl-pintasan',
    name: 'Highlight 2: PINTASAN',
    title: 'PINTASAN CEPAT APPLE SHORTCUTS',
    icon: '⚡',
    tagBg: '#FFE066',
    coverSrc: '/instagram/highlights/cover-pintasan.png',
    description: 'Cover sorotan kuning dengan ikon Apple vector dalam badge brutalist. Berisi 3 story cara aktivasi pintasan cepat.',
    stories: [
      {
        slideNumber: 1,
        title: 'Tekan Tombol Mulai Mencatat',
        src: '/instagram/highlights/story-pintasan-1.png',
        description: 'Setelah shortcut Norden diatur, kamu bisa menghubungkannya ke Action Button atau Back Tap di iPhone. Input transaksi bisa dibuka tanpa harus mencari website lebih dulu.',
      },
      {
        slideNumber: 2,
        title: 'Catat Lewat Suara Siri',
        src: '/instagram/highlights/story-pintasan-2.png',
        description: 'Jalankan shortcut dengan perintah Siri yang sudah kamu atur, misalnya, “Hey Siri, Catat Norden”. Masukkan detail transaksi, lalu periksa hasilnya.',
      },
      {
        slideNumber: 3,
        title: 'Akses Pintasan Punya Kunci Sendiri',
        src: '/instagram/highlights/story-pintasan-3.png',
        description: 'Setiap akun menggunakan token akses sendiri untuk menghubungkan shortcut dengan Norden. Kamu bisa membuat ulang token melalui Pengaturan jika diperlukan.',
      },
    ],
  },
  {
    id: 'hl-faq',
    name: 'Highlight 3: FAQ',
    title: 'PERTANYAAN UMUM NORDEN FINANCE',
    icon: '?',
    tagBg: '#bbf7d0',
    coverSrc: '/instagram/highlights/cover-faq.png',
    description: 'Cover sorotan hijau pastel dengan ikon tanda tanya. Menjawab keraguan calon pengguna.',
    stories: [
      {
        slideNumber: 1,
        title: 'Perlu Download Dari Store?',
        src: '/instagram/highlights/story-faq-1.png',
        description: 'Tidak perlu. Norden bisa dibuka langsung melalui browser di ponsel atau laptop. Kamu juga bisa menambahkannya ke layar utama jika perangkat dan browser mendukungnya.',
      },
      {
        slideNumber: 2,
        title: 'Setelah Trial Apa Yang Terjadi?',
        src: '/instagram/highlights/story-faq-2.png',
        description: 'Setelah trial 14 hari selesai, akun akan menggunakan akses Free Basic. Tidak ada tagihan otomatis dan tidak ada pemotongan saldo.',
      },
      {
        slideNumber: 3,
        title: 'Bagaimana Cara Membuat Akun?',
        src: '/instagram/highlights/story-faq-3.png',
        description: 'Buka nordenfinance.site, daftar menggunakan email, lalu ikuti langkah setup awal. Setelah selesai, kamu bisa mulai mencatat transaksi.',
      },
    ],
  },
  {
    id: 'hl-privasi',
    name: 'Highlight 4: PRIVASI',
    title: 'PRIVASI DATA KEUANGANMU',
    icon: '🔒',
    tagBg: '#bfdbfe',
    coverSrc: '/instagram/highlights/cover-privasi.png',
    description: 'Cover sorotan biru pastel dengan ikon gembok. Komitmen keamanan zero bank linking.',
    stories: [
      {
        slideNumber: 1,
        title: 'Data Keuangan Tetap Kamu Atur',
        src: '/instagram/highlights/story-privasi-1.png',
        description: 'Norden tidak meminta username, password mobile banking, PIN, atau OTP rekening bank. Saldo dan transaksi kamu masukkan sendiri ke dalam aplikasi.',
      },
      {
        slideNumber: 2,
        title: 'Data Milikmu Bisa Kamu Kelola',
        src: '/instagram/highlights/story-privasi-2.png',
        description: 'Kamu bisa mengekspor data keuangan dalam format yang tersedia. Norden juga menyediakan fitur Reset Finansial untuk menghapus catatan keuangan tanpa menghapus identitas akun.',
      },
      {
        slideNumber: 3,
        title: 'Bagaimana Struk Diproses?',
        src: '/instagram/highlights/story-privasi-3.png',
        description: 'Fitur scan struk menggunakan layanan AI Google Gemini untuk membantu membaca informasi pada foto. Periksa kembali hasil pembacaannya sebelum menyimpan transaksi.',
      },
    ],
  },
  {
    id: 'hl-trial',
    name: 'Highlight 5: TRIAL PRO',
    title: 'TRIAL PRO 14 HARI',
    icon: '★',
    tagBg: '#FFE066',
    coverSrc: '/instagram/highlights/cover-trial.png',
    description: 'Cover sorotan kuning bintang. Berisi ajakan mencoba seluruh fitur Pro tanpa biaya.',
    stories: [
      {
        slideNumber: 1,
        title: 'Kenali Fitur Paket Pro',
        src: '/instagram/highlights/story-trial-1.png',
        description: 'Selama trial, kamu bisa mencoba fitur Pro yang tersedia, termasuk Smart Input, scan struk, dan pengelolaan beberapa dompet. Lihat sendiri fitur mana yang paling membantu keseharianmu.',
      },
      {
        slideNumber: 2,
        title: 'Tanpa Perlu Kartu Kredit',
        src: '/instagram/highlights/story-trial-2.png',
        description: 'Kamu tidak perlu memasukkan nomor kartu kredit untuk memulai trial. Trial 14 hari dimulai setelah setup awal akun selesai.',
      },
      {
        slideNumber: 3,
        title: 'Mulai Catat Hari Ini',
        src: '/instagram/highlights/story-trial-3.png',
        description: 'Kunjungi nordenfinance.site atau buka tautan di bio @norden.finance untuk membuat akun.',
      },
    ],
  },
  {
    id: 'hl-templates',
    name: 'Highlight 6: TEMPLATES',
    title: 'TEMPLATE STORY INTERAKTIF',
    icon: '💬',
    tagBg: '#FFE066',
    coverSrc: '/instagram/highlights/cover-templates.png',
    description: 'Cover sorotan kuning dengan ikon balon percakapan. Menampung 6 slide dari 3 tema story interaktif.',
    stories: [
      {
        slideNumber: 1,
        title: 'Cover: Polling Kopi Bulanan',
        src: '/instagram/highlights/story-poll-cover.png',
        description: 'Kopi Rp20 ribu sehari mungkin terasa biasa. Tapi kalau dikumpulkan sebulan jumlahnya lumayan. Yuk cek lewat polling berikutnya.',
      },
      {
        slideNumber: 2,
        title: 'Stiker: Polling Pilihan Jawaban',
        src: '/instagram/highlights/story-poll-interactive.png',
        description: 'Slot stiker polling 4 pilihan rentang pengeluaran kopi bulanan dan contoh Smart Input "kopi 22k bca".',
      },
      {
        slideNumber: 3,
        title: 'Cover: Tips Kebocoran Halus',
        src: '/instagram/highlights/story-tips-cover.png',
        description: 'Bukan belanja besar yang bikin uang cepat habis, tapi biaya kecil yang muncul berulang kali tanpa disadari.',
      },
      {
        slideNumber: 4,
        title: 'Stiker: Tips & Slider Reaksi',
        src: '/instagram/highlights/story-tips-interactive.png',
        description: '3 kebocoran halus (langganan lupa dimatikan, biaya admin & ongkir, tabungan campur belanja) dan stiker emoji slider.',
      },
      {
        slideNumber: 5,
        title: 'Cover: Pintasan Action Button',
        src: '/instagram/highlights/story-action-cover.png',
        description: 'Mencatat transaksi bisa dimulai dari tombol di sisi iPhone tanpa perlu membuka safari atau browser.',
      },
      {
        slideNumber: 6,
        title: 'Stiker: Cara Pakai & Link Sticker',
        src: '/instagram/highlights/story-action-interactive.png',
        description: '3 langkah mudah pakai shortcut Action Button dan slot link sticker menuju nordenfinance.site.',
      },
    ],
  },
];

const INTERACTIVE_THEMES: InteractiveThemeItem[] = [
  {
    id: 'theme-poll',
    name: 'Tema 1: Polling Kopi & Jajan Bulanan',
    title: 'BERAPA BUDGET KOPI BULANANMU?',
    category: 'POLLING & INTERAKSI',
    tagBg: '#FFE066',
    description: 'Ajak audiens menghitung pengeluaran kopi atau jajan harian yang terakumulasi dalam sebulan.',
    slides: [
      {
        slideNumber: 1,
        label: 'Cover Pengantar',
        title: 'Berapa Budget Kopi Bulananmu?',
        src: '/instagram/stories/story-poll-cover.png',
        description: 'Kopi Rp20 ribu sehari mungkin terasa biasa. Tapi kalau dikumpulkan selama sebulan, jumlahnya bisa lumayan juga. Yuk, lihat kebiasaan jajan kita lewat polling berikutnya.',
        instructions: 'Unggah sebagai slide pertama untuk membangun interaksi dan konteks sebelum audiens mengisi stiker polling.',
      },
      {
        slideNumber: 2,
        label: 'Slide Interaktif Stiker',
        title: 'Berapa Banyak Kamu Habiskan?',
        src: '/instagram/stories/story-poll-interactive.png',
        description: 'Slot stiker polling 4 pilihan (<Rp200 Ribu, Rp200 Ribu–500 Ribu, Rp500 Ribu–1 Juta, >Rp1 Juta) & contoh Smart Input "kopi 22k bca".',
        instructions: 'Buka menu Stiker Instagram Story, pilih "Polling", lalu masukkan 4 rentang nominal sesuai kotak yang tersedia.',
      },
    ],
  },
  {
    id: 'theme-tips',
    name: 'Tema 2: Tips Kebocoran Halus',
    title: 'PENGELUARAN KECIL YANG SERING LOLOS',
    category: 'EDUKASI FINANSIAL',
    tagBg: '#bbf7d0',
    description: 'Edukasi pengeluaran kecil berulang yang sering tidak disadari membuat anggaran bulanan cepat menipis.',
    slides: [
      {
        slideNumber: 1,
        label: 'Cover Pengantar',
        title: 'Pengeluaran Kecil yang Sering Lolos',
        src: '/instagram/stories/story-tips-cover.png',
        description: 'Kadang bukan belanja besar yang bikin uang cepat habis. Justru ada biaya kecil yang muncul berulang kali dan sering luput dari perhatian. Coba cek tiga contohnya di story berikutnya.',
        instructions: 'Unggah sebagai slide pertama pengantar untuk meningkatkan retensi dan rasa ingin tahu audiens.',
      },
      {
        slideNumber: 2,
        label: 'Slide Interaktif Tips & Reaksi',
        title: 'Tiga Hal Kecil Sering Terlewat',
        src: '/instagram/stories/story-tips-interactive.png',
        description: '3 kebocoran halus (langganan lupa dimatikan, biaya admin & ongkir, tabungan campur belanja) dan slot stiker pertanyaan / emoji slider.',
        instructions: 'Buka menu Stiker Instagram, pilih "Slider Emoji" (misal api atau mata) atau "Pertanyaan": "Mana yang paling sering kamu alami?".',
      },
    ],
  },
  {
    id: 'theme-action',
    name: 'Tema 3: Showcase Action Button iPhone',
    title: 'CATAT TRANSAKSI TANPA BUKA BROWSER',
    category: 'FITUR UNGGULAN',
    tagBg: '#bfdbfe',
    description: 'Demonstrasi kepraktisan mencatat transaksi dalam 3 detik menggunakan Action Button iPhone dan Apple Shortcuts.',
    slides: [
      {
        slideNumber: 1,
        label: 'Cover Pengantar',
        title: 'Catat Transaksi Tanpa Buka Browser',
        src: '/instagram/stories/story-action-cover.png',
        description: 'Kalau shortcut Norden sudah kamu atur ke Action Button, mencatat transaksi bisa dimulai dari tombol di sisi iPhone. Lihat cara menggunakannya di story berikutnya.',
        instructions: 'Unggah sebagai slide pengantar untuk menarik perhatian pengguna iPhone yang menyukai kepraktisan.',
      },
      {
        slideNumber: 2,
        label: 'Slide Interaktif & Link Sticker',
        title: 'Tekan Tombol Mulai Mencatat',
        src: '/instagram/stories/story-action-interactive.png',
        description: '3 langkah praktis penggunaan Action Button dan slot link sticker resmi menuju website nordenfinance.site.',
        instructions: 'Buka menu Stiker Instagram, pilih "Tautan / Link", tempel URL https://nordenfinance.site dengan label tombol "Coba Norden".',
      },
    ],
  },
];

const ADVANCED_CAROUSEL_SLIDES: SlideItem[] = [
  {
    id: 'adv-01',
    name: 'Slide 1 — Cover Fitur Lanjutan',
    title: 'LEBIH DARI SEKADAR CATAT UANG',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-01.png',
    description: 'Cover carousel: Pengenalan 9 fitur lanjutan Norden Finance di luar pencatatan harian.',
  },
  {
    id: 'adv-02',
    name: 'Slide 2 — Pintasan Apple & Action Button',
    title: 'CATAT DARI LAYAR UTAMA',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-02.png',
    description: 'Pintasan Action Button / Back Tap di iOS untuk mencatat transaksi tanpa buka browser.',
  },
  {
    id: 'adv-03',
    name: 'Slide 3 — Perintah Suara Siri',
    title: 'CATAT LEWAT SUARA SIRI',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-03.png',
    description: 'Catat transaksi via perintah suara Siri dengan token akses webhook akun yang aman.',
  },
  {
    id: 'adv-04',
    name: 'Slide 4 — Smart Input: Diskon & Pajak',
    title: 'DISKON DAN PAJAK SEKALIGUS',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-04.png',
    description: 'Smart input natural language: kalkulasi otomatis diskon dan pajak dalam satu baris.',
  },
  {
    id: 'adv-05',
    name: 'Slide 5 — Smart Input: Tarik Tunai & Mutasi',
    title: 'PINDAH SALDO ANTAR DOMPET',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-05.png',
    description: 'Mutasi saldo antar-dompet (tarik tunai/transfer internal) tanpa mengurangi kekayaan bersih.',
  },
  {
    id: 'adv-06',
    name: 'Slide 6 — Scan Struk Belanja',
    title: 'FOTO STRUK JADI CATATAN',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-06.png',
    description: 'Ekstraksi otomatis foto struk: tanggal, toko, item, dan total dengan verifikasi manual.',
  },
  {
    id: 'adv-07',
    name: 'Slide 7 — Transparansi Pemrosesan Data',
    title: 'TAHU BAGAIMANA DATA DIPROSES',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-07.png',
    description: 'Transparansi privasi: scan struk diproses oleh layanan AI terverifikasi, bukan offline lokal.',
  },
  {
    id: 'adv-08',
    name: 'Slide 8 — Saldo Terpadu & Multi-Dompet',
    title: 'SEMUA SALDO SATU TAMPILAN',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-08.png',
    description: 'Pantau saldo rekening, e-wallet, dan kas tunai terpusat tanpa menghubungkan akun bank.',
  },
  {
    id: 'adv-09',
    name: 'Slide 9 — Aset Terpadu: Kurs USD & Emas',
    title: 'KURS RUPIAH DAN EMAS',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-09.png',
    description: 'Nilai acuan kurs USD/IDR dan harga emas Antam per gram langsung di dashboard portofolio.',
  },
  {
    id: 'adv-10',
    name: 'Slide 10 — Split Bill Proporsional',
    title: 'BAGI TAGIHAN LEBIH MUDAH',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-10.png',
    description: 'Bagi tagihan makan bersama dengan pembagian pajak, diskon, dan service charge proporsional.',
  },
  {
    id: 'adv-11',
    name: 'Slide 11 — Format Rincian WhatsApp',
    title: 'RINCIAN TAGIHAN SIAP DIBAGIKAN',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-11.png',
    description: 'Salin rincian split bill siap kirim ke grup WhatsApp lengkap dengan info rekening.',
  },
  {
    id: 'adv-12',
    name: 'Slide 12 — Simulasi Ketahanan Dana (Runway)',
    title: 'BERAPA LAMA TABUNGAN BERTAHAN?',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-12.png',
    description: 'Simulasi survival runway: perkiraan ketahanan tabungan jika pemasukan mendadak berhenti.',
  },
  {
    id: 'adv-13',
    name: 'Slide 13 — Panduan Alokasi Dana Darurat',
    title: 'SIAPKAN DANA DARURATMU',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-13.png',
    description: 'Pedoman alokasi dana darurat: 3 bulan (lajang), 6 bulan (keluarga), 9-12 bulan (wirausaha).',
  },
  {
    id: 'adv-14',
    name: 'Slide 14 — Strategi Bebas Utang: Snowball vs Avalanche',
    title: 'SUSUN RENCANA PELUNASAN UTANG',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-14.png',
    description: 'Perbandingan strategi Snowball (saldo terkecil) vs Avalanche (bunga tertinggi).',
  },
  {
    id: 'adv-15',
    name: 'Slide 15 — Estimasi Waktu Bebas Utang',
    title: 'PERKIRAKAN WAKTU PELUNASAN',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-15.png',
    description: 'Proyeksi tanggal bebas utang dengan simulasi alokasi pembayaran ekstra bulanan.',
  },
  {
    id: 'adv-16',
    name: 'Slide 16 — Laporan Keuangan Format PDF',
    title: 'LAPORAN RAPI DALAM FORMAT PDF',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-16.png',
    description: 'Ekspor dokumen laporan 2 halaman standar akuntansi: ringkasan arus kas dan rincian transaksi.',
  },
  {
    id: 'adv-17',
    name: 'Slide 17 — Buku Kas & Arsip Bulanan',
    title: 'BUKU KAS LEBIH TERTATA',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-17.png',
    description: 'Audit arus kas bulanan dan ekspor data fleksibel format PDF, CSV, dan JSON.',
  },
  {
    id: 'adv-18',
    name: 'Slide 18 — Keamanan Akses PIN & Biometrik',
    title: 'JAGA AKSES CATATAN KEUANGANMU',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-18.png',
    description: 'Perlindungan akses lokal perangkat menggunakan PIN 6-digit, Face ID, atau sidik jari.',
  },
  {
    id: 'adv-19',
    name: 'Slide 19 — Rangkuman 9 Fitur Lanjutan',
    title: 'LEBIH BANYAK YANG BISA DILAKUKAN',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-19.png',
    description: 'Daftar ringkas seluruh 9 modul fitur lanjutan Norden yang siap digunakan.',
  },
  {
    id: 'adv-20',
    name: 'Slide 20 — Trial Pro 14 Hari & Penutup',
    title: 'COBA DULU KENALI FITURNYA',
    ratio: '4:5',
    dimensions: '1080 × 1350 px',
    src: '/instagram/advanced/slide-20.png',
    description: 'Penutup CTA: Coba 14 hari Trial Pro tanpa kartu kredit di nordenfinance.site.',
  },
];

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
  description: 'Desain neo-brutalist selaras carousel dengan kartu kuning hero, brand pill, dan 3 kartu pilar fitur fungsional.',
};

const PFP_VARIANTS: PfpItem[] = [
  {
    id: 'pfp-white',
    name: 'Varian 1 — Pure White (Gaya Norden.grp)',
    title: 'PURE WHITE CIRCLE FILL',
    src: '/instagram/pfp/pfp-pure-white.png',
    circleSrc: '/instagram/pfp/pfp-pure-white-circle-preview.png',
    dimensions: '1080 × 1080 px (1:1 Circle Safe)',
    description: 'Identik norden.grp: Kanvas putih bersih dengan concentric ring hitam dan emblem N panah solid yang ngefill lingkaran secara proporsional.',
    tag: 'GAYA NORDEN.GRP (HERO)',
    tagBg: '#FFFFFF',
    textColor: '#000000',
  },
  {
    id: 'pfp-yellow',
    name: 'Varian 2 — Signature Yellow Ring',
    title: 'SIGNATURE YELLOW BADGE',
    src: '/instagram/pfp/pfp-signature-yellow.png',
    circleSrc: '/instagram/pfp/pfp-signature-yellow-circle-preview.png',
    dimensions: '1080 × 1080 px (1:1 Circle Safe)',
    description: 'Kontras Bold: Background #FFE066 dengan concentric ring hitam dan emblem N panah solid. Terang dan mencolok di Stories serta DM.',
    tag: 'SIGNATURE BOLD',
    tagBg: '#FFE066',
    textColor: '#000000',
  },
  {
    id: 'pfp-dark',
    name: 'Varian 3 — Obsidian Dark Mode',
    title: 'OBSIDIAN DARK FINTECH',
    src: '/instagram/pfp/pfp-obsidian-dark.png',
    circleSrc: '/instagram/pfp/pfp-obsidian-dark-circle-preview.png',
    dimensions: '1080 × 1080 px (1:1 Circle Safe)',
    description: 'Fintech Premium: Background obsidian #0D0E11 dengan concentric ring dan emblem N panah kuning signature #FFE066.',
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
    description: 'Warna Web App: Background krem #FAF9F5 selaras dengan warna kanvas dasar website Norden Finance.',
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

const ADVANCED_CAROUSEL_CAPTION = `Mencatat pengeluaran sehari-hari memang penting. Tapi kadang, ada hal lain yang juga ingin kita atur.

Misalnya, membagi tagihan setelah makan bersama, menghitung diskon dan pajak, mengetahui berapa lama tabungan bisa bertahan, atau mencari cara untuk melunasi utang dengan lebih terencana.

Karena itu, Norden juga punya beberapa fitur untuk membantu kebutuhan tersebut.

Beberapa di antaranya:

1. Pintasan Apple & Action Button
Mulai mencatat transaksi dari shortcut yang sudah kamu atur.

2. Smart Input
Masukkan nominal, diskon, pajak, atau mutasi antar-dompet dalam satu catatan.

3. Scan Struk
Gunakan foto struk untuk membantu membaca informasi transaksi. Hasilnya tetap bisa kamu periksa sebelum disimpan.

4. Saldo Terpadu
Kelola saldo rekening, e-wallet, dan uang tunai dalam satu tempat.

5. Split Bill
Bagi tagihan sesuai pesanan masing-masing dan salin rinciannya untuk dibagikan.

6. Simulasi Dana
Dapatkan gambaran berapa lama tabungan bisa mencukupi kebutuhan berdasarkan pengeluaranmu.

7. Simulator Pelunasan Utang
Bandingkan metode Snowball dan Avalanche untuk menyusun rencana pembayaran.

8. Laporan PDF
Simpan ringkasan keuangan untuk evaluasi dan arsip pribadi.

9. Kunci Akses
Gunakan pilihan pengamanan perangkat yang tersedia untuk menjaga akses ke catatanmu.

Setiap orang punya kebutuhan keuangan yang berbeda. Tidak semua fitur harus langsung digunakan. Kamu bisa mulai dari yang paling sesuai dengan kebutuhanmu sekarang.

Semua fitur Pro dapat dicoba melalui trial 14 hari tanpa kartu kredit. Tidak ada tagihan otomatis setelah trial berakhir.

Kenali Norden lebih dekat di nordenfinance.site. Tautannya juga tersedia di bio.

#NordenFinance #KelolaKeuangan #CatatKeuangan #PersonalFinance #FintechIndonesia #AturUang`;

const CHEATSHEET_CAPTION = `Mencatat transaksi di Norden bisa dimulai dari kalimat yang biasa kamu pakai sehari-hari.

Smart Input akan membantu membaca nominal, kategori, diskon, dan dompet yang kamu gunakan.

Ini beberapa contoh input yang bisa langsung kamu coba:

1. Hitung Diskon
"makan siang 120k bca diskon 20%"

2. Diskon + Pajak Resto
"sushi 350k mandiri diskon 10% + tax 10%"
(Diskon dihitung lebih dulu, lalu pajak dari harga setelah diskon)

3. Tarik Tunai di ATM
"tarik tunai 500k bca ke cash"
(Uang berpindah antar-dompet, bukan pengeluaran)

4. Transfer Antar-Dompet
"transfer 200k bni ke gopay"

5. Isi Bensin Literan
"isi bensin pertamax 20 liter bca"

6. Beli Mata Uang Asing
"beli 100 usd bca"

7. Beli Tabungan Emas
"beli emas 2 gram bsi"

Simpan postingan ini supaya contoh formatnya bisa kamu lihat lagi saat mencatat pengeluaran.

Coba trial Pro selama 14 hari tanpa kartu kredit di nordenfinance.site. Tautannya ada di bio.

#NordenFinance #SmartInput #CatatKeuangan #KelolaUang #PersonalFinance #TipsKeuangan #FintechIndonesia`;

export default function InstagramMarketingStudio() {
  const [activeTab, setActiveTab] = useState<
    'cheatsheet' | 'highlights' | 'stories' | 'downloads' | 'advanced' | 'pinned' | 'carousel' | 'pfp' | 'square'
  >('cheatsheet');
  const [activeCheatsheetIdx, setActiveCheatsheetIdx] = useState(0);
  const [activeHighlightIdx, setActiveHighlightIdx] = useState(0);
  const [activeHighlightSlideIdx, setActiveHighlightSlideIdx] = useState<number>(-1);
  const [activeStoryThemeIdx, setActiveStoryThemeIdx] = useState(0);
  const [activeStorySlideIdx, setActiveStorySlideIdx] = useState(0);
  const [activeAdvancedSlideIdx, setActiveAdvancedSlideIdx] = useState(0);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [activePfpIdx, setActivePfpIdx] = useState(0);
  const [activePinIdx, setActivePinIdx] = useState(0);
  const [activePinSlideIdx, setActivePinSlideIdx] = useState(0);
  const [pfpCropMode, setPfpCropMode] = useState<'circle' | 'square'>('circle');
  const [copiedCaption, setCopiedCaption] = useState(false);

  const activeSlide = activeTab === 'cheatsheet'
    ? CHEATSHEET_SLIDES[activeCheatsheetIdx]
    : activeTab === 'advanced'
    ? ADVANCED_CAROUSEL_SLIDES[activeAdvancedSlideIdx]
    : activeTab === 'carousel'
    ? CAROUSEL_SLIDES[activeSlideIdx]
    : SQUARE_HERO;

  const activeHighlight = HIGHLIGHTS_DATA[activeHighlightIdx] || HIGHLIGHTS_DATA[0];
  const activeHighlightStory = activeHighlightSlideIdx >= 0 && activeHighlightSlideIdx < activeHighlight.stories.length
    ? activeHighlight.stories[activeHighlightSlideIdx]
    : null;

  const activeHighlightItem = activeHighlightSlideIdx === -1 || !activeHighlightStory
    ? {
        title: `${activeHighlight.name}: Cover Sampul (Circle-Safe 600×600 px)`,
        badge: 'HIGHLIGHT COVER',
        src: activeHighlight.coverSrc,
        description: activeHighlight.description,
        downloadName: `cover-${activeHighlight.id.replace('hl-', '')}.png`,
      }
    : {
        title: `${activeHighlight.name}: Slide ${activeHighlightStory.slideNumber} / ${activeHighlight.stories.length} (${activeHighlightStory.title})`,
        badge: `STORY ${activeHighlightStory.slideNumber} / ${activeHighlight.stories.length}`,
        src: activeHighlightStory.src,
        description: activeHighlightStory.description,
        downloadName: activeHighlightStory.src.split('/').pop() || `story-${activeHighlight.id.replace('hl-', '')}-${activeHighlightStory.slideNumber}.png`,
      };

  const activeTheme = INTERACTIVE_THEMES[activeStoryThemeIdx] || INTERACTIVE_THEMES[0];
  const activeThemeSlide = activeTheme.slides[activeStorySlideIdx] || activeTheme.slides[0];
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

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/instagram/zips/norden-instagram-master-bundle.zip"
              download="norden-instagram-master-bundle.zip"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFE066] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
            >
              📦 Download All Assets (ZIP) &darr;
            </a>
            <a
              href="/instagram/HIGHLIGHTS_AND_STORIES_GUIDE.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#FFE066] transition-colors"
            >
              Panduan Highlight & Stories MD &rarr;
            </a>
            <a
              href="/instagram/CAROUSEL_ADVANCED_GUIDE.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#FFE066] transition-colors"
            >
              Panduan Fitur Lanjutan MD &rarr;
            </a>
            <a
              href="/instagram/INSTAGRAM_GUIDE.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#bbf7d0] transition-colors"
            >
              Panduan Launch MD &rarr;
            </a>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-10">
          <div className="inline-block mb-3 px-3 py-1 bg-[#bbf7d0] border-[2px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-widest text-emerald-950">
            Brand Launch &amp; Content System // 2026
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-none mb-3">
            Studio Konten Instagram Norden Finance
          </h1>
          <p className="text-base sm:text-lg font-bold text-neutral-700 max-w-3xl leading-relaxed">
            Aset visual dan copywriting resmi: 5 Slide Cheat Sheet Feed, 6 Cover Highlight + 21 Slide Story Profil, 3 Template Story Interaktif (6 Slide), 20 Slide Fitur Lanjutan, 3 Pinned Post Carousel, Feed Launch Carousel, dan 4 Varian PFP Circle-Safe.
          </p>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('cheatsheet')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'cheatsheet'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            📝 Cheat Sheet Feed (5 Slide)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('highlights')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'highlights'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            🌟 6 Highlight Profil (27 Aset)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'stories'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            📱 3 Story Interaktif (6 Slide)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'downloads'
                ? 'bg-[#bbf7d0] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-[#dcfce7]'
            }`}
          >
            📦 Download All Assets (ZIP)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'advanced'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            ⚡ Fitur Lanjutan (20 Slide)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pinned')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'pinned'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            📌 3 Pinned Carousel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('carousel')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'carousel'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            Feed Launch (5 Slide)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pfp')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'pfp'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            PFP (Circle Safe)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('square')}
            className={`px-4 py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-wider transition-all ${
              activeTab === 'square'
                ? 'bg-[#FFE066] shadow-[5px_5px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-white shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-100'
            }`}
          >
            Single Post (1:1)
          </button>
        </div>

        {/* Main Content Grid or Download Center */}
        {activeTab === 'downloads' ? (
          <div className="flex flex-col gap-8">
            {/* Master Bundle Card */}
            <div className="bg-[#FFE066] border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b-[3px] border-black">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-black text-[#FFE066] font-black text-xs uppercase tracking-widest border border-black">
                    MASTER ALL-IN-ONE BUNDLE
                  </span>
                  <span className="font-bold text-xs uppercase text-neutral-800">
                    38 ASET PNG + DOKUMEN PANDUAN
                  </span>
                </div>
                <a
                  href="/instagram/zips/norden-instagram-master-bundle.zip"
                  download="norden-instagram-master-bundle.zip"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] font-black text-sm uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                >
                  📦 Unduh Semua Aset (Master ZIP) &darr;
                </a>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                Download Seluruh Aset Konten Instagram Norden Finance
              </h2>
              <p className="text-sm font-bold text-neutral-800 max-w-3xl leading-relaxed mb-6">
                Satu berkas ZIP lengkap berisi seluruh materi publikasi siap unggah: 5 slide Cheat Sheet Feed Post (4:5), 6 Cover Highlight profil (Circle-Safe 600×600 px), 21 slide Story sorotan (9:16), 6 slide Template Story Interaktif (3 tema pengantar + stiker), serta panduan teks dan copywriting resmi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-[2.5px] border-black">
                <div className="bg-white p-3 border-[2px] border-black">
                  <span className="block font-black text-xs uppercase text-neutral-600 mb-1">
                    Feed Post Carousel
                  </span>
                  <span className="block font-black text-sm">5 Slide Cheat Sheet</span>
                  <span className="text-[11px] font-bold text-neutral-500">1080 × 1350 px (4:5)</span>
                </div>
                <div className="bg-white p-3 border-[2px] border-black">
                  <span className="block font-black text-xs uppercase text-neutral-600 mb-1">
                    Sorotan Profil
                  </span>
                  <span className="block font-black text-sm">6 Cover + 21 Story</span>
                  <span className="text-[11px] font-bold text-neutral-500">Circle-Safe + 9:16 Story</span>
                </div>
                <div className="bg-white p-3 border-[2px] border-black">
                  <span className="block font-black text-xs uppercase text-neutral-600 mb-1">
                    Story Interaktif
                  </span>
                  <span className="block font-black text-sm">3 Tema (6 Slide)</span>
                  <span className="text-[11px] font-bold text-neutral-500">Pengantar + Slot Stiker</span>
                </div>
              </div>
            </div>

            {/* Category Bundles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bundle 1: Cheatsheet */}
              <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      FEED POST (4:5)
                    </span>
                    <span className="text-xs font-black text-neutral-500">5 SLIDE</span>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">
                    Cheat Sheet Smart Input
                  </h3>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Carousel panduan cepat menulis kalimat transaksi di Smart Input: Diskon &amp; pajak, mutasi saldo, literan BBM, valas USD, emas, dan CTA trial.
                  </p>
                  <div className="flex flex-col gap-1.5 mb-6 text-[11px] font-bold text-neutral-700 bg-[#FAF9F5] p-3 border-[2px] border-black">
                    <div>• slide-01: Cover Smart Input Cheat Sheet</div>
                    <div>• slide-02: Diskon &amp; Pajak Restoran</div>
                    <div>• slide-03: Mutasi Saldo &amp; Tarik Tunai</div>
                    <div>• slide-04: Bensin Literan, Valas &amp; Emas</div>
                    <div>• slide-05: Rangkuman &amp; CTA Trial Pro</div>
                  </div>
                </div>
                <a
                  href="/instagram/zips/norden-cheatsheet-feed.zip"
                  download="norden-cheatsheet-feed.zip"
                  className="w-full text-center px-4 py-2.5 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all"
                >
                  Unduh ZIP Cheat Sheet &darr;
                </a>
              </div>

              {/* Bundle 2: Highlights */}
              <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 bg-[#bfdbfe] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      HIGHLIGHTS &amp; STORY
                    </span>
                    <span className="text-xs font-black text-neutral-500">27 FILE</span>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">
                    Sorotan Profil (6 Cover + 21 Story)
                  </h3>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Paket lengkap 6 sorotan Instagram: FITUR, PINTASAN, FAQ, PRIVASI, TRIAL PRO, dan TEMPLATES. Komposisi circle-safe 600×600 px tepat di tengah.
                  </p>
                  <div className="flex flex-col gap-1.5 mb-6 text-[11px] font-bold text-neutral-700 bg-[#FAF9F5] p-3 border-[2px] border-black">
                    <div>• 6 Cover Highlight (Fitur, Pintasan, FAQ, dll)</div>
                    <div>• 3 Story Fitur (Multi-dompet, Smart Input, PDF)</div>
                    <div>• 3 Story Pintasan (Action Button, Siri, Token)</div>
                    <div>• 3 Story FAQ (Web PWA, Pasca-trial, Daftar)</div>
                    <div>• 3 Story Privasi (Zero link, Hak data, Gemini)</div>
                    <div>• 3 Story Trial (Fitur Pro, Bebas kartu, CTA)</div>
                    <div>• 6 Story Templates (3 tema pengantar &amp; stiker)</div>
                  </div>
                </div>
                <a
                  href="/instagram/zips/norden-highlights-bundle.zip"
                  download="norden-highlights-bundle.zip"
                  className="w-full text-center px-4 py-2.5 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all"
                >
                  Unduh ZIP Highlights &darr;
                </a>
              </div>

              {/* Bundle 3: Interactive Stories */}
              <div className="bg-white border-[4px] border-black shadow-[6px_6px_0px_0px_#000] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      STORIES 9:16
                    </span>
                    <span className="text-xs font-black text-neutral-500">6 SLIDE</span>
                  </div>
                  <h3 className="text-lg font-black uppercase mb-2">
                    Template Story Interaktif
                  </h3>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    3 tema template Instagram Story vertikal (1080×1920 px). Masing-masing terdiri dari slide cover pengantar dan slide interaktif stiker polling/tips/link.
                  </p>
                  <div className="flex flex-col gap-1.5 mb-6 text-[11px] font-bold text-neutral-700 bg-[#FAF9F5] p-3 border-[2px] border-black">
                    <div>• Tema 1: Polling Kopi (Cover + Stiker 4 Pilihan)</div>
                    <div>• Tema 2: Tips Kebocoran Halus (Cover + Slider Reaksi)</div>
                    <div>• Tema 3: Action Button iPhone (Cover + Link Stiker)</div>
                  </div>
                </div>
                <a
                  href="/instagram/zips/norden-interactive-stories.zip"
                  download="norden-interactive-stories.zip"
                  className="w-full text-center px-4 py-2.5 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] transition-all"
                >
                  Unduh ZIP Story Interaktif &darr;
                </a>
              </div>
            </div>

            {/* Markdown Docs Reference */}
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-[#bbf7d0] border-[2px] border-black font-black text-[11px] uppercase tracking-wider text-emerald-950">
                  DOKUMENTASI NASKAH
                </span>
                <span className="font-black text-sm uppercase">PANDUAN COPYWRITING RESMI</span>
              </div>
              <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                Naskah copy, susunan headline dua baris, panduan stiker Instagram, dan checklist kepatuhan brand tersedia dalam format Markdown:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="/instagram/HIGHLIGHTS_AND_STORIES_GUIDE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-[#FAF9F5] border-[2px] border-black font-mono text-xs font-bold hover:bg-[#FFE066] transition-colors flex items-center justify-between"
                >
                  <span>HIGHLIGHTS_AND_STORIES_GUIDE.md</span>
                  <span>&rarr;</span>
                </a>
                <a
                  href="/instagram/CAROUSEL_ADVANCED_GUIDE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-[#FAF9F5] border-[2px] border-black font-mono text-xs font-bold hover:bg-[#FFE066] transition-colors flex items-center justify-between"
                >
                  <span>CAROUSEL_ADVANCED_GUIDE.md</span>
                  <span>&rarr;</span>
                </a>
                <a
                  href="/instagram/INSTAGRAM_GUIDE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-[#FAF9F5] border-[2px] border-black font-mono text-xs font-bold hover:bg-[#FFE066] transition-colors flex items-center justify-between"
                >
                  <span>INSTAGRAM_GUIDE.md</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
        /* Main Content Grid */
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
              ) : activeTab === 'highlights' ? (
                /* HIGHLIGHTS & STORY VIEWER (9:16) */
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2.5px] border-black pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm uppercase tracking-wider">
                        {activeHighlightItem.title}
                      </span>
                      <span
                        className="text-[11px] font-black px-2 py-0.5 border-[1.5px] border-black"
                        style={{ backgroundColor: activeHighlight.tagBg }}
                      >
                        {activeHighlightItem.badge}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1 border-[2px] border-black">
                      <button
                        type="button"
                        onClick={() => setActiveHighlightSlideIdx(-1)}
                        className={`px-2 py-1 text-[11px] font-black uppercase transition-all ${
                          activeHighlightSlideIdx === -1
                            ? 'bg-[#FFE066] border-[1.5px] border-black shadow-[2px_2px_0px_#000]'
                            : 'bg-transparent text-neutral-600 hover:text-black'
                        }`}
                      >
                        ● Cover
                      </button>
                      {activeHighlight.stories.map((st, sIdx) => (
                        <button
                          key={st.slideNumber}
                          type="button"
                          onClick={() => setActiveHighlightSlideIdx(sIdx)}
                          className={`px-2 py-1 text-[11px] font-black uppercase transition-all ${
                            activeHighlightSlideIdx === sIdx
                              ? 'bg-[#FFE066] border-[1.5px] border-black shadow-[2px_2px_0px_#000]'
                              : 'bg-transparent text-neutral-600 hover:text-black'
                          }`}
                        >
                          Story {st.slideNumber}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative w-full flex items-center justify-center bg-[#FAF9F5] border-[3px] border-black overflow-hidden shadow-inner p-2 sm:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeHighlightItem.src}
                      alt={activeHighlightItem.title}
                      className="w-full object-contain max-h-[600px] aspect-[9/16] border-[2px] border-black/20"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-neutral-700">
                      {activeHighlightItem.description}
                    </p>
                    <a
                      href={activeHighlightItem.src}
                      download={activeHighlightItem.downloadName}
                      className="shrink-0 px-4 py-2 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                      Download PNG (9:16) &darr;
                    </a>
                  </div>
                </>
              ) : activeTab === 'stories' ? (
                /* INTERACTIVE STORY VIEWER (9:16) */
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-[2.5px] border-black pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm uppercase tracking-wider">
                        {activeTheme.name}: {activeThemeSlide.label}
                      </span>
                      <span
                        className="text-[11px] font-black px-2 py-0.5 border-[1.5px] border-black"
                        style={{ backgroundColor: activeTheme.tagBg }}
                      >
                        {activeTheme.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-neutral-100 p-1 border-[2px] border-black">
                      {activeTheme.slides.map((sl, sIdx) => (
                        <button
                          key={sl.slideNumber}
                          type="button"
                          onClick={() => setActiveStorySlideIdx(sIdx)}
                          className={`px-2 py-1 text-[11px] font-black uppercase transition-all ${
                            activeStorySlideIdx === sIdx
                              ? 'bg-[#FFE066] border-[1.5px] border-black shadow-[2px_2px_0px_#000]'
                              : 'bg-transparent text-neutral-600 hover:text-black'
                          }`}
                        >
                          Slide {sl.slideNumber}: {sl.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative w-full flex items-center justify-center bg-[#FAF9F5] border-[3px] border-black overflow-hidden shadow-inner p-2 sm:p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeThemeSlide.src}
                      alt={activeThemeSlide.title}
                      className="w-full object-contain max-h-[600px] aspect-[9/16] border-[2px] border-black/20"
                    />
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-xs font-bold text-neutral-700">
                      {activeThemeSlide.description}
                    </p>
                    <a
                      href={activeThemeSlide.src}
                      download={activeThemeSlide.src.split('/').pop()}
                      className="shrink-0 px-4 py-2 bg-[#bbf7d0] border-[2.5px] border-black shadow-[3px_3px_0px_0px_#000] font-black text-xs uppercase tracking-wider hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
                    >
                      Download Story Template &darr;
                    </a>
                  </div>
                </>
              ) : (
                /* CAROUSEL & SQUARE & CHEATSHEET VIEWER */
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
                        activeTab === 'carousel' || activeTab === 'advanced' || activeTab === 'cheatsheet' ? 'max-h-[600px] aspect-[4/5]' : 'max-h-[500px] aspect-square'
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

            {/* Cheatsheet Navigator */}
            {activeTab === 'cheatsheet' && (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                    PILIH SLIDE CHEAT SHEET (5 SLIDE):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeCheatsheetIdx === 0}
                      onClick={() => setActiveCheatsheetIdx((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000]"
                    >
                      &larr; Prev
                    </button>
                    <span className="font-black text-xs">
                      {activeCheatsheetIdx + 1} / {CHEATSHEET_SLIDES.length}
                    </span>
                    <button
                      type="button"
                      disabled={activeCheatsheetIdx === CHEATSHEET_SLIDES.length - 1}
                      onClick={() => setActiveCheatsheetIdx((prev) => Math.min(CHEATSHEET_SLIDES.length - 1, prev + 1))}
                      className="px-3 py-1 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000]"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {CHEATSHEET_SLIDES.map((slide, idx) => {
                    const isSelected = activeCheatsheetIdx === idx;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveCheatsheetIdx(idx)}
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

            {/* Highlights Navigator */}
            {activeTab === 'highlights' && (
              <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                    PILIH KATEGORI SOROTAN (6 COVER HIGHLIGHT):
                  </span>
                  <span className="text-[11px] font-black text-neutral-500">
                    Circle-Safe 600×600 px
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {HIGHLIGHTS_DATA.map((hl, idx) => {
                    const isSelected = activeHighlightIdx === idx;
                    return (
                      <button
                        key={hl.id}
                        type="button"
                        onClick={() => {
                          setActiveHighlightIdx(idx);
                          setActiveHighlightSlideIdx(-1);
                        }}
                        className={`p-1.5 sm:p-2 border-[2.5px] border-black text-left flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-[#FFE066] shadow-[4px_4px_0px_0px_#000] -translate-y-1'
                            : 'bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={hl.coverSrc}
                          alt={hl.name}
                          className="w-full aspect-square object-cover rounded-full border-[2px] border-black"
                        />
                        <span className="text-[11px] font-black uppercase truncate text-center">
                          {hl.icon} {hl.id.replace('hl-', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#FAF9F5] border-[2.5px] border-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      SLIDE DALAM SOROTAN {activeHighlight.name.toUpperCase()}:
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500">
                      1 Cover + {activeHighlight.stories.length} Slide Story
                    </span>
                  </div>
                  <div className={`grid gap-2 ${activeHighlight.stories.length > 3 ? 'grid-cols-4 sm:grid-cols-7' : 'grid-cols-4'}`}>
                    <button
                      type="button"
                      onClick={() => setActiveHighlightSlideIdx(-1)}
                      className={`p-1.5 border-[2px] border-black flex flex-col items-center gap-1 text-center transition-all ${
                        activeHighlightSlideIdx === -1
                          ? 'bg-[#FFE066] shadow-[3px_3px_0px_#000] -translate-y-0.5'
                          : 'bg-white shadow-[1.5px_1.5px_0px_#000] hover:bg-neutral-100'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeHighlight.coverSrc}
                        alt="Cover"
                        className="w-full aspect-[9/16] object-cover border border-black"
                      />
                      <span className="text-[10px] font-black uppercase truncate">
                        Cover
                      </span>
                    </button>
                    {activeHighlight.stories.map((st, sIdx) => {
                      const isSelected = activeHighlightSlideIdx === sIdx;
                      return (
                        <button
                          key={st.slideNumber}
                          type="button"
                          onClick={() => setActiveHighlightSlideIdx(sIdx)}
                          className={`p-1.5 border-[2px] border-black flex flex-col items-center gap-1 text-center transition-all ${
                            isSelected
                              ? 'bg-[#FFE066] shadow-[3px_3px_0px_#000] -translate-y-0.5'
                              : 'bg-white shadow-[1.5px_1.5px_0px_#000] hover:bg-neutral-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={st.src}
                            alt={st.title}
                            className="w-full aspect-[9/16] object-cover border border-black"
                          />
                          <span className="text-[10px] font-black uppercase truncate">
                            #{st.slideNumber}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Stories Navigator */}
            {activeTab === 'stories' && (
              <div className="w-full flex flex-col gap-4">
                <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                  PILIH TEMA STORY INTERAKTIF (3 TEMA • MASING-MASING 2 SLIDE):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {INTERACTIVE_THEMES.map((theme, idx) => {
                    const isSelected = activeStoryThemeIdx === idx;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setActiveStoryThemeIdx(idx);
                          setActiveStorySlideIdx(0);
                        }}
                        className={`p-2.5 border-[2.5px] border-black text-left flex flex-col gap-2 transition-all ${
                          isSelected
                            ? 'bg-[#FFE066] shadow-[4px_4px_0px_0px_#000] -translate-y-1'
                            : 'bg-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 border border-black uppercase"
                            style={{ backgroundColor: theme.tagBg }}
                          >
                            {theme.category}
                          </span>
                          <span className="text-[10px] font-bold text-neutral-600">
                            2 Slide
                          </span>
                        </div>
                        <span className="text-xs font-black uppercase line-clamp-1">
                          {theme.name}
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-black/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={theme.slides[0].src}
                            alt="Cover"
                            className="w-full aspect-[9/16] object-cover border border-black"
                          />
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={theme.slides[1].src}
                            alt="Stiker"
                            className="w-full aspect-[9/16] object-cover border border-black"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#FAF9F5] border-[2.5px] border-black">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider">
                      SLIDE DALAM {activeTheme.name.toUpperCase()}:
                    </span>
                    <span className="text-[11px] font-bold text-neutral-500">
                      2 Slide Vertikal (1080×1920 px)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {activeTheme.slides.map((sl, sIdx) => {
                      const isSelected = activeStorySlideIdx === sIdx;
                      return (
                        <button
                          key={sl.slideNumber}
                          type="button"
                          onClick={() => setActiveStorySlideIdx(sIdx)}
                          className={`p-2 border-[2px] border-black flex items-center gap-3 text-left transition-all ${
                            isSelected
                              ? 'bg-[#FFE066] shadow-[3px_3px_0px_#000] -translate-y-0.5'
                              : 'bg-white shadow-[1.5px_1.5px_0px_#000] hover:bg-neutral-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={sl.src}
                            alt={sl.title}
                            className="w-12 aspect-[9/16] object-cover border border-black shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black uppercase">
                              Slide {sl.slideNumber}: {sl.label}
                            </span>
                            <span className="text-[10px] font-bold text-neutral-600 truncate">
                              {sl.title}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Carousel Navigator (if Advanced active) */}
            {activeTab === 'advanced' && (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs uppercase tracking-wider text-neutral-600">
                    PILIH SLIDE (20 SLIDE CAROUSEL):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeAdvancedSlideIdx === 0}
                      onClick={() => setActiveAdvancedSlideIdx((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000]"
                    >
                      &larr; Prev
                    </button>
                    <span className="font-black text-xs">
                      {activeAdvancedSlideIdx + 1} / {ADVANCED_CAROUSEL_SLIDES.length}
                    </span>
                    <button
                      type="button"
                      disabled={activeAdvancedSlideIdx === ADVANCED_CAROUSEL_SLIDES.length - 1}
                      onClick={() => setActiveAdvancedSlideIdx((prev) => Math.min(ADVANCED_CAROUSEL_SLIDES.length - 1, prev + 1))}
                      className="px-3 py-1 bg-white border-[2px] border-black font-black text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-[2px_2px_0px_#000]"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {ADVANCED_CAROUSEL_SLIDES.map((slide, idx) => {
                    const isSelected = activeAdvancedSlideIdx === idx;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActiveAdvancedSlideIdx(idx)}
                        className={`p-1 border-[2px] border-black text-left flex flex-col gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#FFE066] shadow-[3px_3px_0px_0px_#000] -translate-y-1'
                            : 'bg-white shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-neutral-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.src}
                          alt={slide.name}
                          className="w-full aspect-[4/5] object-cover border border-black"
                        />
                        <span className="text-[9px] font-black uppercase truncate text-center w-full">
                          {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
            {activeTab === 'cheatsheet' ? (
              /* CHEATSHEET ACTIONS & CAPTIONS */
              <>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                        CAROUSEL ASET
                      </span>
                      <span className="font-black text-sm uppercase">UNDUH 5 SLIDE CHEAT SHEET</span>
                    </div>
                    <a
                      href="/instagram/zips/norden-cheatsheet-feed.zip"
                      download="norden-cheatsheet-feed.zip"
                      className="px-2.5 py-1 bg-[#bbf7d0] border-[1.5px] border-black font-black text-xs uppercase hover:bg-[#86efac] transition-colors"
                    >
                      📦 ZIP (5 Slide) &darr;
                    </a>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Format 4:5 Portrait (1080×1350 px). Dirancang untuk edukasi praktis dan save &amp; share tinggi:
                  </p>

                  <div className="flex flex-col gap-2">
                    {CHEATSHEET_SLIDES.map((s, idx) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 bg-[#FAF9F5] border-[2px] border-black"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs px-2 py-0.5 bg-[#FFE066] border border-black">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-xs truncate max-w-[190px]">{s.title}</span>
                        </div>
                        <a
                          href={s.src}
                          download={`cheatsheet-slide-${idx + 1}.png`}
                          className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066] transition-colors"
                        >
                          PNG &darr;
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200">
                    <a
                      href="/instagram/HIGHLIGHTS_AND_STORIES_GUIDE.md"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-[2px] border-black shadow-[3px_3px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#FFE066] transition-colors"
                    >
                      Buka Panduan Cheatsheet &amp; Highlights MD &rarr;
                    </a>
                  </div>
                </div>

                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#bfdbfe] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                        CAPTION INSTAGRAM
                      </span>
                      <span className="font-black text-sm uppercase">CHEAT SHEET SMART INPUT</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(CHEATSHEET_CAPTION)}
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
                      value={CHEATSHEET_CAPTION}
                      className="w-full p-3 bg-[#FAF9F5] border-[2.5px] border-black font-mono text-xs font-semibold leading-relaxed resize-none focus:outline-none"
                    />
                  </div>
                </div>
              </>
            ) : activeTab === 'highlights' ? (
              /* HIGHLIGHTS ACTIONS & GUIDES */
              <>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-2 py-0.5 border-[2px] border-black font-black text-[11px] uppercase tracking-wider"
                        style={{ backgroundColor: activeHighlight.tagBg }}
                      >
                        {activeHighlight.icon} {activeHighlight.id.replace('hl-', '').toUpperCase()}
                      </span>
                      <span className="font-black text-sm uppercase">
                        ASET ({activeHighlight.stories.length + 1} FILE)
                      </span>
                    </div>
                    <a
                      href="/instagram/zips/norden-highlights-bundle.zip"
                      download="norden-highlights-bundle.zip"
                      className="px-2.5 py-1 bg-[#bbf7d0] border-[1.5px] border-black font-black text-xs uppercase hover:bg-[#86efac] transition-colors"
                    >
                      📦 ZIP (27 File) &darr;
                    </a>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Setiap sorotan terdiri dari 1 Cover Circle-Safe (600×600 center) dan {activeHighlight.stories.length} Slide Story konten vertikal (9:16 • 1080×1920):
                  </p>

                  <div className="max-h-[320px] overflow-y-auto pr-1 flex flex-col gap-2 border-[2px] border-black p-2 bg-[#FAF9F5]">
                    <div className="flex items-center justify-between p-2 bg-white border-[1.5px] border-black">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs px-2 py-0.5 bg-[#FFE066] border border-black">
                          COVER
                        </span>
                        <span className="font-bold text-xs truncate max-w-[180px]">
                          Cover Sampul ({activeHighlight.name})
                        </span>
                      </div>
                      <a
                        href={activeHighlight.coverSrc}
                        download={`cover-${activeHighlight.id.replace('hl-', '')}.png`}
                        className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066] transition-colors"
                      >
                        PNG &darr;
                      </a>
                    </div>

                    {activeHighlight.stories.map((st) => (
                      <div
                        key={st.slideNumber}
                        className="flex items-center justify-between p-2 bg-white border-[1.5px] border-black"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs px-2 py-0.5 bg-[#bbf7d0] border border-black">
                            STORY {st.slideNumber}
                          </span>
                          <span className="font-bold text-xs truncate max-w-[180px]">
                            {st.title}
                          </span>
                        </div>
                        <a
                          href={st.src}
                          download={st.src.split('/').pop()}
                          className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066] transition-colors"
                        >
                          PNG &darr;
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200">
                    <a
                      href="/instagram/HIGHLIGHTS_AND_STORIES_GUIDE.md"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#bbf7d0] border-[2px] border-black shadow-[3px_3px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#86efac] transition-colors"
                    >
                      Buka Panduan Lengkap Highlights MD &rarr;
                    </a>
                  </div>
                </div>

                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 bg-[#bbf7d0] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      CARA SETTING HIGHLIGHT
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(`Cara Pasang Highlight Norden Finance:\n1. Unggah ${activeHighlight.stories.length} story ke Instagram Stories akun @norden.finance.\n2. Buka story, tekan icon "Sorotan / Highlight" di pojok bawah.\n3. Masukkan ke sorotan "${activeHighlight.name.toUpperCase()}".\n4. Tekan Edit Sorotan > Edit Sampul, pilih cover-${activeHighlight.id.replace('hl-', '')}.png.\n5. Badge Neobrutalism otomatis pas tepat di dalam lingkaran crop Instagram!`)}
                      className="px-2.5 py-1 bg-white border-[1.5px] border-black font-black text-[11px] hover:bg-[#FFE066]"
                    >
                      Salin Instruksi
                    </button>
                  </div>
                  <div className="p-3 bg-[#FAF9F5] border-[2px] border-black flex flex-col gap-2 font-mono text-xs leading-relaxed">
                    <div><strong>1. Unggah Story:</strong> Posting {activeHighlight.stories.length} slide story ke Instagram Stories.</div>
                    <div><strong>2. Buat Sorotan:</strong> Buka story, klik &ldquo;Highlight / Sorotan&rdquo;, beri nama <strong>{activeHighlight.name}</strong>.</div>
                    <div><strong>3. Pasang Cover:</strong> Edit Sorotan &rarr; Edit Sampul &rarr; Pilih <strong>cover-{activeHighlight.id.replace('hl-', '')}.png</strong>.</div>
                    <div className="text-emerald-800 font-bold mt-1">&check; Lingkaran 600px circle-safe otomatis pas tanpa terpotong!</div>
                  </div>
                </div>
              </>
            ) : activeTab === 'stories' ? (
              /* STORIES ACTIONS & INSTRUCTIONS */
              <>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                        STORY TEMPLATES
                      </span>
                      <span className="font-black text-sm uppercase">UNDUH 3 TEMA INTERAKTIF</span>
                    </div>
                    <a
                      href="/instagram/zips/norden-interactive-stories.zip"
                      download="norden-interactive-stories.zip"
                      className="px-2.5 py-1 bg-[#bbf7d0] border-[1.5px] border-black font-black text-xs uppercase hover:bg-[#86efac] transition-colors"
                    >
                      📦 ZIP (6 Slide) &darr;
                    </a>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Template Instagram Story 9:16 (1080×1920 px) dengan slot khusus untuk stiker polling, tips, dan link:
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {INTERACTIVE_THEMES.map((theme, idx) => (
                      <div
                        key={theme.id}
                        className="p-3 bg-[#FAF9F5] border-[2px] border-black flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs px-2 py-0.5 bg-[#FFE066] border border-black">
                              TEMA #{idx + 1}
                            </span>
                            <span className="font-black text-xs truncate max-w-[200px]">{theme.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-neutral-500">{theme.category}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-300">
                          {theme.slides.map((sl) => (
                            <div key={sl.slideNumber} className="flex items-center justify-between p-1.5 bg-white border border-black">
                              <span className="text-[10px] font-bold truncate">#{sl.slideNumber}: {sl.label.split(' ')[0]}</span>
                              <a
                                href={sl.src}
                                download={sl.src.split('/').pop()}
                                className="px-1.5 py-0.5 bg-[#FFE066] border border-black font-black text-[10px] hover:bg-black hover:text-white transition-colors"
                              >
                                PNG &darr;
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200">
                    <a
                      href="/instagram/HIGHLIGHTS_AND_STORIES_GUIDE.md"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-[2px] border-black shadow-[3px_3px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#FFE066] transition-colors"
                    >
                      Buka Panduan Story Interaktif MD &rarr;
                    </a>
                  </div>
                </div>

                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#bbf7d0] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      PETUNJUK STIKER
                    </span>
                    <span className="font-black text-sm uppercase">{activeTheme.category}</span>
                  </div>
                  <div className="p-3 bg-[#FAF9F5] border-[2px] border-black flex flex-col gap-2 font-mono text-xs leading-relaxed">
                    <div className="font-bold text-sm text-black">{activeThemeSlide.title}</div>
                    <div className="text-neutral-700">{activeThemeSlide.description}</div>
                    <div className="mt-2 pt-2 border-t border-neutral-300">
                      <strong>Cara Posting:</strong> {activeThemeSlide.instructions}
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'advanced' ? (
              /* ADVANCED CAROUSEL ACTIONS & CAPTIONS */
              <>
                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#FFE066] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                      CAROUSEL ASET
                    </span>
                    <span className="font-black text-sm uppercase">UNDUH 20 SLIDE FITUR LANJUTAN</span>
                  </div>
                  <p className="text-xs font-bold text-neutral-600 mb-4 leading-relaxed">
                    Format 4:5 Portrait (1080×1350 px). Siap unggah sebagai carousel multi-fitur di Instagram:
                  </p>

                  <div className="max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-2 border-[2px] border-black p-2 bg-[#FAF9F5]">
                    {ADVANCED_CAROUSEL_SLIDES.map((s, idx) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2 bg-white border-[1.5px] border-black"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-black text-xs px-1.5 py-0.5 bg-[#FFE066] border border-black shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-xs truncate max-w-[200px]">{s.title}</span>
                        </div>
                        <a
                          href={s.src}
                          download={`slide-${String(idx + 1).padStart(2, '0')}.png`}
                          className="shrink-0 px-2.5 py-1 bg-[#bbf7d0] border-[1.5px] border-black font-black text-[11px] hover:bg-[#86efac] transition-colors"
                        >
                          PNG &darr;
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t-[2px] border-neutral-200">
                    <a
                      href="/instagram/CAROUSEL_ADVANCED_GUIDE.md"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-[2px] border-black shadow-[3px_3px_0px_#000] font-black text-xs uppercase tracking-wider hover:bg-[#FFE066] transition-colors"
                    >
                      Buka Panduan Copywriting MD &rarr;
                    </a>
                  </div>
                </div>

                <div className="bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_#000] p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#bfdbfe] border-[2px] border-black font-black text-[11px] uppercase tracking-wider">
                        CAPTION INSTAGRAM
                      </span>
                      <span className="font-black text-sm uppercase">20 SLIDE FITUR LANJUTAN</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(ADVANCED_CAROUSEL_CAPTION)}
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
                      value={ADVANCED_CAROUSEL_CAPTION}
                      className="w-full p-3 bg-[#FAF9F5] border-[2.5px] border-black font-mono text-xs font-semibold leading-relaxed resize-none focus:outline-none"
                    />
                  </div>
                </div>
              </>
            ) : activeTab === 'pinned' ? (
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
        )}
      </div>
    </div>
  );
}
