"""Convert raw Bip 6 screenshots into Zepp store preview images.

Zepp rules for rectangular-screen devices: 360x360 PNG, transparent background,
the screen image centred with equal left/right margins and no top/bottom margin.

Usage: python scripts/make_previews.py <out_dir> <shot1.png> <shot2.png> ...
Outputs <out_dir>/square1.png, square2.png, ... in the order given.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

SIZE = 360
CORNER_RADIUS = 58  # Bip 6 screen corner (73px at native 390x450); outside is transparent


def convert(src: Path, dst: Path) -> None:
    shot = Image.open(src).convert("RGBA")
    w, h = shot.size
    if w >= h:
        sys.exit(f"{src}: {w}x{h} is not portrait — not a Bip 6 (390x450) screenshot")
    new_w = round(w * SIZE / h)
    shot = shot.resize((new_w, SIZE), Image.LANCZOS)

    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, new_w - 1, SIZE - 1), CORNER_RADIUS, fill=255)
    shot.putalpha(Image.composite(shot.getchannel("A"), mask, mask))

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(shot, ((SIZE - new_w) // 2, 0), shot)
    canvas.save(dst, "PNG")
    print(f"{src} ({w}x{h}) -> {dst} (screen {new_w}x{SIZE}, margins {(SIZE - new_w) // 2}px)")


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(sys.argv[2:], 1):
        convert(Path(src), out / f"square{i}.png")


if __name__ == "__main__":
    main()
