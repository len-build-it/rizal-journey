import * as THREE from 'three';
import { mat } from './kit';
import { palette } from './palette';
import { staticBox, type PhysicsCtx } from './physics';

interface BeamRecord {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  scale: THREE.Vector3;
  order: number;
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Procedural Venetian-red Eiffel Tower built from thin iron beams in a single InstancedMesh.
 * Proportions: 46 units tall, ~42% base width, platforms at 19%, 38% and 92%.
 *
 * Keyframe mapping (fact F09):
 *   0.00 : Jan 28, 1887 (only the four stone piers)
 *   0.05 : July 1, 1887 (iron legs start to rise)
 *   0.30 : Spring 1888 (legs joined at the first platform)
 *   0.55 : Aug 14, 1888 (second platform complete)
 *   1.00 : Mar 31, 1889 (summit complete)
 */
export class EiffelTower {
  static readonly HEIGHT = 46;
  readonly group = new THREE.Group();
  private readonly beams: BeamRecord[] = [];
  private readonly mesh: THREE.InstancedMesh;
  private readonly pierMesh: THREE.Mesh;
  private readonly dummy = new THREE.Matrix4();
  private readonly zero = new THREE.Matrix4().makeScale(0, 0, 0);
  private readonly tmpScale = new THREE.Vector3();
  private progress = 1;

  constructor(center: THREE.Vector3, ctx?: PhysicsCtx) {
    this.group.position.copy(center);
    this.group.name = 'eiffel-tower';

    const H = EiffelTower.HEIGHT;
    this.pierMesh = this.buildPiers(center, H, ctx);
    this.group.add(this.pierMesh);

    this.buildStructure(H);

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const material = mat(palette.iron, { roughness: 0.72, metalness: 0.15 });
    this.mesh = new THREE.InstancedMesh(geo, material, this.beams.length);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);

    this.setProgress(1);
  }

  setProgress(p: number): void {
    this.progress = THREE.MathUtils.clamp(p, 0, 1);
    for (let i = 0; i < this.beams.length; i++) {
      const b = this.beams[i]!;
      const start = b.order - 0.025;
      if (this.progress <= 0 || this.progress < start) {
        this.mesh.setMatrixAt(i, this.zero);
        continue;
      }
      const k = Math.min(1, (this.progress - start) / 0.03);
      this.tmpScale.copy(b.scale).multiplyScalar(k);
      this.dummy.compose(b.pos, b.quat, this.tmpScale);
      this.mesh.setMatrixAt(i, this.dummy);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  getProgress(): number {
    return this.progress;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.mesh.geometry.dispose();
    this.pierMesh.geometry.dispose();
  }

  private addBeam(a: THREE.Vector3, b: THREE.Vector3, thickness: number, order: number): void {
    const dir = b.clone().sub(a);
    const len = dir.length();
    if (len < 1e-4) return;
    const pos = a.clone().add(b).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize());
    this.beams.push({
      pos,
      quat,
      scale: new THREE.Vector3(thickness, len, thickness),
      order,
    });
  }

  private buildPiers(center: THREE.Vector3, H: number, ctx?: PhysicsCtx): THREE.Mesh {
    const pierSpread = H * 0.168; // outer span ~42% of height
    const pierW = 3.5;
    const pierH = 1.05;
    const geos: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const px = sx * pierSpread;
        const pz = sz * pierSpread;
        const g = new THREE.BoxGeometry(pierW, pierH, pierW);
        g.translate(px, pierH / 2, pz);
        geos.push(g);
        if (ctx) staticBox(ctx, center.x + px, pierH / 2, center.z + pz, pierW, pierH, pierW);
      }
    }
    // Combine the four piers into one geometry with a single draw call.
    const merged = mergeSimple(geos);
    for (const g of geos) g.dispose();
    const m = new THREE.Mesh(merged, mat(palette.quayStoneDark));
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  private buildStructure(H: number): void {
    const legCenter = (t: number): number => {
      if (t <= 0.19) return THREE.MathUtils.lerp(H * 0.168, H * 0.105, t / 0.19);
      return THREE.MathUtils.lerp(H * 0.105, H * 0.052, (t - 0.19) / 0.19);
    };
    const legHalf = (t: number): number => {
      if (t <= 0.19) return THREE.MathUtils.lerp(1.55, 0.98, t / 0.19);
      return THREE.MathUtils.lerp(0.98, 0.68, (t - 0.19) / 0.19);
    };
    const legCorners = (sx: number, sz: number, t: number): THREE.Vector3[] => {
      const c = legCenter(t);
      const r = legHalf(t);
      const y = Math.max(0.95, t * H);
      return [
        new THREE.Vector3(sx * c - r, y, sz * c - r),
        new THREE.Vector3(sx * c + r, y, sz * c - r),
        new THREE.Vector3(sx * c + r, y, sz * c + r),
        new THREE.Vector3(sx * c - r, y, sz * c + r),
      ];
    };

    // Build the four curved legs in two stages: base->1st (order 0.01..0.29), 1st->2nd (0.30..0.54).
    const buildLegStage = (
      tStart: number,
      tEnd: number,
      tiers: number,
      orderStart: number,
      orderEnd: number,
    ): void => {
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          for (let i = 0; i < tiers; i++) {
            const t0 = THREE.MathUtils.lerp(tStart, tEnd, i / tiers);
            const t1 = THREE.MathUtils.lerp(tStart, tEnd, (i + 1) / tiers);
            const order = THREE.MathUtils.lerp(orderStart, orderEnd, (i + 1) / tiers);
            const c0 = legCorners(sx, sz, t0);
            const c1 = legCorners(sx, sz, t1);
            for (let k = 0; k < 4; k++) {
              const nk = (k + 1) % 4;
              this.addBeam(c0[k]!, c1[k]!, 0.24, order);
              this.addBeam(c1[k]!, c1[nk]!, 0.16, order);
              // Alternating diagonal lattice bracing on each face of the leg.
              if (i % 2 === 0) this.addBeam(c0[k]!, c1[nk]!, 0.13, order);
              else this.addBeam(c0[nk]!, c1[k]!, 0.13, order);
            }
          }
        }
      }
    };

    buildLegStage(0.02, 0.19, 5, 0.01, 0.28);
    buildLegStage(0.19, 0.38, 5, 0.31, 0.54);

    // Decorative arches spanning between legs just below the first platform.
    const y1 = 0.19 * H;
    const archSpan = H * 0.105;
    const archOffset = H * 0.11;
    const archSteps = 8;
    const buildArch = (axis: 'x' | 'z', sign: number): void => {
      let prev: THREE.Vector3 | null = null;
      for (let i = 0; i <= archSteps; i++) {
        const u = i / archSteps;
        const a = u * Math.PI;
        const along = -Math.cos(a) * (archSpan * 0.85);
        const height = y1 - 3.6 + Math.sin(a) * 3.1;
        const pt =
          axis === 'x'
            ? new THREE.Vector3(along, height, sign * archOffset)
            : new THREE.Vector3(sign * archOffset, height, along);
        if (prev) this.addBeam(prev, pt, 0.2, 0.285);
        if (i > 0 && i < archSteps && i % 2 === 0) {
          const topPt =
            axis === 'x'
              ? new THREE.Vector3(along, y1 - 0.3, sign * archOffset)
              : new THREE.Vector3(sign * archOffset, y1 - 0.3, along);
          this.addBeam(pt, topPt, 0.12, 0.29);
        }
        prev = pt;
      }
    };
    buildArch('x', 1);
    buildArch('x', -1);
    buildArch('z', 1);
    buildArch('z', -1);

    // First platform (19%, order 0.295..0.30).
    this.addPlatform(y1, H * 0.128, 0.95, 0.295);
    // Second platform (38%, order 0.545..0.55).
    const y2 = 0.38 * H;
    this.addPlatform(y2, H * 0.07, 0.75, 0.545);

    // Upper tapering shaft from 38% to 92% (order 0.55..0.93).
    const shaftTiers = 14;
    const shaftHalf = (u: number): number =>
      THREE.MathUtils.lerp(H * 0.058, 0.88, Math.pow(u, 0.75));
    const shaftCorners = (u: number): THREE.Vector3[] => {
      const r = shaftHalf(u);
      const y = THREE.MathUtils.lerp(0.38, 0.92, u) * H;
      return [
        new THREE.Vector3(-r, y, -r),
        new THREE.Vector3(r, y, -r),
        new THREE.Vector3(r, y, r),
        new THREE.Vector3(-r, y, r),
      ];
    };
    for (let i = 0; i < shaftTiers; i++) {
      const u0 = i / shaftTiers;
      const u1 = (i + 1) / shaftTiers;
      const order = THREE.MathUtils.lerp(0.56, 0.93, u1);
      const c0 = shaftCorners(u0);
      const c1 = shaftCorners(u1);
      for (let k = 0; k < 4; k++) {
        const nk = (k + 1) % 4;
        this.addBeam(c0[k]!, c1[k]!, 0.22, order);
        this.addBeam(c1[k]!, c1[nk]!, 0.14, order);
        this.addBeam(c0[k]!, c1[nk]!, 0.11, order);
        this.addBeam(c0[nk]!, c1[k]!, 0.11, order);
      }
    }

    // Top platform (92%, order 0.945).
    const y3 = 0.92 * H;
    this.addPlatform(y3, 1.38, 0.65, 0.945);

    // Lantern cupola and summit spire (92%..100%, order 0.96..1.00).
    const baseR = 0.75;
    const midY = 0.958 * H;
    const topY = H;
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const p0 = new THREE.Vector3(Math.cos(a) * baseR, y3 + 0.65, Math.sin(a) * baseR);
      const p1 = new THREE.Vector3(Math.cos(a) * 0.24, midY, Math.sin(a) * 0.24);
      this.addBeam(p0, p1, 0.16, 0.97);
    }
    this.addBeam(new THREE.Vector3(0, y3 + 0.65, 0), new THREE.Vector3(0, topY, 0), 0.18, 1.0);
  }

  private addPlatform(y: number, half: number, height: number, order: number): void {
    const corners = (yy: number): THREE.Vector3[] => [
      new THREE.Vector3(-half, yy, -half),
      new THREE.Vector3(half, yy, -half),
      new THREE.Vector3(half, yy, half),
      new THREE.Vector3(-half, yy, half),
    ];
    const bot = corners(y - height * 0.5);
    const top = corners(y + height * 0.5);
    for (let k = 0; k < 4; k++) {
      const nk = (k + 1) % 4;
      this.addBeam(bot[k]!, bot[nk]!, 0.24, order);
      this.addBeam(top[k]!, top[nk]!, 0.2, order);
      this.addBeam(bot[k]!, top[k]!, 0.18, order);
      // Mid-rail posts on each platform face.
      const midBot = bot[k]!.clone().lerp(bot[nk]!, 0.5);
      const midTop = top[k]!.clone().lerp(top[nk]!, 0.5);
      this.addBeam(midBot, midTop, 0.14, order);
    }
    // Cross deck struts.
    this.addBeam(bot[0]!, bot[2]!, 0.2, order);
    this.addBeam(bot[1]!, bot[3]!, 0.2, order);
  }
}

function mergeSimple(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const nonIdx = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of nonIdx) total += g.attributes.position!.count;
  const pos = new Float32Array(total * 3);
  const norm = new Float32Array(total * 3);
  let offset = 0;
  for (const g of nonIdx) {
    pos.set(g.attributes.position!.array as Float32Array, offset);
    norm.set(g.attributes.normal!.array as Float32Array, offset);
    offset += g.attributes.position!.count * 3;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  return out;
}
