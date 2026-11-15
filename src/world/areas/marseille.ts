import * as THREE from 'three';
import { StaticBatch, disposeObject, seeded } from '../kit';
import { palette } from '../palette';
import { disposePhysics, staticBox, type PhysicsCtx } from '../physics';
import { buildPaperSurround } from '../paperShader';
import { bollard, gasLamp, houseRow, planeTree, townHouse } from '../builders';
import { fishingBoat, steamer, buildTrain } from '../vessels';
import { Props } from '../Props';
import { Water } from '../Water';
import { StopMarker } from '../StopMarker';
import { storiesFor } from '../../content/stories';
import type { Area } from '../Area';

/**
 * Marseille in June 1882 (arrival by Djemnah) and October 1891 (departure by Melbourne).
 *
 * Layout (top view, +Z toward the sea):
 *   north  : railway station and plaza with plane trees
 *   middle : a row of town houses with an avenue cut through it
 *   south  : the stone quay, the steamer, and the sea with the Chateau d'If
 */
export function buildMarseille(
  scene: THREE.Scene,
  ctx: PhysicsCtx,
  year: 1882 | 1891 = 1882,
): Area {
  const batch = new StaticBatch();
  const props = new Props(ctx, scene);

  // Ground: the land block ends in a stone quay wall at z = 12.
  const QUAY_Z = 12;
  batch.add(palette.marseilleLand, new THREE.BoxGeometry(280, 4, 200), {
    x: 5,
    y: -2,
    z: QUAY_Z - 100,
  });
  staticBox(ctx, 5, -2, QUAY_Z - 100, 280, 4, 200);

  // Quay paving and its edge stones.
  batch.add(palette.quayStone, new THREE.BoxGeometry(110, 0.06, 12), {
    x: 5,
    y: 0.03,
    z: QUAY_Z - 6,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(110, 0.3, 0.7), {
    x: 5,
    y: 0.15,
    z: QUAY_Z - 0.35,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(110, 3.2, 0.4), {
    x: 5,
    y: -1.6,
    z: QUAY_Z + 0.2,
  });
  // A low curb keeps the horse out of the water.
  staticBox(ctx, 5, 0.6, QUAY_Z + 0.2, 280, 1.2, 0.8);

  // Avenue and plaza paving, slightly warmer than the quay.
  batch.add(palette.cobble, new THREE.BoxGeometry(12, 0.05, 30), { x: 10, y: 0.025, z: -12 });
  batch.add(palette.cobble, new THREE.BoxGeometry(34, 0.05, 20), { x: 10, y: 0.025, z: -36 });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(110, 0.04, 3), { x: 5, y: 0.02, z: -1.5 });

  // Town houses facing the harbor, with a gap for the avenue.
  houseRow(batch, ctx, -42, 4, -7, 11);
  houseRow(batch, ctx, 16, 52, -7, 23);
  // Houses lining the plaza, facing inward.
  for (let i = 0; i < 3; i++) {
    townHouse(batch, ctx, {
      x: -10.5,
      z: -30 - i * 7,
      width: 7,
      depth: 8,
      floors: 2 + (i % 2),
      ry: Math.PI / 2,
      wall: [palette.ochre, palette.limestone, palette.apricot][i]!,
      shutter: palette.shutterGreen,
      seed: 300 + i,
    });
    townHouse(batch, ctx, {
      x: 30.5,
      z: -30 - i * 7,
      width: 7,
      depth: 8,
      floors: 3 - (i % 2),
      ry: -Math.PI / 2,
      wall: [palette.limestone, palette.apricot, palette.ochre][i]!,
      shutter: palette.shutterBlue,
      seed: 400 + i,
    });
  }

  // The railway station closes the plaza to the north.
  station(batch, ctx, 10, -51);

  // Plaza: plane trees, a fountain and cafe tables under awnings.
  const rnd = seeded(7);
  for (const [x, z] of [
    [-2, -28],
    [-2, -40],
    [22, -28],
    [22, -40],
  ] as const) {
    planeTree(batch, ctx, x, z, Math.floor(rnd() * 1000));
  }
  fountain(batch, ctx, 10, -34);
  for (const [x, z] of [
    [24.5, -31],
    [25.5, -35.5],
    [-4, -33],
  ] as const) {
    props.cafeTable(x, z);
  }
  awning(batch, 28.2, -33, -Math.PI / 2);

  // Quay furniture.
  for (let x = -34; x <= 46; x += 9) gasLamp(batch, ctx, x, 1.2, year === 1891);
  for (let x = -30; x <= 44; x += 6.5) {
    if (x > 8 && x < 13) continue; // keep the gangway clear
    bollard(batch, ctx, x, QUAY_Z - 0.9);
  }

  // Steamer alongside the quay: Djemnah in 1882, slightly larger Melbourne in 1891 (movable for departure).
  const shipBatch = new StaticBatch();
  if (year === 1891) {
    steamer(shipBatch, ctx, 16, QUAY_Z + 4.4, 33, palette.funnel);
  } else {
    steamer(shipBatch, ctx, 14, QUAY_Z + 4.4, 28, palette.hull);
  }
  const shipGroup = shipBatch.build('marseille-steamer');
  scene.add(shipGroup);
  batch.add(palette.deckWood, new THREE.BoxGeometry(1.4, 0.12, 3.4), {
    x: 10.5,
    y: 0.55,
    z: QUAY_Z + 0.6,
    rx: -0.3,
  });

  // Cargo waiting on the quay: knock it over.
  props.crate(2, 7.5, 0.9);
  props.crate(2.9, 7.2, 0.8, 0.4);
  props.crate(2.4, 7.4, 0.7, 0.2, 1.3);
  props.crate(18, 8.2, 1.0, 0.1);
  props.crate(19.1, 8.6, 0.8, 0.6);
  props.barrel(21, 7.4);
  props.barrel(21.8, 8.2);
  props.barrel(22.6, 7.3);
  props.barrel(20.4, 9.6, 0.5, false);
  props.barrel(-14, 8.4);
  props.barrel(-13.2, 9.1);
  props.crate(-15.6, 8.8, 0.9, 0.3);

  // Little fishing boats moored further west.
  fishingBoat(batch, -10, QUAY_Z + 3.2, 0.1, 0x3f6f8c);
  fishingBoat(batch, -16, QUAY_Z + 3.0, -0.08, 0xc9a34a);
  fishingBoat(batch, -22, QUAY_Z + 3.4, 0.05, 0x9c3b2a);

  // Lookout at the west end of the quay, with an iron rail and a bench.
  for (let x = -31; x <= -25; x += 1.5) {
    batch.add(palette.lampIron, new THREE.BoxGeometry(0.07, 1.0, 0.07), {
      x,
      y: 0.5,
      z: QUAY_Z - 0.6,
    });
  }
  batch.add(palette.lampIron, new THREE.BoxGeometry(6.2, 0.07, 0.07), {
    x: -28,
    y: 1.0,
    z: QUAY_Z - 0.6,
  });
  batch.add(palette.deckWood, new THREE.BoxGeometry(2.2, 0.12, 0.6), { x: -21, y: 0.55, z: 4.5 });
  batch.add(palette.lampIron, new THREE.BoxGeometry(2.2, 0.55, 0.08), { x: -21, y: 0.85, z: 4.2 });
  staticBox(ctx, -21, 0.4, 4.4, 2.2, 0.8, 0.8);

  // The Chateau d'If on its rock in the bay.
  chateauDIf(batch, -30, 40);
  // In 1891, a small boat is tied at the Chateau d'If landing (opened to visitors in 1890).
  if (year === 1891) {
    fishingBoat(batch, -25.5, 31.8, 0.35, 0x3f6f8c);
  }

  // Distant headland across the bay, to close the horizon.
  const hills = seeded(3);
  for (let i = 0; i < 9; i++) {
    batch.add(
      i % 2 ? palette.rock : palette.rockDark,
      new THREE.IcosahedronGeometry(8 + hills() * 6, 0),
      {
        x: -90 + i * 16,
        y: -5,
        z: 95 + hills() * 10,
        sy: 0.6,
      },
    );
  }

  const playBounds = { minX: -34, maxX: 50, minZ: -47, maxZ: QUAY_Z };
  const visualBounds = { minX: -34, maxX: 50, minZ: -47, maxZ: 68 };
  const paperSurround = buildPaperSurround(playBounds, {
    borderSides: ['north', 'east', 'west'],
    landMaxZ: QUAY_Z,
  });
  scene.add(paperSurround);

  const staticGroup = batch.build('marseille-static');
  scene.add(staticGroup);

  const water = new Water(240, 90, 3, new THREE.Vector3(0, -1.2, QUAY_Z + 44));
  scene.add(water.mesh);

  const stops =
    year === 1891
      ? (() => {
          const [melbourne, lessons] = storiesFor('marseille-1891');
          return [
            new StopMarker(melbourne!, new THREE.Vector3(10.5, 0, 7.5)),
            new StopMarker(lessons!, new THREE.Vector3(-27, 0, 8.2), new THREE.Vector3(-30, 1, 40)),
          ];
        })()
      : (() => {
          const [landing, chateau, train] = storiesFor('marseille-1882');
          return [
            new StopMarker(landing!, new THREE.Vector3(10.5, 0, 7.5)),
            new StopMarker(chateau!, new THREE.Vector3(-27, 0, 8.2), new THREE.Vector3(-30, 1, 40)),
            new StopMarker(train!, new THREE.Vector3(10, 0, -43)),
          ];
        })();
  for (const s of stops) scene.add(s.group);

  const look =
    year === 1891
      ? {
          sky: 0xc6d8e0,
          fog: 0xd0dcdf,
          fogNear: 55,
          fogFar: 165,
          sunColor: 0xffe6c4,
          sunIntensity: 2.6,
          sunDirection: new THREE.Vector3(0.7, 0.55, 0.35).normalize(),
          hemiSky: 0xd2e2ee,
          hemiGround: 0x9a8a72,
          hemiIntensity: 1.3,
        }
      : {
          sky: 0xa9cfdc,
          fog: 0xb9d6dd,
          fogNear: 60,
          fogFar: 170,
          sunColor: 0xffe7c4,
          sunIntensity: 3.4,
          sunDirection: new THREE.Vector3(0.35, 0.8, 0.5).normalize(),
          hemiSky: 0xcfe3f0,
          hemiGround: 0xa07e5a,
          hemiIntensity: 1.05,
        };

  const train = buildTrain(30, 0, -52, 1);
  scene.add(train.group);

  const roadGraph = {
    waypoints: [
      new THREE.Vector3(-27, 0, 5.5),
      new THREE.Vector3(-16, 0, 5.5),
      new THREE.Vector3(-4, 0, 5.5),
      new THREE.Vector3(10, 0, 5.5),
      new THREE.Vector3(10, 0, -4),
      new THREE.Vector3(10, 0, -14),
      new THREE.Vector3(10, 0, -24),
      new THREE.Vector3(4.5, 0, -34),
      new THREE.Vector3(15.5, 0, -34),
      new THREE.Vector3(10, 0, -43),
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [6, 8],
      [7, 9],
      [8, 9],
    ] as [number, number][],
    stopWaypoints: {
      'marseille-landing': 3,
      'marseille-chateau-dif': 0,
      'marseille-station': 9,
      'marseille-1891-melbourne': 3,
      'marseille-1891-lessons': 0,
    },
  };

  return {
    id: year === 1891 ? 'marseille-1891' : 'marseille-1882',
    name: `Marseille, ${year}`,
    spawn: year === 1891 ? new THREE.Vector3(10, 0, -41) : new THREE.Vector3(10.5, 0, 4.5),
    spawnHeading: year === 1891 ? 0 : Math.PI,
    stops,
    look,
    roadGraph,
    playBounds,
    visualBounds,
    staticDrawCalls: staticGroup.children.length + shipGroup.children.length,
    setTrainOffset(offsetX: number, doorClose = 1) {
      train.setState(offsetX, doorClose);
    },
    setShipOffset(offsetX: number, offsetZ = 0, yaw = 0) {
      shipGroup.position.set(offsetX, 0, offsetZ);
      shipGroup.rotation.y = yaw;
    },
    update(_dt, time) {
      water.update(time);
      props.update();
    },
    dispose() {
      disposeObject(staticGroup);
      disposeObject(shipGroup);
      disposeObject(paperSurround);
      train.dispose();
      water.dispose();
      props.dispose();
      for (const s of stops) s.dispose();
      disposePhysics(ctx);
    },
  };
}

function fountain(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  batch.add(palette.limestone, new THREE.CylinderGeometry(2.6, 2.8, 0.7, 12), { x, y: 0.35, z });
  batch.add(palette.seaShallow, new THREE.CylinderGeometry(2.3, 2.3, 0.05, 12), { x, y: 0.62, z });
  batch.add(palette.limestone, new THREE.CylinderGeometry(0.35, 0.5, 2.2, 8), { x, y: 1.4, z });
  batch.add(palette.limestone, new THREE.CylinderGeometry(1.1, 0.6, 0.35, 10), { x, y: 2.4, z });
  staticBox(ctx, x, 0.5, z, 5.2, 1, 5.2);
}

function awning(batch: StaticBatch, x: number, z: number, ry: number): void {
  for (let i = 0; i < 6; i++) {
    batch.add(
      i % 2 ? palette.awningRed : palette.awningCream,
      new THREE.BoxGeometry(1.1, 0.06, 2.4),
      {
        x: x + Math.sin(ry) * 1.2 + Math.cos(ry) * (i - 2.5) * 1.1,
        y: 3.1,
        z: z + Math.cos(ry) * 1.2 - Math.sin(ry) * (i - 2.5) * 1.1,
        ry,
        rx: 0.25,
      },
    );
  }
}

/** Gare Saint-Charles style terminus: a long hall with tall arched windows and a clock. */
function station(batch: StaticBatch, ctx: PhysicsCtx, x: number, z: number): void {
  const w = 30;
  const h = 7;
  batch.add(palette.limestone, new THREE.BoxGeometry(w, h, 8), { x, y: h / 2, z });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(w + 0.2, 0.7, 8.2), { x, y: 0.35, z });
  batch.add(palette.limestone, new THREE.BoxGeometry(8, 3.2, 8.4), { x, y: h + 1.6, z });
  batch.add(palette.roofTileDark, new THREE.BoxGeometry(w + 0.6, 0.4, 8.6), { x, y: h + 0.2, z });
  batch.add(palette.roofTileDark, new THREE.BoxGeometry(8.6, 0.4, 9), { x, y: h + 3.3, z });
  // Clock.
  batch.add(palette.shirt, new THREE.CylinderGeometry(1.0, 1.0, 0.15, 16), {
    x,
    y: h + 1.7,
    z: z + 4.25,
    rx: Math.PI / 2,
  });
  batch.add(palette.hat, new THREE.BoxGeometry(0.08, 0.7, 0.05), { x, y: h + 1.95, z: z + 4.35 });
  batch.add(palette.hat, new THREE.BoxGeometry(0.5, 0.08, 0.05), {
    x: x + 0.22,
    y: h + 1.7,
    z: z + 4.35,
  });
  // Tall windows and a wide entrance.
  for (let i = -5; i <= 5; i++) {
    if (Math.abs(i) <= 1) continue;
    batch.add(0x3b4a57, new THREE.BoxGeometry(1.3, 3.8, 0.1), {
      x: x + i * 2.4,
      y: 3.3,
      z: z + 4.03,
    });
  }
  batch.add(0x3b4a57, new THREE.BoxGeometry(5, 4.2, 0.1), { x, y: 2.1, z: z + 4.03 });
  batch.add(palette.limestone, new THREE.BoxGeometry(31, 0.3, 0.3), { x, y: 6.2, z: z + 4.1 });
  staticBox(ctx, x, h / 2, z, w, h, 8);

  // Rail bed beside the hall (locomotive + carriage are added as a movable group).
  const lx = x + 20;
  const lz = z - 1;
  batch.add(palette.railSteel, new THREE.BoxGeometry(28, 0.2, 2.2), { x: lx, y: 0.1, z: lz });
  staticBox(ctx, lx, 1.8, lz, 9, 3.6, 2.6);
}

function chateauDIf(batch: StaticBatch, x: number, z: number): void {
  // A low island of pale limestone, wider than it is tall.
  const rnd = seeded(91);
  const rockTones = [0xd9d0bf, 0xc7bca8, 0xb3a790];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + rnd() * 0.4;
    const r = 6 + rnd() * 3.5;
    batch.add(rockTones[i % 3]!, new THREE.IcosahedronGeometry(2.6 + rnd() * 1.8, 0), {
      x: x + Math.cos(a) * r,
      y: -1.4 + rnd() * 0.4,
      z: z + Math.sin(a) * r * 0.75,
      sy: 0.45,
      ry: rnd() * 3,
    });
  }
  batch.add(0xcfc5b2, new THREE.CylinderGeometry(8.5, 10, 1.6, 9), { x, y: -0.6, z, sz: 0.75 });

  // Rampart wall around the island top.
  const wallTone = 0xd8cbb2;
  const wall = (dx: number, dz: number, len: number, ry: number): void => {
    batch.add(wallTone, new THREE.BoxGeometry(len, 1.8, 0.7), { x: x + dx, y: 1.0, z: z + dz, ry });
    for (let t = -len / 2 + 0.4; t < len / 2; t += 1.1) {
      batch.add(wallTone, new THREE.BoxGeometry(0.55, 0.45, 0.75), {
        x: x + dx + Math.cos(ry) * t,
        y: 2.1,
        z: z + dz - Math.sin(ry) * t,
        ry,
      });
    }
  };
  wall(0, 5.2, 13, 0);
  wall(0, -5.2, 13, 0);
  wall(-6.5, 0, 10.4, Math.PI / 2);
  wall(6.5, 0, 10.4, Math.PI / 2);

  // The square keep with three round towers, as on the real fortress.
  batch.add(palette.limestone, new THREE.BoxGeometry(5.4, 5.6, 5.4), { x, y: 2.8, z });
  batch.add(0xc9b99c, new THREE.BoxGeometry(5.8, 0.35, 5.8), { x, y: 5.75, z });
  for (const [dx, dz] of [
    [-2.7, -2.7],
    [2.7, -2.7],
    [2.7, 2.7],
  ] as const) {
    batch.add(palette.limestone, new THREE.CylinderGeometry(1.25, 1.35, 6.6, 12), {
      x: x + dx,
      y: 3.3,
      z: z + dz,
    });
    batch.add(0xc9b99c, new THREE.CylinderGeometry(1.45, 1.45, 0.35, 12), {
      x: x + dx,
      y: 6.75,
      z: z + dz,
    });
  }
  // Narrow window slits.
  for (let i = 0; i < 3; i++) {
    batch.add(0x3a3532, new THREE.BoxGeometry(0.25, 0.9, 0.1), {
      x: x - 1.2 + i * 1.2,
      y: 3.4,
      z: z + 2.72,
    });
    batch.add(0x3a3532, new THREE.BoxGeometry(0.1, 0.9, 0.25), {
      x: x + 2.72,
      y: 3.4,
      z: z - 1.2 + i * 1.2,
    });
  }
  // Landing steps on the harbor side.
  batch.add(wallTone, new THREE.BoxGeometry(3, 0.5, 2), { x: x + 4, y: 0.2, z: z - 6.6 });
}
