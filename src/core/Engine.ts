import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export interface Quality {
  pixelRatio: number;
  shadowMapSize: number;
  mobile: boolean;
}

function detectQuality(): Quality {
  const mobile = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
  return {
    mobile,
    pixelRatio: Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2),
    shadowMapSize: mobile ? 1024 : 2048,
  };
}

/**
 * Owns the renderer, scene, lights and physics world, and runs a fixed-step loop.
 * Areas and the player plug into it through update callbacks.
 */
export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly quality = detectQuality();
  readonly sun: THREE.DirectionalLight;
  readonly hemi: THREE.HemisphereLight;
  world!: RAPIER.World;
  rapier = RAPIER;
  paused = false;

  private readonly updaters: ((dt: number, time: number) => void)[] = [];
  private readonly timer = new THREE.Timer();
  private accumulator = 0;
  private running = false;
  private time = 0;
  private overrideScene: THREE.Scene | null = null;
  private overrideCamera: THREE.PerspectiveCamera | null = null;
  static readonly STEP = 1 / 60;
  /** Catch-up limit per frame; raised for slow headless review runs. */
  maxSteps = 5;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(this.quality.pixelRatio);
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.5, 400);

    this.hemi = new THREE.HemisphereLight(0xdfe9ff, 0x8a7a63, 1.35);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff1dc, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.quality.shadowMapSize, this.quality.shadowMapSize);
    const c = this.sun.shadow.camera;
    c.left = -28;
    c.right = 28;
    c.top = 28;
    c.bottom = -28;
    c.near = 1;
    c.far = 120;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);

    addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      // Avoid a huge catch-up step after the tab was hidden.
      this.timer.update();
      this.accumulator = 0;
    });
  }

  async initPhysics(): Promise<void> {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = Engine.STEP;
  }

  /** Re-aims the sun so its shadow box follows the player. */
  followSun(target: THREE.Vector3, direction: THREE.Vector3): void {
    this.sun.target.position.copy(target);
    this.sun.position.copy(target).addScaledVector(direction, 60);
  }

  onUpdate(fn: (dt: number, time: number) => void): void {
    this.updaters.push(fn);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer.connect(document);
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  /** Replaces the active render target scene/camera (used by the opening/closing desk scene). */
  setOverrideRender(scene: THREE.Scene | null, camera: THREE.PerspectiveCamera | null): void {
    this.overrideScene = scene;
    this.overrideCamera = camera;
    if (camera) {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    }
  }

  /** Renders one frame of the active area scene and returns a JPEG data URL for transitions. */
  captureFrame(quality = 0.88): string | null {
    this.renderer.render(this.scene, this.camera);
    try {
      return this.renderer.domElement.toDataURL('image/jpeg', quality);
    } catch {
      return null;
    }
  }

  private frame(timestamp: number): void {
    this.timer.update(timestamp);
    if (this.paused) {
      this.accumulator = 0;
    } else {
      const dt = Math.min(this.timer.getDelta(), this.maxSteps * Engine.STEP);
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= Engine.STEP && steps < this.maxSteps) {
        this.time += Engine.STEP;
        for (const fn of this.updaters) fn(Engine.STEP, this.time);
        this.world.step();
        this.accumulator -= Engine.STEP;
        steps++;
      }
    }
    this.renderer.render(this.overrideScene ?? this.scene, this.overrideCamera ?? this.camera);
  }

  private resize(): void {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    if (this.overrideCamera) {
      this.overrideCamera.aspect = innerWidth / innerHeight;
      this.overrideCamera.updateProjectionMatrix();
    }
    this.renderer.setSize(innerWidth, innerHeight, false);
  }
}
