import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/** Shared flat-shaded material per color, so the toy look stays consistent and draw calls stay low. */
export function mat(
  color: number,
  opts: { roughness?: number; metalness?: number; emissive?: number } = {},
): THREE.MeshStandardMaterial {
  const key = `${color}-${opts.roughness ?? 0.85}-${opts.metalness ?? 0}-${opts.emissive ?? 0}`;
  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0,
      flatShading: true,
    });
    if (opts.emissive) {
      m.emissive = new THREE.Color(opts.emissive);
      m.emissiveIntensity = 1;
    }
    materialCache.set(key, m);
  }
  return m;
}

export interface Placement {
  x?: number;
  y?: number;
  z?: number;
  rx?: number;
  ry?: number;
  rz?: number;
  sx?: number;
  sy?: number;
  sz?: number;
}

export function place<T extends THREE.BufferGeometry>(geo: T, p: Placement = {}): T {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(p.x ?? 0, p.y ?? 0, p.z ?? 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rx ?? 0, p.ry ?? 0, p.rz ?? 0)),
    new THREE.Vector3(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1),
  );
  geo.applyMatrix4(m);
  return geo;
}

/**
 * Collects static geometry by color and merges it into one mesh per color.
 * A whole area ends up as a few dozen draw calls, which keeps mid-range phones smooth.
 */
export class StaticBatch {
  private readonly groups = new Map<number, THREE.BufferGeometry[]>();
  private readonly options = new Map<number, Parameters<typeof mat>[1]>();

  add(
    color: number,
    geo: THREE.BufferGeometry,
    p: Placement = {},
    opts?: Parameters<typeof mat>[1],
  ): void {
    const g = place(geo.index ? geo.toNonIndexed() : geo, p);
    // Strip attributes that differ between primitive types so merging always succeeds.
    for (const name of Object.keys(g.attributes)) {
      if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    }
    const list = this.groups.get(color) ?? [];
    list.push(g);
    this.groups.set(color, list);
    if (opts) this.options.set(color, opts);
  }

  /** Adds a geometry already transformed by an Object3D matrix (used for composed parts). */
  addTransformed(color: number, geo: THREE.BufferGeometry, matrix: THREE.Matrix4): void {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(matrix);
    this.add(color, g);
  }

  build(name: string, castShadow = true, receiveShadow = true): THREE.Group {
    const group = new THREE.Group();
    group.name = name;
    for (const [color, geos] of this.groups) {
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      merged.computeVertexNormals();
      const mesh = new THREE.Mesh(merged, mat(color, this.options.get(color)));
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
    }
    this.groups.clear();
    return group;
  }
}

/** Removes an Object3D from its parent and disposes its geometries (cached materials are kept). */
export function disposeObject(obj: THREE.Object3D): void {
  obj.removeFromParent();
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) child.geometry.dispose();
  });
}

/** Small deterministic random generator so the world looks the same on every visit. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
