"""Visual review: plays the built site in headless Chrome and saves screenshots.

Usage: python3 -I scripts/review.py <url> <out_dir> [scenario]
Scenarios drive the rider with held keys, then capture the frame.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1]
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

STEPS = [
    ("intro", []),
    ("start", [("click", ".intro-start"), ("wait", 900)]),
    ("walk-up", [("hold", "KeyW", 1800)]),
    ("gallop", [("down", "ShiftLeft"), ("hold", "KeyW", 1400), ("up", "ShiftLeft")]),
    ("turn-left", [("hold", "KeyA", 2500)]),
    ("back-to-quay", [("down", "ShiftLeft"), ("hold", "KeyS", 2600), ("up", "ShiftLeft"), ("wait", 600)]),
    ("at-stop", [("js", "window.__rizal.player.teleport({x: -27, y: 0, z: 8.2}, 1.2)"), ("wait", 1200)]),
    ("card", [("press", "KeyE"), ("wait", 2500)]),
    ("card-closed", [("press", "Escape"), ("wait", 1500)]),
]


def run(label, width, height, mobile):
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        )
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
        page.wait_for_timeout(1500)
        for name, actions in STEPS:
            for a in actions:
                kind = a[0]
                if kind == "click":
                    page.click(a[1])
                elif kind == "wait":
                    page.wait_for_timeout(a[1])
                elif kind == "down":
                    page.keyboard.down(a[1])
                elif kind == "up":
                    page.keyboard.up(a[1])
                elif kind == "js":
                    page.evaluate(a[1])
                elif kind == "press":
                    if mobile and a[1] == "KeyE":
                        page.click(".prompt")
                    else:
                        page.keyboard.press(a[1])
                elif kind == "hold":
                    page.keyboard.down(a[1])
                    page.wait_for_timeout(a[2])
                    page.keyboard.up(a[1])
            page.screenshot(path=str(OUT / f"{label}-{name}.png"))
        for line in logs:
            if "GPU stall" not in line:
                print(label, line)
        browser.close()


if len(sys.argv) <= 3 or sys.argv[3] != "close":
    run("desk", 1280, 800, False)
if len(sys.argv) > 3 and sys.argv[3] == "mobile":
    run("mob", 390, 844, True)


def closeup(url, out):
    """Frames the horse up close from a few angles to judge the model."""
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/google-chrome",
            args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        )
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
        page.keyboard.down("ShiftLeft")
        page.keyboard.down("KeyA")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(Path(out) / "close-gallop.png"))
        browser.close()


if len(sys.argv) > 3 and sys.argv[3] == "close":
    closeup(URL, OUT)
