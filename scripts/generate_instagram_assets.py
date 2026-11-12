import os
import base64
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from PIL import Image

def get_base64_image(rel_path):
    if os.path.exists(rel_path):
        with open(rel_path, 'rb') as f:
            ext = os.path.splitext(rel_path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/svg+xml' if ext == '.svg' else 'image/jpeg'
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

def main():
    print("Loading brand assets...")
    icon_b64 = get_base64_image('public/brand/norden-icon.png')
    horizontal_b64 = get_base64_image('public/brand/norden-horizontal.png')
    favicon_b64 = get_base64_image('public/brand/favicon-64.png')

    out_base = r'D:\norden-finance\public\instagram'
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
    .slide-portrait {
      width: 1080px;
      height: 1350px;
      padding: 72px 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .slide-square {
      width: 1080px;
      height: 1080px;
      padding: 64px 60px;
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
    .brand-pill {
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
    .pagination-badge {
      background: #FFFFFF;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      padding: 6px 14px;
      font-weight: 900;
      font-size: 14px;
      text-transform: uppercase;
    }
    """

    # =========================================================================
    # SLIDE 1: Brand Reveal
    # =========================================================================
    slide1_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.hero-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.reveal-card {{
  background: #FFE066;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 44px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}}
.logo-box {{
  background: #FFFFFF;
  border: 3.5px solid #000000;
  box-shadow: 5px 5px 0px 0px #000000;
  padding: 16px 24px;
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
  line-height: 1.5;
  color: #111111;
}}
.pills-row {{
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}}
.tag-pill {{
  background: #FFFFFF;
  border: 3px solid #000000;
  box-shadow: 4px 4px 0px 0px #000000;
  padding: 10px 16px;
  font-size: 15px;
  font-weight: 900;
  text-transform: uppercase;
}}
</style></head>
<body>
  <div class="slide-portrait">
    <div class="top-header">
      <div class="brand-pill">NORDEN FINANCE / IDENTITAS VISUAL BARU</div>
      <div class="meta-tag">KENALAN DENGAN NORDEN</div>
    </div>
    <div class="hero-box">
      <div class="reveal-card">
        <div class="logo-box">
          <img src="{horizontal_b64}" style="height: 48px; width: auto; object-fit: contain;" />
        </div>
        <h1>WAJAH BARU<br>NORDEN FINANCE</h1>
        <p class="desc">
          Kami memperbarui tampilan Norden agar lebih sederhana, tegas, dan nyaman digunakan.<br><br>
          Bukan hanya soal tampilan. Yang paling penting, informasi keuanganmu tetap mudah ditemukan dan dipahami.
        </p>
      </div>
      <div class="pills-row">
        <div class="tag-pill" style="background: #bbf7d0;">TAMPILAN BARU</div>
        <div class="tag-pill" style="background: #FFE066;">WARNA YANG PUNYA FUNGSI</div>
        <div class="tag-pill" style="background: #bfdbfe;">FOKUS PADA INFORMASI</div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="pagination-badge">GESER 01 / 05 &rarr;</div>
    </div>
  </div>
</body></html>"""

    # =========================================================================
    # SLIDE 2: Filosofi Desain
    # =========================================================================
    slide2_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.main-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
h2 {{
  font-size: 54px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.principles-grid {{
  display: flex;
  flex-direction: column;
  gap: 16px;
}}
.p-card {{
  background: #FFFFFF;
  border: 4px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}}
.p-title {{
  font-size: 19px;
  font-weight: 900;
  text-transform: uppercase;
  color: #000000;
  display: flex;
  align-items: center;
  gap: 10px;
}}
.p-desc {{
  font-size: 17px;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
}}
</style></head>
<body>
  <div class="slide-portrait">
    <div class="top-header">
      <div class="brand-pill" style="background: #FFFFFF;">FILOSOFI DESAIN</div>
      <div class="meta-tag">DIBUAT UNTUK DIGUNAKAN</div>
    </div>
    <div class="main-box">
      <div>
        <h2>DESAIN YANG<br>PUNYA FUNGSI</h2>
      </div>
      <div class="principles-grid">
        <div class="p-card">
          <div class="p-title">
            <span style="background: #000; color: #FFF; padding: 2px 8px; font-size: 13px;">01</span>
            <span>BENTUK YANG TEGAS</span>
          </div>
          <div class="p-desc">Garis dan sudut yang jelas membuat setiap bagian terasa terstruktur.</div>
        </div>
        <div class="p-card">
          <div class="p-title">
            <span style="background: #FFE066; border: 1.5px solid #000; padding: 2px 8px; font-size: 13px;">02</span>
            <span>WARNA KUNING</span>
          </div>
          <div class="p-desc">Menjadi warna utama untuk menarik perhatian ke bagian yang penting.</div>
        </div>
        <div class="p-card">
          <div class="p-title">
            <span style="background: #f4f4f5; border: 1.5px solid #000; padding: 2px 8px; font-size: 13px;">03</span>
            <span>KONTRAS YANG JELAS</span>
          </div>
          <div class="p-desc">Border hitam dan bayangan tegas membantu membedakan elemen dan informasi.</div>
        </div>
        <div class="p-card">
          <div class="p-title">
            <span style="background: #bbf7d0; border: 1.5px solid #000; padding: 2px 8px; font-size: 13px;">04</span>
            <span>WARNA SESUAI FUNGSI</span>
          </div>
          <div class="p-desc">Mint untuk pemasukan, coral untuk pengeluaran, dan biru untuk transfer atau informasi.</div>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="pagination-badge">GESER 02 / 05 &rarr;</div>
    </div>
  </div>
</body></html>"""

    # =========================================================================
    # SLIDE 3: Sistem Identitas Logo
    # =========================================================================
    slide3_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.main-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
h2 {{
  font-size: 52px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.variants-list {{
  display: flex;
  flex-direction: column;
  gap: 18px;
}}
.v-card {{
  background: #FFFFFF;
  border: 4px solid #000000;
  box-shadow: 7px 7px 0px 0px #000000;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 24px;
}}
.v-thumb {{
  width: 140px;
  height: 90px;
  background: #FAF9F5;
  border: 2.5px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  flex-shrink: 0;
}}
.v-thumb img {{
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}}
.v-meta {{
  display: flex;
  flex-direction: column;
  gap: 4px;
}}
.v-title {{
  font-size: 20px;
  font-weight: 900;
  text-transform: uppercase;
}}
.v-desc {{
  font-size: 16px;
  font-weight: 600;
  color: #444444;
  line-height: 1.4;
}}
</style></head>
<body>
  <div class="slide-portrait">
    <div class="top-header">
      <div class="brand-pill" style="background: #FFE066;">IDENTITAS VISUAL</div>
      <div class="meta-tag">SATU IDENTITAS, BERBAGAI UKURAN</div>
    </div>
    <div class="main-box">
      <div>
        <h2>LOGO NORDEN<br>DI BERBAGAI UKURAN</h2>
      </div>
      <div class="variants-list">
        <div class="v-card">
          <div class="v-thumb">
            <img src="{horizontal_b64}" alt="Horizontal Logo" />
          </div>
          <div class="v-meta">
            <div class="v-title">01 / HORIZONTAL LOGO</div>
            <div class="v-desc">Untuk website, halaman utama, dan kebutuhan komunikasi brand.</div>
          </div>
        </div>
        <div class="v-card">
          <div class="v-thumb" style="background: #FFE066;">
            <img src="{icon_b64}" alt="Icon Mark" />
          </div>
          <div class="v-meta">
            <div class="v-title">02 / ICON MARK</div>
            <div class="v-desc">Untuk tampilan aplikasi dan kebutuhan visual berukuran kecil.</div>
          </div>
        </div>
        <div class="v-card">
          <div class="v-thumb" style="background: #FAF9F5; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 10px;">
            <div style="background: #FFFFFF; border: 2.5px solid #000000; box-shadow: 3px 3px 0px 0px #000000; padding: 6px 12px; display: inline-flex; align-items: center; gap: 8px;">
              <img src="{favicon_b64}" alt="Favicon" style="width: 24px; height: 24px; object-fit: contain; display: block;" />
              <span style="font-size: 13px; font-weight: 800; color: #000000; letter-spacing: -0.01em;">Norden</span>
              <span style="font-size: 14px; font-weight: 900; color: #666666; margin-left: 2px; line-height: 1;">&times;</span>
            </div>
            <span style="font-size: 10px; font-weight: 900; color: #555555; letter-spacing: 0.08em; text-transform: uppercase;">TAB BROWSER</span>
          </div>
          <div class="v-meta">
            <div class="v-title">03 / FAVICON</div>
            <div class="v-desc">Untuk identitas Norden pada tab browser aktif.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="pagination-badge">GESER 03 / 05 &rarr;</div>
    </div>
  </div>
</body></html>"""

    # =========================================================================
    # SLIDE 4: Brand In Action
    # =========================================================================
    slide4_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.main-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
h2 {{
  font-size: 52px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.modules-list {{
  display: flex;
  flex-direction: column;
  gap: 16px;
}}
.mod-card {{
  background: #FFFFFF;
  border: 4px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}}
.mod-title {{
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  color: #000000;
}}
.input-demo {{
  font-family: monospace;
  font-size: 19px;
  font-weight: 800;
  background: #FAF9F5;
  border: 2px solid #000;
  padding: 8px 14px;
}}
.mod-desc {{
  font-size: 16px;
  font-weight: 600;
  color: #444444;
  line-height: 1.4;
}}
</style></head>
<body>
  <div class="slide-portrait">
    <div class="top-header">
      <div class="brand-pill" style="background: #FFFFFF;">FITUR NORDEN FINANCE</div>
      <div class="meta-tag">FUNGSI TETAP BERGUNA</div>
    </div>
    <div class="main-box">
      <div>
        <h2>FITUR YANG<br>BISA KAMU PAKAI</h2>
      </div>
      <div class="modules-list">
        <div class="mod-card">
          <div class="mod-title">01 / SMART INPUT</div>
          <div class="input-demo">&gt; ayam geprek 18k cash</div>
          <div style="display: flex; gap: 10px; font-size: 15px; font-weight: 800;">
            <span style="background: #fecdd3; border: 1.5px solid #000; padding: 2px 8px;">-Rp18.000</span>
            <span style="background: #bbf7d0; border: 1.5px solid #000; padding: 2px 8px;">Makanan</span>
            <span style="background: #bfdbfe; border: 1.5px solid #000; padding: 2px 8px;">Tunai</span>
          </div>
        </div>
        <div class="mod-card">
          <div class="mod-title">02 / MULTI-DOMPET</div>
          <p class="mod-desc">Kelola rekening bank, e-wallet, dan uang tunai dalam satu akun terorganisir.</p>
        </div>
        <div class="mod-card">
          <div class="mod-title">03 / RINGKASAN KEUANGAN</div>
          <p class="mod-desc">Lihat pemasukan dan pengeluaran dalam satu tampilan yang jelas tanpa distraksi.</p>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="pagination-badge">GESER 04 / 05 &rarr;</div>
    </div>
  </div>
</body></html>"""

    # =========================================================================
    # SLIDE 5: Call to Action
    # =========================================================================
    slide5_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.main-box {{ display: flex; flex-direction: column; gap: 26px; margin: auto 0; }}
.cta-card {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 48px 42px;
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
.points-list {{
  display: flex;
  flex-direction: column;
  gap: 12px;
}}
.pt-item {{
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
.pt-dot {{
  width: 10px;
  height: 10px;
  background: #000000;
  flex-shrink: 0;
}}
.sub-info {{
  font-size: 15px;
  font-weight: 700;
  color: #555555;
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
  margin-top: 6px;
}}
</style></head>
<body>
  <div class="slide-portrait">
    <div class="top-header">
      <div class="brand-pill">MULAI MENGENAL NORDEN</div>
      <div class="meta-tag">14 HARI TRIAL PRO</div>
    </div>
    <div class="main-box">
      <div class="cta-card">
        <h2>COBA SENDIRI<br>NORDEN FINANCE</h2>
        <div class="points-list">
          <div class="pt-item"><div class="pt-dot"></div><span>Trial Pro selama 14 hari.</span></div>
          <div class="pt-item"><div class="pt-dot"></div><span>Tidak perlu kartu kredit.</span></div>
          <div class="pt-item"><div class="pt-dot"></div><span>Tidak ada tagihan otomatis setelah trial.</span></div>
          <div class="pt-item"><div class="pt-dot"></div><span>Bisa digunakan melalui browser ponsel atau komputer.</span></div>
        </div>
        <p class="sub-info">Trial dimulai setelah setup awal selesai.</p>
        <div class="cta-btn">KUNJUNGI NORDENFINANCE.SITE &rarr;</div>
        <p class="sub-info" style="text-align: center;">Tautan pendaftaran juga tersedia di bio Instagram.</p>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="pagination-badge">SLIDE 05 / 05 • SELESAI</div>
    </div>
  </div>
</body></html>"""

    # =========================================================================
    # SINGLE SQUARE POST (1:1 • 1080x1080)
    # =========================================================================
    post_square_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>{common_css}
.main-box {{ display: flex; flex-direction: column; gap: 24px; margin: auto 0; }}
.hero-card {{
  background: #FFFFFF;
  border: 5px solid #000000;
  box-shadow: 12px 12px 0px 0px #000000;
  padding: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}}
.icon-box {{
  width: 140px;
  height: 140px;
  background: #FFE066;
  border: 4px solid #000000;
  box-shadow: 6px 6px 0px 0px #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}}
.icon-box img {{
  width: 100%;
  height: 100%;
  object-fit: contain;
}}
h1 {{
  font-size: 52px;
  font-weight: 900;
  text-transform: uppercase;
  line-height: 1.05;
  letter-spacing: -0.01em;
}}
.desc {{
  font-size: 20px;
  font-weight: 600;
  color: #333333;
  line-height: 1.45;
  max-width: 680px;
}}
.pills-row {{
  display: flex;
  gap: 12px;
}}
.pill {{
  background: #FAF9F5;
  border: 2.5px solid #000000;
  box-shadow: 3px 3px 0px 0px #000000;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}}
</style></head>
<body>
  <div class="slide-square">
    <div class="top-header">
      <div class="brand-pill">NORDEN FINANCE / 2026</div>
      <div class="meta-tag">PENGELOLAAN KEUANGAN PRIBADI</div>
    </div>
    <div class="main-box">
      <div class="hero-card">
        <div class="icon-box">
          <img src="{icon_b64}" alt="Norden Icon" />
        </div>
        <h1>KENALI UANGMU<br>BERSAMA NORDEN</h1>
        <p class="desc">
          Catat transaksi, kelola beberapa dompet, dan lihat gambaran keuanganmu dalam satu tempat.
        </p>
        <div class="pills-row">
          <div class="pill" style="background: #bbf7d0;">SMART INPUT</div>
          <div class="pill" style="background: #bfdbfe;">MULTI-DOMPET</div>
          <div class="pill" style="background: #FFE066;">TRIAL PRO 14 HARI</div>
        </div>
      </div>
    </div>
    <div class="bottom-bar">
      <div class="handle-tag">@norden.finance • nordenfinance.site</div>
      <div class="pagination-badge">FEED LAUNCH POST</div>
    </div>
  </div>
</body></html>"""

    slides = [
        ("slide-1-reveal", slide1_html, (1080, 1350)),
        ("slide-2-anatomy", slide2_html, (1080, 1350)),
        ("slide-3-variants", slide3_html, (1080, 1350)),
        ("slide-4-action", slide4_html, (1080, 1350)),
        ("slide-5-cta", slide5_html, (1080, 1350)),
        ("post-square-hero", post_square_html, (1080, 1080)),
    ]

    for name, html, _ in slides:
        with open(os.path.join(html_dir, f"{name}.html"), 'w', encoding='utf-8') as f:
            f.write(html)
        print(f"Saved HTML: {os.path.join(html_dir, f'{name}.html')}")

    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=html_dir, **kwargs)
        def log_message(self, format, *args):
            pass

    port = 8996
    httpd = HTTPServer(('127.0.0.1', port), Handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()

    edge_path = r'C:\Program Files (x86)\Microsoft\EdgeCore\157.0.4341.46\msedge.exe'

    for name, _, (w, h) in slides:
        temp_png = os.path.join(temp_dir, f"{name}_temp.png")
        final_png = os.path.join(out_base, f"{name}.png")

        cmd = [
            edge_path,
            '--headless',
            '--disable-gpu',
            f'--window-size={w},{h}',
            '--hide-scrollbars',
            '--force-device-scale-factor=1',
            f'--screenshot={temp_png}',
            f'http://127.0.0.1:{port}/{name}.html'
        ]
        subprocess.run(cmd, capture_output=True)

        if os.path.exists(temp_png):
            with Image.open(temp_png) as im:
                if im.size != (w, h):
                    im = im.crop((0, 0, w, h))
                im.convert("RGB").save(final_png, "PNG", optimize=True)
                print(f"Created: {final_png} ({os.path.getsize(final_png)} bytes)")
            os.remove(temp_png)

    httpd.shutdown()
    print("All Instagram feed assets rendered successfully!")

if __name__ == '__main__':
    main()
