import Link from 'next/link';
import BrandLogo from '../../../components/BrandLogo';
import { getTrialDays } from '../../../lib/data/loaders';
import { ArrowLeft, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const trialDays = await getTrialDays();

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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-[2px] border-black bg-[#FFE066] text-[10px] font-black uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000] mb-3">
              <Shield className="w-3.5 h-3.5" /> Dokumen Hukum
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">Syarat dan Ketentuan Layanan</h1>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-1">Terakhir diperbarui: Oktober 2026</p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm font-bold text-neutral-800 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">1. Pendahuluan & Sifat Layanan</h2>
              <p>
                Selamat datang di Norden Finance. Norden Finance adalah perangkat lunak pencatatan dan pengelolaan keuangan pribadi (Personal Finance Operating System).
              </p>
              <p>
                Seluruh data, analisis, grafik, skor kesehatan finansial, dan estimasi arus kas yang ditampilkan adalah alat bantu pencatatan informasi dan bukan merupakan nasihat finansial, konsultasi investasi, perpajakan, atau opini hukum resmi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">2. Akun dan Tanggung Jawab Pengguna</h2>
              <p>
                Pengguna bertanggung jawab penuh atas keakuratan data transaksi, saldo dompet, rincian utang piutang, dan bukti pembayaran yang diunggah ke dalam sistem.
              </p>
              <p>
                Pengguna berkewajiban menjaga kerahasiaan kata sandi dan kredensial akun masing-masing.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">3. Periode Uji Coba (Trial) dan Akses Pro</h2>
              <p>
                Pengguna baru berhak mendapatkan masa uji coba gratis (Trial) fitur penuh selama {trialDays} hari kalender yang dihitung sejak berhasil menyelesaikan proses onboarding pertama kali.
              </p>
              <p>
                Setelah masa uji coba berakhir tanpa adanya langganan berbayar, akun akan otomatis beralih ke paket Free Basic. Catatan keuangan dan saldo dompet pengguna tetap tersimpan utuh dan dapat diakses.
              </p>
              <p>
                Akses Norden Pro berbayar (bulanan atau tahunan) diaktifkan setelah verifikasi dan persetujuan bukti pembayaran oleh Administrator.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">4. Pembayaran dan Verifikasi</h2>
              <p>
                Pembayaran dilakukan melalui transfer manual (BCA, BNI, atau QRIS) sesuai nominal paket yang berlaku. Pengguna wajib mengunggah bukti transfer yang valid dan terbaca jelas.
              </p>
              <p>
                Norden Finance berhak menolak bukti pembayaran yang tidak sesuai nominal, tidak valid, atau tidak dapat diverifikasi keasliannya.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-black uppercase tracking-wider">5. Pembatasan dan Penghentian Akses</h2>
              <p>
                Norden Finance berhak membatasi akses, menolak permohonan pembayaran, atau menangguhkan akun pengguna yang terbukti melakukan manipulasi sistem, penyalahgunaan token shortcut, atau pelanggaran hukum yang berlaku.
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
              href="/legal/privacy"
              className="text-xs font-bold text-neutral-600 hover:text-black underline uppercase tracking-wider"
            >
              Lihat Kebijakan Privasi
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
