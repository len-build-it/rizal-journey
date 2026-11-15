import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/instrument-sans/wght.css';
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
import type { StopMarker } from './world/StopMarker';
import { journeyFrom } from './content/journeys';
import { chapterFor } from './content/narrative';
import type { Destination } from './content/stories';
import { ChapterCard } from './ui/ChapterCard';
import { Hud } from './ui/Hud';
import { StoryCard } from './ui/StoryCard';
import { Joystick } from './ui/Joystick';
import { showIntro } from './ui/Intro';
import { playTowerTimelapse, playTrainJourney } from './ui/Travel';
import { showBrochureView } from './ui/BrochureView';
import { SceneDirector } from './story/SceneDirector';

async function main(): Promise<void> {
  const canvas = document.getElementById('scene') as HTMLCanvasElement;
  const uiRoot = document.getElementById('ui') as HTMLElement;

  const engine = new Engine(canvas);
  await engine.initPhysics();
  const touch = engine.quality.mobile;
  document.documentElement.classList.toggle('is-touch', touch);

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
  hud.setPanels(filled);

  const player = new Player(
    engine.rapier,
    engine.world,
    engine.scene,
    new THREE.Vector3(0, 0, 0),
    0,
  );
  const areaManager = new AreaManager(engine, player, cam, hud);
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
  let cinematic = false;
  let traveling = false;
  const camTarget = new THREE.Vector3();

  const persist = (): void => {
    state = {
      destination: areaManager.destination ?? state.destination,
      visited: [...visited],
      panels: [...filled],
      completed: state.completed,
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

  const travelTo = async (fromStoryId: string, to: Destination): Promise<void> => {
    if (traveling) return;
    if (to.area === 'finale') {
      input.enabled = false;
      hud.showPrompt(null);
      state.completed = true;
      persist();
      showBrochureView(uiRoot, {
        mode: 'finale',
        visited,
        backLabel: 'Back to riding',
        onBack: () => {
          input.enabled = true;
          canvas.focus({ preventScroll: true });
        },
      });
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

    if (journey?.mode === 'tower') {
      const area = await areaManager.load(dest, visited);
      cinematic = true;
      await playTowerTimelapse(uiRoot, journey, engine.camera, area);
      cinematic = false;
      cam.snap(player.position);
    } else if (journey?.mode === 'train') {
      await playTrainJourney(uiRoot, journey, async () => {
        await areaManager.load(dest, visited);
      });
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
    canvas.focus({ preventScroll: true });
  };

  hud.onPrompt = () => current && !card.open && !traveling && playStopScene(current);

  engine.onUpdate((dt, time) => {
    const area = areaManager.current;
    if (!area) return;

    input.update();
    player.update(dt, input, cam.yaw);
    area.update(dt, time);

    if (director.isPlaying) {
      director.update(dt, time);
      for (const s of area.stops) s.update(dt, time, player.position);
      return;
    }

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

      camTarget.copy(focusOverride ?? player.position);
      cam.update(
        dt,
        camTarget,
        focusOverride ? 0 : player.heading,
        focusOverride ? 0 : player.speed,
      );
    } else {
      for (const s of area.stops) s.update(dt, time, player.position);
    }

    engine.followSun(
      cinematic && area.towerCenter ? area.towerCenter : player.position,
      area.look.sunDirection,
    );
    const fog = engine.scene.fog as THREE.Fog;
    fog.near = cam.currentDistance + area.look.fogNear - 30;
    fog.far = cam.currentDistance + area.look.fogFar - 30;
  });

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
        renderStats: () => ({
          calls: engine.renderer.info.render.calls,
          staticCalls: areaManager.current?.staticDrawCalls ?? 0,
          triangles: engine.renderer.info.render.triangles,
        }),
      },
    });
  }

  engine.start();
  document.documentElement.classList.add('is-ready');

  const beginPlaying = async (): Promise<void> => {
    document.documentElement.classList.remove('is-intro');
    syncHudGoal();
    const ch = currentChapter();
    if (ch) await chapterCard.show(ch);
    input.enabled = true;
    canvas.focus({ preventScroll: true });
  };

  document.documentElement.classList.add('is-intro');
  let introEl: HTMLElement | null = null;
  const openIntro = (): void => {
    introEl = showIntro(uiRoot, touch, {
      hasContinue: hasSavedProgress(saved),
      onContinue: () => void beginPlaying(),
      onStart: async () => {
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
