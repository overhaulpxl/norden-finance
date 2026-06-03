import React, { useState } from 'react';
/* eslint-disable react/no-unescaped-entities */
import { BookOpen, Sparkles, Wallet, Camera, Shield, Star, Loader2, Send } from 'lucide-react';
import { submitFeedback } from '../app/actions';

export default function HelpPage() {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Ulasan atau umpan balik wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await submitFeedback({ rating, message });
      if (res.success) {
        setSuccess(true);
        setMessage('');
        setRating(5);
      } else {
        setError(res.error || 'Gagal mengirimkan ulasan.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl select-none">
      <div>
        <h2 className="text-2xl font-black text-black uppercase tracking-wider mb-2">Pusat Bantuan & Panduan Fitur</h2>
        <p className="text-neutral-500 font-bold max-w-2xl text-sm uppercase tracking-wide">
          Pelajari cara efektif mengelola keuangan Anda menggunakan fitur cerdas Norden Finance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Smart Input Guide */}
        <div className="border-[3px] border-black bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4 mb-6 border-b-[3px] border-black pb-4">
            <div className="bg-[#f3f4f6] border-[2px] border-black p-2.5 rounded-none text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-wider">Panduan Smart Input (AI Parser)</h3>
          </div>

          <p className="text-xs font-bold text-neutral-600 mb-4 uppercase tracking-wide">
            Cukup ketik pengeluaran Anda seperti sedang chat biasa. AI Norden akan secara cerdas memproses nominal, kategori, dompet, dan tag tagihan Anda secara otomatis.
          </p>

          <div className="space-y-4">
            <div className="border-[2px] border-black p-3 bg-[#f3f4f6]">
              <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">1. Pencatatan Cepat</p>
              <p className="font-mono text-xs font-bold text-black">"beli makan siang 15k cash"</p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">→ AI mencatat pengeluaran Kategori: Makanan, Nominal: Rp15.000, Dompet: Cash.</p>
            </div>

            <div className="border-[2px] border-black p-3 bg-[#f3f4f6]">
              <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">2. Perbarui Saldo Dompet</p>
              <p className="font-mono text-xs font-bold text-black">"saldo gopay 150k"</p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">→ AI mendeteksi penyesuaian saldo Dompet: GoPay menjadi Rp150.000 secara instan.</p>
            </div>

            <div className="border-[2px] border-black p-3 bg-[#f3f4f6]">
              <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">3. Transfer Antar Dompet</p>
              <p className="font-mono text-xs font-bold text-black">"transfer bni ke gopay 100k"</p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">→ AI mengurangi saldo BNI Rp100.000 dan menambahkannya ke saldo GoPay.</p>
            </div>

            <div className="border-[2px] border-black p-3 bg-[#f3f4f6]">
              <p className="text-[10px] font-black uppercase text-neutral-500 mb-1">4. Menambahkan Hashtag (Tag)</p>
              <p className="font-mono text-xs font-bold text-black">"makan soto 12k dana #liburan"</p>
              <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">→ AI mengelompokkan transaksi ini dalam tag khusus "#liburan" untuk pelaporan terperinci.</p>
            </div>
          </div>
        </div>

        {/* Fitur Utama Norden */}
        <div className="border-[3px] border-black bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4 mb-6 border-b-[3px] border-black pb-4">
            <div className="bg-[#f3f4f6] border-[2px] border-black p-2.5 rounded-none text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <BookOpen className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-wider">Mengenal Fitur Norden</h3>
          </div>

          <div className="space-y-6 text-xs font-bold text-neutral-600 uppercase tracking-wide">
            <div className="flex gap-3">
              <div className="text-black mt-0.5"><Wallet className="w-4 h-4 stroke-[2.5px]" /></div>
              <div>
                <strong className="text-black font-black">Multi-Wallet System</strong>
                <p className="text-neutral-500 lowercase first-letter:uppercase mt-0.5">Kelola saldo fisik, rekening bank, maupun e-wallet Anda di satu tempat yang terpusat.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-black mt-0.5"><Camera className="w-4 h-4 stroke-[2.5px]" /></div>
              <div>
                <strong className="text-black font-black">Norden AI Receipt Scanner</strong>
                <p className="text-neutral-500 lowercase first-letter:uppercase mt-0.5">Cukup unggah foto struk/kuitansi belanjaan Anda. AI akan mengekstrak total belanja dan rincian transaksi otomatis.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-black mt-0.5"><Shield className="w-4 h-4 stroke-[2.5px]" /></div>
              <div>
                <strong className="text-black font-black">Goals & Debt Manager</strong>
                <p className="text-neutral-500 lowercase first-letter:uppercase mt-0.5">Rencanakan target tabungan Anda dan catat hutang secara detail dengan opsi pembayaran otomatis dari dompet digital Anda.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tulis Ulasan / Write Feedback Card */}
      <div className="border-[3px] border-black bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-4 mb-6 border-b-[3px] border-black pb-4">
          <div className="bg-[#fef08a] border-[2px] border-black p-2.5 rounded-none text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Star className="w-5 h-5 fill-yellow-400 stroke-[2.5px] text-yellow-600" />
          </div>
          <h3 className="text-base font-black text-black uppercase tracking-wider">Kirim Umpan Balik & Ulasan</h3>
        </div>

        {success && (
          <div className="p-4 bg-emerald-100 border-[2px] border-black text-emerald-855 font-bold text-xs uppercase tracking-wider mb-6">
            🎉 Terima kasih! Ulasan Anda telah berhasil dikirim dan akan segera diproses oleh tim admin kami. Masukan Anda sangat berarti bagi pengembangan Norden Finance!
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 border-[2px] border-black text-red-750 font-bold text-xs uppercase tracking-wider mb-6">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase text-black mb-2">Beri Rating Norden Finance</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-2.5 border-[2px] border-black bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 stroke-[2px] transition-all ${
                      star <= rating ? 'fill-yellow-400 text-yellow-600' : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-message" className="block text-xs font-black uppercase text-black mb-2">Tulis Masukan atau Testimoni Anda</label>
            <textarea
              id="feedback-message"
              rows={4}
              placeholder="Contoh: Sangat terbantu dengan fitur Smart Input, catat keuangan tinggal ketik cepat jadi praktis banget!..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-4 border-[3px] border-black rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all font-bold text-xs uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 border-[3px] border-black bg-[#bbf7d0] hover:bg-[#a7f3d0] disabled:opacity-50 font-black text-xs uppercase tracking-wider rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" /> Mengirim...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-black" /> Kirim Umpan Balik
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
