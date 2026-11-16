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
  private readonly leftStack: HTMLElement;
  private readonly topRight: HTMLElement;
  private readonly menuBtn: HTMLButtonElement;
  private readonly place: HTMLElement;
  private readonly year: HTMLElement;
  private readonly goalEl: HTMLElement;
  private readonly panels: HTMLElement[] = [];
  private readonly foldLabel: HTMLElement;
  private readonly prompt: HTMLElement;
  private readonly promptLabel: HTMLElement;
  private readonly toastEl: HTMLElement;
  private readonly arrow: HTMLElement;
  private readonly arrowIcon: SVGElement;
  private readonly arrowLabel: HTMLElement;
  private toastTimer = 0;
  onPrompt: (() => void) | null = null;
  onMenu: (() => void) | null = null;

  constructor(parent: HTMLElement, touch: boolean) {
    this.place = el('span', { class: 'k-chip__place' });
    this.year = el('span', { class: 'k-chip__year' });
    this.goalEl = el('span', { class: 'k-chip__goal', hidden: '' });
    const whereTop = el('span', { class: 'hud-where-top' }, [this.year, this.place]);
    const where = el('div', { class: 'hud-where k-chip' }, [whereTop, this.goalEl]);
    this.leftStack = el('div', { class: 'hud-left' }, [where]);

    const stampsWrap = el('div', { class: 'hud-stamps k-stamps', role: 'img' });
    for (let i = 1; i <= 6; i++) {
      const s = el('span', { class: 'k-stamp' }, [String(i)]);
      this.panels.push(s);
      stampsWrap.append(s);
    }
    this.foldLabel = el('span', { class: 'k-stamps__count' });
    stampsWrap.append(this.foldLabel);

    this.menuBtn = el(
      'button',
      {
        class: 'hud-menu-btn k-btn k-btn--quiet k-btn--small',
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': 'false',
        'aria-label': 'Menu',
      },
      [buildMenuIcon(), el('span', {}, ['Menu'])],
    ) as HTMLButtonElement;
    this.menuBtn.addEventListener('click', () => this.onMenu?.());
    this.topRight = el('div', { class: 'hud-top-right' }, [stampsWrap, this.menuBtn]);

    this.promptLabel = el('span', { class: 'hud-prompt-label' });
    this.prompt = el('button', { class: 'hud-prompt k-btn k-btn--small', type: 'button' }, [
      this.promptLabel,
      el('kbd', { class: 'k-key' }, [touch ? 'Tap' : 'E']),
    ]);
    this.prompt.addEventListener('click', () => this.onPrompt?.());
    const promptWrap = el('div', { class: 'hud-prompt-wrap', hidden: '' }, [this.prompt]);

    this.toastEl = el('p', {
      class: 'hud-toast k-card k-toast',
      role: 'status',
      'aria-live': 'polite',
    });

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'hud-arrow__icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    const poly = document.createElementNS(svgNS, 'polygon');
    poly.setAttribute('points', '4,5 20,12 4,19 8,12');
    poly.setAttribute('fill', 'currentColor');
    poly.setAttribute('stroke', 'var(--k-ink)');
    poly.setAttribute('stroke-width', '1.4');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.append(poly);
    this.arrowIcon = svg;
    this.arrowLabel = el('span', { class: 'hud-arrow__title' });
    this.arrow = el('div', { class: 'hud-arrow k-chip', 'aria-hidden': 'true', hidden: '' }, [
      this.arrowIcon,
      this.arrowLabel,
    ]);

    this.root = el('div', { class: 'hud' }, [
      this.leftStack,
      this.topRight,
      promptWrap,
      this.toastEl,
      this.arrow,
    ]);
    parent.append(this.root);
    this.setPanels(new Set());
  }

  updateArrow(
    targetWorld: THREE.Vector3 | null,
    targetTitle: string | null,
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

    const marginX = Math.min(110, w * 0.24);
    const marginY = 34;
    const limitX = Math.max(40, w * 0.5 - marginX);
    const limitY = Math.max(40, h * 0.5 - marginY);
    const scale = Math.max(Math.abs(dx) / limitX, Math.abs(dy) / limitY) || 1;
    const px = w * 0.5 + dx / scale;
    let py = h * 0.5 + dy / scale;
    const leftRect = this.leftStack.getBoundingClientRect();
    const rightRect = this.topRight.getBoundingClientRect();
    if (leftRect.width > 0 && px < leftRect.right + 100 && py < leftRect.bottom + 26) {
      py = leftRect.bottom + 26;
    } else if (rightRect.width > 0 && px > rightRect.left - 100 && py < rightRect.bottom + 26) {
      py = rightRect.bottom + 26;
    }
    const angle = Math.atan2(dy, dx);

    this.arrow.hidden = false;
    this.arrowLabel.textContent = targetTitle ?? '';
    this.arrow.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%)`;
    this.arrowIcon.style.transform = `rotate(${angle.toFixed(3)}rad)`;
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
    this.panels.forEach((p, i) => p.classList.toggle('is-stamped', filled.has(i + 1)));
    this.foldLabel.textContent = `${filled.size} of 6`;
    const stampsWrap = this.panels[0]?.parentElement;
    stampsWrap?.setAttribute('aria-label', `Brochure: ${filled.size} of 6 panels`);
  }

  showPrompt(label: string | null): void {
    const wrap = this.prompt.parentElement;
    if (label === null) {
      if (wrap) wrap.hidden = true;
      return;
    }
    this.promptLabel.textContent = label;
    if (wrap) wrap.hidden = false;
  }

  setMenuVisible(visible: boolean): void {
    this.menuBtn.hidden = !visible;
  }

  setMenuExpanded(expanded: boolean): void {
    this.menuBtn.setAttribute('aria-expanded', String(expanded));
  }

  focusMenuButton(): void {
    if (!this.menuBtn.hidden) {
      this.menuBtn.focus({ preventScroll: true });
    }
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('is-on');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('is-on'), 3200);
  }
}

function buildMenuIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('aria-hidden', 'true');
  for (const y of [3.5, 8, 12.5]) {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', '2');
    line.setAttribute('y1', String(y));
    line.setAttribute('x2', '14');
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', '1.8');
    line.setAttribute('stroke-linecap', 'round');
    svg.append(line);
  }
  return svg;
}
