import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildPerson, rolePreset, type PersonOptions } from '../../story/figures';
import { mat, paintPart, place, type Placement } from '../kit';
import { palette } from '../palette';
import { buildHarnessHorseGeometry } from './animals';

export type VehicleKind =
  | 'fiacre'
  | 'omnibus'
  | 'cart'
  | 'handcart'
  | 'pennyFarthing'
  | 'rowingBoat';

function withLifePart(geo: THREE.BufferGeometry, partId: number): THREE.BufferGeometry {
  const count = geo.getAttribute('position').count;
  const partAttr = new Float32Array(count);
  partAttr.fill(partId);
  geo.setAttribute('aLifePart', new THREE.BufferAttribute(partAttr, 1));
  return geo;
}

function paintTagged(
  geo: THREE.BufferGeometry,
  color: number,
  p?: Placement,
  partId = 0,
): THREE.BufferGeometry {
  return withLifePart(paintPart(geo, color, p), partId);
}

function bakeExistingColors(
  geo: THREE.BufferGeometry,
  p?: Placement,
  partId = 0,
): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal' && name !== 'color') {
      g.deleteAttribute(name);
    }
  }
  if (!g.getAttribute('color')) {
    return paintTagged(g, palette.bay, p, partId);
  }
  if (p) place(g, p);
  return withLifePart(g, partId);
}

function mergeVehicleParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return new THREE.BufferGeometry();
  merged.computeVertexNormals();
  return merged;
}

function addBakedPerson(
  parts: THREE.BufferGeometry[],
  opts: PersonOptions,
  placement: Placement,
  seated = false,
  pushing = false,
): void {
  const rig = buildPerson(opts);
  if (seated) {
    rig.hips.position.y = 0.42;
    rig.legL.rotation.x = -1.35;
    rig.legR.rotation.x = -1.35;
    rig.armL.rotation.x = -0.82;
    rig.armR.rotation.x = -0.82;
  } else if (pushing) {
    rig.torso.rotation.x = 0.28;
    rig.armL.rotation.x = -1.15;
    rig.armR.rotation.x = -1.15;
  }
  rig.root.updateMatrixWorld(true);
  const offset = new THREE.Matrix4().compose(
    new THREE.Vector3(placement.x ?? 0, placement.y ?? 0, placement.z ?? 0),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(placement.rx ?? 0, placement.ry ?? 0, placement.rz ?? 0),
    ),
    new THREE.Vector3(placement.sx ?? 1, placement.sy ?? 1, placement.sz ?? 1),
  );

  rig.root.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      const m = new THREE.Matrix4().multiplyMatrices(offset, c.matrixWorld);
      const geo = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
      geo.applyMatrix4(m);
      let partId = 0;
      if (c.name === 'head') partId = 5;
      else if (c.name === 'armL' && !seated && !pushing) partId = 3;
      else if (c.name === 'armR' && !seated && !pushing) partId = 4;
      else if (c.name === 'legL' && pushing) partId = 1;
      else if (c.name === 'legR' && pushing) partId = 2;
      parts.push(bakeExistingColors(geo, undefined, partId));
    }
  });
  rig.dispose();
}

function addWheelPair(
  parts: THREE.BufferGeometry[],
  radius: number,
  halfTrack: number,
  z: number,
  rimColor = palette.lampIron,
  hubColor = palette.crateDark,
): void {
  for (const side of [-1, 1] as const) {
    const x = side * halfTrack;
    parts.push(
      paintTagged(
        new THREE.CylinderGeometry(radius, radius, 0.08, 12),
        rimColor,
        { x, y: radius, z, rz: Math.PI * 0.5 },
        1,
      ),
      paintTagged(
        new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, 0.09, 10),
        hubColor,
        { x, y: radius, z, rz: Math.PI * 0.5 },
        1,
      ),
      paintTagged(
        new THREE.BoxGeometry(0.11, radius * 1.68, 0.05),
        hubColor,
        { x, y: radius, z },
        1,
      ),
      paintTagged(
        new THREE.BoxGeometry(0.11, 0.05, radius * 1.68),
        hubColor,
        { x, y: radius, z },
        1,
      ),
    );
  }
}

export function buildFiacreGeometry(bodyColor: number = palette.hull): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Underframe & shafts.
  parts.push(
    paintTagged(new THREE.BoxGeometry(1.18, 0.14, 2.2), palette.lampIron, { y: 0.54, z: -0.65 }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.06, 2.25), palette.doorBrown, {
      x: -0.44,
      y: 0.72,
      z: 0.95,
      rx: -0.05,
    }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.06, 2.25), palette.doorBrown, {
      x: 0.44,
      y: 0.72,
      z: 0.95,
      rx: -0.05,
    }),
  );

  // Enclosed passenger cab & folding hood silhouette.
  parts.push(
    paintTagged(new THREE.BoxGeometry(1.16, 1.05, 1.38), bodyColor, { y: 1.12, z: -0.92 }),
    paintTagged(new THREE.BoxGeometry(1.2, 0.12, 1.44), palette.coat, { y: 1.66, z: -0.92 }),
    paintTagged(new THREE.BoxGeometry(1.19, 0.36, 0.62), palette.parisGlass, { y: 1.32, z: -0.82 }),
    paintTagged(new THREE.BoxGeometry(0.86, 0.32, 0.56), bodyColor, { y: 0.92, z: 0.05 }),
    paintTagged(new THREE.BoxGeometry(0.76, 0.06, 0.32), palette.lampIron, { y: 0.76, z: 0.42 }),
    // Brass carriage lamps.
    paintTagged(new THREE.BoxGeometry(0.1, 0.14, 0.1), palette.gaslight, {
      x: -0.64,
      y: 1.24,
      z: -0.18,
    }),
    paintTagged(new THREE.BoxGeometry(0.1, 0.14, 0.1), palette.gaslight, {
      x: 0.64,
      y: 1.24,
      z: -0.18,
    }),
  );

  addWheelPair(parts, 0.56, 0.7, -1.16);
  addWheelPair(parts, 0.42, 0.68, -0.08);

  addBakedPerson(parts, rolePreset('coachman', false, 0), { y: 0.72, z: 0.04 }, true);

  const horse = buildHarnessHorseGeometry(palette.bayDark);
  parts.push(bakeExistingColors(horse, { z: 1.48 }, 2));
  horse.dispose();

  return mergeVehicleParts(parts);
}

export function buildOmnibusGeometry(bodyColor: number = palette.awningBlue): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Heavy lower chassis & saloon.
  parts.push(
    paintTagged(new THREE.BoxGeometry(1.56, 0.18, 3.3), palette.lampIron, { y: 0.62, z: -1.1 }),
    paintTagged(new THREE.BoxGeometry(1.52, 1.38, 2.75), bodyColor, { y: 1.38, z: -1.25 }),
    paintTagged(new THREE.BoxGeometry(1.56, 0.14, 2.78), palette.shirt, { y: 1.34, z: -1.25 }),
    paintTagged(new THREE.BoxGeometry(1.55, 0.42, 2.18), palette.parisGlass, { y: 1.66, z: -1.22 }),
    paintTagged(new THREE.BoxGeometry(1.56, 0.1, 2.86), palette.crateDark, { y: 2.1, z: -1.22 }),
    // Rear entry step & curved staircase rail.
    paintTagged(new THREE.BoxGeometry(0.95, 0.1, 0.42), palette.lampIron, { y: 0.42, z: -2.72 }),
    paintTagged(new THREE.BoxGeometry(0.12, 1.45, 0.12), palette.brass, {
      x: 0.48,
      y: 1.35,
      z: -2.72,
    }),
    // Upper knifeboard bench & side rails.
    paintTagged(new THREE.BoxGeometry(0.44, 0.34, 2.3), palette.crateDark, { y: 2.28, z: -1.24 }),
    paintTagged(new THREE.BoxGeometry(1.56, 0.24, 0.06), palette.shirt, { y: 2.24, z: 0.15 }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.24, 2.65), palette.shirt, {
      x: -0.76,
      y: 2.24,
      z: -1.22,
    }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.24, 2.65), palette.shirt, {
      x: 0.76,
      y: 2.24,
      z: -1.22,
    }),
    // Driver box & footboard.
    paintTagged(new THREE.BoxGeometry(1.1, 0.48, 0.64), palette.doorBrown, { y: 1.56, z: 0.34 }),
    paintTagged(new THREE.BoxGeometry(0.96, 0.08, 0.36), palette.lampIron, { y: 1.36, z: 0.76 }),
  );

  // Twin pole & shafts.
  parts.push(
    paintTagged(new THREE.BoxGeometry(0.08, 0.08, 2.4), palette.doorBrown, {
      y: 0.78,
      z: 1.45,
      rx: -0.04,
    }),
    paintTagged(new THREE.BoxGeometry(1.05, 0.07, 0.07), palette.doorBrown, { y: 0.84, z: 0.75 }),
  );

  addWheelPair(parts, 0.64, 0.88, -2.02);
  addWheelPair(parts, 0.48, 0.86, 0.08);

  // Coachman + 3 upper-deck passengers.
  addBakedPerson(parts, rolePreset('coachman', false, 1), { y: 1.38, z: 0.36 }, true);
  addBakedPerson(
    parts,
    rolePreset('gentleman', false, 0),
    { x: -0.18, y: 1.72, z: -0.72, ry: -Math.PI * 0.5 },
    true,
  );
  addBakedPerson(
    parts,
    rolePreset('lady', false, 1),
    { x: 0.18, y: 1.72, z: -1.32, ry: Math.PI * 0.5 },
    true,
  );
  addBakedPerson(
    parts,
    rolePreset('marketWoman', false, 2),
    { x: -0.18, y: 1.72, z: -1.92, ry: -Math.PI * 0.5 },
    true,
  );

  const horseL = buildHarnessHorseGeometry(palette.bay);
  parts.push(bakeExistingColors(horseL, { x: -0.46, z: 1.92 }, 2));
  horseL.dispose();

  const horseR = buildHarnessHorseGeometry(palette.crateDark);
  parts.push(bakeExistingColors(horseR, { x: 0.46, z: 1.92 }, 2));
  horseR.dispose();

  return mergeVehicleParts(parts);
}

export function buildCartGeometry(
  cargo: 'crates' | 'barrels' | 'produce' = 'crates',
): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  parts.push(
    paintTagged(new THREE.BoxGeometry(1.24, 0.14, 1.95), palette.deckWood, { y: 0.62, z: -0.72 }),
    paintTagged(new THREE.BoxGeometry(0.08, 0.42, 1.95), palette.crateDark, {
      x: -0.58,
      y: 0.88,
      z: -0.72,
    }),
    paintTagged(new THREE.BoxGeometry(0.08, 0.42, 1.95), palette.crateDark, {
      x: 0.58,
      y: 0.88,
      z: -0.72,
    }),
    paintTagged(new THREE.BoxGeometry(1.16, 0.42, 0.08), palette.crateDark, { y: 0.88, z: -1.66 }),
    paintTagged(new THREE.BoxGeometry(1.16, 0.36, 0.08), palette.crateDark, { y: 0.85, z: 0.22 }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.06, 2.0), palette.doorBrown, {
      x: -0.44,
      y: 0.72,
      z: 0.92,
    }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.06, 2.0), palette.doorBrown, {
      x: 0.44,
      y: 0.72,
      z: 0.92,
    }),
  );

  if (cargo === 'barrels') {
    for (const [bx, bz] of [
      [-0.24, -0.55],
      [0.24, -0.55],
      [0, -1.18],
    ] as const) {
      parts.push(
        paintTagged(new THREE.CylinderGeometry(0.24, 0.24, 0.56, 8), palette.barrel, {
          x: bx,
          y: 0.96,
          z: bz,
        }),
        paintTagged(new THREE.CylinderGeometry(0.25, 0.25, 0.08, 8), palette.barrelHoop, {
          x: bx,
          y: 1.08,
          z: bz,
        }),
      );
    }
  } else if (cargo === 'produce') {
    parts.push(
      paintTagged(new THREE.BoxGeometry(0.46, 0.32, 0.54), palette.crate, {
        x: -0.26,
        y: 0.86,
        z: -0.52,
      }),
      paintTagged(new THREE.IcosahedronGeometry(0.24, 0), palette.awningOchre, {
        x: 0.22,
        y: 0.9,
        z: -0.55,
      }),
      paintTagged(new THREE.IcosahedronGeometry(0.26, 0), palette.grass, {
        x: -0.05,
        y: 0.88,
        z: -1.15,
      }),
    );
  } else {
    parts.push(
      paintTagged(new THREE.BoxGeometry(0.52, 0.44, 0.56), palette.crate, {
        x: -0.22,
        y: 0.91,
        z: -0.48,
      }),
      paintTagged(new THREE.BoxGeometry(0.48, 0.38, 0.52), palette.crateDark, {
        x: 0.26,
        y: 0.88,
        z: -0.96,
      }),
      paintTagged(new THREE.BoxGeometry(0.44, 0.34, 0.44), palette.crate, {
        x: -0.1,
        y: 1.24,
        z: -0.74,
        ry: 0.22,
      }),
    );
  }

  addWheelPair(parts, 0.54, 0.72, -0.72, palette.lampIron, palette.crateDark);
  parts.push(paintTagged(new THREE.BoxGeometry(0.86, 0.08, 0.34), palette.crateDark, { y: 0.56, z: 0.36 }));
  addBakedPerson(parts, rolePreset('dockWorker', false, 1), { y: 0.4, z: 0.14 }, true);

  const horse = buildHarnessHorseGeometry(palette.bay);
  parts.push(bakeExistingColors(horse, { z: 1.54 }, 2));
  horse.dispose();

  return mergeVehicleParts(parts);
}

export function buildHandcartGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintTagged(new THREE.BoxGeometry(0.88, 0.1, 1.32), palette.deckWood, { y: 0.54, z: 0.25 }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.32, 1.32), palette.crateDark, {
      x: -0.41,
      y: 0.74,
      z: 0.25,
    }),
    paintTagged(new THREE.BoxGeometry(0.06, 0.32, 1.32), palette.crateDark, {
      x: 0.41,
      y: 0.74,
      z: 0.25,
    }),
    paintTagged(new THREE.BoxGeometry(0.82, 0.32, 0.06), palette.crateDark, { y: 0.74, z: 0.88 }),
    paintTagged(new THREE.BoxGeometry(0.4, 0.36, 0.45), palette.crate, {
      x: -0.14,
      y: 0.78,
      z: 0.34,
    }),
    paintTagged(new THREE.IcosahedronGeometry(0.22, 0), palette.awningOchre, {
      x: 0.18,
      y: 0.78,
      z: 0.14,
    }),
    paintTagged(new THREE.BoxGeometry(0.05, 0.05, 0.65), palette.doorBrown, {
      x: -0.34,
      y: 0.72,
      z: -0.58,
      rx: -0.35,
    }),
    paintTagged(new THREE.BoxGeometry(0.05, 0.05, 0.65), palette.doorBrown, {
      x: 0.34,
      y: 0.72,
      z: -0.58,
      rx: -0.35,
    }),
  ];

  addWheelPair(parts, 0.44, 0.52, 0.25);
  addBakedPerson(parts, rolePreset('vendor', false, 2), { y: 0, z: -0.95 }, false, true);

  return mergeVehicleParts(parts);
}

export function buildPennyFarthingGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    // Large front wheel (vertical torus + cross spokes) & tiny rear wheel.
    paintTagged(
      new THREE.TorusGeometry(0.64, 0.032, 6, 16),
      palette.lampIron,
      { y: 0.66, z: 0.32, ry: Math.PI * 0.5 },
      1,
    ),
    paintTagged(
      new THREE.BoxGeometry(0.03, 1.24, 0.03),
      palette.railSteel,
      { y: 0.66, z: 0.32 },
      1,
    ),
    paintTagged(
      new THREE.BoxGeometry(0.03, 0.03, 1.24),
      palette.railSteel,
      { y: 0.66, z: 0.32 },
      1,
    ),
    paintTagged(
      new THREE.TorusGeometry(0.2, 0.024, 5, 10),
      palette.lampIron,
      { y: 0.22, z: -0.62, ry: Math.PI * 0.5 },
      1,
    ),
    // Fork, curved backbone, handlebars, saddle.
    paintTagged(new THREE.CylinderGeometry(0.025, 0.025, 0.78, 6), palette.railSteel, {
      y: 1.0,
      z: 0.28,
      rx: -0.18,
    }),
    paintTagged(new THREE.CylinderGeometry(0.024, 0.02, 1.25, 6), palette.railSteel, {
      y: 0.78,
      z: -0.18,
      rx: 0.92,
    }),
    paintTagged(new THREE.BoxGeometry(0.56, 0.03, 0.04), palette.brass, { y: 1.38, z: 0.22 }),
    paintTagged(new THREE.BoxGeometry(0.18, 0.06, 0.24), palette.saddle, { y: 1.24, z: 0.02 }),
  ];

  addBakedPerson(
    parts,
    { coat: 'frock', hat: 'bowler', coatColor: palette.coat, trouserColor: palette.lampIron },
    { y: 0.82, z: -0.02 },
    true,
  );

  return mergeVehicleParts(parts);
}

export function buildRowingBoatGeometry(hullColor: number = palette.hull): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintTagged(new THREE.BoxGeometry(0.95, 0.32, 2.75), hullColor, { y: 0.14 }),
    paintTagged(new THREE.ConeGeometry(0.48, 0.72, 4), hullColor, {
      y: 0.18,
      z: 1.72,
      rx: Math.PI * 0.5,
      ry: Math.PI * 0.25,
      sx: 1.0,
      sy: 0.55,
    }),
    paintTagged(new THREE.BoxGeometry(1.04, 0.07, 2.8), palette.deckWood, { y: 0.32 }),
    paintTagged(new THREE.BoxGeometry(0.92, 0.06, 0.26), palette.crate, { y: 0.26, z: 0.06 }),
    paintTagged(new THREE.BoxGeometry(0.92, 0.06, 0.26), palette.crate, { y: 0.26, z: -0.82 }),
    // Oars tagged with armL (3) & armR (4) so shader sweeps them gently.
    paintTagged(
      new THREE.CylinderGeometry(0.024, 0.032, 1.65, 5),
      palette.deckWood,
      { x: -0.78, y: 0.24, z: 0.12, rx: 0.28, rz: -1.18 },
      3,
    ),
    paintTagged(
      new THREE.CylinderGeometry(0.024, 0.032, 1.65, 5),
      palette.deckWood,
      { x: 0.78, y: 0.24, z: 0.12, rx: 0.28, rz: 1.18 },
      4,
    ),
  ];

  addBakedPerson(
    parts,
    rolePreset('fisherman', false, 0),
    { y: -0.12, z: 0.08, ry: Math.PI },
    true,
  );

  return mergeVehicleParts(parts);
}

export function previewVehicleMesh(geo: THREE.BufferGeometry): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true }));
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}
