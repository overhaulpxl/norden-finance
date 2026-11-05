'use client';

import { useState } from 'react';
import { completeOnboarding } from '../actions';
import { Loader2, Wallet, ArrowRight, ShieldCheck } from 'lucide-react';
import BrandLogo from '../../components/BrandLogo';
import { formatRupiahInput, parseRupiahInput } from '../../lib/format';

export default function OnboardingClient({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [walletName, setWalletName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!walletName.trim()) {
      setError('Nama dompet/rekening pertama wajib diisi.');
      return;
    }

    setLoading(true);

    const numericBalance = parseRupiahInput(openingBalance);

    const result = await completeOnboarding({
      fullName: fullName.trim(),
      walletName: walletName.trim(),
      openingBalance: numericBalance,
    });

    setLoading(false);
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      setError(result.error || 'Gagal menyelesaikan setup awal. Silakan coba lagi.');
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-black selection:bg-black selection:text-[#FFE066] flex flex-col justify-center items-center p-4 py-12 relative overflow-hidden select-none">

      <style>{`
        .bg-paper-dots {
          background-image: radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* Grid Pattern Background Layer */}
      <div className="absolute inset-0 bg-paper-dots pointer-events-none opacity-80 z-0" />

      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <BrandLogo variant="horizontal" priority className="h-12 sm:h-14 w-auto" />
        </div>

        {/* Setup Card */}
        <div className="brutal-card p-6 sm:p-8 bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_#000]">
          <div className="border-b-[2.5px] border-black pb-3 mb-5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-[2px] border-black bg-[#FFE066] text-[10px] font-black uppercase tracking-widest shadow-[1.5px_1.5px_0px_0px_#000] mb-2">
              <Wallet className="w-3.5 h-3.5" /> Langkah Awal
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-wider">
              Setup Workspace Anda
            </h1>
            <p className="text-xs font-bold text-neutral-500 truncate mt-0.5">
              Akun: {email}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-100 border-[2px] border-black text-red-800 font-bold text-xs uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="onboarding-fullname" className="block text-xs font-black uppercase text-black mb-1.5">
                Nama Lengkap
              </label>
              <input
                id="onboarding-fullname"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold uppercase"
                placeholder="NAMA LENGKAP ANDA"
                required
              />
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Digunakan untuk personalisasi dashboard dan laporan.</p>
            </div>

            <div>
              <label htmlFor="onboarding-wallet" className="block text-xs font-black uppercase text-black mb-1.5">
                Dompet / Rekening Pertama
              </label>
              <input
                id="onboarding-wallet"
                type="text"
                value={walletName}
                onChange={(event) => setWalletName(event.target.value)}
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold uppercase"
                placeholder="CONTOH: CASH, BCA, BNI, ATAU GOPAY"
                required
              />
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Dompet utama untuk mulai mencatat transaksi harian.</p>
            </div>

            <div>
              <label htmlFor="onboarding-balance" className="block text-xs font-black uppercase text-black mb-1.5">
                Saldo Awal Dompet (Rp)
              </label>
              <input
                id="onboarding-balance"
                type="text"
                value={openingBalance}
                onChange={(event) => setOpeningBalance(formatRupiahInput(event.target.value))}
                className="w-full brutal-input px-3 py-2.5 text-xs font-bold"
                inputMode="numeric"
                placeholder="CONTOH: 500.000"
              />
              <p className="text-[10px] font-bold text-neutral-500 mt-1">Menjadi saldo awal dompet dan dasar hitung kekayaan bersih.</p>
            </div>

            {/* Trial Activation Notice */}
            <div className="bg-[#FAF9F5] border-[2px] border-black p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-black">
                <ShieldCheck className="w-4 h-4 text-emerald-700 stroke-[2.5px]" />
                Trial 14 Hari Dimulai Setelah Setup
              </div>
              <p className="text-[11px] font-bold text-neutral-600 leading-relaxed">
                Masa uji coba gratis fitur penuh 14 hari Anda akan aktif begitu tombol di bawah ditekan.
              </p>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full mt-2 py-3.5 brutal-btn bg-[#FFE066] text-black border-[2.5px] border-black text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:bg-yellow-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin text-black" />}
              <span>{loading ? 'Menyiapkan Workspace...' : 'Mulai Pakai Norden'}</span>
              {!loading && <ArrowRight className="w-4 h-4 stroke-[3px]" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
