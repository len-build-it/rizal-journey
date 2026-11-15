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
import type { Destination } from './content/stories';
import { Hud } from './ui/Hud';
import { StoryCard } from './ui/StoryCard';
import { Joystick } from './ui/Joystick';
import { showIntro } from './ui/Intro';
import { playTowerTimelapse, playTrainJourney } from './ui/Travel';
import { showBrochureView } from './ui/BrochureView';

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
  await areaManager.load(state.destination, visited);

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

  const openStory = (stop: StopMarker): void => {
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

    persist();
    traveling = false;
    input.enabled = true;
    canvas.focus({ preventScroll: true });
  };

  hud.onPrompt = () => current && !card.open && !traveling && openStory(current);

  engine.onUpdate((dt, time) => {
    const area = areaManager.current;
    if (!area) return;

    input.update();
    player.update(dt, input, cam.yaw);
    area.update(dt, time);

    if (!cinematic && !traveling) {
      let inside: StopMarker | null = null;
      for (const s of area.stops) if (s.update(dt, time, player.position)) inside = s;
      if (inside !== current) {
        current = inside;
        hud.showPrompt(current && !card.open ? `Read: ${current.story.title}` : null);
      }
      if (current && input.interactPressed && !card.open) openStory(current);

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
        get area() {
          return areaManager.current;
        },
        loadArea: async (dest: AreaDestination) => {
          card.hide();
          current = null;
          await areaManager.load(dest, visited);
        },
        openStop: (id: string) => {
          const stop = areaManager.current?.stops.find((s) => s.story.id === id);
          if (stop) {
            player.teleport(stop.position, 0);
            openStory(stop);
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

  const beginPlaying = (): void => {
    document.documentElement.classList.remove('is-intro');
    input.enabled = true;
    canvas.focus({ preventScroll: true });
  };

  document.documentElement.classList.add('is-intro');
  let introEl: HTMLElement | null = null;
  const openIntro = (): void => {
    introEl = showIntro(uiRoot, touch, {
      hasContinue: hasSavedProgress(saved),
      onContinue: beginPlaying,
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
        beginPlaying();
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
