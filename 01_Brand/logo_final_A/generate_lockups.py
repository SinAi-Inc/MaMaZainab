"""MaMa Zainab - Direction A FINAL: lockup system using the canonical wordmark.

No Arabic on the logo (Arabic appears only in video subtitles per founder direction).

Outputs to 01_Brand/logo_final_A/:
  primary_on_cream.png       (1600x900)  - hero lockup, default usage
  primary_on_white.png       (1600x900)  - clean white surface
  primary_on_green.png       (1600x900)  - brand-color surface
  primary_on_black.png       (1600x900)  - dark-mode / video lower-thirds
  horizontal_on_cream.png    (2400x800)  - wide stationery / website header
  stacked_on_cream.png       (1200x1400) - vertical / app onboarding
  mark_only_avatar.png        (800x800)  - app icon / social avatar (M monogram)
  mark_only_seal.png          (800x800)  - packaging seal version w/ green ring
  monochrome_black.png       (1600x900)  - single-color print
  monochrome_white.png       (1600x900)  - reversed
  with_tagline_en.png        (1600x900)  - adds EN tagline below
  with_tagline_zh.png        (1600x900)  - adds 盛恒王 subtitle (founder lore mark)
  _contact_sheet.png         - all variants together for review

Asset dependencies:
  01_Brand/wordmark/MaMa_Zainab_wordmark_black.png  (RGBA)
  01_Brand/wordmark/MaMa_Zainab_wordmark_white.png  (RGBA)
  fonts/Chinese Monoline.ttf
  fonts/KozGoPr6N-Regular.otf  (CJK)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"d:\AI\MaMaZainab\01_Brand\logo_final_A")
OUT.mkdir(parents=True, exist_ok=True)
WM_DIR = Path(r"d:\AI\MaMaZainab\01_Brand\wordmark")
FONTS  = Path(r"d:\AI\MaMaZainab\fonts")

# Brand palette (locked)
GREEN      = (27, 155, 0)
GREEN_DEEP = (22, 146, 22)
YELLOW     = (239, 210, 0)
WHITE      = (255, 255, 255)
INK        = (44, 41, 42)
BLACK      = (0, 0, 0)
CREAM      = (240, 244, 235)

# Load wordmark RGBA assets
WM_BLACK = Image.open(WM_DIR / "MaMa_Zainab_wordmark_black.png").convert("RGBA")
WM_WHITE = Image.open(WM_DIR / "MaMa_Zainab_wordmark_white.png").convert("RGBA")

def font(path, size):
    try: return ImageFont.truetype(str(path), size)
    except Exception: return ImageFont.load_default()

F_DISPLAY = FONTS / "Chinese Monoline.ttf"
F_CJK     = FONTS / "KozGoPr6N-Regular.otf"
F_UI      = "arial.ttf"
F_UI_B    = "arialbd.ttf"

def text_size(d, txt, fnt):
    l, t, r, b = d.textbbox((0, 0), txt, font=fnt)
    return r - l, b - t, l, t

def fit_wordmark(wm: Image.Image, target_w: int) -> Image.Image:
    """Scale wordmark to a target width while preserving aspect."""
    w, h = wm.size
    new_h = int(h * target_w / w)
    return wm.resize((target_w, new_h), Image.LANCZOS)

def tint_wordmark(wm_rgba: Image.Image, color) -> Image.Image:
    """Replace RGB channels with `color`, keep alpha intact."""
    r, g, b, a = wm_rgba.split()
    tinted = Image.new("RGBA", wm_rgba.size, color + (0,))
    tinted.putalpha(a)
    return tinted

# ---------------- canvas helpers ----------------
def canvas(size, bg):
    return Image.new("RGBA", size, bg + (255,))

def center_paste(canvas_img, layer, anchor_y_ratio=0.5):
    cw, ch = canvas_img.size
    lw, lh = layer.size
    x = (cw - lw) // 2
    y = int(ch * anchor_y_ratio - lh / 2)
    canvas_img.alpha_composite(layer, (x, y))

# ---------------- core lockup builders ----------------
def primary(bg_color, wm_color, accent=YELLOW, with_underline=True, w=1600, h=900):
    img = canvas((w, h), bg_color)
    # wordmark @ 60% of canvas width
    wm_src = WM_BLACK if wm_color == "black" else WM_WHITE
    target_color = INK if wm_color == "black" else WHITE
    wm = tint_wordmark(wm_src, target_color)
    wm = fit_wordmark(wm, int(w * 0.62))
    cw, ch = img.size
    wmw, wmh = wm.size
    img.alpha_composite(wm, ((cw - wmw) // 2, (ch - wmh) // 2 - 10))
    if with_underline:
        d = ImageDraw.Draw(img)
        bar_w = int(wmw * 0.32)
        bar_y = (ch + wmh) // 2 + 40
        d.rectangle([(cw - bar_w) // 2, bar_y,
                     (cw + bar_w) // 2, bar_y + 8], fill=accent)
    return img

def horizontal(bg_color, wm_color, accent=YELLOW, w=2400, h=800):
    img = canvas((w, h), bg_color)
    wm_src = WM_BLACK if wm_color == "black" else WM_WHITE
    target_color = INK if wm_color == "black" else WHITE
    wm = tint_wordmark(wm_src, target_color)
    wm = fit_wordmark(wm, int(w * 0.78))
    wmw, wmh = wm.size
    img.alpha_composite(wm, ((w - wmw) // 2, (h - wmh) // 2))
    return img

def stacked(bg_color, wm_color, tagline_en="AUTHENTIC MAHSHI · ALEXANDRIA",
            w=1200, h=1400):
    img = canvas((w, h), bg_color)
    wm_src = WM_BLACK if wm_color == "black" else WM_WHITE
    target_color = INK if wm_color == "black" else WHITE
    wm = tint_wordmark(wm_src, target_color)
    wm = fit_wordmark(wm, int(w * 0.78))
    wmw, wmh = wm.size
    img.alpha_composite(wm, ((w - wmw) // 2, int(h * 0.30)))
    d = ImageDraw.Draw(img)
    # yellow bar
    bar_w = int(wmw * 0.40)
    by = int(h * 0.30) + wmh + 60
    d.rectangle([(w - bar_w) // 2, by, (w + bar_w) // 2, by + 10], fill=YELLOW)
    # tagline
    f = font(F_UI_B, 42)
    tw, th, _, _ = text_size(d, tagline_en, f)
    d.text(((w - tw) // 2, by + 45), tagline_en, fill=target_color, font=f)
    # CJK lore line
    cjk = font(F_CJK, 48)
    cjk_txt = "盛恒王"
    cw2, ch2, _, _ = text_size(d, cjk_txt, cjk)
    d.text(((w - cw2) // 2, by + 130), cjk_txt, fill=target_color, font=cjk)
    return img

def with_tagline(bg_color, wm_color, line_text, font_obj, w=1600, h=900):
    img = primary(bg_color, wm_color, with_underline=True, w=w, h=h)
    d = ImageDraw.Draw(img)
    target_color = INK if wm_color == "black" else WHITE
    tw, th, _, _ = text_size(d, line_text, font_obj)
    # place well below the underline (with extra clearance)
    d.text(((w - tw) // 2, int(h * 0.82)), line_text,
           fill=target_color, font=font_obj)
    return img

def mark_avatar_M(bg_color, fg_color, w=800, h=800):
    """App-icon: a single 'M' glyph in Chinese Monoline (same family as wordmark)."""
    img = canvas((w, h), bg_color)
    d = ImageDraw.Draw(img)
    f = font(F_DISPLAY, 600)
    # measure
    l, t, r, b = d.textbbox((0, 0), "M", font=f)
    tw, th = r - l, b - t
    x = (w - tw) // 2 - l
    y = (h - th) // 2 - t - 30
    d.text((x, y), "M", fill=fg_color, font=f)
    # yellow underline
    bar_w = int(w * 0.32)
    bar_y = y + th + 40
    d.rectangle([(w - bar_w) // 2, bar_y, (w + bar_w) // 2, bar_y + 12],
                fill=YELLOW)
    return img

def mark_seal(w=800, h=800):
    """Packaging seal: green ring + cream interior + small wordmark."""
    img = canvas((w, h), CREAM)
    d = ImageDraw.Draw(img)
    cx, cy = w // 2, h // 2
    R = 360
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=GREEN)
    d.ellipse([cx - R + 28, cy - R + 28, cx + R - 28, cy + R - 28], fill=CREAM)
    # Wordmark inside
    wm = tint_wordmark(WM_BLACK, INK)
    wm = fit_wordmark(wm, int(R * 1.4))
    wmw, wmh = wm.size
    img.alpha_composite(wm, ((w - wmw) // 2, (h - wmh) // 2 - 20))
    # yellow underline
    bar_w = int(wmw * 0.32)
    by = (h + wmh) // 2 + 8
    d.rectangle([(w - bar_w) // 2, by, (w + bar_w) // 2, by + 8], fill=YELLOW)
    # top crown text
    f = font(F_UI_B, 28)
    top = "•  EST. 2026  •  ALEXANDRIA  •"
    tw, th, _, _ = text_size(d, top, f)
    d.text(((w - tw) // 2, cy - R + 45), top, fill=GREEN_DEEP, font=f)
    return img

# ---------------- render variants ----------------
print("Rendering Direction A lockup system…")

primary(CREAM, "black").convert("RGB").save(OUT / "primary_on_cream.png", optimize=True)
primary(WHITE, "black").convert("RGB").save(OUT / "primary_on_white.png", optimize=True)
primary(GREEN, "white").convert("RGB").save(OUT / "primary_on_green.png", optimize=True)
primary(BLACK, "white").convert("RGB").save(OUT / "primary_on_black.png", optimize=True)
primary(CREAM, "black", with_underline=False).convert("RGB").save(OUT / "monochrome_black.png", optimize=True)
primary(BLACK, "white", with_underline=False).convert("RGB").save(OUT / "monochrome_white.png", optimize=True)

horizontal(CREAM, "black").convert("RGB").save(OUT / "horizontal_on_cream.png", optimize=True)
stacked(CREAM, "black").convert("RGB").save(OUT / "stacked_on_cream.png", optimize=True)

with_tagline(CREAM, "black", "AUTHENTIC MAHSHI  ·  HOMEMADE TASTE  ·  FAST-FOOD SPEED",
             font(F_UI_B, 38)).convert("RGB").save(OUT / "with_tagline_en.png", optimize=True)
with_tagline(CREAM, "black", "盛恒王", font(F_CJK, 84)).convert("RGB").save(OUT / "with_tagline_zh.png", optimize=True)

mark_avatar_M(GREEN, WHITE).convert("RGB").save(OUT / "mark_only_avatar.png", optimize=True)
mark_seal().convert("RGB").save(OUT / "mark_only_seal.png", optimize=True)

print("✓ all variants rendered")

# ---------------- contact sheet ----------------
files = [
    ("primary_on_cream.png",  "Primary - on Cream (default)"),
    ("primary_on_white.png",  "Primary - on White"),
    ("primary_on_green.png",  "Primary - on Brand Green"),
    ("primary_on_black.png",  "Primary - on Black"),
    ("horizontal_on_cream.png","Horizontal - wide header"),
    ("stacked_on_cream.png",  "Stacked - with EN tagline + 盛恒王"),
    ("with_tagline_en.png",   "Primary + EN tagline"),
    ("with_tagline_zh.png",   "Primary + 盛恒王 (founder lore)"),
    ("mark_only_avatar.png",  "Mark only - app icon / avatar (M)"),
    ("mark_only_seal.png",    "Mark only - packaging seal"),
    ("monochrome_black.png",  "Monochrome - black"),
    ("monochrome_white.png",  "Monochrome - white (reversed)"),
]
cols = 2
rows = (len(files) + cols - 1) // cols
cell_w, cell_h = 800, 480
sheet_w = cell_w * cols + 60
sheet_h = cell_h * rows + 140
sheet = Image.new("RGB", (sheet_w, sheet_h), CREAM)
sd = ImageDraw.Draw(sheet)
sd.text((30, 30), "MaMa Zainab - Direction A · LOCKUP SYSTEM (canonical wordmark, no Arabic)",
        fill=INK, font=font(F_UI_B, 30))
sd.text((30, 70), "Arabic localization lives in video subtitles only.",
        fill=INK, font=font(F_UI, 22))
y0 = 120
for i, (fn, label) in enumerate(files):
    col = i % cols
    row = i // cols
    img = Image.open(OUT / fn)
    # fit into cell preserving aspect
    iw, ih = img.size
    ratio = min((cell_w - 40) / iw, (cell_h - 60) / ih)
    nw, nh = int(iw * ratio), int(ih * ratio)
    img2 = img.resize((nw, nh), Image.LANCZOS)
    cx = 30 + col * cell_w + (cell_w - nw) // 2
    cy = y0 + row * cell_h + (cell_h - nh) // 2 - 20
    sheet.paste(img2, (cx, cy))
    # Use CJK-capable font for labels so 盛恒王 renders
    sd.text((30 + col * cell_w + 20, y0 + row * cell_h + cell_h - 36),
            label, fill=INK, font=font(F_CJK, 22))
sheet.save(OUT / "_contact_sheet.png", optimize=True)
print("✓ contact sheet ->", OUT / "_contact_sheet.png")
print("DONE.")
