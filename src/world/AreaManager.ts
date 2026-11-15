import * as THREE from 'three';
import type { Engine } from '../core/Engine';
import type { FollowCamera } from '../core/FollowCamera';
import type { Player } from '../player/Player';
import type { Hud } from '../ui/Hud';
import { destinationPlace, type AreaDestination } from '../core/progress';
import { createPhysicsCtx } from './physics';
import type { Area } from './Area';

/**
 * Owns area loading, disposal and transitions.
 * Areas are lazy-loaded via dynamic import so only the active area's geometry code is fetched.
 */
export class AreaManager {
  current: Area | null = null;
  destination: AreaDestination | null = null;

  constructor(
    private readonly engine: Engine,
    private readonly player: Player,
    private readonly cam: FollowCamera,
    private readonly hud: Hud,
  ) {}

  async load(dest: AreaDestination, visited: Set<string>): Promise<Area> {
    const build = await loadBuilder(dest);

    this.current?.dispose();
    const ctx = createPhysicsCtx(this.engine.rapier, this.engine.world);
    const area = build(this.engine.scene, ctx);

    for (const stop of area.stops) {
      stop.visited = visited.has(stop.story.id);
    }

    applyLook(this.engine, area);
    this.player.teleport(area.spawn, area.spawnHeading);
    this.cam.snap(this.player.position);

    const { year, place } = destinationPlace(dest);
    this.hud.setPlace(year, place);

    this.current = area;
    this.destination = dest;
    return area;
  }
}

async function loadBuilder(
  dest: AreaDestination,
): Promise<(scene: THREE.Scene, ctx: ReturnType<typeof createPhysicsCtx>) => Area> {
  switch (dest.area) {
    case 'marseille-1882': {
      const m = await import('./areas/marseille');
      return (scene, ctx) => m.buildMarseille(scene, ctx, 1882);
    }
    case 'marseille-1891': {
      const m = await import('./areas/marseille');
      return (scene, ctx) => m.buildMarseille(scene, ctx, 1891);
    }
    case 'paris': {
      const m = await import('./areas/paris');
      const era = dest.era;
      return (scene, ctx) => m.buildParis(scene, ctx, era);
    }
    case 'biarritz-1891': {
      const m = await import('./areas/biarritz1891');
      return (scene, ctx) => m.buildBiarritz1891(scene, ctx);
    }
  }
}

export function applyLook(engine: Engine, area: Area): void {
  const l = area.look;
  engine.scene.background = new THREE.Color(l.sky);
  engine.scene.fog = new THREE.Fog(l.fog, l.fogNear, l.fogFar);
  engine.sun.color.set(l.sunColor);
  engine.sun.intensity = l.sunIntensity;
  engine.hemi.color.set(l.hemiSky);
  engine.hemi.groundColor.set(l.hemiGround);
  engine.hemi.intensity = l.hemiIntensity;
}
