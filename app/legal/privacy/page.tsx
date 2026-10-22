import Link from 'next/link';
import BrandLogo from '../../../components/BrandLogo';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black select-none py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 border-[2px] border-black bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#000] text-xs font-black uppercase tracking-wider transition-all"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3px]" /> Beranda
          </Link>
          <BrandLogo variant="horizontal" priority className="h-8 w-auto" />
        </div>

        {/* Content Card */}
        <article className="brutal-card p-6 sm:p-10 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000]">
          <div className="border-b-[3px] border-black pb-4 mb-6">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-[2px] border-black bg-[#bbf7d0] text-[10px] font-black uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000] mb-3">
              <Lock className="w-3.5 h-3.5" /> Perlindungan Privasi
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">Kebijakan Privasi</h1>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-1">Terakhir diperbarui: Oktober 2026</p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm font-bold text-neutral-800 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">1. Data yang Kami Simpan</h2>
              <p>
                Norden Finance menyimpan informasi akun yang Anda berikan, meliputi: alamat email, nama lengkap, data transaksi keuangan, saldo dompet, pos anggaran, target tabungan, catatan utang dan piutang, serta preferensi tata letak dashboard.
              </p>
              <p>
                Data tersebut disimpan murni untuk menyediakan fungsionalitas pencatatan keuangan pribadi Anda.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">2. Isolasi dan Keamanan Data Pengguna</h2>
              <p>
                Setiap data catatan finansial Anda diisolasi secara ketat berdasarkan identitas pengguna unik (Firebase UID). Pengguna lain tidak memiliki akses terhadap data keuangan Anda.
              </p>
              <p>
                Penyimpanan data dilakukan menggunakan database PostgreSQL yang aman di cloud, dan otentikasi diamankan melalui protokol Google Firebase Authentication.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">3. Pemrosesan Bukti Pembayaran & Struk</h2>
              <p>
                Bukti transfer pembayaran langganan disimpan di Firebase Storage untuk tujuan verifikasi oleh Administrator.
              </p>
              <p>
                Jika Anda menggunakan fitur pemindaian struk (Receipt Scanner), gambar struk diproses secara aman melalui Google Generative AI hanya untuk mengekstraksi rincian transaksi (nama toko, tanggal, nominal, item).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">4. Hak Pengguna & Penghapusan Data</h2>
              <p>
                Anda memegang kendali penuh atas data Anda:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Ekspor Data</strong>: Anda dapat mengunduh seluruh riwayat transaksi kapan saja dalam format CSV, JSON, atau laporan PDF bulanan.</li>
                <li><strong>Reset Keuangan</strong>: Anda dapat membersihkan seluruh catatan transaksi dan dompet tanpa menghapus akun atau membatalkan langganan.</li>
                <li><strong>Hapus Akun</strong>: Anda dapat menghapus seluruh profil dan data akun Anda secara permanen dari menu Pengaturan.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">5. Kontak Privasi</h2>
              <p>
                Jika Anda memiliki pertanyaan seputar privasi atau pengelolaan data akun Norden Finance Anda, silakan hubungi kami melalui menu Bantuan di dalam aplikasi atau kanal resmi WhatsApp yang tertera.
              </p>
            </section>
          </div>

          <div className="border-t-[2px] border-black pt-6 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              href="/"
              className="brutal-btn px-4 py-2 text-xs font-black uppercase tracking-wider w-full sm:w-auto text-center"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/legal/terms"
              className="text-xs font-bold text-neutral-600 hover:text-black underline uppercase tracking-wider"
            >
              Lihat Syarat & Ketentuan
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
