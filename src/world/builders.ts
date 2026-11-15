import * as THREE from 'three';
import { StaticBatch, seeded } from './kit';
import { palette } from './palette';
import { staticBox, staticCylinder, type PhysicsCtx } from './physics';

export interface TownHouseOpts {
  x: number;
  z: number;
  width: number;
  depth: number;
  floors: number;
  /** Rotation around Y; 0 means the facade faces +Z. */
  ry?: number;
  wall: number;
  shutter: number;
  seed: number;
}

/**
 * A Provencal town house: plastered walls, shuttered windows and a low terracotta roof.
 * Geometry goes into a shared batch; a box collider keeps the horse out.
 */
export function townHouse(batch: StaticBatch, ctx: PhysicsCtx, o: TownHouseOpts): void {
  const rnd = seeded(o.seed);
  const floorH = 3.1;
  const h = o.floors * floorH + 0.6;
  const ry = o.ry ?? 0;
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(o.x, 0, o.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  const add = (color: number, geo: THREE.BufferGeometry, x: number, y: number, z: number): void => {
    geo.translate(x, y, z);
    batch.addTransformed(color, geo, m);
  };

  // Walls and a slightly darker plinth.
  add(o.wall, new THREE.BoxGeometry(o.width, h, o.depth), 0, h / 2, 0);
  add(palette.quayStoneDark, new THREE.BoxGeometry(o.width + 0.06, 0.6, o.depth + 0.06), 0, 0.3, 0);
  // Cornice under the roof.
  add(palette.limestone, new THREE.BoxGeometry(o.width + 0.3, 0.22, o.depth + 0.3), 0, h + 0.05, 0);

  // Low hipped roof: a squashed four-sided pyramid.
  const roofH = 1.3 + rnd() * 0.5;
  const roof = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
  roof.rotateY(Math.PI / 4);
  roof.scale(o.width + 0.5, roofH, o.depth + 0.5);
  add(rnd() > 0.5 ? palette.roofTile : palette.roofTileDark, roof, 0, h + 0.16 + roofH / 2, 0);

  // Windows with open shutters on the front facade, a door on the ground floor.
  const cols = Math.max(2, Math.floor(o.width / 1.9));
  const spacing = o.width / cols;
  const front = o.depth / 2 + 0.03;
  const doorCol = Math.floor(rnd() * cols);
  for (let f = 0; f < o.floors; f++) {
    for (let c = 0; c < cols; c++) {
      const x = -o.width / 2 + spacing * (c + 0.5);
      const y = f * floorH + 1.0 + (f === 0 ? 0.2 : 0.6);
      if (f === 0 && c === doorCol) {
        add(palette.doorBrown, new THREE.BoxGeometry(1.0, 2.2, 0.1), x, 1.1, front);
        continue;
      }
      const winH = f === 0 ? 1.4 : 1.6;
      add(0x2c2a2b, new THREE.BoxGeometry(0.75, winH, 0.08), x, y + winH / 2, front);
      for (const s of [-1, 1]) {
        add(
          o.shutter,
          new THREE.BoxGeometry(0.4, winH, 0.06),
          x + s * 0.6,
          y + winH / 2,
          front + 0.02,
        );
      }
      if (f > 0 && rnd() > 0.55) {
        // Wrought-iron balcony.
        add(palette.lampIron, new THREE.BoxGeometry(1.2, 0.08, 0.5), x, y - 0.05, front + 0.25);
        add(palette.lampIron, new THREE.BoxGeometry(1.2, 0.5, 0.04), x, y + 0.2, front + 0.5);
      }
    }
  }

  // Collider, rotated with the house.
  staticBox(ctx, o.x, h / 2, o.z, o.width, h, o.depth, ry);
}

/** A row of houses along X, facade facing +Z (or -Z when flipped). */
export function houseRow(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  fromX: number,
  toX: number,
  z: number,
  seed: number,
  flip = false,
  depth = 8,
): void {
  const rnd = seeded(seed);
  const walls = [palette.limestone, palette.ochre, palette.apricot, 0xe2cfb0, 0xd7b48c];
  const shutters = [palette.shutterGreen, palette.shutterBlue, 0x7d8f6a];
  let x = fromX;
  let i = 0;
  while (x < toX - 3) {
    const width = Math.min(toX - x, 5 + Math.floor(rnd() * 4));
    townHouse(batch, ctx, {
      x: x + width / 2,
      z,
      width,
      depth,
      floors: 2 + Math.floor(rnd() * 2),
      ry: flip ? Math.PI : 0,
      wall: walls[Math.floor(rnd() * walls.length)]!,
      shutter: shutters[Math.floor(rnd() * shutters.length)]!,
      seed: seed * 31 + i++,
    });
    x += width;
  }
}

/** A plane tree: a pale trunk and a clumpy canopy. */
export function planeTree(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  z: number,
  seed: number,
): void {
  const rnd = seeded(seed);
  const trunkH = 3.2 + rnd() * 0.8;
  batch.add(0xb3a58e, new THREE.CylinderGeometry(0.18, 0.28, trunkH, 6), { x, y: trunkH / 2, z });
  const greens = [palette.grass, palette.grassDark, 0x8aa35c];
  for (let i = 0; i < 5; i++) {
    const r = 1.1 + rnd() * 0.7;
    batch.add(greens[i % greens.length]!, new THREE.IcosahedronGeometry(r, 0), {
      x: x + (rnd() - 0.5) * 2.2,
      y: trunkH + 0.6 + rnd() * 1.2,
      z: z + (rnd() - 0.5) * 2.2,
      ry: rnd() * 3,
    });
  }
  staticCylinder(ctx, x, z, 0.3, trunkH);
}

/** A cast-iron gas lamp. Returns the lamp head position so lights can be added later. */
export function gasLamp(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): THREE.Vector3 {
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.16, 0.2, 0.4, 6), { x, y: 0.2, z });
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.06, 0.08, 3.2, 5), { x, y: 1.8, z });
  batch.add(palette.lampIron, new THREE.ConeGeometry(0.32, 0.3, 4), {
    x,
    y: 3.85,
    z,
    ry: Math.PI / 4,
  });
  batch.add(
    0xf6e2a6,
    new THREE.BoxGeometry(0.34, 0.42, 0.34),
    { x, y: 3.5, z },
    { emissive: 0x6b5220 },
  );
  staticCylinder(ctx, x, z, 0.18, 3.5);
  return new THREE.Vector3(x, 3.5, z);
}

/** A cast-iron mooring bollard on the quay edge. */
export function bollard(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.22, 0.26, 0.6, 7), { x, y: 0.3, z });
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 7), { x, y: 0.65, z });
  staticCylinder(ctx, x, z, 0.3, 0.7);
}
