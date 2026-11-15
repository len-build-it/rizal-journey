import * as THREE from 'three';
import { StaticBatch } from './kit';
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
  batch.add(color, hull, { x, y: -1.45, z, ry });
  const inner = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: false,
    curveSegments: 5,
  });
  inner.rotateX(-Math.PI / 2);
  batch.add(palette.deckWood, inner, { x, y: -0.75, z, ry, sx: 0.85, sz: 0.8 });
  batch.add(palette.deckWood, new THREE.CylinderGeometry(0.05, 0.07, 3.2, 4), { x, y: 0.8, z });
}
