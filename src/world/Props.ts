import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type RAPIER from '@dimforge/rapier3d-compat';
import { mat, paintPart, type Placement } from './kit';
import { palette } from './palette';
import type { PhysicsCtx } from './physics';

interface ColoredPart {
  geo: THREE.BufferGeometry;
  color: number;
  p?: Placement;
}

interface PropInstance {
  body: RAPIER.RigidBody;
  scale: number;
  bucket: PropBucket;
  index: number;
}

interface PropBucket {
  geo: THREE.BufferGeometry;
  mesh: THREE.InstancedMesh;
  capacity: number;
  items: PropInstance[];
}

const TMP_POS = new THREE.Vector3();
const TMP_QUAT = new THREE.Quaternion();
const TMP_SCALE = new THREE.Vector3();
const TMP_MAT = new THREE.Matrix4();

function mergeColoredParts(parts: ColoredPart[]): THREE.BufferGeometry {
  const geos = parts.map((part) => paintPart(part.geo, part.color, part.p));
  const merged = mergeGeometries(geos, false);
  for (const g of geos) g.dispose();
  if (!merged) throw new Error('Failed to merge prop geometry parts');
  return merged;
}

function buildCrateGeo(): THREE.BufferGeometry {
  const parts: ColoredPart[] = [{ geo: new THREE.BoxGeometry(1, 1, 1), color: palette.crate }];
  for (const yy of [-0.3, 0.3]) {
    parts.push({
      geo: new THREE.BoxGeometry(1.02, 0.14, 1.02),
      color: palette.crateDark,
      p: { y: yy },
    });
  }
  return mergeColoredParts(parts);
}

function buildBarrelGeo(): THREE.BufferGeometry {
  const r = 0.36;
  const h = 0.95;
  const parts: ColoredPart[] = [
    { geo: new THREE.CylinderGeometry(r * 0.88, r * 0.88, h, 9), color: palette.barrel },
    { geo: new THREE.CylinderGeometry(r, r, h * 0.5, 9), color: palette.barrel },
  ];
  for (const yy of [-0.36, 0.36]) {
    parts.push({
      geo: new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.05, 9),
      color: palette.barrelHoop,
      p: { y: yy * h },
    });
  }
  return mergeColoredParts(parts);
}

function buildCafeTableGeo(): THREE.BufferGeometry {
  return mergeColoredParts([
    { geo: new THREE.CylinderGeometry(0.42, 0.42, 0.05, 10), color: palette.cafeTable, p: { y: 0.37 } },
    { geo: new THREE.CylinderGeometry(0.04, 0.05, 0.72, 5), color: palette.lampIron },
    { geo: new THREE.CylinderGeometry(0.22, 0.24, 0.04, 8), color: palette.lampIron, p: { y: -0.36 } },
  ]);
}

function buildChairGeo(): THREE.BufferGeometry {
  const parts: ColoredPart[] = [
    { geo: new THREE.BoxGeometry(0.42, 0.05, 0.42), color: palette.cafeTable },
    { geo: new THREE.BoxGeometry(0.42, 0.45, 0.04), color: palette.cafeTable, p: { y: 0.24, z: -0.2 } },
  ];
  for (const [lx, lz] of [
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ] as const) {
    parts.push({
      geo: new THREE.BoxGeometry(0.04, 0.44, 0.04),
      color: palette.lampIron,
      p: { x: lx, y: -0.22, z: lz },
    });
  }
  return mergeColoredParts(parts);
}

function buildFlowerCartGeo(): THREE.BufferGeometry {
  const parts: ColoredPart[] = [
    { geo: new THREE.BoxGeometry(1.5, 0.35, 0.9), color: palette.crate, p: { y: 0.22 } },
  ];
  for (const s of [-1, 1]) {
    parts.push({
      geo: new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10),
      color: palette.doorBrown,
      p: { x: 0.1, y: -0.05, z: s * 0.5, rx: Math.PI / 2 },
    });
  }
  const flowerColors = [palette.iron, palette.gaslight, palette.awningCream, palette.shutterBlue];
  for (let i = 0; i < 4; i++) {
    parts.push({
      geo: new THREE.IcosahedronGeometry(0.24, 0),
      color: flowerColors[i % flowerColors.length]!,
      p: { x: -0.45 + i * 0.3, y: 0.5, z: (i % 2 === 0 ? -1 : 1) * 0.18 },
    });
  }
  return mergeColoredParts(parts);
}

function buildBeachChairGeo(stripe: number): THREE.BufferGeometry {
  return mergeColoredParts([
    { geo: new THREE.BoxGeometry(0.65, 0.06, 1.15), color: palette.crate, p: { y: 0.12 } },
    { geo: new THREE.BoxGeometry(0.6, 0.05, 0.72), color: stripe, p: { y: 0.35, z: -0.22, rx: 0.55 } },
    { geo: new THREE.BoxGeometry(0.58, 0.04, 0.52), color: palette.awningCream, p: { y: 0.16, z: 0.25 } },
  ]);
}

/**
 * Loose props the horse can knock over: crates, barrels, cafe chairs.
 * Each prop type shares one InstancedMesh with vertex colors so draw calls stay low,
 * while each prop keeps its own dynamic Rapier body.
 */
export class Props {
  private readonly items: PropInstance[] = [];
  private readonly buckets = new Map<string, PropBucket>();
  private readonly material = mat(0xffffff, { vertexColors: true });

  constructor(
    private readonly ctx: PhysicsCtx,
    private readonly scene: THREE.Scene,
  ) {}

  crate(x: number, z: number, size = 0.8, ry = 0, y = size / 2): void {
    this.add(
      'crate',
      buildCrateGeo,
      x,
      y,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(size / 2, size / 2, size / 2),
      0.6,
      0,
      size,
    );
  }

  barrel(x: number, z: number, ry = 0, upright = true, baseY = 0): void {
    const r = 0.36;
    const h = 0.95;
    const desc = this.ctx.rapier.ColliderDesc.cylinder(h / 2, r);
    if (upright) this.add('barrel', buildBarrelGeo, x, baseY + h / 2, z, ry, desc, 0.9);
    else this.add('barrel', buildBarrelGeo, x, baseY + r, z, ry, desc, 0.9, Math.PI / 2);
  }

  cafeTable(x: number, z: number): void {
    this.add(
      'cafeTable',
      buildCafeTableGeo,
      x,
      0.38,
      z,
      0,
      this.ctx.rapier.ColliderDesc.cylinder(0.38, 0.42),
      0.35,
    );
    for (let i = 0; i < 2; i++) {
      const a = i * Math.PI + 0.4;
      this.chair(x + Math.sin(a) * 0.85, z + Math.cos(a) * 0.85, a + Math.PI);
    }
  }

  chair(x: number, z: number, ry: number): void {
    this.add(
      'chair',
      buildChairGeo,
      x,
      0.45,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(0.21, 0.45, 0.21).setTranslation(0, 0, 0),
      0.25,
    );
  }

  flowerCart(x: number, z: number, ry = 0): void {
    this.add(
      'flowerCart',
      buildFlowerCartGeo,
      x,
      0.38,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(0.75, 0.38, 0.52),
      0.8,
    );
  }

  beachChair(x: number, z: number, ry = 0, stripe: number = palette.awningRed, baseY = 0): void {
    this.add(
      `beachChair-${stripe}`,
      () => buildBeachChairGeo(stripe),
      x,
      baseY + 0.22,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(0.35, 0.22, 0.6),
      0.3,
    );
  }

  private getBucket(key: string, makeGeo: () => THREE.BufferGeometry): PropBucket {
    const existing = this.buckets.get(key);
    if (existing) {
      if (existing.items.length < existing.capacity) return existing;
      const newCap = existing.capacity * 2;
      const next = this.createInstancedMesh(existing.geo, newCap);
      next.count = existing.items.length;
      for (let i = 0; i < existing.items.length; i++) {
        existing.mesh.getMatrixAt(i, TMP_MAT);
        next.setMatrixAt(i, TMP_MAT);
      }
      next.instanceMatrix.needsUpdate = true;
      existing.mesh.removeFromParent();
      existing.mesh.dispose();
      this.scene.add(next);
      existing.mesh = next;
      existing.capacity = newCap;
      return existing;
    }

    const geo = makeGeo();
    const capacity = 16;
    const mesh = this.createInstancedMesh(geo, capacity);
    mesh.count = 0;
    this.scene.add(mesh);
    const bucket: PropBucket = { geo, mesh, capacity, items: [] };
    this.buckets.set(key, bucket);
    return bucket;
  }

  private createInstancedMesh(geo: THREE.BufferGeometry, capacity: number): THREE.InstancedMesh {
    const m = new THREE.InstancedMesh(geo, this.material, capacity);
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    return m;
  }

  private add(
    key: string,
    makeGeo: () => THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    ry: number,
    desc: RAPIER.ColliderDesc,
    mass: number,
    rx = 0,
    scale = 1,
  ): void {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0));
    const body = this.ctx.world.createRigidBody(
      this.ctx.rapier.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        .setLinearDamping(0.4)
        .setAngularDamping(0.6)
        .setCanSleep(true),
    );
    this.ctx.world.createCollider(desc.setMass(mass).setFriction(0.8).setRestitution(0.15), body);
    body.sleep();
    this.ctx.bodies?.push(body);

    const bucket = this.getBucket(key, makeGeo);
    const index = bucket.items.length;
    const entry: PropInstance = { body, scale, bucket, index };
    bucket.items.push(entry);
    bucket.mesh.count = bucket.items.length;
    this.items.push(entry);
    this.syncInstance(entry);
    bucket.mesh.instanceMatrix.needsUpdate = true;
  }

  update(): void {
    const dirty = new Set<PropBucket>();
    for (const item of this.items) {
      if (item.body.isSleeping()) continue;
      this.syncInstance(item);
      dirty.add(item.bucket);
    }
    for (const bucket of dirty) {
      bucket.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const bucket of this.buckets.values()) {
      bucket.mesh.removeFromParent();
      bucket.mesh.dispose();
      bucket.geo.dispose();
    }
    this.buckets.clear();
    this.items.length = 0;
    this.material.dispose();
  }

  private syncInstance(item: PropInstance): void {
    const t = item.body.translation();
    const r = item.body.rotation();
    TMP_POS.set(t.x, t.y, t.z);
    TMP_QUAT.set(r.x, r.y, r.z, r.w);
    TMP_SCALE.setScalar(item.scale);
    TMP_MAT.compose(TMP_POS, TMP_QUAT, TMP_SCALE);
    item.bucket.mesh.setMatrixAt(item.index, TMP_MAT);
  }
}
