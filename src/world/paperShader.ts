import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { palette } from './palette';
import type { PlayBounds } from './Area';

export const PAPER_HEX = 0xeef0ec;

export const worldShaderUniforms = {
  uPlayBounds: { value: new THREE.Vector4(-50, 50, -50, 50) },
  uEdgeEnabled: { value: 1 },
  uEdgeBand: { value: 25 },
  uPaperColor: { value: new THREE.Color(PAPER_HEX) },
  uPopEnabled: { value: 1 },
  uPopFocus: { value: new THREE.Vector3() },
  uPopMin: { value: 26 },
  uPopMax: { value: 36 },
};

export function setPlayBounds(bounds?: PlayBounds): void {
  if (!bounds) {
    worldShaderUniforms.uPlayBounds.value.set(-1e5, 1e5, -1e5, 1e5);
    return;
  }
  worldShaderUniforms.uPlayBounds.value.set(
    bounds.minX,
    bounds.maxX,
    bounds.minZ,
    bounds.maxZ,
  );
}

export function setEdgeShadingEnabled(enabled: boolean): void {
  worldShaderUniforms.uEdgeEnabled.value = enabled ? 1 : 0;
}

export function setPopupEnabled(enabled: boolean): void {
  worldShaderUniforms.uPopEnabled.value = enabled ? 1 : 0;
}

export function setPopupFocus(pos: { x: number; y: number; z: number }): void {
  worldShaderUniforms.uPopFocus.value.set(pos.x, pos.y, pos.z);
}

export function setPopupRange(minDist: number, maxDist: number): void {
  worldShaderUniforms.uPopMin.value = minDist;
  worldShaderUniforms.uPopMax.value = maxDist;
}

export function outsidePlayDistance(
  pos: { x: number; z: number },
  bounds: PlayBounds,
): number {
  const dx = Math.max(bounds.minX - pos.x, pos.x - bounds.maxX, 0);
  const dz = Math.max(bounds.minZ - pos.z, pos.z - bounds.maxZ, 0);
  return Math.hypot(dx, dz);
}

/**
 * Injects the shared world shader onto MeshStandardMaterials so objects
 * outside the play rectangle progressively turn into ink sketches on paper.
 */
export function injectWorldShader(material: THREE.MeshStandardMaterial): void {
  if (material.userData.worldShaderInjected) return;
  material.userData.worldShaderInjected = true;
  material.customProgramCacheKey = () => 'world-paper-v2';

  const prevCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prevCompile?.(shader, renderer);
    shader.uniforms.uPlayBounds = worldShaderUniforms.uPlayBounds;
    shader.uniforms.uEdgeEnabled = worldShaderUniforms.uEdgeEnabled;
    shader.uniforms.uEdgeBand = worldShaderUniforms.uEdgeBand;
    shader.uniforms.uPaperColor = worldShaderUniforms.uPaperColor;
    shader.uniforms.uPopEnabled = worldShaderUniforms.uPopEnabled;
    shader.uniforms.uPopFocus = worldShaderUniforms.uPopFocus;
    shader.uniforms.uPopMin = worldShaderUniforms.uPopMin;
    shader.uniforms.uPopMax = worldShaderUniforms.uPopMax;

    shader.vertexShader = shader.vertexShader
      .replace(
        'void main() {',
        `attribute vec4 aPopupAnchor;
        uniform float uPopEnabled;
        uniform vec3 uPopFocus;
        uniform float uPopMin;
        uniform float uPopMax;
        varying vec3 vWorldPosPaper;
        void main() {`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        if (uPopEnabled > 0.5 && aPopupAnchor.w > 0.5) {
          vec3 worldAnchor = (modelMatrix * vec4(aPopupAnchor.xyz, 1.0)).xyz;
          float dPop = length(worldAnchor.xz - uPopFocus.xz);
          float uPop = clamp((uPopMax - dPop) / max(0.001, uPopMax - uPopMin), 0.0, 1.0);
          float rise = smoothstep(0.0, 0.72, uPop);
          float over = smoothstep(0.32, 1.0, uPop);
          float popScale = rise * (1.0 + 0.11 * sin(over * 3.14159265));
          float minY = aPopupAnchor.y + 0.015;
          transformed.y = mix(minY, transformed.y, popScale);
        }`,
      )
      .replace(
        '#include <project_vertex>',
        `vec4 wpEdge = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wpEdge = instanceMatrix * wpEdge;
        #endif
        wpEdge = modelMatrix * wpEdge;
        vWorldPosPaper = wpEdge.xyz;
        #include <project_vertex>`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        `uniform vec4 uPlayBounds;
        uniform float uEdgeEnabled;
        uniform float uEdgeBand;
        uniform vec3 uPaperColor;
        varying vec3 vWorldPosPaper;
        void main() {`,
      )
      .replace(
        '#include <tonemapping_fragment>',
        `if (uEdgeEnabled > 0.5) {
          float dxEdge = max(uPlayBounds.x - vWorldPosPaper.x, max(vWorldPosPaper.x - uPlayBounds.y, 0.0));
          float dzEdge = max(uPlayBounds.z - vWorldPosPaper.z, max(vWorldPosPaper.z - uPlayBounds.w, 0.0));
          float outsideDist = length(vec2(dxEdge, dzEdge));
          if (outsideDist > 0.001) {
            float edgeMix = smoothstep(0.0, uEdgeBand, outsideDist);
            float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
            float sketchShade = 1.0 - 0.16 * (1.0 - facing);
            float hatch = 0.035 * smoothstep(0.75, 0.98, abs(sin((vWorldPosPaper.x + vWorldPosPaper.z) * 2.2)));
            vec3 paperTone = uPaperColor * (sketchShade - hatch * edgeMix);
            gl_FragColor.rgb = mix(gl_FragColor.rgb, paperTone, edgeMix * 0.92);
          }
        }
        #include <tonemapping_fragment>`,
      );
  };
}

/** Generates a repeatable light-pencil-hatched paper CanvasTexture. */
export function createPaperHatchTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#eef0ec';
  ctx.fillRect(0, 0, size, size);

  let s = 4219;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  // Light primary diagonal pencil hatching.
  ctx.strokeStyle = 'rgba(28, 35, 64, 0.08)';
  ctx.lineWidth = 1;
  for (let i = -size; i < size * 2; i += 7) {
    ctx.beginPath();
    const wobble = (rnd() - 0.5) * 2.5;
    ctx.moveTo(i, 0);
    ctx.lineTo(i - size + wobble, size);
    ctx.stroke();
  }

  // Sparse faint counter-hatch.
  ctx.strokeStyle = 'rgba(28, 35, 64, 0.04)';
  for (let i = -size; i < size * 2; i += 19) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size * 0.7 + (rnd() - 0.5) * 3, size);
    ctx.stroke();
  }

  // Soft paper grain flecks.
  ctx.fillStyle = 'rgba(28, 35, 64, 0.04)';
  for (let i = 0; i < 160; i++) {
    ctx.fillRect(rnd() * size, rnd() * size, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface PaperSurroundOptions {
  getY?: (x: number, z: number) => number;
  borderSides?: readonly ('north' | 'south' | 'east' | 'west')[];
  landMaxZ?: number;
  landMinX?: number;
}

/**
 * Builds the extended hatched paper ground margin and the hand-drawn dashed
 * ink border marking the play rectangle edge.
 */
export function buildPaperSurround(
  bounds: PlayBounds,
  opts: PaperSurroundOptions = {},
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'paper-surround';
  const getY = opts.getY ?? (() => 0);
  const cx = (bounds.minX + bounds.maxX) * 0.5;
  const cz = (bounds.minZ + bounds.maxZ) * 0.5;

  // Extended paper ground apron with pencil-hatching CanvasTexture.
  const span = 340;
  const segs = 56;
  const groundGeo = new THREE.PlaneGeometry(span, span, segs, segs);
  groundGeo.rotateX(-Math.PI / 2);
  groundGeo.translate(cx, 0, cz);

  const pos = groundGeo.attributes.position as THREE.BufferAttribute;
  const uv = groundGeo.attributes.uv as THREE.BufferAttribute;
  const mask = new Float32Array(pos.count);
  const landMaxZ = opts.landMaxZ ?? Infinity;
  const landMinX = opts.landMinX ?? -Infinity;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, getY(x, z) + 0.03);
    uv.setXY(i, x / 14, z / 14);
    const inSea = z > landMaxZ - 0.5 || x < landMinX + 0.5;
    mask[i] = inSea ? 0 : 1;
  }
  groundGeo.setAttribute('aMarginMask', new THREE.BufferAttribute(mask, 1));
  groundGeo.computeVertexNormals();

  const paperMat = new THREE.MeshStandardMaterial({
    map: createPaperHatchTexture(),
    roughness: 0.96,
    metalness: 0,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  paperMat.customProgramCacheKey = () => 'paper-ground-skirt-v1';
  const skirtBounds = new THREE.Vector4(bounds.minX, bounds.maxX, bounds.minZ, bounds.maxZ);
  paperMat.onBeforeCompile = (shader) => {
    shader.uniforms.uSkirtBounds = { value: skirtBounds };
    shader.vertexShader = shader.vertexShader
      .replace(
        'void main() {',
        'attribute float aMarginMask;\nvarying float vMarginMask;\nvarying vec3 vWorldPosSkirt;\nvoid main() {\nvMarginMask = aMarginMask;',
      )
      .replace(
        '#include <project_vertex>',
        `vWorldPosSkirt = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #include <project_vertex>`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        'void main() {',
        'uniform vec4 uSkirtBounds;\nvarying float vMarginMask;\nvarying vec3 vWorldPosSkirt;\nvoid main() {',
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float dxS = max(uSkirtBounds.x - vWorldPosSkirt.x, max(vWorldPosSkirt.x - uSkirtBounds.y, 0.0));
        float dzS = max(uSkirtBounds.z - vWorldPosSkirt.z, max(vWorldPosSkirt.z - uSkirtBounds.w, 0.0));
        float dOut = length(vec2(dxS, dzS));
        diffuseColor.a *= smoothstep(0.0, 14.0, dOut) * vMarginMask;
        if (diffuseColor.a < 0.01) discard;`,
      );
  };

  const groundMesh = new THREE.Mesh(groundGeo, paperMat);
  groundMesh.receiveShadow = true;
  groundMesh.renderOrder = 1;
  group.add(groundMesh);

  // Hand-drawn dashed ink border along land edges of the play area.
  const sides = opts.borderSides ?? ['north', 'east', 'south', 'west'];
  const dashes: THREE.BufferGeometry[] = [];
  const dashMat = new THREE.MeshBasicMaterial({
    color: palette.night,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  const addDashedSegment = (x0: number, z0: number, x1: number, z1: number, seedOffset: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const step = 2.3;
    const dashLen = 1.4;
    const dx = (x1 - x0) / len;
    const dz = (z1 - z0) / len;
    const nx = -dz;
    const nz = dx;
    const yaw = Math.atan2(dx, dz);

    for (let t = 0.4; t + dashLen * 0.4 < len; t += step) {
      const mid = Math.min(len - 0.3, t + dashLen * 0.5);
      const wobble = Math.sin((t + seedOffset) * 1.9) * 0.06;
      const tilt = Math.cos((t + seedOffset) * 2.7) * 0.035;
      const wx = x0 + dx * mid + nx * wobble;
      const wz = z0 + dz * mid + nz * wobble;
      const q = new THREE.PlaneGeometry(0.16, dashLen);
      q.rotateX(-Math.PI / 2);
      q.rotateY(yaw + tilt);
      q.translate(wx, getY(wx, wz) + 0.055, wz);
      dashes.push(q);
    }
  };

  if (sides.includes('north')) addDashedSegment(bounds.minX, bounds.minZ, bounds.maxX, bounds.minZ, 1);
  if (sides.includes('south')) addDashedSegment(bounds.minX, bounds.maxZ, bounds.maxX, bounds.maxZ, 17);
  if (sides.includes('west')) addDashedSegment(bounds.minX, bounds.minZ, bounds.minX, bounds.maxZ, 31);
  if (sides.includes('east')) addDashedSegment(bounds.maxX, bounds.minZ, bounds.maxX, bounds.maxZ, 47);

  if (dashes.length > 0) {
    const merged = mergeGeometries(dashes, false);
    for (const d of dashes) d.dispose();
    if (merged) {
      const borderMesh = new THREE.Mesh(merged, dashMat);
      borderMesh.renderOrder = 2;
      group.add(borderMesh);
    }
  } else {
    dashMat.dispose();
  }

  return group;
}
