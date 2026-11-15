import type { Chapter } from '../content/narrative';
import { el } from './dom';

const DISPLAY_MS = 4200;

const CHAPTER_WORDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
};

/**
 * Full-screen chapter title card styled as soft cardstock over a muted backdrop.
 * Dismisses after ~4 seconds or immediately on any key/pointer input.
 */
export class ChapterCard {
  readonly root: HTMLElement;
  private readonly kicker: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly placeEl: HTMLElement;
  private readonly goalEl: HTMLElement;
  private timer = 0;
  private resolver: (() => void) | null = null;
  private onInput: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.kicker = el('p', { class: 'k-label chapter-kicker' });
    this.titleEl = el('h2', { class: 'k-chapter__title' });
    this.placeEl = el('p', { class: 'k-chapter__place' });
    const rule = el('div', { class: 'k-chapter__rule', 'aria-hidden': 'true' });
    this.goalEl = el('p', { class: 'k-chapter__goal' });
    const hint = el('p', { class: 'k-chapter__hint' }, ['Press any key to ride']);

    const panel = el('article', { class: 'k-card k-chapter' }, [
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
    const word = CHAPTER_WORDS[chapter.number] ?? String(chapter.number);
    this.kicker.textContent = `Chapter ${word}`;
    this.titleEl.textContent = chapter.title;
    this.placeEl.textContent = chapter.place;
    this.goalEl.textContent = chapter.goal;
    this.root.hidden = false;

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
