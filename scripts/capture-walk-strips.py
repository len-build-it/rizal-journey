"""Captures 8-frame walk strips (0.08s apart) for Section 3.6 proof.

Usage: python -I scripts/capture-walk-strips.py <url> <out_dir>
"""
import io
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

URL = sys.argv[1]
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

SUBJECTS = [
    ("man", (420, 110, 860, 690), (220, 290)),
    ("woman", (410, 100, 870, 690), (230, 295)),
    ("child", (420, 120, 860, 690), (220, 285)),
    ("dog", (380, 180, 900, 660), (260, 240)),
    ("horse", (280, 140, 1000, 670), (360, 265)),
]


def launch_browser(p):
    kwargs = {
        "args": ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    }
    candidates = [
        "/usr/bin/google-chrome",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for path in candidates:
        if os.path.exists(path):
            kwargs["executable_path"] = path
            break
    return p.chromium.launch(**kwargs)


def main():
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.goto(URL)
        page.wait_for_selector(".intro-start", timeout=30000)
        page.click(".intro-start")
        page.wait_for_selector(".k-chapter:not([hidden])", timeout=15000)
        page.keyboard.press("Space")
        page.wait_for_timeout(400)
        page.evaluate("window.__rizal.loadArea({ area: 'paris', era: '1883' })")
        page.wait_for_timeout(800)

        for who, crop_box, tile_size in SUBJECTS:
            tw, th = tile_size
            strip = Image.new("RGB", (tw * 8, th), (240, 234, 220))
            draw = ImageDraw.Draw(strip)
            for i in range(8):
                t = i * 0.08
                page.evaluate("([w, t]) => window.__rizal.walkStripPose(w, t)", [who, t])
                page.wait_for_timeout(140)
                raw = page.screenshot()
                im = Image.open(io.BytesIO(raw)).crop(crop_box).resize((tw, th), Image.Resampling.LANCZOS)
                strip.paste(im, (i * tw, 0))
                if i > 0:
                    draw.line([(i * tw, 0), (i * tw, th)], fill=(32, 50, 74), width=2)
                draw.text((i * tw + 8, 8), f"{t:.2f}s", fill=(32, 50, 74))
            out_path = OUT / f"walk-{who}.png"
            strip.save(out_path)
            print(f"Saved {out_path}")

        page.evaluate("window.__rizal.clearWalkStrip()")
        browser.close()


if __name__ == "__main__":
    main()
