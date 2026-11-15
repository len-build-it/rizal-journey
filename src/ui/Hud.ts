import * as THREE from 'three';
import { el } from './dom';

const _view = new THREE.Vector3();
const _ndc = new THREE.Vector3();
const _targetLift = new THREE.Vector3(0, 1.0, 0);

/**
 * Heads-up display: where you are, the brochure you are filling in,
 * and the prompt that appears when you stand at a story stop.
 */
export class Hud {
  readonly root: HTMLElement;
  private readonly place: HTMLElement;
  private readonly year: HTMLElement;
  private readonly goalEl: HTMLElement;
  private readonly panels: HTMLElement[] = [];
  private readonly foldLabel: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly promptLabel: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly arrow: HTMLElement;
  private toastTimer = 0;
  onPrompt: (() => void) | null = null;

  constructor(parent: HTMLElement, touch: boolean) {
    this.place = el('p', { class: 'hud-place' });
    this.year = el('p', { class: 'hud-year' });
    this.goalEl = el('p', { class: 'hud-goal', hidden: '' });
    const whereTop = el('div', { class: 'hud-where-top' }, [this.year, this.place]);
    const where = el('div', { class: 'hud-where' }, [whereTop, this.goalEl]);

    const strip = el('div', { class: 'fold', role: 'img' });
    for (let i = 1; i <= 6; i++) {
      const p = el('span', { class: 'fold-panel' });
      this.panels.push(p);
      strip.append(p);
    }
    this.foldLabel = el('p', { class: 'fold-label' });
    const brochure = el('div', { class: 'hud-brochure' }, [strip, this.foldLabel]);

    this.promptLabel = el('span', {});
    this.prompt = el('button', { class: 'prompt', type: 'button', hidden: '' }, [
      this.promptLabel,
      el('kbd', { class: 'prompt-key' }, [touch ? 'Tap' : 'E']),
    ]);
    this.prompt.addEventListener('click', () => this.onPrompt?.());

    this.toastEl = el('p', { class: 'toast', role: 'status', 'aria-live': 'polite' });

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    const poly = document.createElementNS(svgNS, 'polygon');
    poly.setAttribute('points', '4,5 21,12 4,19 8.5,12');
    poly.setAttribute('fill', 'currentColor');
    poly.setAttribute('stroke', '#1c2340');
    poly.setAttribute('stroke-width', '1.6');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.append(poly);
    this.arrow = el('div', { class: 'hud-arrow', 'aria-hidden': 'true', hidden: '' }, [svg]);

    this.root = el('div', { class: 'hud' }, [
      where,
      brochure,
      this.prompt,
      this.toastEl,
      this.arrow,
    ]);
    parent.append(this.root);
    this.setPanels(new Set());
  }

  updateArrow(
    targetWorld: THREE.Vector3 | null,
    camera: THREE.Camera,
    hidden: boolean,
  ): void {
    if (hidden || !targetWorld) {
      this.arrow.hidden = true;
      return;
    }

    _ndc.copy(targetWorld).add(_targetLift);
    _view.copy(_ndc).applyMatrix4(camera.matrixWorldInverse);
    _ndc.project(camera);

    if (_view.z < 0 && Math.abs(_ndc.x) <= 0.94 && Math.abs(_ndc.y) <= 0.94) {
      this.arrow.hidden = true;
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    let dx = _view.z < -0.05 ? _ndc.x * (w * 0.5) : _view.x;
    let dy = _view.z < -0.05 ? -_ndc.y * (h * 0.5) : -_view.y;
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
      dx = 0;
      dy = 1;
    }

    const limitX = Math.max(40, w * 0.5 - 30);
    const limitY = Math.max(40, h * 0.5 - 30);
    const scale = Math.max(Math.abs(dx) / limitX, Math.abs(dy) / limitY) || 1;
    const px = w * 0.5 + dx / scale;
    const py = h * 0.5 + dy / scale;
    const angle = Math.atan2(dy, dx);

    this.arrow.hidden = false;
    this.arrow.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%) rotate(${angle.toFixed(3)}rad)`;
  }

  setPlace(year: string, place: string): void {
    this.year.textContent = year;
    this.place.textContent = place;
  }

  setGoal(goal: string | null): void {
    this.goalEl.textContent = goal ?? '';
    this.goalEl.hidden = !goal;
  }

  setPanels(filled: Set<number>): void {
    this.panels.forEach((p, i) => p.classList.toggle('is-filled', filled.has(i + 1)));
    this.foldLabel.textContent = `${filled.size} of 6 panels`;
    const strip = this.panels[0]?.parentElement;
    strip?.setAttribute('aria-label', `Brochure: ${filled.size} of 6 panels filled in`);
  }

  showPrompt(label: string | null): void {
    if (label === null) {
      this.prompt.hidden = true;
      return;
    }
    this.promptLabel.textContent = label;
    this.prompt.hidden = false;
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('is-on');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('is-on'), 3200);
  }
}
