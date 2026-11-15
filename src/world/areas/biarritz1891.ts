import * as THREE from 'three';
import { StaticBatch, disposeObject, seeded } from '../kit';
import { palette } from '../palette';
import { boundary, disposePhysics, staticBox, type PhysicsCtx } from '../physics';
import { gasLamp, planeTree } from '../builders';
import { fishingBoat } from '../vessels';
import { Props } from '../Props';
import { Water } from '../Water';
import { StopMarker } from '../StopMarker';
import { storiesFor } from '../../content/stories';
import type { Area } from '../Area';

const PLATEAU_Y = 2.6;
const PROM_Y = 0.4;

/**
 * Biarritz, February to March 1891.
 *
 * Layout (top view, +Z toward the Atlantic Ocean):
 *   south (z > 10)  : curving sandy beach, rocky outcrops at both ends, rough Atlantic waves
 *   middle (z ~ 4)  : curving stone seawall promenade, gentle grassy slope inland
 *   north-west      : Basque-style villa on the slope with garden and sea-facing terrace
 *   north-east      : small inland railway station and platform
 */
export function buildBiarritz1891(scene: THREE.Scene, ctx: PhysicsCtx): Area {
  const batch = new StaticBatch();
  const props = new Props(ctx, scene);

  const shoreZ = (x: number): number => 8 + 0.004 * x * x;

  // Sandy beach floor sloping gently under the sea.
  batch.add(palette.sand, new THREE.BoxGeometry(160, 2, 34), { x: 0, y: -1.4, z: 14 });
  batch.add(palette.sandWet, new THREE.BoxGeometry(160, 1.5, 16), { x: 0, y: -1.5, z: 24 });
  staticBox(ctx, 0, -1.4, 14, 160, 2, 34);

  // Promenade base kept strictly behind the curving stone promenade (top y = 0.35 < PROM_Y = 0.4).
  batch.add(palette.grass, new THREE.BoxGeometry(150, 2.4, 15), { x: 0, y: -0.85, z: -4.5 });
  staticBox(ctx, 0, -0.85, -4.5, 150, 2.4, 15);

  // Curving seawall promenade + parapet curb along shoreZ(x), spanning back to z = 0 without Z-fighting.
  const segs = 12;
  const span = 88;
  for (let i = 0; i < segs; i++) {
    const x0 = -span / 2 + (i / segs) * span;
    const x1 = -span / 2 + ((i + 1) / segs) * span;
    const xm = (x0 + x1) / 2;
    const z0 = shoreZ(x0);
    const z1 = shoreZ(x1);
    const zm = (z0 + z1) / 2;
    const segLen = Math.hypot(x1 - x0, z1 - z0) + 0.4;
    const ry = -Math.atan2(z1 - z0, x1 - x0);

    batch.add(palette.quayStone, new THREE.BoxGeometry(segLen, 0.8, 13.5), {
      x: xm,
      y: 0.0,
      z: zm - 6.75,
      ry,
    });
    batch.add(palette.quayStoneDark, new THREE.BoxGeometry(segLen, 1.6, 0.7), {
      x: xm,
      y: -0.2,
      z: zm,
      ry,
    });
    staticBox(ctx, xm, 0.0, zm - 6.75, segLen, 0.8, 13.5, ry);

    // Leave a beach access gap at i === 6 (x ~ 0..7) with a gentle sand ramp; curb the rest.
    if (i === 6) {
      batch.add(palette.sand, new THREE.BoxGeometry(segLen, 0.4, 5.5), {
        x: xm,
        y: -0.1,
        z: zm + 2.2,
        ry,
        rx: -0.16,
      });
      staticBox(ctx, xm, -0.1, zm + 2.2, segLen, 0.4, 5.5, ry, -0.16);
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
  // Keep horse from riding too far into the water from the beach access.
  staticBox(ctx, 0, 0.5, 16.5, 120, 2.0, 0.8);

  // Rocky outcrops framing both ends of the curving bay.
  const rnd = seeded(1891);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      batch.add(
        i % 2 ? palette.rock : palette.rockDark,
        new THREE.IcosahedronGeometry(2.4 + rnd() * 2.2, 0),
        {
          x: side * (41 + rnd() * 10),
          y: -0.4 + rnd() * 1.4,
          z: 10 + i * 1.8 + rnd() * 2,
          sy: 0.65,
          ry: rnd() * 3,
        },
      );
    }
    staticBox(ctx, side * 44, 1.2, 16, 10, 3, 18);
  }

  // Slope from promenade (z = 0, y = 0.4) up to the inland plateau (z = -12, y = 2.6).
  const slopeLen = Math.hypot(12, PLATEAU_Y - PROM_Y);
  const slopeAngle = Math.atan2(PLATEAU_Y - PROM_Y, 12);
  batch.add(palette.grass, new THREE.BoxGeometry(140, 1.2, slopeLen), {
    x: 0,
    y: (PROM_Y + PLATEAU_Y) / 2 - 0.6,
    z: -6,
    rx: slopeAngle,
  });
  staticBox(ctx, 0, (PROM_Y + PLATEAU_Y) / 2 - 0.6, -6, 140, 1.2, slopeLen, 0, slopeAngle);

  // Gravel paths climbing the slope to the villa gate (x = -14) and east toward the station (x = 24).
  for (const px of [-14, 24]) {
    batch.add(palette.dirt, new THREE.BoxGeometry(4.5, 1.24, slopeLen), {
      x: px,
      y: (PROM_Y + PLATEAU_Y) / 2 - 0.58,
      z: -6,
      rx: slopeAngle,
    });
  }

  // Upper inland plateau (z = -12..-56, top y = PLATEAU_Y = 2.6).
  batch.add(palette.grass, new THREE.BoxGeometry(140, 4, 48), {
    x: 0,
    y: PLATEAU_Y - 2,
    z: -35.8,
  });
  staticBox(ctx, 0, PLATEAU_Y - 2, -35.8, 140, 4, 48);

  // Road linking the villa gate, terrace and inland station on the plateau.
  batch.add(palette.dirt, new THREE.BoxGeometry(52, 0.06, 4.5), {
    x: 7,
    y: PLATEAU_Y + 0.03,
    z: -14,
  });
  batch.add(palette.dirt, new THREE.BoxGeometry(4.5, 0.06, 16), {
    x: 28,
    y: PLATEAU_Y + 0.03,
    z: -21,
  });

  // Basque-style villa and garden on the upper slope.
  basqueVilla(batch, ctx, -14, PLATEAU_Y, -26);

  // Sea-facing terrace beside the villa, with small writing table and chair for the manuscript stop.
  terraceAndTable(batch, ctx, -3.5, PLATEAU_Y, -19);

  // Small inland railway station at the northeast edge.
  biarritzStation(batch, ctx, 28, PLATEAU_Y, -35);

  // Promenade lamps and trees.
  for (let x = -32; x <= 32; x += 16) {
    gasLamp(batch, ctx, x, shoreZ(x) - 1.2);
  }
  for (const [tx, tz] of [
    [-30, -18],
    [-28, -28],
    [4, -26],
    [14, -22],
    [38, -20],
  ] as const) {
    batch.add(0xb3a58e, new THREE.CylinderGeometry(0.18, 0.28, 3.2, 6), {
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
  planeTree(batch, ctx, -26, 2, 71);
  planeTree(batch, ctx, 20, 4, 72);

  // Beach and promenade props: rowing boat resting atop the sand, beach chairs, barrels.
  fishingBoat(batch, -13, 14.5, 0.42, palette.basqueRed, 1.1, 0.08);
  props.beachChair(7, 11.2, -0.15, palette.awningRed, -0.4);
  props.beachChair(9.2, 11.5, -0.22, palette.shutterBlue, -0.4);
  props.beachChair(-3.5, 6.2, 0.1, palette.awningRed, PROM_Y);
  props.barrel(18, -27, 0.2, true, PLATEAU_Y);
  props.barrel(18.9, -26.4, 0.6, true, PLATEAU_Y);
  props.crate(19.6, -27.2, 0.85, 0.3, PLATEAU_Y + 0.43);

  // A few low-poly late-winter clouds above the horizon.
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

  boundary(ctx, -42, 42, -44, 20);
  const staticGroup = batch.build('biarritz-static');
  scene.add(staticGroup);

  // Rougher Atlantic waves than Marseille.
  const water = new Water(240, 110, 3, new THREE.Vector3(0, -1.35, 64), 2.4);
  scene.add(water.mesh);

  const [villa, manuscript, station] = storiesFor('biarritz-1891');
  const stops = [
    new StopMarker(
      villa!,
      new THREE.Vector3(-14, PLATEAU_Y, -12.5),
      new THREE.Vector3(-14, PLATEAU_Y + 2.4, -21),
      1.4,
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

  return {
    id: 'biarritz-1891',
    name: 'Biarritz, 1891',
    spawn: new THREE.Vector3(-4, PROM_Y, 4),
    spawnHeading: Math.PI,
    stops,
    staticDrawCalls: staticGroup.children.length,
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
      props.update();
    },
    dispose() {
      disposeObject(staticGroup);
      water.dispose();
      props.dispose();
      for (const s of stops) s.dispose();
      disposePhysics(ctx);
    },
  };
}

/** Generic Basque-style villa: white walls, red timbers and shutters, low red tile roof and garden gate. */
function basqueVilla(batch: StaticBatch, ctx: PhysicsCtx, x: number, y: number, z: number): void {
  const w = 14;
  const h = 6.2;
  const d = 10;
  batch.add(palette.basqueWhite, new THREE.BoxGeometry(w, h, d), { x, y: y + h / 2, z });
  batch.add(palette.quayStoneDark, new THREE.BoxGeometry(w + 0.2, 0.6, d + 0.2), {
    x,
    y: y + 0.3,
    z,
  });

  // Low gabled / hipped Basque red tile roof.
  const roof = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
  roof.rotateY(Math.PI / 4);
  roof.scale(w + 1.4, 2.5, d + 1.4);
  batch.add(palette.roofTile, roof, { x, y: y + h + 1.25, z });

  // Red-painted Basque timber beams on the upper floor and gable trim.
  batch.add(palette.basqueRed, new THREE.BoxGeometry(w + 0.14, 0.2, d + 0.14), {
    x,
    y: y + 3.2,
    z,
  });
  for (let tx = -5.5; tx <= 5.5; tx += 2.75) {
    batch.add(palette.basqueRed, new THREE.BoxGeometry(0.18, 2.9, 0.12), {
      x: x + tx,
      y: y + 4.7,
      z: z + d / 2 + 0.04,
    });
  }

  // Front doorway and windows with red-painted shutters.
  const front = z + d / 2 + 0.05;
  batch.add(palette.doorBrown, new THREE.BoxGeometry(1.5, 2.5, 0.14), {
    x,
    y: y + 1.25,
    z: front,
  });
  for (const wx of [-4.2, -2.0, 2.0, 4.2]) {
    for (const fy of [1.6, 4.6]) {
      batch.add(0x2c3138, new THREE.BoxGeometry(0.95, 1.35, 0.1), {
        x: x + wx,
        y: y + fy,
        z: front,
      });
      for (const s of [-1, 1]) {
        batch.add(palette.basqueRed, new THREE.BoxGeometry(0.4, 1.35, 0.08), {
          x: x + wx + s * 0.72,
          y: y + fy,
          z: front + 0.02,
        });
      }
    }
  }
  // East (+X) and north (-Z) windows with red shutters so the villa facade reads from the camera side too.
  for (const wx of [-4.2, -2.0, 2.0, 4.2]) {
    for (const fy of [1.6, 4.6]) {
      batch.add(0x2c3138, new THREE.BoxGeometry(0.95, 1.35, 0.1), {
        x: x + wx,
        y: y + fy,
        z: z - d / 2 - 0.05,
      });
      for (const s of [-1, 1]) {
        batch.add(palette.basqueRed, new THREE.BoxGeometry(0.4, 1.35, 0.08), {
          x: x + wx + s * 0.72,
          y: y + fy,
          z: z - d / 2 - 0.07,
        });
      }
    }
  }
  for (const wz of [-2.4, 2.4]) {
    for (const fy of [1.6, 4.6]) {
      batch.add(0x2c3138, new THREE.BoxGeometry(0.1, 1.35, 0.95), {
        x: x + w / 2 + 0.05,
        y: y + fy,
        z: z + wz,
      });
      for (const s of [-1, 1]) {
        batch.add(palette.basqueRed, new THREE.BoxGeometry(0.08, 1.35, 0.4), {
          x: x + w / 2 + 0.07,
          y: y + fy,
          z: z + wz + s * 0.72,
        });
      }
    }
  }
  staticBox(ctx, x, y + h / 2, z, w, h, d);

  // Garden low stone wall and front gate posts at z = -15.5.
  const gateZ = z + 10.5;
  for (const sx of [-1, 1]) {
    batch.add(palette.quayStone, new THREE.BoxGeometry(7.2, 1.0, 0.5), {
      x: x + sx * 5.6,
      y: y + 0.5,
      z: gateZ,
    });
    batch.add(palette.quayStoneDark, new THREE.BoxGeometry(0.8, 1.7, 0.8), {
      x: x + sx * 2.0,
      y: y + 0.85,
      z: gateZ,
    });
    staticBox(ctx, x + sx * 5.6, y + 0.5, gateZ, 7.2, 1.0, 0.6);
  }
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

  // Small table, manuscript sheets and chair.
  const tx = x;
  const tz = z - 0.6;
  batch.add(palette.deckWood, new THREE.BoxGeometry(1.5, 0.1, 1.0), { x: tx, y: y + 0.95, z: tz });
  batch.add(palette.deckWood, new THREE.BoxGeometry(0.1, 0.8, 0.1), {
    x: tx - 0.55,
    y: y + 0.55,
    z: tz - 0.35,
  });
  batch.add(palette.deckWood, new THREE.BoxGeometry(0.1, 0.8, 0.1), {
    x: tx + 0.55,
    y: y + 0.55,
    z: tz - 0.35,
  });
  batch.add(palette.deckWood, new THREE.BoxGeometry(0.1, 0.8, 0.1), {
    x: tx - 0.55,
    y: y + 0.55,
    z: tz + 0.35,
  });
  batch.add(palette.deckWood, new THREE.BoxGeometry(0.1, 0.8, 0.1), {
    x: tx + 0.55,
    y: y + 0.55,
    z: tz + 0.35,
  });
  // Manuscript paper stack on the table.
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
  // Chair behind the table.
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
    batch.add(0x2c3138, new THREE.BoxGeometry(1.1, 1.5, 0.1), {
      x: x + wx,
      y: y + 1.7,
      z: z + 3.28,
    });
  }
  staticBox(ctx, x, y + h / 2, z, w, h, 6.5);

  // Rail line and small locomotive alongside the station.
  const lz = z - 5.2;
  batch.add(palette.railSteel, new THREE.BoxGeometry(24, 0.2, 2.0), { x, y: y + 0.1, z: lz });
  batch.add(palette.hull, new THREE.CylinderGeometry(0.85, 0.85, 4.4, 10), {
    x: x - 0.5,
    y: y + 1.7,
    z: lz,
    rz: Math.PI / 2,
  });
  batch.add(palette.hull, new THREE.BoxGeometry(2.0, 2.3, 2.1), {
    x: x + 2.6,
    y: y + 2.1,
    z: lz,
  });
  batch.add(palette.iron, new THREE.BoxGeometry(2.2, 0.22, 2.3), {
    x: x + 2.6,
    y: y + 3.3,
    z: lz,
  });
  batch.add(palette.hull, new THREE.CylinderGeometry(0.25, 0.35, 1.1, 8), {
    x: x - 2.1,
    y: y + 2.9,
    z: lz,
  });
  staticBox(ctx, x, y + 1.5, lz, 8, 3.0, 2.4);
}
