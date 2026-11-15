import type RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

export interface PhysicsCtx {
  rapier: typeof RAPIER;
  world: RAPIER.World;
  colliders?: RAPIER.Collider[];
  bodies?: RAPIER.RigidBody[];
}

export function createPhysicsCtx(rapier: typeof RAPIER, world: RAPIER.World): PhysicsCtx {
  return { rapier, world, colliders: [], bodies: [] };
}

export function disposePhysics(ctx: PhysicsCtx): void {
  if (ctx.bodies) {
    for (const body of ctx.bodies) {
      if (ctx.world.getRigidBody(body.handle)) ctx.world.removeRigidBody(body);
    }
    ctx.bodies.length = 0;
  }
  if (ctx.colliders) {
    for (const collider of ctx.colliders) {
      if (ctx.world.getCollider(collider.handle)) ctx.world.removeCollider(collider, false);
    }
    ctx.colliders.length = 0;
  }
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
  rx = 0,
  rz = 0,
): void {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  const c = ctx.world.createCollider(
    ctx.rapier.ColliderDesc.cuboid(w / 2, h / 2, d / 2)
      .setTranslation(x, y, z)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }),
  );
  ctx.colliders?.push(c);
}

export function staticCylinder(
  ctx: PhysicsCtx,
  x: number,
  z: number,
  radius: number,
  height: number,
  y = height / 2,
): void {
  const c = ctx.world.createCollider(
    ctx.rapier.ColliderDesc.cylinder(height / 2, radius).setTranslation(x, y, z),
  );
  ctx.colliders?.push(c);
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
