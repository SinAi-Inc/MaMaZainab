"""Generate isolated transparent logo assets for web use.

All source PNGs have solid backgrounds. This script removes them:
  logo-on-dark.png     white+yellow wordmark on black → transparent bg
  mark.png             circle seal on cream bg → transparent bg
  mark_only_avatar.png M-mark on green (green IS the brand, keep as-is → copy)

Outputs go to 11_AdminUI/public/brand/:
  logo-wordmark-transparent.png  - white/yellow wordmark, no background
  mark-transparent.png           - circle seal, no background
"""
from pathlib import Path
import numpy as np
from PIL import Image

SRC   = Path(r"d:\AI\MaMaZainab\01_Brand\logo_final_A")
WEB   = Path(r"d:\AI\MaMaZainab\11_AdminUI\public\brand")
WEB.mkdir(parents=True, exist_ok=True)

# ── 1. WORDMARK: white + yellow letters on solid black ────────────────────────
# Strategy: set each pixel's alpha = clipped luminance
#   black (lum≈0)  → alpha=0  (transparent)
#   white (lum=255)→ alpha=255 (opaque)
#   yellow (lum≈195)→ alpha=255 (opaque, colour preserved)

src_wordmark = SRC / "monochrome_white.png"
# Use logo-on-dark from public as it has the yellow stripe
src_wordmark_color = Path(r"d:\AI\MaMaZainab\11_AdminUI\public\brand\logo-on-dark.png")

img = Image.open(src_wordmark_color).convert("RGBA")
data = np.array(img, dtype=np.float32)

r, g, b = data[:, :, 0], data[:, :, 1], data[:, :, 2]
lum = 0.299 * r + 0.587 * g + 0.114 * b  # perceptual luminance

# Pixels brighter than a soft threshold → fully opaque; near-black → transparent
THRESHOLD = 25.0
alpha = np.clip(lum * (255.0 / THRESHOLD), 0, 255).astype(np.uint8)

out = data.astype(np.uint8).copy()
out[:, :, 3] = alpha

result = Image.fromarray(out, "RGBA")
result.save(WEB / "logo-wordmark-transparent.png", optimize=True)
print(f"✓ logo-wordmark-transparent.png  ({result.size[0]}×{result.size[1]})")


# ── 2. MARK (circle seal): wordmark circle on cream background ───────────────
# Strategy: flood-fill from all 4 corners to find cream background region,
#           then set those pixels to alpha=0.

src_mark = WEB / "mark.png"
mark = Image.open(src_mark).convert("RGBA")
mark_data = np.array(mark)

# Cream colour is approximately rgb(240,244,235) = #F0F4EB
# Use corner samples to determine background colour
corners = [
    mark_data[0, 0, :3],
    mark_data[0, -1, :3],
    mark_data[-1, 0, :3],
    mark_data[-1, -1, :3],
]
bg_colour = np.mean(corners, axis=0)  # average of 4 corners
print(f"  mark.png background colour (approx): rgb({bg_colour[0]:.0f},{bg_colour[1]:.0f},{bg_colour[2]:.0f})")

# Simple colour-range removal: pixels within tolerance of background → transparent
TOLERANCE = 22  # how close to bg colour counts as background
r2, g2, b2 = mark_data[:,:,0], mark_data[:,:,1], mark_data[:,:,2]
dist = (
    (r2.astype(int) - int(bg_colour[0])) ** 2 +
    (g2.astype(int) - int(bg_colour[1])) ** 2 +
    (b2.astype(int) - int(bg_colour[2])) ** 2
) ** 0.5
is_bg = dist < TOLERANCE

mark_out = mark_data.copy()
mark_out[is_bg, 3] = 0  # make background pixels fully transparent

mark_result = Image.fromarray(mark_out, "RGBA")
mark_result.save(WEB / "mark-transparent.png", optimize=True)
print(f"✓ mark-transparent.png  ({mark_result.size[0]}×{mark_result.size[1]})")


# ── 3. AVATAR mark: M on green square (keep green – it IS the brand colour) ──
avatar_src = SRC / "mark_only_avatar.png"
if avatar_src.exists():
    import shutil
    shutil.copy(avatar_src, WEB / "mark-avatar.png")
    print(f"✓ mark-avatar.png  (copied from logo_final_A)")

print("\nDone. Updated assets in public/brand/")
