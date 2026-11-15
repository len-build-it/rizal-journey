import '@fontsource-variable/bodoni-moda/opsz.css';
import '@fontsource-variable/instrument-sans/wght.css';
import './styles.css';
import * as THREE from 'three';
import { Engine } from './core/Engine';
import { Input } from './core/Input';
import { FollowCamera } from './core/FollowCamera';
import { Player } from './player/Player';
import { buildMarseille1882 } from './world/areas/marseille1882';
import type { Area } from './world/Area';
import type { StopMarker } from './world/StopMarker';
import type { Destination } from './content/stories';
import { Hud } from './ui/Hud';
import { StoryCard } from './ui/StoryCard';
import { Joystick } from './ui/Joystick';
import { showIntro } from './ui/Intro';

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

  const ctx = { rapier: engine.rapier, world: engine.world };
  const area: Area = buildMarseille1882(engine.scene, ctx);
  applyLook(engine, area);
  hud.setPlace('1882', 'Marseille');

  const player = new Player(
    engine.rapier,
    engine.world,
    engine.scene,
    area.spawn,
    area.spawnHeading,
  );
  cam.snap(player.position);

  const filled = new Set<number>([1]);
  hud.setPanels(filled);

  let current: StopMarker | null = null;
  let focusOverride: THREE.Vector3 | null = null;
  const camTarget = new THREE.Vector3();

  const openStory = (stop: StopMarker): void => {
    input.enabled = false;
    focusOverride = stop.focus ?? null;
    const narrow = innerWidth <= 640;
    cam.framing.zoom = stop.focus ? (narrow ? 2.3 : 1.9) : 0.8;
    cam.framing.shiftX = narrow ? 0 : 0.16;
    cam.framing.shiftY = narrow ? 0.3 : 0;
    hud.showPrompt(null);
    const firstVisit = !stop.visited;
    stop.visited = true;
    if (firstVisit && !filled.has(stop.story.panel)) {
      filled.add(stop.story.panel);
      hud.setPanels(filled);
    }
    card.show(stop.story, {
      onClose: () => {
        input.enabled = true;
        focusOverride = null;
        cam.framing.zoom = 1;
        cam.framing.shiftX = 0;
        cam.framing.shiftY = 0;
      },
      onAction: (story) => {
        card.hide();
        if (story.action) travelTo(story.action.to);
      },
    });
  };
  // Travel between areas. Only Marseille 1882 exists so far; see HANDOFF.md.
  const travelTo = (to: Destination): void => {
    const label = to.area === 'paris' ? `Paris, ${to.era}` : to.area;
    hud.toast(`${label} is still being built. Check back soon.`);
  };

  hud.onPrompt = () => current && !card.open && openStory(current);

  engine.onUpdate((dt, time) => {
    input.update();
    player.update(dt, input, cam.yaw);
    area.update(dt, time);

    let inside: StopMarker | null = null;
    for (const s of area.stops) if (s.update(dt, time, player.position)) inside = s;
    if (inside !== current) {
      current = inside;
      hud.showPrompt(current && !card.open ? `Read: ${current.story.title}` : null);
    }
    if (current && input.interactPressed && !card.open) openStory(current);

    camTarget.copy(focusOverride ?? player.position);
    cam.update(dt, camTarget, focusOverride ? 0 : player.heading, focusOverride ? 0 : player.speed);
    engine.followSun(player.position, area.look.sunDirection);
    const fog = engine.scene.fog as THREE.Fog;
    fog.near = cam.currentDistance + area.look.fogNear - 30;
    fog.far = cam.currentDistance + area.look.fogFar - 30;
  });

  if (new URLSearchParams(location.search).has('review')) {
    // Headless review runs render slowly; let the simulation keep real time.
    engine.maxSteps = 60;
    Object.assign(window, { __rizal: { player, area, cam } });
  }

  engine.start();
  document.documentElement.classList.add('is-ready');

  document.documentElement.classList.add('is-intro');
  showIntro(uiRoot, touch, () => {
    document.documentElement.classList.remove('is-intro');
    input.enabled = true;
    canvas.focus({ preventScroll: true });
  });
}

function applyLook(engine: Engine, area: Area): void {
  const l = area.look;
  engine.scene.background = new THREE.Color(l.sky);
  engine.scene.fog = new THREE.Fog(l.fog, l.fogNear, l.fogFar);
  engine.sun.color.set(l.sunColor);
  engine.sun.intensity = l.sunIntensity;
  engine.hemi.color.set(l.hemiSky);
  engine.hemi.groundColor.set(l.hemiGround);
  engine.hemi.intensity = l.hemiIntensity;
}

main().catch((err: unknown) => {
  console.error(err);
  const box = document.getElementById('ui');
  if (box) {
    box.textContent =
      'This page needs WebGL to show the 3D world. Try a recent version of Chrome, Edge, Safari or Firefox.';
    box.className = 'fatal';
  }
});
