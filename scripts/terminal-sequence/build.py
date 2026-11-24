#!/usr/bin/env python3
"""
Vygeneruje sekvenciu snímok terminálu (priehľadné WebP) z 360° videa.

Použitie:
    python3 scripts/terminal-sequence/build.py VIDEO.mp4 public/images/terminal-seq

Požiadavky: ffmpeg, python3 s numpy, opencv-python-headless, pillow.
Video: terminál na čisto bielom pozadí (255,255,255), pevná kamera, plné otočenie.

Poradie snímok je dané FRAME_PLAN: snímky videa (číslované od 1) v poradí, v akom sa
majú prehrávať pri scrolle (čelný pohľad → finálny uhol).
"""
import json, subprocess, sys, tempfile
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from matte import matte  # noqa: E402

# Čelný pohľad je okolo snímky 76, finálny uhol (rukoväť vpravo) je snímka 1 (= začiatok
# slučky). Video sa prehráva dozadu: 76 → 1.
FRAME_PLAN = list(range(76, 0, -1))
PAD = 4  # px okolo ohraničenia
WEBP_QUALITY = 82


def main(video: str, out_dir: str) -> None:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.webp"):
        old.unlink()

    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", video, f"{tmp}/f%03d.png"], check=True
        )
        rgba = []
        for n in FRAME_PLAN:
            rgb = np.array(Image.open(f"{tmp}/f{n:03d}.png").convert("RGB"))
            rgba.append(matte(rgb))

    # spoločný výrez (zjednotenie všetkých snímok), aby terminál neposkakoval
    ys, xs = [], []
    for m in rgba:
        yy, xx = np.where(m[..., 3] > 8)
        ys += [yy.min(), yy.max()]
        xs += [xx.min(), xx.max()]
    h, w = rgba[0].shape[:2]
    x0, x1 = max(min(xs) - PAD, 0), min(max(xs) + PAD + 1, w)
    y0, y1 = max(min(ys) - PAD, 0), min(max(ys) + PAD + 1, h)

    total = 0
    for i, m in enumerate(rgba):
        path = out / f"{i:03d}.webp"
        Image.fromarray(m[y0:y1, x0:x1]).save(
            path, "WEBP", quality=WEBP_QUALITY, alpha_quality=90, method=6
        )
        total += path.stat().st_size

    meta = {"frames": len(rgba), "width": int(x1 - x0), "height": int(y1 - y0)}
    (out / "meta.json").write_text(json.dumps(meta) + "\n")
    print(meta, f"{total / 1024:.0f} KB spolu, {total / len(rgba) / 1024:.1f} KB/snímka")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
