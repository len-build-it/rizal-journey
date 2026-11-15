import { el } from './dom';

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

    this.root = el('div', { class: 'hud' }, [where, brochure, this.prompt, this.toastEl]);
    parent.append(this.root);
    this.setPanels(new Set());
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
