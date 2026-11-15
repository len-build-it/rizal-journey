# Notes From Agent

Summary of implementation choices, environment workarounds, and observations from building the remaining areas, systems, finale brochure, and verification suite for "Through Rizal's Eyes: France, 1882 to 1891".

## Visual & Spatial Choices

- **Fixed isometric-style camera sightlines in Paris (`src/world/areas/paris.ts`)**: `FollowCamera` looks from `(+X, +Y, -Z)` down toward `(-X, +Z)` (`yaw = Math.PI * 0.6`). Key Paris landmarks on Rue de Maubeuge (Hotel de Paris), Rue du Cherche-Midi (Dr. de Wecker's clinic), and Rue des Saints-Peres (Garnier bookshop and Juan Luna's studio) are placed along the south (`+Z`) side of their streets with `ry = Math.PI` (or north-facing studio glass along `-Z`) so the camera has an unobstructed view of each facade, entrance, brass plaque, and Luna's top-floor easels without intervening roofs blocking the sightline.
- **Basque villa & Biarritz coast (`src/world/areas/biarritz1891.ts`)**: Villa Eliada's appearance is not visually documented in the project sources, so a generic whitewashed Basque winter villa with red shutters, timber trim, red tile roof, and garden gate stands in on the upper plateau, with windows on the camera-facing sides as well as the gate side. The curving stone promenade sits above (`y = 0.4`) a recessed grass under-slab (`y = 0.35`) so green terrain never pokes past the seawall onto the sand or Z-fights with stone segments, and the painted fishing boat sits atop the beach sand (`yOffset = 1.1`).
- **Eiffel Tower construction (`src/world/tower.ts`)**: Built as procedurally pooled `InstancedMesh` girder beams and rivet crossbars painted in 1889 Venetian red (`#8d372a`), keyed continuously from `0` (four masonry pier shoes in January 1887) through `0.05` (July 1887 four rising iron legs), `0.30` (first platform), `0.55` (second platform), to `1.00` (March 1889 completed 3rd platform, gallery, lantern, and flag). On mobile portrait (`390x844`) the story card focuses the full tower at `focusZoom = 2.8`; most of the tower and Seine bridge frame cleanly above the bottom sheet while the topmost spire reaches near the upper edge pill.

## Systems & Browser Verification

- **Performance budget (`src/main.ts`, `scripts/review.py`)**: All six eras stay well under the 60 static draw-call target and 150k triangle target in production builds verified via SwiftShader headless Edge (`staticCalls`: 45 in Marseille 1882/1891, 34 in Paris 1883/1885, 36 in Paris 1889, 25 in Biarritz 1891; triangles 16,118 to 54,870).
- **Brochure print fallback (`src/ui/BrochureView.ts`)**: When the page detects it is embedded in an iframe (`window.self !== window.top`) or `window.print` throws / is blocked, clicking Print brochure displays an inline notice advising the user to open the standalone tab or save via browser Print (`Ctrl+P` / `Cmd+P`), in case browser embed sandboxing blocks print dialogs.
- **Headless browser runner on Windows (`scripts/review.py`)**: `launch_browser` searches standard Chrome/Edge install paths (`msedge.exe` on Windows when `/usr/bin/google-chrome` is absent) with ANGLE SwiftShader enabled.

## Verification Status

- `npm run typecheck`, `npm run lint`, `npm test` (7/7 tests), and `npm run build` pass cleanly.
- `scripts/review.py` ran across all 6 areas, 19 stops, title brochure fallback, station locking/unlocking, train interlude, Eiffel Tower time-lapse, and finale brochure on both desktop (`1280x800`) and mobile (`390x844`) with zero console 404 or page errors.
