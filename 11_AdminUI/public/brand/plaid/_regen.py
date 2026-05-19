"""Regenerate all checkerboard plaid variants for MaMa Zainab brand."""
from PIL import Image, ImageDraw, ImageFont
import os

GREEN  = (27, 155, 0)     # #1B9B00
YELLOW = (239, 210, 0)    # #EFD200
INK    = (44, 41, 42)

OUT = os.path.dirname(os.path.abspath(__file__))

VARIANTS = {
    "web":       {"sq": 32, "tile": 384, "label": "Web / Digital"},
    "packaging": {"sq": 48, "tile": 384, "label": "Packaging / Boxes"},
    "apron":     {"sq": 64, "tile": 384, "label": "Apron / Uniform"},
}

def make_checkerboard(tile_size, sq_size):
    img = Image.new("RGB", (tile_size, tile_size), GREEN)
    d = ImageDraw.Draw(img)
    cols = tile_size // sq_size
    for row in range(cols):
        for col in range(cols):
            if (row + col) % 2 == 1:
                d.rectangle([col*sq_size, row*sq_size, (col+1)*sq_size, (row+1)*sq_size], fill=YELLOW)
    return img

def make_swatch(tile, name, spec):
    sw, sh = 800, 500
    canvas = Image.new("RGB", (sw, sh), (240, 244, 235))
    t = tile.resize((450, 450), Image.LANCZOS)
    canvas.paste(t, (25, 25))
    d = ImageDraw.Draw(canvas)
    try:
        font_h = ImageFont.truetype("arial.ttf", 28)
        font_s = ImageFont.truetype("arial.ttf", 16)
    except Exception:
        font_h = ImageFont.load_default()
        font_s = ImageFont.load_default()
    x = 500
    d.text((x, 40), "CHECKERBOARD", fill=INK, font=font_h)
    d.text((x, 80), spec["label"], fill=INK, font=font_s)
    lines = [
        "tile     %dpx (seamless)" % spec["tile"],
        "cell     %dpx square" % spec["sq"],
        "",
        "base     #1B9B00  brand.green",
        "check    #EFD200  brand.yellow",
        "pattern  checkerboard",
    ]
    y = 120
    for ln in lines:
        d.text((x, y), ln, fill=INK, font=font_s)
        y += 24
    # color chips
    for i, (hexv, rgb) in enumerate([("#1B9B00", GREEN), ("#EFD200", YELLOW)]):
        cx = x + i * 140
        d.rectangle([cx, 350, cx + 110, 420], fill=rgb, outline=INK)
        d.text((cx, 430), hexv, fill=INK, font=font_s)
    return canvas

# Generate each variant
for name, spec in VARIANTS.items():
    tile = make_checkerboard(spec["tile"], spec["sq"])
    tile.save(os.path.join(OUT, "tile_gingham_%s.png" % name), optimize=True)
    swatch = make_swatch(tile, name, spec)
    swatch.save(os.path.join(OUT, "swatch_%s.png" % name), optimize=True)
    print("  %s: tile + swatch" % name)

# Contact sheet (all 3 side by side)
contact = Image.new("RGB", (1200, 500), (240, 244, 235))
d_c = ImageDraw.Draw(contact)
try:
    font_c = ImageFont.truetype("arial.ttf", 18)
except Exception:
    font_c = ImageFont.load_default()

for idx, (name, spec) in enumerate(VARIANTS.items()):
    tile = make_checkerboard(spec["tile"], spec["sq"])
    preview = tile.resize((350, 350), Image.LANCZOS)
    x_off = 30 + idx * 400
    contact.paste(preview, (x_off, 50))
    d_c.text((x_off, 420), "%s (%dpx cells)" % (name, spec["sq"]), fill=INK, font=font_c)

contact.save(os.path.join(OUT, "contact_sheet.png"), optimize=True)

# Awning variant swatch
awning = make_checkerboard(384, 56)
awning_swatch = make_swatch(awning, "awning", {"sq": 56, "tile": 384, "label": "Kiosk Awning"})
awning_swatch.save(os.path.join(OUT, "swatch_awning.png"), optimize=True)

print("All checkerboard variants regenerated.")
for f in sorted(os.listdir(OUT)):
    if f.endswith(".png"):
        print("  " + f)
