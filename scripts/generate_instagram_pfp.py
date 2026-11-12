import os
import base64
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from PIL import Image, ImageDraw

def get_base64_image(rel_path):
    if os.path.exists(rel_path):
        with open(rel_path, 'rb') as f:
            ext = os.path.splitext(rel_path)[1].lower()
            mime = 'image/png' if ext == '.png' else 'image/svg+xml' if ext == '.svg' else 'image/jpeg'
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

def generate_pfp_assets():
    icon_b64 = get_base64_image('public/brand/norden-icon.png')
    
    out_dir = r'D:\norden-finance\public\instagram\pfp'
    os.makedirs(out_dir, exist_ok=True)
    html_dir = os.path.join(out_dir, 'html')
    os.makedirs(html_dir, exist_ok=True)
    temp_dir = r'C:\Users\blur\AppData\Local\Temp\antigravity'
    os.makedirs(temp_dir, exist_ok=True)

    # 1. PFP 1: Signature Yellow (Hero) - White brutalist card with master logo on yellow canvas
    v1_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background-color: #FFE066;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .badge-card {{
    width: 580px;
    height: 580px;
    background: #FFFFFF;
    border: 6px solid #000000;
    box-shadow: 18px 18px 0px 0px #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }}
  .badge-card img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}
</style>
</head>
<body>
  <div class="badge-card">
    <img src="{icon_b64}" alt="Norden Icon" />
  </div>
</body>
</html>"""

    # 2. PFP 2: Pure White - Master logo floating with solid black shadow on white canvas
    v2_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background-color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .icon-wrapper {{
    width: 640px;
    height: 640px;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .icon-wrapper img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}
</style>
</head>
<body>
  <div class="icon-wrapper">
    <img src="{icon_b64}" alt="Norden Icon" />
  </div>
</body>
</html>"""

    # 3. PFP 3: Obsidian Dark - High-contrast dark card with yellow border & yellow brutalist shadow
    v3_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background-color: #0D0E11;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .dark-card {{
    width: 580px;
    height: 580px;
    background: #18181B;
    border: 6px solid #FFE066;
    box-shadow: 18px 18px 0px 0px #FFE066;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }}
  .dark-card img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}
</style>
</head>
<body>
  <div class="dark-card">
    <img src="{icon_b64}" alt="Norden Icon" />
  </div>
</body>
</html>"""

    # 4. PFP 4: Brand Cream - Exact #FAF9F5 canvas matching app layout
    v4_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background-color: #FAF9F5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .icon-wrapper {{
    width: 640px;
    height: 640px;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .icon-wrapper img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
  }}
</style>
</head>
<body>
  <div class="icon-wrapper">
    <img src="{icon_b64}" alt="Norden Icon" />
  </div>
</body>
</html>"""

    variants = [
        ("pfp-signature-yellow", v1_html),
        ("pfp-pure-white", v2_html),
        ("pfp-obsidian-dark", v3_html),
        ("pfp-brand-cream", v4_html),
    ]

    for name, html in variants:
        with open(os.path.join(html_dir, f"{name}.html"), 'w', encoding='utf-8') as f:
            f.write(html)

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

    for name, html in variants:
        temp_png = os.path.join(temp_dir, f"{name}_temp.png")
        final_png = os.path.join(out_dir, f"{name}.png")
        circle_preview_png = os.path.join(out_dir, f"{name}-circle-preview.png")

        cmd = [
            edge_path,
            '--headless',
            '--disable-gpu',
            '--window-size=1080,1080',
            '--hide-scrollbars',
            '--force-device-scale-factor=1',
            f'--screenshot={temp_png}',
            f'http://127.0.0.1:{port}/{name}.html'
        ]
        subprocess.run(cmd, capture_output=True)

        if os.path.exists(temp_png):
            with Image.open(temp_png) as im:
                if im.size != (1080, 1080):
                    im = im.crop((0, 0, 1080, 1080))
                # 1. Save standard upload square file
                im.convert("RGB").save(final_png, "PNG", optimize=True)
                print(f"Created square PFP: {final_png}")

                # 2. Create circular crop preview with Instagram Story ring
                mask = Image.new('L', (1080, 1080), 0)
                draw_mask = ImageDraw.Draw(mask)
                draw_mask.ellipse((10, 10, 1070, 1070), fill=255)

                circle_im = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
                circle_im.paste(im.convert("RGBA"), (0, 0), mask=mask)

                # Add a crisp circular border
                draw_circle = ImageDraw.Draw(circle_im)
                draw_circle.ellipse((10, 10, 1070, 1070), outline=(0, 0, 0, 180), width=6)

                circle_im.save(circle_preview_png, "PNG", optimize=True)
                print(f"Created circular preview: {circle_preview_png}")
            os.remove(temp_png)

    httpd.shutdown()
    print("All PFP variants generated successfully!")

if __name__ == '__main__':
    generate_pfp_assets()
