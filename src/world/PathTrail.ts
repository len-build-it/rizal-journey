import * as THREE from 'three';
import { palette } from './palette';
import type { Area, RoadGraph } from './Area';
import type { StopMarker } from './StopMarker';

const MAX_DOTS = 220;
const STEP = 1.2;
const FADE_OUT_RADIUS = 6;
const STOP_CLEAR_RADIUS = 1.6;
const RIDER_CLEAR_RADIUS = 2.0;

/**
 * Finds the next unread stop in stories.ts order for an area,
 * keeping station stops (with travel actions) last.
 */
export function findTargetStop(area: Area, visited: Set<string>): StopMarker | null {
  const nonStation = area.stops.filter((s) => !s.story.action);
  const station = area.stops.filter((s) => Boolean(s.story.action));
  for (const s of [...nonStation, ...station]) {
    if (!visited.has(s.story.id)) return s;
  }
  return null;
}

/**
 * Gold ink trail along an area's road graph leading toward the next unread stop.
 */
export class PathTrail {
  readonly mesh: THREE.InstancedMesh;
  private readonly mat: THREE.MeshBasicMaterial;
  private readonly dummy = new THREE.Object3D();
  private cachedKey = '';
  private cachedSamples: { pos: THREE.Vector3; arc: number; distToStop: number }[] = [];

  constructor(scene: THREE.Scene) {
    const geo = new THREE.CircleGeometry(0.18, 12);
    geo.rotateX(-Math.PI / 2);
    this.mat = new THREE.MeshBasicMaterial({
      color: palette.gaslight,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    this.mesh = new THREE.InstancedMesh(geo, this.mat, MAX_DOTS);
    this.mesh.name = 'path-trail';
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.mesh.renderOrder = 3;
    scene.add(this.mesh);
  }

  update(
    area: Area | null,
    playerPos: THREE.Vector3,
    visited: Set<string>,
    hidden: boolean,
    time: number,
  ): StopMarker | null {
    const target = area ? findTargetStop(area, visited) : null;
    if (!area || !target || hidden || !area.roadGraph) {
      this.mesh.visible = false;
      this.mesh.count = 0;
      return target;
    }

    const startIdx = nearestWaypoint(area.roadGraph, playerPos);
    const endIdx = area.roadGraph.stopWaypoints[target.story.id];
    const key = `${area.id}:${target.story.id}:${startIdx}`;
    if (key !== this.cachedKey) {
      this.cachedKey = key;
      const nodes =
        endIdx !== undefined
          ? shortestPath(area.roadGraph, startIdx, endIdx).map((i) => area.roadGraph!.waypoints[i]!)
          : [];
      const poly = deduplicatePoints([...nodes, target.position]);
      this.cachedSamples = samplePolyline(poly, target.position);
    }

    let count = 0;
    for (let i = 0; i < this.cachedSamples.length && count < MAX_DOTS; i++) {
      const sample = this.cachedSamples[i]!;
      if (sample.distToStop <= STOP_CLEAR_RADIUS) continue;
      const dPlayer = Math.hypot(sample.pos.x - playerPos.x, sample.pos.z - playerPos.z);
      if (dPlayer < RIDER_CLEAR_RADIUS) continue;

      const stopFade = Math.min(
        1,
        (sample.distToStop - STOP_CLEAR_RADIUS) / (FADE_OUT_RADIUS - STOP_CLEAR_RADIUS),
      );
      const pulse = 0.5 + 0.5 * Math.sin(sample.arc * 0.5 - time * 3.0);
      const scale = (0.68 + 0.52 * pulse) * stopFade;
      if (scale <= 0.04) continue;

      this.dummy.position.set(sample.pos.x, sample.pos.y + 0.08, sample.pos.z);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(count++, this.dummy.matrix);
    }

    this.mesh.count = count;
    this.mesh.visible = count > 0;
    if (count > 0) this.mesh.instanceMatrix.needsUpdate = true;
    return target;
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

function nearestWaypoint(graph: RoadGraph, pos: THREE.Vector3): number {
  let best = 0;
  let bestD2 = Infinity;
  for (let i = 0; i < graph.waypoints.length; i++) {
    const d2 = graph.waypoints[i]!.distanceToSquared(pos);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = i;
    }
  }
  return best;
}

function shortestPath(graph: RoadGraph, start: number, goal: number): number[] {
  const n = graph.waypoints.length;
  const adj: { to: number; w: number }[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of graph.edges) {
    const wa = graph.waypoints[a];
    const wb = graph.waypoints[b];
    if (!wa || !wb) continue;
    const w = wa.distanceTo(wb);
    adj[a]!.push({ to: b, w });
    adj[b]!.push({ to: a, w });
  }

  const dist = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);
  dist[start] = 0;

  for (let iter = 0; iter < n; iter++) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) {
      if (!done[i] && dist[i]! < best) {
        best = dist[i]!;
        u = i;
      }
    }
    if (u === -1 || u === goal) break;
    done[u] = 1;
    for (const edge of adj[u]!) {
      const nd = dist[u]! + edge.w;
      if (nd < dist[edge.to]!) {
        dist[edge.to] = nd;
        prev[edge.to] = u;
      }
    }
  }

  if (dist[goal] === Infinity) return [start, goal];
  const path: number[] = [];
  for (let cur = goal; cur !== -1; cur = prev[cur]!) path.push(cur);
  path.reverse();
  return path;
}

function deduplicatePoints(pts: THREE.Vector3[]): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || last.distanceToSquared(p) > 0.25) out.push(p);
  }
  return out;
}

function samplePolyline(
  pts: THREE.Vector3[],
  stopPos: THREE.Vector3,
): { pos: THREE.Vector3; arc: number; distToStop: number }[] {
  const out: { pos: THREE.Vector3; arc: number; distToStop: number }[] = [];
  if (pts.length < 2) return out;
  let arc = 0;
  let nextSample = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    const segLen = a.distanceTo(b);
    if (segLen < 0.05) continue;
    while (nextSample <= arc + segLen && out.length < MAX_DOTS) {
      const t = Math.max(0, Math.min(1, (nextSample - arc) / segLen));
      const pos = new THREE.Vector3().lerpVectors(a, b, t);
      const distToStop = Math.hypot(pos.x - stopPos.x, pos.z - stopPos.z);
      out.push({ pos, arc: nextSample, distToStop });
      nextSample += STEP;
    }
    arc += segLen;
  }
  return out;
}
