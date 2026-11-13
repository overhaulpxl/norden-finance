import os
import subprocess
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from PIL import Image, ImageDraw
import re

def get_emblem_svg_path():
    with open('public/brand/norden-icon.svg', 'r', encoding='utf-8') as f:
        svg_content = f.read()

    path2 = re.findall(r'fill="#000000"[^>]*d="([^"]*)"', svg_content)[0]
    subpaths2 = [s.strip() for s in path2.split('Z') if s.strip()]
    # subpaths2[2] is the exact N emblem with upward arrow
    return subpaths2[2] + " Z"

def generate_pfp_assets():
    n_path = get_emblem_svg_path()
    
    out_dir = r'D:\norden-finance\public\instagram\pfp'
    os.makedirs(out_dir, exist_ok=True)
    html_dir = os.path.join(out_dir, 'html')
    os.makedirs(html_dir, exist_ok=True)
    temp_dir = r'C:\Users\blur\AppData\Local\Temp\antigravity'
    os.makedirs(temp_dir, exist_ok=True)

    def render_pfp_template(bg_color, ring_color, n_color, ring_width=14, ring_inset=44, emblem_width="640px"):
        return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 1080px;
    height: 1080px;
    background-color: {bg_color};
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }}
  /* Concentric circular ring style matching norden.grp */
  .concentric-ring {{
    position: absolute;
    width: {1080 - ring_inset * 2}px;
    height: {1080 - ring_inset * 2}px;
    border-radius: 50%;
    border: {ring_width}px solid {ring_color};
    pointer-events: none;
    box-sizing: border-box;
  }}
  .emblem-wrap {{
    width: {emblem_width};
    height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }}
  .emblem-wrap svg {{
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }}
</style>
</head>
<body>
  <div class="concentric-ring"></div>
  <div class="emblem-wrap">
    <svg viewBox="136 156 427 333" preserveAspectRatio="xMidYMid meet">
      <path fill="{n_color}" d="{n_path}" />
    </svg>
  </div>
</body>
</html>"""

    # 1. Pure White - Exact norden.grp style: Pure white canvas, concentric ring, black N arrow emblem filling circle
    v_white = render_pfp_template(
        bg_color="#FFFFFF",
        ring_color="#000000",
        n_color="#000000",
        ring_width=14,
        ring_inset=44,
        emblem_width="640px"
    )

    # 2. Signature Yellow - Bold yellow canvas, concentric ring, black N arrow emblem
    v_yellow = render_pfp_template(
        bg_color="#FFE066",
        ring_color="#000000",
        n_color="#000000",
        ring_width=14,
        ring_inset=44,
        emblem_width="640px"
    )

    # 3. Obsidian Dark - Premium fintech dark mode, yellow concentric ring, yellow N arrow emblem
    v_dark = render_pfp_template(
        bg_color="#0D0E11",
        ring_color="#FFE066",
        n_color="#FFE066",
        ring_width=14,
        ring_inset=44,
        emblem_width="640px"
    )

    # 4. Brand Cream - Warm cream canvas matching website app canvas
    v_cream = render_pfp_template(
        bg_color="#FAF9F5",
        ring_color="#000000",
        n_color="#000000",
        ring_width=14,
        ring_inset=44,
        emblem_width="640px"
    )

    variants = [
        ("pfp-pure-white", v_white),
        ("pfp-signature-yellow", v_yellow),
        ("pfp-obsidian-dark", v_dark),
        ("pfp-brand-cream", v_cream),
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
    print("All PFP variants generated successfully!")

if __name__ == '__main__':
    generate_pfp_assets()
