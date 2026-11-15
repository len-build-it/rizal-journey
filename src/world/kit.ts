import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { injectWorldShader } from './paperShader';

const materialCache = new Map<string, THREE.MeshStandardMaterial>();
const tmpColor = new THREE.Color();

/** Shared flat-shaded material per color, so the toy look stays consistent and draw calls stay low. */
export function mat(
  color: number,
  opts: { roughness?: number; metalness?: number; emissive?: number; vertexColors?: boolean } = {},
): THREE.MeshStandardMaterial {
  const key = `${color}-${opts.roughness ?? 0.85}-${opts.metalness ?? 0}-${opts.emissive ?? 0}-${opts.vertexColors ? 1 : 0}`;
  let m = materialCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.85,
      metalness: opts.metalness ?? 0,
      flatShading: true,
      vertexColors: opts.vertexColors ?? false,
    });
    if (opts.emissive) {
      m.emissive = new THREE.Color(opts.emissive);
      m.emissiveIntensity = 1;
    }
    injectWorldShader(m);
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

/** Prepares a geometry part with linear vertex colors for merging. */
export function paintPart(
  geo: THREE.BufferGeometry,
  color: number,
  p?: Placement,
): THREE.BufferGeometry {
  const raw = geo.index ? geo.toNonIndexed() : geo;
  const g = p ? place(raw, p) : raw;
  for (const name of Object.keys(g.attributes)) {
    if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  }
  const pos = g.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  tmpColor.setHex(color);
  for (let i = 0; i < pos.count; i++) {
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

/**
 * Collects static geometry by material properties with vertex colors and merges into minimal draw calls.
 */
export class StaticBatch {
  private readonly groups = new Map<string, THREE.BufferGeometry[]>();
  private readonly options = new Map<string, Parameters<typeof mat>[1]>();
  private readonly anchors: { x: number; y: number; z: number; enabled: number }[] = [];

  withAnchor<T>(x: number, y: number, z: number, fn: () => T, enabled = 1): T {
    this.anchors.push({ x, y, z, enabled });
    try {
      return fn();
    } finally {
      this.anchors.pop();
    }
  }

  add(
    color: number,
    geo: THREE.BufferGeometry,
    p: Placement = {},
    opts?: Parameters<typeof mat>[1],
  ): void {
    const key = `${opts?.roughness ?? 0.85}-${opts?.metalness ?? 0}-${opts?.emissive ?? 0}`;
    const g = paintPart(geo, color, p);
    const anchor = this.anchors[this.anchors.length - 1];
    const pos = g.getAttribute('position');
    const attr = new Float32Array(pos.count * 4);
    if (anchor) {
      for (let i = 0; i < pos.count; i++) {
        attr[i * 4] = anchor.x;
        attr[i * 4 + 1] = anchor.y;
        attr[i * 4 + 2] = anchor.z;
        attr[i * 4 + 3] = anchor.enabled;
      }
    }
    g.setAttribute('aPopupAnchor', new THREE.BufferAttribute(attr, 4));
    const list = this.groups.get(key) ?? [];
    list.push(g);
    this.groups.set(key, list);
    if (opts && !this.options.has(key)) this.options.set(key, opts);
  }

  /** Adds a geometry already transformed by an Object3D matrix (used for composed parts). */
  addTransformed(color: number, geo: THREE.BufferGeometry, matrix: THREE.Matrix4): void {
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(matrix);
    this.add(color, g);
  }

  build(name: string, castShadow = true, receiveShadow = true): THREE.Group {
    const group = new THREE.Group();
    group.name = name;
    for (const [key, geos] of this.groups) {
      const merged = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      if (!merged) continue;
      merged.computeVertexNormals();
      const opts = { ...this.options.get(key), vertexColors: true };
      const mesh = new THREE.Mesh(merged, mat(0xffffff, opts));
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
    }
    this.groups.clear();
    this.options.clear();
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
