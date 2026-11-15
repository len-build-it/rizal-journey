/**
 * Merges keyboard and touch joystick into one screen-relative direction.
 * x: right is +1. y: up the screen (away from the camera) is +1.
 * The rider turns toward this direction, so controls feel the same on keys and touch.
 */
export class Input {
  x = 0;
  y = 0;
  /** Gallop: Shift on keyboard, or pushing the joystick to its edge. */
  sprint = false;
  /** True only on the frame the interact key was pressed. */
  interactPressed = false;
  enabled = true;

  private readonly keys = new Set<string>();
  private stickX = 0;
  private stickY = 0;
  private interactQueued = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (isTypingTarget(e.target)) return;
      const code = e.code;
      if (MOVE_KEYS.has(code)) e.preventDefault();
      if ((code === 'Enter' || code === 'KeyE') && !e.repeat) this.interactQueued = true;
      this.keys.add(code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  /** Joystick vector in [-1, 1]; up is negative y on screen, so it is flipped here. */
  setStick(x: number, y: number): void {
    this.stickX = x;
    this.stickY = -y;
  }

  queueInteract(): void {
    this.interactQueued = true;
  }

  update(): void {
    const k = this.keys;
    const fwd = Number(k.has('KeyW') || k.has('ArrowUp'));
    const back = Number(k.has('KeyS') || k.has('ArrowDown'));
    const left = Number(k.has('KeyA') || k.has('ArrowLeft'));
    const right = Number(k.has('KeyD') || k.has('ArrowRight'));

    let x = right - left;
    let y = fwd - back;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    let sprint = k.has('ShiftLeft') || k.has('ShiftRight');
    if (Math.abs(this.stickX) > 0.01 || Math.abs(this.stickY) > 0.01) {
      x = this.stickX;
      y = this.stickY;
      sprint = Math.hypot(x, y) > 0.92;
    }
    this.sprint = this.enabled && sprint;
    this.x = this.enabled ? x : 0;
    this.y = this.enabled ? y : 0;
    this.interactPressed = this.interactQueued;
    this.interactQueued = false;
  }
}

const MOVE_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
]);

function isTypingTarget(t: EventTarget | null): boolean {
  return t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
}
