'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Camera,
  ChevronDown,
  Loader2,
  Send,
  Shield,
  Sparkles,
  Star,
  Wallet,
  MessageCircle,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { submitFeedback } from '../app/actions';
import { useLanguage } from '../lib/i18n';
import { triggerHaptic } from '../lib/haptics';

type HelpTopic = {
  title: string;
  summary: string;
  steps: string[];
  example?: string;
  tip?: string;
  troubleshooting?: string;
};

type HelpCategory = {
  title: string;
  description: string;
  icon: React.ReactNode;
  topics: HelpTopic[];
};

const helpCategoriesId: HelpCategory[] = [
  {
    title: 'Memulai dengan Norden',
    description: 'Dasar penggunaan akun, verifikasi, wallet pertama, dan transaksi pertama.',
    icon: <BookOpen className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara membuat akun',
        summary: 'Buat akun dari halaman Login atau Mulai Sekarang, lalu masuk dengan email aktif.',
        steps: [
          'Buka halaman login.',
          'Pilih daftar akun baru.',
          'Isi nama, email, dan password.',
          'Selesaikan verifikasi jika diminta.',
        ],
        tip: 'Gunakan email yang sering Anda cek karena notifikasi billing dan verifikasi dikirim ke sana.',
      },
      {
        title: 'Cara verifikasi email',
        summary: 'Verifikasi email membantu menjaga akun tetap aman dan siap dipakai lintas perangkat.',
        steps: [
          'Cek inbox email setelah registrasi.',
          'Buka email dari Norden.',
          'Klik tombol verifikasi.',
          'Kembali ke Norden dan login ulang jika sesi belum aktif.',
        ],
        troubleshooting:
          'Jika email belum masuk, cek folder spam atau gunakan tombol kirim ulang verifikasi di halaman login.',
      },
      {
        title: 'Cara membuat wallet pertama',
        summary: 'Wallet adalah tempat saldo disimpan, seperti Cash, BCA, BNI, Dana, atau GoPay.',
        steps: [
          'Masuk ke dashboard.',
          'Buka menu Dompet & Saldo.',
          'Klik tambah wallet.',
          'Isi nama wallet dan saldo awal.',
          'Simpan wallet.',
        ],
        example: 'Contoh: wallet BCA dengan saldo awal Rp 1.500.000.',
      },
      {
        title: 'Cara mencatat transaksi pertama',
        summary: 'Transaksi bisa dicatat cepat lewat Smart Input atau form manual.',
        steps: [
          'Klik tombol Catat Transaksi.',
          'Ketik transaksi dengan bahasa natural.',
          'Pastikan wallet sudah disebut atau tersedia.',
          'Kirim dan cek riwayat transaksi.',
        ],
        example: 'Contoh Smart Input: "25 ribu kopi cash".',
      },
    ],
  },
  {
    title: 'Pencatatan Transaksi',
    description: 'Panduan Smart Input, input manual, transfer antar wallet, dan update saldo.',
    icon: <Sparkles className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara pakai Smart Input',
        summary: 'Smart Input membaca nominal, kategori, catatan, tanggal, dan wallet dari satu kalimat.',
        steps: [
          'Klik Catat Transaksi.',
          'Tulis nominal dan konteks transaksi.',
          'Sebut wallet jika ingin spesifik.',
          'Kirim input dan cek hasil parsing.',
        ],
        example: 'Contoh: "makan siang 45 ribu bca kemarin".',
        tip: 'Semakin jelas wallet dan nominalnya, semakin rapi hasil catatan.',
      },
      {
        title: 'Cara input manual',
        summary: 'Gunakan input manual saat ingin mengatur kategori, tanggal, wallet, atau catatan secara presisi.',
        steps: [
          'Buka form transaksi manual.',
          'Pilih tipe transaksi (Masuk / Keluar / Transfer).',
          'Isi nominal, kategori, wallet, dan tanggal.',
          'Simpan transaksi.',
        ],
      },
      {
        title: 'Cara transfer antar wallet',
        summary: 'Transfer memindahkan saldo dari satu wallet ke wallet lain tanpa dihitung sebagai pengeluaran.',
        steps: [
          'Buka menu Transfer Antar Dompet.',
          'Pilih wallet asal.',
          'Pilih wallet tujuan.',
          'Isi nominal dan simpan.',
        ],
        example: 'Contoh Smart Input: "transfer 500 ribu dari bca ke dana".',
      },
      {
        title: 'Cara update saldo',
        summary: 'Update saldo dipakai saat saldo riil di rekening berbeda dari catatan Norden.',
        steps: [
          'Buka menu Dompet & Saldo.',
          'Klik kartu wallet yang ingin disesuaikan.',
          'Masukkan nominal saldo riil terbaru.',
          'Simpan perubahan.',
        ],
        example: 'Contoh Smart Input: "saldo bca 2 juta".',
      },
    ],
  },
  {
    title: 'Dompet & Saldo',
    description: 'Kelola wallet, edit saldo, arsipkan wallet, dan pahami perubahan saldo.',
    icon: <Wallet className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara membuat wallet baru',
        summary: 'Buat wallet untuk setiap tempat uang yang ingin dipantau.',
        steps: [
          'Buka tab Dompet & Saldo.',
          'Klik + Tambah Dompet.',
          'Isi nama dan saldo awal.',
          'Simpan.',
        ],
        tip: 'Pisahkan wallet penting seperti Cash, rekening bank utama, dan e-wallet belanja.',
      },
      {
        title: 'Cara mengarsipkan dompet',
        summary: 'Arsipkan dompet yang tidak dipakai tanpa menghapus histori transaksi lama.',
        steps: [
          'Buka daftar dompet.',
          'Arahkan kursor / klik ikon tempat sampah.',
          'Pilih Arsipkan.',
          'Dompet dipindahkan ke bagian arsip dan disembunyikan dari pilihan utama.',
        ],
        tip: 'Dompet yang diarsipkan dapat dipulihkan kembali kapan saja dengan 1 klik.',
      },
    ],
  },
  {
    title: 'Budget & Goals',
    description: 'Atur batas pengeluaran, target tabungan, dan proyeksi pencapaian.',
    icon: <Shield className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara membuat budget bulanan',
        summary: 'Budget membantu membatasi pengeluaran kategori tertentu dalam satu bulan.',
        steps: [
          'Buka Target & Utang atau area Budget.',
          'Pilih kategori pengeluaran.',
          'Isi limit nominal bulanan.',
          'Simpan budget.',
        ],
        example: 'Contoh: Makanan Rp 1.500.000 per bulan.',
      },
      {
        title: 'Cara membuat target tabungan',
        summary: 'Target tabungan membantu melacak dana yang ingin dicapai dengan grafik proyeksi.',
        steps: [
          'Buka Target & Utang.',
          'Klik + Target Baru.',
          'Isi nama target dan target nominal (Rp).',
          'Perbarui progres saat Anda menabung.',
        ],
      },
    ],
  },
  {
    title: 'Laporan & Ekspor Data',
    description: 'Unduh data CSV, JSON, atau PDF report bulanan.',
    icon: <Camera className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'Cara download laporan PDF',
        summary: 'PDF report merangkum transaksi, kategori, wallet, dan grafik insight bulanan.',
        steps: [
          'Buka tab Laporan & Analisis.',
          'Cari bagian Ekspor Data & Laporan.',
          'Klik tombol Laporan PDF.',
          'File otomatis terunduh ke perangkat Anda.',
        ],
      },
      {
        title: 'Ekspor cadangan CSV / JSON',
        summary: 'Unduh seluruh riwayat transaksi untuk dibuka di Excel, Google Sheets, atau aplikasi lain.',
        steps: [
          'Buka tab Laporan & Analisis.',
          'Klik tombol CSV atau JSON.',
          'Buka file hasil unduhan di spreadsheet pilihan Anda.',
        ],
      },
    ],
  },
];

const helpCategoriesEn: HelpCategory[] = [
  {
    title: 'Getting Started with Norden',
    description: 'Account basics, verification, first wallet, and your first transaction.',
    icon: <BookOpen className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'How to create an account',
        summary: 'Sign up from the Login or Get Started page with an active email address.',
        steps: [
          'Open the login page.',
          'Choose sign up for a new account.',
          'Enter name, email, and password.',
          'Complete verification if prompted.',
        ],
        tip: 'Use an email you check regularly as billing and verification notifications go there.',
      },
      {
        title: 'How to create your first wallet',
        summary: 'Wallets represent where your funds reside, like Cash, Bank Account, or E-Wallet.',
        steps: [
          'Go to dashboard.',
          'Open Wallets & Accounts.',
          'Click + Add Wallet.',
          'Enter wallet name and initial balance.',
          'Save wallet.',
        ],
        example: 'Example: BCA wallet with initial balance Rp 1,500,000.',
      },
      {
        title: 'Recording your first transaction',
        summary: 'Record fast using natural language Smart Input or explicit manual entry.',
        steps: [
          'Click New Transaction button.',
          'Type transaction in natural language.',
          'Mention wallet name if specific.',
          'Submit and review your transaction table.',
        ],
        example: 'Example Smart Input: "25k coffee cash".',
      },
    ],
  },
  {
    title: 'Transaction Recording',
    description: 'Smart Input guide, manual form, wallet transfers, and balance syncing.',
    icon: <Sparkles className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'How to use Smart Input',
        summary: 'Smart Input extracts amount, category, notes, date, and wallet from a single sentence.',
        steps: [
          'Click New Transaction.',
          'Type amount and context.',
          'Optionally name the wallet.',
          'Submit and check parsed details.',
        ],
        example: 'Example: "lunch 45k bca yesterday".',
      },
      {
        title: 'Inter-wallet transfers',
        summary: 'Transfers shift money from one wallet to another without counting as an expense.',
        steps: [
          'Open Transfer Between Wallets.',
          'Select source wallet.',
          'Select destination wallet.',
          'Enter amount and confirm.',
        ],
      },
    ],
  },
  {
    title: 'Wallets & Balances',
    description: 'Manage accounts, update balances, archive wallets, and review logs.',
    icon: <Wallet className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'How to archive wallets',
        summary: 'Archive unused wallets without losing historical transaction records.',
        steps: [
          'Open Wallets & Accounts.',
          'Hover or tap trash icon on the wallet card.',
          'Click Archive.',
          'Wallet moves to archived section and hides from default selection.',
        ],
        tip: 'Archived wallets can be restored with 1 click at any time.',
      },
    ],
  },
  {
    title: 'Budgets & Goals',
    description: 'Set spending limits, saving targets, and view completion projections.',
    icon: <Shield className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'How to create saving goals',
        summary: 'Track specific financial targets with automated monthly surplus projections.',
        steps: [
          'Open Goals & Debts.',
          'Click + New Goal.',
          'Enter goal name and target amount (Rp).',
          'Update progress as you save.',
        ],
      },
    ],
  },
  {
    title: 'Reports & Exports',
    description: 'Download CSV, JSON backups, or monthly PDF summary reports.',
    icon: <Camera className="h-5 w-5 stroke-[2.5px]" />,
    topics: [
      {
        title: 'How to download PDF report',
        summary: 'The PDF report condenses monthly transactions, categories, and visual cashflow.',
        steps: [
          'Open Reports & Analytics.',
          'Locate Exports & Reports card.',
          'Click PDF Report button.',
          'File downloads automatically to your device.',
        ],
      },
    ],
  },
];

function TopicAccordion({
  topic,
  isOpen,
  onToggle,
}: {
  topic: HelpTopic;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_#000]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-750 cursor-pointer"
        aria-expanded={isOpen}
      >
        <div>
          <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-black dark:text-white">
            {topic.title}
          </p>
          <p className="mt-1 text-xs font-bold leading-relaxed text-neutral-600 dark:text-neutral-400">
            {topic.summary}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="border-t-2 border-black dark:border-neutral-700 bg-[#FAF9F5] dark:bg-neutral-900 p-4 space-y-3">
          <ol className="space-y-2.5">
            {topic.steps.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 text-xs font-bold leading-relaxed text-neutral-700 dark:text-neutral-300"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-black rounded bg-black text-[10px] font-black text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          {(topic.example || topic.tip || topic.troubleshooting) && (
            <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {topic.example && (
                <div className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-[1px_1px_0px_0px_#000]">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-black dark:text-white">
                    Contoh / Example
                  </p>
                  <p className="text-xs font-bold leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {topic.example}
                  </p>
                </div>
              )}
              {topic.tip && (
                <div className="border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 p-3 rounded-lg shadow-[1px_1px_0px_0px_#000]">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                    Tips
                  </p>
                  <p className="text-xs font-bold leading-relaxed text-emerald-950 dark:text-emerald-200">
                    {topic.tip}
                  </p>
                </div>
              )}
              {topic.troubleshooting && (
                <div className="border-2 border-black dark:border-neutral-700 bg-red-100 dark:bg-red-950/80 p-3 rounded-lg shadow-[1px_1px_0px_0px_#000]">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-red-950 dark:text-red-200">
                    Troubleshooting
                  </p>
                  <p className="text-xs font-bold leading-relaxed text-red-950 dark:text-red-200">
                    {topic.troubleshooting}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const { lang } = useLanguage();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openTopic, setOpenTopic] = useState('Memulai dengan Norden-Cara membuat akun');

  const categories = lang === 'id' ? helpCategoriesId : helpCategoriesEn;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setError(
        lang === 'id' ? 'Ulasan atau umpan balik wajib diisi.' : 'Feedback message is required.'
      );
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    triggerHaptic('medium');

    try {
      const response = await submitFeedback({ rating, message });
      if (response.success) {
        triggerHaptic('success');
        setSuccess(true);
        setMessage('');
        setRating(5);
      } else {
        triggerHaptic('warning');
        setError(
          response.error ||
            (lang === 'id' ? 'Gagal mengirimkan ulasan.' : 'Failed to submit feedback.')
        );
      }
    } catch (err: unknown) {
      triggerHaptic('warning');
      setError(
        err instanceof Error
          ? err.message
          : lang === 'id'
          ? 'Terjadi kesalahan sistem.'
          : 'System error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl select-none space-y-6 animate-in fade-in duration-300 text-black dark:text-white">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
          {lang === 'id' ? 'Pusat Bantuan Norden' : 'Norden Help Center'}
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-bold leading-relaxed text-neutral-600 dark:text-neutral-400">
          {lang === 'id'
            ? 'Panduan singkat mencatat transaksi, mengatur dompet, membaca laporan, dan mengelola keuangan.'
            : 'Quick guides for recording transactions, managing wallets, reading reports, and mastering your finances.'}
        </p>
      </div>

      {/* Support Direct Contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="https://wa.me/6287882924651?text=Halo%20Norden%20Finance,%20saya%20butuh%20bantuan%20terkait%20akun%20atau%20kendala%20aplikasi."
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-[#bbf7d0] dark:hover:bg-neutral-750 transition-colors rounded-2xl shadow-[3px_3px_0px_0px_#000] flex items-start gap-3 group text-black dark:text-white"
        >
          <div className="p-2.5 border-2 border-black rounded-xl bg-[#2ECC71] text-black shadow-[1.5px_1.5px_0px_0px_#000] shrink-0">
            <MessageCircle className="w-5 h-5 text-black stroke-[2.5px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
              <span>{lang === 'id' ? 'Chat WhatsApp Admin' : 'Admin WhatsApp Chat'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black dark:group-hover:text-white" />
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-1">
              {lang === 'id'
                ? 'Bantuan langsung Senin - Minggu (08.00 - 21.00 WIB)'
                : 'Direct support Mon - Sun (08:00 - 21:00 WIB)'}
            </p>
            <span className="text-xs font-mono font-black underline mt-1.5 block">
              +62 878-8292-4651
            </span>
          </div>
        </a>

        <a
          href="mailto:support@nordenfinance.site?subject=Bantuan%20Akun%20Norden%20Finance"
          className="p-4 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-[#bfdbfe] dark:hover:bg-neutral-750 transition-colors rounded-2xl shadow-[3px_3px_0px_0px_#000] flex items-start gap-3 group text-black dark:text-white"
        >
          <div
            className="p-2.5 border-2 border-black rounded-xl text-black shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <Mail className="w-5 h-5 text-black stroke-[2.5px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
              <span>{lang === 'id' ? 'Email Support' : 'Email Support'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black dark:group-hover:text-white" />
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold mt-1">
              {lang === 'id'
                ? 'Bantuan kendala teknis, akun, dan verifikasi'
                : 'Help for technical issues, accounts, and verification'}
            </p>
            <span className="text-xs font-mono font-black underline mt-1.5 block">
              support@nordenfinance.site
            </span>
          </div>
        </a>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <section
            key={category.title}
            className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 sm:p-5 rounded-2xl shadow-[3px_3px_0px_0px_#000]"
          >
            <div className="mb-4 flex items-start gap-3 border-b-2 border-black dark:border-neutral-700 pb-4">
              <div
                className="border border-black p-2 rounded-xl text-black shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
                style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
              >
                {category.icon}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                  {category.title}
                </h3>
                <p className="mt-0.5 text-xs font-bold leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {category.description}
                </p>
              </div>
            </div>
            <div className="space-y-2.5">
              {category.topics.map((topic) => {
                const key = `${category.title}-${topic.title}`;
                return (
                  <TopicAccordion
                    key={key}
                    topic={topic}
                    isOpen={openTopic === key}
                    onToggle={() => {
                      triggerHaptic('light');
                      setOpenTopic((current) => (current === key ? '' : key));
                    }}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Feedback Form */}
      <div className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 sm:p-6 rounded-2xl shadow-[3px_3px_0px_0px_#000]">
        <div className="mb-5 flex items-center gap-3 border-b-2 border-black dark:border-neutral-700 pb-4">
          <div
            className="border border-black p-2 rounded-xl text-black shadow-[1.5px_1.5px_0px_0px_#000] shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
          >
            <Star className="h-5 w-5 fill-yellow-400 stroke-[2.5px] text-yellow-600" />
          </div>
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
            {lang === 'id' ? 'Kirim Ulasan & Masukan' : 'Send Review & Feedback'}
          </h3>
        </div>

        {success && (
          <div className="mb-5 border-2 border-black dark:border-neutral-700 bg-[#bbf7d0] dark:bg-emerald-950/80 text-black dark:text-emerald-200 p-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
            {lang === 'id'
              ? 'Terima kasih! Ulasan Anda berhasil dikirim ke tim pengembang.'
              : 'Thank you! Your feedback has been sent to our developer team.'}
          </div>
        )}

        {error && (
          <div className="mb-5 border-2 border-black bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-200 p-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider">
              {lang === 'id' ? 'Beri Rating Norden Finance' : 'Rate Norden Finance'}
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => {
                    triggerHaptic('selection');
                    setRating(star);
                  }}
                  className="border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 rounded-xl shadow-[1.5px_1.5px_0px_0px_#000] transition-all cursor-pointer"
                  aria-label={`Beri rating ${star}`}
                >
                  <Star
                    className={`h-5 w-5 stroke-[2px] ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-600'
                        : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback-message"
              className="mb-2 block text-xs font-black uppercase tracking-wider"
            >
              {lang === 'id' ? 'Tulis Masukan atau Testimoni' : 'Write Feedback or Testimonial'}
            </label>
            <textarea
              id="feedback-message"
              rows={4}
              placeholder={
                lang === 'id'
                  ? 'Contoh: Fitur pencatatan dan split bill sangat membantu pengeluaran harian saya...'
                  : 'E.g.: The quick input and split bill features really streamlined my daily bookkeeping...'
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full brutal-input p-3 text-xs font-bold bg-white dark:bg-neutral-800"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-black px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer disabled:opacity-50 text-black"
            style={{
              backgroundColor: 'var(--theme-accent, #FFE066)',
              color: 'var(--theme-accent-text, #000000)',
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                <span>{lang === 'id' ? 'Mengirim...' : 'Sending...'}</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 stroke-[2.5px] text-black" />
                <span>{lang === 'id' ? 'Kirim Ulasan' : 'Submit Feedback'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
