"""Extract the canonical MaMa Zainab wordmark from the brand-guideline PDF page,
clean it, and save reusable brand assets:

  01_Brand/wordmark/
    MaMa_Zainab_wordmark_black.png       (black on transparent - primary)
    MaMa_Zainab_wordmark_white.png       (white on transparent - for dark surfaces)
    MaMa_Zainab_wordmark_black_solid.png (black on cream - preview)
    MaMa_Zainab_wordmark_white_solid.png (white on green - preview)

Source: _extract/pdf_pages/guideline_p06.png (the white wordmark card on right).
"""
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np
import fitz  # PyMuPDF

# Use the dedicated Brand-Guideline PDF (not the "Final version" pitch deck).
PDF = Path(r"d:\AI\MaMaZainab\01_Brand\_guideline_source\Mama Zainab Brand_guideline.pdf")
print(f"Using PDF: {PDF}")

OUT = Path(r"d:\AI\MaMaZainab\01_Brand\wordmark")
OUT.mkdir(parents=True, exist_ok=True)

GREEN  = (27, 155, 0)
CREAM  = (240, 244, 235)

# 1. Re-render page 6 at 600 dpi for high-resolution wordmark
doc = fitz.open(PDF)
page = doc[5]  # 0-indexed: page 6
mat = fitz.Matrix(600 / 72, 600 / 72)
pix = page.get_pixmap(matrix=mat, alpha=False)
hi_path = OUT / "_debug_p06_hi.png"
pix.save(str(hi_path))
src = Image.open(hi_path).convert("RGB")
W, H = src.size
print(f"Source (hi-res): {W}x{H}")

# 2. Crop the TOP white wordmark card (no border).
# Measured from the actual page (1736x1241) - the top white card spans:
#   x: 1214..1634   y: 545..770   (ratios below)
x0 = int(W * 0.708)
y0 = int(W * 0.314)  # ~545 / 1736
x1 = int(W * 0.928)
y1 = int(W * 0.443)  # ~770 / 1736
# Use H-based ratios to be safe across resolutions
y0 = int(H * 0.450)
y1 = int(H * 0.600)
card = src.crop((x0, y0, x1, y1))
card.save(OUT / "_debug_card_crop.png")
print(f"Card crop: {card.size} at ({x0},{y0})-({x1},{y1})")

# 3. Convert to grayscale + threshold to isolate ink, build alpha
gray = np.array(card.convert("L"))
# pixels darker than 110 are ink
mask = (gray < 110).astype(np.uint8) * 255

# 4. Trim the bbox tightly around the ink
ys, xs = np.where(mask > 0)
if len(xs) == 0:
    raise SystemExit("No ink pixels found - check crop coords")
pad = 20
bx0, by0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
bx1, by1 = min(card.size[0], xs.max() + pad), min(card.size[1], ys.max() + pad)
mask_trim = mask[by0:by1, bx0:bx1]
print(f"Trimmed mark: {bx1 - bx0} x {by1 - by0}")

# 5. Build BLACK on transparent
H2, W2 = mask_trim.shape
black_rgba = np.zeros((H2, W2, 4), dtype=np.uint8)
black_rgba[..., 0:3] = 0          # black
black_rgba[..., 3]   = mask_trim  # alpha follows ink mask
Image.fromarray(black_rgba, "RGBA").save(OUT / "MaMa_Zainab_wordmark_black.png", optimize=True)

# 6. Build WHITE on transparent (same alpha, white channels)
white_rgba = np.zeros((H2, W2, 4), dtype=np.uint8)
white_rgba[..., 0:3] = 255
white_rgba[..., 3]   = mask_trim
Image.fromarray(white_rgba, "RGBA").save(OUT / "MaMa_Zainab_wordmark_white.png", optimize=True)

# 7. Solid previews
def composite_on(bg_color, mark_path, out_path, padding=80):
    mark = Image.open(mark_path).convert("RGBA")
    mw, mh = mark.size
    cw, ch = mw + padding * 2, mh + padding * 2
    bg = Image.new("RGBA", (cw, ch), bg_color + (255,))
    bg.alpha_composite(mark, (padding, padding))
    bg.convert("RGB").save(out_path, optimize=True)

composite_on(CREAM, OUT / "MaMa_Zainab_wordmark_black.png",
             OUT / "MaMa_Zainab_wordmark_black_solid.png")
composite_on(GREEN, OUT / "MaMa_Zainab_wordmark_white.png",
             OUT / "MaMa_Zainab_wordmark_white_solid.png")

print("✓ wordmark assets ->", OUT)
