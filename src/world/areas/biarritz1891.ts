import * as THREE from 'three';
import { StaticBatch, disposeObject, mat, seeded } from '../kit';
import { palette } from '../palette';
import { disposePhysics, staticBox, type PhysicsCtx } from '../physics';
import { buildPaperSurround } from '../paperShader';
import { gasLamp, parkBench, planeTree } from '../builders';
import { buildTrain, fishingBoat } from '../vessels';
import { Props } from '../Props';
import { Water } from '../Water';
import { StopMarker } from '../StopMarker';
import { storiesFor } from '../../content/stories';
import type { Area } from '../Area';

const PLATEAU_Y = 2.6;
const PROM_Y = 0.4;
const WATER_Y = -0.95;

interface FoamStrip {
  x: number;
  baseZ: number;
  ry: number;
  len: number;
  depth: number;
  y: number;
  phase: number;
  amp: number;
}

/**
 * Biarritz, February to March 1891.
 *
 * Layout (top view, +Z toward the Atlantic Ocean):
 *   south (z > 8)   : curving sandy beach, breaking wave foam, rocky headland with lighthouse, rock outcrops
 *   middle (z ~ 4)  : curving stone promenade with lamps, benches, and 2-4 floor seaside villas/hotels
 *   slope (-12..0)  : grassy coastal bank climbed by gravel paths
 *   plateau (z < -12): walled Basque-style villa with clipped gardens, paths, hedges, terrace, and inland station
 */
export function buildBiarritz1891(scene: THREE.Scene, ctx: PhysicsCtx): Area {
  const batch = new StaticBatch();
  const props = new Props(ctx, scene);

  const shoreZ = (x: number): number => 8 + 0.0038 * x * x;

  // Curving sloping sandy beach (dry upper sand + wet surf shelf dropping below WATER_Y = -0.95).
  const beachSegs = 16;
  const span = 90;
  for (let i = 0; i < beachSegs; i++) {
    const x0 = -span / 2 + (i / beachSegs) * span;
    const x1 = -span / 2 + ((i + 1) / beachSegs) * span;
    const xm = (x0 + x1) / 2;
    const zm = (shoreZ(x0) + shoreZ(x1)) / 2;
    const segLen = Math.hypot(x1 - x0, shoreZ(x1) - shoreZ(x0)) + 0.5;
    const ry = -Math.atan2(shoreZ(x1) - shoreZ(x0), x1 - x0);

    // Upper dry sand sloping gently from seawall (-0.25) toward the waterline (-0.82).
    batch.add(palette.sand, new THREE.BoxGeometry(segLen, 1.2, 10.5), {
      x: xm,
      y: -1.08,
      z: zm + 4.8,
      ry,
      rx: 0.055,
    });
    // Wet intertidal sand sloping cleanly under WATER_Y (-0.95) around z = shoreZ(x) + 10.5.
    batch.add(palette.sandWet, new THREE.BoxGeometry(segLen, 0.8, 9.0), {
      x: xm,
      y: -1.48,
      z: zm + 12.6,
      ry,
      rx: 0.075,
    });
  }
  staticBox(ctx, 0, -1.25, 13, 220, 2, 22);

  // Promenade stone shelf base behind the seawall curb.
  batch.add(palette.quayStone, new THREE.BoxGeometry(110, 2.0, 14), { x: 0, y: -0.65, z: -4.2 });
  staticBox(ctx, 0, -0.65, -4.2, 220, 2.0, 14);

  // Curving seawall promenade + parapet curb along shoreZ(x).
  const segs = 12;
  for (let i = 0; i < segs; i++) {
    const x0 = -span / 2 + (i / segs) * span;
    const x1 = -span / 2 + ((i + 1) / segs) * span;
    const xm = (x0 + x1) / 2;
    const z0 = shoreZ(x0);
    const z1 = shoreZ(x1);
    const zm = (z0 + z1) / 2;
    const segLen = Math.hypot(x1 - x0, z1 - z0) + 0.4;
    const ry = -Math.atan2(z1 - z0, x1 - x0);

    batch.add(palette.quayStone, new THREE.BoxGeometry(segLen, 0.8, 12.5), {
      x: xm,
      y: 0.0,
      z: zm - 6.25,
      ry,
    });
    batch.add(palette.quayStoneDark, new THREE.BoxGeometry(segLen, 1.6, 0.7), {
      x: xm,
      y: -0.2,
      z: zm,
      ry,
    });
    staticBox(ctx, xm, 0.0, zm - 6.25, segLen, 0.8, 12.5, ry);

    // Leave a beach access ramp at i === 6 (x ~ 0..7.5); stone parapet elsewhere.
    if (i === 6) {
      batch.add(palette.sand, new THREE.BoxGeometry(segLen, 0.4, 5.5), {
        x: xm,
        y: -0.02,
        z: zm + 2.2,
        ry,
        rx: 0.16,
      });
      staticBox(ctx, xm, -0.02, zm + 2.2, segLen, 0.4, 5.5, ry, 0.16);
    } else {
      batch.add(palette.quayStoneDark, new THREE.BoxGeometry(segLen, 0.45, 0.45), {
        x: xm,
        y: 0.62,
        z: zm - 0.15,
        ry,
      });
      staticBox(ctx, xm, 0.9, zm - 0.1, segLen, 1.4, 0.6, ry);
    }
  }
  // Keep horse on dry beach sand above the waterline.
  staticBox(ctx, 0, 0.5, 16.2, 220, 2.0, 0.8);

  // Rocky west headland topped with a small white lighthouse, plus east rocks & dark outcrops in the surf.
  const rnd = seeded(1891);
  headlandAndLighthouse(batch, ctx, -21.0, 16.5, rnd);
  for (let i = 0; i < 8; i++) {
    batch.add(
      i % 2 ? palette.rock : palette.rockDark,
      new THREE.IcosahedronGeometry(2.2 + rnd() * 2.0, 0),
      {
        x: 39 + rnd() * 9,
        y: -0.4 + rnd() * 1.2,
        z: 10 + i * 1.7 + rnd() * 2,
        sy: 0.65,
        ry: rnd() * 3,
      },
    );
  }
  staticBox(ctx, 43, 1.2, 16, 10, 3, 18);

  // Dark rock outcrops breaking the water off the beach, with foam rings around bases.
  for (const [rx, rz, rs] of [
    [-11.5, 22.8, 1.5],
    [-2.5, 23.5, 1.6],
    [8.5, 22.5, 1.5],
    [21.0, 19.5, 1.7],
  ] as const) {
    batch.add(palette.rockDark, new THREE.IcosahedronGeometry(rs, 0), {
      x: rx,
      y: WATER_Y + 0.5,
      z: rz,
      sx: 1.4,
      sy: 0.85,
      sz: 1.15,
      ry: rnd() * 3,
    });
    batch.add(palette.rock, new THREE.IcosahedronGeometry(rs * 0.7, 0), {
      x: rx + rs * 0.65,
      y: WATER_Y + 0.15,
      z: rz - 0.4,
      sy: 0.6,
      ry: rnd() * 3,
    });
    batch.add(palette.foam, new THREE.CylinderGeometry(rs * 1.55, rs * 1.7, 0.08, 10), {
      x: rx,
      y: WATER_Y + 0.06,
      z: rz,
      sx: 1.35,
      sz: 1.0,
    });
  }

  // Coastal grassy slope from promenade (z = 0, y = PROM_Y) up to plateau (z = -12, y = PLATEAU_Y).
  const slopeLen = Math.hypot(12, PLATEAU_Y - PROM_Y);
  const slopeAngle = Math.atan2(PLATEAU_Y - PROM_Y, 12);
  batch.add(palette.grass, new THREE.BoxGeometry(220, 1.2, slopeLen), {
    x: 0,
    y: (PROM_Y + PLATEAU_Y) / 2 - 0.6,
    z: -6,
    rx: slopeAngle,
  });
  staticBox(ctx, 0, (PROM_Y + PLATEAU_Y) / 2 - 0.6, -6, 220, 1.2, slopeLen, 0, slopeAngle);

  // Outer coastal grass banks outside the villa garden estate.
  batch.add(palette.grass, new THREE.BoxGeometry(220, 4, 96), {
    x: 0,
    y: PLATEAU_Y - 2,
    z: -59.8,
  });
  staticBox(ctx, 0, PLATEAU_Y - 2, -59.8, 220, 4, 96);

  // Near the villa & station: warm stone and gravel estate gardens bordered by clipped hedges (grass only on slopes).
  batch.add(palette.parisSidewalk, new THREE.BoxGeometry(66, 0.05, 31), {
    x: 2,
    y: PLATEAU_Y + 0.025,
    z: -27,
  });
  // Clipped parterre lawn beds framed inside stone borders and low hedges in the garden.
  for (const [bx, bz, bw, bd] of [
    [-23.5, -18.5, 6.2, 4.6],
    [-2.5, -27.2, 4.4, 5.5],
    [-19.5, -35.5, 16, 4.5],
    [6.5, -24.5, 10, 6.5],
    [18, -31.5, 8.5, 6.0],
  ] as const) {
    batch.add(palette.grassDark, new THREE.BoxGeometry(bw, 0.08, bd), {
      x: bx,
      y: PLATEAU_Y + 0.04,
      z: bz,
    });
    hedgeBorder(batch, bx, PLATEAU_Y, bz, bw, bd);
  }

  // Gravel paths climbing the slope and linking villa gate, terrace, gardens, and station.
  for (const px of [-14, 24]) {
    batch.add(palette.dirt, new THREE.BoxGeometry(4.5, 1.24, slopeLen), {
      x: px,
      y: (PROM_Y + PLATEAU_Y) / 2 - 0.58,
      z: -6,
      rx: slopeAngle,
    });
  }
  batch.add(palette.dirt, new THREE.BoxGeometry(52, 0.08, 4.4), {
    x: 7,
    y: PLATEAU_Y + 0.04,
    z: -14,
  });
  batch.add(palette.dirt, new THREE.BoxGeometry(4.4, 0.08, 17), {
    x: 28,
    y: PLATEAU_Y + 0.04,
    z: -21,
  });
  batch.add(palette.dirt, new THREE.BoxGeometry(3.4, 0.08, 6.5), {
    x: -14,
    y: PLATEAU_Y + 0.04,
    z: -18,
  });

  // Promenade street furniture: gas lamps, benches facing the ocean, and coastal plane trees.
  for (let x = -30; x <= 32; x += 12) {
    gasLamp(batch, ctx, x, shoreZ(x) - 1.2);
  }
  for (const bx of [-16, -6, 4, 15, 26]) {
    parkBench(batch, ctx, bx, shoreZ(bx) - 1.8, Math.PI);
  }
  planeTree(batch, ctx, -21, 2.5, 71, { scale: 0.78 });
  planeTree(batch, ctx, 18, 3.0, 72, { scale: 0.78 });

  // Row of 2-to-4 floor seaside villas & hotels along the inland side of the promenade.
  seasidePromenadeHotels(batch, ctx);

  // Striped wooden bathing cabins along the beach + two rowing boats pulled up on the sand.
  bathingCabins(batch, ctx, shoreZ);
  fishingBoat(batch, -8.5, 13.9, 0.38, palette.basqueRed, 1.0, 0.08);
  fishingBoat(batch, -2.5, 13.2, -0.35, palette.shutterBlue, 1.0, 0.08);

  // Basque-style Boustead villa: two connected volumes, red timbering, shutters, overhang, walled garden, shrubs, 2 tamarisks.
  basqueVilla(batch, ctx, -14, PLATEAU_Y, -26);

  // Sea-facing terrace beside the villa, with small writing table and chair for the manuscript stop.
  terraceAndTable(batch, ctx, -3.5, PLATEAU_Y, -19);

  // Small inland railway station at the northeast edge.
  biarritzStation(batch, ctx, 28, PLATEAU_Y, -35);

  // Framing pines along outer slopes away from the manicured villa garden.
  for (const [tx, tz] of [
    [-35, -24],
    [-33, -36],
    [39, -22],
    [40, -34],
  ] as const) {
    batch.add(palette.treeTrunk, new THREE.CylinderGeometry(0.18, 0.28, 3.2, 6), {
      x: tx,
      y: PLATEAU_Y + 1.6,
      z: tz,
    });
    batch.add(palette.pine, new THREE.IcosahedronGeometry(1.7, 0), {
      x: tx,
      y: PLATEAU_Y + 3.8,
      z: tz,
    });
  }

  // Beach and station props.
  props.beachChair(-9.6, 10.6, 0.12, palette.awningRed, -0.2);
  props.beachChair(-7.9, 10.6, -0.08, palette.shutterBlue, -0.2);
  props.beachChair(5.6, 10.6, 0.15, palette.awningRed, -0.2);
  props.beachChair(-3.5, 6.2, 0.1, palette.awningRed, PROM_Y);
  props.barrel(18, -27, 0.2, true, PLATEAU_Y);
  props.barrel(18.9, -26.4, 0.6, true, PLATEAU_Y);
  props.crate(19.6, -27.2, 0.85, 0.3, PLATEAU_Y + 0.43);

  // Low-poly late-winter clouds above the Atlantic horizon.
  for (const [cx, cy, cz, cs] of [
    [-36, 28, 55, 1.2],
    [-8, 32, 68, 1.5],
    [26, 29, 60, 1.3],
    [48, 31, 48, 1.0],
  ] as const) {
    batch.add(palette.shirt, new THREE.IcosahedronGeometry(3.5 * cs, 0), {
      x: cx,
      y: cy,
      z: cz,
      sx: 1.8,
      sy: 0.65,
    });
    batch.add(palette.shirt, new THREE.IcosahedronGeometry(2.6 * cs, 0), {
      x: cx + 3.4 * cs,
      y: cy - 0.3,
      z: cz + 0.5,
      sx: 1.5,
      sy: 0.6,
    });
  }

  const playBounds = { minX: -42, maxX: 42, minZ: -44, maxZ: 16 };
  const visualBounds = { minX: -42, maxX: 42, minZ: -44, maxZ: 45 };
  const paperSurround = buildPaperSurround(playBounds, {
    getY: (_x, z) =>
      z <= -12
        ? PLATEAU_Y
        : z >= 0
          ? PROM_Y
          : PLATEAU_Y + ((z + 12) / 12) * (PROM_Y - PLATEAU_Y),
    borderSides: ['north', 'east', 'west'],
    landMaxZ: 16,
  });
  scene.add(paperSurround);

  const staticGroup = batch.build('biarritz-static');
  scene.add(staticGroup);

  // Rough Atlantic waves meeting the curving sand shoreline.
  const water = new Water(240, 100, 3, new THREE.Vector3(0, WATER_Y, 60), 2.1);
  scene.add(water.mesh);

  // Animated breaking wave foam strips washing along the curving shore (1 InstancedMesh draw call).
  const foamStrips: FoamStrip[] = [];
  for (let row = 0; row < 2; row++) {
    for (let x = -28; x <= 34; x += 5.2) {
      foamStrips.push({
        x,
        baseZ: shoreZ(x) + (row === 0 ? 10.1 : 13.4),
        ry: -Math.atan(2 * 0.0038 * x),
        len: 4.4 + (Math.abs(x) % 2),
        depth: row === 0 ? 0.85 : 0.65,
        y: WATER_Y + 0.14 - row * 0.03,
        phase: row * 1.9 + x * 0.14,
        amp: row === 0 ? 0.55 : 0.75,
      });
    }
  }
  const foamGeo = new THREE.BoxGeometry(1, 0.09, 1);
  const foamMesh = new THREE.InstancedMesh(foamGeo, mat(palette.foam), foamStrips.length);
  foamMesh.receiveShadow = true;
  foamMesh.frustumCulled = false;
  const foamPos = new THREE.Vector3();
  const foamQuat = new THREE.Quaternion();
  const foamEuler = new THREE.Euler();
  const foamScale = new THREE.Vector3();
  const foamMat = new THREE.Matrix4();
  const syncFoam = (time: number): void => {
    for (let i = 0; i < foamStrips.length; i++) {
      const f = foamStrips[i]!;
      const w = Math.sin(time * 1.35 + f.phase);
      foamPos.set(f.x, f.y, f.baseZ - w * f.amp);
      foamEuler.set(0, f.ry, 0);
      foamQuat.setFromEuler(foamEuler);
      foamScale.set(f.len, 1, f.depth * (0.85 + 0.28 * (w * 0.5 + 0.5)));
      foamMesh.setMatrixAt(i, foamMat.compose(foamPos, foamQuat, foamScale));
    }
    foamMesh.instanceMatrix.needsUpdate = true;
  };
  syncFoam(0);
  scene.add(foamMesh);

  const train = buildTrain(28, PLATEAU_Y, -40.2, 1);
  scene.add(train.group);

  const [villa, manuscript, station] = storiesFor('biarritz-1891');
  const stops = [
    new StopMarker(
      villa!,
      new THREE.Vector3(-14, PLATEAU_Y, -12.5),
      new THREE.Vector3(-14, PLATEAU_Y + 2.4, -22),
      1.42,
    ),
    new StopMarker(
      manuscript!,
      new THREE.Vector3(-3.5, PLATEAU_Y, -17.5),
      new THREE.Vector3(-3.5, PLATEAU_Y + 0.8, -19.5),
    ),
    new StopMarker(
      station!,
      new THREE.Vector3(28, PLATEAU_Y, -25),
      new THREE.Vector3(28, PLATEAU_Y + 2.0, -33),
      1.45,
    ),
  ];
  for (const s of stops) scene.add(s.group);

  const MID_Y = (PROM_Y + PLATEAU_Y) / 2 + 0.06;
  const PLAT_PATH_Y = PLATEAU_Y + 0.06;
  const roadGraph = {
    waypoints: [
      new THREE.Vector3(-24, PROM_Y + 0.04, 4.5), // 0
      new THREE.Vector3(-14, PROM_Y + 0.04, 4.5), // 1
      new THREE.Vector3(-14, PROM_Y + 0.04, 0), // 2
      new THREE.Vector3(-14, MID_Y, -6), // 3
      new THREE.Vector3(-14, PLAT_PATH_Y, -12.5), // 4: villa
      new THREE.Vector3(4, PROM_Y + 0.04, 4.5), // 5
      new THREE.Vector3(24, PROM_Y + 0.04, 4.5), // 6
      new THREE.Vector3(24, PROM_Y + 0.04, 0), // 7
      new THREE.Vector3(24, MID_Y, -6), // 8
      new THREE.Vector3(24, PLAT_PATH_Y, -14), // 9
      new THREE.Vector3(-3.5, PLAT_PATH_Y, -14), // 10: near manuscript
      new THREE.Vector3(10, PLAT_PATH_Y, -14), // 11
      new THREE.Vector3(28, PLAT_PATH_Y, -14), // 12
      new THREE.Vector3(28, PLAT_PATH_Y, -25), // 13: station
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [4, 10],
      [10, 11],
      [11, 9],
      [9, 12],
      [12, 13],
    ] as [number, number][],
    stopWaypoints: {
      'biarritz-villa': 4,
      'biarritz-manuscript': 10,
      'biarritz-station': 13,
    },
  };

  return {
    id: 'biarritz-1891',
    name: 'Biarritz, 1891',
    spawn: new THREE.Vector3(-13.0, PROM_Y, 5.2),
    spawnHeading: Math.PI * 0.15,
    stops,
    roadGraph,
    playBounds,
    visualBounds,
    staticDrawCalls: staticGroup.children.length,
    setTrainOffset(offsetX: number, doorClose = 1) {
      train.setState(offsetX, doorClose);
    },
    look: {
      sky: 0xa7d0e4,
      fog: 0xbfdde8,
      fogNear: 58,
      fogFar: 175,
      sunColor: 0xfff1dc,
      sunIntensity: 3.3,
      sunDirection: new THREE.Vector3(0.3, 0.75, 0.55).normalize(),
      hemiSky: 0xdcebf4,
      hemiGround: 0x9a8a6c,
      hemiIntensity: 1.15,
    },
    update(_dt, time) {
      water.update(time);
      syncFoam(time);
      props.update();
    },
    dispose() {
      disposeObject(staticGroup);
      disposeObject(paperSurround);
      train.dispose();
      foamMesh.removeFromParent();
      foamMesh.dispose();
      foamGeo.dispose();
      water.dispose();
      props.dispose();
      for (const s of stops) s.dispose();
      disposePhysics(ctx);
    },
  };
}

/** West rocky headland with coastal boulders and a small white lighthouse on the point. */
function headlandAndLighthouse(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  z: number,
  rnd: () => number,
): void {
  // Craggy rocky headland mass (~40% smaller main boulders + smaller coastal rock outcrops).
  for (let i = 0; i < 12; i++) {
    const ox = (i % 4 - 1.5) * 2.25 + (rnd() - 0.5) * 1.1;
    const oz = (Math.floor(i / 4) - 1) * 1.9 + (rnd() - 0.5) * 0.9;
    const r = 1.35 + rnd() * 0.95;
    batch.add(i % 2 ? palette.rockDark : palette.rock, new THREE.IcosahedronGeometry(r, 0), {
      x: x + ox,
      y: 0.25 + rnd() * 0.65,
      z: z + oz,
      sy: 0.68,
      ry: rnd() * 3,
    });
  }
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2 + rnd() * 0.4;
    const dist = 3.2 + rnd() * 3.4;
    const r = 0.48 + rnd() * 0.52;
    batch.add(i % 2 ? palette.rock : palette.rockDark, new THREE.IcosahedronGeometry(r, 0), {
      x: x + 2.4 + Math.cos(ang) * dist,
      y: 0.1 + rnd() * 0.35,
      z: z + Math.sin(ang) * dist * 0.8,
      sy: 0.6,
      ry: rnd() * 3,
    });
  }
  // Flat stone plinth on the point supporting a small white coastal lighthouse.
  const lx = x + 4.2;
  const lz = z - 0.2;
  batch.add(palette.quayStoneDark, new THREE.CylinderGeometry(2.0, 2.4, 2.4, 8), {
    x: lx,
    y: 1.2,
    z: lz,
  });
  batch.add(palette.basqueWhite, new THREE.CylinderGeometry(0.85, 1.25, 4.0, 10), {
    x: lx,
    y: 4.3,
    z: lz,
  });
  batch.add(palette.basqueRed, new THREE.CylinderGeometry(0.95, 1.02, 0.65, 10), {
    x: lx,
    y: 5.4,
    z: lz,
  });
  batch.add(palette.lampIron, new THREE.CylinderGeometry(1.1, 0.95, 0.22, 10), {
    x: lx,
    y: 6.4,
    z: lz,
  });
  batch.add(
    palette.gaslight,
    new THREE.CylinderGeometry(0.6, 0.6, 0.75, 8),
    { x: lx, y: 6.88, z: lz },
    { emissive: palette.gaslight, roughness: 0.35 },
  );
  batch.add(palette.iron, new THREE.ConeGeometry(0.9, 0.8, 8), {
    x: lx,
    y: 7.62,
    z: lz,
  });
  staticBox(ctx, x, 1.8, z, 12, 3.6, 10);
}

/** Row of 2-to-4 floor seaside villas and hotels behind the stone promenade, facing the Atlantic (+Z). */
function seasidePromenadeHotels(batch: StaticBatch, ctx: PhysicsCtx): void {
  const buildings: {
    x: number;
    z: number;
    w: number;
    d: number;
    floors: number;
    wall: number;
    roof: number;
    shutter: number;
    bay: boolean;
  }[] = [
    {
      x: -30.5,
      z: 0.5,
      w: 8.0,
      d: 6.2,
      floors: 3,
      wall: palette.limestone,
      roof: palette.zincRoof,
      shutter: palette.shutterBlue,
      bay: true,
    },
    {
      x: -22.2,
      z: -1.0,
      w: 8.4,
      d: 6.5,
      floors: 4,
      wall: palette.basqueWhite,
      roof: palette.zincRoofDark,
      shutter: palette.shutterGreen,
      bay: true,
    },
    {
      x: -13.8,
      z: -1.8,
      w: 7.4,
      d: 6.0,
      floors: 2,
      wall: palette.limestone,
      roof: palette.roofTile,
      shutter: palette.basqueRed,
      bay: false,
    },
    {
      x: 24.5,
      z: -0.8,
      w: 8.6,
      d: 6.4,
      floors: 3,
      wall: palette.basqueWhite,
      roof: palette.zincRoof,
      shutter: palette.shutterBlue,
      bay: true,
    },
    {
      x: 33.2,
      z: 0.8,
      w: 7.6,
      d: 6.0,
      floors: 2,
      wall: palette.limestone,
      roof: palette.roofTileDark,
      shutter: palette.shutterGreen,
      bay: false,
    },
  ];

  for (const b of buildings) {
    const h = b.floors * 2.35;
    const baseY = PROM_Y;
    batch.add(b.wall, new THREE.BoxGeometry(b.w, h, b.d), {
      x: b.x,
      y: baseY + h / 2,
      z: b.z,
    });
    // Stone plinth extended below slope + cornice.
    batch.add(palette.quayStoneDark, new THREE.BoxGeometry(b.w + 0.25, 1.4, b.d + 0.25), {
      x: b.x,
      y: baseY - 0.15,
      z: b.z,
    });
    batch.add(palette.quayStone, new THREE.BoxGeometry(b.w + 0.35, 0.24, b.d + 0.35), {
      x: b.x,
      y: baseY + h + 0.08,
      z: b.z,
    });
    // Sloped mansard/hip roof + chimney.
    batch.add(b.roof, new THREE.CylinderGeometry(Math.SQRT1_2 * 0.65, Math.SQRT1_2, 1, 4), {
      x: b.x,
      y: baseY + h + 1.05,
      z: b.z,
      ry: Math.PI / 4,
      sx: b.w + 0.6,
      sy: 1.9,
      sz: b.d + 0.6,
    });
    batch.add(b.wall, new THREE.BoxGeometry(0.65, 1.3, 0.65), {
      x: b.x - b.w * 0.25,
      y: baseY + h + 2.0,
      z: b.z,
    });
    // Sea-facing windows with shutters + optional projecting bay window stack.
    const frontZ = b.z + b.d / 2 + 0.05;
    for (let fl = 0; fl < b.floors; fl++) {
      const wy = baseY + 1.35 + fl * 2.3;
      for (const wx of [-b.w * 0.28, b.w * 0.28]) {
        batch.add(palette.parisWindow, new THREE.BoxGeometry(0.85, 1.2, 0.08), {
          x: b.x + wx,
          y: wy,
          z: frontZ,
        });
        for (const s of [-1, 1]) {
          batch.add(b.shutter, new THREE.BoxGeometry(0.32, 1.2, 0.07), {
            x: b.x + wx + s * 0.62,
            y: wy,
            z: frontZ + 0.02,
          });
        }
      }
      // Side (+X) windows so hotel facades read clearly from the diagonal camera.
      for (const wz of [-b.d * 0.24, b.d * 0.24]) {
        batch.add(palette.parisWindow, new THREE.BoxGeometry(0.08, 1.2, 0.85), {
          x: b.x + b.w / 2 + 0.05,
          y: wy,
          z: b.z + wz,
        });
        for (const s of [-1, 1]) {
          batch.add(b.shutter, new THREE.BoxGeometry(0.07, 1.2, 0.3), {
            x: b.x + b.w / 2 + 0.07,
            y: wy,
            z: b.z + wz + s * 0.6,
          });
        }
      }
      if (b.bay) {
        batch.add(b.wall, new THREE.BoxGeometry(1.75, 1.8, 0.75), {
          x: b.x,
          y: wy,
          z: frontZ + 0.35,
        });
        batch.add(palette.parisWindow, new THREE.BoxGeometry(1.05, 1.15, 0.08), {
          x: b.x,
          y: wy + 0.05,
          z: frontZ + 0.75,
        });
      }
    }
    staticBox(ctx, b.x, baseY + h / 2, b.z, b.w, h, b.d);
  }
}

/** Row of colorful striped wooden bathing cabins sitting along the curving dry sand. */
function bathingCabins(batch: StaticBatch, ctx: PhysicsCtx, shoreZ: (x: number) => number): void {
  const stripes = [
    palette.awningRed,
    palette.awningBlue,
    palette.awningGreen,
    palette.awningOchre,
  ];
  const xs = [-12.2, -9.0, -5.8, -2.6, 0.6];
  xs.forEach((cx, i) => {
    const cz = shoreZ(cx) + 2.9;
    const baseY = -0.38;
    const w = 1.65;
    const h = 2.05;
    const d = 1.65;
    const col = stripes[i % stripes.length]!;
    batch.add(palette.basqueWhite, new THREE.BoxGeometry(w, h, d), {
      x: cx,
      y: baseY + h / 2,
      z: cz,
    });
    for (const sx of [-0.52, 0, 0.52]) {
      batch.add(col, new THREE.BoxGeometry(0.24, h - 0.1, d + 0.06), {
        x: cx + sx,
        y: baseY + h / 2,
        z: cz,
      });
    }
    batch.add(col, new THREE.BoxGeometry(w + 0.3, 0.2, d + 0.3), {
      x: cx,
      y: baseY + h + 0.12,
      z: cz,
      rx: 0.14,
    });
    batch.add(palette.doorBrown, new THREE.BoxGeometry(0.62, 1.35, 0.08), {
      x: cx,
      y: baseY + 0.68,
      z: cz + d / 2 + 0.05,
    });
    staticBox(ctx, cx, baseY + h / 2, cz, w, h, d);
  });
}

/** Clipped low boxwood hedge border around a garden parterre bed. */
function hedgeBorder(
  batch: StaticBatch,
  cx: number,
  y: number,
  cz: number,
  w: number,
  d: number,
): void {
  const t = 0.36;
  const h = 0.42;
  for (const sz of [-1, 1]) {
    batch.add(palette.hedgeGreen, new THREE.BoxGeometry(w + t, h, t), {
      x: cx,
      y: y + h / 2,
      z: cz + sz * (d / 2),
    });
  }
  for (const sx of [-1, 1]) {
    batch.add(palette.hedgeGreen, new THREE.BoxGeometry(t, h, d + t), {
      x: cx + sx * (w / 2),
      y: y + h / 2,
      z: cz,
    });
  }
}

/** Feathery coastal tamarisk tree with gnarled pale trunk and airy sage canopy. */
function tamariskTree(batch: StaticBatch, x: number, y: number, z: number, tilt: number): void {
  batch.add(palette.treeTrunk, new THREE.CylinderGeometry(0.11, 0.2, 2.5, 6), {
    x,
    y: y + 1.2,
    z,
    rz: tilt,
  });
  for (const [ox, oy, oz, r] of [
    [tilt * 1.4, 2.6, 0, 1.05],
    [tilt * 1.8 - 0.75, 2.25, 0.45, 0.85],
    [tilt * 1.8 + 0.7, 2.4, -0.45, 0.9],
  ] as const) {
    batch.add(palette.tamariskLeaf, new THREE.IcosahedronGeometry(r, 0), {
      x: x + ox,
      y: y + oy,
      z: z + oz,
      sy: 0.72,
    });
  }
}

/** Helper to stamp thin red half-timbered Basque framing across one Z-facing facade (beams, posts, diagonal braces). */
function timberFacadeZ(
  batch: StaticBatch,
  cx: number,
  yBase: number,
  yUpper: number,
  zFace: number,
  w: number,
  hUpper: number,
): void {
  // Ground-to-upper horizontal divider beam + upper eave beam.
  for (const by of [yUpper, yUpper + hUpper - 0.12]) {
    batch.add(palette.basqueRed, new THREE.BoxGeometry(w + 0.12, 0.16, 0.1), {
      x: cx,
      y: by,
      z: zFace,
    });
  }
  const count = Math.max(4, Math.round(w / 2.1));
  for (let i = 0; i <= count; i++) {
    const px = cx - w / 2 + (i / count) * w;
    // Upper floor full posts + ground floor corner/intermediate posts.
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.13, hUpper, 0.09), {
      x: px,
      y: yUpper + hUpper / 2,
      z: zFace,
    });
    if (i === 0 || i === count || i % 2 === 0) {
      batch.add(palette.basqueRed, new THREE.BoxGeometry(0.13, yUpper - yBase, 0.08), {
        x: px,
        y: (yBase + yUpper) / 2,
        z: zFace,
      });
    }
  }
  // Diagonal Basque timber braces in outer upper-floor bays.
  const bayW = w / count;
  for (const sx of [-1, 1]) {
    const braceLen = Math.hypot(bayW * 0.9, hUpper * 0.92);
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.11, braceLen, 0.08), {
      x: cx + sx * (w / 2 - bayW * 0.5),
      y: yUpper + hUpper / 2,
      z: zFace,
      rz: sx * Math.atan2(bayW, hUpper),
    });
  }
}

/** Helper to stamp thin red half-timbered Basque framing across one X-facing facade & gable triangle. */
function timberFacadeX(
  batch: StaticBatch,
  xFace: number,
  yBase: number,
  yUpper: number,
  cz: number,
  d: number,
  hUpper: number,
  gableH: number,
): void {
  const topY = yUpper + hUpper;
  // Horizontal floor, eave, and mid-gable collar beams.
  for (const [by, bw] of [
    [yUpper, d + 0.12],
    [topY, d + 0.12],
    [topY + gableH * 0.52, d * 0.52],
  ] as const) {
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.1, 0.15, bw), {
      x: xFace,
      y: by,
      z: cz,
    });
  }
  // Vertical posts across upper floor + ground-floor corners.
  const count = Math.max(4, Math.round(d / 2.1));
  for (let i = 0; i <= count; i++) {
    const pz = cz - d / 2 + (i / count) * d;
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.09, hUpper, 0.13), {
      x: xFace,
      y: yUpper + hUpper / 2,
      z: pz,
    });
    if (i === 0 || i === count) {
      batch.add(palette.basqueRed, new THREE.BoxGeometry(0.09, yUpper - yBase, 0.13), {
        x: xFace,
        y: (yBase + yUpper) / 2,
        z: pz,
      });
    }
  }
  // Upper floor corner diagonal braces.
  const bayD = d / count;
  for (const sz of [-1, 1]) {
    const braceLen = Math.hypot(bayD * 0.9, hUpper * 0.92);
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.08, braceLen, 0.11), {
      x: xFace,
      y: yUpper + hUpper / 2,
      z: cz + sz * (d / 2 - bayD * 0.5),
      rx: -sz * Math.atan2(bayD, hUpper),
    });
  }
  // Gable triangle framing: king post, flanking posts, and diagonal braces.
  if (gableH > 0) {
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.09, gableH * 0.96, 0.13), {
      x: xFace,
      y: topY + gableH * 0.48,
      z: cz,
    });
    for (const sz of [-1, 1]) {
      const postH = gableH * 0.52;
      batch.add(palette.basqueRed, new THREE.BoxGeometry(0.09, postH, 0.12), {
        x: xFace,
        y: topY + postH / 2,
        z: cz + sz * (d * 0.24),
      });
      const diagLen = Math.hypot(d * 0.24, gableH * 0.46);
      batch.add(palette.basqueRed, new THREE.BoxGeometry(0.08, diagLen, 0.11), {
        x: xFace,
        y: topY + gableH * 0.26,
        z: cz + sz * (d * 0.13),
        rx: sz * Math.atan2(d * 0.24, gableH * 0.46),
      });
    }
  }
}

/** Stamps a two-sided Basque gable roof (ridge along X, gable ends on +X and -X) over white gable walls. */
function gableRoofX(
  batch: StaticBatch,
  cx: number,
  baseY: number,
  cz: number,
  lenX: number,
  spanZ: number,
  gableH: number,
  overhang: number,
  roofColor: number,
): void {
  const halfSpan = spanZ / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-halfSpan, 0);
  shape.lineTo(0, gableH);
  shape.lineTo(halfSpan, 0);
  shape.closePath();
  const gablePrism = new THREE.ExtrudeGeometry(shape, {
    depth: lenX,
    bevelEnabled: false,
    steps: 1,
  });
  gablePrism.translate(0, 0, -lenX / 2);
  gablePrism.rotateY(Math.PI / 2);
  batch.add(palette.basqueWhite, gablePrism, { x: cx, y: baseY, z: cz });

  const eaveSpan = halfSpan + overhang;
  const slopeAngle = Math.atan2(gableH, halfSpan);
  const eaveDrop = overhang * (gableH / halfSpan);
  const midDist = eaveSpan / 2;
  const midY = (gableH - eaveDrop) / 2;
  const slopeLen = Math.hypot(eaveSpan, gableH + eaveDrop) + 0.06;

  for (const sz of [-1, 1]) {
    batch.add(roofColor, new THREE.BoxGeometry(lenX + overhang * 2, 0.14, slopeLen), {
      x: cx,
      y: baseY + midY + 0.07,
      z: cz + sz * midDist,
      rx: sz * slopeAngle,
    });
    // Subtle red gable rake trim under the roof edge on both ends.
    for (const sx of [-1, 1]) {
      batch.add(palette.basqueRed, new THREE.BoxGeometry(0.14, 0.15, slopeLen * 0.98), {
        x: cx + sx * (lenX / 2 + 0.06),
        y: baseY + midY + 0.01,
        z: cz + sz * midDist,
        rx: sz * slopeAngle,
      });
    }
  }
  batch.add(palette.roofTileDark, new THREE.BoxGeometry(lenX + overhang * 2, 0.14, 0.24), {
    x: cx,
    y: baseY + gableH + 0.06,
    z: cz,
  });
}

/**
 * Large Basque house: two connected volumes of different heights, low-pitch gable roof facing the camera,
 * exposed thin red timber framing, upper wooden balcony under the gable, red shutters, walled garden.
 * Styled as a generic Basque residence (not an accurate picture of Villa Eliada).
 */
function basqueVilla(batch: StaticBatch, ctx: PhysicsCtx, x: number, y: number, z: number): void {
  // Main 2.5-floor volume positioned on the east (+X) side so the gable end & balcony face the camera cleanly.
  const mw = 10.6;
  const mh = 6.2;
  const md = 8.8;
  const mx = x + 1.4;
  const gableH = 1.95;
  batch.add(palette.basqueWhite, new THREE.BoxGeometry(mw, mh, md), {
    x: mx,
    y: y + mh / 2,
    z,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(mw + 0.22, 0.65, md + 0.22), {
    x: mx,
    y: y + 0.32,
    z,
  });
  gableRoofX(batch, mx, y + mh, z, mw, md, gableH, 0.38, palette.roofTile);
  batch.add(palette.limestone, new THREE.BoxGeometry(0.75, 1.35, 0.75), {
    x: mx - 2.6,
    y: y + mh + gableH + 0.2,
    z: z - 1.4,
  });

  // Lower connected west wing (different height: 4.5u vs 6.2u).
  const ww = 6.6;
  const wh = 4.5;
  const wd = 6.8;
  const wx = x - 6.0;
  const wz = z + 0.4;
  batch.add(palette.basqueWhite, new THREE.BoxGeometry(ww, wh, wd), {
    x: wx,
    y: y + wh / 2,
    z: wz,
  });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(ww + 0.2, 0.62, wd + 0.2), {
    x: wx,
    y: y + 0.31,
    z: wz,
  });
  gableRoofX(batch, wx, y + wh, wz, ww, wd, 1.35, 0.35, palette.roofTileDark);

  // Exposed thin red Basque half-timbering on gable end, camera-facing walls (+X and -Z), and garden front (+Z).
  const mainEastX = mx + mw / 2 + 0.05;
  timberFacadeX(batch, mainEastX, y + 0.65, y + 3.25, z, md, mh - 3.25, gableH);
  timberFacadeZ(batch, mx, y + 0.65, y + 3.25, z + md / 2 + 0.05, mw, mh - 3.25);
  timberFacadeZ(batch, mx, y + 0.65, y + 3.25, z - md / 2 - 0.05, mw, mh - 3.25);
  timberFacadeZ(batch, wx, y + 0.62, y + 2.45, wz + wd / 2 + 0.05, ww, wh - 2.45);
  timberFacadeZ(batch, wx, y + 0.62, y + 2.45, wz - wd / 2 - 0.05, ww, wh - 2.45);

  // Upper-floor wooden Basque balcony projecting under the camera-facing (+X) gable.
  const balcW = 1.45;
  const balcD = 4.8;
  const balcY = y + 3.22;
  const balcX = mx + mw / 2 + balcW / 2;
  batch.add(palette.crateDark, new THREE.BoxGeometry(balcW, 0.16, balcD), {
    x: balcX,
    y: balcY,
    z,
  });
  for (const bz of [-1.85, 0, 1.85]) {
    batch.add(palette.doorBrown, new THREE.BoxGeometry(balcW * 0.82, 0.22, 0.16), {
      x: mx + mw / 2 + balcW * 0.41,
      y: balcY - 0.18,
      z: z + bz,
    });
  }
  const railTopY = balcY + 0.92;
  const outerX = mx + mw / 2 + balcW - 0.06;
  batch.add(palette.doorBrown, new THREE.BoxGeometry(0.11, 0.09, balcD + 0.06), {
    x: outerX,
    y: railTopY,
    z,
  });
  for (const sz of [-1, 1]) {
    batch.add(palette.doorBrown, new THREE.BoxGeometry(balcW, 0.09, 0.11), {
      x: balcX,
      y: railTopY,
      z: z + sz * (balcD / 2 - 0.05),
    });
  }
  for (let i = 0; i <= 8; i++) {
    const pz = z - balcD / 2 + 0.06 + (i / 8) * (balcD - 0.12);
    const isCorner = i === 0 || i === 4 || i === 8;
    batch.add(
      isCorner ? palette.doorBrown : palette.crateDark,
      new THREE.BoxGeometry(isCorner ? 0.11 : 0.07, 0.88, isCorner ? 0.11 : 0.07),
      { x: outerX, y: balcY + 0.46, z: pz },
    );
  }
  // French balcony doorway behind the wooden balcony + side windows with red shutters on +X.
  batch.add(palette.doorBrown, new THREE.BoxGeometry(0.12, 2.05, 1.35), {
    x: mainEastX,
    y: balcY + 1.05,
    z,
  });
  batch.add(palette.parisWindow, new THREE.BoxGeometry(0.14, 1.75, 1.05), {
    x: mainEastX + 0.02,
    y: balcY + 1.1,
    z,
  });
  for (const sz of [-1, 1]) {
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.08, 1.8, 0.42), {
      x: mainEastX + 0.03,
      y: balcY + 1.1,
      z: z + sz * 0.92,
    });
    // Flanking upper windows inside the corners + lower ground-floor windows on +X.
    for (const wy of [y + 1.65, balcY + 1.3]) {
      const wzPos = z + sz * 3.15;
      batch.add(palette.parisWindow, new THREE.BoxGeometry(0.1, 1.25, 0.85), {
        x: mainEastX,
        y: wy,
        z: wzPos,
      });
      for (const s2 of [-1, 1]) {
        batch.add(palette.basqueRed, new THREE.BoxGeometry(0.08, 1.25, 0.32), {
          x: mainEastX + 0.02,
          y: wy,
          z: wzPos + s2 * 0.62,
        });
      }
    }
  }
  // Small arched attic loft window centered inside the gable wall.
  batch.add(palette.parisWindow, new THREE.BoxGeometry(0.1, 0.78, 0.72), {
    x: mainEastX,
    y: y + mh + gableH * 0.46,
    z,
  });

  // Front (+Z) doorway & recessed windows with red-painted shutters on both volumes.
  const frontZ = z + md / 2 + 0.05;
  batch.add(palette.doorBrown, new THREE.BoxGeometry(1.45, 2.4, 0.14), {
    x: mx,
    y: y + 1.2,
    z: frontZ,
  });
  batch.add(palette.roofTileDark, new THREE.BoxGeometry(2.5, 0.22, 1.15), {
    x: mx,
    y: y + 2.85,
    z: frontZ + 0.48,
    rx: 0.2,
  });
  for (const wPos of [-3.3, -1.65, 1.65, 3.3]) {
    for (const fy of [1.65, 4.75]) {
      for (const zFace of [frontZ, z - md / 2 - 0.05]) {
        batch.add(palette.parisWindow, new THREE.BoxGeometry(0.86, 1.25, 0.1), {
          x: mx + wPos,
          y: y + fy,
          z: zFace,
        });
        const sOff = zFace > z ? 0.02 : -0.02;
        for (const s of [-1, 1]) {
          batch.add(palette.basqueRed, new THREE.BoxGeometry(0.34, 1.25, 0.08), {
            x: mx + wPos + s * 0.64,
            y: y + fy,
            z: zFace + sOff,
          });
        }
      }
    }
  }
  for (const wPos of [-1.4, 1.4]) {
    for (const fy of [1.5, 3.45]) {
      for (const zFace of [wz + wd / 2 + 0.05, wz - wd / 2 - 0.05]) {
        batch.add(palette.parisWindow, new THREE.BoxGeometry(0.82, 1.1, 0.1), {
          x: wx + wPos,
          y: y + fy,
          z: zFace,
        });
        const sOff = zFace > wz ? 0.02 : -0.02;
        for (const s of [-1, 1]) {
          batch.add(palette.basqueRed, new THREE.BoxGeometry(0.32, 1.1, 0.08), {
            x: wx + wPos + s * 0.62,
            y: y + fy,
            z: zFace + sOff,
          });
        }
      }
    }
  }
  staticBox(ctx, mx, y + mh / 2, z, mw, mh, md);
  staticBox(ctx, wx, y + wh / 2, wz, ww, wh, wd);

  // Walled garden enclosure with stone gate pillars & red-painted open gate leaves.
  const gateZ = z + 10.5;
  for (const sx of [-1, 1]) {
    batch.add(palette.quayStone, new THREE.BoxGeometry(8.6, 1.05, 0.52), {
      x: x + sx * 6.3,
      y: y + 0.52,
      z: gateZ,
    });
    batch.add(palette.quayStoneDark, new THREE.BoxGeometry(8.7, 0.16, 0.62), {
      x: x + sx * 6.3,
      y: y + 1.1,
      z: gateZ,
    });
    // Stone gate pillars framing the garden entrance.
    const px = x + sx * 2.05;
    batch.add(palette.quayStone, new THREE.BoxGeometry(0.85, 1.9, 0.85), {
      x: px,
      y: y + 0.95,
      z: gateZ,
    });
    batch.add(palette.quayStoneDark, new THREE.ConeGeometry(0.7, 0.45, 4), {
      x: px,
      y: y + 2.1,
      z: gateZ,
      ry: Math.PI / 4,
    });
    batch.add(palette.basqueRed, new THREE.BoxGeometry(1.15, 1.2, 0.08), {
      x: px - sx * 0.35,
      y: y + 0.7,
      z: gateZ - 0.65,
      ry: sx * 1.15,
    });
    staticBox(ctx, x + sx * 6.3, y + 0.55, gateZ, 8.6, 1.1, 0.6);
  }
  // West garden side wall connecting back toward the house.
  batch.add(palette.quayStone, new THREE.BoxGeometry(0.5, 1.05, 13.5), {
    x: x - 10.4,
    y: y + 0.52,
    z: gateZ - 6.7,
  });
  staticBox(ctx, x - 10.4, y + 0.55, gateZ - 6.7, 0.6, 1.1, 13.5);

  // Round clipped garden shrubs and two feathery tamarisk trees in the villa garden.
  for (const [sx, sz, sr] of [
    [x - 4.2, gateZ - 1.5, 0.7],
    [x + 4.4, gateZ - 1.4, 0.65],
    [x - 8.4, gateZ - 3.6, 0.85],
    [mx - 4.2, frontZ + 1.3, 0.6],
    [mx + 4.2, frontZ + 1.3, 0.6],
  ] as const) {
    batch.add(palette.hedgeGreen, new THREE.IcosahedronGeometry(sr, 0), {
      x: sx,
      y: y + sr * 0.72,
      z: sz,
      sy: 0.78,
    });
  }
  tamariskTree(batch, x - 4.2, y, gateZ - 2.2, 0.1);
  tamariskTree(batch, x + 7.5, y, gateZ - 2.2, -0.09);
}

/** Stone garden terrace with a small writing table, chair and manuscript pages. */
function terraceAndTable(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  y: number,
  z: number,
): void {
  batch.add(palette.quayStone, new THREE.BoxGeometry(8, 0.25, 7), { x, y: y + 0.125, z });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(8.2, 0.6, 0.4), {
    x,
    y: y + 0.4,
    z: z + 3.4,
  });
  staticBox(ctx, x, y + 0.4, z + 3.4, 8.2, 0.8, 0.5);

  const tx = x;
  const tz = z - 0.6;
  batch.add(palette.deckWood, new THREE.BoxGeometry(1.5, 0.1, 1.0), { x: tx, y: y + 0.95, z: tz });
  for (const lx of [-0.55, 0.55]) {
    for (const lz of [-0.35, 0.35]) {
      batch.add(palette.deckWood, new THREE.BoxGeometry(0.1, 0.8, 0.1), {
        x: tx + lx,
        y: y + 0.55,
        z: tz + lz,
      });
    }
  }
  batch.add(palette.shirt, new THREE.BoxGeometry(0.55, 0.04, 0.4), {
    x: tx - 0.1,
    y: y + 1.02,
    z: tz,
    ry: 0.12,
  });
  batch.add(palette.lampIron, new THREE.CylinderGeometry(0.05, 0.06, 0.08, 6), {
    x: tx + 0.35,
    y: y + 1.04,
    z: tz - 0.15,
  });
  batch.add(palette.deckWood, new THREE.BoxGeometry(0.55, 0.08, 0.55), {
    x: tx,
    y: y + 0.62,
    z: tz - 0.95,
  });
  batch.add(palette.deckWood, new THREE.BoxGeometry(0.55, 0.55, 0.08), {
    x: tx,
    y: y + 0.92,
    z: tz - 1.2,
  });
  staticBox(ctx, tx, y + 0.5, tz - 0.3, 1.6, 1.0, 2.0);
}

/** Small provincial railway station at the inland edge of Biarritz. */
function biarritzStation(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  x: number,
  y: number,
  z: number,
): void {
  const w = 16;
  const h = 4.6;
  batch.add(palette.quayStone, new THREE.BoxGeometry(w + 4, 0.35, 6), {
    x,
    y: y + 0.175,
    z: z + 5,
  });
  batch.add(palette.basqueWhite, new THREE.BoxGeometry(w, h, 6.5), { x, y: y + h / 2, z });
  batch.add(palette.roofTile, new THREE.BoxGeometry(w + 1.2, 1.4, 7.6), {
    x,
    y: y + h + 0.7,
    z,
  });
  batch.add(palette.awningRed, new THREE.BoxGeometry(w - 1, 0.12, 2.2), {
    x,
    y: y + 3.0,
    z: z + 4.2,
    rx: 0.25,
  });
  batch.add(palette.doorBrown, new THREE.BoxGeometry(1.4, 2.3, 0.12), {
    x,
    y: y + 1.15,
    z: z + 3.28,
  });
  for (const wx of [-5, -2.5, 2.5, 5]) {
    batch.add(palette.parisWindow, new THREE.BoxGeometry(1.1, 1.5, 0.1), {
      x: x + wx,
      y: y + 1.7,
      z: z + 3.28,
    });
  }
  staticBox(ctx, x, y + h / 2, z, w, h, 6.5);

  const lz = z - 5.2;
  batch.add(palette.railSteel, new THREE.BoxGeometry(28, 0.2, 2.0), { x, y: y + 0.1, z: lz });
  staticBox(ctx, x, y + 1.5, lz, 8, 3.0, 2.4);
}
