import os
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from PIL import Image, ImageDraw

clean_d = "M 184.0 372.0 L 248.0 214.0 L 313.0 214.0 L 400.0 399.0 L 459.0 255.0 L 415.0 238.0 L 534.0 156.0 L 563.0 298.0 L 521.0 279.0 L 435.0 489.0 L 366.0 488.0 L 283.0 310.0 L 210.0 489.0 L 136.0 489.0 Z"

out_dir = r'D:\norden-finance\public\instagram\pfp'
html_dir = os.path.join(out_dir, 'html')
temp_dir = r'C:\Users\blur\AppData\Local\Temp\antigravity'
os.makedirs(html_dir, exist_ok=True)
os.makedirs(temp_dir, exist_ok=True)

# 1. Pure White Neo-Brutalist (Hero Recommendation)
# Clean white circular canvas, dual black rim rings, Signature Yellow N with heavy black stroke & hard offset shadow.
v1_white = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px; height: 1080px; background: #FFFFFF;
    display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  }}
  .rim-outer {{ position: absolute; width: 1004px; height: 1004px; border-radius: 50%; border: 16px solid #000000; }}
  .rim-inner {{ position: absolute; width: 964px; height: 964px; border-radius: 50%; border: 4px solid #000000; }}
  .emblem {{ width: 680px; }}
  .emblem svg {{ width: 100%; display: block; overflow: visible; }}
</style></head>
<body>
  <div class="rim-outer"></div>
  <div class="rim-inner"></div>
  <div class="emblem">
    <svg viewBox="120 140 460 360">
      <g transform="translate(14, 14)">
        <path fill="#000000" stroke="#000000" stroke-width="16" stroke-linejoin="round" d="{clean_d}" />
      </g>
      <path fill="#FFE066" stroke="#000000" stroke-width="18" stroke-linejoin="round" d="{clean_d}" />
    </svg>
  </div>
</body></html>"""

# 2. Signature Yellow Sticker Pop
# Signature yellow circular canvas, dual black rim rings, Pure White N with heavy black stroke & hard offset shadow.
v2_yellow_sticker = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px; height: 1080px; background: #FFE066;
    display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  }}
  .rim-outer {{ position: absolute; width: 1004px; height: 1004px; border-radius: 50%; border: 16px solid #000000; }}
  .rim-inner {{ position: absolute; width: 964px; height: 964px; border-radius: 50%; border: 4px solid #000000; }}
  .emblem {{ width: 680px; }}
  .emblem svg {{ width: 100%; display: block; overflow: visible; }}
</style></head>
<body>
  <div class="rim-outer"></div>
  <div class="rim-inner"></div>
  <div class="emblem">
    <svg viewBox="120 140 460 360">
      <g transform="translate(14, 14)">
        <path fill="#000000" stroke="#000000" stroke-width="16" stroke-linejoin="round" d="{clean_d}" />
      </g>
      <path fill="#FFFFFF" stroke="#000000" stroke-width="18" stroke-linejoin="round" d="{clean_d}" />
    </svg>
  </div>
</body></html>"""

# 3. Signature Yellow Pure Bold (Coin / Bauhaus Token)
# Signature yellow circular canvas, dual concentric black rings, solid black N emblem filling the circle.
v3_yellow_bold = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px; height: 1080px; background: #FFE066;
    display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  }}
  .rim-outer {{ position: absolute; width: 1004px; height: 1004px; border-radius: 50%; border: 16px solid #000000; }}
  .rim-inner {{ position: absolute; width: 964px; height: 964px; border-radius: 50%; border: 4px solid #000000; }}
  .emblem {{ width: 690px; }}
  .emblem svg {{ width: 100%; display: block; overflow: visible; }}
</style></head>
<body>
  <div class="rim-outer"></div>
  <div class="rim-inner"></div>
  <div class="emblem">
    <svg viewBox="120 140 460 360">
      <path fill="#000000" d="{clean_d}" />
    </svg>
  </div>
</body></html>"""

# 4. Obsidian Dark Fintech
# Dark obsidian #0D0E11 circular canvas, dual yellow rim rings, yellow inked N emblem with neon offset underlay.
v4_dark = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px; height: 1080px; background: #0D0E11;
    display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
  }}
  .rim-outer {{ position: absolute; width: 1004px; height: 1004px; border-radius: 50%; border: 16px solid #FFE066; }}
  .rim-inner {{ position: absolute; width: 964px; height: 964px; border-radius: 50%; border: 4px solid #FFE066; }}
  .emblem {{ width: 680px; }}
  .emblem svg {{ width: 100%; display: block; overflow: visible; }}
</style></head>
<body>
  <div class="rim-outer"></div>
  <div class="rim-inner"></div>
  <div class="emblem">
    <svg viewBox="120 140 460 360">
      <g transform="translate(14, 14)">
        <path fill="#FFE066" stroke="#FFE066" stroke-width="16" stroke-linejoin="round" d="{clean_d}" />
      </g>
      <path fill="#18181B" stroke="#FFE066" stroke-width="18" stroke-linejoin="round" d="{clean_d}" />
    </svg>
  </div>
</body></html>"""

variants = [
    ("pfp-pure-white", v1_white),
    ("pfp-signature-yellow", v2_yellow_sticker),
    ("pfp-signature-bold", v3_yellow_bold),
    ("pfp-obsidian-dark", v4_dark),
]

for name, html in variants:
    with open(os.path.join(html_dir, f"{name}.html"), 'w', encoding='utf-8') as f:
        f.write(html)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=html_dir, **kwargs)
    def log_message(self, format, *args):
        pass

port = 8983
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
print("All 4 production PFP variants generated successfully!")
