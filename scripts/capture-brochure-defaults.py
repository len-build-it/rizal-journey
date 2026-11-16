"""Captures the default brochure snapshots by playing every scene in review mode.
Usage: npm run build && npx vite preview --port 4317, then
  python scripts/capture-brochure-defaults.py "http://localhost:4317/?review"
Writes src/ui/brochure/defaults/<story-id>.jpg. Station stories and the closing card are skipped: they have no picture in the brochure."""
import sys, json, base64
from pathlib import Path
from playwright.sync_api import sync_playwright
URL = sys.argv[1]
OUT = Path(__file__).resolve().parent.parent / "src/ui/brochure/defaults"
AREAS = [
 ("{area:'marseille-1882'}", ["marseille-landing","marseille-chateau-dif"]),
 ("{area:'paris', era:'1883'}", ["paris-1883-hotel","paris-1883-hospital"]),
 ("{area:'paris', era:'1885'}", ["paris-1885-clinic","paris-1885-studio"]),
 ("{area:'paris', era:'1889'}", ["paris-1889-tower","paris-1889-indios-bravos","paris-1889-godfather","paris-1889-morga"]),
 ("{area:'biarritz-1891'}", ["biarritz-villa","biarritz-manuscript"]),
 ("{area:'marseille-1891'}", ["marseille-1891-melbourne"]),
]
OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    page = b.new_page(viewport={"width":1280,"height":800})
    page.goto(URL); page.wait_for_selector(".intro-start", timeout=60000); page.wait_for_timeout(1500)
    page.click(".intro-start"); page.wait_for_timeout(7000)
    for dest, ids in AREAS:
        page.evaluate(f"window.__rizal.loadArea({dest})"); page.wait_for_timeout(3500)
        page.keyboard.press("Escape"); page.wait_for_timeout(800)
        for sid in ids:
            page.evaluate(f"window.__rizal.playScene('{sid}')")
            ok=False
            for _ in range(40):
                page.wait_for_timeout(500)
                if page.evaluate(f"!!window.__rizal.snapshots['{sid}']"): ok=True; break
            print(sid, ok, flush=True)
            if ok:
                url = page.evaluate(f"window.__rizal.snapshots['{sid}']")
                (OUT/f"{sid}.jpg").write_bytes(base64.b64decode(url.split(',',1)[1]))
            page.wait_for_timeout(6000)
            page.keyboard.press("Escape"); page.wait_for_timeout(1000); page.keyboard.press("Escape"); page.wait_for_timeout(600)
    b.close()
