import * as THREE from 'three';
import type { Engine } from '../core/Engine';
import type { FollowCamera } from '../core/FollowCamera';
import type { Player } from '../player/Player';
import { scenesFor } from '../content/narrative';
import type { Destination } from '../content/stories';
import type { Area, AreaLook } from '../world/Area';
import { applyLook } from '../world/AreaManager';
import { disposeObject } from '../world/kit';
import type { StopMarker } from '../world/StopMarker';
import type { Hud } from '../ui/Hud';
import type { StoryCard } from '../ui/StoryCard';
import { buildCrowd, PersonActor, type CrowdSpec, type PersonOptions } from './figures';
import { SceneUI } from './SceneUI';
import { getSceneScript } from './scenes';
import type { SceneContext, SceneScript } from './scenes/types';

const CAPTION_SECONDS = 3.6;

export interface ScenePlayCallbacks {
  actionReady: boolean;
  onEnd: () => void;
  onTravel: (fromStoryId: string, to: Destination) => void;
}

/**
 * Orchestrates interactive stop scenes: dismounts Rizal, drives camera shots,
 * figures, temporary lighting overrides, subtitles with aria-live, and end-frame choices.
 */
export class SceneDirector {
  private readonly ui: SceneUI;
  private active: {
    stop: StopMarker;
    area: Area;
    script: SceneScript;
    ctx: SceneContext;
    captions: string[];
    captionIdx: number;
    elapsed: number;
    duration: number;
    phase: 'playing' | 'end';
    callbacks: ScenePlayCallbacks;
    lookOverridden: boolean;
    actors: PersonActor[];
    crowds: ReturnType<typeof buildCrowd>[];
    props: THREE.Object3D[];
    cleanups: (() => void)[];
    lastTarget: THREE.Vector3;
    snapCamNext: boolean;
  } | null = null;

  constructor(
    private readonly engine: Engine,
    private readonly player: Player,
    private readonly cam: FollowCamera,
    private readonly hud: Hud,
    private readonly card: StoryCard,
    uiRoot: HTMLElement,
  ) {
    this.ui = new SceneUI(uiRoot);
    window.addEventListener('keydown', (e) => {
      if (!this.active || this.card.open) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.active.phase === 'playing') {
          e.preventDefault();
          e.stopPropagation();
          this.advance();
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (this.active.phase === 'playing') {
          this.skipToEnd();
        } else {
          this.closeToRiding();
        }
      }
    });
  }

  get isPlaying(): boolean {
    return this.active !== null;
  }

  get currentPhase(): 'idle' | 'playing' | 'end' {
    return this.active ? this.active.phase : 'idle';
  }

  play(stop: StopMarker, area: Area, callbacks: ScenePlayCallbacks): void {
    if (this.active) this.cleanup();

    const captions = scenesFor(stop.story.id)?.captions ?? [stop.story.title];
    const script = getSceneScript(stop.story.id) ?? defaultScript(stop.story.id);
    const duration = script.duration ?? Math.max(9.5, captions.length * CAPTION_SECONDS);

    this.hud.showPrompt(null);
    this.player.setRiderMounted(false);
    for (const s of area.stops) s.group.visible = false;

    const actors: PersonActor[] = [];
    const crowds: ReturnType<typeof buildCrowd>[] = [];
    const props: THREE.Object3D[] = [];
    const cleanups: (() => void)[] = [];
    const lastTarget = (stop.focus ?? stop.position).clone();
    let lookOverridden = false;

    const rizal = new PersonActor(
      { coat: 'frock', hat: 'bowler' },
      stop.position.x + 1.0,
      stop.position.y,
      stop.position.z + 0.9,
      Math.PI * 0.25,
    );
    this.engine.scene.add(rizal.root);
    actors.push(rizal);

    const ctx: SceneContext = {
      stop,
      area,
      threeScene: this.engine.scene,
      camera: this.engine.camera,
      rizal,
      duration,
      actor: (opts: PersonOptions, x: number, y: number, z: number, ry = 0) => {
        const a = new PersonActor(opts, x, y, z, ry);
        this.engine.scene.add(a.root);
        actors.push(a);
        return a;
      },
      crowd: (specs: CrowdSpec[]) => {
        const c = buildCrowd(specs);
        this.engine.scene.add(c.group);
        crowds.push(c);
        return c;
      },
      prop: <T extends THREE.Object3D>(obj: T) => {
        this.engine.scene.add(obj);
        props.push(obj);
        return obj;
      },
      setLook: (override: Partial<AreaLook>) => {
        lookOverridden = true;
        if (this.active) this.active.lookOverridden = true;
        const merged: AreaLook = { ...area.look, ...override };
        this.engine.scene.background = new THREE.Color(merged.sky);
        this.engine.scene.fog = new THREE.Fog(merged.fog, merged.fogNear, merged.fogFar);
        this.engine.sun.color.set(merged.sunColor);
        this.engine.sun.intensity = merged.sunIntensity;
        this.engine.hemi.color.set(merged.hemiSky);
        this.engine.hemi.groundColor.set(merged.hemiGround);
        this.engine.hemi.intensity = merged.hemiIntensity;
      },
      cutCamera: (pos: THREE.Vector3, target: THREE.Vector3) => {
        this.engine.camera.position.copy(pos);
        this.engine.camera.lookAt(target);
        lastTarget.copy(target);
      },
      moveCamera: (pos: THREE.Vector3, target: THREE.Vector3, dt: number, damping = 2.6) => {
        if (this.active?.snapCamNext || dt <= 0) {
          this.engine.camera.position.copy(pos);
          lastTarget.copy(target);
          this.engine.camera.lookAt(lastTarget);
          if (this.active) this.active.snapCamNext = false;
          return;
        }
        const k = 1 - Math.exp(-damping * dt);
        this.engine.camera.position.lerp(pos, k);
        lastTarget.lerp(target, k);
        this.engine.camera.lookAt(lastTarget);
      },
      onDispose: (fn: () => void) => {
        cleanups.push(fn);
      },
    };

    this.active = {
      stop,
      area,
      script,
      ctx,
      captions,
      captionIdx: 0,
      elapsed: 0,
      duration,
      phase: 'playing',
      callbacks,
      lookOverridden,
      actors,
      crowds,
      props,
      cleanups,
      lastTarget,
      snapCamNext: true,
    };

    script.setup(ctx);
    script.update(ctx, 0, 0);

    this.ui.start({
      onAdvance: () => this.advance(),
      onReadMore: () => this.openReadMore(),
      onContinue: () => this.handleContinue(),
    });
    this.ui.setCaption(captions[0] ?? '');
  }

  update(dt: number, totalTime: number): void {
    const a = this.active;
    if (!a) return;

    if (a.phase === 'playing') {
      a.elapsed = Math.min(a.duration, a.elapsed + dt);
      const frac = a.elapsed / a.duration;
      const idx = Math.min(a.captions.length - 1, Math.floor(frac * a.captions.length));
      if (idx !== a.captionIdx) {
        a.captionIdx = idx;
        this.ui.setCaption(a.captions[idx] ?? '');
      }
      a.script.update(a.ctx, a.elapsed, dt);
      for (const actor of a.actors) actor.update(dt, totalTime);
      for (const c of a.crowds) c.update(totalTime);

      if (a.elapsed >= a.duration) {
        this.enterEndFrame();
      }
    } else {
      // Hold end frame gently alive without advancing timeline past duration.
      a.script.update(a.ctx, a.duration, 0);
      for (const actor of a.actors) actor.update(dt, totalTime);
    }

    // Keep sun shadow camera anchored cleanly around current shot target.
    this.engine.followSun(a.lastTarget, a.area.look.sunDirection);
    const fog = this.engine.scene.fog as THREE.Fog;
    const camDist = this.engine.camera.position.distanceTo(a.lastTarget);
    fog.near = camDist + a.area.look.fogNear - 30;
    fog.far = camDist + a.area.look.fogFar - 30;
  }

  advance(): void {
    const a = this.active;
    if (!a || a.phase !== 'playing') return;

    if (a.captionIdx + 1 < a.captions.length) {
      a.captionIdx += 1;
      const targetTime = (a.captionIdx / a.captions.length) * a.duration;
      this.stepSimulationTo(targetTime);
      this.ui.setCaption(a.captions[a.captionIdx] ?? '');
    } else {
      this.skipToEnd();
    }
  }

  skipToEnd(): void {
    const a = this.active;
    if (!a || a.phase === 'end') return;
    this.stepSimulationTo(a.duration);
    this.enterEndFrame();
  }

  private stepSimulationTo(targetElapsed: number): void {
    const a = this.active;
    if (!a) return;
    const step = 0.2;
    a.snapCamNext = true;
    while (a.elapsed < targetElapsed) {
      const next = Math.min(targetElapsed, a.elapsed + step);
      const dt = next - a.elapsed;
      a.elapsed = next;
      a.script.update(a.ctx, a.elapsed, dt);
      for (const actor of a.actors) actor.update(dt, a.elapsed);
    }
    a.snapCamNext = true;
    a.script.update(a.ctx, targetElapsed, 0);
  }

  private enterEndFrame(): void {
    const a = this.active;
    if (!a) return;
    a.phase = 'end';
    a.elapsed = a.duration;
    this.ui.showEndFrame(a.stop.story, a.callbacks.actionReady);
  }

  private openReadMore(): void {
    const a = this.active;
    if (!a) return;
    this.ui.hideActions();
    this.card.show(a.stop.story, {
      hideAction: true,
      onClose: () => {
        if (this.active === a) this.ui.showActions();
      },
    });
  }

  private handleContinue(): void {
    const a = this.active;
    if (!a) return;
    const action = a.stop.story.action;
    if (action && a.callbacks.actionReady) {
      const cb = a.callbacks;
      const storyId = a.stop.story.id;
      this.cleanup();
      cb.onTravel(storyId, action.to);
    } else {
      this.closeToRiding();
    }
  }

  closeToRiding(): void {
    const a = this.active;
    if (!a) return;
    const cb = a.callbacks;
    this.cleanup();
    cb.onEnd();
  }

  cleanup(): void {
    const a = this.active;
    if (!a) return;
    this.active = null;
    this.ui.hide();
    if (a.lookOverridden) applyLook(this.engine, a.area);
    for (const actor of a.actors) actor.rig.dispose();
    for (const c of a.crowds) c.dispose();
    for (const p of a.props) disposeObject(p);
    for (const fn of a.cleanups) fn();
    for (const s of a.area.stops) s.group.visible = true;
    this.cam.seedFocus(a.lastTarget);
    this.player.setRiderMounted(true);
  }
}

function defaultScript(storyId: string): SceneScript {
  const focus = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const camStart = new THREE.Vector3();
  const camEnd = new THREE.Vector3();
  return {
    storyId,
    setup(ctx) {
      focus.copy(ctx.stop.focus ?? ctx.stop.position);
      const yaw = Math.PI * 0.6;
      const d = 17;
      camStart.set(focus.x + Math.sin(yaw) * d, focus.y + 11, focus.z + Math.cos(yaw) * d);
      camEnd.set(
        focus.x + Math.sin(yaw - 0.14) * (d * 0.85),
        focus.y + 9.5,
        focus.z + Math.cos(yaw - 0.14) * (d * 0.85),
      );
      ctx.cutCamera(camStart, focus);
      ctx.rizal.setAction('idle');
    },
    update(ctx, elapsed, dt) {
      const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
      pos.lerpVectors(camStart, camEnd, THREE.MathUtils.smoothstep(u, 0, 1));
      ctx.moveCamera(pos, focus, dt, 3);
    },
  };
}
