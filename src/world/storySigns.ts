import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { injectWorldShader } from './paperShader';

export type SignStyle = 'vermilion' | 'card' | 'brass' | 'number';

export interface StorySignOpts {
  text: string;
  sub?: string;
  style: SignStyle;
  x: number;
  y: number;
  z: number;
  ry?: number;
  rx?: number;
  width: number;
  height: number;
  anchor?: readonly [number, number, number];
  doubleSided?: boolean;
}

const COLS = 2;
const ROWS = 6;
const ATLAS_W = 1024;
const ATLAS_H = 512;
const CELL_W = ATLAS_W / COLS;
const CELL_H = Math.floor(ATLAS_H / ROWS);

/**
 * Packs up to 12 crisp Fraunces/Literata 3D signs into one shared CanvasTexture
 * and merges all sign meshes in an area into a single draw call.
 */
export class SignAtlas {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly geos: THREE.BufferGeometry[] = [];
  private slot = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = ATLAS_W;
    this.canvas.height = ATLAS_H;
    this.ctx = this.canvas.getContext('2d');
  }

  addSign(opts: StorySignOpts): void {
    const idx = this.slot++;
    if (idx >= COLS * ROWS) return;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    this.drawCell(col, row, opts);

    const u0 = (col * CELL_W + 2) / ATLAS_W;
    const u1 = ((col + 1) * CELL_W - 2) / ATLAS_W;
    // Canvas row 0 is at the top; Three.js UV v=1 is top.
    const v1 = 1 - (row * CELL_H + 2) / ATLAS_H;
    const v0 = 1 - ((row + 1) * CELL_H - 2) / ATLAS_H;

    const addFace = (localZ: number, faceRy: number): void => {
      const plane = new THREE.PlaneGeometry(opts.width, opts.height);
      const raw = plane.toNonIndexed();
      plane.dispose();

      const uv = raw.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) > 0.5 ? u1 : u0, uv.getY(i) > 0.5 ? v1 : v0);
      }

      const local = new THREE.Matrix4().compose(
        new THREE.Vector3(0, 0, localZ),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(0, faceRy, 0)),
        new THREE.Vector3(1, 1, 1),
      );
      raw.applyMatrix4(local);

      const world = new THREE.Matrix4().compose(
        new THREE.Vector3(opts.x, opts.y, opts.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(opts.rx ?? 0, opts.ry ?? 0, 0)),
        new THREE.Vector3(1, 1, 1),
      );
      raw.applyMatrix4(world);

      const pos = raw.getAttribute('position');
      const anchorAttr = new Float32Array(pos.count * 4);
      if (opts.anchor) {
        const [ax, ay, az] = opts.anchor;
        for (let i = 0; i < pos.count; i++) {
          anchorAttr[i * 4] = ax;
          anchorAttr[i * 4 + 1] = ay;
          anchorAttr[i * 4 + 2] = az;
          anchorAttr[i * 4 + 3] = 1;
        }
      }
      raw.setAttribute('aPopupAnchor', new THREE.BufferAttribute(anchorAttr, 4));
      this.geos.push(raw);
    };

    addFace(opts.doubleSided ? 0.02 : 0, 0);
    if (opts.doubleSided) addFace(-0.02, Math.PI);
  }

  private drawCell(col: number, row: number, opts: StorySignOpts): void {
    const g = this.ctx;
    if (!g) return;
    const x = col * CELL_W;
    const y = row * CELL_H;
    const w = CELL_W;
    const h = CELL_H;

    let bg = '#efe6d1';
    let fg = '#20324a';
    let border = '#20324a';
    let subCol = '#c2452d';

    if (opts.style === 'vermilion') {
      bg = '#c2452d';
      fg = '#efe6d1';
      border = '#efe6d1';
      subCol = '#efe6d1';
    } else if (opts.style === 'brass') {
      bg = '#cfa44e';
      fg = '#20324a';
      border = '#20324a';
      subCol = '#20324a';
    } else if (opts.style === 'number') {
      bg = '#20324a';
      fg = '#efe6d1';
      border = '#c2452d';
      subCol = '#efe6d1';
    }

    g.fillStyle = bg;
    g.fillRect(x, y, w, h);
    g.strokeStyle = border;
    g.lineWidth = 5;
    g.strokeRect(x + 5, y + 5, w - 10, h - 10);

    g.fillStyle = fg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const fontSize = opts.style === 'number' ? 48 : opts.sub ? 30 : 34;
    g.font = `600 ${fontSize}px "Fraunces Variable", Georgia, serif`;
    if (opts.sub) {
      g.fillText(opts.text, x + w / 2, y + h * 0.39, w - 30);
      g.fillStyle = subCol;
      g.font = 'italic 20px "Literata Variable", Georgia, serif';
      g.fillText(opts.sub, x + w / 2, y + h * 0.72, w - 30);
    } else {
      g.fillText(opts.text, x + w / 2, y + h / 2 + 1, w - 30);
    }
  }

  build(name: string): { group: THREE.Group; dispose: () => void } {
    const group = new THREE.Group();
    group.name = name;
    if (this.geos.length === 0) {
      return { group, dispose: () => undefined };
    }
    const merged = mergeGeometries(this.geos, false);
    for (const g of this.geos) g.dispose();
    this.geos.length = 0;

    const tex = new THREE.CanvasTexture(this.canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.needsUpdate = true;

    const material = new THREE.MeshStandardMaterial({
      map: tex,
      emissiveMap: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.25,
      roughness: 0.75,
      metalness: 0,
    });
    injectWorldShader(material);

    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);

    return {
      group,
      dispose: () => {
        group.removeFromParent();
        merged?.dispose();
        material.dispose();
        tex.dispose();
      },
    };
  }
}
