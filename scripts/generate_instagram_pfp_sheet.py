import os
from PIL import Image, ImageDraw, ImageFont

def create_overview_sheet():
    pfp_dir = r'D:\norden-finance\public\instagram\pfp'
    
    variants = [
        ("pfp-signature-yellow-circle-preview.png", "1. NEO-BRUTALIST YELLOW BADGE", "#FFE066", "Circle Badge: Kuning signature #FFE066 dengan hard shadow 20px hitam"),
        ("pfp-brutalist-tile-circle-preview.png", "2. NEO-BRUTALIST APP TILE", "#FFFFFF", "Icon Tile: Kotak kuning sudut lengkung 68px, border 15px & shadow 20px"),
        ("pfp-pure-white-circle-preview.png", "3. INVERTED YELLOW BADGE", "#FFE066", "High Impact: Kanvas kuning dengan badge putih kontras & shadow hitam"),
        ("pfp-obsidian-dark-circle-preview.png", "4. OBSIDIAN DARK FINTECH", "#0D0E11", "Dark Mode: Obsidian #18181B dengan border & hard shadow kuning neon"),
    ]

    # Create 2x2 grid image (2400 x 2600 px)
    canvas = Image.new('RGB', (2400, 2600), '#FAF9F5')
    draw = ImageDraw.Draw(canvas)

    # Header
    draw.rectangle([0, 0, 2400, 220], fill='#FFE066', outline='#000000', width=6)
    try:
        font_title = ImageFont.truetype('arial.ttf', 64)
        font_sub = ImageFont.truetype('arial.ttf', 32)
        font_card_title = ImageFont.truetype('arial.ttf', 44)
        font_card_desc = ImageFont.truetype('arial.ttf', 28)
    except:
        font_title = font_sub = font_card_title = font_card_desc = None

    draw.text((80, 50), "NORDEN FINANCE — NEO-BRUTALIST INSTAGRAM PFP OPTIONS", fill='#000000', font=font_title)
    draw.text((80, 135), "1080 x 1080 px Lossless PNG | 100% Circle-Safe Margin | Authentic Neo-Brutalism", fill='#222222', font=font_sub)

    positions = [
        (80, 280),
        (1240, 280),
        (80, 1420),
        (1240, 1420)
    ]

    for (filename, title, bg_color, desc), (x, y) in zip(variants, positions):
        # Card background
        draw.rectangle([x, y, x + 1080, y + 1080], fill='#FFFFFF', outline='#000000', width=6)
        # Drop shadow
        draw.rectangle([x + 10, y + 10, x + 1088, y + 1088], outline='#000000', width=6)

        # Title bar
        draw.rectangle([x, y, x + 1080, y + 120], fill=bg_color, outline='#000000', width=4)
        text_fill = '#000000' if bg_color != '#0D0E11' else '#FFFFFF'
        draw.text((x + 30, y + 25), title, fill=text_fill, font=font_card_title)
        draw.text((x + 30, y + 78), desc, fill='#555555' if bg_color != '#0D0E11' else '#AAAAAA', font=font_card_desc)

        # Paste preview image
        img_path = os.path.join(pfp_dir, filename)
        if os.path.exists(img_path):
            with Image.open(img_path) as im:
                thumb = im.resize((840, 840), Image.Resampling.LANCZOS)
                canvas.paste(thumb, (x + 120, y + 180), thumb if thumb.mode == 'RGBA' else None)

    sheet_path = os.path.join(pfp_dir, 'pfp-all-variants-sheet.png')
    canvas.save(sheet_path, "PNG", optimize=True)
    print(f"Created overview sheet: {sheet_path}")

if __name__ == '__main__':
    create_overview_sheet()
