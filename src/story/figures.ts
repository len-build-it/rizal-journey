import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mat, paintPart } from '../world/kit';
import { palette } from '../world/palette';

export type CoatStyle = 'frock' | 'work' | 'smock' | 'dress' | 'waistcoat';
export type HatStyle =
  | 'top'
  | 'bowler'
  | 'small'
  | 'flatcap'
  | 'bonnet'
  | 'kepi'
  | 'cornette'
  | 'none';
export type PersonAction =
  | 'idle'
  | 'walk'
  | 'stroll'
  | 'hurry'
  | 'carry'
  | 'chat'
  | 'sit'
  | 'lean'
  | 'sweep'
  | 'fish'
  | 'mendNet'
  | 'readNewspaper'
  | 'lookUp'
  | 'stepAside'
  | 'gesture'
  | 'paint'
  | 'wave'
  | 'hold'
  | 'pull';
export type PersonRole =
  | 'dockWorker'
  | 'fisherman'
  | 'marketWoman'
  | 'gentleman'
  | 'lady'
  | 'child'
  | 'nurse'
  | 'coachman'
  | 'gendarme'
  | 'vendor';
export type PersonProp =
  | 'sack'
  | 'crate'
  | 'basketArm'
  | 'basketHead'
  | 'cane'
  | 'parasol'
  | 'umbrella'
  | 'hoop'
  | 'broom'
  | 'fishingRod'
  | 'newspaper'
  | 'net';

export interface PersonOptions {
  coat?: CoatStyle;
  hat?: HatStyle;
  skirt?: boolean;
  smock?: boolean;
  baby?: boolean;
  eyeBandage?: boolean;
  bag?: boolean;
  apron?: boolean;
  shawl?: boolean;
  bustle?: boolean;
  rolledTrousers?: boolean;
  prop?: PersonProp;
  scale?: number;
  coatColor?: number;
  skirtColor?: number;
  trouserColor?: number;
  armColor?: number;
  apronColor?: number;
  shawlColor?: number;
  hatColor?: number;
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

function isDescendantOf(obj: THREE.Object3D, ancestor: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur === ancestor) return true;
    cur = cur.parent;
  }
  return false;
}

/** Returns the shader part tag (1..5, or 0 for torso/body) for a mesh inside a PersonRig. */
export function personPartId(obj: THREE.Object3D, rig: PersonRig): number {
  if (isDescendantOf(obj, rig.legL)) return 1;
  if (isDescendantOf(obj, rig.legR)) return 2;
  if (isDescendantOf(obj, rig.armL)) return 3;
  if (isDescendantOf(obj, rig.armR)) return 4;
  if (isDescendantOf(obj, rig.head)) return 5;
  return 0;
}

/** Returns the rig group whose origin is the rotation pivot for a mesh inside a PersonRig. */
export function personPivotGroup(obj: THREE.Object3D, rig: PersonRig): THREE.Object3D {
  if (isDescendantOf(obj, rig.legL)) return rig.legL;
  if (isDescendantOf(obj, rig.legR)) return rig.legR;
  if (isDescendantOf(obj, rig.armL)) return rig.armL;
  if (isDescendantOf(obj, rig.armR)) return rig.armR;
  if (isDescendantOf(obj, rig.head)) return rig.head;
  return rig.hips;
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
  arm: number;
  skirt: number;
  trouser: number;
  apron: number;
  shawl: number;
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
    else if (style === 'waistcoat') coat = palette.doorBrown;
  }
  const defaultHat =
    style === 'work' || style === 'waistcoat'
      ? palette.doorBrown
      : opts.hat === 'kepi'
        ? palette.night
        : opts.hat === 'cornette'
          ? palette.shirt
          : palette.hat;
  return {
    coat,
    arm: opts.armColor ?? (style === 'waistcoat' ? palette.shirt : coat),
    skirt: opts.skirtColor ?? (isDress ? palette.railSteel : coat),
    trouser: opts.trouserColor ?? (style === 'work' || style === 'waistcoat' ? palette.coat : palette.lampIron),
    apron: opts.apronColor ?? palette.shirt,
    shawl: opts.shawlColor ?? palette.awningRed,
    hat: opts.hatColor ?? defaultHat,
    hair: opts.hairColor ?? palette.hair,
    isDress,
  };
}

/** Returns varied 1880s French archetype options for background life and vignettes. */
export function rolePreset(role: PersonRole, winter = false, seedOffset = 0): PersonOptions {
  const pick = <T>(arr: readonly T[]): T => arr[Math.abs(seedOffset) % arr.length]!;
  switch (role) {
    case 'dockWorker':
      return {
        coat: 'waistcoat',
        hat: 'flatcap',
        coatColor: pick([palette.crateDark, palette.doorBrown, palette.coat]),
        trouserColor: pick([palette.coat, palette.lampIron, palette.hull]),
        prop: seedOffset % 2 === 0 ? 'sack' : 'crate',
      };
    case 'fisherman':
      return {
        coat: 'smock',
        hat: 'flatcap',
        rolledTrousers: true,
        coatColor: pick([palette.shutterBlue, palette.iron, palette.crate]),
        trouserColor: palette.coat,
        hatColor: palette.crateDark,
      };
    case 'marketWoman':
      return {
        coat: 'dress',
        skirt: true,
        apron: true,
        shawl: true,
        hat: 'bonnet',
        coatColor: pick([palette.shutterGreen, palette.doorBrown, palette.shutterBlue]),
        skirtColor: pick([palette.railSteel, palette.coat, palette.crateDark]),
        shawlColor: pick([palette.awningRed, palette.awningOchre, palette.roofTile]),
        prop: seedOffset % 3 === 0 ? 'basketHead' : 'basketArm',
      };
    case 'gentleman':
      return {
        coat: 'frock',
        hat: seedOffset % 2 === 0 ? 'top' : 'bowler',
        coatColor: pick([palette.coat, palette.night, palette.hull]),
        prop: seedOffset % 3 === 0 ? 'newspaper' : 'cane',
      };
    case 'lady':
      return {
        coat: 'dress',
        skirt: true,
        bustle: true,
        hat: 'small',
        coatColor: pick([palette.shutterBlue, palette.awningRed, palette.shutterGreen, palette.coat]),
        skirtColor: pick([palette.railSteel, palette.night, palette.shutterBlue, palette.doorBrown]),
        prop: winter ? 'umbrella' : 'parasol',
      };
    case 'child':
      return {
        coat: 'smock',
        hat: seedOffset % 2 === 0 ? 'flatcap' : 'bonnet',
        scale: 0.72,
        coatColor: pick([palette.shutterBlue, palette.ochre, palette.shutterGreen]),
        hatColor: pick([palette.crateDark, palette.shirt]),
        prop: seedOffset % 2 === 0 ? 'hoop' : undefined,
      };
    case 'nurse':
      return {
        coat: 'dress',
        skirt: true,
        apron: true,
        hat: 'cornette',
        coatColor: palette.night,
        skirtColor: palette.night,
        apronColor: palette.shirt,
        hatColor: palette.shirt,
      };
    case 'coachman':
      return {
        coat: 'frock',
        hat: 'top',
        coatColor: palette.coat,
        trouserColor: palette.hull,
        hatColor: palette.hat,
      };
    case 'gendarme':
      return {
        coat: 'frock',
        hat: 'kepi',
        coatColor: palette.night,
        trouserColor: palette.night,
        hatColor: palette.night,
      };
    case 'vendor':
      return {
        coat: 'work',
        apron: true,
        hat: 'flatcap',
        coatColor: pick([palette.crateDark, palette.shutterBlue, palette.doorBrown]),
        apronColor: palette.awningCream,
      };
  }
}

/**
 * Builds an articulated low-poly 1880s person about Rizal's size (~1.68u tall).
 * Uses merged vertex-colored meshes per joint group so each actor costs at most 6 draw calls.
 */
export function buildPerson(opts: PersonOptions = {}): PersonRig {
  const colors = resolveColors(opts);
  const hatStyle: HatStyle = opts.hat ?? (colors.isDress ? 'small' : 'bowler');

  const root = new THREE.Group();
  if (opts.scale && opts.scale !== 1) root.scale.setScalar(opts.scale);
  const hips = new THREE.Group();
  hips.position.y = 0.76;
  root.add(hips);

  const torso = new THREE.Group();
  hips.add(torso);

  // Torso, coat tails or long skirt, collar, optional apron/shawl/bustle/bundle.
  const bodyParts: THREE.BufferGeometry[] = [
    paintPart(new THREE.CylinderGeometry(0.145, 0.175, 0.56, 7), colors.coat, { y: 0.28 }),
    paintPart(new THREE.CylinderGeometry(0.075, 0.095, 0.07, 6), palette.shirt, { y: 0.57 }),
  ];
  if (colors.isDress) {
    bodyParts.push(
      paintPart(new THREE.CylinderGeometry(0.16, 0.34, 0.72, 8), colors.skirt, { y: -0.34 }),
    );
    if (opts.bustle) {
      bodyParts.push(
        paintPart(new THREE.IcosahedronGeometry(0.17, 0), colors.skirt, {
          y: -0.1,
          z: -0.17,
          sx: 1.05,
          sy: 0.95,
          sz: 1.15,
        }),
      );
    }
  } else if (opts.smock || (opts.coat ?? 'frock') === 'frock') {
    bodyParts.push(
      paintPart(new THREE.CylinderGeometry(0.175, 0.22, 0.22, 7), colors.coat, { y: -0.09 }),
    );
  }
  if (opts.apron) {
    bodyParts.push(
      paintPart(new THREE.BoxGeometry(0.24, 0.62, 0.06), colors.apron, {
        y: colors.isDress ? -0.02 : 0.05,
        z: 0.17,
      }),
    );
  }
  if (opts.shawl) {
    bodyParts.push(
      paintPart(new THREE.CylinderGeometry(0.17, 0.23, 0.22, 7), colors.shawl, { y: 0.44 }),
    );
  }
  if (opts.prop === 'sack') {
    bodyParts.push(
      paintPart(new THREE.CapsuleGeometry(0.14, 0.28, 3, 6), palette.crate, {
        x: 0.18,
        y: 0.56,
        z: -0.02,
        rx: 1.32,
        rz: -0.25,
      }),
    );
  } else if (opts.prop === 'crate') {
    bodyParts.push(
      paintPart(new THREE.BoxGeometry(0.32, 0.24, 0.26), palette.crateDark, {
        x: 0.2,
        y: 0.56,
        z: 0.02,
        rz: -0.14,
      }),
    );
  } else if (opts.prop === 'net') {
    bodyParts.push(
      paintPart(new THREE.IcosahedronGeometry(0.18, 0), palette.sail, {
        x: 0.0,
        y: 0.02,
        z: 0.34,
        sx: 1.3,
        sy: 0.45,
        sz: 1.0,
      }),
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
  } else if (hatStyle === 'flatcap') {
    headParts.push(
      paintPart(new THREE.CylinderGeometry(0.135, 0.135, 0.055, 8), colors.hat, {
        y: 0.095,
        z: 0.015,
        rx: 0.06,
      }),
      paintPart(new THREE.BoxGeometry(0.14, 0.016, 0.11), colors.hat, {
        y: 0.072,
        z: 0.12,
      }),
    );
  } else if (hatStyle === 'bonnet') {
    headParts.push(
      paintPart(new THREE.CylinderGeometry(0.145, 0.155, 0.13, 8, 1, false, -0.7, Math.PI + 1.4), colors.hat, {
        y: 0.05,
        z: -0.02,
        rx: -0.25,
      }),
    );
  } else if (hatStyle === 'kepi') {
    headParts.push(
      paintPart(new THREE.CylinderGeometry(0.115, 0.128, 0.1, 8), colors.hat, {
        y: 0.11,
        z: 0.01,
        rx: 0.08,
      }),
      paintPart(new THREE.BoxGeometry(0.13, 0.016, 0.1), palette.hat, {
        y: 0.068,
        z: 0.115,
      }),
    );
  } else if (hatStyle === 'cornette') {
    headParts.push(
      paintPart(new THREE.BoxGeometry(0.28, 0.18, 0.24), palette.shirt, {
        y: 0.08,
        z: -0.04,
      }),
      paintPart(new THREE.BoxGeometry(0.46, 0.12, 0.08), palette.shirt, {
        y: 0.14,
        z: 0.02,
        rx: 0.22,
      }),
    );
  }
  if (opts.prop === 'basketHead') {
    headParts.push(
      paintPart(new THREE.CylinderGeometry(0.19, 0.13, 0.16, 8), palette.crate, { y: 0.22 }),
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

  // Left & right arms with optional carried props.
  const buildArm = (side: -1 | 1): THREE.Group => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.185, 0.5, 0);
    const parts: THREE.BufferGeometry[] = [
      paintPart(new THREE.CylinderGeometry(0.055, 0.044, 0.48, 6), colors.arm, { y: -0.24 }),
      paintPart(new THREE.IcosahedronGeometry(0.043, 0), palette.skin, { y: -0.5 }),
    ];
    if (side === 1) {
      if (opts.bag) {
        parts.push(
          paintPart(new THREE.BoxGeometry(0.13, 0.24, 0.34), palette.crateDark, {
            x: 0.06,
            y: -0.62,
            z: 0.02,
          }),
        );
      } else if (opts.prop === 'cane') {
        parts.push(
          paintPart(new THREE.CylinderGeometry(0.015, 0.012, 0.78, 5), palette.doorBrown, {
            y: -0.82,
            z: 0.04,
          }),
        );
      } else if (opts.prop === 'parasol' || opts.prop === 'umbrella') {
        const isUmbrella = opts.prop === 'umbrella';
        parts.push(
          paintPart(new THREE.CylinderGeometry(0.014, 0.014, 0.75, 5), palette.doorBrown, {
            y: isUmbrella ? -0.18 : 0.12,
            z: 0.06,
            rx: isUmbrella ? 0.35 : 0.1,
          }),
          paintPart(
            new THREE.ConeGeometry(isUmbrella ? 0.44 : 0.42, 0.2, 8),
            isUmbrella ? palette.coat : palette.awningCream,
            {
              y: isUmbrella ? 0.14 : 0.48,
              z: isUmbrella ? 0.18 : 0.09,
              rx: isUmbrella ? 0.35 : 0.1,
            },
          ),
        );
      } else if (opts.prop === 'basketArm') {
        parts.push(
          paintPart(new THREE.CylinderGeometry(0.14, 0.11, 0.16, 7), palette.crate, {
            x: 0.06,
            y: -0.56,
            z: 0.05,
          }),
        );
      } else if (opts.prop === 'hoop') {
        parts.push(
          paintPart(new THREE.TorusGeometry(0.24, 0.018, 5, 14), palette.doorBrown, {
            x: 0.08,
            y: -0.7,
            z: 0.24,
            ry: Math.PI / 2,
          }),
        );
      } else if (opts.prop === 'broom') {
        parts.push(
          paintPart(new THREE.CylinderGeometry(0.016, 0.016, 1.05, 5), palette.doorBrown, {
            y: -0.45,
            z: 0.16,
            rx: 0.35,
          }),
          paintPart(new THREE.BoxGeometry(0.18, 0.16, 0.08), palette.crate, {
            y: -0.92,
            z: 0.32,
            rx: 0.35,
          }),
        );
      } else if (opts.prop === 'fishingRod') {
        parts.push(
          paintPart(new THREE.CylinderGeometry(0.008, 0.02, 1.8, 5), palette.doorBrown, {
            y: -0.3,
            z: 0.85,
            rx: 1.25,
          }),
        );
      } else if (opts.prop === 'newspaper') {
        parts.push(
          paintPart(new THREE.BoxGeometry(0.28, 0.22, 0.02), palette.shirt, {
            x: -0.1,
            y: -0.48,
            z: 0.18,
            rx: -0.65,
          }),
        );
      }
    }
    arm.add(mergedMesh(parts, side < 0 ? 'person-armL' : 'person-armR'));
    torso.add(arm);
    return arm;
  };
  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Left & right legs (shorter shoes only if wearing long skirt; rolled calves if fisherman).
  const buildLeg = (side: -1 | 1): THREE.Group => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.085, 0, 0);
    const parts: THREE.BufferGeometry[] = colors.isDress
      ? [paintPart(new THREE.BoxGeometry(0.095, 0.09, 0.2), palette.hat, { y: -0.71, z: 0.04 })]
      : opts.rolledTrousers
        ? [
            paintPart(new THREE.CylinderGeometry(0.072, 0.064, 0.46, 6), colors.trouser, { y: -0.23 }),
            paintPart(new THREE.CylinderGeometry(0.052, 0.046, 0.24, 6), palette.skin, { y: -0.57 }),
            paintPart(new THREE.BoxGeometry(0.095, 0.085, 0.2), palette.hat, { y: -0.71, z: 0.035 }),
          ]
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

/** Base hip-to-sole leg length at scale 1. */
export const PERSON_LEG_LENGTH = 0.76;

/** Angular frequency (rad/s) for a gait with stride = 1.6 * legLength so planted feet do not slide. */
export function strideOmega(speed: number, legLength: number): number {
  const stride = Math.max(0.05, 1.6 * legLength);
  return (2 * Math.PI * Math.max(0, speed)) / stride;
}

/** Stance-flattened swing angle (radians) matching stride = 1.6 * legLength with <= 4 cm foot slide. */
export function walkSwingAngle(phase: number): number {
  return (Math.sin(phase) - 0.125 * Math.sin(3 * phase) + 0.025 * Math.sin(5 * phase)) * 0.338;
}

/** Wraps a PersonRig with smooth procedural actions for scene timelines. */
export class PersonActor {
  readonly rig: PersonRig;
  action: PersonAction = 'idle';
  private walkTarget: THREE.Vector3 | null = null;
  private walkSpeed = 1.65;
  private phaseOffset = Math.random() * Math.PI * 2;
  private walkPhase = this.phaseOffset;

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
      case 'walk':
      case 'stroll':
      case 'hurry': {
        const speed = this.walkTarget
          ? this.walkSpeed
          : this.action === 'hurry'
            ? 1.85
            : this.action === 'stroll'
              ? 0.9
              : 1.22;
        const legLen = PERSON_LEG_LENGTH * (this.rig.root.scale.y || 1);
        const omega = strideOmega(speed, legLen);
        this.walkPhase += omega * dt;
        const swing = walkSwingAngle(this.walkPhase);
        legL.rotation.x = swing;
        legR.rotation.x = -swing;
        armL.rotation.x = -swing * 0.72;
        armR.rotation.x = swing * 0.72;
        hips.position.y = 0.76 + Math.abs(Math.sin(this.walkPhase)) * 0.03;
        break;
      }
      case 'carry': {
        const speed = this.walkTarget ? this.walkSpeed : 1.15;
        const legLen = PERSON_LEG_LENGTH * (this.rig.root.scale.y || 1);
        this.walkPhase += strideOmega(speed, legLen) * dt;
        const swing = walkSwingAngle(this.walkPhase);
        legL.rotation.x = swing;
        legR.rotation.x = -swing;
        armL.rotation.x = -0.35;
        armR.rotation.set(-0.95, 0, -0.35);
        torso.rotation.z = 0.06;
        hips.position.y = 0.75 + Math.abs(Math.sin(this.walkPhase)) * 0.02;
        break;
      }
      case 'chat': {
        torso.rotation.y = Math.sin(t * 1.4) * 0.07;
        armR.rotation.set(-0.8 + Math.sin(t * 3.4) * 0.22, 0, 0.24);
        armL.rotation.set(-0.35 + Math.cos(t * 2.1) * 0.1, 0, -0.12);
        head.rotation.y = Math.sin(t * 1.6) * 0.14;
        head.rotation.x = Math.sin(t * 2.4) * 0.06;
        break;
      }
      case 'lean': {
        torso.rotation.x = -0.14;
        armL.rotation.set(-0.25, 0, -0.2);
        armR.rotation.set(-0.25, 0, 0.2);
        head.rotation.y = Math.sin(t * 0.7) * 0.18;
        break;
      }
      case 'sweep': {
        const s = Math.sin(t * 3.6);
        torso.rotation.x = 0.18;
        torso.rotation.y = s * 0.24;
        armR.rotation.set(-0.7 + s * 0.25, 0, 0.15);
        armL.rotation.set(-0.65 - s * 0.18, 0, -0.15);
        break;
      }
      case 'fish': {
        torso.rotation.x = 0.06;
        armR.rotation.set(-0.72 + Math.sin(t * 1.8) * 0.05, 0, 0.1);
        head.rotation.x = 0.12;
        break;
      }
      case 'mendNet': {
        hips.position.y = 0.44;
        legL.rotation.x = -1.42;
        legR.rotation.x = -1.42;
        torso.rotation.x = 0.22;
        armL.rotation.set(-0.95 + Math.sin(t * 4.5) * 0.16, 0, -0.22);
        armR.rotation.set(-0.95 - Math.sin(t * 4.5) * 0.16, 0, 0.22);
        head.rotation.x = 0.3;
        break;
      }
      case 'readNewspaper': {
        torso.rotation.x = 0.04;
        armL.rotation.set(-1.15, 0.25, -0.18);
        armR.rotation.set(-1.15, -0.25, 0.18);
        head.rotation.x = 0.28 + Math.sin(t * 1.1) * 0.04;
        break;
      }
      case 'lookUp': {
        torso.rotation.x = -0.12;
        head.rotation.x = -0.52 + Math.sin(t * 0.9) * 0.05;
        head.rotation.y = Math.sin(t * 0.6) * 0.14;
        break;
      }
      case 'stepAside': {
        hips.position.y = 0.78;
        torso.rotation.x = -0.05;
        armL.rotation.set(-0.3, 0, -0.28);
        armR.rotation.set(-0.3, 0, 0.28);
        head.rotation.y = Math.sin(t * 2.0) * 0.2;
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
