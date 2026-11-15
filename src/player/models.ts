import * as THREE from 'three';
import { mat } from '../world/kit';
import { palette } from '../world/palette';

/** Resting angles of the neck and head; the gait animation swings around these. */
export const NECK_REST = 0.82;
export const HEAD_REST = 1.12;

/** Joints the animation system drives. Each leg has a hip and a knee pivot. */
export interface HorseRig {
  root: THREE.Group;
  /** Everything above the legs; bobs with the gait. */
  body: THREE.Group;
  legs: { hip: THREE.Group; knee: THREE.Group; front: boolean; side: -1 | 1 }[];
  neck: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  rider: RiderRig;
}

export interface RiderRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
}

function mesh(geo: THREE.BufferGeometry, color: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(color));
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}

function at<T extends THREE.Object3D>(obj: T, x: number, y: number, z: number): T {
  obj.position.set(x, y, z);
  return obj;
}

/** A tapered limb hanging from its pivot, pointing down -Y. */
function limb(rTop: number, rBottom: number, length: number, color: number, sides = 6): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, length, sides, 1);
  geo.translate(0, -length / 2, 0);
  return mesh(geo, color);
}

function buildLeg(
  x: number,
  y: number,
  z: number,
  front: boolean,
  side: -1 | 1,
): HorseRig['legs'][number] {
  const hip = at(new THREE.Group(), x, y, z);
  const upperLen = front ? 0.5 : 0.52;
  const upper = limb(front ? 0.11 : 0.13, 0.07, upperLen, palette.bay);
  hip.add(upper);

  const knee = at(new THREE.Group(), 0, -upperLen, 0);
  hip.add(knee);
  const lowerLen = 0.43;
  knee.add(limb(0.07, 0.06, lowerLen, palette.bayDark, 5));
  const hoof = mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.09, 6), palette.hoof);
  hoof.position.y = -lowerLen - 0.03;
  knee.add(hoof);
  return { hip, knee, front, side };
}

function buildRider(): RiderRig {
  const root = new THREE.Group();

  // Legs hang along the horse's sides; built first so the coat overlaps them.
  for (const s of [-1, 1] as const) {
    const thigh = limb(0.085, 0.075, 0.44, palette.coat);
    thigh.position.set(s * 0.24, 0.02, 0.06);
    thigh.rotation.set(-0.55, 0, s * 0.18);
    root.add(thigh);
    const shin = limb(0.07, 0.06, 0.42, palette.coat);
    shin.position.set(s * 0.31, -0.33, 0.29);
    shin.rotation.set(0.15, 0, s * 0.05);
    root.add(shin);
    const boot = mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), palette.hat);
    boot.position.set(s * 0.33, -0.74, 0.29);
    root.add(boot);
  }

  const torso = at(new THREE.Group(), 0, 0.05, -0.02);
  root.add(torso);
  // Frock coat: wider at the hips, narrow at the shoulders.
  const coat = mesh(new THREE.CylinderGeometry(0.17, 0.23, 0.6, 7), palette.coat);
  coat.position.y = 0.3;
  torso.add(coat);
  const collar = mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.07, 6), palette.shirt);
  collar.position.y = 0.62;
  torso.add(collar);

  const head = at(new THREE.Group(), 0, 0.72, 0.01);
  torso.add(head);
  head.add(mesh(new THREE.IcosahedronGeometry(0.13, 1), palette.skin));
  const hair = mesh(
    new THREE.SphereGeometry(0.138, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.5),
    palette.hair,
  );
  hair.position.set(0, 0.015, -0.012);
  head.add(hair);
  // Bowler hat: a crown and a narrow brim.
  const crown = mesh(
    new THREE.SphereGeometry(0.135, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55),
    palette.hat,
  );
  crown.position.y = 0.06;
  crown.scale.y = 1.05;
  head.add(crown);
  const brim = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 10), palette.hat);
  brim.position.y = 0.07;
  head.add(brim);

  // Arms reach forward and down to hold the reins in front of the saddle.
  const arm = (s: -1 | 1): THREE.Group => {
    const shoulder = at(new THREE.Group(), s * 0.19, 0.55, 0);
    const upperAngle = -0.45;
    const upper = limb(0.06, 0.05, 0.3, palette.coat, 5);
    upper.rotation.set(upperAngle, 0, s * 0.1);
    shoulder.add(upper);
    const elbow = at(
      new THREE.Group(),
      s * 0.03,
      -0.3 * Math.cos(upperAngle),
      -0.3 * Math.sin(upperAngle),
    );
    shoulder.add(elbow);
    const foreAngle = -1.3;
    const fore = limb(0.05, 0.045, 0.28, palette.coat, 5);
    fore.rotation.set(foreAngle, 0, -s * 0.25);
    elbow.add(fore);
    const hand = mesh(new THREE.IcosahedronGeometry(0.045, 0), palette.skin);
    hand.position.set(-s * 0.07, -0.28 * Math.cos(foreAngle), -0.28 * Math.sin(foreAngle));
    elbow.add(hand);
    torso.add(shoulder);
    return shoulder;
  };

  return { root, torso, head, armL: arm(-1), armR: arm(1) };
}

/**
 * A low-poly bay horse with a rider in an 1880s frock coat and bowler hat.
 * The model faces +Z and stands on y = 0.
 */
export function buildHorseAndRider(): HorseRig {
  const root = new THREE.Group();
  root.name = 'horse';
  const body = new THREE.Group();
  root.add(body);

  // Barrel, shoulders and hindquarters.
  const barrel = mesh(new THREE.CapsuleGeometry(0.34, 0.85, 3, 8), palette.bay);
  barrel.rotation.x = Math.PI / 2;
  barrel.scale.set(0.8, 1, 1);
  barrel.position.set(0, 1.2, -0.02);
  body.add(barrel);
  const chest = mesh(new THREE.IcosahedronGeometry(0.34, 1), palette.bay);
  chest.scale.set(0.82, 1.02, 0.95);
  chest.position.set(0, 1.2, 0.5);
  body.add(chest);
  const rump = mesh(new THREE.IcosahedronGeometry(0.35, 1), palette.bay);
  rump.scale.set(0.9, 0.95, 1.05);
  rump.position.set(0, 1.27, -0.5);
  body.add(rump);

  // Saddle blanket and saddle.
  const blanket = mesh(new THREE.BoxGeometry(0.64, 0.05, 0.6), palette.saddle);
  blanket.position.set(0, 1.52, 0.02);
  body.add(blanket);
  const saddle = mesh(new THREE.BoxGeometry(0.4, 0.1, 0.44), palette.bayDark);
  saddle.position.set(0, 1.58, 0.02);
  body.add(saddle);

  // Neck and head.
  const neck = at(new THREE.Group(), 0, 1.36, 0.64);
  neck.rotation.x = NECK_REST;
  body.add(neck);
  const neckGeo = new THREE.CylinderGeometry(0.15, 0.27, 0.78, 7);
  neckGeo.translate(0, 0.34, 0);
  const neckMesh = mesh(neckGeo, palette.bay);
  neckMesh.scale.set(0.8, 1, 1.15);
  neck.add(neckMesh);
  const mane = mesh(new THREE.BoxGeometry(0.07, 0.74, 0.12), palette.bayDark);
  mane.position.set(0, 0.38, -0.17);
  mane.rotation.x = -0.12;
  neck.add(mane);

  const head = at(new THREE.Group(), 0, 0.72, 0.02);
  head.rotation.x = HEAD_REST;
  neck.add(head);
  const skullGeo = new THREE.CylinderGeometry(0.1, 0.17, 0.5, 6);
  skullGeo.translate(0, 0.2, 0.0);
  const skull = mesh(skullGeo, palette.bay);
  skull.scale.set(0.8, 1, 1.2);
  head.add(skull);
  const muzzle = mesh(new THREE.IcosahedronGeometry(0.11, 0), palette.bayDark);
  muzzle.scale.set(0.85, 0.8, 1.05);
  muzzle.position.set(0, 0.44, 0.02);
  head.add(muzzle);
  const forelock = mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), palette.bayDark);
  forelock.position.set(0, -0.02, -0.14);
  head.add(forelock);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.045, 0.15, 4), palette.bay);
    ear.position.set(s * 0.07, -0.05, -0.16);
    ear.rotation.set(-1.25, 0, s * 0.3);
    head.add(ear);
    const eye = mesh(new THREE.IcosahedronGeometry(0.026, 0), palette.hoof);
    eye.position.set(s * 0.115, 0.06, 0.03);
    head.add(eye);
  }

  // Tail.
  const tail = at(new THREE.Group(), 0, 1.38, -0.82);
  tail.rotation.x = -0.5;
  body.add(tail);
  const tailGeo = new THREE.ConeGeometry(0.12, 0.85, 6);
  tailGeo.rotateX(Math.PI);
  tailGeo.translate(0, -0.42, 0);
  tail.add(mesh(tailGeo, palette.bayDark));

  // Legs stay attached to the root so the hooves keep contact while the body bobs.
  const legs = [
    buildLeg(-0.17, 1.06, 0.5, true, -1),
    buildLeg(0.17, 1.06, 0.5, true, 1),
    buildLeg(-0.18, 1.08, -0.52, false, -1),
    buildLeg(0.18, 1.08, -0.52, false, 1),
  ];
  for (const l of legs) root.add(l.hip);

  const rider = buildRider();
  rider.root.position.set(0, 1.64, -0.02);
  body.add(rider.root);

  return { root, body, legs, neck, head, tail, rider };
}
