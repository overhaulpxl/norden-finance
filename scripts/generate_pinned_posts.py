import os
import base64
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont

def get_base64_image(rel_path):
    if os.path.exists(rel_path):
        with open(rel_path, 'rb') as f:
            ext = os.path.splitext(rel_path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/svg+xml' if ext == '.svg' else 'image/jpeg'
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

def generate_pinned_posts():
    horizontal_b64 = get_base64_image('public/brand/norden-horizontal.png')

    out_base = r'D:\norden-finance\public\instagram\pinned'
    os.makedirs(out_base, exist_ok=True)
    html_dir = os.path.join(out_base, 'html')
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
      letter-spacing: 0.1em;
    }
    .meta-tag {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #555555;
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
    """

    pins = []

    # =========================================================================
    # CAROUSEL 1: KENALAN DENGAN NORDEN FINANCE (4 SLIDES)
    # =========================================================================

    # Pin 1 - Slide 1 (Cover)
    p1_s1 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.hero-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-main {{
  background: #FFE066;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 42px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}}
.logo-box {{
  background: #FFFFFF;
  border: 3.5px solid #000000;
  box-shadow: 5px 5px 0px 0px #000000;
  padding: 16px 22px;
  display: inline-flex;
  align-self: flex-start;
}}
h1 {{
  font-size: 58px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.02em;
}}
.desc {{
  font-size: 21px;
  font-weight: 600;
  line-height: 1.45;
  color: #111111;
}}
.grid-4 {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}}
.grid-item {{
  background: #FFFFFF;
  border: 3.5px solid #000000;
  box-shadow: 5px 5px 0px 0px #000000;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}}
.item-num {{
  font-size: 13px;
  font-weight: 900;
  color: #555555;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}}
.item-title {{
  font-size: 18px;
  font-weight: 800;
  color: #000000;
  line-height: 1.25;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge">TENTANG NORDEN FINANCE</div>
      <div class="meta-tag">PENGELOLAAN KEUANGAN PRIBADI</div>
    </div>
    <div class="hero-box">
      <div class="card-main">
        <div class="logo-box">
          <img src="{horizontal_b64}" style="height: 48px; width: auto; object-fit: contain;" />
        </div>
        <h1>KENALI<br>NORDEN FINANCE</h1>
        <p class="desc">
          Norden Finance membantu kamu mencatat transaksi, memantau beberapa dompet, dan memahami ke mana uangmu pergi.
        </p>
      </div>
      <div class="grid-4">
        <div class="grid-item">
          <span class="item-num">01 / CATAT TRANSAKSI</span>
          <span class="item-title">Masukkan pemasukan & pengeluaran lebih praktis.</span>
        </div>
        <div class="grid-item">
          <span class="item-num">02 / KELOLA DOMPET</span>
          <span class="item-title">Pisahkan rekening, e-wallet, & uang tunai.</span>
        </div>
        <div class="grid-item">
          <span class="item-num">03 / PANTAU ARUS KAS</span>
          <span class="item-title">Lihat gambaran pemasukan & pengeluaranmu.</span>
        </div>
        <div class="grid-item">
          <span class="item-num">04 / ATUR RENCANA</span>
          <span class="item-title">Buat anggaran & target sesuai kebutuhan.</span>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER UNTUK MENGENAL NORDEN &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-1-slide-1", p1_s1))

    # Pin 1 - Slide 2 (Kenapa Norden Hadir?)
    p1_s2 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 28px; margin: auto 0; }}
.card-story {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
  gap: 26px;
}}
h2 {{
  font-size: 56px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.story-p {{
  font-size: 21px;
  font-weight: 600;
  line-height: 1.55;
  color: #222222;
}}
.story-highlight {{
  background: #FAF9F5;
  border-left: 6px solid #000000;
  padding: 20px 24px;
  font-size: 20px;
  font-weight: 700;
  color: #000000;
  line-height: 1.45;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge" style="background: #FFFFFF;">CERITA DI BALIK NORDEN</div>
      <div class="meta-tag">KENAPA NORDEN HADIR?</div>
    </div>
    <div class="content-box">
      <div class="card-story">
        <h2>UANG PERGI<br>KE MANA?</h2>
        <p class="story-p">
          Pengeluaran kecil sering kali tidak terasa.<br><br>
          Kopi pagi, ongkos perjalanan, makan siang, belanja bulanan. Satu per satu mungkin terlihat biasa saja, sampai akhirnya kita bertanya-tanya ke mana uang selama ini pergi.
        </p>
        <div class="story-highlight">
          Norden dibuat untuk membantu kamu melihat semuanya dengan lebih jelas.<br><br>
          Bukan supaya kamu berhenti menikmati uangmu, tetapi supaya kamu lebih paham bagaimana mengelolanya.
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER 02 / 04 &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-1-slide-2", p1_s2))

    # Pin 1 - Slide 3 (Prinsip Desain)
    p1_s3 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-header-box {{
  margin-bottom: 4px;
}}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.principles-list {{
  display: flex;
  flex-direction: column;
  gap: 18px;
}}
.principle-card {{
  background: #FFFFFF;
  border: 4px solid #000000;
  box-shadow: 7px 7px 0px 0px #000000;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}}
.p-title {{
  font-size: 20px;
  font-weight: 900;
  text-transform: uppercase;
  color: #000000;
  display: flex;
  align-items: center;
  gap: 10px;
}}
.p-desc {{
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  line-height: 1.45;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge" style="background: #FFE066;">DI BALIK TAMPILAN NORDEN</div>
      <div class="meta-tag">PRINSIP DESAIN</div>
    </div>
    <div class="content-box">
      <div class="card-header-box">
        <h2>TAMPILAN<br>PUNYA FUNGSI</h2>
      </div>
      <div class="principles-list">
        <div class="principle-card">
          <div class="p-title">
            <span style="background: #000; color: #FFF; padding: 2px 8px; font-size: 14px;">01</span>
            <span>SEDERHANA DAN TEGAS</span>
          </div>
          <div class="p-desc">
            Garis yang jelas, sudut tajam, dan tata letak yang tidak berlebihan. Informasi penting mendapat tempat yang semestinya.
          </div>
        </div>
        <div class="principle-card">
          <div class="p-title">
            <span style="background: #FFE066; color: #000; border: 1.5px solid #000; padding: 2px 8px; font-size: 14px;">02</span>
            <span>WARNA YANG PUNYA FUNGSI</span>
          </div>
          <div class="p-desc">
            Kuning untuk fokus, mint untuk pemasukan, coral untuk pengeluaran, dan biru untuk informasi atau transfer.
          </div>
        </div>
        <div class="principle-card">
          <div class="p-title">
            <span style="background: #bfdbfe; color: #000; border: 1.5px solid #000; padding: 2px 8px; font-size: 14px;">03</span>
            <span>ANGKA LEBIH MUDAH DIBACA</span>
          </div>
          <div class="p-desc">
            Kontras yang kuat dan hierarki informasi yang jelas membantu kamu menemukan angka penting tanpa harus mencari-cari.
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER 03 / 04 &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-1-slide-3", p1_s3))

    # Pin 1 - Slide 4 (Penutup dan CTA)
    p1_s4 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 26px; margin: auto 0; }}
.cta-card {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 48px 42px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.list-box {{
  display: flex;
  flex-direction: column;
  gap: 14px;
}}
.list-item {{
  background: #FAF9F5;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0px 0px #000000;
  padding: 14px 20px;
  font-size: 19px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 14px;
}}
.bullet {{
  width: 12px;
  height: 12px;
  background: #000000;
  flex-shrink: 0;
}}
.note-text {{
  font-size: 16px;
  font-weight: 700;
  color: #555555;
  margin-top: 4px;
}}
.cta-btn {{
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
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge">MULAI DARI SINI</div>
      <div class="meta-tag">LANGKAH PERTAMA</div>
    </div>
    <div class="content-box">
      <div class="cta-card">
        <h2>MULAI ATUR<br>KEUANGANMU</h2>
        <div class="list-box">
          <div class="list-item">
            <div class="bullet"></div>
            <span>Trial Pro selama 14 hari.</span>
          </div>
          <div class="list-item">
            <div class="bullet"></div>
            <span>Tidak perlu memasukkan kartu kredit.</span>
          </div>
          <div class="list-item">
            <div class="bullet"></div>
            <span>Tidak ada tagihan otomatis setelah trial berakhir.</span>
          </div>
          <div class="list-item">
            <div class="bullet"></div>
            <span>Bisa diakses melalui browser ponsel maupun komputer.</span>
          </div>
        </div>
        <p class="note-text">Trial dimulai setelah proses setup awal selesai.</p>
        <div class="cta-btn">COBA NORDEN FINANCE &rarr;</div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">SLIDE 04 / 04 • SELESAI</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-1-slide-4", p1_s4))

    # =========================================================================
    # CAROUSEL 2: CARA KERJA SMART INPUT & SCAN STRUK (4 SLIDES)
    # =========================================================================

    # Pin 2 - Slide 1 (Cover)
    p2_s1 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.hero-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-main {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 42px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}}
h1 {{
  font-size: 58px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.02em;
}}
.desc {{
  font-size: 21px;
  font-weight: 600;
  line-height: 1.45;
  color: #222222;
}}
.demo-box {{
  background: #FAF9F5;
  border: 3.5px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}}
.input-line {{
  font-family: monospace;
  font-size: 22px;
  font-weight: 800;
  background: #000000;
  color: #FFE066;
  padding: 12px 18px;
}}
.res-line {{
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 18px;
  font-weight: 800;
  flex-wrap: wrap;
}}
.pill {{
  padding: 6px 14px;
  border: 2px solid #000000;
  font-size: 16px;
  font-weight: 900;
}}
.pill-coral {{ background: #fecdd3; }}
.pill-mint {{ background: #bbf7d0; }}
.pill-sky {{ background: #bfdbfe; }}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge">CARA KERJA NORDEN</div>
      <div class="meta-tag">CATAT TRANSAKSI LEBIH PRAKTIS</div>
    </div>
    <div class="hero-box">
      <div class="card-main">
        <h1>CATAT TRANSAKSI<br>LEBIH PRAKTIS</h1>
        <p class="desc">
          Tidak harus selalu mengisi banyak kolom. Cukup tulis transaksi seperti biasa, lalu periksa hasilnya sebelum disimpan.
        </p>
        <div class="demo-box">
          <div style="font-size: 14px; font-weight: 900; text-transform: uppercase;">Contoh Smart Input:</div>
          <div class="input-line">&gt; ayam geprek 18k cash</div>
          <div class="res-line">
            <span class="pill pill-coral">-Rp18.000</span>
            <span class="pill pill-mint">Kategori: Makanan</span>
            <span class="pill pill-sky">Dompet: Tunai</span>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER CARA KERJA &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-2-slide-1", p2_s1))

    # Pin 2 - Slide 2 (Smart Input Detail)
    p2_s2 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-header-box {{ margin-bottom: 4px; }}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.tx-list {{
  display: flex;
  flex-direction: column;
  gap: 16px;
}}
.tx-card {{
  background: #FFFFFF;
  border: 4px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}}
.tx-input {{
  font-family: monospace;
  font-size: 20px;
  font-weight: 800;
  color: #000000;
  background: #FAF9F5;
  border: 2px solid #000;
  padding: 8px 14px;
}}
.tx-meta {{
  display: flex;
  gap: 16px;
  font-size: 16px;
  font-weight: 700;
}}
.note-foot {{
  background: #FFE066;
  border: 3.5px solid #000000;
  box-shadow: 5px 5px 0px 0px #000000;
  padding: 16px 22px;
  font-size: 18px;
  font-weight: 800;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge">FITUR 01 / SMART INPUT</div>
      <div class="meta-tag">INPUT BAHASA ALAMI</div>
    </div>
    <div class="content-box">
      <div class="card-header-box">
        <h2>TULIS TRANSAKSI<br>SEPERTI BIASA</h2>
      </div>
      <div class="tx-list">
        <div class="tx-card">
          <div class="tx-input">&gt; bensin 50k bca</div>
          <div class="tx-meta">
            <span>Pengeluaran: <strong>Rp50.000</strong></span>
            <span>Dompet: <strong>BCA</strong></span>
          </div>
        </div>
        <div class="tx-card">
          <div class="tx-input">&gt; gaji bulanan 8jt bni</div>
          <div class="tx-meta">
            <span>Pemasukan: <strong>Rp8.000.000</strong></span>
            <span>Dompet: <strong>BNI</strong></span>
          </div>
        </div>
        <div class="tx-card">
          <div class="tx-input">&gt; kopi susu 22k gopay</div>
          <div class="tx-meta">
            <span>Pengeluaran: <strong>Rp22.000</strong></span>
            <span>Dompet: <strong>GoPay</strong></span>
          </div>
        </div>
      </div>
      <div class="note-foot">
        Tidak perlu memulai dari banyak pilihan menu. Tulis transaksi, periksa hasil pembacaannya, lalu simpan.
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER 02 / 04 &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-2-slide-2", p2_s2))

    # Pin 2 - Slide 3 (Scan Struk)
    p2_s3 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 26px; margin: auto 0; }}
.card-ocr {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 44px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.ocr-desc {{
  font-size: 21px;
  font-weight: 600;
  line-height: 1.5;
  color: #222222;
}}
.flow-box {{
  background: #FAF9F5;
  border: 3.5px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  padding: 22px 26px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}}
.flow-step {{
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 19px;
  font-weight: 800;
}}
.warn-box {{
  background: #fef08a;
  border: 2.5px solid #000000;
  padding: 12px 18px;
  font-size: 15px;
  font-weight: 800;
  color: #713f12;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge" style="background: #FFFFFF;">FITUR 02 / SCAN STRUK</div>
      <div class="meta-tag">BANTUAN OCR</div>
    </div>
    <div class="content-box">
      <div class="card-ocr">
        <h2>SCAN STRUK<br>LEBIH PRAKTIS</h2>
        <p class="ocr-desc">
          Tidak sempat mencatat transaksi satu per satu?<br>
          Gunakan fitur scan struk untuk membantu membaca informasi dari foto struk belanja.
        </p>
        <div class="flow-box">
          <div class="flow-step">
            <span style="font-size: 24px;">📸</span>
            <span>Foto struk fisik belanjaanmu.</span>
          </div>
          <div class="flow-step">
            <span style="font-size: 24px;">🔍</span>
            <span>Norden bantu membaca nama merchant & total.</span>
          </div>
          <div class="flow-step">
            <span style="font-size: 24px;">💾</span>
            <span>Periksa hasilnya, sesuaikan, lalu simpan.</span>
          </div>
        </div>
        <div class="warn-box">
          💡 Catatan kecil: Periksa kembali nominal dan detail transaksi sebelum menyimpannya.
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER 03 / 04 &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-2-slide-3", p2_s3))

    # Pin 2 - Slide 4 (Multi-Dompet)
    p2_s4 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-wallet {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 44px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.wallet-desc {{
  font-size: 20px;
  font-weight: 600;
  line-height: 1.45;
  color: #333333;
}}
.wallet-list {{
  display: flex;
  flex-direction: column;
  gap: 12px;
}}
.w-item {{
  background: #FAF9F5;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0px 0px #000000;
  padding: 12px 18px;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}}
.w-dot {{
  width: 10px;
  height: 10px;
  background: #000;
}}
.notice-box {{
  background: #f4f4f5;
  border: 2.5px solid #000000;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 700;
  color: #52525b;
  line-height: 1.4;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge" style="background: #bbf7d0;">FITUR 03 / KELOLA DOMPET</div>
      <div class="meta-tag">KONTROL SALDO</div>
    </div>
    <div class="content-box">
      <div class="card-wallet">
        <h2>SEMUA DOMPET<br>SATU TEMPAT</h2>
        <p class="wallet-desc">
          Punya rekening bank, e-wallet, dan uang tunai? Kelola semuanya dalam satu akun Norden Finance.
        </p>
        <div class="wallet-list">
          <div class="w-item"><div class="w-dot"></div><span>Pisahkan saldo berdasarkan dompet.</span></div>
          <div class="w-item"><div class="w-dot"></div><span>Catat transaksi sesuai sumber uangnya.</span></div>
          <div class="w-item"><div class="w-dot"></div><span>Lihat ringkasan pemasukan dan pengeluaran.</span></div>
          <div class="w-item"><div class="w-dot"></div><span>Ekspor laporan dalam format CSV, JSON, dan PDF.</span></div>
        </div>
        <div class="notice-box">
          Saldo mengikuti transaksi yang kamu catat. Norden tidak menghubungkan rekening bank untuk mengambil saldo secara otomatis.
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">SLIDE 04 / 04 • SELESAI</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-2-slide-4", p2_s4))

    # =========================================================================
    # CAROUSEL 3: PANDUAN MEMULAI & PRIVASI (4 SLIDES)
    # =========================================================================

    # Pin 3 - Slide 1 (Cover)
    p3_s1 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.hero-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-main {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 42px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}}
h1 {{
  font-size: 58px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.02em;
}}
.steps-list {{
  display: flex;
  flex-direction: column;
  gap: 14px;
}}
.step-item {{
  background: #FAF9F5;
  border: 3.5px solid #000000;
  box-shadow: 5px 5px 0px 0px #000000;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 18px;
}}
.step-num {{
  width: 44px;
  height: 44px;
  background: #FFE066;
  border: 2.5px solid #000000;
  box-shadow: 2.5px 2.5px 0px 0px #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 900;
  flex-shrink: 0;
}}
.step-title {{
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
}}
.step-desc {{
  font-size: 15px;
  font-weight: 600;
  color: #444444;
}}
.trial-notice {{
  background: #bbf7d0;
  border: 3px solid #000000;
  box-shadow: 5px 5px 0px 0px #000000;
  padding: 14px 20px;
  font-size: 17px;
  font-weight: 800;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge">PANDUAN MEMULAI</div>
      <div class="meta-tag">KENALAN DENGAN NORDEN</div>
    </div>
    <div class="hero-box">
      <div class="card-main">
        <h1>MULAI PAKAI<br>NORDEN FINANCE</h1>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-num">01</div>
            <div>
              <div class="step-title">BUKA NORDEN</div>
              <div class="step-desc">Kunjungi nordenfinance.site melalui browser ponsel atau komputer.</div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">02</div>
            <div>
              <div class="step-title">BUAT AKUN</div>
              <div class="step-desc">Daftar menggunakan email aktifmu. Tidak perlu kartu kredit.</div>
            </div>
          </div>
          <div class="step-item">
            <div class="step-num">03</div>
            <div>
              <div class="step-title">SELESAIKAN SETUP</div>
              <div class="step-desc">Lengkapi pengaturan awal, lalu mulai catat transaksi.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="trial-notice">
        ℹ️ Trial Pro 14 hari dimulai setelah setup awal selesai.
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER PANDUAN &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-3-slide-1", p3_s1))

    # Pin 3 - Slide 2 (Privasi dan Transparansi)
    p3_s2 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 26px; margin: auto 0; }}
.card-priv {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.priv-p {{
  font-size: 21px;
  font-weight: 600;
  line-height: 1.55;
  color: #222222;
}}
.highlight-box {{
  background: #FAF9F5;
  border-left: 6px solid #000000;
  padding: 20px 24px;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.45;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge" style="background: #FFFFFF;">PRIVASI DAN TRANSPARANSI</div>
      <div class="meta-tag">KENDALI PENUH</div>
    </div>
    <div class="content-box">
      <div class="card-priv">
        <h2>DATA KEUANGAN<br>TETAP DI TANGANMU</h2>
        <p class="priv-p">
          Norden tidak meminta kamu menghubungkan mobile banking atau memberikan PIN dan OTP bank untuk mengakses rekening.<br><br>
          Kamu sendiri yang memasukkan informasi saldo dan transaksi ke dalam aplikasi.
        </p>
        <div class="highlight-box">
          Dengan begitu, kamu tetap punya kendali atas informasi keuangan yang ingin dicatat.<br><br>
          Ingin tahu lebih jauh mengenai pengelolaan data? Kamu bisa membaca kebijakan privasi Norden Finance di website kami.
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER 02 / 04 &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-3-slide-2", p3_s2))

    # Pin 3 - Slide 3 (Apa yang Didapat dari Trial Pro?)
    p3_s3 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-pro {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 44px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.pro-p {{
  font-size: 19px;
  font-weight: 600;
  color: #333333;
}}
.feature-list {{
  display: flex;
  flex-direction: column;
  gap: 12px;
}}
.f-item {{
  background: #FAF9F5;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0px 0px #000000;
  padding: 12px 18px;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}}
.check {{
  color: #059669;
  font-size: 20px;
}}
.pro-note {{
  background: #f4f4f5;
  border: 2.5px solid #000000;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 700;
  color: #3f3f46;
  line-height: 1.4;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge" style="background: #FFE066;">TRIAL PRO 14 HARI</div>
      <div class="meta-tag">FITUR LENGKAP</div>
    </div>
    <div class="content-box">
      <div class="card-pro">
        <h2>KENALI FITUR<br>TRIAL PRO</h2>
        <p class="pro-p">Selama periode trial Pro, kamu bisa mencoba fitur-fitur yang tersedia dalam paket Pro, seperti:</p>
        <div class="feature-list">
          <div class="f-item"><span class="check">✔</span><span>Smart Input untuk mencatat transaksi.</span></div>
          <div class="f-item"><span class="check">✔</span><span>Scan struk dengan bantuan OCR.</span></div>
          <div class="f-item"><span class="check">✔</span><span>Pengelolaan beberapa dompet.</span></div>
          <div class="f-item"><span class="check">✔</span><span>Pengaturan kategori dan anggaran.</span></div>
          <div class="f-item"><span class="check">✔</span><span>Ringkasan dan ekspor laporan keuangan.</span></div>
        </div>
        <div class="pro-note">
          Tidak perlu memasukkan kartu kredit.<br>
          Setelah trial selesai, akses akan mengikuti paket Free Basic. Tidak ada tagihan otomatis. Kamu bisa memilih paket Pro secara terpisah apabila ingin melanjutkan.
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">GESER 03 / 04 &rarr;</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-3-slide-3", p3_s3))

    # Pin 3 - Slide 4 (FAQ dan CTA)
    p3_s4 = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.content-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.card-faq {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 42px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}}
h2 {{
  font-size: 50px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.qa-box {{
  display: flex;
  flex-direction: column;
  gap: 14px;
}}
.qa-item {{
  background: #FAF9F5;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0px 0px #000000;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}}
.qa-q {{
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  color: #000000;
}}
.qa-a {{
  font-size: 15px;
  font-weight: 600;
  color: #444444;
  line-height: 1.4;
}}
.cta-btn {{
  background: #FFE066;
  border: 4px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  padding: 18px 24px;
  font-size: 20px;
  font-weight: 900;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 6px;
}}
</style></head>
<body>
  <div class="portrait">
    <div class="top-header">
      <div class="badge">SEBELUM MULAI</div>
      <div class="meta-tag">FAQ & MULAI SEKARANG</div>
    </div>
    <div class="content-box">
      <div class="card-faq">
        <h2>PUNYA PERTANYAAN?<br>MULAI DI SINI</h2>
        <div class="qa-box">
          <div class="qa-item">
            <div class="qa-q">Q: Harus download dari App Store / Play Store?</div>
            <div class="qa-a">Tidak. Norden bisa dibuka langsung melalui browser ponsel maupun komputer.</div>
          </div>
          <div class="qa-item">
            <div class="qa-q">Q: Apakah laporan keuangan bisa disimpan?</div>
            <div class="qa-a">Bisa. Tersedia ekspor laporan dalam format CSV, JSON, dan PDF.</div>
          </div>
          <div class="qa-item">
            <div class="qa-q">Q: Apakah trial langsung dimulai saat daftar?</div>
            <div class="qa-a">Trial dimulai setelah kamu menyelesaikan setup awal akun.</div>
          </div>
        </div>
        <div class="cta-btn">MULAI DI NORDENFINANCE.SITE &rarr;</div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="page-tag">SLIDE 04 / 04 • SELESAI</div>
    </div>
  </div>
</body></html>"""
    pins.append(("pin-3-slide-4", p3_s4))

    # Write all HTML files
    for name, html in pins:
        with open(os.path.join(html_dir, f"{name}.html"), 'w', encoding='utf-8') as f:
            f.write(html)

    # Start local server to render images
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=html_dir, **kwargs)
        def log_message(self, format, *args):
            pass

    port = 8997
    httpd = HTTPServer(('127.0.0.1', port), Handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()

    edge_path = r'C:\Program Files (x86)\Microsoft\EdgeCore\157.0.4341.46\msedge.exe'

    for name, html in pins:
        temp_png = os.path.join(temp_dir, f"{name}_temp.png")
        final_png = os.path.join(out_base, f"{name}.png")

        cmd = [
            edge_path,
            '--headless',
            '--disable-gpu',
            '--window-size=1080,1350',
            '--hide-scrollbars',
            '--force-device-scale-factor=1',
            f'--screenshot={temp_png}',
            f'http://127.0.0.1:{port}/{name}.html'
        ]
        subprocess.run(cmd, capture_output=True)

        if os.path.exists(temp_png):
            with Image.open(temp_png) as im:
                if im.size != (1080, 1350):
                    im = im.crop((0, 0, 1080, 1350))
                im.convert("RGB").save(final_png, "PNG", optimize=True)
                print(f"Created: {final_png} ({os.path.getsize(final_png)} bytes)")
            os.remove(temp_png)

    # Also keep legacy aliases for backward compatibility of file paths
    legacy_map = [
        ("pin-1-slide-1.png", "pin-1-manifesto.png"),
        ("pin-2-slide-1.png", "pin-2-features.png"),
        ("pin-3-slide-1.png", "pin-3-guide.png"),
    ]
    for src_name, dst_name in legacy_map:
        src_p = os.path.join(out_base, src_name)
        dst_p = os.path.join(out_base, dst_name)
        if os.path.exists(src_p):
            with Image.open(src_p) as im:
                im.save(dst_p, "PNG")

    httpd.shutdown()

    # Create 3-Pin Grid Simulation Image (Instagram Profile Grid Layout)
    print("Generating simulated Instagram 3-Pin Profile Grid...")
    grid_canvas = Image.new('RGB', (3240, 1500), '#FAF9F5')
    draw_grid = ImageDraw.Draw(grid_canvas)

    draw_grid.rectangle([0, 0, 3240, 140], fill='#FFE066', outline='#000000', width=6)
    try:
        font_main = ImageFont.truetype('arial.ttf', 50)
        font_sub = ImageFont.truetype('arial.ttf', 28)
    except:
        font_main = font_sub = None

    draw_grid.text((80, 42), "NORDEN FINANCE — INSTAGRAM PINNED POSTS TRIFECTA (PROFILE VIEW)", fill='#000000', font=font_main)

    pin_files = ["pin-1-slide-1.png", "pin-2-slide-1.png", "pin-3-slide-1.png"]
    labels = [
        "KIRI: KENALAN DENGAN NORDEN FINANCE",
        "TENGAH: CARA KERJA SMART INPUT",
        "KANAN: PANDUAN MEMULAI & PRIVASI"
    ]

    for idx, (pf, lbl) in enumerate(zip(pin_files, labels)):
        p_path = os.path.join(out_base, pf)
        if os.path.exists(p_path):
            with Image.open(p_path) as im:
                thumb = im.resize((960, 1200), Image.Resampling.LANCZOS)
                x = 80 + idx * 1040
                y = 180

                draw_grid.rectangle([x, y, x + 960, y + 1200], fill='#FFFFFF', outline='#000000', width=6)
                grid_canvas.paste(thumb, (x, y))

                draw_grid.rectangle([x + 20, y + 20, x + 540, y + 70], fill='#FFE066', outline='#000000', width=3)
                draw_grid.text((x + 35, y + 26), lbl, fill='#000000', font=font_sub)

    grid_path = os.path.join(out_base, 'pinned-trifecta-showcase.png')
    grid_canvas.save(grid_path, "PNG", optimize=True)
    print(f"Created Trifecta Showcase: {grid_path}")

if __name__ == '__main__':
    generate_pinned_posts()
