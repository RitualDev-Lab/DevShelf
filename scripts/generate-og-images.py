#!/usr/bin/env python3
"""
DevShelf Dynamic OpenGraph Social Card Generator (1200x630)
Generates high-resolution social preview cards for:
- Homepage (site/og-image.jpg & site/og/default.png)
- Sponsors Page (site/og/sponsors.png)
- Categories (site/og/{category}.png)
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(__file__).resolve().parent.parent
SITE_DIR = ROOT_DIR / "site"
OG_DIR = SITE_DIR / "og"
OG_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1200, 630

# Load Windows system fonts
FONT_DIR = Path("C:/Windows/Fonts")
font_hero = ImageFont.truetype(str(FONT_DIR / "segoeuib.ttf"), 54)
font_sub = ImageFont.truetype(str(FONT_DIR / "segoeui.ttf"), 25)
font_brand = ImageFont.truetype(str(FONT_DIR / "segoeuib.ttf"), 28)
font_pill = ImageFont.truetype(str(FONT_DIR / "segoeuib.ttf"), 18)
font_code = ImageFont.truetype(str(FONT_DIR / "consolab.ttf"), 22)
font_meta = ImageFont.truetype(str(FONT_DIR / "segoeui.ttf"), 20)

def generate_devshelf_og():
    img = Image.new("RGB", (W, H), (15, 23, 42)) # slate-900
    draw = ImageDraw.Draw(img)

    # Ambient radial gradient glows
    draw.ellipse([800, -150, 1350, 400], fill=(22, 101, 52)) # emerald-800
    draw.ellipse([850, -100, 1300, 350], fill=(16, 185, 129)) # emerald-500
    draw.ellipse([-150, 250, 450, 850], fill=(30, 58, 138)) # blue-900

    # Inner Glass Card
    draw.rounded_rectangle([30, 30, W - 30, H - 30], radius=24, fill=(15, 23, 42), outline=(51, 65, 85), width=2)

    # Top Brand Bar
    draw.text((70, 65), "📚 DevShelf", fill=(255, 255, 255), font=font_brand)
    draw.text((250, 68), "• The Open-Source Community Directory", fill=(148, 163, 184), font=font_meta)

    # Milestone Badge (600+ Tools)
    draw.rounded_rectangle([970, 60, 1130, 98], radius=8, fill=(6, 78, 59), outline=(16, 185, 129), width=1)
    draw.text((990, 68), "🎉 600+ Tools", fill=(110, 231, 183), font=font_pill)

    # Hero Title (2 lines)
    draw.text((70, 150), "600+ Developer Tools & Free APIs", fill=(255, 255, 255), font=font_hero)
    draw.text((70, 218), "Zero Paywalls • 100% Verified", fill=(52, 211, 153), font=font_hero)

    # Subtitle
    desc = "Community-curated directory of free cloud tiers, AI agents, CLI tools, testing frameworks, and boilerplates."
    draw.text((70, 305), desc, fill=(148, 163, 184), font=font_sub)

    # 4 Category Pills
    pills = [
        ("🤖 116 AI & Agent Tools", (6, 78, 59), (16, 185, 129), (110, 231, 183)),
        ("⚡ 140 CLI Utilities", (30, 58, 138), (59, 130, 246), (147, 197, 253)),
        ("🌐 111 Free Public APIs", (88, 28, 135), (168, 85, 247), (216, 180, 254)),
        ("☁️ 73 Free Cloud Tiers", (120, 53, 15), (245, 158, 11), (253, 230, 138)),
    ]

    px = 70
    py = 370
    for label, bg, border, text_color in pills:
        pw = len(label) * 11 + 32
        draw.rounded_rectangle([px, py, px + pw, py + 42], radius=10, fill=bg, outline=border, width=1)
        draw.text((px + 16, py + 9), label, fill=text_color, font=font_pill)
        px += pw + 16

    # Terminal CLI Command Box
    y_cmd = 455
    draw.rounded_rectangle([70, y_cmd, 1130, y_cmd + 66], radius=14, fill=(2, 6, 23), outline=(51, 65, 85), width=1)
    draw.text((95, y_cmd + 20), "$ npx @ritualdev-lab/devshelf search 'mcp'", fill=(110, 231, 183), font=font_code)

    draw.rounded_rectangle([1020, y_cmd + 12, 1115, y_cmd + 54], radius=8, fill=(30, 41, 59), outline=(71, 85, 105), width=1)
    draw.text((1045, y_cmd + 22), "MCP", fill=(203, 213, 225), font=font_pill)

    # Bottom Footer
    draw.text((70, 555), "devshelf.ritualdev.in • RitualDev Lab • MIT License", fill=(100, 116, 139), font=font_meta)

    # Save outputs
    out_jpg = SITE_DIR / "og-image.jpg"
    out_png = SITE_DIR / "og-image.png"
    out_default = OG_DIR / "default.png"

    img.save(str(out_jpg), "JPEG", quality=95)
    img.save(str(out_png), "PNG", quality=95)
    img.save(str(out_default), "PNG", quality=95)
    print(f"✔ Successfully generated {out_jpg}, {out_png}, and {out_default}")

if __name__ == "__main__":
    generate_devshelf_og()
