"""MaMa Zainab - Logo Round 1: render 3 directional concepts.

These are RASTER MOCKUPS for direction approval, NOT production logos.
After founder picks a direction, we'll vectorize in Illustrator/Figma.

Directions:
  A) MODERN TYPE-ONLY  - clean Chinese Monoline wordmark stack (EN/AR/ZH),
     yellow underline accent on green chip. Premium, minimal.
  B) ZUZU BADGE        - circular green seal, ZuZu silhouette + wordmark
     curved around. Mascot-forward, friendly.
  C) EASTERN STAMP     - square red/green Eastern-style chop/seal with the
     Chinese name 盛恒王 stamped, paired with the wordmark.

Each direction renders:
  - <dir>_on_white.png    1600x1000  (light surface use)
  - <dir>_on_green.png    1600x1000  (dark/brand surface use)
  - <dir>_mark_only.png   800x800    (icon/avatar use, when applicable)

Plus _contact_sheet.png with all 3 directions side-by-side.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math
import arabic_reshaper
from bidi.algorithm import get_display

def ar(text: str) -> str:
    """Reshape + bidi-reorder Arabic so PIL renders connected glyphs correctly."""
    return get_display(arabic_reshaper.reshape(text))

OUT = Path(r"d:\AI\MaMaZainab\01_Brand\logo_round1")
OUT.mkdir(parents=True, exist_ok=True)

# Brand
GREEN  = (27, 155, 0)     # #1B9B00
GREEN_DEEP = (22, 146, 22)
YELLOW = (239, 210, 0)    # #EFD200
WHITE  = (255, 255, 255)
INK    = (44, 41, 42)
CREAM  = (240, 244, 235)
RED_SEAL = (200, 35, 25)  # warm vermillion (NOT the alert red)

FONTS = Path(r"d:\AI\MaMaZainab\fonts")
F_DISPLAY = str(FONTS / "Chinese Monoline.ttf")
F_CJK     = str(FONTS / "KozGoPr6N-Regular.otf")
F_SCRIPT  = str(FONTS / "LHANDW.TTF")
F_FALLBK  = "arial.ttf"
F_FALLBK_B = "arialbd.ttf"
F_ARABIC  = r"C:\Windows\Fonts\trado.ttf"  # Traditional Arabic - proper shaping

def font(path, size):
    try: return ImageFont.truetype(path, size)
    except Exception: return ImageFont.load_default()

def text_size(d, txt, fnt):
    l, t, r, b = d.textbbox((0, 0), txt, font=fnt)
    return r - l, b - t, l, t

def canvas(bg, w=1600, h=1000):
    return Image.new("RGB", (w, h), bg)

def label(d, x, y, txt, color=INK, size=20):
    d.text((x, y), txt, fill=color, font=font(F_FALLBK, size))

# ----------------- DIRECTION A: MODERN TYPE-ONLY -----------------
def render_A(bg_color, fg_color, accent_color):
    img = canvas(bg_color)
    d = ImageDraw.Draw(img)
    # Stack: 盛恒王 small / MaMa Zainab huge / ماما زينب medium / yellow underline
    cjk_f   = font(F_CJK, 44)
    main_f  = font(F_DISPLAY, 200)
    arab_f  = font(F_ARABIC, 80)
    arab_txt = ar("ماما زينب")
    cw, ch, _, _ = text_size(d, "盛恒王", cjk_f)
    mw, mh, _, _ = text_size(d, "MaMa Zainab", main_f)
    aw, ah, _, _ = text_size(d, arab_txt, arab_f)
    cx = img.width // 2
    total_h = ch + 30 + mh + 25 + 6 + 25 + ah
    y = (img.height - total_h) // 2 - 20
    d.text((cx - cw / 2, y), "盛恒王", fill=fg_color, font=cjk_f); y += ch + 30
    d.text((cx - mw / 2, y), "MaMa Zainab", fill=fg_color, font=main_f); y += mh + 25
    # accent bar (yellow)
    bar_w = int(mw * 0.40)
    d.rectangle([cx - bar_w // 2, y, cx + bar_w // 2, y + 6], fill=accent_color)
    y += 6 + 25
    d.text((cx - aw / 2, y), arab_txt, fill=fg_color, font=arab_f)
    return img

# ----------------- DIRECTION B: ZUZU BADGE -----------------
def goose_silhouette(d, cx, cy, scale, body_color=INK):
    """Cleaner stylized goose: oval body + S-curve neck + round head + triangle beak.
    cx, cy = center of body. scale = approx body half-width in px.
    """
    s = scale
    # Body - rounded oval, tail tapered slightly
    body = [cx - s, cy - int(s * 0.55), cx + int(s * 0.95), cy + int(s * 0.55)]
    d.ellipse(body, fill=body_color)
    # Tail tuft
    d.polygon([(cx - s + 6, cy - int(s * 0.10)),
               (cx - s - int(s * 0.30), cy - int(s * 0.30)),
               (cx - s + 6, cy + int(s * 0.10))], fill=body_color)
    # Wing accent - soft arc inside body
    wing_color = tuple(min(255, c + 28) for c in body_color) if body_color != INK else (70, 67, 68)
    d.chord([cx - int(s * 0.55), cy - int(s * 0.30),
             cx + int(s * 0.55), cy + int(s * 0.45)], 200, 350, fill=wing_color)
    # Neck - S curve approximated by a sequence of tapered circles
    neck_pts = []
    steps = 22
    nx_start, ny_start = cx + int(s * 0.30), cy - int(s * 0.40)
    head_x, head_y = cx + int(s * 0.55), cy - int(s * 1.30)
    for i in range(steps + 1):
        t = i / steps
        # cubic bezier-ish: start -> ctrl1 -> ctrl2 -> head
        cx1, cy1 = nx_start + int(s * 0.55), cy - int(s * 0.45)
        cx2, cy2 = cx + int(s * 0.10), cy - int(s * 1.10)
        x = (1 - t) ** 3 * nx_start + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t * t * cx2 + t ** 3 * head_x
        y = (1 - t) ** 3 * ny_start + 3 * (1 - t) ** 2 * t * cy1 + 3 * (1 - t) * t * t * cy2 + t ** 3 * head_y
        neck_pts.append((x, y))
    for i, (x, y) in enumerate(neck_pts):
        r = int(s * 0.20 - i * (s * 0.10) / steps)
        if r < 4: r = 4
        d.ellipse([x - r, y - r, x + r, y + r], fill=body_color)
    # Head
    hr = int(s * 0.22)
    d.ellipse([head_x - hr, head_y - hr, head_x + hr, head_y + hr], fill=body_color)
    # Beak - orange triangle pointing right
    beak = [(head_x + hr - 4, head_y - 4),
            (head_x + hr + int(s * 0.32), head_y + 4),
            (head_x + hr - 4, head_y + 12)]
    d.polygon(beak, fill=(245, 130, 30))
    # Eye
    er = max(3, int(s * 0.04))
    d.ellipse([head_x + er, head_y - er - 2, head_x + 3 * er, head_y + er - 2], fill=WHITE)
    d.ellipse([head_x + 2 * er - 1, head_y - 2, head_x + 2 * er + 2, head_y + 1], fill=INK)

def render_B(bg_color, ring_color, mark_bg, wordmark_color, top_text_color):
    img = canvas(bg_color)
    d = ImageDraw.Draw(img)
    cx, cy = img.width // 2, img.height // 2 - 10
    R = 380
    # Outer ring
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=ring_color)
    # Inner disc
    pad = 30
    d.ellipse([cx - R + pad, cy - R + pad, cx + R - pad, cy + R - pad], fill=mark_bg)
    # Goose silhouette - sized to inner disc
    goose_silhouette(d, cx - 30, cy + 60, scale=170, body_color=INK)
    # Wordmark inside under the goose
    main_f = font(F_DISPLAY, 78)
    mw, mh, _, _ = text_size(d, "MaMa Zainab", main_f)
    d.text((cx - mw / 2, cy + R - 110), "MaMa Zainab", fill=wordmark_color, font=main_f)
    # Top tagline (straight, not curved - cleaner)
    top_f = font(F_FALLBK_B, 26)
    top_txt = "•  EST. 2026  •  ALEXANDRIA  •"
    tw, th, _, _ = text_size(d, top_txt, top_f)
    d.text((cx - tw / 2, cy - R + 55), top_txt, fill=top_text_color, font=top_f)
    return img

# ----------------- DIRECTION C: EASTERN STAMP -----------------
def render_C(bg_color, fg_text_color):
    img = canvas(bg_color)
    d = ImageDraw.Draw(img)
    # Layout: stamp on left, wordmark stack on right
    stamp_size = 360
    stamp_x = 130
    stamp_y = (img.height - stamp_size) // 2
    # Stamp border (thick red square w/ inner border)
    d.rectangle([stamp_x, stamp_y, stamp_x + stamp_size, stamp_y + stamp_size],
                outline=RED_SEAL, width=14)
    d.rectangle([stamp_x + 22, stamp_y + 22,
                 stamp_x + stamp_size - 22, stamp_y + stamp_size - 22],
                outline=RED_SEAL, width=4)
    # Chinese name 盛恒王 in 3 vertical chars
    cjk_big = font(F_CJK, 120)
    chars = ["盛", "恒", "王"]
    inner_top = stamp_y + 36
    char_h = (stamp_size - 72) // 3
    for i, ch in enumerate(chars):
        cw, chh, lo, to = text_size(d, ch, cjk_big)
        cx2 = stamp_x + stamp_size // 2 - cw // 2 - lo
        cy2 = inner_top + i * char_h + (char_h - chh) // 2 - to
        d.text((cx2, cy2), ch, fill=RED_SEAL, font=cjk_big)
    # Wordmark stack on right
    rx = stamp_x + stamp_size + 70
    main_f = font(F_DISPLAY, 110)
    sub_f  = font(F_FALLBK, 26)
    arab_f = font(F_ARABIC, 60)
    arab_txt = ar("ماما زينب")
    mw, mh, _, _ = text_size(d, "MaMa Zainab", main_f)
    d.text((rx, stamp_y + 50), "MaMa Zainab", fill=fg_text_color, font=main_f)
    # Yellow underline
    d.rectangle([rx, stamp_y + 50 + mh + 14, rx + int(mw * 0.55),
                 stamp_y + 50 + mh + 22], fill=YELLOW)
    d.text((rx, stamp_y + 50 + mh + 46),
           "AUTHENTIC MAHSHI  ·  ALEXANDRIA  ·  2026",
           fill=fg_text_color, font=sub_f)
    d.text((rx, stamp_y + 50 + mh + 96), arab_txt, fill=fg_text_color, font=arab_f)
    return img

# ----------------- mark-only (avatar / app icon) -----------------
def mark_A():
    img = Image.new("RGB", (800, 800), GREEN)
    d = ImageDraw.Draw(img)
    f = font(F_DISPLAY, 380)
    txt = "MZ"
    w, h, l, t = text_size(d, txt, f)
    d.text(((800 - w) / 2 - l, (800 - h) / 2 - t - 20), txt, fill=WHITE, font=f)
    # yellow underline
    d.rectangle([240, 620, 560, 640], fill=YELLOW)
    return img

def mark_B():
    img = Image.new("RGB", (800, 800), CREAM)
    d = ImageDraw.Draw(img)
    cx, cy = 400, 400
    R = 360
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=GREEN)
    d.ellipse([cx - R + 22, cy - R + 22, cx + R - 22, cy + R - 22], fill=CREAM)
    goose_silhouette(d, cx - 30, cy + 70, scale=185, body_color=INK)
    return img

def mark_C():
    img = Image.new("RGB", (800, 800), CREAM)
    d = ImageDraw.Draw(img)
    s = 600
    sx = (800 - s) // 2
    sy = (800 - s) // 2
    d.rectangle([sx, sy, sx + s, sy + s], outline=RED_SEAL, width=22)
    d.rectangle([sx + 30, sy + 30, sx + s - 30, sy + s - 30], outline=RED_SEAL, width=6)
    cjk_big = font(F_CJK, 200)
    chars = ["盛", "恒", "王"]
    char_h = (s - 100) // 3
    for i, ch in enumerate(chars):
        cw, chh, lo, to = text_size(d, ch, cjk_big)
        d.text((sx + s // 2 - cw // 2 - lo, sy + 50 + i * char_h + (char_h - chh) // 2 - to),
               ch, fill=RED_SEAL, font=cjk_big)
    return img

# ----------------- render all -----------------
DIRS = [
    ("A_modern_type",  render_A, mark_A,
     "DIRECTION A - Modern Type-Only",
     "Premium, minimal, scales tiny→huge. Strong on web/app/packaging."),
    ("B_zuzu_badge",   render_B, mark_B,
     "DIRECTION B - ZuZu Mascot Badge",
     "Friendly, warm, kids/family pull. Iconic on signage and cups."),
    ("C_eastern_stamp",render_C, mark_C,
     "DIRECTION C - Eastern Stamp + Wordmark",
     "Tells the founder lore at a glance. Premium, story-led."),
]

for key, fn_full, fn_mark, _t, _d in DIRS:
    if key == "A_modern_type":
        white_v = fn_full(WHITE, INK, YELLOW)
        green_v = fn_full(GREEN, WHITE, YELLOW)
    elif key == "B_zuzu_badge":
        # render_B(bg, ring, mark_bg, wordmark_color, top_text_color)
        white_v = fn_full(WHITE, GREEN, CREAM, GREEN_DEEP, GREEN)
        green_v = fn_full(GREEN, CREAM, CREAM, GREEN_DEEP, CREAM)
    else:  # C
        white_v = fn_full(WHITE, INK)
        green_v = fn_full(GREEN, WHITE)
    white_v.save(OUT / f"{key}_on_white.png", optimize=True)
    green_v.save(OUT / f"{key}_on_green.png", optimize=True)
    fn_mark().save(OUT / f"{key}_mark_only.png", optimize=True)
    print(f"✓ {key}")

# ----------------- contact sheet -----------------
sheet_w, row_h = 1660, 1100
sheet = Image.new("RGB", (sheet_w, row_h * 3 + 110), CREAM)
sd = ImageDraw.Draw(sheet)
sd.text((30, 30), "MaMa Zainab - Logo Round 1 (raster mockups for direction approval)",
        fill=INK, font=font(F_FALLBK_B, 32))
y = 100
for key, _, _, title, desc in DIRS:
    img = Image.open(OUT / f"{key}_on_white.png").resize((780, 488))
    img2 = Image.open(OUT / f"{key}_on_green.png").resize((780, 488))
    sheet.paste(img, (30, y))
    sheet.paste(img2, (840, y))
    sd.text((30, y + 500), title, fill=INK, font=font(F_FALLBK_B, 28))
    sd.text((30, y + 540), desc,  fill=INK, font=font(F_FALLBK, 22))
    y += row_h
sheet.save(OUT / "_contact_sheet.png", optimize=True)
print("✓ contact sheet")
print("DONE ->", OUT)
