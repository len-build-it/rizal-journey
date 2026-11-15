"""Visual review: plays the built site in headless Chrome and saves screenshots.

Usage: python -I scripts/review.py <url> <out_dir> [desktop|mobile|close]
"""
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1]
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
MODE = sys.argv[3] if len(sys.argv) > 3 else "desktop"

AREAS = [
    ("marseille-1882", {"area": "marseille-1882"}, [
        "marseille-landing",
        "marseille-chateau-dif",
        "marseille-station",
    ]),
    ("paris-1883", {"area": "paris", "era": "1883"}, [
        "paris-1883-hotel",
        "paris-1883-hospital",
        "paris-1883-station",
    ]),
    ("paris-1885", {"area": "paris", "era": "1885"}, [
        "paris-1885-clinic",
        "paris-1885-studio",
        "paris-1885-station",
    ]),
    ("paris-1889", {"area": "paris", "era": "1889"}, [
        "paris-1889-tower",
        "paris-1889-indios-bravos",
        "paris-1889-godfather",
        "paris-1889-morga",
        "paris-1889-station",
    ]),
    ("biarritz-1891", {"area": "biarritz-1891"}, [
        "biarritz-villa",
        "biarritz-manuscript",
        "biarritz-station",
    ]),
    ("marseille-1891", {"area": "marseille-1891"}, [
        "marseille-1891-melbourne",
        "marseille-1891-lessons",
    ]),
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


def run(label, width, height, mobile):
    with sync_playwright() as p:
        browser = launch_browser(p)
        ctx = browser.new_context(
            viewport={"width": width, "height": height},
            device_scale_factor=2 if mobile else 1,
            is_mobile=mobile,
            has_touch=mobile,
        )
        page = ctx.new_page()
        logs = []
        page.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
        page.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
        page.goto(URL)
        page.wait_for_selector(".intro-start", timeout=30000)
        page.wait_for_timeout(1200)
        page.screenshot(path=str(OUT / f"{label}-intro.png"))

        # Check "Read as a brochure" fallback from title screen.
        page.click(".intro-link")
        page.wait_for_selector(".brochure-view.is-fallback", timeout=5000)
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / f"{label}-brochure-fallback.png"))
        page.click(".brochure-actions .brochure-btn:not(.is-primary)")
        page.wait_for_timeout(300)

        # Start riding in Marseille 1882.
        page.click(".intro-start")
        page.wait_for_timeout(900)

        # Test station locking before reading other stops.
        page.evaluate("window.__rizal.openStop('marseille-station')")
        page.wait_for_timeout(700)
        disabled = page.locator(".card-action").is_disabled()
        btn_text = page.locator(".card-action").inner_text()
        print(f"[{label}] station before others: disabled={disabled} label={btn_text!r}")
        page.evaluate("window.__rizal.closeCard()")
        page.wait_for_timeout(500)

        # Visit every area and every stop.
        for area_slug, dest, stop_ids in AREAS:
            page.evaluate("(d) => window.__rizal.loadArea(d)", dest)
            page.wait_for_timeout(1200)
            stats = page.evaluate("window.__rizal.renderStats()")
            print(
                f"[{label}] {area_slug}: calls={stats['calls']} staticCalls={stats['staticCalls']} triangles={stats['triangles']}"
            )
            page.screenshot(path=str(OUT / f"{label}-{area_slug}-overview.png"))

            for stop_id in stop_ids:
                page.evaluate("(id) => window.__rizal.openStop(id)", stop_id)
                page.wait_for_timeout(1300)
                page.screenshot(path=str(OUT / f"{label}-{stop_id}.png"))
                if stop_id == "marseille-station":
                    unlocked = not page.locator(".card-action").is_disabled()
                    print(f"[{label}] marseille-station unlocked={unlocked}")
                    page.click(".card-action")
                    page.wait_for_selector(".travel", timeout=5000)
                    page.wait_for_timeout(450)
                    page.click(".travel-skip")
                    page.wait_for_function("window.__rizal.area?.id === 'paris-1883'", timeout=8000)
                elif stop_id == "paris-1885-station":
                    unlocked = not page.locator(".card-action").is_disabled()
                    print(f"[{label}] paris-1885-station unlocked={unlocked}")
                    page.click(".card-action")
                    page.wait_for_selector(".timelapse-hud", timeout=5000)
                    page.wait_for_timeout(2400)
                    page.screenshot(path=str(OUT / f"{label}-timelapse.png"))
                    page.click(".timelapse-skip")
                    page.wait_for_function("window.__rizal.area?.id === 'paris-1889'", timeout=8000)
                elif stop_id == "marseille-1891-lessons":
                    # Click finale action button to capture finished Z-fold brochure.
                    page.click(".card-action")
                    page.wait_for_selector(".brochure-view.is-finale", timeout=5000)
                    page.wait_for_timeout(500)
                    page.screenshot(path=str(OUT / f"{label}-finale.png"))
                    # Reopen one story inside the finale brochure.
                    page.click(".bp-story-btn")
                    page.wait_for_timeout(600)
                    page.screenshot(path=str(OUT / f"{label}-finale-card.png"))
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(400)
                else:
                    page.evaluate("window.__rizal.closeCard()")
                    page.wait_for_timeout(600)

        for line in logs:
            if "GPU stall" not in line:
                print(label, line)
        browser.close()


def closeup(url, out):
    """Frames the horse up close from a few angles to judge the model."""
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page(viewport={"width": 1000, "height": 700})
        page.goto(url)
        page.wait_for_selector(".intro-start", timeout=30000)
        page.click(".intro-start")
        page.wait_for_timeout(800)
        page.evaluate("window.__rizal.cam.zoom = 0.28")
        for i, heading in enumerate([0, 1.57, 3.14, -1.0]):
            page.evaluate(f"window.__rizal.player.heading = {heading}")
            page.wait_for_timeout(700)
            page.screenshot(path=str(Path(out) / f"close-{i}.png"))
        browser.close()


if MODE == "close":
    closeup(URL, OUT)
else:
    run("desk", 1280, 800, False)
    if MODE == "mobile":
        run("mob", 390, 844, True)
