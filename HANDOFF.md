# Handoff: build the skeletons of the remaining areas

This is a work order for an AI coding agent.
Read all of it before writing any code.

The project is "Through Rizal's Eyes: France, 1882-1891", an explorable 3D travel brochure in the style of bruno-simon.com.
You ride Jose Rizal on horseback around small toy-scale areas, stop at glowing markers to read his story, and fill in a six-panel Z-fold brochure.
It is a school output graded mostly on historical accuracy (30 points) and design (20 points).

One area is finished: Marseille, 1882.
Your job is to build the skeletons of the other areas and the systems that connect them, following the patterns already in the code.
Polish comes later, in a separate pass.

---

## 1. Rules that override everything else

1. **Do not write or change any history.**
   All story text lives in `src/content/stories.ts` and `src/content/journeys.ts`, and every line is tied to a verified fact in `src/content/facts.ts`.
   That copy is final.
   Do not edit it, do not add new story text, and do not put historical claims anywhere else: no signs, captions, tooltips, alt text or comments that state facts beyond a place name.
   If you believe something is wrong or missing, write it in `NOTES-FROM-AGENT.md` instead of changing it.
2. **Never use the em dash character** (U+2014) in any file, string or commit message.
   A test enforces this.
3. **Do not add co-author or attribution lines** to commit messages.
4. **Keep the existing look.**
   Reuse the palette (`src/world/palette.ts`), the flat-shaded material helper (`mat`), `StaticBatch`, the HUD, the story card and the camera.
   Do not introduce glass cards, gradients, new fonts, icon sets, all-caps labels or a different camera.
5. **Every new static object goes through `StaticBatch`** so an area stays at a few dozen draw calls.
   Only loose props and animated things may be separate meshes.
6. **No new runtime dependencies** without a written reason in `NOTES-FROM-AGENT.md`.
7. **Run the quality gate in section 7 before you say anything is done.**
   Look at the screenshots yourself and fix what looks wrong.

---

## 2. What already exists

```
src/
  main.ts                 boots everything, owns the game loop wiring and story/travel flow
  styles.css              all UI styles (tokens at the top)
  core/
    Engine.ts             renderer, scene, lights, Rapier physics, fixed 60 Hz step
    Input.ts              keyboard + joystick -> screen-relative direction, sprint, interact
    FollowCamera.ts       fixed-angle diorama camera; `framing` frames a subject beside the card
  player/
    models.ts             procedural horse and rider (rig with leg, neck, head, tail joints)
    Player.ts             kinematic character controller, gaits (walk, trot, gallop), lean
    Dust.ts               hoof dust particles
  world/
    palette.ts            the only place colors are defined
    kit.ts                mat(), StaticBatch (merge by color), place(), seeded() random
    physics.ts            staticBox, staticCylinder, boundary walls
    builders.ts           townHouse, houseRow, planeTree, gasLamp, bollard
    vessels.ts            steamer(), fishingBoat()
    Water.ts              animated low-poly sea
    Props.ts              knock-over crates, barrels, cafe tables and chairs
    StopMarker.ts         glowing story stop (ring, beam, floating gem)
    Area.ts               Area interface: spawn, stops, look (lighting), update()
    areas/marseille1882.ts  the finished reference area
  content/
    facts.ts              fact sheet with sources and confidence (do not edit)
    stories.ts            every stop's card text, panel number, era and travel action (do not edit)
    journeys.ts           text shown during each train trip or tower time-lapse (do not edit)
  ui/
    Hud.ts, StoryCard.ts, Joystick.ts, Intro.ts, dom.ts
tests/content.test.ts     content integrity and style rules
scripts/review.py         headless screenshot review (see section 7)
SPEC.md                   original spec; its fact sheet (section 4) still applies,
                          its design sections 5 to 8 are replaced by this file
```

Study `src/world/areas/marseille1882.ts` closely.
Every new area follows the same shape: build static geometry into a `StaticBatch`, add colliders, add props, place `StopMarker`s from `storiesFor(...)`, return an `Area` with its `look`.

---

## 3. The journey and how areas connect

Order of play, with the brochure panel each stop fills:

| Step | Area | Stops (story ids) | Panel | Leaves by |
| --- | --- | --- | --- | --- |
| 1 | Marseille 1882 (done) | marseille-landing, marseille-chateau-dif, marseille-station | 2 | train |
| 2 | Paris, era 1883 | paris-1883-hotel, paris-1883-hospital, paris-1883-station | 2 | train |
| 3 | Paris, era 1885 | paris-1885-clinic, paris-1885-studio, paris-1885-station | 3 | tower time-lapse |
| 4 | Paris, era 1889 | paris-1889-tower, paris-1889-indios-bravos, paris-1889-godfather, paris-1889-morga, paris-1889-station | 4, 5 | train |
| 5 | Biarritz 1891 | biarritz-villa, biarritz-manuscript, biarritz-station | 5, 6 | train |
| 6 | Marseille 1891 | marseille-1891-melbourne, marseille-1891-lessons | 6 | finale |

Each "station" story has an `action` with a `Destination` (see `stories.ts`).
`main.ts` currently has a `travelTo()` stub that only shows a toast; replace it with the travel system in section 5.

The player may visit stops in any order inside an area.
The station stop is always available, but its action button should say "Visit the other stops first" and be disabled until every other stop in that area (and era) has been read.

---

## 4. Area skeletons to build

"Skeleton" means: correct layout, the key landmarks blocked out with recognizable silhouettes, colliders, boundary, stops placed, lighting set, and a few props.
Fine detail is not needed yet.
Scale: one unit is one meter at toy scale; streets about 10 to 14 wide, houses 2 to 4 floors.
The camera sees roughly 30 x 25 units around the rider, so keep stops within an easy ride of each other (20 to 60 units apart) and lay the area out along one main route.

### 4.1 Paris (one map, three eras)

File: `src/world/areas/paris.ts`, exporting `buildParis(scene, ctx, era: ParisEra): Area`.

Build the city once and switch era-specific pieces on and off, so all three eras share the same streets.
Rebuilding the whole area on each era change is also acceptable if it is simpler, as long as loading stays under one second.

City style (all eras):
- Haussmann blocks: cream limestone walls, grey-blue zinc mansard roofs with dormer windows, wrought-iron balconies on the second and fifth floors, shops with awnings on the ground floor.
  Add a new `haussmannBlock()` builder in `builders.ts` modeled on `townHouse()`.
  Add the needed colors to `palette.ts` (zinc roof, Paris limestone).
- Wide boulevards with plane trees and gas lamps, cobbled side streets, Morris columns (round green advertising columns) as static props.
- The Seine along one edge of the map with a stone embankment and one bridge.
- The Champ de Mars: a long open lawn beside the Seine, which is where the tower will stand.
- Loose props: cafe tables on a terrace, flower carts, crates, a few barrels.

Era-specific landmarks and where each stop goes:

| Era | Stop id | Place it at | Landmark to build |
| --- | --- | --- | --- |
| 1883 | paris-1883-hotel | In front of a Haussmann building on a street named Rue de Maubeuge | A modest hotel facade with a small plaque shape beside the door |
| 1883 | paris-1883-hospital | At a hospital gate | A long, low institutional building with a courtyard and gate (Laennec) |
| 1883 | paris-1883-station | At the railway station | A Paris terminus: big arched glass front, clock, train on a platform |
| 1885 | paris-1885-clinic | Outside a doctor's practice on Rue du Cherche-Midi | A narrower building with a brass-plate door; a waiting bench outside |
| 1885 | paris-1885-studio | Outside an artist's studio | A building with a tall north-facing glass studio window on the top floor; easels visible inside |
| 1885 | paris-1885-station | The same railway station | Same as above |
| 1889 | paris-1889-tower | On the Champ de Mars, near the tower's base | The finished Eiffel Tower in Venetian red (section 4.2), fair pavilions around it |
| 1889 | paris-1889-indios-bravos | At the edge of the map, outside the fair | A large open-air arena with grandstands and flags: the Wild West show (it stood outside the fair grounds) |
| 1889 | paris-1889-godfather | Outside Juan Luna's studio | The same studio building as 1885 |
| 1889 | paris-1889-morga | Outside a bookshop on Rue des Saints-Peres | A shopfront with "GARNIER FRERES" lettering is not needed; a plain bookshop with books in the window is enough |
| 1889 | paris-1889-station | The same railway station | Same as above |

In 1883 and 1885 the Champ de Mars is an empty lawn with paths.
In 1889 it holds the tower and the fair: a few large pavilion buildings, flags, more lamps and more people-free bustle (carts, benches, stalls).

Street names: you may show street names on small blue-and-white Paris street signs, using only the names in the table above.

Lighting (`look`):
- 1883: summer morning, warm sun, light blue sky.
- 1885: winter (November to February), cool grey-blue light, low sun, slightly hazy.
- 1889: spring evening, golden low sun, with the fair's gas lamps lit (emissive materials; avoid many real lights on mobile).

### 4.2 The Eiffel Tower

File: `src/world/tower.ts`, exporting a class with `setProgress(p: number)` from 0 (nothing) to 1 (complete).

- Build it procedurally from thin beams in an `InstancedMesh` (one draw call), not as a solid shape.
- Proportions: square base, four curved legs that join at the first platform, second platform, then a single tapering shaft to the top platform and a small lantern.
  Use these relative heights: first platform at 19%, second at 38%, top platform at 92%, total 100%.
  Base width about 42% of the height.
- Size in the world: about 46 units tall, so the rider looks tiny next to it.
- Material: Venetian red (`palette.iron`), flat shaded.
- Decorative arches between the legs at the first-platform level.
- Each beam stores a build order by height, with the four legs rising separately until they meet at the first platform, so `setProgress` reveals it from the ground up.
- Map `setProgress` to calendar time with these keyframes (all from fact F09):

| Date | Progress |
| --- | --- |
| January 28, 1887 | 0.00 (only the four stone piers) |
| July 1, 1887 | 0.05 |
| Spring 1888 | 0.30 (legs joined at the first platform) |
| August 14, 1888 | 0.55 (second platform) |
| March 31, 1889 | 1.00 |

- When a stop near the tower opens its card, frame the tower with `cam.framing` (zoom out enough to see the top).

### 4.3 Biarritz 1891

File: `src/world/areas/biarritz1891.ts`.

- A curving Atlantic beach with a seawall promenade, rocky outcrops at both ends, and rougher waves than Marseille (reuse `Water` with bigger amplitude via a constructor option).
- The Boustead family's villa on a slope above the beach: a large house in the local Basque style (white walls, red-painted timbers and shutters, low red tile roof), with a garden and a terrace.
  Do not claim this is what Villa Eliada really looked like; it is a generic villa.
- A small table and chair on the terrace for the `biarritz-manuscript` stop.
- A small railway station at the inland edge for `biarritz-station`.
- Props: beach chairs, a rowing boat pulled up on the sand, barrels.
- Lighting: late winter (February to March), bright cool sun, fresh blue sea, a few clouds.

| Stop id | Place it at |
| --- | --- |
| biarritz-villa | The villa's front gate |
| biarritz-manuscript | The terrace table |
| biarritz-station | The station platform |

### 4.4 Marseille 1891

Reuse the Marseille 1882 map: refactor `buildMarseille1882` into `buildMarseille(year: 1882 | 1891)` with the year switching the differences below.
Keep the 1882 version identical to now.

Differences in 1891:
- The steamer at the quay is the Melbourne instead of the Djemnah (same `steamer()` builder, slightly longer, a different funnel color is fine).
- Late afternoon October light: lower, warmer sun, longer shadows.
- A small boat tied at the Chateau d'If landing (it opened to visitors in 1890).
- The player spawns at the station (arriving by train) instead of the quay.

| Stop id | Place it at |
| --- | --- |
| marseille-1891-melbourne | The gangway of the Melbourne |
| marseille-1891-lessons | The lookout at the west end of the quay |

---

## 5. Systems to build

### 5.1 Area manager and travel

- Add `src/world/AreaManager.ts`: loads an area (by `Destination`), disposes the previous one (geometries, materials, colliders, bodies, markers), applies its `look`, places the player at its spawn, snaps the camera, and updates the HUD year and place.
  Rapier objects must be removed from the world when an area is unloaded.
- The current area and era, the visited stops and the filled panels live in one small state object in `src/core/progress.ts`.
  Save it to `localStorage` inside try/catch (it may be unavailable) and offer "Continue" on the title screen when a save exists.
- `travelTo(dest)` in `main.ts` plays the travel interlude, then asks the AreaManager to load the destination.

### 5.2 Travel interludes

- Train trips: a full-screen night-blue overlay with a small side view of a steam train crossing the screen (built in Three.js in its own tiny scene, or as an SVG), and the `journeyFrom(storyId).lines` appearing one at a time, about 1.6 seconds each.
  Tap or press any key to skip.
- The tower time-lapse (from `paris-1885-station` to Paris 1889): load Paris in era 1889 with the tower at progress 0, lock input, and run a scripted camera orbit while the tower builds from 0 to 1 over about 8 seconds, showing the `journeys.ts` lines for that trip as the matching milestones are reached.
  Then return control.
- Respect `prefers-reduced-motion`: replace the animations with a short crossfade and show all the lines at once.

### 5.3 Finale: the finished brochure

- After `marseille-1891-lessons`, show the brochure: six panels laid out as an unfolding Z-fold (CSS 3D transforms are fine), panel 1 being the cover (title, subtitle, student credit) and panels 2 to 6 showing the titles and dates of the stories collected for each.
  Clicking a story title reopens its card text in the brochure view.
- Include a "References" section listing every source in `SOURCES` that is cited by at least one story.
- A "Print brochure" button that uses a print stylesheet: A4 landscape, two pages, side A panels 1 to 3 and side B panels 4 to 6, each panel 99 x 210 mm, no content crossing a fold.
  `window.print()` is blocked when the page is hosted as a claude.ai artifact, so detect that it did nothing (or catch the error) and show: "Printing works in the GitHub Pages version of this site."

### 5.4 Read-as-brochure fallback

- A "Read as a brochure" link on the title screen opens a plain, accessible HTML version of all stories in six panels, with no WebGL.
- If WebGL or physics fails to start, show this view automatically with a one-line note, instead of the current error text.

### 5.5 Small fixes to include

- The prompt button label is cut off on narrow phones; let it wrap to two lines.
- The first JavaScript bundle is about 1.8 MB gzipped because Rapier's WebAssembly is inlined.
  Lazy-load each area module with dynamic `import()` so only the current area's code loads.

---

## 6. Hosting constraints (the page runs as a claude.ai artifact and on GitHub Pages)

- No network requests at runtime to other hosts: everything must be bundled.
- Fonts must stay inlined (see `vite.config.ts`); do not switch to font files.
- Images, if you add any, must be local files in the build output, not remote URLs.
- `window.print`, downloads, `alert`, `confirm` and `prompt` do not work in the artifact frame.
- Only `#name` hashes survive in the URL; do not use query strings or history routes for game state.

---

## 7. Quality gate

Run all of these and fix every failure before reporting progress:

```
npm run typecheck
npm run lint
npm test
npm run build
npx vite preview --port 4173 &
python3 -I scripts/review.py "http://localhost:4173/?review" scripts/out mobile
```

`?review` exposes `window.__rizal` (player, area, camera) and lets the simulation keep real time in slow headless browsers.
Extend `scripts/review.py` with a scenario for each new area: teleport to each stop, open its card, take screenshots at 1280 x 800 and 390 x 844.
Open every screenshot and check: nothing clipped or overlapping, the rider is visible, the card does not hide the subject, colors match the palette, text is readable, and the scene looks finished from the camera's angle.

Performance budget per area on a mid-range Android phone: under 60 draw calls for static geometry, under 150k triangles, and no frame over 25 ms during normal riding.
Log `renderer.info.render.calls` and `.triangles` in review mode and report them.

---

## 8. Definition of done for this handoff

1. You can ride from Marseille 1882 through Paris 1883, 1885 and 1889, Biarritz and Marseille 1891 to the finale, using only the in-game travel actions.
2. Every stop in `stories.ts` is placed, opens its card, and fills its brochure panel.
3. The tower time-lapse plays between Paris 1885 and 1889 and matches the keyframes in section 4.2.
4. The finale brochure, its references list and the read-as-brochure fallback work.
5. The quality gate passes, and you have reviewed the screenshots of every stop on desktop and phone.
6. `NOTES-FROM-AGENT.md` lists anything you were unsure about, any fact that looked wrong, and anything left unfinished.
7. Work is committed in small commits with clear messages and no attribution lines.
