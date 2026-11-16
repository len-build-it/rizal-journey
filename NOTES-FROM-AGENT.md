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

## Handoff 5 ("background life") & Screenshots (`review/handoff5/`)

- **1880s archetypes, animals & vehicles (`src/story/figures.ts`, `src/world/life/animals.ts`, `src/world/life/vehicles.ts`)**: Expanded `PersonOptions` and `rolePreset(role, winter, seedOffset)` across all 10 silent low-poly French roles (`dockWorker`, `fisherman`, `marketWoman`, `gentleman`, `lady`, `child`, `nurse`, `coachman`, `gendarme`, `vendor`) with period hats, props, and actions; added low-poly palette-colored builders for pigeons, gulls (ground/flying), dogs, cats, sheep, ducks, fish, harness horses, fiacres, double-decker omnibuses, cargo carts, handcarts, rare 1889 Paris penny-farthings, and rowing boats.
- **Instanced GPU shader & traffic simulation (`src/world/life/instancing.ts`, `src/world/life/BackgroundLife.ts`, `src/world/life/dressings.ts`)**: Grouped all people by role, birds by species/state, animals by species, and vehicles by kind into `InstancedPool` draw calls with per-instance color tinting, GPU vertex limb/wing/oar/graze animations faded beyond 45 units of camera focus, mobile count halving (`engine.quality.mobile`), sidewalk/road loop navigation avoiding stop rings and gateways, rider reactions (stepping aside sideways during walks/gallops, yielding vehicles, flocks bursting into circling flight, trotting dogs), Rapier `kinematicPositionBased` colliders so the horse stops cleanly without knocking figures over, and 14-unit exclusion zones around active stop scenes.
- **Area integration (`src/world/Area.ts`, `src/world/AreaManager.ts`, `src/story/SceneDirector.ts`, `src/world/areas/*.ts`, `src/main.ts`)**: Dressed all 6 areas (`marseille-1882`, `marseille-1891`, `paris-1883`, `paris-1885`, `paris-1889`, `biarritz-1891`) according to season and location (`yAt` slope placement for Biarritz coastal sheep).

### Before / After Performance (`1280x800` Headless Edge)

| Area | Before (Calls / Triangles) | After (Calls / Triangles) | Added Draw Calls (Budget <= 30) |
| --- | --- | --- | --- |
| `marseille-1882` | 117 / 41,940 | 143 / 82,064 | +26 |
| `paris-1883` | 113 / 171,918 | 141 / 231,935 | +28 |
| `paris-1885` | 118 / 171,528 | 136 / 206,207 | +18 |
| `paris-1889` | 122 / 174,390 | 150 / 261,561 | +28 |
| `biarritz-1891` | 111 / 36,840 | 135 / 63,370 | +24 |
| `marseille-1891` | 117 / 42,420 | 144 / 82,520 | +27 |

### Review Screenshots (`review/handoff5/`, `1280x800`)

- Model & instancing milestones: `step1-models-gallery.png`, `step2-instancing-test.png`, `step3-marseille-traffic.png`, `step3-paris-traffic.png`, `step4-exclusion.png`
- Area overviews: `overview-marseille-1882.png`, `overview-paris-1883.png`, `overview-paris-1885.png`, `overview-paris-1889.png`, `overview-biarritz-1891.png`, `overview-marseille-1891.png`
- Interactive behaviors & feature close-ups: `pigeons-takeoff.png`, `people-step-aside.png`, `paris-boulevard-vehicles.png`, `paris-1889-crowd-tower.png`, `biarritz-sheep-slopes.png`
- Stop-scene 14u exclusion checks: `scene-marseille-1882.png`, `scene-paris-1883.png`, `scene-paris-1885.png`, `scene-paris-1889.png`, `scene-biarritz-1891.png`, `scene-marseille-1891.png`

### Verification (Handoff 5)

- `git diff d424394 -- src/content/`: empty (`src/content/` unmodified).
- `npm run typecheck`, `npm run lint`, `npm test` (11/11 passed), `npm run build`: all pass cleanly.
- Headless Edge Playwright verification (`1280x800`): `errors: []` across all 6 area overviews, stop scenes, and reaction captures.

## Handoff 6 ("soft cardstock" UI kit, finished brochure & scene fixes)

- **Typography & preview tooling (`package.json`, `src/main.ts`, `preview/*`)**: Installed `@fontsource-variable/fraunces` (`full.css`) and `@fontsource-variable/literata` (`standard.css` + `standard-italic.css`), removed `@fontsource-variable/bodoni-moda` and `@fontsource-variable/instrument-sans`, imported `src/ui/kit/kit.css` and `src/ui/brochure/brochure.css` before `src/styles.css`, and kept `"preview": "vite preview"` while naming the brochure preview `"preview:brochure"` (`vite build --config preview/vite.config.ts`).
- **2D UI kit & 3D trail/stop markers (`src/ui/*.ts`, `src/story/SceneUI.ts`, `src/world/palette.ts`, `src/world/PathTrail.ts`, `src/world/StopMarker.ts`, `src/styles.css`)**: Applied the soft cardstock kit classes (`.k-card`, `.k-chip`, `.k-stamps`, `.k-band`, `.k-btn`, `.k-key`, `.k-toast`, `.k-chapter`, `.k-story`) across the title card (`.intro-inner.k-card` so ink focus outlines stay high-contrast), chapter cards (spelled-out chapter numbers, goal visible right away, `"Press any key to ride"`), HUD pills/stamps/prompts/toast, story cards, scene caption/action bands, and travel spread. Switched 3D trail dots and stop markers to vermilion (`palette.vermilion`, `0xc2452d`) with Prussian ink outer rims (`palette.ink`, `0x20324a`). Removed all legacy CSS variables from `src/styles.css`.
- **Desk cover & finished brochure integration (`src/ui/DeskScene.ts`, `src/ui/BrochureView.ts`, `src/main.ts`, `index.html`)**: Redrew `DeskScene`'s cover canvas to match the brochure's panel 1 (`#efe6d1` cardstock, Fraunces display title, Literata italic vermilion subtitle, `routeMapSvg()` SVG data URI with resolved palette tokens, intro copy, and student credit) after awaiting `document.fonts` + SVG image readiness. Integrated `renderBrochure`, `fitBrochure`, and `overflowingPanels` into `src/ui/BrochureView.ts` for both the finale (collected snapshots) and "Read as a brochure" fallback (all 13 stories marked visited, no snapshots), with staggered side A / side B settle animations (`prefers-reduced-motion` aware) and two-page A4 landscape `@media print` styling. Note: `src/ui/kit/kit.css`, `src/ui/brochure/*`, and `src/content/*` were left untouched.
- **Five 3D scene fixes (`src/world/areas/paris.ts`, `src/story/scenes/parisScenes.ts`, `src/story/scenes/props.ts`, `src/story/scenes/marseilleScenes.ts`, `src/story/scenes/biarritzScenes.ts`, `src/player/models.ts`, `src/main.ts`)**:
  1. `paris-1885-studio`: Built out Luna's top-floor studio interior (`deckWood` floorboards, enclosing side walls, back framed paintings, paint table with pots and crimson draped cloth, edge skylight mullions, primary large easel with a low-poly study of the 1565 blood compact in warm, dim light, and secondary easel) and aligned the painter to face the canvas while Rizal and Trinidad converse beside him.
  2. `marseille-landing`: Tuned night arrival sky/fog (`0x1b2b4a` / `0x24375c`) and added warm shipboard lantern `PointLight`s illuminating the gangway and white deckhouses, recessed brass-rimmed portholes flush against the Djemnah hull (`z = 14.08`), and ensured path trail, stop markers, and off-screen arrow remain hidden during scenes and cards.
  3. `paris-1889-indios-bravos` & arena horses: Restricted saddle/blanket meshes in `buildHorseModel(neckScale, withRider)` to `withRider === true` only, and raised arena idle and galloping horse `y` bases so hooves stay grounded on the `y = 0.09` packed-earth track.
  4. `paris-1889-tower`: Switched the French tricolor flag stripes in `createFrenchFlag()` to unlit `MeshBasicMaterial` and tuned final summit framing so blue, white, and red read crisply against 1889 evening sunlight.
  5. `biarritz-manuscript`: Hid the hatted walking `ctx.rizal` during the indoor terrace writing scene, spawned bareheaded Rizal sitting at the table with his bowler hat resting beside the manuscript sheets, and replaced the harsh side point light with softer dusk fill and gentle table lamp glow.

### Review Screenshots (`review/handoff6/`, `1280x800` desktop & `390x844` mobile)

- Opening & riding UI: `desk-intro.png`, `desk-brochure-fallback.png`, `desk-chapter-card.png`, `desk-riding.png`, `desk-travel.png`, `desk-timelapse.png`
- Scene UI & story card: `desk-scene-caption.png`, `desk-scene-end.png`, `desk-story-card.png`
- Fixed Section 7 scenes: `desk-scene-marseille-landing.png`, `desk-scene-paris-1885-studio.png`, `desk-scene-paris-1889-tower.png`, `desk-scene-paris-1889-indios-bravos.png`, `desk-scene-biarritz-manuscript.png`
- Finished brochure & A4 print sheets: `desk-finale-side-a.png`, `desk-finale-side-b.png`, `desk-print-page1.png`, `desk-print-page2.png`, `desk-brochure-print.pdf` (2 A4 landscape pages)
- Area overviews & mobile counterparts: `desk-<area>-overview.png`, `mob-*.png`

### Verification (Handoff 6)

- `git diff src/content/ src/ui/kit/ src/ui/brochure/`: empty.
- `npm run typecheck`, `npm run lint`, `npm test` (11/11 passed), `npm run build`, `npm run preview:brochure`: all passed cleanly.
- `python -I scripts/review.py "http://localhost:4173/?review" review/handoff6 mobile` (desktop `1280x800` + mobile `390x844` via headless Edge SwiftShader): exit code 0, zero console/page errors, `fallback overflow=[]` and `finale overflow=[]` on both desktop and mobile, and `desk-brochure-print.pdf` verified as 2 A4 landscape pages.

## Handoff 6B (Redesigned brochure, route layout & recaptured snapshots)

- **Redesigned brochure integration (`src/ui/brochure/*`, `src/ui/BrochureView.ts`, `vite.config.ts`, `preview/*`, `scripts/capture-brochure-defaults.py`)**: Installed the redesigned brochure files (`renderBrochure.ts`, `brochure.css`, `routeMap.ts`, `postmark.ts`, `defaults/*.jpg`), updated `BrochureView.ts` to call `layoutBrochure(brochure)` after mounting and pass `defaultSnapshots()` in fallback mode (keeping player snapshots in finale mode), and updated `vite.config.ts` (`assetsInlineLimit`) to inline `/brochure/defaults/` photos alongside `.woff2` fonts (verified zero external `.jpg` files emitted in `dist/assets/`). Added cross-platform Chrome/Edge discovery in `scripts/capture-brochure-defaults.py` for Windows Playwright runs.
- **Snapshot camera, bench orientation, and horse visibility fixes (`src/player/Player.ts`, `src/story/SceneDirector.ts`, `src/world/areas/paris.ts`, `src/story/scenes/marseilleScenes.ts`, `src/story/scenes/parisScenes.ts`)**:
  - Added `Player.setSceneVisible(false)` during active stop scenes (`SceneDirector.play()` / `cleanup()`) so the parked horse no longer blocks close-up story shots or snapshots.
  - `marseille-landing`: Moved camera to `(4.8, 2.45, 4.2)` -> `(5.8, 2.35, 4.6)` looking at `(10.2, 1.5, 12.6)` with softened lantern fill (`decay = 1.0`) so Rizal, the porters, gangway, lit portholes, and Djemnah deckhouse/funnel fill the bleed frame cleanly.
  - `paris-1885-clinic`: Rotated `deWeckerClinic` bench to `ry = Math.PI` so the seated bandaged patients face Rue du Cherche-Midi instead of sitting backward through the backrest, separated Dr. de Wecker and Rizal beside the bench, and framed the full group cleanly from `(22.6, 2.0, 9.2)`.
  - `paris-1889-godfather`: Pulled the camera back onto Rue des Saints-Peres (`(33.2, 2.25, 24.8)` -> `(33.8, 2.1, 25.6)`) and arranged all five figures facing 3/4 toward the street in front of Luna's studio doorway so every face and the baby read clearly.
  - `paris-1889-morga`: Added a lit bookstall display desk with cream cloth, brass lamp, stacked books, and an upright cream-and-crimson *Sucesos* volume outside the bookshop, adjusted `ctx.setLook` sun angle (`(-0.35, 0.55, -0.75)`) plus gentle overhead fill to eliminate dark shadows and point-light banding, and placed Rizal in 3/4 profile beside the desk.
- **Recaptured defaults & review screenshots (`src/ui/brochure/defaults/*.jpg`, `review/handoff6/`)**: Rebuilt and recaptured all 13 default snapshots via `scripts/capture-brochure-defaults.py`, then ran `scripts/review.py` (`1280x800` desktop and `390x844` mobile) saving `desk-brochure-fallback.png`, `desk-brochure-fallback-side-b.png`, `desk-finale-side-a.png`, `desk-finale-side-b.png`, `desk-print-page1.png`, `desk-print-page2.png`, `desk-brochure-print.pdf` (verified 2 A4 landscape pages), and mobile counterparts.

### Observations on Unmodified Brochure Files (Proposal)

Per Handoff 6B rules (`src/ui/brochure/*` left unmodified except recaptured `defaults/*.jpg`):
1. **Mobile zoomed `Panel 6` `.b-flow` measurement**: At `390x844` (`--b-scale: 0.3047`), `.b-panel--6` itself stays at `scrollHeight === clientHeight` (`794 === 794`), while `.b-panel--6 .b-flow` reports `scrollHeight = 421 > clientHeight = 405` due to Chromium minimum font/line-box rounding under CSS `zoom`. Visually nothing overlaps `.b-refs` on mobile (`mob-finale-side-b.png`). Desktop (`1280x800`) reports `overflow = []` on both fallback and finale.
2. **Unvisited `.b-print__empty` / `.b-unseen-note` height when many stops are skipped**: `brochure.css` gives `.b-print__empty` `aspect-ratio: 3 / 2`, whereas `.b-print--bleed img` (`99 / 46`) and `.b-print--feature .b-print img` (`1.9 / 1`) are shorter; combined with `.b-unseen-note`, skipping all 13 photo stops (`openFinale(true)` at start) triggers overflow in Panels 2, 3, and 6, while skipping a single stop (verified on `dist-preview/brochure.html`, skipping `paris-1889-godfather`) renders `'Not visited'` with `overflow = []`. Consider adding `.b-print--bleed .b-print__empty { aspect-ratio: 99 / 46; }` and `.b-print--feature .b-print__empty { aspect-ratio: 1.9 / 1; }` in a future brochure CSS update.

### Verification (Handoff 6B)

- `git diff d424394 -- src/content/ src/ui/kit/ src/ui/brochure/renderBrochure.ts src/ui/brochure/brochure.css src/ui/brochure/routeMap.ts src/ui/brochure/postmark.ts`: empty.
- `npm run typecheck`, `npm run lint`, `npm test` (11/11 passed), `npm run build`, `npm run preview:brochure`: all passed cleanly.
- `scripts/review.py` desktop (`1280x800`): exit code 0, zero console/page errors, `fallback overflow=[]`, `finale overflow=[]`, route SVGs verified on panels 2 to 6, and `desk-brochure-print.pdf` verified as 2 A4 landscape pages.
- `preview/brochure.html` (`1280x800`): `overflow=[]`, unvisited `paris-1889-godfather` displays `'Not visited'`.

## Handoff 7 (Walk articulation, story visibility, and brochure recapture)

- **Brochure update & overflow checks (`src/ui/brochure/renderBrochure.ts`, `src/ui/brochure/brochure.css`, `preview/preview.ts`, `scripts/review.py`, `src/ui/BrochureView.ts`, `src/styles.css`)**:
  - Copied the updated brochure files into place and updated `scripts/review.py` to assert `overflowingPanels()` is empty for fallback, finale (all visited), and finale (none visited) on both desktop (`1280 x 800`) and mobile (`390 x 844`).
  - Adjusted the small-screen brochure gutter (`max-width: 600px` in `src/styles.css` and `src/ui/BrochureView.ts`, without editing `src/ui/brochure/`) so subpixel Chromium zoom rounding at `390 x 844` keeps Panel 6 free of flow overflow (`mob fallback overflow=[]`).
- **Quick fixes (`src/ui/credit.ts`, `src/ui/BrochureView.ts`, `src/ui/DeskScene.ts`, `src/world/areas/paris.ts`, `src/world/palette.ts`, `package.json`)**:
  - Added shared `CREDIT` (`src/ui/credit.ts`) rendered on both the desk brochure cover (Fraunces display name above course and activity) and brochure panel 1.
  - Removed the center skylight mullion (`mx = -0.7`) in `lunaStudio()` so no pole crosses the painting, and replaced `withParisianLife` with `withBloodCompact` showing figures around the table in warm dim light.
  - Switched the desk lamp outer cone to `palette.bottleGreen` with a glowing inner cone and moved `lampLight` inside the shade so yellow light falls on the desk rather than the exterior green enamel.
  - Restored `"preview": "vite preview"` and added `"preview:brochure": "vite build --config preview/vite.config.ts"`.
- **Walking & animal articulation (`src/story/figures.ts`, `src/world/life/instancing.ts`, `src/world/life/animals.ts`, `src/world/life/vehicles.ts`, `src/world/life/BackgroundLife.ts`, `tests/life.test.ts`, `scripts/capture-walk-strips.py`)**:
  - Tagged vertex `aLifePart` attributes directly from rig groups (`personPartId`, quadruped legs `1..4` and head `5`, wheels `8`, oars `6..7`) and baked scaled `aLifePivot` vectors in world-ready part coordinates.
  - Unified stride cadence (`PERSON_LEG_LENGTH = 0.76`, `strideOmega`, `walkSwingAngle`) across `PersonActor`, instanced shaders, vehicles, and roaming animals; verified planted-foot ground slide stays under `5 cm` per stride in `tests/life.test.ts`.
  - Raised `LIFE_ANIM_DIST` from `45 m` to `95 m` so visible walkers never glide across screen edges.
  - Upgraded person geometry to 8-sided torso, skirts/coats, limbs, and shawls with distinct skin necks, articulated knee hinges (`kneeL`/`kneeR`), distinct shoes, thigh/shin animation, skirt sway, counter-rotating shoulders, and steady head orientation.
  - Final person triangle counts per role (all under `600`, tested in `tests/life.test.ts`): `dockWorker=506`, `fisherman=550`, `marketWoman=566`, `gentleman=550`, `lady=594`, `child=582`, `nurse=510`, `coachman=538`, `gendarme=518`, `vendor=498`.
  - Captured 8-frame walk strips (`0.08 s` steps over `0.25 m` ground ticks) in `review/handoff7/walk-{man,woman,child,dog,horse}.png`.
- **Story places standing out (`src/world/palette.ts`, `src/world/storySigns.ts`, `src/world/stopWaiters.ts`, `src/world/StopMarker.ts`, `src/world/PathTrail.ts`, `src/ui/Hud.ts`, `src/main.ts`, `src/world/areas/*.ts`, `src/story/scenes/*.ts`)**:
  - Muted background roofs, awnings, market canopies, beach huts, fishing boat hulls, and engine cab to slate, terracotta, sage, ochres, and cream so vermilion stays reserved for story landmarks and navigation.
  - Added story set pieces across Marseille, Paris, and Biarritz (`SignAtlas` packing up to 12 Fraunces/Literata signs into 1 texture + 1 batched draw call per area): steamer portholes, 1891 funnel smoke, gangway lanterns, and `Djemnah`/`Melbourne` signs; west quay lookout bench, brass spyglass, and `Chateau d'If` sign; `Marseille`, `Paris`, and `Biarritz` vermilion station boards with canopies and glowing windows; `Hotel de Paris` / `37` striped awning and lanterns; `Laennec Hospital` arched gate; `Dr. Louis de Wecker` clinic canopy and brass plate; Juan Luna studio lit skylight and street signs; `World's Fair 1889` kiosk; `Wild West Show` flags and illuminated `Tickets` booth; `Garnier Hermanos` print shop window and stacked books; `Villa Eliada` gate lanterns, brass plate, and glowing writing room window; terrace table lamp and sign.
  - Replaced `StopMarker` floating octohedra with 6 m high double-sided round paper postmarks (`fog: false`) and faint vertical light columns (`fog: false`) down to the ground rings; emphasized the active next stop and muted visited/locked stations into smaller grey stamps.
  - Added pop-up paper title signboards (`d < 14 m`, matching the world pop-up curve) and merged-mesh waiting scene figures (`buildWaitingFigure`) that appear near unvisited stops and turn/wave within `10 m`.
  - Replaced the corner compass with a screen-edge kit chip displaying a rotating vermilion arrow and `stop.story.title` when off screen, added a ~1.6 s area-open camera ease to the first unvisited stop (skippable by any input; cuts under reduced motion), enlarged and brightened `PathTrail` dots as they near the stop, and added batched warm ground lamp pools (`buildLampPools`) plus lit windows for evening and night scenes.
- **Draw calls per area (baseline post-4.1 vs final, recorded via `window.__rizal.renderStats()`)**:
  - `marseille-1882`: `141 -> 155` (`+14`, `staticCalls=6`, `triangles=90248`)
  - `paris-1883`: `146 -> 151` (`+5`, `staticCalls=4`, `triangles=242916`)
  - `paris-1885`: `136 -> 139` (`+3`, `staticCalls=4`, `triangles=213458`)
  - `paris-1889`: `150 -> 159` (`+9`, `staticCalls=3`, `triangles=278168`)
  - `biarritz-1891`: `136 -> 140` (`+4`, `staticCalls=4`, `triangles=67996`)
  - `marseille-1891`: `136 -> 138` (`+2`, `staticCalls=4`, `triangles=88278`)
- **Recaptured defaults & `review/handoff7/` proofs**:
  - Recaptured all 13 default brochure snapshots in `src/ui/brochure/defaults/*.jpg`.
  - Saved `1280 x 800` desktop (`desk-*`), `390 x 844` mobile (`mob-*`), 8-frame walk strips (`walk-{man,woman,child,dog,horse}.png`), arrival and 8 px Gaussian-blurred UI-free views (`arrive-<area>.png`, `arrive-<area>-blur.png` for all 6 areas), `stop-signboard-wave.png`, 16 close-up set-piece views (`setpiece-*.png`), print sheets (`desk-print-page1.png`, `desk-print-page2.png`), and 2-page A4 landscape PDF (`desk-brochure-print.pdf`) in `review/handoff7/`.
