import type * as THREE from 'three';
import type { PhysicsCtx } from '../physics';
import type { Area } from '../Area';
import { buildMarseille } from './marseille';

export function buildMarseille1882(scene: THREE.Scene, ctx: PhysicsCtx): Area {
  return buildMarseille(scene, ctx, 1882);
}
