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
export function gasLamp(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  z: number,
  lit = false,
): THREE.Vector3 {
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.16, 0.2, 0.4, 6), { x, y: 0.2, z });
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.06, 0.08, 3.2, 5), { x, y: 1.8, z });
  batch.add(palette.lampIron, new THREE.ConeGeometry(0.32, 0.3, 4), {
    x,
    y: 3.85,
    z,
    ry: Math.PI / 4,
  });
  batch.add(
    lit ? 0xffe396 : 0xf6e2a6,
    new THREE.BoxGeometry(0.34, 0.42, 0.34),
    { x, y: 3.5, z },
    lit ? { emissive: palette.gaslight, roughness: 0.3 } : { emissive: 0x6b5220 },
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

export interface HaussmannOpts {
  x: number;
  z: number;
  width: number;
  depth: number;
  /** Number of limestone stories below the zinc mansard (typically 5). */
  floors?: number;
  ry?: number;
  seed: number;
  shop?: boolean;
  /** Omit ground-floor entrance/shop windows if a custom facade sits in front. */
  plainGround?: boolean;
}

/**
 * A Parisian Haussmann apartment block: cream limestone facade, ground-floor shop awnings,
 * wrought-iron balconies on the 2nd and 5th floors, and a grey-blue zinc mansard with dormers.
 */
export function haussmannBlock(batch: StaticBatch, ctx: PhysicsCtx, o: HaussmannOpts): void {
  const rnd = seeded(o.seed);
  const floors = o.floors ?? 5;
  const floorH = 2.75;
  const wallH = floors * floorH + 0.5;
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

  // Cream limestone body, stone plinth and stringcourses.
  add(palette.parisLimestone, new THREE.BoxGeometry(o.width, wallH, o.depth), 0, wallH / 2, 0);
  add(palette.quayStoneDark, new THREE.BoxGeometry(o.width + 0.08, 0.55, o.depth + 0.08), 0, 0.275, 0);
  add(
    palette.limestone,
    new THREE.BoxGeometry(o.width + 0.32, 0.24, o.depth + 0.32),
    0,
    wallH + 0.05,
    0,
  );

  // Sloped grey-blue zinc mansard roof (truncated 4-sided pyramid + flat roof crown).
  const mansardH = 2.4;
  const inset = 1.4;
  const topW = Math.max(2, o.width - inset * 2);
  const topD = Math.max(2, o.depth - inset * 2);
  const mansard = new THREE.CylinderGeometry(
    Math.SQRT1_2,
    Math.SQRT1_2,
    1,
    4,
    1,
    false,
    Math.PI / 4,
  );
  // Build a clean frustum using scaled Box/Cylinder: scale bottom vs top via a custom tapered box.
  mansard.dispose();
  const roofGeo = new THREE.BoxGeometry(o.width + 0.2, mansardH, o.depth + 0.2);
  const pos = roofGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      pos.setX(i, (pos.getX(i) / (o.width + 0.2)) * topW);
      pos.setZ(i, (pos.getZ(i) / (o.depth + 0.2)) * topD);
    }
  }
  roofGeo.computeVertexNormals();
  add(rnd() > 0.45 ? palette.zincRoof : palette.zincRoofDark, roofGeo, 0, wallH + mansardH / 2, 0);

  // Chimneys along the roof ridge.
  for (const cx of [-o.width * 0.25, o.width * 0.25]) {
    add(palette.parisLimestone, new THREE.BoxGeometry(0.7, 1.3, 0.7), cx, wallH + mansardH + 0.4, 0);
    add(palette.roofTile, new THREE.CylinderGeometry(0.11, 0.13, 0.45, 5), cx, wallH + mansardH + 1.25, 0);
  }

  const cols = Math.max(3, Math.floor(o.width / 2.0));
  const spacing = o.width / cols;
  const front = o.depth / 2 + 0.03;
  const doorCol = Math.floor(cols / 2);

  // Continuous wrought-iron balconies on the 2nd (f=1) and 5th (f=4) floors.
  for (const bf of [1, 4]) {
    if (bf >= floors) continue;
    const by = bf * floorH + 0.55;
    add(palette.lampIron, new THREE.BoxGeometry(o.width - 0.3, 0.1, 0.72), 0, by, front + 0.34);
    add(palette.lampIron, new THREE.BoxGeometry(o.width - 0.3, 0.58, 0.05), 0, by + 0.32, front + 0.68);
  }

  for (let f = 0; f < floors; f++) {
    if (f === 0 && o.plainGround) continue;
    const y = f * floorH + (f === 0 ? 0.45 : 0.75);
    for (let c = 0; c < cols; c++) {
      const wx = -o.width / 2 + spacing * (c + 0.5);
      if (f === 0 && c === doorCol) {
        add(palette.doorBrown, new THREE.BoxGeometry(1.15, 2.35, 0.12), wx, 1.18, front);
        continue;
      }
      const winH = f === 0 ? 1.85 : 1.55;
      const winW = f === 0 ? 1.15 : 0.8;
      add(0x2c3138, new THREE.BoxGeometry(winW, winH, 0.08), wx, y + winH / 2, front);
      add(palette.parisLimestone, new THREE.BoxGeometry(winW + 0.18, 0.12, 0.14), wx, y - 0.04, front + 0.03);
    }
  }

  // Ground-floor shop awning when enabled.
  if (o.shop !== false && !o.plainGround) {
    const awningColor = rnd() > 0.5 ? palette.awningRed : palette.shutterBlue;
    const awning = new THREE.BoxGeometry(o.width * 0.78, 0.12, 1.35);
    awning.rotateX(0.28);
    add(awningColor, awning, 0, 2.65, front + 0.58);
  }

  // Dormer windows set into the zinc mansard.
  for (let c = 0; c < cols; c += 2) {
    const dx = -o.width / 2 + spacing * (c + 0.5);
    add(palette.parisLimestone, new THREE.BoxGeometry(0.95, 1.15, 0.8), dx, wallH + 0.9, front - 0.35);
    add(palette.zincRoofDark, new THREE.BoxGeometry(1.05, 0.18, 0.95), dx, wallH + 1.52, front - 0.32);
    add(0x2c3138, new THREE.BoxGeometry(0.55, 0.8, 0.1), dx, wallH + 0.85, front + 0.05);
  }

  staticBox(ctx, o.x, wallH / 2, o.z, o.width, wallH, o.depth, ry);
}

/** A continuous row of Haussmann blocks along X. */
export function haussmannRow(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  fromX: number,
  toX: number,
  z: number,
  seed: number,
  flip = false,
  depth = 9,
): void {
  const rnd = seeded(seed);
  let x = fromX;
  let i = 0;
  while (x < toX - 4) {
    const width = Math.min(toX - x, 8 + Math.floor(rnd() * 5));
    haussmannBlock(batch, ctx, {
      x: x + width / 2,
      z,
      width,
      depth,
      floors: rnd() > 0.35 ? 5 : 4,
      ry: flip ? Math.PI : 0,
      seed: seed * 37 + i++,
      shop: rnd() > 0.25,
    });
    x += width;
  }
}

/** A Parisian green cast-iron Morris advertising column. */
export function morrisColumn(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  batch.add(palette.quayStoneDark, new THREE.CylinderGeometry(0.58, 0.64, 0.45, 8), { x, y: 0.225, z });
  batch.add(palette.morrisGreen, new THREE.CylinderGeometry(0.52, 0.54, 2.3, 10), { x, y: 1.6, z });
  // Poster band around the middle.
  batch.add(palette.awningCream, new THREE.CylinderGeometry(0.54, 0.54, 1.3, 10), { x, y: 1.65, z });
  batch.add(palette.ochre, new THREE.CylinderGeometry(0.545, 0.545, 0.4, 10), { x, y: 1.8, z });
  // Canopy and finial.
  batch.add(palette.morrisGreen, new THREE.CylinderGeometry(0.75, 0.78, 0.22, 10), { x, y: 2.86, z });
  batch.add(palette.morrisGreen, new THREE.ConeGeometry(0.68, 0.7, 10), { x, y: 3.32, z });
  batch.add(palette.gaslight, new THREE.CylinderGeometry(0.05, 0.08, 0.35, 6), { x, y: 3.8, z });
  staticCylinder(ctx, x, z, 0.62, 3.0);
}

/** A small blue-and-white Paris street sign mounted on a post. Returns the mesh to dispose with the area. */
export function streetSign(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  parent: THREE.Group,
  x: number,
  z: number,
  ry: number,
  label: string,
): void {
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.05, 0.07, 2.5, 6), { x, y: 1.25, z });
  staticCylinder(ctx, x, z, 0.14, 2.5);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const g = canvas.getContext('2d');
  if (g) {
    g.fillStyle = '#223e6b';
    g.fillRect(0, 0, 256, 96);
    g.strokeStyle = '#eef0ec';
    g.lineWidth = 6;
    g.strokeRect(8, 8, 240, 80);
    g.fillStyle = '#eef0ec';
    g.font = '600 26px system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(label, 128, 49);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const signMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), signMat);
  plate.position.set(x, 2.45, z);
  plate.rotation.y = ry;
  parent.add(plate);
}
