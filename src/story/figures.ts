import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mat, paintPart } from '../world/kit';
import { palette } from '../world/palette';

export type CoatStyle = 'frock' | 'work' | 'smock' | 'dress';
export type HatStyle = 'top' | 'bowler' | 'small' | 'none';
export type PersonAction = 'idle' | 'walk' | 'gesture' | 'sit' | 'paint' | 'wave' | 'hold' | 'pull';

export interface PersonOptions {
  coat?: CoatStyle;
  hat?: HatStyle;
  skirt?: boolean;
  smock?: boolean;
  baby?: boolean;
  eyeBandage?: boolean;
  bag?: boolean;
  coatColor?: number;
  skirtColor?: number;
  trouserColor?: number;
  hairColor?: number;
}

export interface PersonRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  dispose(): void;
}

function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return new THREE.BufferGeometry();
  merged.computeVertexNormals();
  return merged;
}

function mergedMesh(parts: THREE.BufferGeometry[], name: string): THREE.Mesh {
  const m = new THREE.Mesh(mergeParts(parts), mat(0xffffff, { vertexColors: true }));
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}

function resolveColors(opts: PersonOptions): {
  coat: number;
  skirt: number;
  trouser: number;
  hat: number;
  hair: number;
  isDress: boolean;
} {
  const style: CoatStyle = opts.smock ? 'smock' : (opts.coat ?? 'frock');
  const isDress = opts.skirt || style === 'dress';
  let coat = opts.coatColor ?? palette.coat;
  if (!opts.coatColor) {
    if (style === 'work') coat = palette.crateDark;
    else if (style === 'smock') coat = palette.basqueWhite;
    else if (style === 'dress') coat = palette.shutterBlue;
  }
  return {
    coat,
    skirt: opts.skirtColor ?? (isDress ? palette.railSteel : coat),
    trouser: opts.trouserColor ?? (style === 'work' ? palette.coat : palette.lampIron),
    hat: style === 'work' ? palette.doorBrown : palette.hat,
    hair: opts.hairColor ?? palette.hair,
    isDress,
  };
}

/**
 * Builds an articulated low-poly 1880s person about Rizal's size (~1.68u tall).
 * Uses merged vertex-colored meshes per joint group so each actor costs at most 6 draw calls.
 */
export function buildPerson(opts: PersonOptions = {}): PersonRig {
  const colors = resolveColors(opts);
  const hatStyle: HatStyle = opts.hat ?? (colors.isDress ? 'small' : 'bowler');

  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.76;
  root.add(hips);

  const torso = new THREE.Group();
  hips.add(torso);

  // Torso, coat tails or long skirt, collar, and optional baby bundle.
  const bodyParts: THREE.BufferGeometry[] = [
    paintPart(new THREE.CylinderGeometry(0.145, 0.175, 0.56, 7), colors.coat, { y: 0.28 }),
    paintPart(new THREE.CylinderGeometry(0.075, 0.095, 0.07, 6), palette.shirt, { y: 0.57 }),
  ];
  if (colors.isDress) {
    bodyParts.push(
      paintPart(new THREE.CylinderGeometry(0.16, 0.34, 0.72, 8), colors.skirt, { y: -0.34 }),
    );
  } else if (opts.smock || (opts.coat ?? 'frock') === 'frock') {
    bodyParts.push(
      paintPart(new THREE.CylinderGeometry(0.175, 0.22, 0.22, 7), colors.coat, { y: -0.09 }),
    );
  }
  if (opts.baby) {
    bodyParts.push(
      paintPart(new THREE.CapsuleGeometry(0.09, 0.16, 3, 6), palette.shirt, {
        x: 0.02,
        y: 0.33,
        z: 0.18,
        rz: 1.15,
      }),
      paintPart(new THREE.IcosahedronGeometry(0.065, 1), palette.skin, {
        x: -0.09,
        y: 0.38,
        z: 0.19,
      }),
    );
  }
  torso.add(mergedMesh(bodyParts, 'person-body'));

  // Head + hair + hat + optional eye bandage.
  const head = new THREE.Group();
  head.position.set(0, 0.68, 0);
  torso.add(head);
  const headParts: THREE.BufferGeometry[] = [
    paintPart(new THREE.IcosahedronGeometry(0.125, 1), palette.skin),
    paintPart(
      new THREE.SphereGeometry(0.132, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.52),
      colors.hair,
      { y: 0.015, z: -0.012 },
    ),
  ];
  if (hatStyle === 'bowler') {
    headParts.push(
      paintPart(new THREE.SphereGeometry(0.13, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), colors.hat, {
        y: 0.055,
        sy: 1.05,
      }),
      paintPart(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 10), colors.hat, { y: 0.065 }),
    );
  } else if (hatStyle === 'top') {
    headParts.push(
      paintPart(new THREE.CylinderGeometry(0.125, 0.115, 0.23, 8), colors.hat, { y: 0.18 }),
      paintPart(new THREE.CylinderGeometry(0.195, 0.195, 0.02, 10), colors.hat, { y: 0.07 }),
    );
  } else if (hatStyle === 'small') {
    headParts.push(
      paintPart(new THREE.CylinderGeometry(0.1, 0.12, 0.09, 8), palette.awningOchre, {
        y: 0.11,
        rx: -0.1,
      }),
      paintPart(new THREE.CylinderGeometry(0.17, 0.17, 0.018, 9), palette.awningOchre, {
        y: 0.075,
        rx: -0.1,
      }),
    );
  }
  if (opts.eyeBandage) {
    headParts.push(
      paintPart(new THREE.BoxGeometry(0.18, 0.055, 0.16), palette.shirt, {
        x: 0.03,
        y: 0.02,
        z: 0.055,
        rz: 0.14,
      }),
    );
  }
  head.add(mergedMesh(headParts, 'person-head'));

  // Left & right arms.
  const buildArm = (side: -1 | 1, withBag: boolean): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.185, 0.5, 0);
    const parts: THREE.BufferGeometry[] = [
      paintPart(new THREE.CylinderGeometry(0.055, 0.044, 0.48, 6), colors.coat, { y: -0.24 }),
      paintPart(new THREE.IcosahedronGeometry(0.043, 0), palette.skin, { y: -0.5 }),
    ];
    if (withBag) {
      parts.push(
        paintPart(new THREE.BoxGeometry(0.13, 0.24, 0.34), palette.crateDark, {
          x: side * 0.06,
          y: -0.62,
          z: 0.02,
        }),
      );
    }
    arm.add(mergedMesh(parts, side < 0 ? 'person-armL' : 'person-armR'));
    torso.add(arm);
    return arm;
  };
  const armL = buildArm(-1, false);
  const armR = buildArm(1, Boolean(opts.bag));

  // Left & right legs (shorter shoes only if wearing long skirt).
  const buildLeg = (side: -1 | 1): THREE.Group => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.085, 0, 0);
    const parts: THREE.BufferGeometry[] = colors.isDress
      ? [paintPart(new THREE.BoxGeometry(0.095, 0.09, 0.2), palette.hat, { y: -0.71, z: 0.04 })]
      : [
          paintPart(new THREE.CylinderGeometry(0.072, 0.056, 0.7, 6), colors.trouser, { y: -0.35 }),
          paintPart(new THREE.BoxGeometry(0.095, 0.085, 0.2), palette.hat, { y: -0.71, z: 0.035 }),
        ];
    leg.add(mergedMesh(parts, side < 0 ? 'person-legL' : 'person-legR'));
    hips.add(leg);
    return leg;
  };
  const legL = buildLeg(-1);
  const legR = buildLeg(1);

  return {
    root,
    hips,
    torso,
    head,
    armL,
    armR,
    legL,
    legR,
    dispose() {
      root.removeFromParent();
      root.traverse((c) => {
        if (c instanceof THREE.Mesh) c.geometry.dispose();
      });
    },
  };
}

/** Wraps a PersonRig with smooth procedural actions for scene timelines. */
export class PersonActor {
  readonly rig: PersonRig;
  action: PersonAction = 'idle';
  private walkTarget: THREE.Vector3 | null = null;
  private walkSpeed = 1.65;
  private phaseOffset = Math.random() * Math.PI * 2;

  constructor(opts: PersonOptions, x = 0, y = 0, z = 0, ry = 0) {
    this.rig = buildPerson(opts);
    this.rig.root.position.set(x, y, z);
    this.rig.root.rotation.y = ry;
  }

  get root(): THREE.Group {
    return this.rig.root;
  }

  setPose(x: number, y: number, z: number, ry: number, action: PersonAction = 'idle'): void {
    this.rig.root.position.set(x, y, z);
    this.rig.root.rotation.y = ry;
    this.walkTarget = null;
    this.action = action;
  }

  walkTo(target: THREE.Vector3, speed = 1.65): void {
    this.walkTarget = target.clone();
    this.walkSpeed = speed;
    this.action = 'walk';
  }

  setAction(action: PersonAction): void {
    if (action !== 'walk') this.walkTarget = null;
    this.action = action;
  }

  update(dt: number, time: number): boolean {
    const { hips, torso, head, armL, armR, legL, legR } = this.rig;
    let arrived = false;

    if (this.action === 'walk' && this.walkTarget) {
      const dx = this.walkTarget.x - this.rig.root.position.x;
      const dz = this.walkTarget.z - this.rig.root.position.z;
      const dist = Math.hypot(dx, dz);
      const step = this.walkSpeed * dt;
      if (dist <= Math.max(0.05, step)) {
        this.rig.root.position.x = this.walkTarget.x;
        this.rig.root.position.z = this.walkTarget.z;
        this.walkTarget = null;
        this.action = 'idle';
        arrived = true;
      } else {
        this.rig.root.position.x += (dx / dist) * step;
        this.rig.root.position.z += (dz / dist) * step;
        const desiredYaw = Math.atan2(dx, dz);
        const diff = Math.atan2(
          Math.sin(desiredYaw - this.rig.root.rotation.y),
          Math.cos(desiredYaw - this.rig.root.rotation.y),
        );
        this.rig.root.rotation.y += diff * Math.min(1, dt * 8);
      }
    }

    const t = time + this.phaseOffset;
    // Defaults before pose logic.
    hips.position.y = 0.76;
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    armL.rotation.set(0, 0, -0.06);
    armR.rotation.set(0, 0, 0.06);
    legL.rotation.set(0, 0, 0);
    legR.rotation.set(0, 0, 0);

    switch (this.action) {
      case 'idle': {
        torso.rotation.x = Math.sin(t * 1.6) * 0.02;
        head.rotation.y = Math.sin(t * 0.85) * 0.1;
        break;
      }
      case 'walk': {
        const s = t * 6.4;
        const swing = Math.sin(s) * 0.45;
        legL.rotation.x = swing;
        legR.rotation.x = -swing;
        armL.rotation.x = -swing * 0.7;
        armR.rotation.x = swing * 0.7;
        hips.position.y = 0.76 + Math.abs(Math.cos(s)) * 0.03;
        break;
      }
      case 'gesture': {
        torso.rotation.y = Math.sin(t * 1.4) * 0.05;
        armR.rotation.set(-0.95 + Math.sin(t * 3.1) * 0.18, 0, 0.28);
        head.rotation.y = Math.sin(t * 1.2) * 0.08;
        break;
      }
      case 'sit': {
        hips.position.y = 0.44;
        legL.rotation.x = -1.42;
        legR.rotation.x = -1.42;
        torso.rotation.x = 0.08 + Math.sin(t * 1.5) * 0.02;
        armL.rotation.x = -0.55;
        armR.rotation.x = -0.55;
        break;
      }
      case 'paint': {
        torso.rotation.x = 0.08;
        armR.rotation.set(-1.35 + Math.sin(t * 4.2) * 0.16, 0, Math.sin(t * 2.5) * 0.12);
        armL.rotation.set(-0.45, 0, -0.2);
        break;
      }
      case 'wave': {
        armR.rotation.set(-0.2, 0, 2.38 + Math.sin(t * 7.2) * 0.25);
        head.rotation.x = -0.08;
        break;
      }
      case 'hold': {
        armL.rotation.set(-0.98, 0.25, -0.35);
        armR.rotation.set(-0.98, -0.25, 0.35);
        torso.rotation.x = Math.sin(t * 2.1) * 0.025;
        break;
      }
      case 'pull': {
        const s = t * 4.5;
        armL.rotation.set(-2.05 + Math.sin(s) * 0.45, 0, -0.15);
        armR.rotation.set(-2.05 - Math.sin(s) * 0.45, 0, 0.15);
        torso.rotation.x = -0.12 + Math.sin(s * 2) * 0.05;
        break;
      }
    }

    return arrived;
  }
}

export interface CrowdSpec {
  x: number;
  y: number;
  z: number;
  ry: number;
  variant?: number;
}

/**
 * Instanced 1880s background crowd (up to 40+ figures across 3 draw calls total).
 * Variants mix dark frock coats, blue work jackets, and ladies' dresses/skirts.
 */
export function buildCrowd(specs: CrowdSpec[]): {
  group: THREE.Group;
  update(time: number): void;
  dispose(): void;
} {
  const group = new THREE.Group();
  group.name = 'crowd';

  const variantDefs: PersonOptions[] = [
    { coat: 'frock', hat: 'top', coatColor: palette.coat },
    { coat: 'work', hat: 'bowler', coatColor: palette.shutterBlue },
    { coat: 'dress', hat: 'small', skirt: true, coatColor: palette.awningRed, skirtColor: palette.coat },
  ];

  const byVariant = variantDefs.map((): CrowdSpec[] => []);
  specs.forEach((s, i) => {
    const idx = (s.variant ?? i) % variantDefs.length;
    byVariant[idx]?.push(s);
  });

  const meshes: THREE.InstancedMesh[] = [];
  const dummy = new THREE.Object3D();

  byVariant.forEach((list, vi) => {
    if (list.length === 0) return;
    const sample = buildPerson(variantDefs[vi]);
    sample.root.updateMatrixWorld(true);
    const bakedParts: THREE.BufferGeometry[] = [];
    sample.root.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        const cloned = c.geometry.clone();
        cloned.applyMatrix4(c.matrixWorld);
        bakedParts.push(cloned);
      }
    });
    sample.dispose();

    const inst = new THREE.InstancedMesh(
      mergeParts(bakedParts),
      mat(0xffffff, { vertexColors: true }),
      list.length,
    );
    inst.castShadow = true;
    inst.receiveShadow = false;
    list.forEach((s, idx) => {
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(0, s.ry, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(idx, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
    meshes.push(inst);
  });

  return {
    group,
    update(time: number) {
      group.position.y = Math.sin(time * 2.2) * 0.015;
    },
    dispose() {
      group.removeFromParent();
      for (const m of meshes) m.geometry.dispose();
    },
  };
}
