"""Captures Handoff 7 arrival, blurred-arrival, signboard/wave, and set-piece proofs,
and checks per-area draw calls against the post-4.1 baseline.

Usage: python -I scripts/capture-handoff7.py <url> <out_dir>
"""
import io
import os
import sys
from pathlib import Path
from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

URL = sys.argv[1]
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

BASELINE_CALLS = {
    "marseille-1882": 141,
    "paris-1883": 146,
    "paris-1885": 136,
    "paris-1889": 150,
    "biarritz-1891": 136,
    "marseille-1891": 136,
}

AREAS = [
    ("marseille-1882", {"area": "marseille-1882"}),
    ("paris-1883", {"area": "paris", "era": "1883"}),
    ("paris-1885", {"area": "paris", "era": "1885"}),
    ("paris-1889", {"area": "paris", "era": "1889"}),
    ("biarritz-1891", {"area": "biarritz-1891"}),
    ("marseille-1891", {"area": "marseille-1891"}),
]

SETPIECES = [
    ("marseille-landing", {"area": "marseille-1882"}, (3.5, 4.8, 1.5), (11.2, 3.2, 13.0)),
    ("marseille-chateau-dif", {"area": "marseille-1882"}, (-23.0, 2.4, 2.5), (-25.8, 1.5, 7.2)),
    ("marseille-station", {"area": "marseille-1882"}, (10.0, 4.2, -37.0), (10.0, 3.4, -46.0)),
    ("marseille-1891-melbourne", {"area": "marseille-1891"}, (3.5, 4.8, 1.5), (11.2, 3.2, 13.0)),
    ("paris-1883-hotel", {"area": "paris", "era": "1883"}, (25.5, 3.6, -24.5), (20.2, 3.0, -18.5)),
    ("paris-1883-hospital", {"area": "paris", "era": "1883"}, (45.0, 4.0, -4.0), (35.0, 3.2, -4.0)),
    ("paris-1885-clinic", {"area": "paris", "era": "1885"}, (18.7, 3.6, 5.5), (18.7, 3.2, 14.5)),
    ("paris-1885-studio", {"area": "paris", "era": "1885"}, (34.5, 2.5, 26.5), (34.6, 2.0, 36.2)),
    ("paris-1889-tower", {"area": "paris", "era": "1889"}, (-14.0, 4.5, 8.5), (-25.0, 3.5, 2.5)),
    ("paris-1889-indios-bravos", {"area": "paris", "era": "1889"}, (-11.0, 4.5, 42.5), (-21.5, 3.5, 42.5)),
    ("paris-1889-godfather", {"area": "paris", "era": "1889"}, (36.0, 3.6, 25.0), (36.0, 2.5, 34.5)),
    ("paris-1889-morga", {"area": "paris", "era": "1889"}, (18.5, 3.4, 25.5), (18.5, 2.6, 34.3)),
    ("paris-1889-station", {"area": "paris", "era": "1889"}, (3.5, 5.2, -52.0), (-4.5, 4.4, -52.0)),
    ("biarritz-villa", {"area": "biarritz-1891"}, (-14.0, 5.4, -7.2), (-14.0, 4.6, -19.0)),
    ("biarritz-manuscript", {"area": "biarritz-1891"}, (-1.0, 4.6, -15.2), (-3.5, 3.6, -19.6)),
    ("biarritz-station", {"area": "biarritz-1891"}, (28.0, 6.2, -18.5), (28.0, 5.4, -28.0)),
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
        page.wait_for_timeout(450)

        print("DRAW CALLS (after vs baseline):")
        draw_ok = True
        for name, dest in AREAS:
            page.evaluate("(d) => window.__rizal.loadArea(d)", dest)
            page.wait_for_timeout(550)
            stats = page.evaluate("() => window.__rizal.renderStats()")
            before = BASELINE_CALLS[name]
            delta = stats["calls"] - before
            flag = "OK" if delta <= 15 else "OVER"
            if delta > 15:
                draw_ok = False
            print(
                f"  {name:16s} calls={stats['calls']:3d} (before={before}, delta={delta:+d} {flag}) "
                f"staticCalls={stats['staticCalls']} tris={stats['triangles']}"
            )
            page.screenshot(path=str(OUT / f"arrive-{name}.png"))
            page.evaluate("document.querySelector('.hud').style.display = 'none'")
            page.wait_for_timeout(120)
            raw = page.screenshot()
            page.evaluate("document.querySelector('.hud').style.display = ''")
            blur = Image.open(io.BytesIO(raw)).filter(ImageFilter.GaussianBlur(8))
            blur.save(OUT / f"arrive-{name}-blur.png")

        # Signboard + waving waiting figure close check near paris-1883-hotel (5.5m away).
        page.evaluate(
            """() => window.__rizal.loadArea({ area: 'paris', era: '1883' }).then(() => {
                const p = window.__rizal.player;
                p.position.set(16.0, 0, -25.0);
                p.teleport(p.position, 0.5);
                window.__rizal.cam.snap(p.position);
            })"""
        )
        page.wait_for_timeout(700)
        page.screenshot(path=str(OUT / "stop-signboard-wave.png"))
        print("Saved stop-signboard-wave.png")

        page.evaluate("document.querySelector('.hud').style.display = 'none'")
        current_area = None
        for sid, dest, pos, tgt in SETPIECES:
            if dest != current_area:
                page.evaluate("(d) => window.__rizal.loadArea(d)", dest)
                page.wait_for_timeout(450)
                current_area = dest
            page.evaluate(
                "([p, t]) => { window.__rizal.cam.focusPosition.set(t[0], t[1], t[2]); window.__rizal.lookAt(p[0], p[1], p[2], t[0], t[1], t[2]); }",
                [list(pos), list(tgt)],
            )
            page.wait_for_timeout(250)
            page.screenshot(path=str(OUT / f"setpiece-{sid}.png"))
            print(f"Saved setpiece-{sid}.png")

        page.evaluate("document.querySelector('.hud').style.display = ''")
        page.evaluate("window.__rizal.resetLook()")
        browser.close()
        if not draw_ok:
            sys.exit(2)


if __name__ == "__main__":
    main()
