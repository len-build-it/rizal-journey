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

## Polish Pass & Before/After Screenshots (`review/polish/`)

- `review/polish/1-before.png`, `review/polish/1-after.png`: Expanded Paris (`src/world/areas/paris.ts`) with continuous Haussmann streetwall blocks, Seine stone embankments and arch bridges, Trocadero colonnade/towers, distant Paris skyline silhouettes, street trees, and kiosks/columns.
- `review/polish/2-before.png`, `review/polish/2-after.png`: Tuned area atmosphere, sky/fog blends, and key/fill light warmth across Marseille, Paris, and Biarritz (`src/world/areas/*.ts`).
- `review/polish/3-before.png`, `review/polish/3-after.png`: Added the oval Wild West arena north-west of the Champ de Mars (`src/world/areas/paris.ts`, `paris-1889-indios-bravos`) with tiered grandstands, pennants, entrance arch, and 4 riderless horses.
- `review/polish/4-before.png`, `review/polish/4-after.png`: Rebuilt Biarritz (`src/world/areas/biarritz1891.ts`) with a curving bay beach, animated breaking wave foam strips, rocky headland lighthouse, stone promenade, seaside hotels, striped bathing cabins, fishing boats, and a two-volume Basque villa with clipped garden parterre beds.
- `review/polish/5-before.png`, `review/polish/5-after.png`: Redesigned the finale (`src/ui/BrochureView.ts`, `src/styles.css`) as a continuous 6-panel Z-fold paper brochure with a 3D unfold transition, unboxed editorial columns, and references integrated into panel 6 while preserving the A4 landscape 99mm print sheet.
- `review/polish/6-before.png`, `review/polish/6-after.png`: Batched movable props (`src/world/Props.ts`), vertex-colored `StaticBatch` groups (`src/world/kit.ts`), and Biarritz wave foam strips (`src/world/areas/biarritz1891.ts`) to cut total draw calls under 120 in every area.
- `review/polish/7-before.png`, `review/polish/7-after.png`: Added `.gitattributes` (`* text=auto eol=lf`), updated `.gitignore` for `review/*` except `review/polish/`, renormalized line endings, and ran the final verification suite.

## Final Verification Status (1280x800 Desktop)

- `npm run typecheck`, `npm run lint`, `npm test` (7/7 tests), and `npm run build` pass cleanly with zero changes to `src/content/`.
- Desktop Playwright (`scripts/review.py` at `1280x800`):
  - `marseille-1882`: `calls=111`, `staticCalls=2`, `triangles=36390`
  - `paris-1883`: `calls=114`, `staticCalls=2`, `triangles=145886`
  - `paris-1885`: `calls=113`, `staticCalls=2`, `triangles=145878`
  - `paris-1889`: `calls=119`, `staticCalls=2`, `triangles=158694`
  - `biarritz-1891`: `calls=109`, `staticCalls=3`, `triangles=27142`
  - `marseille-1891`: `calls=104`, `staticCalls=2`, `triangles=36454`
