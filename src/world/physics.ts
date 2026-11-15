import type RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export interface PhysicsCtx {
  rapier: typeof RAPIER;
  world: RAPIER.World;
}

/** A fixed box collider; position is the box center, sizes are full sizes. */
export function staticBox(
  ctx: PhysicsCtx,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  ry = 0,
): void {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0));
  ctx.world.createCollider(
    ctx.rapier.ColliderDesc.cuboid(w / 2, h / 2, d / 2)
      .setTranslation(x, y, z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }),
  );
}

export function staticCylinder(
  ctx: PhysicsCtx,
  x: number,
  z: number,
  radius: number,
  height: number,
  y = height / 2,
): void {
  ctx.world.createCollider(
    ctx.rapier.ColliderDesc.cylinder(height / 2, radius).setTranslation(x, y, z),
  );
}

/** Invisible walls around a rectangular play area. */
export function boundary(
  ctx: PhysicsCtx,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): void {
  const h = 6;
  const t = 1;
  const w = maxX - minX;
  const d = maxZ - minZ;
  staticBox(ctx, (minX + maxX) / 2, h / 2, minZ - t / 2, w + 2 * t, h, t);
  staticBox(ctx, (minX + maxX) / 2, h / 2, maxZ + t / 2, w + 2 * t, h, t);
  staticBox(ctx, minX - t / 2, h / 2, (minZ + maxZ) / 2, t, h, d);
  staticBox(ctx, maxX + t / 2, h / 2, (minZ + maxZ) / 2, t, h, d);
}
