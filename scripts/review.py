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

FEATURED_SCENES = {
    "marseille-landing": 1,
    "paris-1885-studio": 1,
    "paris-1889-tower": 2,
    "paris-1889-indios-bravos": 1,
    "biarritz-manuscript": 2,
}


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


def dismiss_chapter_if_open(page):
    chap = page.locator(".k-chapter")
    if chap.count() > 0 and chap.first.is_visible():
        page.keyboard.press("Space")
        page.wait_for_timeout(350)


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
        page.wait_for_selector(".brochure-view.is-fallback .b-brochure[data-route-ready='true']", timeout=10000)
        page.wait_for_timeout(750)
        fallback_overflow = page.evaluate("window.__rizal.overflowingPanels()")
        print(f"[{label}] fallback overflow={fallback_overflow}")
        assert not fallback_overflow, f"Fallback brochure panels overflowed: {fallback_overflow}"
        fallback_routes = page.evaluate("[2,3,4,5,6].filter(n => !document.querySelector(`.b-panel--${n} > .b-route svg path`))")
        assert not fallback_routes, f"Fallback missing route lines on panels: {fallback_routes}"
        page.locator(".b-sheet--a").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / f"{label}-brochure-fallback.png"))
        page.locator(".b-sheet--b").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / f"{label}-brochure-fallback-side-b.png"))
        page.click(".brochure-actions .k-btn:not(.k-btn--primary)")
        page.wait_for_timeout(300)

        # Start riding: chapter card opens immediately with spelled-out chapter and goal.
        page.click(".intro-start")
        page.wait_for_selector(".k-chapter:not([hidden])", timeout=15000)
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / f"{label}-chapter-card.png"))
        dismiss_chapter_if_open(page)
        page.wait_for_timeout(500)
        page.screenshot(path=str(OUT / f"{label}-riding.png"))

        # Test finale with no stops visited at both desktop and mobile sizes.
        page.evaluate("window.__rizal.openFinale(true)")
        page.wait_for_selector(".brochure-view.is-finale .b-brochure[data-route-ready='true']", timeout=15000)
        page.wait_for_timeout(850)
        finale_none_overflow = page.evaluate("window.__rizal.overflowingPanels()")
        print(f"[{label}] finale-none overflow={finale_none_overflow}")
        assert not finale_none_overflow, f"Finale (none visited) panels overflowed: {finale_none_overflow}"
        page.locator(".b-sheet--a").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / f"{label}-finale-none-side-a.png"))
        page.locator(".b-sheet--b").scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / f"{label}-finale-none-side-b.png"))
        page.click(".brochure-actions .k-btn:not(.k-btn--primary)")
        page.wait_for_timeout(350)

        # Test station locking before reading other stops.
        page.evaluate("window.__rizal.openStop('marseille-station')")
        page.wait_for_timeout(700)
        disabled = page.locator(".card-action").is_disabled()
        btn_text = page.locator(".card-action").inner_text()
        print(f"[{label}] station before others: disabled={disabled} label={btn_text!r}")
        page.evaluate("window.__rizal.closeCard()")
        page.wait_for_timeout(500)

        # Visit every area and play every stop scene so real snapshots and scene frames are captured.
        for area_slug, dest, stop_ids in AREAS:
            page.evaluate("(d) => window.__rizal.loadArea(d)", dest)
            page.wait_for_timeout(1200)
            stats = page.evaluate("window.__rizal.renderStats()")
            print(
                f"[{label}] {area_slug}: calls={stats['calls']} staticCalls={stats['staticCalls']} triangles={stats['triangles']}"
            )
            page.screenshot(path=str(OUT / f"{label}-{area_slug}-overview.png"))

            for stop_id in stop_ids:
                page.evaluate("(id) => window.__rizal.playScene(id)", stop_id)
                page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
                page.wait_for_timeout(500)

                advances = FEATURED_SCENES.get(stop_id, 0)
                for _ in range(advances):
                    if page.locator(".scene-caption-band:not([hidden])").count() > 0:
                        page.keyboard.press("Space")
                        page.wait_for_timeout(450)

                if stop_id == "marseille-landing":
                    page.screenshot(path=str(OUT / f"{label}-scene-caption.png"))

                if stop_id in FEATURED_SCENES and stop_id != "paris-1889-tower":
                    page.wait_for_timeout(500)
                    page.screenshot(path=str(OUT / f"{label}-scene-{stop_id}.png"))

                # Skip to scene end frame to capture end buttons and snapshot.
                if page.locator(".scene-actions:not([hidden])").count() == 0:
                    page.keyboard.press("Escape")
                    page.wait_for_selector(".scene-actions:not([hidden])", timeout=8000)
                page.wait_for_timeout(400)

                if stop_id == "paris-1889-tower":
                    page.screenshot(path=str(OUT / f"{label}-scene-{stop_id}.png"))

                if stop_id == "marseille-landing":
                    page.screenshot(path=str(OUT / f"{label}-scene-end.png"))
                    # Open Story card from "Read more".
                    page.click(".scene-actions .k-btn:not(.k-btn--primary)")
                    page.wait_for_selector(".k-story:not([hidden])", timeout=5000)
                    page.wait_for_timeout(400)
                    page.screenshot(path=str(OUT / f"{label}-story-card.png"))
                    page.locator(".k-story").get_by_role("button", name="Close").click()
                    page.wait_for_selector(".scene-actions:not([hidden])", timeout=5000)
                    page.wait_for_timeout(300)

                if stop_id == "marseille-station":
                    unlocked = not page.locator(".scene-actions .k-btn--primary").is_disabled()
                    print(f"[{label}] marseille-station unlocked={unlocked}")
                    page.click(".scene-actions .k-btn--primary")
                    page.wait_for_selector(".travel", timeout=8000)
                    page.wait_for_timeout(450)
                    page.screenshot(path=str(OUT / f"{label}-travel.png"))
                    page.click(".travel-skip")
                    page.wait_for_function("window.__rizal.area?.id === 'paris-1883'", timeout=10000)
                    dismiss_chapter_if_open(page)
                elif stop_id == "paris-1885-station":
                    unlocked = not page.locator(".scene-actions .k-btn--primary").is_disabled()
                    print(f"[{label}] paris-1885-station unlocked={unlocked}")
                    page.click(".scene-actions .k-btn--primary")
                    page.wait_for_selector(".timelapse-hud", timeout=8000)
                    page.wait_for_timeout(2000)
                    page.screenshot(path=str(OUT / f"{label}-timelapse.png"))
                    page.click(".timelapse-skip")
                    page.wait_for_function("window.__rizal.area?.id === 'paris-1889'", timeout=10000)
                    dismiss_chapter_if_open(page)
                elif stop_id == "marseille-1891-lessons":
                    # Advance through finale action button.
                    page.click(".scene-actions .k-btn--primary")
                    page.wait_for_selector(".brochure-view.is-finale .b-brochure[data-route-ready='true']", timeout=15000)
                    page.wait_for_timeout(900)
                    finale_overflow = page.evaluate("window.__rizal.overflowingPanels()")
                    print(f"[{label}] finale overflow={finale_overflow}")
                    assert not finale_overflow, f"Finale brochure panels overflowed: {finale_overflow}"
                    finale_routes = page.evaluate("[2,3,4,5,6].filter(n => !document.querySelector(`.b-panel--${n} > .b-route svg path`))")
                    assert not finale_routes, f"Finale missing route lines on panels: {finale_routes}"
                    page.locator(".b-sheet--a").scroll_into_view_if_needed()
                    page.wait_for_timeout(300)
                    page.screenshot(path=str(OUT / f"{label}-finale-side-a.png"))
                    page.locator(".b-sheet--b").scroll_into_view_if_needed()
                    page.wait_for_timeout(300)
                    page.screenshot(path=str(OUT / f"{label}-finale-side-b.png"))

                    if label == "desk":
                        page.emulate_media(media="print")
                        page.wait_for_timeout(300)
                        page.locator(".b-sheet--a").screenshot(
                            path=str(OUT / f"{label}-print-page1.png")
                        )
                        page.locator(".b-sheet--b").screenshot(
                            path=str(OUT / f"{label}-print-page2.png")
                        )
                        page.pdf(
                            path=str(OUT / f"{label}-brochure-print.pdf"),
                            format="A4",
                            landscape=True,
                            print_background=True,
                        )
                        page.emulate_media(media="screen")
                elif stop_id.endswith("-station"):
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(450)
                else:
                    page.click(".scene-actions .k-btn--primary")
                    page.wait_for_timeout(450)

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
        dismiss_chapter_if_open(page)
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
