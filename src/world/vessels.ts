import * as THREE from 'three';
import { StaticBatch, mat } from './kit';
import { palette } from './palette';
import { staticBox, type PhysicsCtx } from './physics';

/**
 * A toy-scale 1870s passenger steamer: black hull, white deckhouses,
 * one black funnel and three masts for auxiliary sails.
 * Lies along X with the bow toward +X. Returns the deck height.
 */
export function steamer(
  batch: StaticBatch,
  ctx: PhysicsCtx,
  cx: number,
  cz: number,
  length = 26,
  funnelColor: number = palette.hull,
): number {
  const beam = 4.6;
  const half = length / 2;
  const waterline = -1.2;
  const deckY = 1.0;
  const hullH = deckY - waterline + 1.2;

  // Hull outline seen from above: square stern, long pointed bow.
  const shape = new THREE.Shape();
  shape.moveTo(-half, -beam / 2 + 0.3);
  shape.lineTo(-half + 0.6, -beam / 2);
  shape.lineTo(half - 5, -beam / 2);
  shape.quadraticCurveTo(half - 1.2, -beam / 2 + 0.4, half, 0);
  shape.quadraticCurveTo(half - 1.2, beam / 2 - 0.4, half - 5, beam / 2);
  shape.lineTo(-half + 0.6, beam / 2);
  shape.lineTo(-half, beam / 2 - 0.3);
  shape.closePath();
  const hull = new THREE.ExtrudeGeometry(shape, {
    depth: hullH,
    bevelEnabled: false,
    curveSegments: 4,
  });
  hull.rotateX(-Math.PI / 2);
  batch.add(palette.hull, hull, { x: cx, y: waterline - 1.2, z: cz });

  // Red boot topping at the waterline and a pale deck.
  const boot = new THREE.ExtrudeGeometry(shape, {
    depth: 0.35,
    bevelEnabled: false,
    curveSegments: 4,
  });
  boot.rotateX(-Math.PI / 2);
  batch.add(palette.iron, boot, { x: cx, y: waterline - 0.15, z: cz, sx: 1.005, sz: 1.01 });
  const deck = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: false,
    curveSegments: 4,
  });
  deck.rotateX(-Math.PI / 2);
  batch.add(palette.deckWood, deck, { x: cx, y: deckY, z: cz, sx: 0.97, sz: 0.92 });

  // Deckhouses.
  batch.add(palette.shirt, new THREE.BoxGeometry(9, 1.5, 3.0), {
    x: cx - 2,
    y: deckY + 0.8,
    z: cz,
  });
  batch.add(palette.shirt, new THREE.BoxGeometry(3.5, 1.2, 2.4), {
    x: cx - 9,
    y: deckY + 0.65,
    z: cz,
  });
  batch.add(0x2c2a2b, new THREE.BoxGeometry(9.1, 0.4, 3.1), { x: cx - 2, y: deckY + 1.1, z: cz });
  batch.add(palette.deckWood, new THREE.BoxGeometry(5, 0.15, 3.4), {
    x: cx - 1,
    y: deckY + 1.6,
    z: cz,
  });

  // Funnel with a slight rake.
  batch.add(funnelColor, new THREE.CylinderGeometry(0.75, 0.8, 4.2, 10), {
    x: cx - 0.5,
    y: deckY + 3.4,
    z: cz,
    rz: 0.08,
  });

  // Three masts with yards.
  for (const [mx, h] of [
    [half - 6, 9],
    [3.5, 8.5],
    [-half + 4, 7.5],
  ] as const) {
    batch.add(palette.deckWood, new THREE.CylinderGeometry(0.08, 0.14, h, 5), {
      x: cx + mx,
      y: deckY + h / 2,
      z: cz,
    });
    batch.add(palette.deckWood, new THREE.CylinderGeometry(0.05, 0.05, 3.2, 4), {
      x: cx + mx,
      y: deckY + h * 0.72,
      z: cz,
      rx: Math.PI / 2,
    });
    // Furled sail along the yard.
    batch.add(palette.sail, new THREE.CylinderGeometry(0.12, 0.12, 2.8, 5), {
      x: cx + mx,
      y: deckY + h * 0.72 - 0.15,
      z: cz,
      rx: Math.PI / 2,
    });
  }

  // Railing posts along the bulwark.
  for (let x = -half + 1.5; x < half - 5; x += 1.5) {
    for (const s of [-1, 1]) {
      batch.add(palette.shirt, new THREE.BoxGeometry(0.06, 0.5, 0.06), {
        x: cx + x,
        y: deckY + 0.3,
        z: cz + s * (beam / 2 - 0.15),
      });
    }
  }

  staticBox(ctx, cx, 0, cz, length, 4, beam);
  return deckY;
}

/** A small Provencal fishing boat with a single mast. */
export function fishingBoat(
  batch: StaticBatch,
  x: number,
  z: number,
  ry: number,
  color: number,
  yOffset = 0,
  rx = 0,
): void {
  const shape = new THREE.Shape();
  shape.moveTo(-2.2, 0);
  shape.quadraticCurveTo(-1.6, -0.9, 0, -0.95);
  shape.quadraticCurveTo(1.6, -0.9, 2.2, 0);
  shape.quadraticCurveTo(1.6, 0.9, 0, 0.95);
  shape.quadraticCurveTo(-1.6, 0.9, -2.2, 0);
  const hull = new THREE.ExtrudeGeometry(shape, {
    depth: 0.8,
    bevelEnabled: false,
    curveSegments: 5,
  });
  hull.rotateX(-Math.PI / 2);
  batch.add(color, hull, { x, y: -1.45 + yOffset, z, ry, rx });
  const inner = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: false,
    curveSegments: 5,
  });
  inner.rotateX(-Math.PI / 2);
  batch.add(palette.deckWood, inner, { x, y: -0.75 + yOffset, z, ry, rx, sx: 0.85, sz: 0.8 });
  batch.add(palette.deckWood, new THREE.CylinderGeometry(0.05, 0.07, 3.2, 4), {
    x,
    y: 0.8 + yOffset,
    z,
    rx,
  });
}

export interface MovableTrain {
  group: THREE.Group;
  setState(offsetX: number, doorClose: number): void;
  dispose(): void;
}

/**
 * Shared 1880s locomotive + passenger carriage with animated closing doors for station scenes.
 * Built via StaticBatch so the entire train costs 1-2 draw calls plus 1 door leaf draw call.
 */
export function buildTrain(
  cx: number,
  y: number,
  cz: number,
  dir: 1 | -1 = 1,
  scale = 1,
): MovableTrain {
  const group = new THREE.Group();
  group.position.set(cx, y, cz);
  const trainPivot = new THREE.Group();
  trainPivot.scale.set(dir * scale, scale, scale);
  group.add(trainPivot);

  const batch = new StaticBatch();
  // Locomotive ahead (+X in local space).
  batch.add(palette.hull, new THREE.CylinderGeometry(0.92, 0.92, 4.8, 10), {
    x: 1.0,
    y: 1.9,
    z: 0,
    rz: Math.PI / 2,
  });
  batch.add(palette.hull, new THREE.BoxGeometry(2.2, 2.55, 2.3), { x: -2.4, y: 2.28, z: 0 });
  batch.add(palette.roofSlate, new THREE.BoxGeometry(2.4, 0.24, 2.5), { x: -2.4, y: 3.65, z: 0 });
  batch.add(palette.hull, new THREE.CylinderGeometry(0.28, 0.4, 1.3, 8), { x: 2.8, y: 3.15, z: 0 });
  batch.add(palette.funnel, new THREE.CylinderGeometry(0.3, 0.3, 0.45, 8), {
    x: 0.8,
    y: 2.95,
    z: 0,
  });
  for (const wx of [-2.4, -0.6, 1.2, 2.9]) {
    for (const s of [-1, 1]) {
      batch.add(palette.lampIron, new THREE.CylinderGeometry(0.58, 0.58, 0.14, 10), {
        x: wx,
        y: 0.72,
        z: s * 1.05,
        rx: Math.PI / 2,
      });
    }
  }

  // Passenger carriage coupled behind (-X).
  const carX = -7.6;
  batch.add(palette.crateDark, new THREE.BoxGeometry(6.8, 2.25, 2.25), { x: carX, y: 1.95, z: 0 });
  batch.add(palette.zincRoofDark, new THREE.BoxGeometry(7.0, 0.35, 2.4), {
    x: carX,
    y: 3.2,
    z: 0,
  });
  for (const wx of [-9.6, -5.6]) {
    for (const s of [-1, 1]) {
      batch.add(palette.lampIron, new THREE.CylinderGeometry(0.45, 0.45, 0.14, 8), {
        x: wx,
        y: 0.58,
        z: s * 1.05,
        rx: Math.PI / 2,
      });
    }
  }
  for (const vx of [-9.3, -8.1, -6.9, -5.7]) {
    for (const s of [-1, 1]) {
      batch.add(palette.parisWindow, new THREE.BoxGeometry(0.7, 0.78, 0.08), {
        x: carX + vx + 7.6,
        y: 2.15,
        z: s * 1.13,
      });
    }
  }

  const staticMesh = batch.build('train-body');
  trainPivot.add(staticMesh);

  // Two swinging carriage doors (+Z and -Z) that swing shut as `doorClose` approaches 1.
  const doorGeo = new THREE.BoxGeometry(0.68, 1.75, 0.08);
  doorGeo.translate(0.34, 0, 0);
  const doorFront = new THREE.Mesh(doorGeo, mat(palette.doorBrown));
  doorFront.position.set(carX + 0.1, 1.7, 1.16);
  const doorBack = new THREE.Mesh(doorGeo, doorFront.material);
  doorBack.position.set(carX + 0.1, 1.7, -1.16);
  trainPivot.add(doorFront, doorBack);

  return {
    group,
    setState(offsetX: number, doorClose: number) {
      group.position.x = cx + offsetX;
      const openAngle = (1 - THREE.MathUtils.clamp(doorClose, 0, 1)) * 1.1;
      doorFront.rotation.y = -openAngle;
      doorBack.rotation.y = openAngle;
    },
    dispose() {
      group.removeFromParent();
      doorGeo.dispose();
      (doorFront.material as THREE.Material).dispose();
      staticMesh.traverse((c) => {
        if (c instanceof THREE.Mesh) c.geometry.dispose();
      });
    },
  };
}
