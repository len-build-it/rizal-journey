import * as THREE from 'three';
import { StaticBatch, disposeObject, mat, seeded } from '../kit';
import { palette } from '../palette';
import { NECK_REST, buildHorseAndRider } from '../../player/models';
import { boundary, disposePhysics, staticBox, type PhysicsCtx } from '../physics';
import {
  gasLamp,
  haussmannBlock,
  haussmannCol,
  haussmannRow,
  morrisColumn,
  parkBench,
  parkedCarriage,
  parisKiosk,
  planeTree,
  streetSign,
} from '../builders';
import { Props } from '../Props';
import { Water } from '../Water';
import { StopMarker } from '../StopMarker';
import { EiffelTower } from '../tower';
import { storiesFor, type ParisEra } from '../../content/stories';
import type { Area, AreaLook } from '../Area';

const TOWER_CENTER = new THREE.Vector3(-34, 0, 0);

/**
 * Paris across three eras (1883, 1885, 1889) on one shared dense Haussmann city layout.
 *
 * Layout (top view, +Z south, +X east):
 *   west bank (x < -89)  : Trocadero palace & gardens facing the Champ de Mars
 *   Seine (x = -85..-60) : 25-unit river, stone embankments, lower quay paths, two bridges
 *   west (x = -54..-12)  : Avenue de l'Alma (z = -36), Champ de Mars (z = -22..24), Wild West arena (1889)
 *   center (x = 0)       : grand tree-lined boulevard north-south, Paris terminus at (-14, -50) facing +X
 *   east streets         : Rue de Maubeuge (z = -22), Laennec Hospital, Rue du Cherche-Midi (z = 10),
 *                          Rue des Saints-Peres (z = 26) and Juan Luna's studio
 */
export function buildParis(scene: THREE.Scene, ctx: PhysicsCtx, era: ParisEra): Area {
  const batch = new StaticBatch();
  const props = new Props(ctx, scene);
  const signsGroup = new THREE.Group();
  signsGroup.name = 'paris-signs';
  const lit = era === '1889';
  const look = parisLook(era);

  // City ground: grey-brown cobble east of the Seine embankment (x = -56..86), no bare dirt.
  batch.add(palette.parisCobble, new THREE.BoxGeometry(142, 4, 160), { x: 15, y: -2, z: -2 });
  staticBox(ctx, 15, -2, -2, 142, 4, 160);

  // Seine embankments, lower quay paths, and two bridges.
  buildSeine(batch, ctx);

  // Trocadero palace across the river and low fog-colored skyline beyond.
  trocaderoPalace(batch, -108, 0);
  distantSkyline(batch, era);

  // Raised lighter stone sidewalks with curbs under every city block.
  sidewalk(batch, -36, -46.5, 36, 12);
  sidewalk(batch, -33, -27, 43, 11);
  sidewalk(batch, -33, 57, 45, 10);
  if (era === '1889') {
    sidewalk(batch, -15, 42, 10, 22);
  } else {
    sidewalk(batch, -33, 42, 43, 22);
  }

  // East side sidewalks (boulevard east curb at x = 9.5, east frontage at x = 14.5).
  sidewalk(batch, 39, -37, 56, 20); // North of Rue de Maubeuge
  sidewalk(batch, 28, -4, 34, 30); // Between Maubeuge & Cherche-Midi (west of hospital street)
  sidewalk(batch, 58, -4, 14, 30); // East of hospital street
  sidewalk(batch, 27, 18, 35, 9.5); // Between Cherche-Midi & Saints-Peres (west)
  sidewalk(batch, 56.5, 18, 17, 9.5); // Between Cherche-Midi & Saints-Peres (east)
  sidewalk(batch, 29, 36.5, 39, 11.5); // South of Saints-Peres (west)
  sidewalk(batch, 58, 36.5, 14, 11.5); // South of Saints-Peres (east)
  sidewalk(batch, 39, 53.5, 56, 11); // Southern perimeter block

  // East-side stone quay walkway along the Seine.
  sidewalk(batch, -54, 0, 4.2, 132);

  // Champ de Mars: central lawn and pale gravel paths (no bare dirt).
  batch.add(palette.grass, new THREE.BoxGeometry(38, 0.06, 46), { x: -33, y: 0.03, z: 1 });
  batch.add(palette.grassDark, new THREE.BoxGeometry(28, 0.07, 36), { x: -33, y: 0.035, z: 1 });
  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(6, 0.09, 46), { x: -34, y: 0.045, z: 1 });
  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(40, 0.09, 6), { x: -33, y: 0.045, z: 0 });
  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(3, 0.09, 46), { x: -13, y: 0.045, z: 1 });

  // Grand Paris railway terminus on the west side of the station square, facing +X toward the camera.
  parisTerminus(batch, ctx, -14, -50);
  // Backdrop Haussmann row behind the northern station tracks so the horizon is enclosed.
  haussmannRow(batch, ctx, -18, 56, -68, 39, { depth: 8, floors: [5] });

  // West-of-boulevard Haussmann blocks (north of Champ de Mars, framing Avenue de l'Alma at z = -36).
  haussmannRow(batch, ctx, -53, -38, -45.5, 41, {
    depth: 8,
    startCorner: 'round',
    endCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, -32, -20, -45.5, 42, {
    depth: 8,
    startCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, -53, -37, -27, 46, {
    flip: true,
    depth: 8,
    startCorner: 'cut',
    endCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, -31, -11.5, -27, 47, {
    flip: true,
    depth: 8,
    startCorner: 'cut',
    endCorner: 'round',
    sideWindows: true,
  });

  // North of Rue de Maubeuge (east of Grand Boulevard, keeping front at x = 14.5 and 5 floors for sightlines).
  haussmannRow(batch, ctx, 14.5, 36, -31.5, 43, {
    depth: 8,
    floors: [5],
    startCorner: 'cut',
    endCorner: 'round',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, 43, 62, -31.5, 44, {
    depth: 8,
    startCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, 20, 36, -42, 45, {
    flip: true,
    depth: 8,
    floors: [5],
    startCorner: 'round',
    endCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, 43, 62, -42, 48, {
    flip: true,
    depth: 8,
    startCorner: 'cut',
    sideWindows: true,
  });

  // Rue de Maubeuge south side (z = -15, facing -Z): Hotel de Paris sits at x = 19, z = -15.
  hotelDeParis(batch, ctx, 19.25, -15);
  haussmannRow(batch, ctx, 24, 37, -15, 51, {
    flip: true,
    depth: 8,
    floors: [5],
    endCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, 43, 62, -15, 52, {
    flip: true,
    depth: 8,
    startCorner: 'round',
    sideWindows: true,
  });
  streetSign(batch, ctx, signsGroup, 11.2, -26.8, Math.PI * 0.25, 'Rue de Maubeuge');

  // Block between Rue de Maubeuge and Rue du Cherche-Midi: boulevard frontage + Laennec Hospital.
  haussmannCol(batch, ctx, 18.75, -10.5, 5.5, 53, {
    faceEast: false,
    depth: 8.5,
    floors: [5],
    startCorner: 'cut',
    endCorner: 'cut',
  });
  laennecHospital(batch, ctx, 26, -4);
  haussmannCol(batch, ctx, 58.5, -10.5, 5.5, 54, {
    faceEast: false,
    depth: 9,
    floors: [5],
    startCorner: 'cut',
    endCorner: 'round',
  });

  // Rue du Cherche-Midi (z = 10, south side z = 18 facing -Z): Dr. de Wecker's clinic at x = 18.
  haussmannBlock(batch, ctx, {
    x: 14.9,
    z: 18,
    width: 1.5,
    depth: 7.5,
    floors: 5,
    ry: Math.PI,
    seed: 8500,
    shop: false,
    plainGround: true,
  });
  deWeckerClinic(batch, ctx, 18.7, 18);
  haussmannRow(batch, ctx, 21.8, 42, 18, 55, {
    flip: true,
    depth: 7.5,
    floors: [5],
    endCorner: 'round',
    sideWindows: true,
    backWindows: true,
  });
  haussmannRow(batch, ctx, 49, 64, 18, 56, {
    flip: true,
    depth: 7.5,
    startCorner: 'cut',
    sideWindows: true,
    backWindows: true,
  });
  streetSign(batch, ctx, signsGroup, 11.2, 5.8, Math.PI * 0.25, 'Rue du Cherche-Midi');

  // Rue des Saints-Peres (z = 26, south side z = 36 facing -Z): bookshop at x = 18.5, Luna's studio at x = 36.
  bookshop(batch, ctx, 18.5, 36);
  haussmannRow(batch, ctx, 22.5, 31, 36, 61, {
    flip: true,
    depth: 8,
    floors: [5],
    sideWindows: true,
  });
  lunaStudio(batch, ctx, 36, 36);
  haussmannRow(batch, ctx, 41, 47, 36, 62, {
    flip: true,
    depth: 8,
    endCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, 53, 64, 36, 63, {
    flip: true,
    depth: 8,
    startCorner: 'cut',
    sideWindows: true,
  });
  streetSign(batch, ctx, signsGroup, 11.2, 22.0, Math.PI * 0.25, 'Rue des Saints-Peres');

  // Southern perimeter Haussmann blocks behind Rue des Saints-Peres & south of Champ de Mars.
  haussmannRow(batch, ctx, 14.5, 64, 53.5, 64, {
    flip: true,
    depth: 8,
    floors: [5],
    startCorner: 'cut',
    sideWindows: true,
  });
  haussmannRow(batch, ctx, -54, -19.5, 57, 66, {
    flip: true,
    depth: 8,
  });

  // Plane trees (6 to 7 units tall, iron grates at bases) lined evenly along boulevards & quays.
  const rnd = seeded(188);
  for (let z = -38; z <= 42; z += 9) {
    planeTree(batch, ctx, -9.2, z, Math.floor(rnd() * 1000), { scale: 0.78, grate: true });
    planeTree(batch, ctx, 10.6, z, Math.floor(rnd() * 1000), { scale: 0.78, grate: true });
  }
  for (let z = -38; z <= 42; z += 12) {
    gasLamp(batch, ctx, -7.8, z + 4, lit);
    gasLamp(batch, ctx, 9.2, z + 4, lit);
  }
  // Avenue de l'Alma & Rue de Maubeuge trees and gas lamps.
  for (const x of [-49, -40, -29, -20]) {
    planeTree(batch, ctx, x, -41.5, Math.floor(rnd() * 1000), { scale: 0.76, grate: true });
    gasLamp(batch, ctx, x + 4.5, -40.8, lit);
  }
  for (const [lx, lz] of [
    [15, -27.5],
    [26, -27.5],
    [35, -27.5],
    [47, -27.5],
    [25, -19.8],
    [34, -19.8],
    [16, 5.2],
    [27, 5.2],
    [36, 13.8],
    [25, 13.8],
    [16, 22.0],
    [27, 22.0],
    [39, 22.0],
    [24, 30.2],
    [42, 30.2],
  ] as const) {
    gasLamp(batch, ctx, lx, lz, lit);
  }

  // Champ de Mars & Seine quay trees (6-7u tall, with grates).
  for (const z of [-20, -10, 10, 20]) {
    planeTree(batch, ctx, -14, z, Math.floor(rnd() * 1000), { scale: 0.8, grate: true });
    planeTree(batch, ctx, -52.5, z, Math.floor(rnd() * 1000), { scale: 0.8, grate: true });
    gasLamp(batch, ctx, -53.8, z + 5, lit);
  }

  // Street furniture spaced so the camera always sees Morris columns, kiosks, benches, carriages.
  for (const [mx, mz] of [
    [-9.5, -13],
    [11.2, -19],
    [11.2, 12],
    [11.2, 29],
    [-9.5, -34],
    [29, -20],
    [6, -42],
  ] as const) {
    morrisColumn(batch, ctx, mx, mz);
  }
  for (const [kx, kz, kry] of [
    [11.6, -31, -Math.PI / 2],
    [-10.2, -23, Math.PI / 2],
    [11.6, 3, -Math.PI / 2],
    [28, 22.5, 0],
  ] as const) {
    parisKiosk(batch, ctx, kx, kz, kry);
  }
  for (const [bx, bz, bry] of [
    [-8.5, -27, Math.PI / 2],
    [-8.5, 0, Math.PI / 2],
    [-8.5, 18, Math.PI / 2],
    [9.8, -8, -Math.PI / 2],
    [9.8, 22, -Math.PI / 2],
    [14, -40, 0],
    [26, -20.2, 0],
    [30, 13.6, 0],
    [26, 30.2, 0],
    [-53.2, -5, Math.PI / 2],
    [-53.2, 15, Math.PI / 2],
  ] as const) {
    parkBench(batch, ctx, bx, bz, bry);
  }
  for (const [cx, cz, cry] of [
    [-5.8, -32, 0.05],
    [6.2, -14, Math.PI],
    [6.0, -47, 0.2],
    [25, -24.8, Math.PI / 2],
    [28, 10.5, -Math.PI / 2],
    [24, 26.8, Math.PI / 2],
  ] as const) {
    parkedCarriage(batch, ctx, cx, cz, cry);
  }

  // Loose street life props: cafe terraces, flower carts, crates & barrels.
  props.cafeTable(13.2, -20.2);
  props.cafeTable(27.5, -20.0);
  props.cafeTable(27, 13.8);
  props.cafeTable(32, 30.2);
  props.cafeTable(13.2, -40.5);
  props.flowerCart(11.8, -5, 0.25);
  props.flowerCart(-9.5, 12, -0.35);
  props.flowerCart(23.5, 13.5, 0.15);
  props.flowerCart(13.5, 30.2, -0.2);
  props.flowerCart(2.5, -39, 0.4);
  props.crate(11, -44, 0.85);
  props.barrel(12.2, -43.6);
  props.barrel(12.8, -44.5);

  // Era-specific Eiffel Tower, 1889 fair pavilions & Wild West arena, or 1883/1885 south blocks.
  let tower: EiffelTower | null = null;
  if (era === '1889') {
    tower = new EiffelTower(TOWER_CENTER, ctx);
    scene.add(tower.group);

    fairPavilion(batch, ctx, -34, -18, 0);
    fairPavilion(batch, ctx, -34, 18, 0);
    for (const [lx, lz] of [
      [-22, -11],
      [-22, 11],
      [-46, -11],
      [-46, 11],
      [-20, 0],
    ] as const) {
      gasLamp(batch, ctx, lx, lz, true);
    }
    fairStall(batch, ctx, -19, -7, Math.PI / 2);
    fairStall(batch, ctx, -19, 10, Math.PI / 2);

    // Fence separating the fair from the Wild West show arena outside.
    for (let x = -52; x <= -21; x += 4) {
      batch.add(palette.lampIron, new THREE.BoxGeometry(3.8, 0.9, 0.12), {
        x,
        y: 0.45,
        z: 28.5,
      });
    }
    staticBox(ctx, -36.5, 0.5, 28.5, 32, 1.2, 0.5);

    // Wild West show open-air arena outside the fair at the south edge.
    wildWestArena(batch, ctx, -36, 41.5);
  } else {
    for (const bz of [-8, 8]) {
      parkBench(batch, ctx, -24, bz, 0);
    }
    haussmannCol(batch, ctx, -15.5, 32, 52, 65, {
      faceEast: true,
      depth: 8,
      startCorner: 'round',
    });
    haussmannRow(batch, ctx, -53, -22, 34, 67, {
      flip: true,
      depth: 8,
      startCorner: 'cut',
      endCorner: 'round',
      sideWindows: true,
    });
    haussmannRow(batch, ctx, -53, -22, 46, 68, {
      depth: 8,
      startCorner: 'round',
      endCorner: 'cut',
      sideWindows: true,
    });
  }

  boundary(ctx, -53.5, 55, -55, 53);
  const staticGroup = batch.build(`paris-${era}-static`);
  scene.add(staticGroup);
  scene.add(signsGroup);

  const water = new Water(26, 176, 3.5, new THREE.Vector3(-72.5, -1.2, 0), 0.3);
  scene.add(water.mesh);

  const stops = buildParisStops(era);
  for (const s of stops) scene.add(s.group);

  return {
    id: `paris-${era}`,
    name: `Paris, ${era}`,
    spawn: era === '1889' ? new THREE.Vector3(-13.5, 0, 5.5) : new THREE.Vector3(0, 0, -37),
    spawnHeading: era === '1889' ? -Math.PI * 0.5 : 0,
    stops,
    look,
    towerCenter: TOWER_CENTER,
    staticDrawCalls: staticGroup.children.length,
    setTowerProgress: tower ? (p: number) => tower.setProgress(p) : undefined,
    update(_dt, time) {
      water.update(time);
      props.update();
    },
    dispose() {
      disposeObject(staticGroup);
      signsGroup.removeFromParent();
      signsGroup.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const m = o.material as THREE.MeshBasicMaterial;
          m.map?.dispose();
          m.dispose();
        }
      });
      tower?.dispose();
      water.dispose();
      props.dispose();
      for (const s of stops) s.dispose();
      disposePhysics(ctx);
    },
  };
}

function sidewalk(batch: StaticBatch, x: number, z: number, w: number, d: number): void {
  batch.add(palette.parisCurb, new THREE.BoxGeometry(w + 0.3, 0.14, d + 0.3), {
    x,
    y: 0.07,
    z,
  });
  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(w, 0.16, d), {
    x,
    y: 0.08,
    z,
  });
}

function buildSeine(batch: StaticBatch, ctx: PhysicsCtx): void {
  // East bank embankment wall & lower quay path (x = -60..-56).
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(1.2, 3.6, 164), {
    x: -56.2,
    y: -1.4,
    z: 0,
  });
  batch.add(palette.quayStone, new THREE.BoxGeometry(3.6, 0.6, 164), {
    x: -58.2,
    y: -0.75,
    z: 0,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(0.6, 1.4, 164), {
    x: -59.9,
    y: -1.1,
    z: 0,
  });
  staticBox(ctx, -56, 0.6, 0, 1.2, 1.2, 164);

  // West bank embankment wall & lower quay path (x = -89..-85), plus Trocadero esplanade.
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(0.6, 1.4, 164), {
    x: -85.1,
    y: -1.1,
    z: 0,
  });
  batch.add(palette.quayStone, new THREE.BoxGeometry(3.6, 0.6, 164), {
    x: -86.8,
    y: -0.75,
    z: 0,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(1.4, 3.8, 164), {
    x: -89.0,
    y: -1.3,
    z: 0,
  });
  batch.add(palette.grass, new THREE.BoxGeometry(48, 4, 164), {
    x: -113,
    y: -1.8,
    z: 0,
  });
  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(4.5, 0.2, 164), {
    x: -91.5,
    y: 0.22,
    z: 0,
  });

  // Two stone arch bridges spanning the Seine (z = 0 Pont d'Iena, z = -36 northern bridge).
  seineBridge(batch, 0, 8.6);
  seineBridge(batch, -36, 7.6);
}

function seineBridge(batch: StaticBatch, z: number, width: number): void {
  const xMid = -72.5;
  const len = 35;
  batch.add(palette.parisCobble, new THREE.BoxGeometry(len, 0.8, width), {
    x: xMid,
    y: 0.4,
    z,
  });
  for (const sz of [-width / 2 + 0.55, width / 2 - 0.55]) {
    batch.add(palette.parisSidewalk, new THREE.BoxGeometry(len, 0.9, 1.1), {
      x: xMid,
      y: 0.45,
      z: z + sz,
    });
    batch.add(palette.parisLimestone, new THREE.BoxGeometry(len, 0.85, 0.45), {
      x: xMid,
      y: 1.3,
      z: z + sz + Math.sign(sz) * 0.32,
    });
  }
  for (const px of [-64, -72.5, -81]) {
    batch.add(palette.quayStoneDark, new THREE.BoxGeometry(2.2, 3.0, width + 0.9), {
      x: px,
      y: -1.1,
      z,
    });
  }
}

/** Trocadero palace across the Seine from Champ de Mars: two towers and a curved crescent wing, no text. */
function trocaderoPalace(batch: StaticBatch, x: number, z: number): void {
  batch.add(palette.quayStone, new THREE.BoxGeometry(16, 1.2, 44), { x: x + 9, y: 0.6, z });
  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(10, 2.2, 36), { x: x + 4, y: 1.1, z });

  batch.add(palette.parisLimestone, new THREE.CylinderGeometry(5.6, 6.0, 8.5, 10), {
    x,
    y: 5.5,
    z,
  });
  batch.add(palette.zincRoof, new THREE.SphereGeometry(5.8, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.5), {
    x,
    y: 9.7,
    z,
  });

  for (const sz of [-6.8, 6.8]) {
    batch.add(palette.parisLimestone, new THREE.BoxGeometry(3.6, 17, 3.6), {
      x: x + 1,
      y: 9.5,
      z: z + sz,
    });
    batch.add(palette.zincRoofDark, new THREE.ConeGeometry(2.6, 3.2, 4), {
      x: x + 1,
      y: 19.6,
      z: z + sz,
      ry: Math.PI / 4,
    });
    batch.add(palette.parisWindow, new THREE.BoxGeometry(0.15, 2.6, 1.2), {
      x: x + 2.85,
      y: 14,
      z: z + sz,
    });
  }

  const wingSteps = 10;
  for (let i = 0; i <= wingSteps; i++) {
    const a = -1.15 + (i / wingSteps) * 2.3;
    const wx = x + Math.cos(a) * 14 - 12;
    const wz = z + Math.sin(a) * 24;
    if (Math.abs(wz - z) < 7.5) continue;
    const rot = -a;
    batch.add(palette.parisLimestone, new THREE.BoxGeometry(4.2, 5.8, 4.8), {
      x: wx,
      y: 4.1,
      z: wz,
      ry: rot,
    });
    batch.add(palette.zincRoof, new THREE.BoxGeometry(4.5, 1.2, 5.1), {
      x: wx,
      y: 7.6,
      z: wz,
      ry: rot,
    });
    batch.add(palette.parisWindow, new THREE.BoxGeometry(0.12, 2.2, 2.4), {
      x: wx + Math.cos(rot) * 2.12,
      y: 3.8,
      z: wz - Math.sin(rot) * 2.12,
      ry: rot,
    });
  }
}

/** Low horizon skyline of block shapes in the era's fog color (no hills). */
function distantSkyline(batch: StaticBatch, era: ParisEra): void {
  const fogColor =
    era === '1883'
      ? palette.parisFog1883
      : era === '1885'
        ? palette.parisFog1885
        : palette.parisFog1889;
  const rnd = seeded(77);
  for (let z = -90; z <= 90; z += 16) {
    const h = 7 + rnd() * 9;
    batch.add(fogColor, new THREE.BoxGeometry(10 + rnd() * 8, h, 12 + rnd() * 4), {
      x: -132 - rnd() * 14,
      y: h / 2 - 1,
      z,
    });
  }
  for (let x = -90; x <= 90; x += 18) {
    const hn = 6 + rnd() * 8;
    batch.add(fogColor, new THREE.BoxGeometry(13 + rnd() * 5, hn, 10), {
      x,
      y: hn / 2 - 1,
      z: -86 - rnd() * 12,
    });
    const hs = 6 + rnd() * 8;
    batch.add(fogColor, new THREE.BoxGeometry(13 + rnd() * 5, hs, 10), {
      x,
      y: hs / 2 - 1,
      z: 78 + rnd() * 12,
    });
  }
  for (let z = -68; z <= 68; z += 18) {
    const he = 6 + rnd() * 8;
    batch.add(fogColor, new THREE.BoxGeometry(10, he, 13 + rnd() * 5), {
      x: 82 + rnd() * 12,
      y: he / 2 - 1,
      z,
    });
  }
}

function buildParisStops(era: ParisEra): StopMarker[] {
  const list = storiesFor('paris', era);
  const byId = (id: string) => list.find((s) => s.id === id)!;
  if (era === '1883') {
    return [
      new StopMarker(
        byId('paris-1883-hotel'),
        new THREE.Vector3(19.25, 0, -20.5),
        new THREE.Vector3(19.25, 4.5, -16),
        1.2,
      ),
      new StopMarker(
        byId('paris-1883-hospital'),
        new THREE.Vector3(40, 0, -4),
        new THREE.Vector3(34, 2.5, -4),
        1.25,
      ),
      new StopMarker(
        byId('paris-1883-station'),
        new THREE.Vector3(-4, 0, -48),
        new THREE.Vector3(-10, 3.8, -50),
        1.3,
      ),
    ];
  }
  if (era === '1885') {
    return [
      new StopMarker(
        byId('paris-1885-clinic'),
        new THREE.Vector3(18.7, 0, 11.5),
        new THREE.Vector3(18.7, 4.0, 17),
        1.15,
      ),
      new StopMarker(
        byId('paris-1885-studio'),
        new THREE.Vector3(36, 0, 28.5),
        new THREE.Vector3(36, 5.0, 35),
        1.25,
      ),
      new StopMarker(
        byId('paris-1885-station'),
        new THREE.Vector3(-4, 0, -48),
        new THREE.Vector3(-10, 3.8, -50),
        1.3,
      ),
    ];
  }
  return [
    new StopMarker(
      byId('paris-1889-tower'),
      new THREE.Vector3(-19, 0, 5.5),
      new THREE.Vector3(-34, 18.5, 0),
      2.8,
    ),
    new StopMarker(
      byId('paris-1889-indios-bravos'),
      new THREE.Vector3(-17.5, 0, 41.5),
      new THREE.Vector3(-29.5, 1.6, 42.5),
      1.22,
    ),
    new StopMarker(
      byId('paris-1889-godfather'),
      new THREE.Vector3(36, 0, 28.5),
      new THREE.Vector3(36, 5.0, 35),
      1.25,
    ),
    new StopMarker(
      byId('paris-1889-morga'),
      new THREE.Vector3(18.5, 0, 28.5),
      new THREE.Vector3(18.5, 4.2, 35),
      1.15,
    ),
    new StopMarker(
      byId('paris-1889-station'),
      new THREE.Vector3(-4, 0, -48),
      new THREE.Vector3(-10, 3.8, -50),
      1.3,
    ),
  ];
}

function parisLook(era: ParisEra): AreaLook {
  if (era === '1883') {
    return {
      sky: 0x9ecbe0,
      fog: 0xb8d6e2,
      fogNear: 58,
      fogFar: 170,
      sunColor: 0xffe9c7,
      sunIntensity: 3.2,
      sunDirection: new THREE.Vector3(0.4, 0.8, 0.45).normalize(),
      hemiSky: 0xd6e8f3,
      hemiGround: 0xa08460,
      hemiIntensity: 1.1,
    };
  }
  if (era === '1885') {
    return {
      sky: 0xb9c6cf,
      fog: 0xc4ced4,
      fogNear: 48,
      fogFar: 150,
      sunColor: 0xfff3e3,
      sunIntensity: 2.4,
      sunDirection: new THREE.Vector3(0.6, 0.45, 0.3).normalize(),
      hemiSky: 0xdfe6ea,
      hemiGround: 0x8c8478,
      hemiIntensity: 1.25,
    };
  }
  return {
    sky: 0xd9b99a,
    fog: 0xe3c7a6,
    fogNear: 56,
    fogFar: 170,
    sunColor: 0xffd29a,
    sunIntensity: 3.0,
    sunDirection: new THREE.Vector3(0.75, 0.42, 0.2).normalize(),
    hemiSky: 0xc7d4e6,
    hemiGround: 0x8a6a4f,
    hemiIntensity: 1.2,
  };
}

/** Paris railway terminus facing +X onto the station square, with arched glass front, clock and locomotive. */
function parisTerminus(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  const w = 20;
  const h = 8.2;
  const d = 8.5;
  // Rotated +90 deg around Y so the local +Z facade faces +X toward the camera.
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, 0, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)),
    new THREE.Vector3(1, 1, 1),
  );
  const add = (color: number, geo: THREE.BufferGeometry, px: number, py: number, pz: number): void => {
    geo.translate(px, py, pz);
    batch.addTransformed(color, geo, m);
  };

  add(palette.parisLimestone, new THREE.BoxGeometry(w, h, d), 0, h / 2, 0);
  add(palette.quayStoneDark, new THREE.BoxGeometry(w + 0.3, 0.7, d + 0.3), 0, 0.35, 0);
  add(palette.zincRoofDark, new THREE.BoxGeometry(w + 0.6, 1.4, d + 0.6), 0, h + 0.7, 0);

  // Big arched glass train-shed front in the middle.
  const arch = new THREE.CylinderGeometry(4.6, 4.6, d + 0.3, 12, 1, false, 0, Math.PI);
  arch.rotateZ(Math.PI / 2);
  arch.rotateY(Math.PI / 2);
  add(palette.parisGlass, arch, 0, 4.2, 0);
  add(palette.parisGlass, new THREE.BoxGeometry(9.2, 4.2, d + 0.3), 0, 2.1, 0);
  add(palette.lampIron, new THREE.BoxGeometry(9.8, 0.32, d + 0.5), 0, 4.3, 0);

  // Station clock centered above the arch.
  const clock = new THREE.CylinderGeometry(1.05, 1.05, 0.2, 14);
  clock.rotateX(Math.PI / 2);
  add(palette.shirt, clock, 0, h + 0.4, d / 2 + 0.25);
  add(palette.hat, new THREE.BoxGeometry(0.08, 0.7, 0.06), 0, h + 0.65, d / 2 + 0.36);
  add(palette.hat, new THREE.BoxGeometry(0.5, 0.08, 0.06), 0.22, h + 0.4, d / 2 + 0.36);

  // Side windows.
  for (const sx of [-7.5, -5.8, 5.8, 7.5]) {
    add(palette.parisWindow, new THREE.BoxGeometry(1.2, 4.0, 0.12), sx, 3.2, d / 2 + 0.04);
  }
  staticBox(ctx, x, h / 2, z, d, h, w);

  // Locomotive waiting on the platform track along the north side of the station square.
  const lx = x + 12;
  const lz = z - 9.5;
  batch.add(palette.railSteel, new THREE.BoxGeometry(18, 0.2, 2.2), { x: lx, y: 0.1, z: lz });
  batch.add(palette.hull, new THREE.CylinderGeometry(0.95, 0.95, 5, 10), {
    x: lx - 1,
    y: 1.9,
    z: lz,
    rz: Math.PI / 2,
  });
  batch.add(palette.hull, new THREE.BoxGeometry(2.2, 2.6, 2.3), { x: lx + 2.6, y: 2.3, z: lz });
  batch.add(palette.iron, new THREE.BoxGeometry(2.4, 0.25, 2.5), { x: lx + 2.6, y: 3.7, z: lz });
  batch.add(palette.hull, new THREE.CylinderGeometry(0.28, 0.4, 1.3, 7), {
    x: lx - 2.8,
    y: 3.2,
    z: lz,
  });
  for (const wx of [-3.0, -1.2, 0.6, 2.4]) {
    for (const s of [-1, 1]) {
      batch.add(palette.iron, new THREE.CylinderGeometry(0.6, 0.6, 0.15, 10), {
        x: lx + wx,
        y: 0.75,
        z: lz + s * 1.05,
        rx: Math.PI / 2,
      });
    }
  }
  staticBox(ctx, lx, 1.8, lz, 9, 3.6, 2.6);
}

/** Modest Haussmann hotel facade facing -Z with a small plaque shape beside the door. */
function hotelDeParis(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  haussmannBlock(batch, ctx, {
    x,
    z,
    width: 9.5,
    depth: 8,
    floors: 5,
    ry: Math.PI,
    seed: 8301,
    shop: false,
    corner: 'cut-right',
    sideWindows: true,
  });
  batch.add(palette.lampIron, new THREE.BoxGeometry(2.4, 0.14, 1.2), { x, y: 2.5, z: z - 4.5 });
  batch.add(palette.brass, new THREE.BoxGeometry(0.55, 0.45, 0.08), {
    x: x - 1.15,
    y: 1.7,
    z: z - 4.05,
  });
}

/** Long, low institutional hospital building (Laennec) with courtyard and iron gate. */
function laennecHospital(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  const wallH = 6.4;
  batch.add(palette.parisLimestone, new THREE.BoxGeometry(6, wallH, 22), { x, y: wallH / 2, z });
  batch.add(palette.zincRoofDark, new THREE.BoxGeometry(6.4, 1.6, 22.4), {
    x,
    y: wallH + 0.8,
    z,
  });
  staticBox(ctx, x, wallH / 2, z, 6, wallH, 22);

  for (const sz of [-8.5, 8.5]) {
    batch.add(palette.parisLimestone, new THREE.BoxGeometry(8, wallH, 5), {
      x: x + 7,
      y: wallH / 2,
      z: z + sz,
    });
    batch.add(palette.zincRoofDark, new THREE.BoxGeometry(8.4, 1.4, 5.4), {
      x: x + 7,
      y: wallH + 0.7,
      z: z + sz,
    });
    staticBox(ctx, x + 7, wallH / 2, z + sz, 8, wallH, 5);
  }

  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(8, 0.12, 12), { x: x + 7, y: 0.06, z });
  for (const gz of [-2.4, 2.4]) {
    batch.add(palette.parisLimestone, new THREE.BoxGeometry(0.8, 2.8, 0.8), {
      x: x + 11,
      y: 1.4,
      z: z + gz,
    });
    batch.add(palette.lampIron, new THREE.BoxGeometry(0.15, 1.8, 3.6), {
      x: x + 11,
      y: 0.9,
      z: z + gz + Math.sign(gz) * 2.1,
    });
  }
  staticBox(ctx, x + 11, 1.0, z - 4.5, 0.6, 2.0, 4.2);
  staticBox(ctx, x + 11, 1.0, z + 4.5, 0.6, 2.0, 4.2);

  batch.add(palette.doorBrown, new THREE.BoxGeometry(0.14, 2.6, 1.8), { x: x + 3.05, y: 1.3, z });
  for (const wz of [-5, -2.5, 2.5, 5]) {
    batch.add(palette.parisWindow, new THREE.BoxGeometry(0.12, 1.6, 0.9), {
      x: x + 3.04,
      y: 4.2,
      z: z + wz,
    });
  }
}

/** Doctor's practice on Rue du Cherche-Midi: narrower building facing -Z, brass plate and bench. */
function deWeckerClinic(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  haussmannBlock(batch, ctx, {
    x,
    z,
    width: 6.2,
    depth: 7.5,
    floors: 5,
    ry: Math.PI,
    seed: 8501,
    shop: false,
    backWindows: true,
  });
  batch.add(palette.brass, new THREE.BoxGeometry(0.45, 0.35, 0.08), {
    x: x - 0.95,
    y: 1.55,
    z: z - 3.82,
  });
  parkBench(batch, ctx, x + 1.6, z - 4.4, 0);
}

/** Juan Luna's studio: tall north-facing (-Z) glass studio window on the top floor, easels inside. */
function lunaStudio(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  const w = 10;
  const d = 8.5;
  const baseH = 9.5;
  batch.add(palette.parisLimestone, new THREE.BoxGeometry(w, baseH, d), { x, y: baseH / 2, z });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(w + 0.1, 0.55, d + 0.1), {
    x,
    y: 0.28,
    z,
  });
  batch.add(palette.doorBrown, new THREE.BoxGeometry(1.3, 2.4, 0.12), {
    x,
    y: 1.2,
    z: z - d / 2 - 0.04,
  });
  for (const wx of [-3.2, 3.2]) {
    for (const fy of [1.5, 4.4, 7.2]) {
      batch.add(palette.parisWindow, new THREE.BoxGeometry(0.9, 1.5, 0.1), {
        x: x + wx,
        y: fy,
        z: z - d / 2 - 0.04,
      });
    }
  }

  const studioH = 4.4;
  batch.add(palette.parisLimestone, new THREE.BoxGeometry(w, studioH, d * 0.45), {
    x,
    y: baseH + studioH / 2,
    z: z + d * 0.25,
  });
  batch.add(palette.zincRoofDark, new THREE.BoxGeometry(w + 0.4, 0.35, d * 0.6), {
    x,
    y: baseH + studioH + 0.15,
    z: z + d * 0.2,
  });
  batch.add(palette.parisGlass, new THREE.BoxGeometry(w - 1.2, studioH - 0.5, 0.12), {
    x,
    y: baseH + studioH / 2 - 0.1,
    z: z - d * 0.45,
    rx: 0.22,
  });

  for (const ex of [-2.0, 2.0]) {
    batch.add(palette.deckWood, new THREE.BoxGeometry(0.12, 2.2, 0.12), {
      x: x + ex,
      y: baseH + 1.1,
      z: z - 1.2,
      rx: 0.15,
    });
    batch.add(palette.awningCream, new THREE.BoxGeometry(1.4, 1.0, 0.08), {
      x: x + ex,
      y: baseH + 1.45,
      z: z - 1.35,
      rx: 0.15,
    });
  }
  staticBox(ctx, x, baseH / 2, z, w, baseH, d);
}

/** Bookshop on Rue des Saints-Peres facing -Z with books displayed in the ground-floor window. */
function bookshop(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  haussmannBlock(batch, ctx, {
    x,
    z,
    width: 8,
    depth: 8,
    floors: 5,
    ry: Math.PI,
    seed: 8902,
    plainGround: true,
    corner: 'round-right',
    sideWindows: true,
  });
  const front = z - 4.05;
  batch.add(palette.doorBrown, new THREE.BoxGeometry(7.0, 2.8, 0.16), { x, y: 1.4, z: front });
  batch.add(palette.doorBrown, new THREE.BoxGeometry(1.1, 2.25, 0.2), {
    x: x + 2.1,
    y: 1.13,
    z: front - 0.04,
  });
  batch.add(palette.parisWindow, new THREE.BoxGeometry(4.0, 1.7, 0.1), {
    x: x - 0.9,
    y: 1.32,
    z: front - 0.06,
  });
  const bookColors = [palette.iron, palette.gaslight, palette.streetSignBlue, palette.awningCream];
  for (let i = 0; i < 6; i++) {
    batch.add(bookColors[i % bookColors.length]!, new THREE.BoxGeometry(0.32, 0.45, 0.16), {
      x: x + 0.5 - i * 0.58,
      y: 0.78,
      z: front - 0.14,
    });
  }
  const awning = new THREE.BoxGeometry(7.2, 0.12, 1.3);
  awning.rotateX(-0.28);
  batch.add(palette.awningGreen, awning, { x, y: 2.75, z: front - 0.55 });
}

/** Large 1889 Exposition Universelle pavilion building with arched roof and flags. */
function fairPavilion(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number, ry: number): void {
  const w = 22;
  const h = 5.5;
  const d = 10;
  batch.add(palette.parisLimestone, new THREE.BoxGeometry(w, h, d), { x, y: h / 2, z, ry });
  batch.add(palette.parisGlass, new THREE.CylinderGeometry(3.8, 3.8, w - 2, 12, 1, false, 0, Math.PI), {
    x,
    y: h,
    z,
    rz: Math.PI / 2,
    ry,
  });
  batch.add(palette.gaslight, new THREE.BoxGeometry(w + 0.4, 0.35, d + 0.4), {
    x,
    y: h + 0.1,
    z,
    ry,
  });
  const flagColors = [palette.streetSignBlue, palette.shirt, palette.iron];
  for (let i = -2; i <= 2; i++) {
    const fx = x + i * 4.5;
    batch.add(palette.lampIron, new THREE.CylinderGeometry(0.05, 0.05, 2.2, 5), {
      x: fx,
      y: h + 4.4,
      z,
    });
    batch.add(flagColors[(i + 2) % 3]!, new THREE.BoxGeometry(0.9, 0.55, 0.06), {
      x: fx + 0.45,
      y: h + 5.1,
      z,
    });
  }
  staticBox(ctx, x, h / 2, z, w, h, d, ry);
}

function fairStall(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number, ry: number): void {
  batch.add(palette.deckWood, new THREE.BoxGeometry(3.2, 1.0, 1.6), { x, y: 0.5, z, ry });
  batch.add(palette.awningRed, new THREE.BoxGeometry(3.5, 0.15, 2.1), { x, y: 2.5, z, ry });
  staticBox(ctx, x, 1.0, z, 3.4, 2.0, 1.8, ry);
}

/** Stamps the idle bay horse (without its rider) into the static batch inside the arena ring. */
function stampIdleHorse(
  batch: StaticBatch,
  x: number,
  z: number,
  ry: number,
  neckPitch = NECK_REST,
): void {
  const horse = buildHorseAndRider();
  horse.rider.root.removeFromParent();
  horse.neck.rotation.x = neckPitch;
  horse.root.position.set(x, 0, z);
  horse.root.rotation.y = ry;
  horse.root.updateMatrixWorld(true);
  const byMat = new Map<THREE.Material, number>(
    [palette.bay, palette.bayDark, palette.hoof, palette.saddle].map((c) => [mat(c), c]),
  );
  horse.root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const c = byMat.get(child.material as THREE.Material) ?? palette.bay;
      batch.addTransformed(c, child.geometry, child.matrixWorld);
      child.geometry.dispose();
    }
  });
  horse.rider.root.traverse((c) => {
    if (c instanceof THREE.Mesh) c.geometry.dispose();
  });
}

/** Wooden grandstand on one long side of the arena with 3 stepped tiers, canvas roof and pennants. */
function arenaGrandstand(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  zFront: number,
  dirZ: 1 | -1,
  roofH: number,
): void {
  const len = 20;
  const tiers: [number, number, number][] = [
    [0.5, 0.7, palette.deckWood],
    [1.6, 1.4, palette.crate],
    [2.7, 2.1, palette.deckWood],
  ];
  for (const [offset, h, col] of tiers) {
    batch.add(col, new THREE.BoxGeometry(len, h, 1.1), {
      x,
      y: h / 2,
      z: zFront + dirZ * offset,
    });
  }
  const backZ = zFront + dirZ * 3.45;
  batch.add(palette.crateDark, new THREE.BoxGeometry(len, roofH - 0.5, 0.3), {
    x,
    y: (roofH - 0.5) / 2,
    z: backZ,
  });
  for (let px = x - 9; px <= x + 9; px += 4.5) {
    batch.add(palette.crateDark, new THREE.BoxGeometry(0.18, roofH - 0.35, 0.18), {
      x: px,
      y: (roofH - 0.35) / 2,
      z: zFront + dirZ * 0.2,
    });
  }
  const roofCenterZ = zFront + dirZ * 1.85;
  batch.add(palette.awningCream, new THREE.BoxGeometry(len + 0.8, 0.16, 4.1), {
    x,
    y: roofH,
    z: roofCenterZ,
    rx: -dirZ * 0.12,
  });
  batch.add(palette.iron, new THREE.BoxGeometry(len + 0.9, 0.18, 0.12), {
    x,
    y: roofH + 0.22,
    z: zFront - dirZ * 0.15,
  });

  const pennants = [palette.iron, palette.streetSignBlue, palette.gaslight, palette.shirt];
  for (let i = 0; i < 4; i++) {
    const fx = x - 6.9 + i * 4.6;
    const fz = roofCenterZ;
    batch.add(palette.lampIron, new THREE.CylinderGeometry(0.04, 0.04, 2.1, 5), {
      x: fx,
      y: roofH + 1.05,
      z: fz,
    });
    const pCol = pennants[i % pennants.length]!;
    batch.add(pCol, new THREE.ConeGeometry(0.28, 1.0, 3), {
      x: fx + 0.5,
      y: roofH + 1.8,
      z: fz,
      rz: -Math.PI / 2,
      sx: 0.25,
    });
  }
  staticBox(ctx, x, roofH / 2, roofCenterZ, len + 0.6, roofH, 3.8);
}

/** Open-air Wild West show arena outside the fair with oval track, grandstands, arch and horses. */
function wildWestArena(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  const rx = 13.8;
  const rz = 6.9;

  // Packed-earth oval arena floor inside a slightly wider sandy apron.
  batch.add(palette.sandWet, new THREE.CylinderGeometry(1, 1, 0.06, 22), {
    x,
    y: 0.03,
    z,
    sx: rx + 1.2,
    sz: rz + 1.1,
  });
  batch.add(palette.dirt, new THREE.CylinderGeometry(1, 1, 0.09, 22), {
    x,
    y: 0.045,
    z,
    sx: rx,
    sz: rz,
  });

  // Oval rail fence around the ring, with an opening on the east side (+X) under the arch.
  const segs = 26;
  const ringPts: { px: number; pz: number; open: boolean }[] = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    ringPts.push({
      px: x + Math.cos(a) * rx,
      pz: z + Math.sin(a) * rz,
      open: Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.26,
    });
  }
  for (let i = 0; i < segs; i++) {
    const p0 = ringPts[i]!;
    const p1 = ringPts[(i + 1) % segs]!;
    if (!p0.open) {
      batch.add(palette.crateDark, new THREE.BoxGeometry(0.14, 0.95, 0.14), {
        x: p0.px,
        y: 0.48,
        z: p0.pz,
      });
    }
    if (!p0.open && !p1.open) {
      const dx = p1.px - p0.px;
      const dz = p1.pz - p0.pz;
      const len = Math.hypot(dx, dz);
      const ry = -Math.atan2(dz, dx);
      for (const railY of [0.42, 0.78]) {
        batch.add(palette.deckWood, new THREE.BoxGeometry(len, 0.08, 0.07), {
          x: (p0.px + p1.px) / 2,
          y: railY,
          z: (p0.pz + p1.pz) / 2,
          ry,
        });
      }
    }
  }

  // Grandstands along both long sides (north side kept slightly lower so camera sees into the ring).
  arenaGrandstand(batch, ctx, x - 0.5, z - 8.1, -1, 3.15);
  arenaGrandstand(batch, ctx, x - 0.5, z + 7.9, 1, 3.9);

  // Tall wooden entrance arch on the east end (+X), facing the boulevard stop.
  const ax = x + rx + 0.6;
  for (const s of [-1, 1]) {
    const pz = z + s * 2.55;
    batch.add(palette.quayStone, new THREE.BoxGeometry(0.85, 0.55, 0.85), {
      x: ax,
      y: 0.28,
      z: pz,
    });
    batch.add(palette.crateDark, new THREE.BoxGeometry(0.5, 5.1, 0.5), {
      x: ax,
      y: 2.55,
      z: pz,
    });
    batch.add(palette.deckWood, new THREE.BoxGeometry(0.28, 1.5, 0.28), {
      x: ax,
      y: 3.95,
      z: pz - s * 0.6,
      rx: s * 0.72,
    });
    batch.add(palette.lampIron, new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), {
      x: ax,
      y: 5.9,
      z: pz,
    });
    batch.add(palette.iron, new THREE.ConeGeometry(0.26, 0.95, 3), {
      x: ax,
      y: 6.55,
      z: pz + 0.45,
      rx: Math.PI / 2,
      sz: 0.25,
    });
    staticBox(ctx, ax, 2.5, pz, 0.9, 5.0, 0.9);
  }
  // Overhead timber beams and stepped pediment (plain wood + red trim, no text).
  batch.add(palette.deckWood, new THREE.BoxGeometry(0.65, 0.75, 6.2), {
    x: ax,
    y: 4.55,
    z,
  });
  batch.add(palette.iron, new THREE.BoxGeometry(0.72, 0.14, 6.4), {
    x: ax,
    y: 4.98,
    z,
  });
  batch.add(palette.crate, new THREE.BoxGeometry(0.55, 0.65, 3.2), {
    x: ax,
    y: 5.38,
    z,
  });
  batch.add(palette.iron, new THREE.BoxGeometry(0.62, 0.14, 3.4), {
    x: ax,
    y: 5.75,
    z,
  });

  // Standing riderless horses inside the ring in calm idle poses.
  stampIdleHorse(batch, x + 5.2, z - 1.1, 0.95);
  stampIdleHorse(batch, x - 0.8, z + 1.2, -2.05, 1.28);
  stampIdleHorse(batch, x - 5.4, z - 1.5, 0.35);
  stampIdleHorse(batch, x - 3.6, z + 2.3, 2.35, 1.15);
}
