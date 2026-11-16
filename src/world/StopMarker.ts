import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildWaitingFigure, type WaitingFigure } from '../story/figures';
import type { Story } from '../content/stories';
import { palette } from './palette';
import { waitersForStory } from './stopWaiters';

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

function buildSignboardTexture(title: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const w = 512;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#f4efe4';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#20323a';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  ctx.fillStyle = '#b93b2a';
  ctx.fillRect(24, 22, w - 48, 4);
  ctx.fillRect(24, h - 26, w - 48, 4);

  ctx.fillStyle = '#20323a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = title.trim().split(/\s+/);
  let fontSize = 36;
  let lines: string[] = [title];
  for (; fontSize >= 24; fontSize -= 2) {
    ctx.font = `600 ${fontSize}px Fraunces, Georgia, serif`;
    if (ctx.measureText(title).width <= w - 68) {
      lines = [title];
      break;
    }
    let bestSplit = -1;
    let bestMax = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const maxW = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
      if (maxW < bestMax) {
        bestMax = maxW;
        bestSplit = i;
      }
    }
    if (bestSplit > 0 && bestMax <= w - 64) {
      lines = [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
      break;
    }
    if (fontSize === 24 && bestSplit > 0) {
      lines = [words.slice(0, bestSplit).join(' '), words.slice(bestSplit).join(' ')];
    }
  }

  ctx.font = `600 ${fontSize}px Fraunces, Georgia, serif`;
  if (lines.length === 1) {
    ctx.fillText(lines[0]!, w / 2, h / 2);
  } else {
    const gap = fontSize * 1.18;
    ctx.fillText(lines[0]!, w / 2, h / 2 - gap * 0.5);
    ctx.fillText(lines[1]!, w / 2, h / 2 + gap * 0.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function buildDoubleCardGeometry(w: number, h: number, yCenter: number): THREE.BufferGeometry {
  const front = new THREE.PlaneGeometry(w, h);
  front.translate(0, yCenter, 0.025);
  const back = new THREE.PlaneGeometry(w, h);
  back.rotateY(Math.PI);
  back.translate(0, yCenter, -0.025);
  const merged = mergeGeometries([front, back], false);
  front.dispose();
  back.dispose();
  return merged ?? new THREE.PlaneGeometry(w, h);
}

function lerpAngle(from: number, to: number, t: number): number {
  const diff = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + diff * t;
}

interface WaiterSlot {
  fig: WaitingFigure;
  localX: number;
  localZ: number;
  restYaw: number;
  waver: boolean;
}

/**
 * A story stop in the world: a lit ring on the ground with a floating paper postmark.
 * It brightens as the rider approaches and turns to a smaller grey stamp once visited.
 */
export class StopMarker {
  readonly group = new THREE.Group();
  readonly radius = 2.6;
  visited = false;
  private isNext = false;

  private readonly ring: THREE.Mesh;
  private readonly postmark: THREE.Mesh;
  private readonly beam: THREE.Mesh;
  private readonly ringMat: THREE.MeshBasicMaterial;
  private readonly beamMat: THREE.MeshBasicMaterial;
  private readonly postmarkMat: THREE.MeshBasicMaterial;
  private readonly discMat: THREE.MeshBasicMaterial;
  private readonly freshTex: THREE.CanvasTexture | null;
  private readonly stampedTex: THREE.CanvasTexture | null;
  private readonly signTex: THREE.CanvasTexture | null;
  private readonly signGroup = new THREE.Group();
  private readonly waitGroup = new THREE.Group();
  private readonly waiters: WaiterSlot[] = [];
  private appliedVisited = false;
  private proximity = 0;
  private signU = 0;
  private waveMix = 0;

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

    // Orient the ring signboard and waiting figures toward the focus/landmark side of the ring.
    let dirX = 0;
    let dirZ = -1;
    if (focus) {
      const fx = focus.x - position.x;
      const fz = focus.z - position.z;
      const fLen = Math.hypot(fx, fz);
      if (fLen > 0.2) {
        dirX = fx / fLen;
        dirZ = fz / fLen;
      }
    }
    const sideX = -dirZ;
    const sideZ = dirX;

    this.signTex = buildSignboardTexture(story.title);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.044, 1.35, 6),
      new THREE.MeshBasicMaterial({ color: palette.ink }),
    );
    post.position.y = 0.675;
    const signCard = new THREE.Mesh(
      buildDoubleCardGeometry(2.05, 0.78, 1.68),
      new THREE.MeshBasicMaterial({ color: 0xffffff, map: this.signTex, fog: false }),
    );
    this.signGroup.add(post, signCard);
    this.signGroup.position.set(dirX * 0.15 + sideX * 2.9, 0, dirZ * 0.15 + sideZ * 2.9);
    this.signGroup.visible = false;
    this.group.add(this.signGroup);

    const specs = waitersForStory(story.id);
    specs.forEach((spec, idx) => {
      const waver = idx === 0;
      const fig = buildWaitingFigure(spec, waver);
      const localX = dirX * (idx === 0 ? 1.15 : 1.5) - sideX * (idx === 0 ? 2.35 : 3.2);
      const localZ = dirZ * (idx === 0 ? 1.15 : 1.5) - sideZ * (idx === 0 ? 2.35 : 3.2);
      const restYaw = Math.atan2(-localX, -localZ);
      fig.root.position.set(localX, 0, localZ);
      fig.root.rotation.y = restYaw;
      this.waitGroup.add(fig.root);
      this.waiters.push({ fig, localX, localZ, restYaw, waver });
    });
    this.waitGroup.visible = false;
    this.group.add(this.waitGroup);
  }

  setNextTarget(next: boolean): void {
    this.isNext = next;
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

    const active = !this.visited && this.isNext;
    const base = this.visited ? 0.3 : active ? 1 : 0.48;
    const markScale = this.visited ? 0.52 : active ? 1.12 + this.proximity * 0.08 : 0.56;
    this.postmarkMat.color.setHex(!this.visited && !this.isNext ? 0xbcb6aa : 0xffffff);
    this.postmark.scale.setScalar(markScale);
    this.postmark.rotation.y = time * (this.visited ? 0.35 : active ? 0.75 : 0.4);
    this.postmark.position.y =
      (active ? 6.1 : 5.0) +
      Math.sin(time * 1.9) * (active ? 0.18 : 0.08) +
      this.proximity * 0.25;

    this.ringMat.opacity = this.visited ? 0.44 : active ? 0.88 + this.proximity * 0.12 : 0.46;
    this.discMat.opacity = (0.14 + this.proximity * 0.2) * base;
    this.beamMat.opacity = this.visited ? 0.04 : active ? 0.3 + this.proximity * 0.16 : 0.05;
    const pulse = 1 + Math.sin(time * 3) * 0.03 * (1 - this.proximity);
    this.ring.scale.setScalar(pulse);

    const lockedStation = Boolean(this.story.action) && !this.isNext;
    // Pop-up title signboard within ~14 m for unvisited (and unlocked) stops, using the world curve.
    const signTarget = !this.visited && !lockedStation && d < 14 ? 1 : 0;
    this.signU = THREE.MathUtils.damp(this.signU, signTarget, 7, dt);
    const rise = THREE.MathUtils.smoothstep(this.signU, 0, 0.72);
    const over = THREE.MathUtils.smoothstep(this.signU, 0.32, 1.0);
    const popScale = rise * (1 + 0.11 * Math.sin(over * Math.PI));
    this.signGroup.visible = !this.visited && !lockedStation && popScale > 0.01;
    if (this.signGroup.visible) {
      this.signGroup.scale.set(0.85 + 0.15 * rise, Math.max(0.001, popScale), 1);
      const sx = this.position.x + this.signGroup.position.x;
      const sz = this.position.z + this.signGroup.position.z;
      this.signGroup.rotation.y = Math.atan2(rider.x - sx, rider.z - sz);
    }

    // Scene waiting figures appear when near an unvisited stop, and one turns and waves within 10 m.
    this.waitGroup.visible = !this.visited && !lockedStation && d < 24;
    if (this.waitGroup.visible) {
      this.waveMix = THREE.MathUtils.damp(this.waveMix, d < 10 ? 1 : 0, 7, dt);
      for (const w of this.waiters) {
        if (!w.waver) continue;
        const wx = this.position.x + w.localX;
        const wz = this.position.z + w.localZ;
        const towardRider = Math.atan2(rider.x - wx, rider.z - wz);
        w.fig.root.rotation.y = lerpAngle(w.restYaw, towardRider, this.waveMix);
        if (w.fig.armPivot) {
          w.fig.armPivot.rotation.set(
            0.28 * this.waveMix,
            0,
            (2.25 + Math.sin(time * 6.5) * 0.32) * this.waveMix,
          );
        }
      }
    }

    return inside;
  }

  dispose(): void {
    this.group.removeFromParent();
    this.freshTex?.dispose();
    this.stampedTex?.dispose();
    this.signTex?.dispose();
    for (const w of this.waiters) w.fig.dispose();
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    });
  }
}
