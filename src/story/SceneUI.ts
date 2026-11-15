import { el } from '../ui/dom';
import type { Story } from '../content/stories';

/**
 * Caption subtitle bar (with aria-live polite announcements) and still-frame end actions
 * displayed during interactive brochure scenes.
 */
export class SceneUI {
  readonly root: HTMLElement;
  private readonly captionBand: HTMLButtonElement;
  private readonly captionText: HTMLElement;
  private readonly actionsBar: HTMLElement;
  private readonly readMoreBtn: HTMLButtonElement;
  private readonly continueBtn: HTMLButtonElement;
  private onAdvance: (() => void) | null = null;
  private onReadMore: (() => void) | null = null;
  private onContinue: (() => void) | null = null;

  constructor(parent: HTMLElement) {
    this.captionText = el('p', { class: 'scene-caption-text' });
    const hint = el('p', { class: 'scene-caption-hint' }, [
      'Click, Space, or Enter to continue \u00b7 Esc to skip',
    ]);
    this.captionBand = el(
      'button',
      {
        class: 'scene-caption-band',
        type: 'button',
        'aria-live': 'polite',
        'aria-label': 'Scene caption, click to advance',
        hidden: '',
      },
      [this.captionText, hint],
    ) as HTMLButtonElement;
    this.captionBand.addEventListener('click', () => this.onAdvance?.());

    this.readMoreBtn = el(
      'button',
      { class: 'scene-btn', type: 'button' },
      ['Read more'],
    ) as HTMLButtonElement;
    this.readMoreBtn.addEventListener('click', () => this.onReadMore?.());

    this.continueBtn = el(
      'button',
      { class: 'scene-btn is-primary', type: 'button' },
      ['Continue riding'],
    ) as HTMLButtonElement;
    this.continueBtn.addEventListener('click', () => this.onContinue?.());

    this.actionsBar = el(
      'div',
      { class: 'scene-actions', role: 'group', 'aria-label': 'Scene choices', hidden: '' },
      [this.readMoreBtn, this.continueBtn],
    );

    this.root = el('div', { class: 'scene-ui', hidden: '' }, [this.captionBand, this.actionsBar]);
    parent.append(this.root);
  }

  start(handlers: { onAdvance: () => void; onReadMore: () => void; onContinue: () => void }): void {
    this.onAdvance = handlers.onAdvance;
    this.onReadMore = handlers.onReadMore;
    this.onContinue = handlers.onContinue;
    this.actionsBar.hidden = true;
    this.captionBand.hidden = false;
    this.captionText.textContent = '';
    this.root.hidden = false;
  }

  setCaption(text: string): void {
    if (this.captionText.textContent !== text) {
      this.captionText.textContent = text;
    }
  }

  showEndFrame(story: Story, actionReady: boolean): void {
    this.captionBand.hidden = true;
    if (story.action) {
      this.continueBtn.textContent = actionReady
        ? story.action.label
        : 'Visit the other stops first';
      this.continueBtn.disabled = !actionReady;
    } else {
      this.continueBtn.textContent = 'Continue riding';
      this.continueBtn.disabled = false;
    }
    this.actionsBar.hidden = false;
    this.continueBtn.focus({ preventScroll: true });
  }

  hideActions(): void {
    this.actionsBar.hidden = true;
  }

  showActions(): void {
    this.actionsBar.hidden = false;
    this.continueBtn.focus({ preventScroll: true });
  }

  hide(): void {
    this.root.hidden = true;
    this.captionBand.hidden = true;
    this.actionsBar.hidden = true;
    this.captionText.textContent = '';
    this.onAdvance = null;
    this.onReadMore = null;
    this.onContinue = null;
  }
}
