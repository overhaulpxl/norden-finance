import os
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from PIL import Image, ImageDraw
import re

with open('public/brand/norden-icon.svg', 'r', encoding='utf-8') as f:
    svg_content = f.read()

path2 = re.findall(r'fill="#000000"[^>]*d="([^"]*)"', svg_content)[0]
subpaths2 = [s.strip() for s in path2.split('Z') if s.strip()]
n_path = subpaths2[2] + " Z"

out_dir = r'D:\norden-finance\public\instagram\pfp'
html_dir = os.path.join(out_dir, 'html')
temp_dir = r'C:\Users\blur\AppData\Local\Temp\antigravity'
os.makedirs(html_dir, exist_ok=True)
os.makedirs(temp_dir, exist_ok=True)

# 1. Neo-Brutalist Yellow Circle Badge (Sticker Pop)
v1_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .badge-circle {{
    width: 860px;
    height: 860px;
    background: #FFE066;
    border-radius: 50%;
    border: 15px solid #000000;
    box-shadow: 20px 20px 0px 0px #000000;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .badge-circle svg {{
    width: 610px;
    height: auto;
    display: block;
  }}
</style></head>
<body>
  <div class="badge-circle">
    <svg viewBox="136 156 427 333" preserveAspectRatio="xMidYMid meet">
      <path fill="#000000" d="{n_path}" />
    </svg>
  </div>
</body></html>"""

# 2. Neo-Brutalist App Tile Badge (Iconic Yellow Box Scaled to Max Fill)
v2_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .app-tile {{
    width: 700px;
    height: 700px;
    background: #FFE066;
    border-radius: 68px;
    border: 15px solid #000000;
    box-shadow: 20px 20px 0px 0px #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }}
  .app-tile svg {{
    width: 100%;
    height: auto;
    display: block;
  }}
</style></head>
<body>
  <div class="app-tile">
    <svg viewBox="136 156 427 333" preserveAspectRatio="xMidYMid meet">
      <path fill="#000000" d="{n_path}" />
    </svg>
  </div>
</body></html>"""

# 3. Neo-Brutalist White Circle Badge on Signature Yellow
v3_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background: #FFE066;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .badge-circle {{
    width: 860px;
    height: 860px;
    background: #FFFFFF;
    border-radius: 50%;
    border: 15px solid #000000;
    box-shadow: 20px 20px 0px 0px #000000;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .badge-circle svg {{
    width: 610px;
    height: auto;
    display: block;
  }}
</style></head>
<body>
  <div class="badge-circle">
    <svg viewBox="136 156 427 333" preserveAspectRatio="xMidYMid meet">
      <path fill="#000000" d="{n_path}" />
    </svg>
  </div>
</body></html>"""

# 4. Neo-Brutalist Obsidian Dark
v4_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background: #0D0E11;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }}
  .badge-circle {{
    width: 860px;
    height: 860px;
    background: #18181B;
    border-radius: 50%;
    border: 15px solid #FFE066;
    box-shadow: 20px 20px 0px 0px #FFE066;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .badge-circle svg {{
    width: 610px;
    height: auto;
    display: block;
  }}
</style></head>
<body>
  <div class="badge-circle">
    <svg viewBox="136 156 427 333" preserveAspectRatio="xMidYMid meet">
      <path fill="#FFE066" d="{n_path}" />
    </svg>
  </div>
</body></html>"""

variants = [
    ("pfp-signature-yellow", v1_html),
    ("pfp-brutalist-tile", v2_html),
    ("pfp-pure-white", v3_html),
    ("pfp-obsidian-dark", v4_html),
]

for name, html in variants:
    with open(os.path.join(html_dir, f"{name}.html"), 'w', encoding='utf-8') as f:
        f.write(html)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=html_dir, **kwargs)
    def log_message(self, format, *args):
        pass

port = 8988
httpd = HTTPServer(('127.0.0.1', port), Handler)
t = threading.Thread(target=httpd.serve_forever, daemon=True)
t.start()

edge_path = r'C:\Program Files (x86)\Microsoft\EdgeCore\157.0.4341.46\msedge.exe'

for name, _ in variants:
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

            # 2. Create circular crop preview with Instagram Story/Profile ring
            mask = Image.new('L', (1080, 1080), 0)
            draw_mask = ImageDraw.Draw(mask)
            draw_mask.ellipse((8, 8, 1072, 1072), fill=255)

            circle_im = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
            circle_im.paste(im.convert("RGBA"), (0, 0), mask=mask)

            # Add a crisp circular boundary border
            draw_circle = ImageDraw.Draw(circle_im)
            draw_circle.ellipse((8, 8, 1072, 1072), outline=(0, 0, 0, 200), width=6)

            circle_im.save(circle_preview_png, "PNG", optimize=True)
            print(f"Created circular preview: {circle_preview_png}")
        os.remove(temp_png)

httpd.shutdown()
print("All Neo-Brutalist PFP variants generated successfully!")
