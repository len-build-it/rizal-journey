"""Verifies Handoff 8 menu, pause, leaving early, checklist, desk states, and captures proofs.

Usage: python -I scripts/capture-handoff8.py <url> <out_dir>
"""
import os
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1]
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)


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


def run_desktop(browser):
    ctx = browser.new_context(viewport={"width": 1280, "height": 800}, device_scale_factor=1)
    page = ctx.new_page()
    logs = []
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))

    page.goto(URL)
    page.wait_for_selector(".intro-start", timeout=30000)
    assert page.locator(".hud-menu-btn").is_hidden(), "Menu button must be hidden on desk"
    assert page.locator(".intro-start").inner_text() == "Open the brochure"
    assert page.locator(".intro-secondary").count() == 0

    # Start riding.
    page.click(".intro-start")
    page.wait_for_selector(".k-chapter:not([hidden])", timeout=15000)
    dismiss_chapter_if_open(page)
    page.wait_for_timeout(1250)

    assert page.locator(".hud-menu-btn").is_visible(), "Menu button must be visible while riding"
    assert not page.locator(".hud-checklist__list").is_hidden(), "Checklist defaults expanded on desktop"

    stats_before = page.evaluate("() => window.__rizal.renderStats()")
    print(f"[desktop] marseille-1882 draw calls={stats_before['calls']} staticCalls={stats_before['staticCalls']}")

    # Play marseille-landing, then leave early in 2 clicks (Escape -> Leave this scene).
    page.evaluate("() => window.__rizal.playScene('marseille-landing')")
    page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
    page.wait_for_timeout(500)

    # Open menu during scene via Escape (and verify dialog role + pause).
    page.keyboard.press("Escape")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.wait_for_timeout(280)
    assert page.locator(".hud-menu-btn").is_hidden(), "Menu button hidden while menu is open"
    assert page.locator(".menu-card").get_attribute("role") == "dialog"
    assert page.locator(".menu-card").get_attribute("aria-modal") == "true"
    page.screenshot(path=str(OUT / "4b-menu-scene.png"))

    # Verify nothing advances while paused in scene.
    t1 = page.evaluate("() => window.__rizal.director.isPlaying && document.querySelector('.scene-caption-text')?.textContent")
    page.wait_for_timeout(600)
    t2 = page.evaluate("() => window.__rizal.director.isPlaying && document.querySelector('.scene-caption-text')?.textContent")
    assert t1 == t2, "Scene captions must not advance while paused"

    # Leave this scene.
    page.get_by_role("button", name="Leave this scene").click()
    page.wait_for_timeout(450)
    assert not page.evaluate("() => window.__rizal.director.isPlaying")
    assert page.locator(".hud-prompt-label").inner_text() == "Watch: First steps on French soil"
    assert page.locator(".k-stamps__count").inner_text() == "1 of 6"
    page.screenshot(path=str(OUT / "6-watch-prompt-after-leave.png"))

    # Press E / click Watch prompt to replay and finish via Menu -> Skip to the end.
    page.click(".hud-prompt")
    page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
    page.wait_for_timeout(400)
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.get_by_role("button", name="Skip to the end").click()
    page.wait_for_selector(".scene-actions:not([hidden])", timeout=8000)
    page.wait_for_timeout(400)
    assert page.locator(".k-stamps__count").inner_text() == "2 of 6"

    # Continue riding from scene end frame.
    page.click(".scene-actions .k-btn--primary")
    page.wait_for_timeout(500)

    # Teleport back toward center so we see riding + expanded checklist (1 of 3, station locked).
    page.evaluate("""() => {
      const p = window.__rizal.player;
      p.teleport(window.__rizal.area.spawn, window.__rizal.area.spawnHeading);
      window.__rizal.cam.snap(p.position);
    }""")
    page.wait_for_timeout(450)
    assert page.locator(".hud-checklist__count").inner_text() == "1 of 3"
    rows = page.locator(".hud-checklist__row")
    assert rows.nth(0).get_attribute("aria-label") == "First steps on French soil, visited"
    assert rows.nth(1).get_attribute("aria-label") == "The fortress in the bay, not visited"
    assert rows.nth(2).get_attribute("aria-label") == "The train to Spain, locked, after the others"
    page.screenshot(path=str(OUT / "1-riding-checklist-expanded.png"))
    page.locator(".hud-checklist").screenshot(path=str(OUT / "2a-checklist-station-locked.png"))

    # Collapse checklist via C key, verify persistence on reload, then expand again.
    page.keyboard.press("KeyC")
    page.wait_for_timeout(200)
    assert page.locator(".hud-checklist__list").is_hidden()
    page.screenshot(path=str(OUT / "3-checklist-collapsed.png"))

    page.reload()
    page.wait_for_selector(".intro-start", timeout=30000)
    assert page.locator(".intro-start").inner_text() == "Continue your ride"
    assert page.locator(".intro-secondary").inner_text() == "Start over"
    page.wait_for_timeout(900)
    page.screenshot(path=str(OUT / "7a-desk-continue.png"))

    # Check Start over confirmation dialog and Keep my ride.
    page.click(".intro-secondary")
    page.wait_for_selector(".intro-confirm-overlay.is-open", timeout=5000)
    page.wait_for_timeout(200)
    page.screenshot(path=str(OUT / "7b-desk-start-over-confirm.png"))
    page.get_by_role("button", name="Keep my ride").click()
    page.wait_for_timeout(200)

    # Continue your ride -> collapsed checklist survived reload!
    page.click(".intro-start")
    page.wait_for_selector(".k-chapter:not([hidden])", timeout=15000)
    dismiss_chapter_if_open(page)
    page.wait_for_timeout(500)
    assert page.locator(".hud-checklist__list").is_hidden(), "Collapsed checklist must survive reload"
    # Expand via header click.
    page.click(".hud-checklist__header")
    page.wait_for_timeout(200)
    assert not page.locator(".hud-checklist__list").is_hidden()

    # Open Menu while riding -> screenshot, Controls panel, Places overview, Your brochure so far.
    page.keyboard.press("Escape")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "4a-menu-riding.png"))

    # Check Tab focus trap inside menu.
    for _ in range(10):
        page.keyboard.press("Tab")
        inside = page.evaluate("() => document.querySelector('.menu-card').contains(document.activeElement)")
        assert inside, "Focus escaped menu dialog during Tab"

    page.get_by_role("button", name="Controls").click()
    page.wait_for_timeout(200)
    page.screenshot(path=str(OUT / "5a-menu-controls.png"))

    page.locator(".menu-card").get_by_role("button", name="Places", exact=True).click()
    page.wait_for_timeout(200)
    page.screenshot(path=str(OUT / "5b-menu-places.png"))
    page.get_by_role("button", name="Back").click()
    page.wait_for_timeout(150)

    page.get_by_role("button", name="Your brochure so far").click()
    page.wait_for_selector(".brochure-view .b-brochure[data-route-ready='true']", timeout=10000)
    page.wait_for_timeout(750)
    assert page.locator(".brochure-title").inner_text() == "Your brochure so far"
    assert page.locator(".brochure-actions .k-btn:not(.k-btn--primary)").inner_text() == "Back to riding"
    assert not page.evaluate("() => window.__rizal.overflowingPanels()").__len__()
    page.screenshot(path=str(OUT / "8-brochure-so-far.png"))
    page.get_by_role("button", name="Back to riding").click()
    page.wait_for_timeout(300)
    assert page.locator(".menu-overlay").is_hidden()
    assert page.locator(".hud-menu-btn").is_visible()

    # Check clicking an unvisited checklist row targets that stop, then unlock station.
    page.locator(".hud-checklist__row").nth(1).click()
    page.wait_for_timeout(150)
    assert page.locator(".hud-checklist__row").nth(1).get_attribute("aria-current") == "location"

    # Complete second Marseille stop so station unlocks.
    page.evaluate("() => window.__rizal.playScene('marseille-chateau-dif')")
    page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
    page.wait_for_timeout(300)
    page.keyboard.press("Escape")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.get_by_role("button", name="Skip to the end").click()
    page.wait_for_selector(".scene-actions:not([hidden])", timeout=8000)
    page.click(".scene-actions .k-btn--primary")
    page.wait_for_timeout(400)
    assert page.locator(".hud-checklist__count").inner_text() == "2 of 3"
    assert page.locator(".hud-checklist__row").nth(2).get_attribute("aria-label") == "The train to Spain, not visited"
    page.locator(".hud-checklist").screenshot(path=str(OUT / "2b-checklist-station-unlocked.png"))

    # Trigger station travel spread and open Menu during travel spread.
    page.evaluate("() => window.__rizal.playScene('marseille-station')")
    page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
    page.wait_for_timeout(300)
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.get_by_role("button", name="Skip to the end").click()
    page.wait_for_selector(".scene-actions:not([hidden])", timeout=8000)
    page.click(".scene-actions .k-btn--primary")
    page.wait_for_selector(".travel", timeout=8000)
    page.wait_for_timeout(500)
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "4c-menu-travel.png"))
    page.get_by_role("button", name="Skip the journey").click()
    page.wait_for_function("() => window.__rizal.area?.id === 'paris-1883'", timeout=10000)
    page.wait_for_selector(".k-chapter:not([hidden])", timeout=10000)
    dismiss_chapter_if_open(page)
    page.wait_for_timeout(400)

    # Test Back to the desk -> Start over clears saved progress.
    page.keyboard.press("Escape")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.get_by_role("button", name="Back to the desk").click()
    page.wait_for_selector(".intro-start", timeout=15000)
    assert page.locator(".intro-start").inner_text() == "Continue your ride"
    page.click(".intro-secondary")
    page.wait_for_selector(".intro-confirm-overlay.is-open", timeout=5000)
    page.locator(".intro-confirm .k-btn--primary").click()
    page.wait_for_selector(".k-chapter:not([hidden])", timeout=15000)
    dismiss_chapter_if_open(page)
    page.wait_for_timeout(400)
    assert page.locator(".hud-checklist__count").inner_text() == "0 of 3"
    assert page.locator(".k-stamps__count").inner_text() == "1 of 6"

    assert not logs, f"Desktop console/page errors: {logs}"
    ctx.close()
    print("[desktop] ALL CHECKS PASSED")


def run_mobile(browser):
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
    )
    page = ctx.new_page()
    logs = []
    page.on("console", lambda m: logs.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    page.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))

    page.goto(URL)
    page.wait_for_selector(".intro-start", timeout=30000)
    page.click(".intro-start")
    page.wait_for_selector(".k-chapter:not([hidden])", timeout=15000)
    dismiss_chapter_if_open(page)
    page.wait_for_timeout(500)

    # Default collapsed on <= 640px.
    assert page.locator(".hud-checklist__list").is_hidden(), "Checklist defaults collapsed on mobile"

    # Visit first stop so checklist shows 1 of 3, then expand it for Item 1 at 390x844.
    page.evaluate("() => window.__rizal.playScene('marseille-landing')")
    page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
    page.wait_for_timeout(400)
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "9-mob-4b-menu-scene.png"))
    page.get_by_role("button", name="Skip to the end").click()
    page.wait_for_selector(".scene-actions:not([hidden])", timeout=8000)
    page.click(".scene-actions .k-btn--primary")
    page.wait_for_timeout(400)

    page.evaluate("""() => {
      const p = window.__rizal.player;
      p.teleport(window.__rizal.area.spawn, window.__rizal.area.spawnHeading);
      window.__rizal.cam.snap(p.position);
    }""")
    page.wait_for_timeout(400)
    page.click(".hud-checklist__header")
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "9-mob-1-riding.png"))

    # Item 4 (menu while riding & during travel) at 390x844.
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "9-mob-4a-menu-riding.png"))
    page.get_by_role("button", name="Resume").click()
    page.wait_for_timeout(250)

    # Unlock station & open menu during travel at 390x844.
    page.evaluate("() => window.__rizal.playScene('marseille-chateau-dif')")
    page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.get_by_role("button", name="Skip to the end").click()
    page.wait_for_selector(".scene-actions:not([hidden])", timeout=8000)
    page.click(".scene-actions .k-btn--primary")
    page.wait_for_timeout(300)

    page.evaluate("() => window.__rizal.playScene('marseille-station')")
    page.wait_for_selector(".scene-caption-band:not([hidden])", timeout=8000)
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.get_by_role("button", name="Skip to the end").click()
    page.wait_for_selector(".scene-actions:not([hidden])", timeout=8000)
    page.click(".scene-actions .k-btn--primary")
    page.wait_for_selector(".travel", timeout=8000)
    page.wait_for_timeout(500)
    page.click(".hud-menu-btn")
    page.wait_for_selector(".menu-overlay:not([hidden])", timeout=5000)
    page.wait_for_timeout(250)
    page.screenshot(path=str(OUT / "9-mob-4c-menu-travel.png"))

    # Back to desk (item 7) at 390x844.
    page.get_by_role("button", name="Back to the desk").click()
    page.wait_for_selector(".intro-start", timeout=15000)
    page.wait_for_timeout(900)
    page.screenshot(path=str(OUT / "9-mob-7a-desk-continue.png"))
    page.click(".intro-secondary")
    page.wait_for_selector(".intro-confirm-overlay.is-open", timeout=5000)
    page.wait_for_timeout(200)
    page.screenshot(path=str(OUT / "9-mob-7b-desk-confirm.png"))

    assert not logs, f"Mobile console/page errors: {logs}"
    ctx.close()
    print("[mobile] ALL CHECKS PASSED")


def main():
    with sync_playwright() as p:
        browser = launch_browser(p)
        run_desktop(browser)
        run_mobile(browser)
        browser.close()


if __name__ == "__main__":
    main()
