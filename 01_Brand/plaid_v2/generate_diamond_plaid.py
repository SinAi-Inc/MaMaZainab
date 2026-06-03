"""Generate MaMa Zainab gingham/tartan check pattern.

Reference: Mama Zainab's apron in brand guideline (page 20) - classic
gingham with equal-width green and yellow bands crossing at 90°.

True 4-zone gingham weave (2×2 cell repeat):
  ┌─────────┬─────────┐
  │ DARK    │ GREEN   │  ← H-band row
  │ (both)  │ (V only)│
  ├─────────┼─────────┤
  │ GREEN   │ YELLOW  │  ← gap row
  │ (H only)│ (neither│
  └─────────┴─────────┘

Colors:
  GREEN  = #1B9B00  (brand green)
  YELLOW = #EFD200  (brand yellow)
  DARK   = #196E00  (multiply blend - green × yellow / 255 ≈ rgb(25,128,0))

Variants:
  web       - cell 32px, tile 512px   → CSS at 256px = 16px visual cells
  packaging - cell 48px, tile 768px   → CSS at 384px = 24px visual cells
  apron     - cell 64px, tile 1024px  → large-format / print
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"d:\AI\MaMaZainab\01_Brand\plaid_v2")
OUT.mkdir(parents=True, exist_ok=True)

GREEN  = (27, 155, 0)    # #1B9B00
YELLOW = (239, 210, 0)   # #EFD200
# Multiply blend: each channel = (green × yellow) / 255
DARK   = (
    int(27  * 239 / 255),  # 25
    int(155 * 210 / 255),  # 128
    0,
)  # ≈ rgb(25, 128, 0) - dark forest green
WHITE  = (255, 255, 255)
INK    = (44, 41, 42)     # #2C292A


def make_gingham(tile_size: int, cell: int) -> Image.Image:
    """
    Seamless gingham tile.

    Args:
        tile_size: Output square dimension in pixels (must be divisible by cell*2)
        cell:      Size of each sub-cell in pixels (half of one full check)

    Returns:
        RGB PIL image, seamlessly tileable.
    """
    period = cell * 2
    assert tile_size % period == 0, f"tile_size {tile_size} must be divisible by period {period}"

    img = Image.new("RGB", (tile_size, tile_size), YELLOW)
    draw = ImageDraw.Draw(img)

    for oy in range(0, tile_size, period):
        for ox in range(0, tile_size, period):
            # Top-left quadrant: H-band ∩ V-band → DARK (multiply)
            draw.rectangle([ox, oy, ox + cell - 1, oy + cell - 1], fill=DARK)
            # Top-right quadrant: gap ∩ V-band → GREEN
            draw.rectangle([ox + cell, oy, ox + period - 1, oy + cell - 1], fill=GREEN)
            # Bottom-left quadrant: H-band ∩ gap → GREEN
            draw.rectangle([ox, oy + cell, ox + cell - 1, oy + period - 1], fill=GREEN)
            # Bottom-right quadrant: gap ∩ gap → YELLOW (already bg, skip)

    return img


VARIANTS = {
    # name: (tile_size, cell)
    "web":       (512,  32),   # fine - web/UI hero textures
    "packaging": (768,  48),   # medium - boxes, bags, sleeves
    "apron":     (1024, 64),   # bold - apron, awning, large print
}


def main():
    for name, (tile_size, cell) in VARIANTS.items():
        tile = make_gingham(tile_size, cell)
        out_path = OUT / f"tile_gingham_{name}.png"
        tile.save(out_path, optimize=True)
        print(f"✓ {name}: {tile_size}px tile, {cell}px cell → {out_path.name}")

    print("\nDone. Copy tile_gingham_packaging.png to public/brand/plaid.png for web use.")


if __name__ == "__main__":
    main()
