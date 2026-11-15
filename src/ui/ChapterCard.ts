import type { Chapter } from '../content/narrative';
import { el } from './dom';

const DISPLAY_MS = 4200;
const GOAL_BEAT_MS = 650;

/**
 * Full-screen chapter title card styled as a printed brochure panel on the night-blue backdrop.
 * Dismisses after ~4 seconds or immediately on any key/pointer input.
 */
export class ChapterCard {
  readonly root: HTMLElement;
  private readonly kicker: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly placeEl: HTMLElement;
  private readonly goalEl: HTMLElement;
  private timer = 0;
  private beatTimer = 0;
  private resolver: (() => void) | null = null;
  private onInput: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.kicker = el('p', { class: 'chapter-kicker' });
    this.titleEl = el('h2', { class: 'chapter-title' });
    this.placeEl = el('p', { class: 'chapter-place' });
    const rule = el('div', { class: 'chapter-rule', 'aria-hidden': 'true' });
    this.goalEl = el('p', { class: 'chapter-goal' });
    const hint = el('p', { class: 'chapter-hint' }, ['Press any key or click to ride']);

    const panel = el('article', { class: 'chapter-panel' }, [
      this.kicker,
      this.titleEl,
      this.placeEl,
      rule,
      this.goalEl,
      hint,
    ]);

    this.root = el(
      'div',
      {
        class: 'chapter-overlay',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-live': 'polite',
        hidden: '',
      },
      [panel],
    );
    parent.append(this.root);
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  show(chapter: Chapter): Promise<void> {
    this.hide();
    this.kicker.textContent = `Chapter ${chapter.number}`;
    this.titleEl.textContent = chapter.title;
    this.placeEl.textContent = chapter.place;
    this.goalEl.textContent = chapter.goal;
    this.root.classList.remove('is-goal-visible');
    this.root.hidden = false;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.root.classList.add('is-goal-visible');
    } else {
      this.beatTimer = window.setTimeout(() => {
        this.root.classList.add('is-goal-visible');
      }, GOAL_BEAT_MS);
    }

    return new Promise((resolve) => {
      this.resolver = resolve;
      const dismiss = (): void => this.hide();
      this.onInput = dismiss;
      window.addEventListener('keydown', dismiss, { once: true, capture: true });
      this.root.addEventListener('pointerdown', dismiss, { once: true });
      this.timer = window.setTimeout(dismiss, DISPLAY_MS);
    });
  }

  hide(): void {
    clearTimeout(this.timer);
    clearTimeout(this.beatTimer);
    if (this.onInput) {
      window.removeEventListener('keydown', this.onInput, { capture: true });
      this.root.removeEventListener('pointerdown', this.onInput);
      this.onInput = null;
    }
    this.root.hidden = true;
    const res = this.resolver;
    this.resolver = null;
    res?.();
  }
}
