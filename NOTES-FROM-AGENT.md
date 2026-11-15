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

## Polish Pass 3 & Before/After Screenshots (`review/polish3/`)

- `review/polish3/1-before.png`, `review/polish3/1-after.png`: Narrowed the main Paris boulevard (`src/world/areas/paris.ts`) to a 20-unit building-to-building cross-section (11u cobbled carriageway plus two 4.5u raised sidewalks with curbstones, single rows of plane trees and gas lamps along each curb, Morris columns/kiosks/benches/flower carts on the sidewalks, and carriages parked against the curbs). Replaced bare open Champ de Mars apron slabs with lawn beds, dirt paths, benches, and station spawn clearance (`paris-*-station` at `(0.5, 0, -48)`).
- `review/polish3/2-before.png`, `review/polish3/2-after.png`: Tuned Marseille 1891 atmosphere (`src/world/areas/marseille.ts`, `src/world/palette.ts`) with cool harbor sky (`0xc6d8e0`), warm late-afternoon sunlight (`0xffe6c4`), clean `quayStone` masonry, `crate`/`crateDark` timber props, and matching `marseilleLand` earth tones (`0xd9bf94`).
- `review/polish3/3-before.png`, `review/polish3/3-after.png`: Added `buildIdleHorse(pose)` in `src/player/models.ts` with a 15% shorter neck than the ridden mount while keeping full horse scale, plus `'grazing'` and `'resting'` poses mixed across the Wild West arena in `src/world/areas/paris.ts`.
- `review/polish3/4-before.png`, `review/polish3/4-after.png`: Rebuilt `basqueVilla` and `headlandAndLighthouse` in `src/world/areas/biarritz1891.ts` with lower-pitch two-sided gable roofs, reduced height and eave overhang, east-facing gable and upper wooden balcony toward the camera, thin `palette.basqueRed` timber framing (floor/eave/collar beams, vertical posts, and diagonal braces), ~40% smaller headland boulders with smaller coastal outcrops, and shifted garden parterre beds clear of the villa walls.
- `review/polish3/5-before.png`, `review/polish3/5-after.png`: Scoped desktop finale panels (`src/styles.css`, `@media (min-width: 901px)`) to `max-height: calc(100dvh - 136px)` with independent panel scrolling, visible thin scrollbar, and sticky bottom scroll-fade edge on panel 6 so all 22 references are reachable at `1280x800` and `1440x900` without horizontal page overflow. Set `@media print` `.bp-refs-list` to `7pt` inline-numbered entries with tight panel padding so all 22 references fit cleanly on printed panel 6.
- **Git line-ending and filemode normalization (Task 6)**: System `C:/Program Files/Git/etc/gitconfig` had `core.autocrlf=true` and `.git/config` had `core.filemode=true`, causing files governed by `.gitattributes` (`* text=auto eol=lf`) to report spurious CRLF/mode diffs on Windows. Setting `core.autocrlf false` and `core.fileMode false` locally and running `git add --renormalize .` resolved the false modifications.

## Final Verification Status (Polish 3, 1280x800 Desktop)

- `npm run typecheck`, `npm run lint`, `npm run build`, and `npx vitest run tests/content.test.ts` (7/7 tests) pass with zero changes to `src/content/`. (Note: an unrelated untracked `handoff4/` directory present in the workspace contains a pending test file whose module does not yet exist.)
- Desktop Playwright (`scripts/review.py` at `1280x800`):
  - `marseille-1882`: `calls=111`, `staticCalls=2`, `triangles=36390`
  - `paris-1883`: `calls=115`, `staticCalls=2`, `triangles=165584`
  - `paris-1885`: `calls=114`, `staticCalls=2`, `triangles=165576`
  - `paris-1889`: `calls=119`, `staticCalls=2`, `triangles=175862`
  - `biarritz-1891`: `calls=109`, `staticCalls=3`, `triangles=30302`
  - `marseille-1891`: `calls=104`, `staticCalls=2`, `triangles=36454`

## Handoff 4 ("the living brochure") & Screenshots (`review/handoff4/`)

- **Figures & 19 narrated scenes (`src/story/figures.ts`, `src/story/SceneDirector.ts`, `src/story/SceneUI.ts`, `src/story/scenes/*.ts`)**: Built silent low-poly 1880s human figures with distinct coats, hats, skirts, aprons, and animations (`idle`, `walk`, `wave`, `write`, `paint`, `examine`, `ride`), plus scripted camera shots, synchronized `aria-live="polite"` captions, `Escape` skip/close handling, and end-frame `Read more` / continue choices across all 19 stops.
- **Chapter title cards & HUD goals (`src/ui/ChapterCard.ts`, `src/ui/Hud.ts`)**: Added paper chapter transition cards between eras (`Escape`/click/timeout dismissible) and dynamic HUD goal text updating to guide the rider toward the next stop or station.
- **Path trail & off-screen arrow (`src/world/PathTrail.ts`, `src/world/Area.ts`, `src/ui/Hud.ts`)**: Added per-area `RoadGraph` navigation and Dijkstra shortest-path `InstancedMesh` gold dot trail (`palette.gaslight`) with moving pulse, hidden within 6u of the destination and during scenes/cards/travel, paired with a clamped screen-edge directional arrow (avoiding top-left/top-right HUD pills).
- **Paper edges instead of invisible walls (`src/world/paperShader.ts`, `src/world/kit.ts`, `src/world/Water.ts`, `src/world/vessels.ts`, `src/world/AreaManager.ts`, `src/player/Player.ts`, `src/ui/Travel.ts`)**: Replaced land boundary walls with hatched paper surround geometry (`#eef0ec`), dashed ink border lines, a 25u exterior paper/sketch shader fade, smooth heading bias back toward area center outside `playBounds`, and a `> 30u` `playInkWipe` reset.
- **Pop-up scenery (`src/world/kit.ts`, `src/world/paperShader.ts`, `src/world/builders.ts`, `src/world/areas/*.ts`)**: Stored per-vertex base anchors (`aPopupAnchor`) in `StaticBatch.withAnchor`, unfolding buildings/trees/props from `y + 0.015` with slight overshoot between `26..36` units of camera focus (widened to `48..62` during scenes and skipped on touch/reduced motion).
- **Snapshot illustrations (`src/story/snapshot.ts`, `src/core/progress.ts`, `src/ui/BrochureView.ts`)**: Captured 600x400 offscreen WebGL snapshots at each scene's final caption, applied posterization + Sobel ink outlines + paper wash (`#eef0ec`), saved JPEG data URLs in `ProgressState` with `try/catch` and an in-memory fallback, and rendered them in finale panels and A4 landscape `@media print` sheets (`792x792` px, zero overflow).
- **Opening, page-fold travel, and closing (`src/ui/DeskScene.ts`, `src/ui/Intro.ts`, `src/ui/Travel.ts`, `src/core/Engine.ts`, `src/main.ts`)**: Replaced the title screen with a Three.js dark wood desk, warm brass/enamel lamp, and 6-panel hinged paper brochure (`CanvasTexture` cover with title, subtitle, and student credit) that unfolds and dives into panel 2 while scenery pops up from flat; added CSS 3D page-fold cover reveal over a paper spread with an inked SVG train and `journeys.ts` lines during train travel; and implemented the world-flatten + desk fold-up closing transition into the finale view (with reduced-motion crossfades).

### Review Screenshots (`review/handoff4/`, 1280x800)

- Desk opening: `desk-closed.png`, `desk-unfold.png`
- Chapter card & HUD: `chapter-card.png`, `chapter-hud.png`
- Path trail & off-screen arrow: `path-trail.png`, `offscreen-arrow.png`
- Paper edge & pop-up riding: `paper-edge.png`, `popup-gallop.png`
- All 19 stops (mid-scene with caption & end frame): `scene-<storyId>-mid.png`, `scene-<storyId>-end.png`
- Page-fold travel: `page-fold-mid.png`, `page-fold-travel.png`
- Finale brochure with snapshots: `finale-snapshots.png`

### Verification (Handoff 4)

- `git diff d424394 -- src/content/`: empty (`src/content/` unmodified).
- `npm run typecheck`, `npm run lint`, `npm test` (11/11 passed), `npm run build`: all pass cleanly.
- Headless Edge Playwright review sweep (`1280x800`): `errors: []`; draw calls across all 19 scenes range from `49` (`marseille-station`) to `121` (`paris-1889-godfather`), well under the `< 150` budget.
