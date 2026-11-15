import * as THREE from 'three';

/**
 * A fixed-angle "diorama" camera that trails the rider, in the spirit of an isometric toy.
 * The angle never rotates, so screen directions always mean the same thing.
 */
export class FollowCamera {
  /** Yaw of the camera around the target; input is mapped relative to this. */
  readonly yaw = Math.PI * 0.6;
  private readonly elevation = THREE.MathUtils.degToRad(46);
  private distance = 30;
  /** Multiplier on the framing distance, for close-ups. */
  zoom = 1;
  /**
   * Framing used while a story card covers part of the screen. Fractions of the view:
   * shiftX moves the subject left (card on the right), shiftY moves it up (card at the bottom).
   */
  readonly framing = { zoom: 1, shiftX: 0, shiftY: 0 };
  private readonly current = { zoom: 1, shiftX: 0, shiftY: 0 };
  /** Live camera-to-focus distance, used to keep fog relative to the framing. */
  currentDistance = 30;
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly shift = new THREE.Vector3();
  private readonly focus = new THREE.Vector3();
  private readonly lookAhead = new THREE.Vector3();
  private initialized = false;

  get focusPosition(): THREE.Vector3 {
    return this.focus;
  }

  constructor(private readonly camera: THREE.PerspectiveCamera) {
    this.fitToViewport();
    addEventListener('resize', () => this.fitToViewport());
  }

  /** Portrait phones see less width, so pull back to keep the same amount of world in view. */
  private fitToViewport(): void {
    const aspect = innerWidth / innerHeight;
    this.distance = aspect < 0.8 ? 52 : aspect < 1.2 ? 40 : 34;
  }

  update(dt: number, target: THREE.Vector3, heading: number, speed: number): void {
    const ahead = Math.min(speed, 11) * 0.35;
    this.lookAhead.set(Math.sin(heading) * ahead, 0, Math.cos(heading) * ahead);
    const goal = this.lookAhead.add(target);
    goal.y = target.y + 1.2;

    if (!this.initialized) {
      this.focus.copy(goal);
      this.initialized = true;
    } else {
      this.focus.x = THREE.MathUtils.damp(this.focus.x, goal.x, 3.2, dt);
      this.focus.y = THREE.MathUtils.damp(this.focus.y, goal.y, 3.2, dt);
      this.focus.z = THREE.MathUtils.damp(this.focus.z, goal.z, 3.2, dt);
    }

    const c = this.current;
    const k = dt > 0 ? 1 - Math.exp(-4 * dt) : 1;
    c.zoom += (this.framing.zoom - c.zoom) * k;
    c.shiftX += (this.framing.shiftX - c.shiftX) * k;
    c.shiftY += (this.framing.shiftY - c.shiftY) * k;

    const dist = this.distance * this.zoom * c.zoom;
    this.currentDistance = dist;
    const horiz = Math.cos(this.elevation) * dist;
    this.camera.position.set(
      this.focus.x + Math.sin(this.yaw) * horiz,
      this.focus.y + Math.sin(this.elevation) * dist,
      this.focus.z + Math.cos(this.yaw) * horiz,
    );
    this.camera.lookAt(this.focus);

    // Slide the whole view so the subject stays visible beside or above the story card.
    if (c.shiftX !== 0 || c.shiftY !== 0) {
      const viewH = 2 * dist * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
      const viewW = viewH * this.camera.aspect;
      this.camera.matrixWorld.extractBasis(this.right, this.up, this.shift);
      this.shift
        .copy(this.right)
        .multiplyScalar(c.shiftX * viewW)
        .addScaledVector(this.up, -c.shiftY * viewH);
      this.camera.position.add(this.shift);
      this.camera.updateMatrixWorld();
    }
  }

  snap(target: THREE.Vector3): void {
    this.initialized = false;
    this.update(0, target, 0, 0);
  }

  /** Seeds follow-focus without jumping, so camera glides back to rider after a scene. */
  seedFocus(target: THREE.Vector3): void {
    this.focus.copy(target);
    this.initialized = true;
  }
}
