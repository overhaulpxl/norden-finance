import os
import base64
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

def get_base64_image(rel_path):
    if os.path.exists(rel_path):
        with open(rel_path, 'rb') as f:
            ext = os.path.splitext(rel_path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/svg+xml' if ext == '.svg' else 'image/jpeg'
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

def generate_slides():
    out_dir = r'D:\norden-finance\public\instagram\advanced'
    os.makedirs(out_dir, exist_ok=True)
    html_dir = os.path.join(out_dir, 'html')
    os.makedirs(html_dir, exist_ok=True)
    temp_dir = r'C:\Users\blur\AppData\Local\Temp\antigravity'
    os.makedirs(temp_dir, exist_ok=True)

    common_css = """
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #FAF9F5;
      background-image: radial-gradient(#C8C7C2 2px, transparent 2px);
      background-size: 28px 28px;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
    }
    .portrait {
      width: 1080px;
      height: 1350px;
      padding: 72px 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      border-bottom: 3.5px solid #000000;
      padding-bottom: 24px;
    }
    .badge {
      background: #FFE066;
      border: 3px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      padding: 8px 18px;
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .badge-white {
      background: #FFFFFF;
      border: 3px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      padding: 8px 18px;
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .meta-tag {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #000000;
    }
    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      border-top: 3.5px solid #000000;
      padding-top: 24px;
    }
    .handle-tag {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.04em;
    }
    .page-tag {
      background: #FFFFFF;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      padding: 6px 14px;
      font-weight: 900;
      font-size: 14px;
      text-transform: uppercase;
    }
    .card-neo {
      background: #FFFFFF;
      border: 5px solid #000000;
      box-shadow: 12px 12px 0px 0px #000000;
      padding: 44px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    .card-neo-yellow {
      background: #FFE066;
      border: 5px solid #000000;
      box-shadow: 12px 12px 0px 0px #000000;
      padding: 44px;
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    h2 {
      font-size: 54px;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.05;
      letter-spacing: -0.01em;
    }
    .lead-text {
      font-size: 20px;
      font-weight: 600;
      line-height: 1.45;
      color: #222222;
    }
    .demo-box {
      background: #FAF9F5;
      border: 3.5px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .demo-box-dark {
      background: #000000;
      color: #FFFFFF;
      border: 3.5px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .demo-label {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #666666;
    }
    .demo-code {
      font-family: monospace;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .list-items {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .list-row {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      font-size: 19px;
      font-weight: 600;
      line-height: 1.4;
    }
    .bullet-sq {
      width: 12px;
      height: 12px;
      background: #000000;
      margin-top: 7px;
      flex-shrink: 0;
    }
    .pill-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .pill-item {
      background: #FFFFFF;
      border: 3px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      padding: 12px;
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      text-align: center;
      letter-spacing: 0.04em;
    }
    .notice-note {
      font-size: 14px;
      font-weight: 700;
      color: #555555;
      line-height: 1.4;
      border-left: 3px solid #000000;
      padding-left: 12px;
    }
    .btn-cta {
      background: #FFE066;
      border: 4px solid #000000;
      box-shadow: 6px 6px 0px 0px #000000;
      padding: 20px 28px;
      font-size: 22px;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 8px;
    }
    """

    slides_data = [
        # Slide 1
        ("slide-01", "FITUR LANJUTAN", "KENALI LEBIH DEKAT NORDEN", "LEBIH DARI<br>SEKADAR CATAT UANG",
         "Selain mencatat pemasukan dan pengeluaran, ada beberapa fitur lain di Norden yang bisa membantu kamu mengatur keuangan sehari-hari.",
         """<div class="card-neo-yellow">
           <div class="pill-grid">
             <div class="pill-item">01 / PINTASAN</div>
             <div class="pill-item">02 / SMART INPUT</div>
             <div class="pill-item">03 / SCAN STRUK</div>
             <div class="pill-item">04 / SALDO TERPADU</div>
             <div class="pill-item">05 / SPLIT BILL</div>
             <div class="pill-item">06 / SIMULASI DANA</div>
             <div class="pill-item">07 / PELUNASAN UTANG</div>
             <div class="pill-item">08 / LAPORAN PDF</div>
             <div class="pill-item">09 / PRIVASI</div>
           </div>
         </div>""", "GESER UNTUK MELIHAT FITUR → [ 01 / 20 ]"),

        # Slide 2
        ("slide-02", "01 / PINTASAN CEPAT", "AKSES DARI LAYAR UTAMA", "CATAT DARI<br>LAYAR UTAMA",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Kalau shortcut Norden sudah diatur, kamu bisa mengaksesnya lewat Action Button di iPhone atau fitur Back Tap.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tulis transaksi yang ingin dicatat tanpa perlu membuka browser terlebih dahulu.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Catatan akan dikirim ke akun Norden melalui shortcut tersebut secara instan.</span></div>
           </div>
           <div class="demo-box">
             <div class="demo-label">ALUR PINTASAN CEPAT</div>
             <div class="demo-code">Action Button &rarr; "kopi 22k bca" &rarr; Catatan terkirim &check;</div>
           </div>
         </div>""", "GESER &rarr; [ 02 / 20 ]"),

        # Slide 3
        ("slide-03", "01 / PERINTAH SUARA", "CATAT DENGAN SIRI", "CATAT LEWAT<br>SUARA SIRI",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Kamu bisa menjalankan shortcut Norden lewat Siri dengan perintah suara yang sudah diatur, misalnya, "Hey Siri, Catat Norden".</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Setiap akun memiliki token akses sendiri untuk menghubungkan shortcut dengan akun Norden secara aman.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Token akses bisa diperbarui atau direset kapan saja langsung melalui menu Pengaturan.</span></div>
           </div>
           <div class="demo-box" style="background: #FFE066;">
             <div class="demo-label" style="color: #000;">PERINTAH SUARA APPLE SIRI</div>
             <div class="demo-code">"Hey Siri, Catat Norden: Makan siang 35k cash"</div>
           </div>
         </div>""", "GESER &rarr; [ 03 / 20 ]"),

        # Slide 4
        ("slide-04", "02 / SMART INPUT", "HITUNGAN DALAM SATU CATATAN", "DISKON DAN PAJAK<br>SEKALIGUS",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Tidak perlu menghitung diskon dan pajak secara terpisah sebelum mencatat transaksi.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tulis nominal, potongan harga, dan pajaknya dalam satu baris kalimat natural.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Norden secara otomatis membantu menghitung total akhirnya dengan presisi.</span></div>
           </div>
           <div class="demo-box">
             <div class="demo-label">INPUT CERDAS</div>
             <div class="demo-code">&gt; makan siang 120k mandiri diskon 15% + tax 10%</div>
             <div style="display: flex; gap: 10px; margin-top: 6px;">
               <span style="background: #fecdd3; border: 2px solid #000; padding: 4px 10px; font-weight: 900; font-size: 15px;">-Rp112.200</span>
               <span style="background: #bbf7d0; border: 2px solid #000; padding: 4px 10px; font-weight: 900; font-size: 15px;">Makanan</span>
               <span style="background: #bfdbfe; border: 2px solid #000; padding: 4px 10px; font-weight: 900; font-size: 15px;">Mandiri</span>
             </div>
           </div>
         </div>""", "GESER &rarr; [ 04 / 20 ]"),

        # Slide 5
        ("slide-05", "02 / MUTASI SALDO", "PINDAH UANG ANTAR DOMPET", "PINDAH SALDO<br>ANTAR DOMPET",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Tarik tunai dari ATM sebenarnya hanya memindahkan uang dari rekening ke dompet tunai fisik.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Jadi, transaksi ini tidak perlu dicatat sebagai pengeluaran baru yang mengurangi kekayaan bersihmu.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Norden membantu menyesuaikan saldo kedua dompet agar catatan tetap sesuai.</span></div>
           </div>
           <div class="demo-box" style="background: #FAF9F5;">
             <div class="demo-label">CONTOH INPUT MUTASI</div>
             <div class="demo-code">&gt; tarik tunai 500k bca ke cash</div>
             <div style="display: flex; gap: 10px; margin-top: 6px;">
               <span style="background: #fecdd3; border: 2px solid #000; padding: 4px 10px; font-weight: 900; font-size: 15px;">BCA -Rp500.000</span>
               <span style="background: #bbf7d0; border: 2px solid #000; padding: 4px 10px; font-weight: 900; font-size: 15px;">Tunai +Rp500.000</span>
             </div>
           </div>
         </div>""", "GESER &rarr; [ 05 / 20 ]"),

        # Slide 6
        ("slide-06", "03 / SCAN STRUK", "DARI FOTO KE CATATAN", "FOTO STRUK<br>JADI CATATAN",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Punya struk belanja swalayan atau nota makan yang belum sempat dicatat?</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Ambil fotonya, lalu gunakan fitur scan struk untuk membantu membaca informasi transaksi.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Nama toko, tanggal, rincian barang, dan total pembayaran dapat dikenali secara otomatis.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Periksa kembali hasilnya di layar sebelum disimpan ke buku kasmu.</span></div>
           </div>
           <div class="demo-box" style="background: #FFE066;">
             <div class="demo-label" style="color: #000;">EKSTRAKSI CERDAS</div>
             <div class="demo-code">Foto Struk &rarr; Toko, Tanggal, Item, Total &rarr; Siap Simpan</div>
           </div>
         </div>""", "GESER &rarr; [ 06 / 20 ]"),

        # Slide 7
        ("slide-07", "03 / TRANSPARANSI DATA", "KENALI CARA KERJANYA", "TAHU BAGAIMANA<br>DATA DIPROSES",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Fitur scan struk menggunakan bantuan layanan AI untuk mengenali teks dari gambar dengan akurasi tinggi.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Karena itu, proses pengenalan tidak sepenuhnya dilakukan secara lokal di perangkat.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Sebelum menggunakan fitur ini, kamu bisa membaca kebijakan privasi Norden untuk memahami bagaimana data diproses dengan aman.</span></div>
           </div>
           <div class="notice-note">
             Norden berkomitmen pada transparansi penuh: tidak ada klaim keliru tentang pemrosesan data. Privasi dan keamananmu adalah prioritas utama.
           </div>
         </div>""", "GESER &rarr; [ 07 / 20 ]"),

        # Slide 8
        ("slide-08", "04 / KELOLA DOMPET", "SEMUA SALDO DALAM SATU TEMPAT", "SEMUA SALDO<br>SATU TAMPILAN",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Punya rekening bank, e-wallet, dan uang tunai sekaligus?</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Catat semuanya sebagai dompet yang berbeda dan terorganisir di Norden.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Lihat jumlah saldo dari berbagai dompet dalam satu tampilan terpadu.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tidak perlu repot membuka banyak aplikasi hanya untuk mengecek catatan saldomu.</span></div>
           </div>
           <div class="notice-note">
             Catatan: Saldo mengikuti transaksi dan pembaruan yang kamu masukkan ke Norden, bukan sinkronisasi otomatis dari rekening bank.
           </div>
         </div>""", "GESER &rarr; [ 08 / 20 ]"),

        # Slide 9
        ("slide-09", "04 / ASET TERPADU", "LIHAT NILAI ACUAN", "KURS RUPIAH<br>DAN EMAS",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Punya simpanan dalam mata uang asing atau logam mulia emas?</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Lihat nilai acuan kurs USD/IDR dan harga emas Antam per gram langsung di dashboard.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Informasi ini membantu memperkirakan total nilai portofolio asetmu dalam rupiah.</span></div>
           </div>
           <div class="demo-box" style="background: #FAF9F5;">
             <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 18px;">
               <span>KURS USD / IDR ACUAN</span>
               <span>~ Rp16.200</span>
             </div>
             <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 18px; margin-top: 6px;">
               <span>HARGA EMAS ANTAM / GRAM</span>
               <span>~ Rp1.450.000</span>
             </div>
           </div>
           <div class="notice-note">
             Nilai tukar dan harga emas dapat berubah mengikuti pembaruan pasar harian.
           </div>
         </div>""", "GESER &rarr; [ 09 / 20 ]"),

        # Slide 10
        ("slide-10", "05 / BAGI TAGIHAN", "SESUAI PESANAN MASING-MASING", "BAGI TAGIHAN<br>LEBIH MUDAH",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Makan bersama memang menyenangkan, tetapi menghitung tagihan setelahnya kadang cukup merepotkan.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Masukkan pesanan masing-masing, termasuk diskon promo, pajak restoran, dan service charge.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Norden membantu membagi total tagihan secara proporsional sesuai porsi pesanan setiap orang.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Semua orang tahu persis berapa bagian yang adil untuk dibayarkan.</span></div>
           </div>
           <div class="demo-box" style="background: #bbf7d0;">
             <div class="demo-label" style="color: #000;">PERHITUNGAN PROPORSIONAL</div>
             <div class="demo-code">Diskon &amp; Tax Dibagi Adil Berdasarkan Nilai Pesanan</div>
           </div>
         </div>""", "GESER &rarr; [ 10 / 20 ]"),

        # Slide 11
        ("slide-11", "05 / FORMAT TEKS", "TINGGAL SALIN DAN KIRIM", "RINCIAN TAGIHAN<br>SIAP DIBAGIKAN",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Setelah selesai menghitung, kamu bisa menyalin rincian tagihan dalam format teks pesan rapi.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Isinya mencakup nama teman, pesanan masing-masing, dan jumlah akhir yang perlu ditransfer.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tempelkan langsung ke grup WhatsApp agar teman-teman bisa melihat rinciannya dengan jelas.</span></div>
           </div>
           <div class="demo-box">
             <div class="demo-label">FORMAT PESAN WHATSAPP SIAP SALIN</div>
             <div class="demo-code" style="font-size: 16px; line-height: 1.4;">
               RINCIAN SPLIT BILL NORDEN<br>
               &bull; Budi: Rp45.000 (Nasi Goreng + Tax)<br>
               &bull; Siti: Rp38.000 (Mie Ayam + Tax)<br>
               Total: Rp83.000 | BCA: 123456789
             </div>
           </div>
         </div>""", "GESER &rarr; [ 11 / 20 ]"),

        # Slide 12
        ("slide-12", "06 / KETAHANAN DANA", "SIMULASI ARUS KAS", "BERAPA LAMA<br>TABUNGAN BERTAHAN?",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Pernah bertanya berapa lama tabunganmu bisa mencukupi kebutuhan jika pemasukan tiba-tiba berhenti?</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Masukkan jumlah dana yang tersedia dan rata-rata pengeluaran bulananmu.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Norden membantu memperkirakan berapa lama dana tersebut bisa digunakan (Survival Runway).</span></div>
           </div>
           <div class="demo-box" style="background: #FFE066;">
             <div class="demo-label" style="color: #000;">SIMULASI KETAHANAN FINANSIAL</div>
             <div class="demo-code" style="font-size: 24px;">Ketahanan Tabungan: 6,4 Bulan</div>
           </div>
           <div class="notice-note">
             Catatan: Hasil simulasi merupakan perkiraan berdasarkan data dan asumsi pengeluaran yang dimasukkan.
           </div>
         </div>""", "GESER &rarr; [ 12 / 20 ]"),

        # Slide 13
        ("slide-13", "06 / PANDUAN DANA", "MULAI DARI TARGET YANG MASUK AKAL", "SIAPKAN DANA<br>DARURATMU",
         None,
         """<div class="card-neo">
           <div class="lead-text">Tiga patokan umum dana darurat:</div>
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span><strong>Lajang:</strong> sekitar 3 bulan pengeluaran pokok bulanan.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>Berkeluarga:</strong> sekitar 6 bulan pengeluaran pokok bulanan.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>Freelancer / Wirausaha:</strong> sekitar 9–12 bulan pengeluaran pokok.</span></div>
           </div>
           <div class="notice-note">
             Gunakan angka tersebut sebagai acuan awal. Target dana darurat setiap orang bisa berbeda tergantung tanggungan dan kestabilan penghasilan.
           </div>
         </div>""", "GESER &rarr; [ 13 / 20 ]"),

        # Slide 14
        ("slide-14", "07 / BEBAS UTANG", "PILIH STRATEGI PELUNASAN", "SUSUN RENCANA<br>PELUNASAN UTANG",
         None,
         """<div class="card-neo">
           <div class="lead-text">Dua metode pelunasan yang tersedia di Norden:</div>
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span><strong>Metode Snowball:</strong> Mulai dari utang dengan saldo paling kecil. Melunasi satu per satu memberi dorongan psikologis untuk terus melangkah.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>Metode Avalanche:</strong> Prioritaskan utang dengan bunga paling tinggi. Pendekatan ini dapat meminimalkan total beban bunga yang dibayarkan.</span></div>
           </div>
           <div class="demo-box" style="background: #bbf7d0;">
             <div class="demo-label" style="color: #000;">SIMULATOR BEBAS UTANG</div>
             <div class="demo-code">Bandingkan Snowball vs Avalanche secara langsung</div>
           </div>
         </div>""", "GESER &rarr; [ 14 / 20 ]"),

        # Slide 15
        ("slide-15", "07 / TARGET WAKTU", "ESTIMASI PELUNASAN", "PERKIRAKAN<br>WAKTU PELUNASAN",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Selain cicilan rutin minimum, kamu juga bisa memasukkan rencana pembayaran ekstra setiap bulan.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Norden membantu memperkirakan kapan seluruh utang bisa lunas berdasarkan angka yang kamu masukkan.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Dengan begitu, kamu punya gambaran waktu dan target bebas utang yang jelas.</span></div>
           </div>
           <div class="demo-box" style="background: #FAF9F5;">
             <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 18px;">
               <span>PROYEKSI BEBAS UTANG</span>
               <span style="background: #FFE066; padding: 2px 8px; border: 2px solid #000;">OKTOBER 2027</span>
             </div>
           </div>
           <div class="notice-note">
             Hasil merupakan estimasi matematis berdasarkan suku bunga konstan dan alokasi pembayaran ekstra.
           </div>
         </div>""", "GESER &rarr; [ 15 / 20 ]"),

        # Slide 16
        ("slide-16", "08 / EKSPOR DOKUMEN", "LAPORAN KEUANGAN", "LAPORAN RAPI<br>DALAM FORMAT PDF",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Ingin menyimpan catatan keuangan dalam bentuk dokumen resmi?</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Norden menyediakan laporan PDF dengan susunan informasi yang rapi dan mudah dibaca.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Ringkasan arus kas dan rincian transaksi siap digunakan untuk evaluasi maupun arsip pribadi.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tidak perlu menyusun ulang dokumen atau rumus excel dari awal.</span></div>
           </div>
           <div class="demo-box" style="background: #FFE066;">
             <div class="demo-label" style="color: #000;">STANDAR AKUNTANSI RAPI</div>
             <div class="demo-code">Ekspor PDF 2 Halaman &bull; Arus Kas &bull; Tanda Tangan</div>
           </div>
         </div>""", "GESER &rarr; [ 16 / 20 ]"),

        # Slide 17
        ("slide-17", "08 / ARSIP BULANAN", "RINCIAN TRANSAKSI", "BUKU KAS<br>LEBIH TERTATA",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Lihat kembali uang yang masuk dan keluar selama periode tertentu.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Gunakan rincian transaksi untuk mencocokkan catatan dengan saldo aktual yang kamu miliki.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tersedia pilihan ekspor data lengkap dalam format PDF, CSV, dan JSON kapan saja.</span></div>
           </div>
           <div class="demo-box" style="background: #FAF9F5;">
             <div style="display: flex; gap: 12px;">
               <span style="background: #FFFFFF; border: 2.5px solid #000; padding: 6px 14px; font-weight: 900; font-size: 16px;">EKSPOR PDF</span>
               <span style="background: #FFFFFF; border: 2.5px solid #000; padding: 6px 14px; font-weight: 900; font-size: 16px;">FORMAT CSV</span>
               <span style="background: #FFFFFF; border: 2.5px solid #000; padding: 6px 14px; font-weight: 900; font-size: 16px;">FORMAT JSON</span>
             </div>
           </div>
         </div>""", "GESER &rarr; [ 17 / 20 ]"),

        # Slide 18
        ("slide-18", "09 / KEAMANAN PRIVASI", "KUNCI AKSES PERANGKAT", "JAGA AKSES<br>CATATAN KEUANGANMU",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Catatan keuangan termasuk informasi pribadi yang sebaiknya tidak terbuka begitu saja.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Gunakan fitur kunci perangkat untuk membatasi akses saat ponsel sedang dipinjam orang lain.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Akses dapat diamankan menggunakan PIN lokal atau biometrik seperti sidik jari dan Face ID.</span></div>
           </div>
           <div class="demo-box" style="background: #bbf7d0;">
             <div class="demo-label" style="color: #000;">KEAMANAN AKSES LOKAL</div>
             <div class="demo-code">PIN 6-Digit &bull; Face ID &bull; Touch ID / Fingerprint</div>
           </div>
         </div>""", "GESER &rarr; [ 18 / 20 ]"),

        # Slide 19
        ("slide-19", "RANGKUMAN", "FITUR LANJUTAN NORDEN", "LEBIH BANYAK<br>YANG BISA DILAKUKAN",
         None,
         """<div class="card-neo">
           <div class="list-items" style="font-size: 17px; gap: 10px;">
             <div class="list-row"><div class="bullet-sq"></div><span><strong>01</strong> Pintasan Apple, Action Button &amp; Suara Siri</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>02</strong> Smart Input: Diskon, Pajak &amp; Tarik Tunai</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>03</strong> Scan Struk Belanja &amp; Nota Transaksi</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>04</strong> Saldo Terpadu, Nilai Kurs &amp; Harga Emas</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>05</strong> Split Bill Proporsional &amp; Rincian WhatsApp</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>06</strong> Simulasi Survival Runway &amp; Dana Darurat</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>07</strong> Simulator Pelunasan Utang (Snowball vs Avalanche)</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>08</strong> Laporan Keuangan PDF &amp; Ekspor Lengkap</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>09</strong> Kunci Akses PIN &amp; Biometrik (Face ID)</span></div>
           </div>
         </div>""", "GESER &rarr; [ 19 / 20 ]"),

        # Slide 20
        ("slide-20", "COBA NORDEN", "TRIAL PRO 14 HARI", "COBA DULU<br>KENALI FITURNYA",
         None,
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Kamu bisa mencoba seluruh fitur Pro selama 14 hari penuh.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tidak perlu kartu kredit saat mendaftar.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tidak ada tagihan otomatis setelah masa trial selesai.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Akses langsung melalui browser ponsel maupun komputer.</span></div>
           </div>
           <div class="notice-note">Trial dimulai setelah kamu menyelesaikan setup awal akun.</div>
           <div class="btn-cta">KUNJUNGI NORDENFINANCE.SITE &rarr;</div>
           <div style="font-size: 14px; font-weight: 700; text-align: center; color: #555;">Tautan pendaftaran juga tersedia di bio @norden.finance</div>
         </div>""", "SELESAI • [ 20 / 20 ]"),
    ]

    for name, badge, meta, title, lead, body_content, page_tag in slides_data:
        lead_html = f'<p class="lead-text">{lead}</p>' if lead else ''
        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge">{badge}</div>
      <div class="meta-tag">{meta}</div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 24px; margin: auto 0;">
      <div>
        <h2>{title}</h2>
        {lead_html}
      </div>
      {body_content}
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
      <div class="page-tag">{page_tag}</div>
    </div>
  </div>
</body>
</html>"""
        with open(os.path.join(html_dir, f"{name}.html"), 'w', encoding='utf-8') as f:
            f.write(html)

    print(f"Generated {len(slides_data)} HTML files in {html_dir}")

    # Launch local server
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=html_dir, **kwargs)
        def log_message(self, format, *args):
            pass

    port = 8998
    httpd = HTTPServer(('127.0.0.1', port), Handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()

    edge_path = r'C:\Program Files (x86)\Microsoft\EdgeCore\157.0.4341.46\msedge.exe'

    print("Rendering slides to PNG with Microsoft Edge headless...")
    for name, _, _, _, _, _, _ in slides_data:
        final_png = os.path.join(out_dir, f"{name}.png")
        url = f"http://127.0.0.1:{port}/{name}.html"
        cmd = [
            edge_path,
            '--headless',
            '--disable-gpu',
            '--window-size=1080,1350',
            '--hide-scrollbars',
            '--force-device-scale-factor=1',
            f'--screenshot={final_png}',
            url
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(final_png) and os.path.getsize(final_png) > 1000:
            print(f"  [OK] Rendered {name}.png ({os.path.getsize(final_png)} bytes)")
        else:
            print(f"  [FAIL] Failed rendering {name}.png")

    httpd.shutdown()
    print("All slides processed successfully.")

if __name__ == '__main__':
    generate_slides()
