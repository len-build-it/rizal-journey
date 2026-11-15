import type * as THREE from 'three';
import type { Area, AreaLook } from '../../world/Area';
import type { StopMarker } from '../../world/StopMarker';
import type { PersonActor, PersonOptions, CrowdSpec, buildCrowd } from '../figures';

export interface SceneContext {
  readonly stop: StopMarker;
  readonly area: Area;
  readonly threeScene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly rizal: PersonActor;
  readonly duration: number;
  actor(opts: PersonOptions, x: number, y: number, z: number, ry?: number): PersonActor;
  crowd(specs: CrowdSpec[]): ReturnType<typeof buildCrowd>;
  prop<T extends THREE.Object3D>(obj: T): T;
  setLook(override: Partial<AreaLook>): void;
  cutCamera(pos: THREE.Vector3, target: THREE.Vector3): void;
  moveCamera(pos: THREE.Vector3, target: THREE.Vector3, dt: number, damping?: number): void;
  onDispose(fn: () => void): void;
}

export interface SceneScript {
  storyId: string;
  duration?: number;
  setup(ctx: SceneContext): void;
  update(ctx: SceneContext, elapsed: number, dt: number): void;
}
