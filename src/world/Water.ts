import * as THREE from 'three';
import { palette } from './palette';

/**
 * Low-poly sea: a coarse grid whose vertices bob on a few overlapping waves.
 * Flat shading turns the moving triangles into glints, which reads well at toy scale.
 */
export class Water {
  readonly mesh: THREE.Mesh;
  private readonly base: Float32Array;
  private readonly geo: THREE.BufferGeometry;
  private readonly amplitude: number;

  constructor(
    width: number,
    depth: number,
    cell: number,
    center: THREE.Vector3,
    amplitude = 1,
  ) {
    this.amplitude = amplitude;
    const plane = new THREE.PlaneGeometry(
      width,
      depth,
      Math.round(width / cell),
      Math.round(depth / cell),
    );
    plane.rotateX(-Math.PI / 2);
    // Jitter the grid so the facets do not look like a regular checkerboard.
    const pos = plane.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + Math.sin(i * 12.9898) * 0.5 * cell * 0.35);
      pos.setZ(i, pos.getZ(i) + Math.sin(i * 78.233) * 0.5 * cell * 0.35);
    }
    this.geo = plane.toNonIndexed();
    this.base = (
      this.geo.attributes.position as THREE.BufferAttribute
    ).array.slice() as Float32Array;

    // Shallower color near the quay, deeper further out.
    const colors = new Float32Array(this.base.length);
    const deep = new THREE.Color(palette.seaDeep);
    const shallow = new THREE.Color(palette.seaShallow);
    const c = new THREE.Color();
    for (let i = 0; i < this.base.length; i += 3) {
      const z = this.base[i + 2]! + depth / 2;
      c.copy(shallow).lerp(deep, Math.min(1, z / (depth * 0.45)));
      colors[i] = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }
    this.geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.mesh = new THREE.Mesh(
      this.geo,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        roughness: 0.35,
        metalness: 0.1,
      }),
    );
    this.mesh.position.copy(center);
    this.mesh.receiveShadow = true;
  }

  update(time: number): void {
    const arr = (this.geo.attributes.position as THREE.BufferAttribute).array as Float32Array;
    const b = this.base;
    for (let i = 0; i < arr.length; i += 3) {
      const x = b[i]!;
      const z = b[i + 2]!;
      arr[i + 1] =
        (Math.sin(x * 0.35 + time * 1.1) * 0.12 +
          Math.sin(z * 0.42 - time * 0.9) * 0.1 +
          Math.sin((x + z) * 0.8 + time * 1.7) * 0.04) *
        this.amplitude;
    }
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.geo.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
