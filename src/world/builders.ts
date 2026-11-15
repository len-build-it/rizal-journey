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
    batch.withAnchor(o.x, 0, o.z, () => batch.addTransformed(color, geo, m));
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
  opts: { scale?: number; grate?: boolean } = {},
): void {
  const rnd = seeded(seed);
  const s = opts.scale ?? 1;
  const trunkH = (3.2 + rnd() * 0.8) * s;
  batch.withAnchor(x, 0, z, () => {
    batch.add(
      palette.treeTrunk,
      new THREE.CylinderGeometry(0.18 * s, 0.28 * s, trunkH, 6),
      { x, y: trunkH / 2, z },
    );
    const greens = [palette.grass, palette.grassDark, palette.treeLeaf];
    const clusters = s < 0.9 ? 4 : 5;
    for (let i = 0; i < clusters; i++) {
      const r = (1.1 + rnd() * 0.55) * s;
      batch.add(greens[i % greens.length]!, new THREE.IcosahedronGeometry(r, 0), {
        x: x + (rnd() - 0.5) * 1.9 * s,
        y: trunkH + (0.55 + rnd() * 1.05) * s,
        z: z + (rnd() - 0.5) * 1.9 * s,
        ry: rnd() * 3,
      });
    }
  });
  if (opts.grate) {
    batch.add(palette.lampIron, new THREE.BoxGeometry(1.35, 0.05, 1.35), { x, y: 0.17, z });
    batch.add(palette.doorBrown, new THREE.BoxGeometry(0.7, 0.06, 0.7), { x, y: 0.175, z });
  }
  staticCylinder(ctx, x, z, 0.28 * s, trunkH);
}

/** A cast-iron gas lamp. Returns the lamp head position so lights can be added later. */
export function gasLamp(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  z: number,
  lit = false,
): THREE.Vector3 {
  batch.withAnchor(x, 0, z, () => {
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
  });
  staticCylinder(ctx, x, z, 0.18, 3.5);
  return new THREE.Vector3(x, 3.5, z);
}

/** A cast-iron mooring bollard on the quay edge. */
export function bollard(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  batch.withAnchor(x, 0, z, () => {
    batch.add(palette.lampIron, new THREE.CylinderGeometry(0.22, 0.26, 0.6, 7), { x, y: 0.3, z });
    batch.add(palette.lampIron, new THREE.CylinderGeometry(0.3, 0.3, 0.1, 7), { x, y: 0.65, z });
  });
  staticCylinder(ctx, x, z, 0.3, 0.7);
}

export type HaussmannCorner = 'cut-left' | 'cut-right' | 'round-left' | 'round-right';

export interface HaussmannOpts {
  x: number;
  z: number;
  width: number;
  depth: number;
  /** Number of limestone stories below the zinc mansard (5 or 6). */
  floors?: number;
  ry?: number;
  seed: number;
  shop?: boolean;
  /** Omit ground-floor entrance/shop windows if a custom facade sits in front. */
  plainGround?: boolean;
  corniceStyle?: 0 | 1;
  awningColor?: number;
  corner?: HaussmannCorner;
  sideWindows?: boolean;
  backWindows?: boolean;
}

const AWNING_PALETTE = [
  palette.awningRed,
  palette.awningBlue,
  palette.awningGreen,
  palette.awningOchre,
] as const;

function makeBlockShape(hw: number, hd: number, corner?: HaussmannCorner): THREE.Shape {
  const s = new THREE.Shape();
  const c = corner ? Math.min(2.4, hw * 0.55, hd * 0.55) : 0;
  s.moveTo(-hw, hd);
  if (corner === 'cut-left') {
    s.lineTo(-hw, -hd + c);
    s.lineTo(-hw + c, -hd);
  } else if (corner === 'round-left') {
    s.lineTo(-hw, -hd + c);
    s.absarc(-hw + c, -hd + c, c, Math.PI, Math.PI * 1.5, false);
  } else {
    s.lineTo(-hw, -hd);
  }

  if (corner === 'cut-right') {
    s.lineTo(hw - c, -hd);
    s.lineTo(hw, -hd + c);
  } else if (corner === 'round-right') {
    s.lineTo(hw - c, -hd);
    s.absarc(hw - c, -hd + c, c, Math.PI * 1.5, Math.PI * 2, false);
  } else {
    s.lineTo(hw, -hd);
  }
  s.lineTo(hw, hd);
  s.closePath();
  return s;
}

function extrudeFootprint(
  hw: number,
  hd: number,
  height: number,
  corner?: HaussmannCorner,
): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(makeBlockShape(hw, hd, corner), {
    depth: height,
    bevelEnabled: false,
    curveSegments: 3,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/**
 * A Parisian Haussmann apartment block: cream limestone facade, ground-floor shopfronts
 * with awnings, wrought-iron balconies on the 2nd and 5th floors, and a grey-blue zinc
 * mansard with dormers and chimney stacks.
 */
export function haussmannBlock(batch: StaticBatch, ctx: PhysicsCtx, o: HaussmannOpts): void {
  const rnd = seeded(o.seed);
  const floors = o.floors ?? 5;
  const floorH = 2.45;
  const wallH = floors * floorH + 0.5;
  const ry = o.ry ?? 0;
  const corniceStyle = o.corniceStyle ?? ((o.seed & 1) as 0 | 1);
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(o.x, 0, o.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  const add = (color: number, geo: THREE.BufferGeometry, x: number, y: number, z: number): void => {
    geo.translate(x, y, z);
    batch.withAnchor(o.x, 0, o.z, () => batch.addTransformed(color, geo, m));
  };

  const hw = o.width / 2;
  const hd = o.depth / 2;

  // Cream limestone body and stone plinth.
  if (o.corner) {
    add(palette.parisLimestone, extrudeFootprint(hw, hd, wallH, o.corner), 0, 0, 0);
    add(palette.quayStoneDark, extrudeFootprint(hw + 0.04, hd + 0.04, 0.55, o.corner), 0, 0, 0);
  } else {
    add(palette.parisLimestone, new THREE.BoxGeometry(o.width, wallH, o.depth), 0, wallH / 2, 0);
    add(
      palette.quayStoneDark,
      new THREE.BoxGeometry(o.width + 0.08, 0.55, o.depth + 0.08),
      0,
      0.275,
      0,
    );
  }

  // Two cornice styles: projecting double moulding vs. bracketed attic parapet.
  if (o.corner) {
    add(
      palette.limestone,
      extrudeFootprint(hw + 0.16, hd + 0.16, 0.24, o.corner),
      0,
      wallH - 0.05,
      0,
    );
  } else if (corniceStyle === 0) {
    add(
      palette.quayStoneDark,
      new THREE.BoxGeometry(o.width + 0.18, 0.12, o.depth + 0.18),
      0,
      wallH - 0.12,
      0,
    );
    add(
      palette.limestone,
      new THREE.BoxGeometry(o.width + 0.36, 0.24, o.depth + 0.36),
      0,
      wallH + 0.06,
      0,
    );
  } else {
    add(
      palette.limestone,
      new THREE.BoxGeometry(o.width + 0.42, 0.22, o.depth + 0.42),
      0,
      wallH + 0.04,
      0,
    );
    add(
      palette.parisLimestone,
      new THREE.BoxGeometry(o.width + 0.14, 0.36, o.depth + 0.14),
      0,
      wallH + 0.3,
      0,
    );
    for (let bx = -hw + 0.8; bx <= hw - 0.8; bx += 1.7) {
      add(palette.limestone, new THREE.BoxGeometry(0.18, 0.22, 0.24), bx, wallH - 0.15, hd + 0.1);
    }
  }

  // Sloped grey-blue zinc mansard roof.
  const mansardH = 2.25;
  const inset = 1.35;
  const topW = Math.max(2, o.width - inset * 2);
  const topD = Math.max(2, o.depth - inset * 2);
  const roofGeo = o.corner
    ? extrudeFootprint(hw + 0.1, hd + 0.1, mansardH, o.corner)
    : new THREE.BoxGeometry(o.width + 0.2, mansardH, o.depth + 0.2);
  const pos = roofGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const py = pos.getY(i);
    if (py > (o.corner ? mansardH * 0.5 : 0)) {
      pos.setX(i, (pos.getX(i) / (o.width + 0.2)) * topW);
      pos.setZ(i, (pos.getZ(i) / (o.depth + 0.2)) * topD);
    }
  }
  roofGeo.computeVertexNormals();
  const roofColor = rnd() > 0.45 ? palette.zincRoof : palette.zincRoofDark;
  add(roofColor, roofGeo, 0, o.corner ? wallH + 0.15 : wallH + mansardH / 2 + 0.12, 0);

  // Zinc turret cap on rounded corner buildings.
  if (o.corner === 'round-left' || o.corner === 'round-right') {
    const cx = o.corner === 'round-left' ? -hw + 1.0 : hw - 1.0;
    add(
      palette.zincRoofDark,
      new THREE.ConeGeometry(1.35, 2.2, 8),
      cx,
      wallH + mansardH + 0.7,
      hd - 1.0,
    );
  }

  // Chimneys along the roof ridge.
  for (const cx of [-o.width * 0.24, o.width * 0.24]) {
    add(
      palette.parisLimestone,
      new THREE.BoxGeometry(0.68, 1.25, 0.68),
      cx,
      wallH + mansardH + 0.45,
      0,
    );
    add(
      palette.roofTile,
      new THREE.CylinderGeometry(0.11, 0.13, 0.42, 5),
      cx,
      wallH + mansardH + 1.25,
      0,
    );
  }

  const cols = Math.max(3, Math.floor(o.width / 1.95));
  const spacing = o.width / cols;
  const front = o.depth / 2 + 0.03;
  const doorCol = Math.floor(cols / 2);
  const cornerClear = o.corner ? Math.min(2.4, hw * 0.55, hd * 0.55) + 0.35 : 0;

  // Continuous wrought-iron balconies and stone stringcourses on the 2nd (f=1) and 5th (f=4) floors.
  for (const bf of [1, 4]) {
    if (bf >= floors) continue;
    const by = bf * floorH + 0.5;
    const bw = o.corner ? o.width - cornerClear : o.width - 0.3;
    const bx = o.corner?.endsWith('left')
      ? cornerClear / 2
      : o.corner?.endsWith('right')
        ? -cornerClear / 2
        : 0;
    add(palette.lampIron, new THREE.BoxGeometry(bw, 0.1, 0.68), bx, by, front + 0.32);
    add(palette.lampIron, new THREE.BoxGeometry(bw, 0.52, 0.05), bx, by + 0.29, front + 0.64);
  }

  const isShop = o.shop !== false && !o.plainGround;
  for (let f = 0; f < floors; f++) {
    if (f === 0 && o.plainGround) continue;
    const y = f * floorH + (f === 0 ? 0.32 : 0.68);
    if (f === 0 && isShop) {
      // Ground-floor wooden/iron shopfront fascia spanning the facade.
      const shopW = o.corner ? o.width - cornerClear - 0.2 : o.width - 0.6;
      const shopX = o.corner?.endsWith('left')
        ? cornerClear / 2
        : o.corner?.endsWith('right')
          ? -cornerClear / 2
          : 0;
      add(palette.doorBrown, new THREE.BoxGeometry(shopW, 2.35, 0.1), shopX, 1.18, front);
    }
    for (let c = 0; c < cols; c++) {
      const wx = -o.width / 2 + spacing * (c + 0.5);
      if (o.corner?.endsWith('left') && wx < -hw + cornerClear) continue;
      if (o.corner?.endsWith('right') && wx > hw - cornerClear) continue;
      if (f === 0 && c === doorCol) {
        add(palette.doorBrown, new THREE.BoxGeometry(1.1, 2.25, 0.14), wx, 1.13, front + 0.02);
        add(palette.parisWindow, new THREE.BoxGeometry(0.7, 0.95, 0.16), wx, 1.55, front + 0.02);
        continue;
      }
      const winH = f === 0 ? 1.7 : 1.45;
      const winW = f === 0 ? 1.2 : 0.78;
      add(
        palette.parisWindow,
        new THREE.BoxGeometry(winW, winH, 0.08),
        wx,
        y + winH / 2,
        front + (f === 0 && isShop ? 0.04 : 0),
      );
      if (f > 0) {
        add(
          palette.parisLimestone,
          new THREE.BoxGeometry(winW + 0.18, 0.1, 0.14),
          wx,
          y - 0.04,
          front + 0.03,
        );
      }
    }
  }

  // Corner-face doorway & upper windows for cut/rounded corner blocks.
  if (o.corner) {
    const isLeft = o.corner.endsWith('left');
    const cAngle = isLeft ? -Math.PI / 4 : Math.PI / 4;
    const cOff = cornerClear * 0.58;
    const cx = isLeft ? -hw + cOff : hw - cOff;
    const cz = hd - cOff;
    const cm = new THREE.Matrix4().compose(
      new THREE.Vector3(cx, 0, cz),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, cAngle, 0)),
      new THREE.Vector3(1, 1, 1),
    );
    const cornerPart = (color: number, geo: THREE.BufferGeometry, py: number): void => {
      geo.translate(0, py, 0);
      geo.applyMatrix4(cm);
      batch.addTransformed(color, geo, m);
    };
    cornerPart(palette.doorBrown, new THREE.BoxGeometry(1.1, 2.25, 0.16), 1.13);
    for (let f = 1; f < floors; f++) {
      cornerPart(palette.parisWindow, new THREE.BoxGeometry(0.75, 1.4, 0.16), f * floorH + 1.38);
    }
  }

  // Ground-floor shop awning in one of four palette colors.
  if (isShop) {
    const awningColor =
      o.awningColor ?? AWNING_PALETTE[Math.floor(rnd() * AWNING_PALETTE.length)]!;
    const awningW = o.corner ? (o.width - cornerClear) * 0.88 : o.width * 0.82;
    const awningX = o.corner?.endsWith('left')
      ? cornerClear / 2
      : o.corner?.endsWith('right')
        ? -cornerClear / 2
        : 0;
    const awning = new THREE.BoxGeometry(awningW, 0.12, 1.35);
    awning.rotateX(0.28);
    add(awningColor, awning, awningX, 2.45, front + 0.58);
  }

  // Optional side and back windows for exposed corner/perimeter blocks.
  if (o.sideWindows) {
    const sideCols = Math.max(2, Math.floor((o.depth - cornerClear) / 2.2));
    for (const side of [-1, 1]) {
      for (let f = 1; f < floors; f++) {
        const y = f * floorH + 0.68 + 0.72;
        for (let sc = 0; sc < sideCols; sc++) {
          const wz = -hd + 1.4 + sc * ((o.depth - 2.8) / Math.max(1, sideCols - 1));
          add(
            palette.parisWindow,
            new THREE.BoxGeometry(0.08, 1.4, 0.76),
            side * (hw + 0.02),
            y,
            wz,
          );
        }
      }
    }
  }
  if (o.backWindows) {
    const back = -hd - 0.03;
    for (let f = 0; f < floors; f++) {
      const y = f * floorH + (f === 0 ? 0.32 : 0.68);
      for (let c = 0; c < cols; c++) {
        const wx = -o.width / 2 + spacing * (c + 0.5);
        add(palette.parisWindow, new THREE.BoxGeometry(0.78, 1.45, 0.08), wx, y + 0.72, back);
      }
    }
  }

  // Dormer windows set into the zinc mansard.
  for (let c = 0; c < cols; c += 2) {
    const dx = -o.width / 2 + spacing * (c + 0.5);
    if (o.corner?.endsWith('left') && dx < -hw + cornerClear) continue;
    if (o.corner?.endsWith('right') && dx > hw - cornerClear) continue;
    add(
      palette.parisLimestone,
      new THREE.BoxGeometry(0.92, 1.1, 0.78),
      dx,
      wallH + 0.9,
      front - 0.35,
    );
    add(
      palette.zincRoofDark,
      new THREE.BoxGeometry(1.02, 0.18, 0.92),
      dx,
      wallH + 1.5,
      front - 0.32,
    );
    add(palette.parisWindow, new THREE.BoxGeometry(0.52, 0.78, 0.1), dx, wallH + 0.85, front + 0.05);
  }

  staticBox(ctx, o.x, wallH / 2, o.z, o.width, wallH, o.depth, ry);
}

const FACADE_WIDTHS = [7.5, 10, 12.5] as const;

export interface HaussmannRowOpts {
  flip?: boolean;
  depth?: number;
  ry?: number;
  floors?: (5 | 6)[];
  startCorner?: 'cut' | 'round';
  endCorner?: 'cut' | 'round';
  sideWindows?: boolean;
  backWindows?: boolean;
}

/** A continuous row of Haussmann blocks along X (or along Z when ry is +/- PI/2). */
export function haussmannRow(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  fromX: number,
  toX: number,
  z: number,
  seed: number,
  flipOrOpts: boolean | HaussmannRowOpts = false,
  depthArg = 9,
): void {
  const opts: HaussmannRowOpts =
    typeof flipOrOpts === 'boolean' ? { flip: flipOrOpts, depth: depthArg } : flipOrOpts;
  const flip = opts.flip ?? false;
  const depth = opts.depth ?? 9;
  const rnd = seeded(seed);
  const ry = opts.ry ?? (flip ? Math.PI : 0);
  const floorChoices = opts.floors ?? [5, 6];

  // Partition [fromX, toX] cleanly into facade widths from the 3-width set.
  const total = toX - fromX;
  const widths: number[] = [];
  let rem = total;
  while (rem > 14.5) {
    const w = FACADE_WIDTHS[Math.floor(rnd() * FACADE_WIDTHS.length)]!;
    widths.push(w);
    rem -= w;
  }
  if (rem >= 4) widths.push(rem);
  else if (widths.length > 0) widths[widths.length - 1]! += rem;

  let cursor = fromX;
  for (let i = 0; i < widths.length; i++) {
    const width = widths[i]!;
    let corner: HaussmannCorner | undefined;
    if (i === 0 && opts.startCorner) {
      corner = flip
        ? opts.startCorner === 'cut'
          ? 'cut-right'
          : 'round-right'
        : opts.startCorner === 'cut'
          ? 'cut-left'
          : 'round-left';
    } else if (i === widths.length - 1 && opts.endCorner) {
      corner = flip
        ? opts.endCorner === 'cut'
          ? 'cut-left'
          : 'round-left'
        : opts.endCorner === 'cut'
          ? 'cut-right'
          : 'round-right';
    }
    haussmannBlock(batch, ctx, {
      x: cursor + width / 2,
      z,
      width,
      depth,
      floors: floorChoices[Math.floor(rnd() * floorChoices.length)]!,
      ry,
      seed: seed * 37 + i,
      shop: rnd() > 0.15,
      corniceStyle: (i + Math.floor(rnd() * 2)) % 2 === 0 ? 0 : 1,
      awningColor: AWNING_PALETTE[(seed + i) % AWNING_PALETTE.length]!,
      corner,
      sideWindows: (opts.sideWindows && (i === 0 || i === widths.length - 1)) || Boolean(corner),
      backWindows: opts.backWindows,
    });
    cursor += width;
  }
}

/** A continuous row of Haussmann blocks along Z, centered at X. */
export function haussmannCol(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  fromZ: number,
  toZ: number,
  seed: number,
  opts: {
    faceEast?: boolean;
    depth?: number;
    floors?: (5 | 6)[];
    startCorner?: 'cut' | 'round';
    endCorner?: 'cut' | 'round';
    backWindows?: boolean;
  } = {},
): void {
  const faceEast = opts.faceEast ?? true;
  const depth = opts.depth ?? 9;
  const floorChoices = opts.floors ?? [5, 6];
  const ry = faceEast ? Math.PI / 2 : -Math.PI / 2;
  const rnd = seeded(seed);
  const total = toZ - fromZ;
  const widths: number[] = [];
  let rem = total;
  while (rem > 14.5) {
    const w = FACADE_WIDTHS[Math.floor(rnd() * FACADE_WIDTHS.length)]!;
    widths.push(w);
    rem -= w;
  }
  if (rem >= 4) widths.push(rem);
  else if (widths.length > 0) widths[widths.length - 1]! += rem;

  let cursor = fromZ;
  for (let i = 0; i < widths.length; i++) {
    const width = widths[i]!;
    let corner: HaussmannCorner | undefined;
    if (i === 0 && opts.startCorner) {
      corner = faceEast
        ? opts.startCorner === 'cut'
          ? 'cut-right'
          : 'round-right'
        : opts.startCorner === 'cut'
          ? 'cut-left'
          : 'round-left';
    } else if (i === widths.length - 1 && opts.endCorner) {
      corner = faceEast
        ? opts.endCorner === 'cut'
          ? 'cut-left'
          : 'round-left'
        : opts.endCorner === 'cut'
          ? 'cut-right'
          : 'round-right';
    }
    haussmannBlock(batch, ctx, {
      x,
      z: cursor + width / 2,
      width,
      depth,
      floors: floorChoices[Math.floor(rnd() * floorChoices.length)]!,
      ry,
      seed: seed * 41 + i,
      shop: rnd() > 0.15,
      corniceStyle: (seed + i) % 2 === 0 ? 0 : 1,
      awningColor: AWNING_PALETTE[(seed + i) % AWNING_PALETTE.length]!,
      corner,
      sideWindows: (i === 0 || i === widths.length - 1) || Boolean(corner),
      backWindows: opts.backWindows,
    });
    cursor += width;
  }
}

/** A wooden and cast-iron Parisian park/boulevard bench. */
export function parkBench(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number, ry = 0): void {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, 0, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  const part = (color: number, geo: THREE.BufferGeometry, px: number, py: number, pz: number): void => {
    geo.translate(px, py, pz);
    batch.withAnchor(x, 0, z, () => batch.addTransformed(color, geo, m));
  };
  part(palette.deckWood, new THREE.BoxGeometry(2.1, 0.1, 0.52), 0, 0.46, 0.04);
  part(palette.deckWood, new THREE.BoxGeometry(2.1, 0.36, 0.08), 0, 0.78, -0.2);
  for (const sx of [-0.85, 0.85]) {
    part(palette.lampIron, new THREE.BoxGeometry(0.1, 0.46, 0.56), sx, 0.23, 0);
    part(palette.lampIron, new THREE.BoxGeometry(0.08, 0.48, 0.1), sx, 0.72, -0.22);
  }
  staticBox(ctx, x, 0.45, z, 2.2, 0.9, 0.7, ry);
}

/** A green cast-iron Parisian newspaper kiosk. */
export function parisKiosk(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number, ry = 0): void {
  batch.withAnchor(x, 0, z, () => {
    batch.add(palette.quayStoneDark, new THREE.CylinderGeometry(1.15, 1.22, 0.25, 6), {
      x,
      y: 0.125,
      z,
      ry,
    });
    batch.add(palette.morrisGreen, new THREE.CylinderGeometry(1.02, 1.05, 1.05, 6), {
      x,
      y: 0.78,
      z,
      ry,
    });
    batch.add(palette.parisWindow, new THREE.CylinderGeometry(0.98, 0.98, 1.0, 6), {
      x,
      y: 1.8,
      z,
      ry,
    });
    batch.add(palette.awningCream, new THREE.CylinderGeometry(1.08, 1.08, 0.24, 6), {
      x,
      y: 2.42,
      z,
      ry,
    });
    batch.add(palette.morrisGreen, new THREE.CylinderGeometry(1.38, 1.42, 0.18, 6), {
      x,
      y: 2.62,
      z,
      ry,
    });
    batch.add(palette.zincRoofDark, new THREE.ConeGeometry(1.3, 0.95, 6), {
      x,
      y: 3.18,
      z,
      ry,
    });
    batch.add(palette.gaslight, new THREE.CylinderGeometry(0.06, 0.1, 0.35, 6), {
      x,
      y: 3.8,
      z,
    });
  });
  staticCylinder(ctx, x, z, 1.2, 3.2);
}

/** A parked 1880s Parisian fiacre carriage (static box on wheels, no horse). */
export function parkedCarriage(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  z: number,
  ry = 0,
): void {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, 0, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  const part = (
    color: number,
    geo: THREE.BufferGeometry,
    px: number,
    py: number,
    pz: number,
    rx = 0,
  ): void => {
    if (rx) geo.rotateX(rx);
    geo.translate(px, py, pz);
    batch.withAnchor(x, 0, z, () => batch.addTransformed(color, geo, m));
  };
  // Carriage cabin + roof + driver box.
  part(palette.hull, new THREE.BoxGeometry(1.32, 0.9, 1.75), 0, 1.05, -0.2);
  part(palette.coat, new THREE.BoxGeometry(1.26, 0.65, 1.4), 0, 1.78, -0.35);
  part(palette.parisWindow, new THREE.BoxGeometry(1.3, 0.42, 0.65), 0, 1.82, -0.35);
  part(palette.doorBrown, new THREE.BoxGeometry(1.18, 0.35, 0.55), 0, 1.38, 0.9);
  // Shafts resting forward.
  for (const sx of [-0.42, 0.42]) {
    part(palette.doorBrown, new THREE.BoxGeometry(0.07, 0.07, 1.4), sx, 0.68, 1.6, 0.25);
  }
  // Four wheels: larger rear, smaller front.
  for (const [wz, wr] of [
    [-0.75, 0.58],
    [0.85, 0.44],
  ] as const) {
    for (const sx of [-0.74, 0.74]) {
      const wheel = new THREE.CylinderGeometry(wr, wr, 0.1, 10);
      wheel.rotateZ(Math.PI / 2);
      part(palette.doorBrown, wheel, sx, wr, wz);
      const hub = new THREE.CylinderGeometry(wr * 0.24, wr * 0.24, 0.14, 6);
      hub.rotateZ(Math.PI / 2);
      part(palette.lampIron, hub, sx, wr, wz);
    }
  }
  staticBox(ctx, x, 1.0, z, 1.6, 2.0, 3.2, ry);
}

/** A Parisian green cast-iron Morris advertising column. */
export function morrisColumn(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  batch.withAnchor(x, 0, z, () => {
    batch.add(palette.quayStoneDark, new THREE.CylinderGeometry(0.58, 0.64, 0.45, 7), {
      x,
      y: 0.225,
      z,
    });
    batch.add(palette.morrisGreen, new THREE.CylinderGeometry(0.52, 0.54, 2.3, 8), { x, y: 1.6, z });
    // Poster band around the middle.
    batch.add(palette.awningCream, new THREE.CylinderGeometry(0.54, 0.54, 1.3, 8), {
      x,
      y: 1.65,
      z,
    });
    batch.add(palette.ochre, new THREE.CylinderGeometry(0.545, 0.545, 0.4, 8), { x, y: 1.8, z });
    // Canopy and finial.
    batch.add(palette.morrisGreen, new THREE.CylinderGeometry(0.75, 0.78, 0.22, 8), {
      x,
      y: 2.86,
      z,
    });
    batch.add(palette.morrisGreen, new THREE.ConeGeometry(0.68, 0.7, 8), { x, y: 3.32, z });
    batch.add(palette.gaslight, new THREE.CylinderGeometry(0.05, 0.08, 0.35, 5), { x, y: 3.8, z });
  });
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
  batch.withAnchor(x, 0, z, () =>
    batch.add(palette.lampIron, new THREE.CylinderGeometry(0.05, 0.07, 2.5, 6), { x, y: 1.25, z }),
  );
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
