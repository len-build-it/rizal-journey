import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { palette } from './palette';
import type { Story } from '../content/stories';

function cityAndYearOf(story: Story): { city: string; year: string } {
  if (story.area === 'paris') return { city: 'Paris', year: story.era ?? '' };
  if (story.area === 'biarritz-1891') return { city: 'Biarritz', year: '1891' };
  return { city: 'Marseille', year: story.area === 'marseille-1882' ? '1882' : '1891' };
}

function buildPostmarkTexture(city: string, year: string, visited: boolean): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const ink = visited ? '#6a665f' : '#b93b2a';
  const paper = visited ? '#dcd7cd' : '#f4efe4';

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  ctx.strokeStyle = ink;
  ctx.lineWidth = visited ? 7 : 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 121, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 104, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(46, 148);
  ctx.lineTo(210, 148);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw the city curved along the upper arc, matching the brochure postmark.
  ctx.font = '600 32px Fraunces, Georgia, serif';
  const arcR = 66;
  const arcCy = 134;
  const stepAngle = Math.min(0.24, 1.55 / Math.max(city.length - 1, 1));
  const totalAngle = stepAngle * Math.max(city.length - 1, 0);
  for (let i = 0; i < city.length; i++) {
    const a = -Math.PI / 2 - totalAngle / 2 + i * stepAngle;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * arcR, arcCy + Math.sin(a) * arcR);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(city[i]!, 0, 0);
    ctx.restore();
  }

  ctx.font = '700 44px Fraunces, Georgia, serif';
  ctx.fillText(year, cx, 192);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

let sharedBeamAlpha: THREE.CanvasTexture | null = null;
function getBeamAlphaMap(): THREE.CanvasTexture | null {
  if (sharedBeamAlpha) return sharedBeamAlpha;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0.0, '#000000');
  grad.addColorStop(0.22, '#888888');
  grad.addColorStop(0.65, '#cccccc');
  grad.addColorStop(1.0, '#ffffff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 64);
  sharedBeamAlpha = new THREE.CanvasTexture(canvas);
  sharedBeamAlpha.needsUpdate = true;
  return sharedBeamAlpha;
}

function buildMedallionGeometry(radius: number, thickness = 0.06): THREE.BufferGeometry {
  const front = new THREE.CircleGeometry(radius, 36);
  front.translate(0, 0, thickness * 0.5);
  const back = new THREE.CircleGeometry(radius, 36);
  back.rotateY(Math.PI);
  back.translate(0, 0, -thickness * 0.5);
  const merged = mergeGeometries([front, back], false);
  front.dispose();
  back.dispose();
  return merged ?? new THREE.CircleGeometry(radius, 36);
}

/**
 * A story stop in the world: a lit ring on the ground with a floating paper postmark.
 * It brightens as the rider approaches and turns to a smaller grey stamp once visited.
 */
export class StopMarker {
  readonly group = new THREE.Group();
  readonly radius = 2.6;
  visited = false;

  private readonly ring: THREE.Mesh;
  private readonly postmark: THREE.Mesh;
  private readonly beam: THREE.Mesh;
  private readonly ringMat: THREE.MeshBasicMaterial;
  private readonly beamMat: THREE.MeshBasicMaterial;
  private readonly postmarkMat: THREE.MeshBasicMaterial;
  private readonly discMat: THREE.MeshBasicMaterial;
  private readonly freshTex: THREE.CanvasTexture | null;
  private readonly stampedTex: THREE.CanvasTexture | null;
  private appliedVisited = false;
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

    // A thin Prussian-ink outer edge keeps the vermilion ring readable on pale stone.
    const edge = new THREE.Mesh(
      new THREE.RingGeometry(this.radius, this.radius + 0.11, 48, 1),
      new THREE.MeshBasicMaterial({ color: palette.ink, transparent: true, opacity: 0.85 }),
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = 0.1;
    this.group.add(edge);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: palette.vermilion,
      transparent: true,
      opacity: 0.9,
      fog: false,
    });
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(this.radius - 0.3, this.radius, 48, 1),
      this.ringMat,
    );
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.11;
    this.group.add(this.ring);
    this.discMat = new THREE.MeshBasicMaterial({
      color: palette.vermilion,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(this.radius - 0.3, 48), this.discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.09;
    this.group.add(disc);

    const beamAlpha = getBeamAlphaMap();
    this.beamMat = new THREE.MeshBasicMaterial({
      color: palette.vermilion,
      transparent: true,
      opacity: 0.24,
      alphaMap: beamAlpha,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    });
    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.36, 5.7, 16, 1, true),
      this.beamMat,
    );
    this.beam.position.y = 2.85;
    this.group.add(this.beam);

    const { city, year } = cityAndYearOf(story);
    this.freshTex = buildPostmarkTexture(city, year, false);
    this.stampedTex = buildPostmarkTexture(city, year, true);
    this.postmarkMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: this.freshTex,
      transparent: false,
      fog: false,
    });
    this.postmark = new THREE.Mesh(buildMedallionGeometry(1.15), this.postmarkMat);
    this.postmark.position.y = 6.0;
    this.group.add(this.postmark);
  }

  /** Returns true while the rider stands inside the ring. */
  update(dt: number, time: number, rider: THREE.Vector3): boolean {
    const dx = rider.x - this.position.x;
    const dz = rider.z - this.position.z;
    const d = Math.hypot(dx, dz);
    const inside = d < this.radius;
    this.proximity = THREE.MathUtils.damp(this.proximity, inside ? 1 : 0, 6, dt);

    if (this.visited !== this.appliedVisited) {
      this.appliedVisited = this.visited;
      this.postmarkMat.map = this.visited ? this.stampedTex : this.freshTex;
      this.postmarkMat.needsUpdate = true;
      this.ringMat.color.setHex(this.visited ? palette.roofSlate : palette.vermilion);
      this.discMat.color.setHex(this.visited ? palette.roofSlate : palette.vermilion);
      this.beamMat.color.setHex(this.visited ? palette.roofSlate : palette.vermilion);
    }

    const base = this.visited ? 0.32 : 1;
    const markScale = this.visited ? 0.56 : 1 + this.proximity * 0.08;
    this.postmark.scale.setScalar(markScale);
    this.postmark.rotation.y = time * (this.visited ? 0.35 : 0.75);
    this.postmark.position.y =
      (this.visited ? 5.2 : 6.0) +
      Math.sin(time * 1.9) * (this.visited ? 0.08 : 0.18) +
      this.proximity * 0.25;

    this.ringMat.opacity = this.visited ? 0.48 : 0.78 + this.proximity * 0.22;
    this.discMat.opacity = (0.14 + this.proximity * 0.2) * base;
    this.beamMat.opacity = this.visited ? 0.04 : 0.22 + this.proximity * 0.16;
    const pulse = 1 + Math.sin(time * 3) * 0.03 * (1 - this.proximity);
    this.ring.scale.setScalar(pulse);
    return inside;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.freshTex?.dispose();
    this.stampedTex?.dispose();
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
