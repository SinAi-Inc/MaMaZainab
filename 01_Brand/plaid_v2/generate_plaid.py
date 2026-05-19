"""Generate MaMa Zainab plaid v2 swatch family.

Plaid construction (per BRAND.md / tokens.json):
  base   = #1B9B00  (brand.green) - DOMINANT
  stripe = #EFD200  (brand.yellow)
  weft   = #FFFFFF  (white)
  blend  = multiply (overlapping h+v stripes darken)

Outputs four density variants tuned per surface:
  apron      - large, soft (kitchen / Mama Zainab)
  packaging  - medium-bold (boxes, bags, sleeves)
  awning     - extra-bold (kiosk facade, far-field readability)
  web        - fine, subtle (hero textures, dividers)

Each variant exports:
  - tile_<variant>.png      seamless 4096-px tile
  - tile_<variant>@1k.png   1024-px preview
  - swatch_<variant>.png    1600x1000 framed swatch with spec label
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageChops

OUT = Path(r"d:\AI\MaMaZainab\01_Brand\plaid_v2")
OUT.mkdir(parents=True, exist_ok=True)

GREEN  = (27, 155, 0)     # #1B9B00
YELLOW = (239, 210, 0)    # #EFD200
WHITE  = (255, 255, 255)
INK    = (44, 41, 42)     # #2C292A

# variant: (tile_size_px, stripe_w, weft_w, gap)
# gap = how many "base" units between a stripe pair
VARIANTS = {
    "apron":     {"tile": 1024, "stripe": 96, "weft": 24, "gap": 360, "label": "Apron / Uniform"},
    "packaging": {"tile":  768, "stripe": 64, "weft": 18, "gap": 220, "label": "Packaging / Boxes"},
    "awning":    {"tile":  640, "stripe": 80, "weft": 28, "gap": 160, "label": "Kiosk Awning"},
    "web":       {"tile":  512, "stripe": 18, "weft":  6, "gap": 120, "label": "Web Texture"},
}

def make_stripes(size, stripe_w, weft_w, gap, color_stripe, color_weft, vertical=False):
    """Return RGBA layer with horizontal (or vertical) stripes; rest transparent."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    period = stripe_w + weft_w + gap + weft_w  # stripe, weft, gap, weft
    y = 0
    while y < size:
        # primary stripe
        if vertical:
            d.rectangle([y, 0, y + stripe_w, size], fill=color_stripe + (220,))
        else:
            d.rectangle([0, y, size, y + stripe_w], fill=color_stripe + (220,))
        # weft (thin white) flanking
        y2 = y + stripe_w
        if vertical:
            d.rectangle([y2, 0, y2 + weft_w, size], fill=color_weft + (180,))
        else:
            d.rectangle([0, y2, size, y2 + weft_w], fill=color_weft + (180,))
        y += period
    return img

def build_tile(spec):
    size = spec["tile"]
    base = Image.new("RGB", (size, size), GREEN)
    h = make_stripes(size, spec["stripe"], spec["weft"], spec["gap"], YELLOW, WHITE, vertical=False)
    v = make_stripes(size, spec["stripe"], spec["weft"], spec["gap"], YELLOW, WHITE, vertical=True)
    # Composite via multiply for woven feel
    layer = Image.alpha_composite(h, v)
    out = Image.alpha_composite(base.convert("RGBA"), layer)
    # darken overlap (multiply) for woven look
    overlap = ImageChops.multiply(h.convert("RGB"), v.convert("RGB"))
    mask = Image.eval(overlap.convert("L"), lambda p: 90 if p < 200 else 0)
    out.paste(INK + (0,), (0, 0), mask)
    return out.convert("RGB")

def label_swatch(tile, name, spec):
    canvas = Image.new("RGB", (1600, 1000), (240, 244, 235))  # cream
    # paste tile scaled to 900 px square
    t = tile.resize((900, 900), Image.LANCZOS)
    canvas.paste(t, (60, 50))
    d = ImageDraw.Draw(canvas)
    try:
        font_h = ImageFont.truetype(r"d:\AI\MaMaZainab\fonts\Chinese Monoline.ttf", 64)
        font_b = ImageFont.truetype("arial.ttf", 26)
        font_s = ImageFont.truetype("arial.ttf", 20)
    except Exception:
        font_h = ImageFont.load_default()
        font_b = ImageFont.load_default()
        font_s = ImageFont.load_default()
    x = 1010
    d.text((x, 80),  "PLAID v2", fill=INK, font=font_h)
    d.text((x, 170), spec["label"], fill=INK, font=font_b)
    d.text((x, 220), f"variant: {name}", fill=INK, font=font_s)
    lines = [
        f"tile      {spec['tile']} px (seamless)",
        f"stripe    {spec['stripe']} px",
        f"weft      {spec['weft']} px",
        f"gap       {spec['gap']} px",
        "",
        "base    #1B9B00  brand.green",
        "stripe  #EFD200  brand.yellow",
        "weft    #FFFFFF  white",
        "blend   multiply (woven look)",
    ]
    y = 290
    for ln in lines:
        d.text((x, y), ln, fill=INK, font=font_s); y += 30
    # color chips
    for i, (hexv, rgb) in enumerate([("#1B9B00", GREEN), ("#EFD200", YELLOW), ("#FFFFFF", WHITE)]):
        cx = x + i * 180
        d.rectangle([cx, 740, cx + 150, 890], fill=rgb, outline=INK)
        d.text((cx, 900), hexv, fill=INK, font=font_s)
    d.text((x, 950), "MaMa Zainab - Brand System v2026.05.0", fill=INK, font=font_s)
    return canvas

for name, spec in VARIANTS.items():
    tile = build_tile(spec)
    tile.save(OUT / f"tile_{name}.png", optimize=True)
    tile.resize((1024, 1024), Image.LANCZOS).save(OUT / f"tile_{name}@1k.png", optimize=True)
    label_swatch(tile, name, spec).save(OUT / f"swatch_{name}.png", optimize=True)
    print(f"✓ {name}: {spec['tile']}px tile + swatch")

# Build a contact sheet of all 4 swatches
sheet = Image.new("RGB", (1620, 4040), (240, 244, 235))
y = 10
for name in VARIANTS:
    s = Image.open(OUT / f"swatch_{name}.png")
    sheet.paste(s, (10, y)); y += 1010
sheet.save(OUT / "_contact_sheet.png", optimize=True)
print("✓ contact sheet")
print("DONE ->", OUT)
