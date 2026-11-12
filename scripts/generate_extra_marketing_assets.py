import os
import base64
import subprocess
import threading
import zipfile
from http.server import HTTPServer, SimpleHTTPRequestHandler

def get_base64_image(rel_path):
    if os.path.exists(rel_path):
        with open(rel_path, 'rb') as f:
            ext = os.path.splitext(rel_path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/svg+xml' if ext == '.svg' else 'image/jpeg'
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

def generate_all():
    base_dir = r'D:\norden-finance\public\instagram'
    icon_b64 = get_base64_image(os.path.join(r'D:\norden-finance\public\brand\norden-icon.png'))
    cheatsheet_dir = os.path.join(base_dir, 'cheatsheet')
    highlights_dir = os.path.join(base_dir, 'highlights')
    stories_dir = os.path.join(base_dir, 'stories')
    zips_dir = os.path.join(base_dir, 'zips')

    os.makedirs(cheatsheet_dir, exist_ok=True)
    os.makedirs(highlights_dir, exist_ok=True)
    os.makedirs(stories_dir, exist_ok=True)
    os.makedirs(zips_dir, exist_ok=True)

    html_dir = os.path.join(base_dir, 'extra_html')
    os.makedirs(html_dir, exist_ok=True)

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
    .story-canvas {
      width: 1080px;
      height: 1920px;
      padding: 96px 72px 88px 72px;
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
      border: 3.5px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      padding: 8px 20px;
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .badge-green {
      background: #bbf7d0;
      border: 3.5px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      padding: 8px 20px;
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .badge-blue {
      background: #bfdbfe;
      border: 3.5px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      padding: 8px 20px;
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
      gap: 24px;
    }
    .card-neo-yellow {
      background: #FFE066;
      border: 5px solid #000000;
      box-shadow: 12px 12px 0px 0px #000000;
      padding: 44px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .h-portrait {
      font-size: 52px;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.05;
      letter-spacing: -0.01em;
    }
    .h-story {
      font-size: 58px;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.05;
      letter-spacing: -0.01em;
    }
    .lead-text {
      font-size: 21px;
      font-weight: 600;
      line-height: 1.45;
      color: #222222;
      margin-top: 10px;
    }
    .demo-box {
      background: #FAF9F5;
      border: 3.5px solid #000000;
      box-shadow: 5px 5px 0px 0px #000000;
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .demo-label {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #666666;
    }
    .demo-code {
      font-family: monospace;
      font-size: 21px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }
    .result-row {
      display: flex;
      gap: 12px;
      margin-top: 4px;
      flex-wrap: wrap;
    }
    .res-pill {
      border: 2px solid #000000;
      padding: 5px 12px;
      font-weight: 900;
      font-size: 15px;
    }
    .btn-cta {
      background: #FFE066;
      border: 4.5px solid #000000;
      box-shadow: 7px 7px 0px 0px #000000;
      padding: 20px 28px;
      font-size: 21px;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-top: 8px;
    }
    .list-items {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .list-row {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      font-size: 21px;
      font-weight: 600;
      line-height: 1.4;
    }
    .bullet-sq {
      width: 14px;
      height: 14px;
      background: #000000;
      margin-top: 8px;
      flex-shrink: 0;
    }
    """

    tasks = []

    # =========================================================================
    # PART 1: FEED CAROUSEL TERAKHIR (5 SLIDES • 4:5 • 1080x1350)
    # =========================================================================
    cs_slides = [
        # Slide 1: Cover
        ("cs-slide-01", "cheatsheet", "slide-01.png", (1080, 1350), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="portrait">
          <div class="top-header">
            <div class="badge">CARA CATAT TRANSAKSI</div>
            <div class="meta-tag">SMART INPUT GUIDE</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 24px; margin: auto 0;">
            <div>
              <div class="h-portrait">SMART INPUT<br>CHEAT SHEET</div>
              <p class="lead-text">Tulis transaksi seperti biasa. Norden membantu membaca nominal, kategori, diskon, dan dompet yang kamu gunakan.</p>
            </div>
            <div class="card-neo-yellow">
              <div style="font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em;">EMPAT BAGIAN CHEAT SHEET:</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div style="background: #FFFFFF; border: 3px solid #000; box-shadow: 4px 4px 0 #000; padding: 14px; font-weight: 900; font-size: 15px; line-height: 1.3;">01 / MAKAN &amp; DISKON<br><span style="font-size: 13px; font-weight: 600; color: #444;">Harga, potongan, dan pajak dalam satu input.</span></div>
                <div style="background: #FFFFFF; border: 3px solid #000; box-shadow: 4px 4px 0 #000; padding: 14px; font-weight: 900; font-size: 15px; line-height: 1.3;">02 / PINDAH SALDO<br><span style="font-size: 13px; font-weight: 600; color: #444;">Tarik tunai &amp; transfer tanpa pengeluaran ganda.</span></div>
                <div style="background: #FFFFFF; border: 3px solid #000; box-shadow: 4px 4px 0 #000; padding: 14px; font-weight: 900; font-size: 15px; line-height: 1.3;">03 / BENSIN &amp; ASET<br><span style="font-size: 13px; font-weight: 600; color: #444;">Input literan bensin, valas, dan emas.</span></div>
                <div style="background: #FFFFFF; border: 3px solid #000; box-shadow: 4px 4px 0 #000; padding: 14px; font-weight: 900; font-size: 15px; line-height: 1.3;">04 / TAGIHAN BERSAMA<br><span style="font-size: 13px; font-weight: 600; color: #444;">Bagi tagihan sesuai pesanan masing-masing.</span></div>
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance • nordenfinance.site</div>
            <div class="page-tag">GESER LIHAT CHEAT SHEET &rarr; [ 01 / 05 ]</div>
          </div>
        </div></body></html>"""),

        # Slide 2: Diskon & Pajak Restoran
        ("cs-slide-02", "cheatsheet", "slide-02.png", (1080, 1350), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="portrait">
          <div class="top-header">
            <div class="badge">CHEAT SHEET 01</div>
            <div class="meta-tag">MAKAN SIANG DAN BELANJA</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 24px; margin: auto 0;">
            <div>
              <div class="h-portrait">HITUNG DISKON<br>DAN PAJAK</div>
              <p class="lead-text">Ketik potongan persen atau pajak langsung di kalimat yang sama.</p>
            </div>
            <div class="card-neo">
              <div class="demo-box">
                <div class="demo-label">CONTOH 1: DISKON MAKAN SIANG</div>
                <div class="demo-code">&gt; makan siang 120k bca diskon 20%</div>
                <div class="result-row">
                  <span class="res-pill" style="background: #fecdd3;">-Rp96.000</span>
                  <span class="res-pill" style="background: #bbf7d0;">Makanan</span>
                  <span class="res-pill" style="background: #bfdbfe;">BCA</span>
                </div>
              </div>
              <div class="demo-box" style="background: #FFE066;">
                <div class="demo-label" style="color: #000;">CONTOH 2: DISKON PLUS PAJAK RESTO 10%</div>
                <div class="demo-code">&gt; sushi 350k mandiri diskon 10% + tax 10%</div>
                <div class="result-row">
                  <span class="res-pill" style="background: #fecdd3;">-Rp346.500</span>
                  <span class="res-pill" style="background: #bbf7d0;">Restoran</span>
                  <span class="res-pill" style="background: #FFFFFF;">Mandiri</span>
                </div>
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #444; border-left: 3.5px solid #000; padding-left: 14px;">
                Pada contoh ini, diskon dihitung lebih dulu. Pajak kemudian dihitung dari harga setelah diskon.
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance • nordenfinance.site</div>
            <div class="page-tag">GESER &rarr; [ 02 / 05 ]</div>
          </div>
        </div></body></html>"""),

        # Slide 3: Mutasi Saldo & Tarik Tunai
        ("cs-slide-03", "cheatsheet", "slide-03.png", (1080, 1350), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="portrait">
          <div class="top-header">
            <div class="badge">CHEAT SHEET 02</div>
            <div class="meta-tag">PINDAH UANG ANTAR-DOMPET</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 24px; margin: auto 0;">
            <div>
              <div class="h-portrait">TARIK TUNAI<br>BUKAN PENGELUARAN</div>
              <p class="lead-text">Uang hanya berpindah dari satu dompet ke dompet lain tanpa menambah beban belanja.</p>
            </div>
            <div class="card-neo">
              <div class="demo-box">
                <div class="demo-label">CONTOH 3: TARIK TUNAI DI ATM</div>
                <div class="demo-code">&gt; tarik tunai 500k bca ke cash</div>
                <div class="result-row">
                  <span class="res-pill" style="background: #fecdd3;">BCA -Rp500.000</span>
                  <span class="res-pill" style="background: #bbf7d0;">Tunai +Rp500.000</span>
                  <span class="res-pill" style="background: #FFFFFF;">Mutasi Saldo</span>
                </div>
              </div>
              <div class="demo-box">
                <div class="demo-label">CONTOH 4: TRANSFER ANTAR-DOMPET</div>
                <div class="demo-code">&gt; transfer 200k bni ke gopay</div>
                <div class="result-row">
                  <span class="res-pill" style="background: #fecdd3;">BNI -Rp200.000</span>
                  <span class="res-pill" style="background: #bbf7d0;">GoPay +Rp200.000</span>
                </div>
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #444; border-left: 3.5px solid #000; padding-left: 14px;">
                Uangnya hanya berpindah dari satu dompet ke dompet lain. Jadi, transaksi ini tidak menambah total pengeluaran.
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance • nordenfinance.site</div>
            <div class="page-tag">GESER &rarr; [ 03 / 05 ]</div>
          </div>
        </div></body></html>"""),

        # Slide 4: Bensin Literan, Valas, dan Emas
        ("cs-slide-04", "cheatsheet", "slide-04.png", (1080, 1350), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="portrait">
          <div class="top-header">
            <div class="badge">CHEAT SHEET 03</div>
            <div class="meta-tag">BENSIN, MATA UANG, DAN EMAS</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 24px; margin: auto 0;">
            <div>
              <div class="h-portrait">CATAT BENSIN<br>VALAS DAN EMAS</div>
              <p class="lead-text">Smart Input membaca satuan liter BBM, mata uang asing, dan tabungan emas fisik.</p>
            </div>
            <div class="card-neo">
              <div class="demo-box">
                <div class="demo-label">CONTOH 5: ISI BENSIN PERTAMAX</div>
                <div class="demo-code">&gt; isi bensin pertamax 20 liter bca</div>
                <div class="result-row">
                  <span class="res-pill" style="background: #fecdd3;">-Rp259.000</span>
                  <span class="res-pill" style="background: #bbf7d0;">Transportasi</span>
                </div>
              </div>
              <div class="demo-box">
                <div class="demo-label">CONTOH 6: BELI DOLLAR USD</div>
                <div class="demo-code">&gt; beli 100 usd bca</div>
                <div class="result-row">
                  <span class="res-pill" style="background: #bfdbfe;">+100 USD | Mengikuti kurs acuan rupiah</span>
                </div>
              </div>
              <div class="demo-box">
                <div class="demo-label">CONTOH 7: TABUNGAN EMAS</div>
                <div class="demo-code">&gt; beli emas 2 gram bsi</div>
                <div class="result-row">
                  <span class="res-pill" style="background: #FFE066;">+2 gram emas | Tercatat sebagai aset</span>
                </div>
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance • nordenfinance.site</div>
            <div class="page-tag">GESER &rarr; [ 04 / 05 ]</div>
          </div>
        </div></body></html>"""),

        # Slide 5: Rangkuman & CTA
        ("cs-slide-05", "cheatsheet", "slide-05.png", (1080, 1350), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="portrait">
          <div class="top-header">
            <div class="badge">SAVE THIS POST</div>
            <div class="meta-tag">CHEAT SHEET SIAP DISIMPAN</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 20px; margin: auto 0;">
            <div>
              <div class="h-portrait">SIMPAN DULU<br>COBA NANTI</div>
              <p class="lead-text">Simpan postingan ini supaya contoh inputnya bisa kamu lihat lagi saat mencatat transaksi.</p>
            </div>
            <div class="card-neo" style="gap: 16px; padding: 34px;">
              <div class="list-items" style="gap: 12px;">
                <div class="list-row"><div class="bullet-sq"></div><span>Coba trial Pro selama 14 hari tanpa kartu kredit.</span></div>
                <div class="list-row"><div class="bullet-sq"></div><span>Buka Norden langsung melalui browser ponsel atau laptop.</span></div>
                <div class="list-row"><div class="bullet-sq"></div><span>Mulai dari transaksi sederhana yang biasa kamu catat.</span></div>
              </div>
              <div class="btn-cta">KUNJUNGI NORDENFINANCE.SITE &rarr;</div>
              <div style="font-size: 14px; font-weight: 700; text-align: center; color: #555;">Tautan pendaftaran tersedia di bio profil @norden.finance</div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance • nordenfinance.site</div>
            <div class="page-tag">SELESAI &bull; [ 05 / 05 ]</div>
          </div>
        </div></body></html>""")
    ]

    for name, folder, fname, dims, html in cs_slides:
        hpath = os.path.join(html_dir, f"{name}.html")
        with open(hpath, 'w', encoding='utf-8') as f:
            f.write(html)
        tasks.append((name, hpath, os.path.join(base_dir, folder, fname), dims))

    # =========================================================================
    # PART 2: 6 HIGHLIGHT COVERS (CIRCLE-SAFE 600x600 px • 1080x1920)
    # =========================================================================
    fitur_icon_html = f'''<div class="hl-icon-badge"><img src="{icon_b64}" alt="Norden Icon" style="width: 86px; height: 86px; object-fit: contain; display: block;" /></div>'''
    pintasan_icon_html = '''<div class="hl-icon-badge"><svg viewBox="0 0 170 170" width="76" height="76" fill="#000000" style="display: block;"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.59-7.71-11.66-14-5.34-8.25-9.68-17.76-13.02-28.53-3.34-10.77-5.01-21.36-5.01-31.78 0-12.18 3.05-22.68 9.15-31.49 6.1-8.82 13.99-13.35 23.68-13.6 4.9 0 10.4 1.34 16.5 4.02 6.1 2.68 10.15 4.07 12.15 4.18 1.54 0 5.68-1.47 12.42-4.41 6.74-2.94 12.39-4.25 16.95-3.92 12.43.98 22.46 5.56 30.1 13.73-10.79 6.54-16.08 15.68-15.86 27.42.22 9.15 3.65 16.89 10.29 23.23 6.64 6.34 14.65 10.02 24.03 11.03-2.18 6.76-4.94 13.54-8.28 20.34zm-30.84-118.82c0 6.75-2.52 13.19-7.56 19.32-6.19 7.42-13.7 11.75-22.53 13-1.09-1.32-1.74-3.1-1.96-5.34-.43-4.47.67-9.35 3.3-14.64 2.62-5.3 6.42-9.68 11.39-13.14 4.97-3.46 9.87-5.37 14.7-5.74.88 2.18 1.33 4.35 1.36 6.5z"/></svg></div>'''
    faq_icon_html = '''<div class="hl-icon-badge"><div style="font-size: 88px; font-weight: 900; line-height: 1; color: #000000; font-family: Outfit, -apple-system, sans-serif;">?</div></div>'''
    privasi_icon_html = '''<div class="hl-icon-badge"><svg viewBox="0 0 24 24" width="76" height="76" fill="none" stroke="#000000" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><rect x="3" y="11" width="18" height="11" rx="2.5" ry="2.5" fill="#FFE066" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /><circle cx="12" cy="16" r="1.5" fill="#000000" /><path d="M12 17.5v2" stroke-width="2" /></svg></div>'''
    trial_icon_html = '''<div class="hl-icon-badge"><svg viewBox="0 0 24 24" width="82" height="82" fill="#FFE066" stroke="#000000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg></div>'''
    templates_icon_html = '''<div class="hl-icon-badge"><svg viewBox="0 0 24 24" width="76" height="76" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M21 14a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#FFE066" /><circle cx="9" cy="9.5" r="1.3" fill="#000000" /><circle cx="13" cy="9.5" r="1.3" fill="#000000" /><circle cx="17" cy="9.5" r="1.3" fill="#000000" /></svg></div>'''

    hl_covers = [
        ("hl-cover-fitur", "cover-fitur.png", "#FFE066", "FITUR UTAMA<br>NORDEN FINANCE", fitur_icon_html, "MODUL APLIKASI"),
        ("hl-cover-pintasan", "cover-pintasan.png", "#FFE066", "PINTASAN CEPAT<br>APPLE SHORTCUTS", pintasan_icon_html, "ACTION BUTTON &amp; SIRI"),
        ("hl-cover-faq", "cover-faq.png", "#bbf7d0", "PERTANYAAN UMUM<br>NORDEN FINANCE", faq_icon_html, "TANYA JAWAB"),
        ("hl-cover-privasi", "cover-privasi.png", "#bfdbfe", "PRIVASI DATA<br>KEUANGANMU", privasi_icon_html, "ZERO BANK LINKING"),
        ("hl-cover-trial", "cover-trial.png", "#FFE066", "TRIAL PRO<br>14 HARI", trial_icon_html, "TANPA KARTU KREDIT"),
        ("hl-cover-templates", "cover-templates.png", "#FFE066", "TEMPLATE STORY<br>INTERAKTIF", templates_icon_html, "POLLING &amp; TIPS"),
    ]

    for cname, cfname, bg_color, title, icon_elem, sub in hl_covers:
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}
        .hl-center {{
          margin: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 600px;
          height: 600px;
          background: {bg_color};
          border: 12px solid #000000;
          border-radius: 50%;
          box-shadow: 16px 16px 0px 0px #000000;
          text-align: center;
          padding: 36px 40px;
        }}
        .hl-icon-badge {{
          width: 140px;
          height: 140px;
          background: #FFFFFF;
          border: 5px solid #000000;
          border-radius: 28px;
          box-shadow: 7px 7px 0px 0px #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }}
        .hl-title {{
          font-size: 34px;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 1.12;
          letter-spacing: 0.03em;
          color: #000000;
        }}
        .hl-sub {{
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #000000;
          margin-top: 10px;
          opacity: 0.9;
        }}
        </style></head><body>
        <div class="story-canvas" style="align-items: center; justify-content: center;">
          <div class="hl-center">
            {icon_elem}
            <div class="hl-title">{title}</div>
            <div class="hl-sub">{sub}</div>
          </div>
        </div></body></html>"""
        hpath = os.path.join(html_dir, f"{cname}.html")
        with open(hpath, 'w', encoding='utf-8') as f:
            f.write(html)
        tasks.append((cname, hpath, os.path.join(highlights_dir, cfname), (1080, 1920)))

    # =========================================================================
    # PART 3: 15 HIGHLIGHT STORY SLIDES (HIGHLIGHTS 1 - 5)
    # =========================================================================
    hl_stories_data = [
        # FITUR (1, 2, 3)
        ("hl-fitur-1", "story-fitur-1.png", "FITUR 01 / MULTI-DOMPET", "SEMUA DOMPET<br>SATU TEMPAT",
         "Pisahkan rekening bank, e-wallet, dan uang tunai sebagai dompet yang berbeda. Kamu bisa melihat catatan saldonya dari satu tempat.",
         """<div class="card-neo">
           <div class="demo-box" style="background: #FFFFFF;">
             <div class="demo-label">DOMPET AKTIF</div>
             <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 22px; padding: 8px 0; border-bottom: 2px solid #eee;"><span>BCA Utama</span><span>Rp12.450.000</span></div>
             <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 22px; padding: 8px 0; border-bottom: 2px solid #eee;"><span>Mandiri Payroll</span><span>Rp8.200.000</span></div>
             <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 22px; padding: 8px 0; border-bottom: 2px solid #eee;"><span>GoPay / OVO</span><span>Rp350.000</span></div>
             <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 22px; padding: 8px 0;"><span>Dompet Tunai</span><span>Rp280.000</span></div>
           </div>
           <div style="font-weight: 800; font-size: 18px; color: #333;">Total saldo terhitung otomatis dan rapi secara realtime.</div>
         </div>"""),

        ("hl-fitur-2", "story-fitur-2.png", "FITUR 02 / SMART INPUT", "TULIS TRANSAKSI<br>SEPERTI BIASA",
         "Coba tulis \"kopi susu 22k gopay\". Norden membantu membaca nominal, kategori, dan dompet dari kalimat tersebut. Periksa hasilnya sebelum disimpan.",
         """<div class="card-neo" style="background: #FFE066;">
           <div class="demo-box" style="background: #000; color: #FFF;">
             <div class="demo-label" style="color: #FFE066;">CONTOH INPUT</div>
             <div class="demo-code" style="font-size: 26px;">"kopi susu 22k gopay"</div>
           </div>
           <div class="demo-box" style="background: #FFFFFF;">
             <div class="demo-label">HASIL PEMBACAAN NORDEN</div>
             <div style="font-size: 20px; font-weight: 900;">-Rp22.000 &bull; Kategori: Makanan &bull; Dompet: GoPay</div>
           </div>
           <div style="font-size: 17px; font-weight: 800;">Tulis santai, periksa hasil, simpan catatan.</div>
         </div>"""),

        ("hl-fitur-3", "story-fitur-3.png", "FITUR 03 / LAPORAN", "LAPORAN KEUANGAN<br>SIAP DISIMPAN",
         "Simpan ringkasan keuangan untuk dilihat kembali. Tersedia pilihan ekspor PDF, CSV, dan JSON.",
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Ringkasan pemasukan &amp; pengeluaran bersih</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Grafik alokasi kategori pengeluaran dominan</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Daftar mutasi transaksi lengkap satu bulan penuh</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Pilihan ekspor: Dokumen PDF resmi, CSV, dan JSON</span></div>
           </div>
           <div class="btn-cta" style="font-size: 18px; padding: 16px;">KUNJUNGI NORDENFINANCE.SITE</div>
         </div>"""),

        # PINTASAN (1, 2, 3)
        ("hl-pintasan-1", "story-pintasan-1.png", "PINTASAN 01 / ACTION BUTTON", "TEKAN TOMBOL<br>MULAI MENCATAT",
         "Setelah shortcut Norden diatur, kamu bisa menghubungkannya ke Action Button atau Back Tap di iPhone. Input transaksi bisa dibuka tanpa harus mencari website lebih dulu.",
         """<div class="card-neo">
           <div class="demo-box" style="background: #FAF9F5;">
             <div class="demo-label">ALUR PENGGUNAAN</div>
             <div class="demo-code" style="font-size: 20px; line-height: 1.6;">
               1. Tekan tombol Action Button<br>
               2. Tulis "bensin 50k bca"<br>
               3. Tekan Selesai &check;
             </div>
           </div>
           <div style="font-size: 18px; font-weight: 800; color: #222;">
             Transaksi langsung masuk ke akunmu tanpa perlu membuka browser.
           </div>
         </div>"""),

        ("hl-pintasan-2", "story-pintasan-2.png", "PINTASAN 02 / SUARA SIRI", "CATAT LEWAT<br>SUARA SIRI",
         "Jalankan shortcut dengan perintah Siri yang sudah kamu atur, misalnya, “Hey Siri, Catat Norden”. Masukkan detail transaksi, lalu periksa hasilnya.",
         """<div class="card-neo" style="background: #FFE066;">
           <div class="demo-box" style="background: #FFFFFF;">
             <div class="demo-label">PERINTAH SUARA SIRI</div>
             <div class="demo-code" style="font-size: 24px; color: #000;">
               "Hey Siri, Catat Norden: Parkir 10 ribu tunai"
             </div>
           </div>
           <div style="font-size: 18px; font-weight: 800; color: #000;">
             Siri mengeksekusi catatan transaksi saat kamu sedang berkendara atau sibuk.
           </div>
         </div>"""),

        ("hl-pintasan-3", "story-pintasan-3.png", "PINTASAN 03 / KUNCI WEBHOOK", "AKSES PINTASAN<br>PUNYA KUNCI SENDIRI",
         "Setiap akun menggunakan token akses sendiri untuk menghubungkan shortcut dengan Norden. Kamu bisa membuat ulang token melalui Pengaturan jika diperlukan.",
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Otentikasi aman Bearer Token per pengguna</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tolak parameter URL agar tidak tersimpan di browser</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Buat ulang token mandiri di menu Pengaturan Akun</span></div>
           </div>
           <div class="btn-cta" style="font-size: 18px; padding: 16px;">PANDUAN SETUP ADA DI DASHBOARD</div>
         </div>"""),

        # FAQ (1, 2, 3)
        ("hl-faq-1", "story-faq-1.png", "FAQ 01 / APLIKASI WEB", "PERLU DOWNLOAD<br>DARI STORE?",
         "Tidak perlu. Norden bisa dibuka langsung melalui browser di ponsel atau laptop. Kamu juga bisa menambahkannya ke layar utama jika perangkat dan browser mendukungnya.",
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span><strong>Hemat Memori:</strong> Tidak memakan ruang penyimpanan ponsel.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>PWA Ready:</strong> Pasang ke Home Screen seperti aplikasi biasa.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span><strong>Lintas Perangkat:</strong> Buka di iPhone, Android, MacBook, atau PC.</span></div>
           </div>
         </div>"""),

        ("hl-faq-2", "story-faq-2.png", "FAQ 02 / SETELAH TRIAL", "SETELAH TRIAL<br>APA YANG TERJADI?",
         "Setelah trial 14 hari selesai, akun akan menggunakan akses Free Basic. Tidak ada tagihan otomatis dan tidak ada pemotongan saldo.",
         """<div class="card-neo" style="background: #bbf7d0;">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Tidak perlu kartu kredit saat memulai trial.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Tidak ada auto-debet atau tagihan tersembunyi.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Data transaksi yang sudah dicatat tetap aman dan bisa diakses.</span></div>
           </div>
           <div style="font-weight: 800; font-size: 18px;">Transparan dan bebas risiko.</div>
         </div>"""),

        ("hl-faq-3", "story-faq-3.png", "FAQ 03 / MULAI PAKAI", "BAGAIMANA CARA<br>MEMBUAT AKUN?",
         "Buka nordenfinance.site, daftar menggunakan email, lalu ikuti langkah setup awal. Setelah selesai, kamu bisa mulai mencatat transaksi.",
         """<div class="card-neo">
           <div class="demo-box">
             <div class="demo-code" style="font-size: 20px; line-height: 1.6;">
               1. Buka <strong>nordenfinance.site</strong><br>
               2. Daftar menggunakan email aktif<br>
               3. Masukkan saldo awal dompet utamamu<br>
               4. Mulai catat transaksi pertamamu!
             </div>
           </div>
           <div class="btn-cta" style="font-size: 18px; padding: 16px;">DAFTAR SEKARANG &rarr; LINK DI BIO</div>
         </div>"""),

        # PRIVASI (1, 2, 3)
        ("hl-privasi-1", "story-privasi-1.png", "PRIVASI 01 / ZERO BANK LINKING", "DATA KEUANGAN<br>TETAP KAMU ATUR",
         "Norden tidak meminta username, password mobile banking, PIN, atau OTP rekening bank. Saldo dan transaksi kamu masukkan sendiri ke dalam aplikasi.",
         """<div class="card-neo" style="background: #bfdbfe;">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Zero Bank Linking: Tidak pernah minta PIN/OTP bank.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Pencatatan berbasis input mandiri pengguna.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Informasi keuangan tetap berada di bawah kendalimu.</span></div>
           </div>
         </div>"""),

        ("hl-privasi-2", "story-privasi-2.png", "PRIVASI 02 / KENDALI DATA", "DATA MILIKMU<br>BISA KAMU KELOLA",
         "Kamu bisa mengekspor data keuangan dalam format yang tersedia. Norden juga menyediakan fitur Reset Finansial untuk menghapus catatan keuangan tanpa menghapus identitas akun.",
         """<div class="card-neo">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Ekspor riwayat lengkap kapan saja (CSV, JSON, PDF).</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Reset Finansial untuk menghapus transaksi sekaligus.</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Hapus akun permanen secara mandiri tanpa birokrasi.</span></div>
           </div>
         </div>"""),

        ("hl-privasi-3", "story-privasi-3.png", "PRIVASI 03 / PROSES AI", "BAGAIMANA STRUK<br>DIPROSES?",
         "Fitur scan struk menggunakan layanan AI Google Gemini untuk membantu membaca informasi pada foto. Periksa kembali hasil pembacaannya sebelum menyimpan transaksi.",
         """<div class="card-neo">
           <div class="demo-box" style="background: #FAF9F5;">
             <div class="demo-label">ALUR SCAN STRUK</div>
             <div style="font-size: 19px; font-weight: 800; line-height: 1.4;">
               Foto Struk &rarr; Ekstraksi Teks Google Gemini AI &rarr; Konfirmasi di Layar &rarr; Simpan Catatan
             </div>
           </div>
           <div style="font-weight: 800; font-size: 17px; color: #333;">
             Kamu selalu memverifikasi nominal dan detail sebelum data disimpan.
           </div>
         </div>"""),

        # TRIAL PRO (1, 2, 3)
        ("hl-trial-1", "story-trial-1.png", "TRIAL 01 / FITUR PRO", "KENALI FITUR<br>PAKET PRO",
         "Selama trial, kamu bisa mencoba fitur Pro yang tersedia, termasuk Smart Input, scan struk, dan pengelolaan beberapa dompet. Lihat sendiri fitur mana yang paling membantu keseharianmu.",
         """<div class="card-neo" style="background: #FFE066;">
           <div class="list-items">
             <div class="list-row"><div class="bullet-sq"></div><span>Smart Input tanpa batasan harian</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Scan struk belanja dengan bantuan AI</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Kelola banyak rekening &amp; dompet</span></div>
             <div class="list-row"><div class="bullet-sq"></div><span>Ekspor laporan keuangan lengkap</span></div>
           </div>
         </div>"""),

        ("hl-trial-2", "story-trial-2.png", "TRIAL 02 / TANPA KREDIT", "TANPA PERLU<br>KARTU KREDIT",
         "Kamu tidak perlu memasukkan nomor kartu kredit untuk memulai trial. Trial 14 hari dimulai setelah setup awal akun selesai.",
         """<div class="card-neo">
           <div class="demo-box" style="background: #FAF9F5;">
             <div style="font-size: 26px; font-weight: 900; line-height: 1.35;">
               &check; Tanpa nomor kartu kredit<br>
               &check; Tanpa komitmen pembayaran<br>
               &check; Tanpa tagihan otomatis
             </div>
           </div>
           <div style="font-size: 18px; font-weight: 800;">Fokus kenali alur keuanganmu dengan tenang.</div>
         </div>"""),

        ("hl-trial-3", "story-trial-3.png", "TRIAL 03 / MULAI HARI INI", "MULAI CATAT<br>HARI INI",
         "Kunjungi nordenfinance.site atau buka tautan di bio @norden.finance untuk membuat akun.",
         """<div class="card-neo" style="background: #FFE066;">
           <div style="font-size: 32px; font-weight: 900; line-height: 1.1; text-transform: uppercase;">
             KENALI UANGMU.<br>CATAT LEBIH TENANG.
           </div>
           <div class="btn-cta" style="background: #FFFFFF;">KUNJUNGI NORDENFINANCE.SITE &rarr;</div>
           <div style="font-size: 16px; font-weight: 900; text-align: center;">Tautan pendaftaran tersedia di bio profil @norden.finance</div>
         </div>""")
    ]

    for sname, sfname, badge, title, lead, body in hl_stories_data:
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="story-canvas">
          <div class="top-header">
            <div class="badge">{badge}</div>
            <div class="meta-tag">HIGHLIGHT ARCHIVE</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 28px; margin: auto 0;">
            <div>
              <div class="h-story">{title}</div>
              <p class="lead-text">{lead}</p>
            </div>
            {body}
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
            <div class="page-tag">HIGHLIGHT STORY</div>
          </div>
        </div></body></html>"""
        hpath = os.path.join(html_dir, f"{sname}.html")
        with open(hpath, 'w', encoding='utf-8') as f:
            f.write(html)
        tasks.append((sname, hpath, os.path.join(highlights_dir, sfname), (1080, 1920)))

    # =========================================================================
    # PART 4: 3 TEMPLATE STORY INTERAKTIF (6 SLIDES: COVER PENGANTAR + INTERAKTIF)
    # JUGAL MASUK KE HIGHLIGHT 6 (TEMPLATES)
    # =========================================================================
    interactive_stories = [
        # TEMA 1 - SLIDE 1 (Cover Pengantar)
        ("st-poll-1", "story-poll-cover.png", (1080, 1920), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="story-canvas">
          <div class="top-header">
            <div class="badge">FINANCIAL CHECK</div>
            <div class="meta-tag">POLLING HARIAN</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 32px; margin: auto 0;">
            <div>
              <div class="h-story">BERAPA BUDGET<br>KOPI BULANANMU?</div>
              <p class="lead-text">Kopi Rp20 ribu sehari mungkin terasa biasa. Tapi kalau dikumpulkan selama sebulan, jumlahnya bisa lumayan juga. Yuk, lihat kebiasaan jajan kita lewat polling berikutnya.</p>
            </div>
            <div class="card-neo-yellow" style="padding: 36px;">
              <div style="font-size: 24px; font-weight: 900; line-height: 1.3;">
                GESER KE STORY BERIKUTNYA<br>UNTUK IKUT VOTING &rarr;
              </div>
              <div style="font-size: 18px; font-weight: 700; color: #222; margin-top: 8px;">
                Cek apakah pengeluaran kopimu masih wajar atau sudah mulai boncos.
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
            <div class="page-tag">STORY COVER</div>
          </div>
        </div></body></html>"""),

        # TEMA 1 - SLIDE 2 (Slide Interaktif Stiker Polling)
        ("st-poll-2", "story-poll-interactive.png", (1080, 1920), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}
        .poll-slot {{
          background: #FFE066;
          border: 4px dashed #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          padding: 36px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          justify-content: center;
        }}
        .poll-sticker-box {{
          background: #FFFFFF;
          border: 3.5px solid #000;
          padding: 12px 24px;
          font-weight: 900;
          font-size: 20px;
          text-transform: uppercase;
        }}
        </style></head><body>
        <div class="story-canvas">
          <div class="top-header">
            <div class="badge">PILIH JAWABANMU</div>
            <div class="meta-tag">STIKER POLLING</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 32px; margin: auto 0;">
            <div>
              <div class="h-story">BERAPA BANYAK<br>KAMU HABISKAN?</div>
              <p class="lead-text">Pilih rentang pengeluaran kopi &amp; jajanmu dalam sebulan:</p>
            </div>
            
            <div class="poll-slot">
              <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">TEMPEL STIKER POLLING INSTAGRAM DI SINI:</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; width: 100%;">
                <div class="poll-sticker-box">&lt; Rp200 Ribu</div>
                <div class="poll-sticker-box">Rp200 Ribu&ndash;500 Ribu</div>
                <div class="poll-sticker-box">Rp500 Ribu&ndash;1 Juta</div>
                <div class="poll-sticker-box">&gt; Rp1 Juta ☕</div>
              </div>
            </div>

            <div class="card-neo">
              <div class="demo-box" style="background: #FAF9F5;">
                <div class="demo-label">CONTOH CATAT DI NORDEN</div>
                <div class="demo-code" style="font-size: 22px;">&gt; kopi 22k bca</div>
              </div>
              <div style="font-size: 18px; font-weight: 700; color: #333;">
                Ketik tiap beli kopi. Di akhir bulan, buka grafik kategori untuk melihat akumulasi pengeluaran ngopimu.
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
            <div class="page-tag">STIKER INTERAKTIF</div>
          </div>
        </div></body></html>"""),

        # TEMA 2 - SLIDE 1 (Cover Pengantar)
        ("st-tips-1", "story-tips-cover.png", (1080, 1920), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="story-canvas">
          <div class="top-header">
            <div class="badge-green">TIPS KEUANGAN</div>
            <div class="meta-tag">PENGELOLAAN ARUS KAS</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 32px; margin: auto 0;">
            <div>
              <div class="h-story">PENGELUARAN KECIL<br>YANG SERING LOLOS</div>
              <p class="lead-text">Kadang bukan belanja besar yang bikin uang cepat habis. Justru ada biaya kecil yang muncul berulang kali dan sering luput dari perhatian. Coba cek tiga contohnya di story berikutnya.</p>
            </div>
            
            <div class="card-neo-yellow" style="padding: 36px;">
              <div style="font-size: 24px; font-weight: 900; line-height: 1.3;">
                3 KEBIASAAN KECIL<br>YANG BIKIN BONCOS &rarr;
              </div>
              <div style="font-size: 18px; font-weight: 700; color: #222; margin-top: 8px;">
                Geser untuk evaluasi pengeluaran harianmu bersama Norden Finance.
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
            <div class="page-tag">STORY COVER</div>
          </div>
        </div></body></html>"""),

        # TEMA 2 - SLIDE 2 (Slide Interaktif Tips & Reaksi)
        ("st-tips-2", "story-tips-interactive.png", (1080, 1920), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="story-canvas">
          <div class="top-header">
            <div class="badge-green">CEK PENGELUARANMU</div>
            <div class="meta-tag">EVALUASI PENGELUARAN</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 28px; margin: auto 0;">
            <div>
              <div class="h-story">TIGA HAL KECIL<br>SERING TERLEWAT</div>
              <p class="lead-text">Bukan pengeluaran besar, melainkan biaya yang terakumulasi setiap hari:</p>
            </div>
            
            <div class="card-neo" style="gap: 18px; padding: 36px;">
              <div style="display: flex; gap: 18px; align-items: flex-start;">
                <div style="background: #FFE066; border: 3px solid #000; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; flex-shrink: 0;">1</div>
                <div>
                  <div style="font-size: 20px; font-weight: 900;">Langganan Aplikasi Lupa Dimatikan</div>
                  <div style="font-size: 17px; font-weight: 600; color: #444; margin-top: 3px;">Langganan yang sudah jarang dipakai, tapi masih terbayar tiap bulan.</div>
                </div>
              </div>
              <div style="display: flex; gap: 18px; align-items: flex-start; border-top: 2px solid #eee; padding-top: 14px;">
                <div style="background: #bbf7d0; border: 3px solid #000; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; flex-shrink: 0;">2</div>
                <div>
                  <div style="font-size: 20px; font-weight: 900;">Biaya Admin &amp; Ongkir Tambahan</div>
                  <div style="font-size: 17px; font-weight: 600; color: #444; margin-top: 3px;">Biaya admin, ongkir, dan biaya tambahan saat transaksi kecil berulang.</div>
                </div>
              </div>
              <div style="display: flex; gap: 18px; align-items: flex-start; border-top: 2px solid #eee; padding-top: 14px;">
                <div style="background: #bfdbfe; border: 3px solid #000; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; flex-shrink: 0;">3</div>
                <div>
                  <div style="font-size: 20px; font-weight: 900;">Uang Tabungan Tercampur Belanja</div>
                  <div style="font-size: 17px; font-weight: 600; color: #444; margin-top: 3px;">Uang tabungan yang tercampur dengan uang belanja sehari-hari.</div>
                </div>
              </div>
            </div>

            <div class="demo-box" style="background: #FFE066; text-align: center; padding: 24px;">
              <div class="demo-label" style="color: #000;">TEMPEL STIKER PERTANYAAN / EMOJI SLIDER:</div>
              <div style="font-size: 22px; font-weight: 900; color: #000; margin-top: 4px;">
                "Mana yang paling sering kamu alami?"
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
            <div class="page-tag">STIKER INTERAKTIF</div>
          </div>
        </div></body></html>"""),

        # TEMA 3 - SLIDE 1 (Cover Pengantar)
        ("st-action-1", "story-action-cover.png", (1080, 1920), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="story-canvas">
          <div class="top-header">
            <div class="badge">PINTASAN CEPAT</div>
            <div class="meta-tag">FITUR UNGGULAN</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 32px; margin: auto 0;">
            <div>
              <div class="h-story">CATAT TRANSAKSI<br>TANPA BUKA BROWSER</div>
              <p class="lead-text">Kalau shortcut Norden sudah kamu atur ke Action Button, mencatat transaksi bisa dimulai dari tombol di sisi iPhone. Lihat cara menggunakannya di story berikutnya.</p>
            </div>
            
            <div class="card-neo-yellow" style="padding: 36px;">
              <div style="font-size: 24px; font-weight: 900; line-height: 1.3;">
                CATAT CEPAT 3 DETIK<br>LEWAT ACTION BUTTON &rarr;
              </div>
              <div style="font-size: 18px; font-weight: 700; color: #222; margin-top: 8px;">
                Geser untuk melihat demonstrasi dan tautan shortcut Norden.
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
            <div class="page-tag">STORY COVER</div>
          </div>
        </div></body></html>"""),

        # TEMA 3 - SLIDE 2 (Slide Interaktif & Link Sticker)
        ("st-action-2", "story-action-interactive.png", (1080, 1920), f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{common_css}</style></head><body>
        <div class="story-canvas">
          <div class="top-header">
            <div class="badge">CARA PAKAI</div>
            <div class="meta-tag">APPLE SHORTCUTS</div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 28px; margin: auto 0;">
            <div>
              <div class="h-story">TEKAN TOMBOL<br>MULAI MENCATAT</div>
              <p class="lead-text">Tiga langkah praktis tanpa perlu membuka safari atau browser:</p>
            </div>
            
            <div class="card-neo-yellow" style="padding: 34px;">
              <div style="font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;">LANGKAH PENGGUNAAN:</div>
              <div class="list-items" style="gap: 14px; margin-top: 8px;">
                <div class="list-row"><div class="bullet-sq"></div><span><strong>1. Atur shortcut Norden</strong> dan hubungkan ke Action Button atau Back Tap.</span></div>
                <div class="list-row"><div class="bullet-sq"></div><span><strong>2. Tekan tombol,</strong> lalu tulis kalimat: <em>"bensin 50k bca"</em>.</span></div>
                <div class="list-row"><div class="bullet-sq"></div><span><strong>3. Periksa input</strong> dan kirim catatan ke akun Norden.</span></div>
              </div>
            </div>

            <div class="card-neo" style="padding: 32px; text-align: center; border: 4px dashed #000;">
              <div style="font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #666;">
                TEMPEL STIKER TAUTAN (LINK STICKER) DI SINI:
              </div>
              <div class="btn-cta" style="font-size: 20px; padding: 18px; margin-top: 10px;">
                COBA NORDEN &bull; NORDENFINANCE.SITE &rarr;
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #444; margin-top: 8px;">
                Trial Pro 14 hari tanpa kartu kredit
              </div>
            </div>
          </div>
          <div class="bottom-bar">
            <div class="handle-tag">@norden.finance &bull; nordenfinance.site</div>
            <div class="page-tag">STIKER INTERAKTIF</div>
          </div>
        </div></body></html>""")
    ]

    for sname, sfname, dims, html in interactive_stories:
        hpath = os.path.join(html_dir, f"{sname}.html")
        with open(hpath, 'w', encoding='utf-8') as f:
            f.write(html)
        # simpan di folder stories/
        tasks.append((sname, hpath, os.path.join(stories_dir, sfname), dims))
        # juga simpan di folder highlights/ untuk Highlight 6 (TEMPLATES)
        tasks.append((f"{sname}-hl", hpath, os.path.join(highlights_dir, sfname), dims))

    print(f"Generated {len(tasks)} HTML files.")

    # Start HTTP server
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=html_dir, **kwargs)
        def log_message(self, format, *args):
            pass

    port = 8996
    httpd = HTTPServer(('127.0.0.1', port), Handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()

    browser_candidates = [
        r'C:\Program Files (x86)\Microsoft\EdgeCore\157.0.4341.46\msedge.exe',
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Google\Chrome\Application\chrome.exe',
        r'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    ]
    edge_path = next((p for p in browser_candidates if os.path.exists(p)), 'msedge')

    print("Rendering PNGs with headless Edge...")
    for sname, hpath, out_png, (w, h) in tasks:
        url = f"http://127.0.0.1:{port}/{sname.replace('-hl', '')}.html"
        cmd = [
            edge_path,
            '--headless',
            '--disable-gpu',
            f'--window-size={w},{h}',
            '--hide-scrollbars',
            '--force-device-scale-factor=1',
            f'--screenshot={out_png}',
            url
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(out_png) and os.path.getsize(out_png) > 1000:
            print(f"  [OK] Rendered {os.path.basename(out_png)} ({os.path.getsize(out_png)} bytes)")
        else:
            print(f"  [FAIL] Failed {os.path.basename(out_png)}")

    httpd.shutdown()

    # =========================================================================
    # PART 5: CREATE ZIP BUNDLES FOR INSTANT "DOWNLOAD ALL"
    # =========================================================================
    print("Building ZIP bundles...")

    # 1. Cheatsheet bundle
    with zipfile.ZipFile(os.path.join(zips_dir, 'norden-cheatsheet-feed.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(cheatsheet_dir)):
            if f.endswith('.png'):
                z.write(os.path.join(cheatsheet_dir, f), arcname=f"cheatsheet/{f}")

    # 2. Highlights bundle (6 covers + 21 stories)
    with zipfile.ZipFile(os.path.join(zips_dir, 'norden-highlights-bundle.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(highlights_dir)):
            if f.endswith('.png'):
                z.write(os.path.join(highlights_dir, f), arcname=f"highlights/{f}")

    # 3. Interactive Stories bundle (6 slides)
    with zipfile.ZipFile(os.path.join(zips_dir, 'norden-interactive-stories.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(stories_dir)):
            if f.endswith('.png'):
                z.write(os.path.join(stories_dir, f), arcname=f"stories/{f}")

    # 4. Master All-Assets bundle (All PNGs in instagram folder + markdown guides)
    with zipfile.ZipFile(os.path.join(zips_dir, 'norden-instagram-master-bundle.zip'), 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(base_dir):
            if 'zips' in root or 'extra_html' in root:
                continue
            for file in files:
                if file.endswith(('.png', '.md')):
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, base_dir)
                    z.write(full_p, arcname=rel_p)

    print("All extra marketing assets and ZIP bundles generated successfully!")

if __name__ == '__main__':
    generate_all()
