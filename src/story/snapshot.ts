import * as THREE from 'three';
import type { Engine } from '../core/Engine';

const SNAPSHOT_W = 600;
const SNAPSHOT_H = 400;
const POSTERIZE_LEVELS = 6;
const PAPER_RGB = [238, 240, 236] as const;
const INK_RGB = [28, 35, 64] as const;

let scratchCanvas: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;

function ensureScratch(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!scratchCanvas) {
    scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = SNAPSHOT_W;
    scratchCanvas.height = SNAPSHOT_H;
    scratchCtx = scratchCanvas.getContext('2d');
  }
  if (!scratchCtx) return null;
  return { canvas: scratchCanvas, ctx: scratchCtx };
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function posterizeChannel(v: number): number {
  const q = Math.round((v / 255) * POSTERIZE_LEVELS) / POSTERIZE_LEVELS;
  return q * 255;
}

/**
 * Renders the current 3D scene to a 600x400 offscreen render target (no DOM overlays),
 * turns it into a posterized ink-outlined illustration tinted toward the brochure paper tone,
 * and returns a compact JPEG data URL.
 */
export function captureStorySnapshot(engine: Engine): string | null {
  const scratch = ensureScratch();
  if (!scratch) return null;

  const target = new THREE.WebGLRenderTarget(SNAPSHOT_W, SNAPSHOT_H, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.SRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
  });

  const prevTarget = engine.renderer.getRenderTarget();
  const prevAspect = engine.camera.aspect;
  const pixels = new Uint8Array(SNAPSHOT_W * SNAPSHOT_H * 4);

  try {
    engine.camera.aspect = SNAPSHOT_W / SNAPSHOT_H;
    engine.camera.updateProjectionMatrix();
    engine.renderer.setRenderTarget(target);
    engine.renderer.clear();
    engine.renderer.render(engine.scene, engine.camera);
    engine.renderer.readRenderTargetPixels(target, 0, 0, SNAPSHOT_W, SNAPSHOT_H, pixels);
  } finally {
    engine.renderer.setRenderTarget(prevTarget);
    engine.camera.aspect = prevAspect;
    engine.camera.updateProjectionMatrix();
    target.dispose();
  }

  const lum = new Float32Array(SNAPSHOT_W * SNAPSHOT_H);
  for (let y = 0; y < SNAPSHOT_H; y++) {
    const srcRow = (SNAPSHOT_H - 1 - y) * SNAPSHOT_W;
    const dstRow = y * SNAPSHOT_W;
    for (let x = 0; x < SNAPSHOT_W; x++) {
      const si = (srcRow + x) * 4;
      lum[dstRow + x] =
        0.299 * pixels[si]! + 0.587 * pixels[si + 1]! + 0.114 * pixels[si + 2]!;
    }
  }

  const img = scratch.ctx.createImageData(SNAPSHOT_W, SNAPSHOT_H);
  const out = img.data;

  for (let y = 0; y < SNAPSHOT_H; y++) {
    const srcRow = (SNAPSHOT_H - 1 - y) * SNAPSHOT_W;
    const y0 = y > 0 ? y - 1 : 0;
    const y1 = y < SNAPSHOT_H - 1 ? y + 1 : SNAPSHOT_H - 1;

    for (let x = 0; x < SNAPSHOT_W; x++) {
      const x0 = x > 0 ? x - 1 : 0;
      const x1 = x < SNAPSHOT_W - 1 ? x + 1 : SNAPSHOT_W - 1;

      const tl = lum[y0 * SNAPSHOT_W + x0]!;
      const tc = lum[y0 * SNAPSHOT_W + x]!;
      const tr = lum[y0 * SNAPSHOT_W + x1]!;
      const ml = lum[y * SNAPSHOT_W + x0]!;
      const mr = lum[y * SNAPSHOT_W + x1]!;
      const bl = lum[y1 * SNAPSHOT_W + x0]!;
      const bc = lum[y1 * SNAPSHOT_W + x]!;
      const br = lum[y1 * SNAPSHOT_W + x1]!;

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      const grad = Math.hypot(gx, gy);
      const edge = Math.min(1, Math.max(0, (grad - 38) / 88));

      const si = (srcRow + x) * 4;
      const di = (y * SNAPSHOT_W + x) * 4;
      const pr = posterizeChannel(pixels[si]!);
      const pg = posterizeChannel(pixels[si + 1]!);
      const pb = posterizeChannel(pixels[si + 2]!);

      // Wash posterized colors slightly toward paper #eef0ec, then apply dark ink outlines.
      const wash = 0.2;
      const trR = pr + (PAPER_RGB[0] - pr) * wash;
      const trG = pg + (PAPER_RGB[1] - pg) * wash;
      const trB = pb + (PAPER_RGB[2] - pb) * wash;

      const ink = edge * 0.85;
      out[di] = clampByte(trR + (INK_RGB[0] - trR) * ink);
      out[di + 1] = clampByte(trG + (INK_RGB[1] - trG) * ink);
      out[di + 2] = clampByte(trB + (INK_RGB[2] - trB) * ink);
      out[di + 3] = 255;
    }
  }

  scratch.ctx.putImageData(img, 0, 0);
  return scratch.canvas.toDataURL('image/jpeg', 0.82);
}
