import { el } from './dom';
import type { Input } from '../core/Input';

/**
 * A floating thumb stick for touch screens. It appears where the thumb lands
 * in the lower left of the screen, so it never sits on top of something important.
 */
export class Joystick {
  private readonly base: HTMLElement;
  private readonly knob: HTMLElement;
  private pointerId: number | null = null;
  private originX = 0;
  private originY = 0;
  private readonly radius = 52;

  constructor(
    parent: HTMLElement,
    private readonly input: Input,
  ) {
    this.knob = el('div', { class: 'stick-knob' });
    this.base = el('div', { class: 'stick', 'aria-hidden': 'true' }, [this.knob]);
    const zone = el('div', { class: 'stick-zone', 'aria-hidden': 'true' });
    parent.append(zone, this.base);

    zone.addEventListener('pointerdown', (e) => {
      if (this.pointerId !== null) return;
      this.pointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      this.originX = e.clientX;
      this.originY = e.clientY;
      this.base.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      this.base.classList.add('is-active');
      this.move(e.clientX, e.clientY);
    });
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.pointerId) this.move(e.clientX, e.clientY);
    });
    const end = (e: PointerEvent): void => {
      if (e.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.base.classList.remove('is-active');
      this.knob.style.transform = '';
      this.input.setStick(0, 0);
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  private move(x: number, y: number): void {
    let dx = x - this.originX;
    let dy = y - this.originY;
    const len = Math.hypot(dx, dy);
    if (len > this.radius) {
      dx = (dx / len) * this.radius;
      dy = (dy / len) * this.radius;
    }
    this.knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.input.setStick(dx / this.radius, dy / this.radius);
  }
}
