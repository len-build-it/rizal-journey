import * as THREE from 'three';
import { palette } from './palette';
import type { Story } from '../content/stories';

/**
 * A story stop in the world: a lit ring on the ground with a floating marker.
 * It brightens as the rider approaches and dims once the story has been read.
 */
export class StopMarker {
  readonly group = new THREE.Group();
  readonly radius = 2.6;
  visited = false;

  private readonly ring: THREE.Mesh;
  private readonly gem: THREE.Mesh;
  private readonly beam: THREE.Mesh;
  private readonly ringMat: THREE.MeshBasicMaterial;
  private readonly beamMat: THREE.MeshBasicMaterial;
  private readonly gemMat: THREE.MeshStandardMaterial;
  private readonly discMat: THREE.MeshBasicMaterial;
  private proximity = 0;

  constructor(
    readonly story: Story,
    readonly position: THREE.Vector3,
    /** Optional point the camera should look at while the story is open. */
    readonly focus?: THREE.Vector3,
    /** Optional zoom multiplier when `focus` is set (default 1.9 desktop / 2.3 narrow). */
    readonly focusZoom?: number,
  ) {
    this.group.position.copy(position);

    // A dark outer edge keeps the gold ring readable on pale stone.
    const edge = new THREE.Mesh(
      new THREE.RingGeometry(this.radius, this.radius + 0.14, 48, 1),
      new THREE.MeshBasicMaterial({ color: palette.night, transparent: true, opacity: 0.7 }),
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.1;
    this.group.add(edge);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: palette.gaslight,
      transparent: true,
      opacity: 0.85,
    });
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(this.radius - 0.3, this.radius, 48, 1),
      this.ringMat,
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.11;
    this.group.add(this.ring);
    this.discMat = new THREE.MeshBasicMaterial({
      color: palette.gaslight,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(this.radius - 0.3, 48), this.discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.09;
    this.group.add(disc);

    this.beamMat = new THREE.MeshBasicMaterial({
      color: palette.gaslight,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamGeo = new THREE.CylinderGeometry(
      this.radius - 0.1,
      this.radius - 0.1,
      3,
      40,
      1,
      true,
    );
    beamGeo.translate(0, 1.5, 0);
    // Fade the beam out toward the top using vertex colors on an additive material.
    this.beam = new THREE.Mesh(beamGeo, this.beamMat);
    this.group.add(this.beam);

    this.gemMat = new THREE.MeshStandardMaterial({
      color: palette.gaslight,
      emissive: palette.gaslight,
      emissiveIntensity: 0.6,
      flatShading: true,
      roughness: 0.4,
    });
    this.gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), this.gemMat);
    this.gem.scale.y = 1.5;
    this.gem.position.y = 3.6;
    this.gem.castShadow = true;
    this.group.add(this.gem);
  }

  /** Returns true while the rider stands inside the ring. */
  update(dt: number, time: number, rider: THREE.Vector3): boolean {
    const dx = rider.x - this.position.x;
    const dz = rider.z - this.position.z;
    const d = Math.hypot(dx, dz);
    const inside = d < this.radius;
    this.proximity = THREE.MathUtils.damp(this.proximity, inside ? 1 : 0, 6, dt);

    const base = this.visited ? 0.35 : 1;
    this.gem.rotation.y = time * 1.2;
    this.gem.position.y = 3.6 + Math.sin(time * 2) * 0.18 + this.proximity * 0.4;
    this.gemMat.emissiveIntensity = (0.35 + this.proximity * 0.9) * base;
    this.ringMat.opacity = (0.7 + this.proximity * 0.3) * base;
    this.discMat.opacity = (0.14 + this.proximity * 0.2) * base;
    this.beamMat.opacity = (0.06 + this.proximity * 0.16) * base;
    const pulse = 1 + Math.sin(time * 3) * 0.03 * (1 - this.proximity);
    this.ring.scale.setScalar(pulse);
    return inside;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
