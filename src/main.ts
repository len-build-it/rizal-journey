import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/literata/standard.css';
import '@fontsource-variable/literata/standard-italic.css';
import './ui/kit/kit.css';
import './ui/brochure/brochure.css';
import './styles.css';
import * as THREE from 'three';
import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { FollowCamera } from './core/FollowCamera';
import {
  allOtherStopsVisited,
  clearProgress,
  hasSavedProgress,
  initialProgress,
  loadProgress,
  saveProgress,
  type AreaDestination,
  type ProgressState,
} from './core/progress';
import { Player } from './player/Player';
import { AreaManager } from './world/AreaManager';
import { PathTrail } from './world/PathTrail';
import {
  outsidePlayDistance,
  setEdgeShadingEnabled,
  setPopupEnabled,
  setPopupFocus,
  setPopupRange,
} from './world/paperShader';
import type { StopMarker } from './world/StopMarker';
import { palette } from './world/palette';
import { journeyFrom } from './content/journeys';
import { chapterFor } from './content/narrative';
import type { Destination } from './content/stories';
import { ChapterCard } from './ui/ChapterCard';
import { Hud } from './ui/Hud';
import { StoryCard } from './ui/StoryCard';
import { Joystick } from './ui/Joystick';
import { showIntro } from './ui/Intro';
import { DeskScene } from './ui/DeskScene';
import { playInkWipe, playTowerTimelapse, playTrainJourney } from './ui/Travel';
import { showBrochureView } from './ui/BrochureView';
import { overflowingPanels } from './ui/brochure/renderBrochure';
import { SceneDirector } from './story/SceneDirector';
import { captureStorySnapshot } from './story/snapshot';
import {
  PERSON_LEG_LENGTH,
  PersonActor,
  rolePreset,
  strideOmega,
  type PersonAction,
  type PersonRole,
} from './story/figures';
import {
  buildCatGeometry,
  buildDogGeometry,
  buildDuckGeometry,
  buildFishGeometry,
  buildHarnessHorseGeometry,
  buildPigeonGeometry,
  buildSeagullGeometry,
  buildSheepGeometry,
  previewAnimalMesh,
} from './world/life/animals';
import {
  AnimMode,
  InstancedPool,
  bakePersonGeometry,
  prepareLifeGeometry,
  setLifeFrame,
} from './world/life/instancing';
import {
  buildCartGeometry,
  buildFiacreGeometry,
  buildHandcartGeometry,
  buildOmnibusGeometry,
  buildPennyFarthingGeometry,
  buildRowingBoatGeometry,
  previewVehicleMesh,
} from './world/life/vehicles';

async function main(): Promise<void> {
  const canvas = document.getElementById('scene') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui') as HTMLElement;

  const engine = new Engine(canvas);
  await engine.initPhysics();
  const touch = engine.quality.mobile;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.toggle('is-touch', touch);
  setEdgeShadingEnabled(!touch);
  setPopupEnabled(!touch && !reducedMotion);

  const input = new Input();
  input.enabled = false;
  const cam = new FollowCamera(engine.camera);
  const hud = new Hud(uiRoot, touch);
  const card = new StoryCard(uiRoot);
  const chapterCard = new ChapterCard(uiRoot);
  if (touch) new Joystick(uiRoot, input);

  const saved = loadProgress();
  let state: ProgressState = saved ?? initialProgress();
  const visited = new Set<string>(state.visited);
  const filled = new Set<number>(state.panels);
  const snapshots: Record<string, string> = { ...(state.snapshots ?? {}) };
  hud.setPanels(filled);

  const player = new Player(
    engine.rapier,
    engine.world,
    engine.scene,
    new THREE.Vector3(0, 0, 0),
    0,
  );
  const areaManager = new AreaManager(engine, player, cam, hud);
  const pathTrail = new PathTrail(engine.scene);
  const director = new SceneDirector(engine, player, cam, hud, card, uiRoot);

  const currentChapter = () => {
    const d = areaManager.destination;
    if (!d) return undefined;
    return chapterFor(d.area, d.area === 'paris' ? d.era : undefined);
  };

  const syncHudGoal = (): void => {
    const area = areaManager.current;
    const ch = currentChapter();
    if (!area || !ch) {
      hud.setGoal(null);
      return;
    }
    const stationStop = area.stops.find((s) => Boolean(s.story.action));
    if (stationStop && allOtherStopsVisited(area, stationStop.story.id, visited)) {
      hud.setGoal(`Next: ${stationStop.story.title}`);
    } else {
      hud.setGoal(ch.goal);
    }
  };

  await areaManager.load(state.destination, visited);
  syncHudGoal();

  let current: StopMarker | null = null;
  let focusOverride: THREE.Vector3 | null = null;
  let areaPan: { target: THREE.Vector3; elapsed: number } | null = null;
  let cinematic = false;
  let traveling = false;
  let resettingEdge = false;
  let popupReveal = 1;
  const camTarget = new THREE.Vector3();

  const cancelAreaPan = (): void => {
    if (!areaPan) return;
    areaPan = null;
    if (reducedMotion) cam.snap(player.position);
  };
  const startAreaOpenPan = (): void => {
    const first = areaManager.current?.stops.find((s) => !visited.has(s.story.id));
    if (!first) return;
    const focusPt = first.focus
      ? first.position.clone().lerp(first.focus, 0.35)
      : first.position.clone();
    areaPan = { target: focusPt, elapsed: 0 };
    if (reducedMotion) cam.snap(focusPt);
  };
  window.addEventListener('keydown', cancelAreaPan);
  window.addEventListener('pointerdown', cancelAreaPan);

  const animatePopupReveal = (from: number, to: number, ms: number): Promise<void> => {
    if (reducedMotion || touch || ms <= 0) {
      popupReveal = to;
      return Promise.resolve();
    }
    popupReveal = from;
    return new Promise((resolve) => {
      const start = performance.now();
      const tick = (now: number): void => {
        const u = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - u, 3);
        popupReveal = from + (to - from) * eased;
        if (u >= 1) {
          popupReveal = to;
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const persist = (): void => {
    state = {
      destination: areaManager.destination ?? state.destination,
      visited: [...visited],
      panels: [...filled],
      completed: state.completed,
      snapshots,
    };
    saveProgress(state);
  };

  const openStoryCard = (stop: StopMarker): void => {
    const area = areaManager.current;
    if (!area || traveling) return;
    input.enabled = false;
    focusOverride = stop.focus ?? null;
    const narrow = innerWidth <= 640;
    cam.framing.zoom = stop.focus ? (stop.focusZoom ?? (narrow ? 2.3 : 1.9)) : 0.8;
    cam.framing.shiftX = narrow ? 0 : 0.16;
    cam.framing.shiftY = narrow ? 0.3 : 0;
    hud.showPrompt(null);

    stop.visited = true;
    visited.add(stop.story.id);
    if (!filled.has(stop.story.panel)) {
      filled.add(stop.story.panel);
      hud.setPanels(filled);
    }
    syncHudGoal();
    persist();

    const ready = allOtherStopsVisited(area, stop.story.id, visited);
    card.show(stop.story, {
      actionDisabled: !ready,
      actionLabel: 'Visit the other stops first',
      onClose: () => {
        if (!traveling) input.enabled = true;
        focusOverride = null;
        cam.framing.zoom = 1;
        cam.framing.shiftX = 0;
        cam.framing.shiftY = 0;
      },
      onAction: (story) => {
        card.hide();
        if (story.action) void travelTo(story.id, story.action.to);
      },
    });
  };

  const playStopScene = (stop: StopMarker): void => {
    const area = areaManager.current;
    if (!area || traveling || director.isPlaying) return;
    const ready = allOtherStopsVisited(area, stop.story.id, visited);
    if (stop.story.action && !ready) {
      openStoryCard(stop);
      return;
    }

    input.enabled = false;
    hud.showPrompt(null);
    stop.visited = true;
    visited.add(stop.story.id);
    if (!filled.has(stop.story.panel)) {
      filled.add(stop.story.panel);
      hud.setPanels(filled);
    }
    syncHudGoal();
    persist();

    cinematic = true;
    director.play(stop, area, {
      actionReady: ready,
      onCaptureSnapshot: (storyId) => {
        setPopupFocus(director.focusTarget ?? cam.focusPosition);
        setPopupRange(48, 62);
        const url = captureStorySnapshot(engine);
        if (url) {
          snapshots[storyId] = url;
          persist();
        }
      },
      onEnd: () => {
        cinematic = false;
        if (!traveling) input.enabled = true;
        canvas.focus({ preventScroll: true });
      },
      onTravel: (id, to) => {
        cinematic = false;
        void travelTo(id, to);
      },
    });
  };

  const openFinaleView = (): void => {
    showBrochureView(uiRoot, {
      mode: 'finale',
      visited,
      snapshots,
      backLabel: 'Back to riding',
      onBack: () => {
        input.enabled = true;
        canvas.focus({ preventScroll: true });
      },
    });
  };

  const travelTo = async (fromStoryId: string, to: Destination): Promise<void> => {
    if (traveling) return;
    if (to.area === 'finale') {
      traveling = true;
      input.enabled = false;
      hud.showPrompt(null);
      state.completed = true;
      persist();
      if (!reducedMotion) {
        document.documentElement.classList.add('is-closing');
        await animatePopupReveal(1, 0, 750);
        const closingDesk = new DeskScene();
        await closingDesk.ready();
        engine.setOverrideRender(closingDesk.scene, closingDesk.camera);
        await closingDesk.playCloseFold();
        await new Promise((r) => setTimeout(r, 320));
        engine.setOverrideRender(null, null);
        closingDesk.dispose();
        popupReveal = 1;
        document.documentElement.classList.remove('is-closing');
      }
      traveling = false;
      openFinaleView();
      return;
    }

    traveling = true;
    input.enabled = false;
    hud.showPrompt(null);
    current = null;
    focusOverride = null;
    cam.framing.zoom = 1;
    cam.framing.shiftX = 0;
    cam.framing.shiftY = 0;

    const journey = journeyFrom(fromStoryId);
    const dest: AreaDestination = to;
    const captured = journey?.mode === 'train' ? engine.captureFrame() : null;

    if (journey?.mode === 'tower') {
      const area = await areaManager.load(dest, visited);
      cinematic = true;
      await playTowerTimelapse(uiRoot, journey, engine.camera, area);
      cinematic = false;
      cam.snap(player.position);
    } else if (journey?.mode === 'train') {
      await playTrainJourney(uiRoot, journey, captured, async () => {
        await areaManager.load(dest, visited);
      });
      if (!reducedMotion && !touch) {
        popupReveal = 0;
        void animatePopupReveal(0, 1, 900);
      }
    } else {
      await areaManager.load(dest, visited);
    }

    syncHudGoal();
    persist();
    traveling = false;
    const nextChapter = currentChapter();
    if (nextChapter) {
      await chapterCard.show(nextChapter);
    }
    input.enabled = true;
    startAreaOpenPan();
    canvas.focus({ preventScroll: true });
  };

  hud.onPrompt = () => current && !card.open && !traveling && playStopScene(current);

  engine.onUpdate((dt, time) => {
    const area = areaManager.current;
    if (!area) return;

    input.update();
    player.update(dt, input, cam.yaw);
    const excludeCenters: THREE.Vector3[] = [];
    if (director.isPlaying) {
      if (director.activeStop) excludeCenters.push(director.activeStop.position);
      if (director.focusTarget) excludeCenters.push(director.focusTarget);
    }
    const lifeFocus =
      director.isPlaying && director.focusTarget ? director.focusTarget : cam.focusPosition;
    area.setLifeContext?.({
      playerPos: player.position,
      playerHeading: player.heading,
      playerSpeed: player.speed,
      focusPos: lifeFocus,
      excludeCenters,
      excludeRadius: 14,
    });
    area.update(dt, time);
    setLifeFrame(time, lifeFocus);

    if (director.isPlaying) {
      director.update(dt, time);
      for (const s of area.stops) {
        s.group.visible = false;
        s.update(dt, time, player.position);
      }
      pathTrail.update(area, player.position, visited, true, time);
      hud.updateArrow(null, null, engine.camera, true);
      setPopupFocus(director.focusTarget ?? cam.focusPosition);
      setPopupRange(48, 62);
      return;
    }

    const hideGuides = chapterCard.open || card.open || cinematic || traveling;
    for (const s of area.stops) s.group.visible = !hideGuides;

    if (!cinematic && !traveling) {
      let inside: StopMarker | null = null;
      for (const s of area.stops) if (s.update(dt, time, player.position)) inside = s;
      if (inside !== current) {
        current = inside;
        if (!current) {
          hud.showPrompt(null);
        } else {
          const lockedStation =
            Boolean(current.story.action) &&
            !allOtherStopsVisited(area, current.story.id, visited);
          if (lockedStation) {
            hud.showPrompt('Visit the other stops first');
          } else if (!current.visited && input.enabled && !card.open) {
            playStopScene(current);
          } else if (!card.open) {
            hud.showPrompt(`Replay: ${current.story.title}`);
          }
        }
      }
      if (current && input.interactPressed && !card.open) playStopScene(current);

      if (!resettingEdge && area.playBounds && input.enabled) {
        const b = area.playBounds;
        const outDist = outsidePlayDistance(player.position, b);
        if (outDist > 0) {
          const cx = (b.minX + b.maxX) * 0.5;
          const cz = (b.minZ + b.maxZ) * 0.5;
          const inward = Math.atan2(cx - player.position.x, cz - player.position.z);
          if (player.speed > 0.2) {
            player.steerToward(inward, 0.5 + Math.min(1, outDist / 25) * 2.2, dt);
          }
          if (outDist > 30) {
            resettingEdge = true;
            input.enabled = false;
            void playInkWipe(uiRoot, () => {
              const nx = THREE.MathUtils.clamp(player.position.x, b.minX + 3, b.maxX - 3);
              const nz = THREE.MathUtils.clamp(player.position.z, b.minZ + 3, b.maxZ - 3);
              const faceIn = Math.atan2(cx - nx, cz - nz);
              player.teleport(new THREE.Vector3(nx, player.position.y, nz), faceIn);
              cam.snap(player.position);
            }).then(() => {
              resettingEdge = false;
              input.enabled = true;
            });
          }
        }
      }

      if (areaPan) {
        if (input.x !== 0 || input.y !== 0 || input.interactPressed) {
          cancelAreaPan();
        } else {
          areaPan.elapsed += dt;
          if (areaPan.elapsed >= (reducedMotion ? 0.9 : 1.15)) {
            cancelAreaPan();
          }
        }
      }
      const panFocus = focusOverride ?? (areaPan ? areaPan.target : null);
      camTarget.copy(panFocus ?? player.position);
      cam.update(
        dt,
        camTarget,
        panFocus ? 0 : player.heading,
        panFocus ? 0 : player.speed,
      );
    } else {
      for (const s of area.stops) s.update(dt, time, player.position);
    }

    const nextTarget = pathTrail.update(area, player.position, visited, hideGuides, time);
    engine.camera.updateMatrixWorld();
    hud.updateArrow(nextTarget?.position ?? null, nextTarget?.story.title ?? null, engine.camera, hideGuides);
    setPopupFocus(cam.focusPosition);
    if (popupReveal <= 0.001) {
      setPopupRange(-1, 0);
    } else {
      setPopupRange(26 * popupReveal, 36 * popupReveal);
    }

    engine.followSun(
      cinematic && area.towerCenter ? area.towerCenter : player.position,
      area.look.sunDirection,
    );
    const fog = engine.scene.fog as THREE.Fog;
    fog.near = cam.currentDistance + area.look.fogNear - 30;
    fog.far = cam.currentDistance + area.look.fogFar - 30;
  });

  let openingDesk: DeskScene | null = null;
  let stripStage: {
    who: string;
    group: THREE.Group;
    pool: InstancedPool;
    speed: number;
    legLength: number;
    mode: number;
    camZ: number;
    camY: number;
    lookY: number;
    midX: number;
  } | null = null;

  const disposeWalkStrip = (): void => {
    if (!stripStage) return;
    stripStage.pool.dispose();
    stripStage.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
    stripStage.group.removeFromParent();
    stripStage = null;
    player.setSceneVisible(true);
    hud.root.style.display = '';
    cinematic = false;
  };

  if (new URLSearchParams(location.search).has('review')) {
    // Headless review runs render slowly; let the simulation keep real time.
    engine.maxSteps = 60;
    Object.assign(window, {
      __rizal: {
        player,
        cam,
        director,
        get area() {
          return areaManager.current;
        },
        loadArea: async (dest: AreaDestination) => {
          cancelAreaPan();
          director.cleanup();
          chapterCard.hide();
          cinematic = false;
          card.hide();
          current = null;
          await areaManager.load(dest, visited);
          syncHudGoal();
        },
        showChapterCard: () => {
          const ch = currentChapter();
          if (ch) void chapterCard.show(ch);
        },
        openStop: (id: string) => {
          const stop = areaManager.current?.stops.find((s) => s.story.id === id);
          if (stop) {
            chapterCard.hide();
            player.teleport(stop.position, 0);
            openStoryCard(stop);
          }
        },
        playScene: (id: string) => {
          const stop = areaManager.current?.stops.find((s) => s.story.id === id);
          if (stop) {
            chapterCard.hide();
            player.teleport(stop.position, 0);
            playStopScene(stop);
          }
        },
        closeCard: () => card.hide(),
        openFinale: (instant = true) => {
          if (instant) {
            state.completed = true;
            persist();
            openFinaleView();
          } else {
            void travelTo('marseille-1891-lessons', { area: 'finale' });
          }
        },
        travelSample: (fromId: string, to: AreaDestination) => travelTo(fromId, to),
        setDeskFold: (u: number) => openingDesk?.setFold(u),
        snapshots,
        showLifeShowcase: () => {
          cinematic = true;
          chapterCard.hide();
          hud.showPrompt(null);
          const group = new THREE.Group();
          const roles: [PersonRole, PersonAction][] = [
            ['dockWorker', 'carry'],
            ['fisherman', 'fish'],
            ['marketWoman', 'stroll'],
            ['gentleman', 'readNewspaper'],
            ['lady', 'stroll'],
            ['child', 'hurry'],
            ['nurse', 'walk'],
            ['coachman', 'sit'],
            ['gendarme', 'idle'],
            ['vendor', 'sweep'],
          ];
          const center = areaManager.current?.spawn.clone() ?? new THREE.Vector3();
          const actors: PersonActor[] = [];
          roles.forEach(([role, action], i) => {
            const x = center.x - 9 + (i % 5) * 3.6;
            const z = center.z - 5 + Math.floor(i / 5) * 3.8;
            const actor = new PersonActor(rolePreset(role, role === 'lady' && i % 2 === 1, i), x, center.y, z, 0.35);
            actor.setAction(action);
            actor.update(0, 1.2);
            group.add(actor.root);
            actors.push(actor);
          });
          const animalGeos = [
            buildPigeonGeometry(false),
            buildPigeonGeometry(true),
            buildSeagullGeometry(false),
            buildSeagullGeometry(true),
            buildDogGeometry(),
            buildCatGeometry(),
            buildSheepGeometry(),
            buildDuckGeometry(),
            buildFishGeometry(),
            buildHarnessHorseGeometry(),
          ];
          animalGeos.forEach((geo, i) => {
            const m = previewAnimalMesh(geo);
            m.position.set(center.x - 9 + i * 2.1, center.y + (i === 1 || i === 3 || i === 8 ? 0.5 : 0), center.z + 3.2);
            m.rotation.y = 0.45;
            group.add(m);
          });
          engine.scene.add(group);
          engine.camera.position.set(center.x + 14, center.y + 11, center.z - 12);
          engine.camera.lookAt(center.x - 1, center.y + 0.8, center.z - 0.5);
          return { count: actors.length + animalGeos.length };
        },
        showLifeInstancingTest: () => {
          cinematic = true;
          chapterCard.hide();
          hud.showPrompt(null);
          const group = new THREE.Group();
          const center = areaManager.current?.spawn.clone() ?? new THREE.Vector3();

          // 6 vehicle previews + 1 instanced pool each for 36 people & 18 birds.
          const vehicleGeos = [
            buildFiacreGeometry(),
            buildOmnibusGeometry(),
            buildCartGeometry('barrels'),
            buildHandcartGeometry(),
            buildPennyFarthingGeometry(),
            buildRowingBoatGeometry(),
          ];
          vehicleGeos.forEach((geo, i) => {
            const m = previewVehicleMesh(geo);
            m.position.set(center.x - 10 + i * 4.0, center.y, center.z - 4);
            m.rotation.y = 0.55;
            group.add(m);
          });

          const peoplePools = [
            new InstancedPool(bakePersonGeometry(rolePreset('gentleman', false, 0)), 14, 'test-gent'),
            new InstancedPool(bakePersonGeometry(rolePreset('lady', false, 1)), 14, 'test-lady'),
            new InstancedPool(bakePersonGeometry(rolePreset('dockWorker', false, 0)), 14, 'test-work'),
          ];
          const tints = [0xffffff, palette.shirt, palette.parisLimestone, palette.awningCream];
          peoplePools.forEach((pool, pi) => {
            for (let i = 0; i < 14; i++) {
              pool.setSlot(
                i,
                center.x - 12 + i * 1.8,
                center.y,
                center.z + 2 + pi * 2.2,
                0.35 + (i % 4) * 0.4,
                0.96 + (i % 3) * 0.03,
                AnimMode.Walk,
                i * 0.8 + pi,
                4.2,
                1.0,
                tints[i % tints.length],
              );
            }
            pool.commit(14, true);
            group.add(pool.mesh);
          });

          const gullPool = new InstancedPool(
            prepareLifeGeometry(buildSeagullGeometry(true), 'birdFly'),
            18,
            'test-gulls',
          );
          for (let i = 0; i < 18; i++) {
            gullPool.setSlot(
              i,
              center.x - 10 + i * 1.2,
              center.y + 3.4 + (i % 3) * 0.6,
              center.z - 1 + (i % 2) * 1.5,
              0.4,
              1.0,
              AnimMode.BirdFly,
              i * 0.7,
              6.5,
              1.0,
            );
          }
          gullPool.commit(18);
          group.add(gullPool.mesh);

          engine.scene.add(group);
          engine.camera.position.set(center.x - 10, center.y + 7.5, center.z + 14);
          engine.camera.lookAt(center.x, center.y + 1.0, center.z - 1);
          return { vehicles: vehicleGeos.length, people: 42, birds: 18 };
        },
        renderStats: () => ({
          calls: engine.renderer.info.render.calls,
          staticCalls: areaManager.current?.staticDrawCalls ?? 0,
          triangles: engine.renderer.info.render.triangles,
        }),
        lookAt: (px: number, py: number, pz: number, tx: number, ty: number, tz: number) => {
          cinematic = true;
          engine.camera.position.set(px, py, pz);
          engine.camera.lookAt(tx, ty, tz);
        },
        resetLook: () => {
          cinematic = false;
        },
        walkStripPose: (who: 'man' | 'woman' | 'child' | 'dog' | 'horse', t: number) => {
          const area = areaManager.current;
          if (!area) return;
          if (!stripStage || stripStage.who !== who) {
            disposeWalkStrip();
            cinematic = true;
            chapterCard.hide();
            hud.showPrompt(null);
            hud.root.style.display = 'none';
            player.setSceneVisible(false);
            const c = area.spawn;
            const stageY = c.y + 120;
            const group = new THREE.Group();
            const floorGeo = new THREE.BoxGeometry(12, 0.2, 6);
            const floorMat = new THREE.MeshStandardMaterial({
              color: palette.parisSidewalk,
              roughness: 0.9,
              flatShading: true,
            });
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.position.set(c.x, stageY - 0.1, c.z);
            floor.receiveShadow = true;
            group.add(floor);
            const tickGeo = new THREE.BoxGeometry(0.025, 0.008, 1.4);
            const tickMat = new THREE.MeshStandardMaterial({ color: palette.ink, roughness: 0.9 });
            for (let tx = -4; tx <= 4; tx += 0.25) {
              const tick = new THREE.Mesh(tickGeo, tickMat);
              tick.position.set(c.x + tx, stageY + 0.004, c.z);
              group.add(tick);
            }
            let geo: THREE.BufferGeometry;
            let speed = 1.22;
            let legLength = PERSON_LEG_LENGTH;
            let mode: number = AnimMode.Walk;
            let camZ = 4.6;
            let camY = 1.05;
            let lookY = 0.92;
            if (who === 'man') {
              geo = bakePersonGeometry(rolePreset('gentleman', false, 0));
            } else if (who === 'woman') {
              geo = bakePersonGeometry(rolePreset('lady', false, 1));
              camZ = 5.0;
              camY = 1.15;
              lookY = 1.02;
            } else if (who === 'child') {
              geo = bakePersonGeometry(rolePreset('child', false, 0));
              legLength = PERSON_LEG_LENGTH * 0.72;
              camZ = 3.6;
              camY = 0.82;
              lookY = 0.65;
            } else if (who === 'dog') {
              geo = prepareLifeGeometry(buildDogGeometry(), 'quad');
              speed = 1.1;
              legLength = 0.24;
              mode = AnimMode.Quad;
              camZ = 3.4;
              camY = 0.52;
              lookY = 0.34;
            } else {
              geo = prepareLifeGeometry(buildFiacreGeometry());
              speed = 2.6;
              legLength = 1.06;
              mode = AnimMode.Vehicle;
              camZ = 7.6;
              camY = 1.45;
              lookY = 1.02;
            }
            const pool = new InstancedPool(geo, 1, `walk-strip-${who}`);
            group.add(pool.mesh);
            engine.scene.add(group);
            const span = speed * 0.56;
            const midX = c.x + (who === 'horse' ? 1.1 : 0);
            stripStage = {
              who,
              group,
              pool,
              speed,
              legLength,
              mode,
              camZ,
              camY,
              lookY,
              midX: midX - span * 0.5 + span * 0.5,
            };
          }
          const st = stripStage;
          const c = area.spawn;
          const stageY = c.y + 120;
          const span = st.speed * 0.56;
          const startX = c.x - span * 0.5;
          const x = startX + st.speed * t;
          const phase = strideOmega(st.speed, st.legLength) * t;
          st.pool.setSlot(0, x, stageY, c.z, Math.PI * 0.5, 1, st.mode, phase, 0, 1.0, 0xffffff);
          st.pool.commit(1, true);
          const camTargetX = c.x + (who === 'horse' ? 1.8 : 0);
          cam.focusPosition.set(camTargetX, stageY, c.z);
          engine.camera.position.set(camTargetX, stageY + st.camY, c.z + st.camZ);
          engine.camera.lookAt(camTargetX, stageY + st.lookY, c.z);
          engine.followSun(new THREE.Vector3(camTargetX, stageY, c.z), area.look.sunDirection);
        },
        clearWalkStrip: disposeWalkStrip,
        overflowingPanels: () => {
          const el = document.querySelector<HTMLElement>('.b-brochure');
          return el ? overflowingPanels(el) : ['missing'];
        },
      },
    });
  }

  engine.start();
  document.documentElement.classList.add('is-ready');

  const beginPlaying = async (): Promise<void> => {
    if (openingDesk && !reducedMotion) {
      popupReveal = 0;
      await openingDesk.playOpen();
      engine.setOverrideRender(null, null);
      openingDesk.dispose();
      openingDesk = null;
      document.documentElement.classList.remove('is-intro');
      await animatePopupReveal(0, 1, 950);
    } else {
      engine.setOverrideRender(null, null);
      openingDesk?.dispose();
      openingDesk = null;
      popupReveal = 1;
      document.documentElement.classList.remove('is-intro');
    }
    syncHudGoal();
    const ch = currentChapter();
    if (ch) await chapterCard.show(ch);
    input.enabled = true;
    startAreaOpenPan();
    canvas.focus({ preventScroll: true });
  };

  openingDesk = new DeskScene();
  await openingDesk.ready();
  engine.setOverrideRender(openingDesk.scene, openingDesk.camera);

  document.documentElement.classList.add('is-intro');
  let introEl: HTMLElement | null = null;
  const openIntro = (): void => {
    introEl = showIntro(uiRoot, touch, {
      hasContinue: hasSavedProgress(saved),
      onOpen: () => void beginPlaying(),
      onRestart: async () => {
        visited.clear();
        filled.clear();
        filled.add(1);
        state = initialProgress();
        clearProgress();
        hud.setPanels(filled);
        if (areaManager.destination?.area !== 'marseille-1882') {
          await areaManager.load({ area: 'marseille-1882' }, visited);
        } else {
          for (const s of areaManager.current?.stops ?? []) s.visited = false;
          player.teleport(areaManager.current!.spawn, areaManager.current!.spawnHeading);
          cam.snap(player.position);
        }
        await beginPlaying();
      },
      onBrochure: () => {
        if (introEl) introEl.hidden = true;
        showBrochureView(uiRoot, {
          mode: 'fallback',
          backLabel: 'Back to title',
          onBack: () => {
            if (introEl) introEl.hidden = false;
          },
        });
      },
    });
  };
  openIntro();
}

main().catch((err: unknown) => {
  console.error(err);
  const box = document.getElementById('ui');
  if (box) {
    showBrochureView(box, {
      mode: 'fallback',
      note: '3D view is unavailable on this device, so here is the story as a readable brochure.',
    });
  }
});
