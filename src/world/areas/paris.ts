import * as THREE from 'three';
import { StaticBatch, disposeObject, seeded } from '../kit';
import { palette } from '../palette';
import { boundary, disposePhysics, staticBox, type PhysicsCtx } from '../physics';
import {
  gasLamp,
  haussmannBlock,
  haussmannRow,
  morrisColumn,
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
 * Paris across three eras (1883, 1885, 1889) on one shared city layout.
 *
 * Layout (top view, +Z south, +X east):
 *   west edge (x < -56) : the Seine with stone embankment and bridge at z = 0
 *   west (x = -52..-12) : Champ de Mars (empty lawn in 1883/1885; Eiffel Tower + fair in 1889)
 *   south-west (z = 44) : Wild West arena outside the fair (1889)
 *   center (x = 0)      : grand boulevard north-south, Paris terminus at z = -53
 *   east streets        : Rue de Maubeuge (z = -22), Laennec Hospital, Rue du Cherche-Midi (z = 10),
 *                         Rue des Saints-Peres (z = 26) and Juan Luna's studio
 */
export function buildParis(scene: THREE.Scene, ctx: PhysicsCtx, era: ParisEra): Area {
  const batch = new StaticBatch();
  const props = new Props(ctx, scene);
  const signsGroup = new THREE.Group();
  signsGroup.name = 'paris-signs';
  const lit = era === '1889';

  // Ground base: east of the Seine embankment (x = -56).
  batch.add(palette.cobble, new THREE.BoxGeometry(140, 4, 150), { x: 14, y: -2, z: 0 });
  staticBox(ctx, 14, -2, 0, 140, 4, 150);

  // Seine embankment wall and parapet along x = -56.
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(1.4, 3.6, 150), {
    x: -56.2,
    y: -1.4,
    z: 0,
  });
  batch.add(palette.quayStone, new THREE.BoxGeometry(3.2, 0.08, 150), {
    x: -54.5,
    y: 0.04,
    z: 0,
  });
  staticBox(ctx, -56, 0.6, 0, 1.2, 1.2, 150);

  // Stone arch bridge across the Seine at z = 0.
  seineBridge(batch, -56, 0);

  // Champ de Mars: gravel paths and central lawn (-50..-14, -26..26).
  batch.add(palette.grass, new THREE.BoxGeometry(36, 0.06, 52), { x: -32, y: 0.03, z: 0 });
  batch.add(palette.dirt, new THREE.BoxGeometry(6, 0.08, 52), { x: -34, y: 0.04, z: 0 });
  batch.add(palette.dirt, new THREE.BoxGeometry(38, 0.08, 6), { x: -32, y: 0.04, z: 0 });
  // Main north-south avenue and east-west cross streets.
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(14, 0.05, 108), { x: 0, y: 0.025, z: 0 });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(56, 0.05, 10), {
    x: 28,
    y: 0.025,
    z: -22,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(52, 0.05, 10), {
    x: 26,
    y: 0.025,
    z: 10,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(52, 0.05, 10), {
    x: 26,
    y: 0.025,
    z: 26,
  });

  // Grand Paris railway terminus at the north end of the boulevard.
  parisTerminus(batch, ctx, 0, -54);

  // Haussmann perimeter blocks framing the boulevard and side streets.
  haussmannRow(batch, ctx, -52, -17, -48, 41);
  haussmannRow(batch, ctx, 18, 54, -48, 47);

  // Rue de Maubeuge (south side z = -15, facing -Z toward camera): Hotel de Paris sits at x = 16, z = -15.
  hotelDeParis(batch, ctx, 16, -15);
  streetSign(batch, ctx, signsGroup, 11, -27.2, Math.PI * 0.25, 'Rue de Maubeuge');

  // Laennec Hospital at (26, -4) facing +X toward its courtyard (x = 34..46).
  laennecHospital(batch, ctx, 26, -4);

  // Rue du Cherche-Midi (z = 10, south side z = 17.5 facing -Z): Dr. de Wecker's clinic sits at x = 18.
  deWeckerClinic(batch, ctx, 18, 17.5);
  streetSign(batch, ctx, signsGroup, 9.5, 5.8, Math.PI * 0.25, 'Rue du Cherche-Midi');

  // Rue des Saints-Peres (z = 26, south side z = 36 facing -Z): bookshop at x = 17; Juan Luna's studio at x = 36.
  bookshop(batch, ctx, 17, 36);
  haussmannRow(batch, ctx, 22, 30, 36, 61, true, 8);
  lunaStudio(batch, ctx, 36, 36);
  haussmannRow(batch, ctx, 42, 54, 36, 62, true, 8);
  streetSign(batch, ctx, signsGroup, 9.5, 21.8, Math.PI * 0.25, 'Rue des Saints-Peres');

  // Boulevard plane trees, gas lamps and Morris columns.
  const rnd = seeded(188);
  for (let z = -38; z <= 38; z += 14) {
    planeTree(batch, ctx, -8, z, Math.floor(rnd() * 1000));
    planeTree(batch, ctx, 7.5, z, Math.floor(rnd() * 1000));
    gasLamp(batch, ctx, -6.5, z + 5, lit);
    gasLamp(batch, ctx, 6.5, z + 5, lit);
  }
  for (const [mx, mz] of [
    [-8, -12],
    [8.5, -16],
    [8.5, 16],
  ] as const) {
    morrisColumn(batch, ctx, mx, mz);
  }

  // Champ de Mars border trees and benches.
  for (const z of [-22, -10, 10, 22]) {
    planeTree(batch, ctx, -14, z, Math.floor(rnd() * 1000));
    planeTree(batch, ctx, -50, z, Math.floor(rnd() * 1000));
  }

  // Loose street life props.
  props.cafeTable(11, -18);
  props.cafeTable(28, 13);
  props.flowerCart(11, -6, 0.3);
  props.flowerCart(-9, 14, -0.4);
  props.crate(11, -39, 0.85);
  props.barrel(12.2, -38.6);
  props.barrel(12.8, -39.5);

  // Era-specific Eiffel Tower, 1889 fair pavilions and Wild West arena.
  let tower: EiffelTower | null = null;
  if (era === '1889') {
    tower = new EiffelTower(TOWER_CENTER, ctx);
    scene.add(tower.group);

    fairPavilion(batch, ctx, -34, -22, 0);
    fairPavilion(batch, ctx, -34, 22, 0);
    // Extra lit gas lamps and festive stalls along the fairgrounds.
    for (const [lx, lz] of [
      [-22, -12],
      [-22, 12],
      [-46, -12],
      [-46, 12],
      [-20, 0],
    ] as const) {
      gasLamp(batch, ctx, lx, lz, true);
    }
    fairStall(batch, ctx, -19, -8, Math.PI / 2);
    fairStall(batch, ctx, -19, 12, Math.PI / 2);

    // Fence separating the fair from the Wild West show arena outside.
    for (let x = -52; x <= -14; x += 4) {
      batch.add(palette.lampIron, new THREE.BoxGeometry(3.8, 0.9, 0.12), {
        x,
        y: 0.45,
        z: 30.5,
      });
    }
    staticBox(ctx, -33, 0.5, 30.5, 38, 1.2, 0.5);

    // Wild West show open-air arena outside the fair at the south edge.
    wildWestArena(batch, ctx, -32, 44);
  } else {
    // In 1883 and 1885 the Champ de Mars is an open lawn with a central path and benches.
    for (const bz of [-8, 8]) {
      batch.add(palette.deckWood, new THREE.BoxGeometry(2.4, 0.14, 0.6), {
        x: -24,
        y: 0.5,
        z: bz,
      });
      batch.add(palette.lampIron, new THREE.BoxGeometry(2.4, 0.5, 0.08), {
        x: -24,
        y: 0.8,
        z: bz - 0.25,
      });
      staticBox(ctx, -24, 0.4, bz, 2.4, 0.8, 0.7);
    }
  }

  boundary(ctx, -53.5, 55, -47, 53);
  const staticGroup = batch.build(`paris-${era}-static`);
  scene.add(staticGroup);
  scene.add(signsGroup);

  const water = new Water(30, 160, 4, new THREE.Vector3(-72, -1.2, 0), 0.35);
  scene.add(water.mesh);

  const stops = buildParisStops(era);
  for (const s of stops) scene.add(s.group);

  const look = parisLook(era);

  return {
    id: `paris-${era}`,
    name: `Paris, ${era}`,
    spawn: era === '1889' ? new THREE.Vector3(-12, 0, 8) : new THREE.Vector3(0, 0, -37),
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

function buildParisStops(era: ParisEra): StopMarker[] {
  const list = storiesFor('paris', era);
  const byId = (id: string) => list.find((s) => s.id === id)!;
  if (era === '1883') {
    return [
      new StopMarker(
        byId('paris-1883-hotel'),
        new THREE.Vector3(16, 0, -20.5),
        new THREE.Vector3(16, 4.5, -16),
        1.2,
      ),
      new StopMarker(byId('paris-1883-hospital'), new THREE.Vector3(40, 0, -4)),
      new StopMarker(byId('paris-1883-station'), new THREE.Vector3(0, 0, -43)),
    ];
  }
  if (era === '1885') {
    return [
      new StopMarker(
        byId('paris-1885-clinic'),
        new THREE.Vector3(18, 0, 11.5),
        new THREE.Vector3(18, 4.0, 16.5),
        1.15,
      ),
      new StopMarker(
        byId('paris-1885-studio'),
        new THREE.Vector3(36, 0, 28.5),
        new THREE.Vector3(36, 5.0, 35),
        1.25,
      ),
      new StopMarker(byId('paris-1885-station'), new THREE.Vector3(0, 0, -43)),
    ];
  }
  return [
    new StopMarker(
      byId('paris-1889-tower'),
      new THREE.Vector3(-19, 0, 5.5),
      new THREE.Vector3(-34, 18.5, 0),
      2.8,
    ),
    new StopMarker(byId('paris-1889-indios-bravos'), new THREE.Vector3(-12, 0, 39)),
    new StopMarker(
      byId('paris-1889-godfather'),
      new THREE.Vector3(36, 0, 28.5),
      new THREE.Vector3(36, 5.0, 35),
      1.25,
    ),
    new StopMarker(
      byId('paris-1889-morga'),
      new THREE.Vector3(17, 0, 28.5),
      new THREE.Vector3(17, 4.2, 35),
      1.15,
    ),
    new StopMarker(byId('paris-1889-station'), new THREE.Vector3(0, 0, -43)),
  ];
}

function parisLook(era: ParisEra): AreaLook {
  if (era === '1883') {
    return {
      sky: 0xb6d8ea,
      fog: 0xc8e0eb,
      fogNear: 58,
      fogFar: 170,
      sunColor: 0xffe9c8,
      sunIntensity: 3.3,
      sunDirection: new THREE.Vector3(0.45, 0.72, 0.52).normalize(),
      hemiSky: 0xd9ebf5,
      hemiGround: 0x9b866c,
      hemiIntensity: 1.05,
    };
  }
  if (era === '1885') {
    return {
      sky: 0x9aaec2,
      fog: 0xaab9c7,
      fogNear: 42,
      fogFar: 140,
      sunColor: 0xdbe6f5,
      sunIntensity: 2.3,
      sunDirection: new THREE.Vector3(0.65, 0.42, 0.62).normalize(),
      hemiSky: 0xb6c7d9,
      hemiGround: 0x6f6e73,
      hemiIntensity: 1.15,
    };
  }
  return {
    sky: 0x9a828f,
    fog: 0xa88a87,
    fogNear: 50,
    fogFar: 165,
    sunColor: 0xffba73,
    sunIntensity: 2.9,
    sunDirection: new THREE.Vector3(0.78, 0.3, 0.55).normalize(),
    hemiSky: 0xaab0d1,
    hemiGround: 0x735b4d,
    hemiIntensity: 1.0,
  };
}

function seineBridge(batch: StaticBatch, edgeX: number, z: number): void {
  const len = 30;
  const w = 8;
  batch.add(palette.quayStone, new THREE.BoxGeometry(len, 0.9, w), {
    x: edgeX - len / 2,
    y: 0.45,
    z,
  });
  for (const sz of [-w / 2 + 0.3, w / 2 - 0.3]) {
    batch.add(palette.parisLimestone, new THREE.BoxGeometry(len, 0.9, 0.5), {
      x: edgeX - len / 2,
      y: 1.35,
      z: z + sz,
    });
  }
  for (const px of [edgeX - 9, edgeX - 21]) {
    batch.add(palette.quayStoneDark, new THREE.BoxGeometry(2.4, 3.2, w + 0.8), {
      x: px,
      y: -1.1,
      z,
    });
  }
}

/** Paris railway terminus: big arched glass front, limestone wings, clock and steam locomotive. */
function parisTerminus(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  const w = 32;
  const h = 8.5;
  batch.add(palette.parisLimestone, new THREE.BoxGeometry(w, h, 9), { x, y: h / 2, z });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(w + 0.3, 0.7, 9.3), { x, y: 0.35, z });
  batch.add(palette.zincRoofDark, new THREE.BoxGeometry(w + 0.6, 1.4, 9.6), {
    x,
    y: h + 0.7,
    z,
  });

  // Big arched glass train-shed front in the middle.
  batch.add(0x3a4d5c, new THREE.CylinderGeometry(5.8, 5.8, 9.3, 14, 1, false, 0, Math.PI), {
    x,
    y: 4.5,
    z,
    rz: Math.PI / 2,
    ry: Math.PI / 2,
  });
  batch.add(0x3a4d5c, new THREE.BoxGeometry(11.6, 4.5, 9.3), { x, y: 2.25, z });
  batch.add(palette.lampIron, new THREE.BoxGeometry(12.2, 0.35, 9.5), { x, y: 4.6, z });

  // Station clock centered above the arch.
  batch.add(palette.shirt, new THREE.CylinderGeometry(1.15, 1.15, 0.2, 16), {
    x,
    y: h + 0.5,
    z: z + 4.75,
    rx: Math.PI / 2,
  });
  batch.add(palette.hat, new THREE.BoxGeometry(0.09, 0.75, 0.06), {
    x,
    y: h + 0.78,
    z: z + 4.87,
  });
  batch.add(palette.hat, new THREE.BoxGeometry(0.55, 0.09, 0.06), {
    x: x + 0.24,
    y: h + 0.5,
    z: z + 4.87,
  });

  // Side arched windows.
  for (const sx of [-12, -9, 9, 12]) {
    batch.add(0x2c3138, new THREE.BoxGeometry(1.6, 4.4, 0.12), {
      x: x + sx,
      y: 3.4,
      z: z + 4.54,
    });
  }
  staticBox(ctx, x, h / 2, z, w, h, 9);

  // Locomotive waiting on the platform to the west side so it never blocks the camera.
  const lx = x - 22;
  const lz = z + 0.5;
  batch.add(palette.railSteel, new THREE.BoxGeometry(14, 0.2, 2.2), { x: lx, y: 0.1, z: lz });
  batch.add(palette.hull, new THREE.CylinderGeometry(0.95, 0.95, 5, 12), {
    x: lx - 1,
    y: 1.9,
    z: lz,
    rz: Math.PI / 2,
  });
  batch.add(palette.hull, new THREE.BoxGeometry(2.2, 2.6, 2.3), { x: lx + 2.6, y: 2.3, z: lz });
  batch.add(palette.iron, new THREE.BoxGeometry(2.4, 0.25, 2.5), { x: lx + 2.6, y: 3.7, z: lz });
  batch.add(palette.hull, new THREE.CylinderGeometry(0.28, 0.4, 1.3, 8), {
    x: lx - 2.8,
    y: 3.2,
    z: lz,
  });
  for (const wx of [-3.0, -1.2, 0.6, 2.4]) {
    for (const s of [-1, 1]) {
      batch.add(palette.iron, new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12), {
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
    floors: 4,
    ry: Math.PI,
    seed: 8301,
    shop: false,
  });
  // Entrance canopy and small plaque shape beside the door on the -Z front.
  batch.add(palette.lampIron, new THREE.BoxGeometry(2.4, 0.14, 1.2), { x, y: 2.75, z: z - 4.5 });
  batch.add(palette.brass, new THREE.BoxGeometry(0.55, 0.45, 0.08), {
    x: x - 1.15,
    y: 1.7,
    z: z - 4.05,
  });
}

/** Long, low institutional hospital building (Laennec) with courtyard and iron gate. */
function laennecHospital(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  // Main building spine (along Z) and two wings extending toward +X to form a courtyard.
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

  // Courtyard paving and front iron fence with open gate piers at x + 11.
  batch.add(palette.quayStone, new THREE.BoxGeometry(8, 0.06, 12), { x: x + 7, y: 0.03, z });
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

  // Arched hospital doorway and symmetrical windows facing the courtyard (+X).
  batch.add(palette.doorBrown, new THREE.BoxGeometry(0.14, 2.6, 1.8), { x: x + 3.05, y: 1.3, z });
  for (const wz of [-5, -2.5, 2.5, 5]) {
    batch.add(0x2c3138, new THREE.BoxGeometry(0.12, 1.6, 0.9), {
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
    depth: 6.5,
    floors: 4,
    ry: Math.PI,
    seed: 8501,
    shop: false,
  });
  // Brass plate beside the door on the -Z facade.
  batch.add(palette.brass, new THREE.BoxGeometry(0.45, 0.35, 0.08), {
    x: x - 0.95,
    y: 1.55,
    z: z - 3.32,
  });
  // Waiting bench outside.
  batch.add(palette.deckWood, new THREE.BoxGeometry(2.1, 0.14, 0.55), {
    x: x + 1.6,
    y: 0.5,
    z: z - 3.9,
  });
  batch.add(palette.lampIron, new THREE.BoxGeometry(2.1, 0.5, 0.08), {
    x: x + 1.6,
    y: 0.8,
    z: z - 3.65,
  });
  staticBox(ctx, x + 1.6, 0.4, z - 3.8, 2.1, 0.8, 0.7);
}

/** Juan Luna's studio: tall north-facing (-Z) glass studio window on the top floor, easels inside. */
function lunaStudio(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  const w = 10;
  const d = 8.5;
  const baseH = 8.2;
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

  // Top-floor studio room with tall sloped north-facing (-Z) glass window and easels inside.
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
  // Tall angled glass studio window on the north (-Z) face toward the camera.
  batch.add(0x7ca2b8, new THREE.BoxGeometry(w - 1.2, studioH - 0.5, 0.12), {
    x,
    y: baseH + studioH / 2 - 0.1,
    z: z - d * 0.45,
    rx: 0.22,
  });

  // Two wooden easels with canvases visible inside the top studio room.
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
    floors: 4,
    ry: Math.PI,
    seed: 8902,
    plainGround: true,
  });
  const front = z - 4.05;
  batch.add(palette.doorBrown, new THREE.BoxGeometry(7.6, 3.0, 0.16), { x, y: 1.5, z: front });
  batch.add(palette.doorBrown, new THREE.BoxGeometry(1.1, 2.3, 0.2), {
    x: x + 2.3,
    y: 1.15,
    z: front - 0.04,
  });
  // Display window with little book stacks inside.
  batch.add(0x28333d, new THREE.BoxGeometry(4.4, 1.75, 0.1), {
    x: x - 1.1,
    y: 1.35,
    z: front - 0.06,
  });
  const bookColors = [palette.iron, palette.gaslight, palette.streetSignBlue, palette.awningCream];
  for (let i = 0; i < 6; i++) {
    batch.add(bookColors[i % bookColors.length]!, new THREE.BoxGeometry(0.32, 0.45, 0.16), {
      x: x + 0.5 - i * 0.62,
      y: 0.78,
      z: front - 0.14,
    });
  }
  const awning = new THREE.BoxGeometry(7.8, 0.12, 1.3);
  awning.rotateX(-0.28);
  batch.add(palette.morrisGreen, awning, { x, y: 2.95, z: front - 0.55 });
}

/** Large 1889 Exposition Universelle pavilion building with arched roof and flags. */
function fairPavilion(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number, ry: number): void {
  const w = 22;
  const h = 5.5;
  const d = 10;
  batch.add(palette.parisLimestone, new THREE.BoxGeometry(w, h, d), { x, y: h / 2, z, ry });
  batch.add(0x88b0c4, new THREE.CylinderGeometry(3.8, 3.8, w - 2, 12, 1, false, 0, Math.PI), {
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
  // Flags along the pavilion roof.
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

/** Open-air Wild West show arena with tiered grandstands and flags outside the fair. */
function wildWestArena(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  // Sandy arena ring.
  batch.add(palette.sand, new THREE.CylinderGeometry(11.5, 11.5, 0.08, 18), { x, y: 0.04, z });
  // Segmented grandstands forming an open-air ring, leaving an entrance gap on the +X side.
  const segs = 12;
  const r = 13.5;
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.45) continue; // entrance gap facing +X
    const sx = x + Math.cos(a) * r;
    const sz = z + Math.sin(a) * r;
    const rot = -a + Math.PI / 2;
    batch.add(palette.deckWood, new THREE.BoxGeometry(6.8, 2.4, 3.4), {
      x: sx,
      y: 1.2,
      z: sz,
      ry: rot,
    });
    batch.add(palette.awningCream, new THREE.BoxGeometry(6.8, 0.2, 3.8), {
      x: sx,
      y: 3.8,
      z: sz,
      ry: rot,
    });
    if (i % 2 === 0) {
      batch.add(palette.lampIron, new THREE.CylinderGeometry(0.05, 0.05, 1.6, 5), {
        x: sx,
        y: 4.7,
        z: sz,
      });
      batch.add(palette.iron, new THREE.BoxGeometry(0.85, 0.5, 0.06), {
        x: sx + 0.4,
        y: 5.2,
        z: sz,
      });
    }
    staticBox(ctx, sx, 1.5, sz, 6.8, 3.0, 3.4, rot);
  }
}
