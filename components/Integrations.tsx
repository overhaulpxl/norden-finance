/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { Smartphone, Zap, CheckCircle2 } from 'lucide-react';

export default function Integrations() {
  const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/shortcut` : 'http://localhost:3000/api/shortcut';

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl select-none">
      <div>
        <h2 className="text-2xl font-black text-black uppercase tracking-wider mb-2">Integrasi Mobile Shortcuts & NFC</h2>
        <p className="text-neutral-500 font-bold max-w-2xl text-sm uppercase tracking-wide">
          Catat pengeluaran Anda dalam hitungan detik tanpa perlu membuka aplikasi Norden. 
          Gunakan perintah suara Siri (iOS), Widget Pintasan (Android), atau tempelkan HP Anda ke stiker NFC.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* iOS Shortcuts Guide */}
        <div className="border-[3px] border-black bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4 mb-6 border-b-[3px] border-black pb-4">
            <div className="bg-[#f3f4f6] border-[2px] border-black p-2.5 rounded-none text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Smartphone className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-wider">Setup iOS Shortcuts</h3>
          </div>

          <ol className="space-y-6 text-xs font-bold text-neutral-600 uppercase tracking-wide">
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">1</span>
              <p className="pt-1 text-neutral-600">Buka aplikasi <strong className="text-black font-black">Shortcuts</strong> di iPhone Anda.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">2</span>
              <div>
                <p className="mb-2 pt-1 text-neutral-600">Buat Shortcut baru, lalu tambahkan action <strong className="text-black font-black">"Ask for Input"</strong> (Teks).</p>
                <p className="text-[11px] text-black border-[2px] border-black bg-[#f3f4f6] p-2 rounded-none font-mono font-bold uppercase">Prompt: "Pengeluaran hari ini?"</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">3</span>
              <div>
                <p className="mb-2 pt-1 text-neutral-600">Tambahkan action <strong className="text-black font-black">"URL"</strong> dan masukkan endpoint ini.</p>
                <div className="bg-black text-white p-3 border-[2px] border-black text-[11px] break-all font-mono mt-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {apiUrl}
                </div>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">4</span>
              <p className="pt-1 text-neutral-600">Tambahkan action <strong className="text-black font-black">"Get Contents of URL"</strong>, gunakan method POST, header Content-Type application/json, dan body JSON <strong className="text-black font-black">{"{"}"text":"[Provided Input]"{"}"}</strong>.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">5</span>
              <p className="pt-1 text-neutral-600">Selesai! Anda kini bisa memanggil Siri: <em className="not-italic underline decoration-2 decoration-black font-black text-black">"Siri, catat pengeluaran"</em> lalu ucapkan <em className="not-italic underline decoration-2 decoration-black font-black text-black">"50 ribu makan bca"</em>.</p>
            </li>
          </ol>
        </div>

        {/* Android Shortcuts Guide */}
        <div className="border-[3px] border-black bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4 mb-6 border-b-[3px] border-black pb-4">
            <div className="bg-[#f3f4f6] border-[2px] border-black p-2.5 rounded-none text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Smartphone className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-wider">Setup Android Shortcuts</h3>
          </div>

          <ol className="space-y-6 text-xs font-bold text-neutral-600 uppercase tracking-wide">
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">1</span>
              <p className="pt-1 text-neutral-600">Unduh aplikasi gratis <strong className="text-black font-black">"HTTP Shortcuts"</strong> di Google Play Store.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">2</span>
              <div>
                <p className="mb-2 pt-1 text-neutral-600">Masuk ke menu Variables, lalu buat variabel baru dengan tipe <strong className="text-black font-black">User Input (Text)</strong>:</p>
                <p className="text-[11px] text-black border-[2px] border-black bg-[#f3f4f6] p-2 rounded-none font-mono font-bold uppercase">Key: "text" | Prompt: "Catat pengeluaran apa?"</p>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">3</span>
              <div>
                <p className="mb-2 pt-1 text-neutral-600">Buat Shortcut baru tipe <strong className="text-black font-black">HTTP Request</strong>. Atur Method ke <strong className="text-black font-black">POST</strong>, header Content-Type application/json, dan masukkan URL berikut:</p>
                <div className="bg-black text-white p-3 border-[2px] border-black text-[11px] break-all font-mono mt-2 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {apiUrl}
                </div>
              </div>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">4</span>
              <p className="pt-1 text-neutral-600">Simpan dan tambahkan widget shortcut tersebut ke Home Screen Android Anda.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">5</span>
              <p className="pt-1 text-neutral-600">Selesai! Tap shortcut tersebut pada HP Android Anda, ketik nominal beserta keterangan, dan transaksi langsung tercatat.</p>
            </li>
          </ol>
        </div>

        {/* NFC Setup Guide */}
        <div className="border-[3px] border-black bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4 mb-6 border-b-[3px] border-black pb-4">
            <div className="bg-[#f3f4f6] border-[2px] border-black p-2.5 rounded-none text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <h3 className="text-base font-black text-black uppercase tracking-wider">NFC Sticker Trigger</h3>
          </div>

          <p className="text-xs font-bold text-neutral-600 mb-6 border-[2px] border-black p-4 bg-[#f3f4f6] rounded-none uppercase tracking-wide">
            Jika Anda memiliki stiker NFC kosong, Anda bisa menempelkannya di dompet fisik atau dasbor mobil Anda. 
            Saat Anda menempelkan HP ke stiker tersebut, sistem otomatis akan menjalankan Shortcut di atas.
          </p>

          <ol className="space-y-6 text-xs font-bold text-neutral-600 uppercase tracking-wide">
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">1</span>
              <p className="pt-1 text-neutral-600">Untuk iOS, buka aplikasi <strong className="text-black font-black">Shortcuts</strong>, masuk tab <strong className="text-black font-black">Automation</strong>, pilih <strong className="text-black font-black">Create Personal Automation</strong>, lalu pilih <strong className="text-black font-black">NFC</strong>.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">2</span>
              <p className="pt-1 text-neutral-600">Untuk Android, gunakan aplikasi gratis <strong className="text-black font-black">"NFC Tools"</strong> untuk memprogram stiker NFC Anda agar memicu HTTP Shortcuts yang Anda buat.</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">3</span>
              <p className="pt-1 text-neutral-600">Pilih <strong className="text-black font-black">Scan</strong> dan tempelkan stiker NFC Anda. Beri nama (misal: "Stiker Dompet").</p>
            </li>
            <li className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center font-black text-xs rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">4</span>
              <p className="pt-1 text-neutral-600">Tambahkan action <strong className="text-black font-black">"Run Shortcut"</strong> dan pilih Shortcut yang telah Anda buat pada panduan di sebelah kiri.</p>
            </li>
            <li className="flex gap-4 items-center p-4 border-[2px] border-black bg-[#bbf7d0] mt-4 rounded-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="w-6 h-6 text-black flex-shrink-0 stroke-[2.5px]" />
              <p className="font-black text-emerald-900 text-xs">Selesai! Tap stiker Anda kapan pun Anda baru saja berbelanja.</p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
