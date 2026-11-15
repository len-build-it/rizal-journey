import * as THREE from 'three';
import { palette } from '../world/palette';
import { routeMapSvg } from './brochure/routeMap';

const PW = 0.92;
const PD = 1.5;

const COVER_CARD_CSS = '#efe6d1';
const COVER_CARD_HEX = 0xefe6d1;
const INK_CSS = '#20324a';
const INK_SOFT_CSS = '#4b5a6e';
const VERMILION_CSS = '#c2452d';

function resolvedRouteMapSvg(): string {
  return routeMapSvg()
    .replaceAll('var(--k-vermilion)', VERMILION_CSS)
    .replaceAll('var(--k-card-sunk)', '#e2d3b3')
    .replaceAll('var(--k-ink)', INK_CSS)
    .replaceAll('var(--k-display)', "'Fraunces Variable', Georgia, serif")
    .replaceAll('var(--k-text)', "'Literata Variable', Georgia, serif")
    .replaceAll('var(--k-display-axes)', "'SOFT' 100, 'WONK' 0");
}

function loadRouteMapImage(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const svg = resolvedRouteMapSvg();
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineHeight;
  }
  return cy;
}

function drawCoverCanvas(canvas: HTMLCanvasElement, mapImg: HTMLImageElement | null): void {
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = COVER_CARD_CSS;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w * 0.5, h * 0.38, 20, w * 0.5, h * 0.38, w * 0.6);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const pad = 38;

  // Title in Fraunces.
  ctx.fillStyle = INK_CSS;
  ctx.font = '600 60px "Fraunces Variable", Georgia, serif';
  ctx.fillText("Through Rizal's", pad, 92);
  ctx.fillText('Eyes', pad, 152);

  // Subtitle in Literata italic vermilion.
  ctx.fillStyle = VERMILION_CSS;
  ctx.font = 'italic 22px "Literata Variable", Georgia, serif';
  ctx.fillText('France, 1882 to 1891', pad, 188);

  // Route map SVG rendered into Image.
  if (mapImg) {
    const mapW = 360;
    const mapH = Math.round((mapW * 212) / 200);
    ctx.drawImage(mapImg, (w - mapW) / 2, 212, mapW, mapH);
  }

  // Cover intro copy.
  ctx.fillStyle = INK_CSS;
  ctx.font = '400 17px "Literata Variable", Georgia, serif';
  wrapText(
    ctx,
    'France was the first place Jose Rizal set foot in Europe, and the last place he left it. Follow him from a 20-year-old student on his way to Spain to a published novelist leaving Europe.',
    pad,
    622,
    w - pad * 2,
    25,
  );

  // Rule and student credit at footer in small Literata.
  ctx.strokeStyle = 'rgba(32, 50, 74, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad, 744);
  ctx.lineTo(w - pad, 744);
  ctx.stroke();

  ctx.fillStyle = INK_SOFT_CSS;
  ctx.font = '400 14px "Literata Variable", Georgia, serif';
  wrapText(
    ctx,
    "Lenard. Software Engineering, Aklan State University. Chapter 9 Activity: A Journey Through Rizal's Travels.",
    pad,
    768,
    w - pad * 2,
    20,
  );
}

function createCoverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 832;
  drawCoverCanvas(canvas, null);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function drawInnerPanelCanvas(canvas: HTMLCanvasElement, title: string, sub: string): void {
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = COVER_CARD_CSS;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = VERMILION_CSS;
  ctx.font = 'italic 16px "Literata Variable", Georgia, serif';
  ctx.fillText(sub, 28, 52);

  ctx.fillStyle = INK_CSS;
  ctx.font = '580 32px "Fraunces Variable", Georgia, serif';
  ctx.fillText(title, 28, 92);

  ctx.strokeStyle = VERMILION_CSS;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 114);
  ctx.lineTo(canvas.width - 28, 114);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(32, 50, 74, 0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = 152; y <= 520; y += 36) {
    ctx.moveTo(28, y);
    ctx.lineTo(canvas.width - 36 - ((y * 17) % 64), y);
  }
  ctx.stroke();
}

function createInnerPanelTexture(title: string, sub: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 624;
  drawInnerPanelCanvas(canvas, title, sub);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Three.js desk scene: dark wood desk, warm brass desk lamp, and a folded 6-panel
 * hinged paper brochure used for both opening unfold and closing fold-up transitions.
 */
export class DeskScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 40);

  private readonly brochureRoot = new THREE.Group();
  private readonly h2 = new THREE.Group();
  private readonly h1 = new THREE.Group();
  private readonly h4 = new THREE.Group();
  private readonly h5 = new THREE.Group();
  private readonly h6 = new THREE.Group();
  private readonly p2World = new THREE.Vector3();

  private readonly disposables: { dispose: () => void }[] = [];
  private readonly coverTex: THREE.CanvasTexture;
  private readonly p2Tex: THREE.CanvasTexture;
  private readonly innerTex: THREE.CanvasTexture;
  private readonly closedCamPos = new THREE.Vector3(0.08, 2.36, 2.96);
  private readonly closedCamLook = new THREE.Vector3(0.04, 0.16, -0.14);

  constructor() {
    this.scene.background = new THREE.Color(palette.night);

    const hemi = new THREE.HemisphereLight(0xdbe3f0, palette.bayDark, 0.85);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffe7c2, 1.9);
    key.position.set(2.4, 4.2, 2.1);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0015;
    key.shadow.normalBias = 0.02;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 12;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    this.scene.add(key);

    const lampLight = new THREE.PointLight(palette.gaslight, 6.0, 8.5, 1.6);
    lampLight.position.set(1.02, 1.25, -0.52);
    this.scene.add(lampLight);

    // Dark wood desk surface + subtle blotter pad.
    const deskGeo = new THREE.BoxGeometry(14, 0.2, 10);
    const deskMat = new THREE.MeshStandardMaterial({
      color: palette.bayDark,
      roughness: 0.78,
      metalness: 0.04,
    });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.set(0, -0.1, 0);
    desk.receiveShadow = true;
    this.scene.add(desk);
    this.disposables.push(deskGeo, deskMat);

    const blotterGeo = new THREE.BoxGeometry(3.8, 0.012, 2.3);
    const blotterMat = new THREE.MeshStandardMaterial({
      color: palette.coat,
      roughness: 0.92,
    });
    const blotter = new THREE.Mesh(blotterGeo, blotterMat);
    blotter.position.set(0.25, 0.006, 0.02);
    blotter.receiveShadow = true;
    this.scene.add(blotter);
    this.disposables.push(blotterGeo, blotterMat);

    // Classic brass & enamel desk lamp standing back-right.
    const brassMat = new THREE.MeshStandardMaterial({
      color: palette.funnel,
      roughness: 0.35,
      metalness: 0.55,
    });
    const shadeMat = new THREE.MeshStandardMaterial({
      color: palette.shutterGreen,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff4d0,
      emissive: palette.gaslight,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    this.disposables.push(brassMat, shadeMat, bulbMat);

    const baseGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.07, 16);
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.038, 1.05, 10);
    const armGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.52, 8);
    const shadeGeo = new THREE.ConeGeometry(0.32, 0.24, 16, 1, true);
    const bulbGeo = new THREE.SphereGeometry(0.085, 10, 8);
    this.disposables.push(baseGeo, stemGeo, armGeo, shadeGeo, bulbGeo);

    const lampGroup = new THREE.Group();
    lampGroup.position.set(1.38, 0, -0.82);
    const base = new THREE.Mesh(baseGeo, brassMat);
    base.position.y = 0.035;
    base.castShadow = true;
    const stem = new THREE.Mesh(stemGeo, brassMat);
    stem.position.y = 0.55;
    stem.castShadow = true;
    const arm = new THREE.Mesh(armGeo, brassMat);
    arm.position.set(-0.2, 1.08, 0.14);
    arm.rotation.set(0.35, 0, Math.PI * 0.44);
    const shade = new THREE.Mesh(shadeGeo, shadeMat);
    shade.position.set(-0.38, 1.1, 0.24);
    shade.rotation.set(0.22, 0, -0.2);
    shade.castShadow = true;
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(-0.36, 1.01, 0.22);
    lampGroup.add(base, stem, arm, shade, bulb);
    this.scene.add(lampGroup);

    // Hinged six-panel paper brochure (each panel given crisp cardstock thickness).
    const panelGeo = new THREE.BoxGeometry(PW, 0.004, PD);
    this.disposables.push(panelGeo);

    const coverTex = (this.coverTex = createCoverTexture());
    const p2Tex = (this.p2Tex = createInnerPanelTexture('First steps', 'Panel two'));
    const innerTex = (this.innerTex = createInnerPanelTexture('1882 to 1891', 'Journey log'));
    const paperMat = new THREE.MeshStandardMaterial({
      color: COVER_CARD_HEX,
      roughness: 0.9,
    });
    const coverTopMat = new THREE.MeshStandardMaterial({
      map: coverTex,
      roughness: 0.88,
    });
    const p2TopMat = new THREE.MeshStandardMaterial({
      map: p2Tex,
      roughness: 0.88,
    });
    const innerTopMat = new THREE.MeshStandardMaterial({
      map: innerTex,
      roughness: 0.88,
    });
    const coverMats = [paperMat, paperMat, coverTopMat, paperMat, paperMat, paperMat];
    const p2Mats = [paperMat, paperMat, p2TopMat, paperMat, paperMat, paperMat];
    const innerMats = [paperMat, paperMat, innerTopMat, paperMat, paperMat, paperMat];
    this.disposables.push(coverTex, p2Tex, innerTex, paperMat, coverTopMat, p2TopMat, innerTopMat);

    // P3 anchor sits flat in the center of the unfolded strip.
    const p3 = new THREE.Mesh(panelGeo, innerMats);
    p3.receiveShadow = true;
    p3.castShadow = true;
    this.brochureRoot.add(p3);

    // Left chain: P2 (from P3 left edge) -> P1 cover (from P2 outer edge).
    this.h2.position.set(-PW / 2, 0.004, 0);
    const p2 = new THREE.Mesh(panelGeo, p2Mats);
    p2.position.set(-PW / 2, 0, 0);
    p2.castShadow = true;
    p2.receiveShadow = true;
    this.h2.add(p2);

    this.h1.position.set(-PW, -0.006, 0);
    const p1 = new THREE.Mesh(panelGeo, coverMats);
    p1.position.set(-PW / 2, 0, 0);
    p1.castShadow = true;
    p1.receiveShadow = true;
    this.h1.add(p1);
    this.h2.add(this.h1);
    this.brochureRoot.add(this.h2);

    // Right chain: P4 -> P5 -> P6 accordion-folded beneath P2/P1.
    this.h4.position.set(PW / 2, 0.004, 0);
    const p4 = new THREE.Mesh(panelGeo, innerMats);
    p4.position.set(PW / 2, 0, 0);
    p4.castShadow = true;
    p4.receiveShadow = true;
    this.h4.add(p4);

    this.h5.position.set(PW, 0.004, 0);
    const p5 = new THREE.Mesh(panelGeo, paperMat);
    p5.position.set(PW / 2, 0, 0);
    p5.castShadow = true;
    this.h5.add(p5);

    this.h6.position.set(PW, 0.004, 0);
    const p6 = new THREE.Mesh(panelGeo, paperMat);
    p6.position.set(PW / 2, 0, 0);
    p6.castShadow = true;
    this.h6.add(p6);
    this.h5.add(this.h6);
    this.h4.add(this.h5);
    this.brochureRoot.add(this.h4);

    this.scene.add(this.brochureRoot);
    this.setFold(1);
    this.setCameraClosed();
  }

  /** Waits for Fraunces and Literata fonts and route map SVG before redrawing textures. */
  async ready(): Promise<void> {
    if (typeof document !== 'undefined' && 'fonts' in document) {
      const [, , , mapImg] = await Promise.all([
        document.fonts.load('600 48px "Fraunces Variable"'),
        document.fonts.load('400 22px "Literata Variable"'),
        document.fonts.load('italic 22px "Literata Variable"'),
        loadRouteMapImage(),
      ]);
      drawCoverCanvas(this.coverTex.image as HTMLCanvasElement, mapImg);
      this.coverTex.needsUpdate = true;
      drawInnerPanelCanvas(this.p2Tex.image as HTMLCanvasElement, 'First steps', 'Panel two');
      this.p2Tex.needsUpdate = true;
      drawInnerPanelCanvas(this.innerTex.image as HTMLCanvasElement, '1882 to 1891', 'Journey log');
      this.innerTex.needsUpdate = true;
    }
  }

  /** Sets Z-fold progress (`1` = folded stacked booklet on desk, `0` = unfolded spread). */
  setFold(fold: number): void {
    const u = THREE.MathUtils.clamp(fold, 0, 1);
    // Keep closed cover nudged right of the bottom-left intro title/buttons, clear of blotter top (y=0.012).
    this.brochureRoot.position.set(0.28 * u, 0.018, 0.1);
    this.brochureRoot.rotation.y = -0.14 * u;

    // Exact parallel Z-fold stacking order bottom->top: P3 -> P4 -> P5 -> P6 -> P2 -> P1 (cover).
    this.h4.position.y = 0.006 * u;
    this.h5.position.y = -0.006 * u;
    this.h6.position.y = 0.006 * u;
    this.h2.position.y = 0.026 * u;
    this.h1.position.y = -0.008 * u;

    this.h2.rotation.z = -u * Math.PI;
    this.h1.rotation.z = u * Math.PI;

    this.h4.rotation.z = u * Math.PI;
    this.h5.rotation.z = -u * Math.PI;
    this.h6.rotation.z = u * Math.PI;
  }

  setCameraClosed(): void {
    this.camera.position.copy(this.closedCamPos);
    this.camera.lookAt(this.closedCamLook);
  }

  /** Animates unfolding the brochure and diving the camera into panel 2. */
  async playOpen(): Promise<void> {
    await animateProgress(950, (t) => {
      const e = easeOutCubic(t);
      this.setFold(1 - e);
      // Center unfolded spread smoothly.
      this.camera.position.set(
        THREE.MathUtils.lerp(this.closedCamPos.x, -0.5, e),
        THREE.MathUtils.lerp(this.closedCamPos.y, 2.55, e),
        THREE.MathUtils.lerp(this.closedCamPos.z, 2.15, e),
      );
      this.camera.lookAt(
        THREE.MathUtils.lerp(this.closedCamLook.x, -0.45, e),
        0.04,
        THREE.MathUtils.lerp(this.closedCamLook.z, 0.08, e),
      );
    });

    this.setFold(0);
    this.brochureRoot.updateMatrixWorld(true);
    // Target Panel 2 center (world space).
    this.p2World.set(-PW, 0.03, 0.08);
    const startPos = this.camera.position.clone();
    await animateProgress(700, (t) => {
      const e = easeInOutCubic(t);
      this.camera.position.set(
        THREE.MathUtils.lerp(startPos.x, this.p2World.x, e),
        THREE.MathUtils.lerp(startPos.y, 0.24, e),
        THREE.MathUtils.lerp(startPos.z, this.p2World.z + 0.14, e),
      );
      this.camera.lookAt(this.p2World.x, 0.02, this.p2World.z);
    });
  }

  /** Animates folding the open spread back up into the closed brochure on the desk. */
  async playCloseFold(): Promise<void> {
    this.setFold(0);
    this.camera.position.set(-0.2, 2.65, 2.45);
    this.camera.lookAt(-0.08, 0.06, 0.08);
    await animateProgress(950, (t) => {
      const e = easeInOutCubic(t);
      this.setFold(e);
      this.camera.position.set(
        THREE.MathUtils.lerp(-0.2, this.closedCamPos.x, e),
        THREE.MathUtils.lerp(2.65, this.closedCamPos.y, e),
        THREE.MathUtils.lerp(2.45, this.closedCamPos.z, e),
      );
      this.camera.lookAt(this.closedCamLook);
    });
    this.setFold(1);
    this.setCameraClosed();
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animateProgress(durationMs: number, onStep: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs);
      onStep(t);
      if (t >= 1) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
