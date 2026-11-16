import { el } from './dom';
import type { Story } from '../content/stories';
import { factById, SOURCES } from '../content/facts';

/**
 * The story card: one panel of the brochure, opened at a stop.
 * Desktop shows it beside the scene; phones show it as a bottom sheet.
 */
export class StoryCard {
  readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private onClose: (() => void) | null = null;
  private onAction: ((story: Story) => void) | null = null;
  private lastFocus: HTMLElement | null = null;
  open = false;
  onOpenChange: ((open: boolean) => void) | null = null;

  constructor(parent: HTMLElement) {
    this.body = el('div', { class: 'card-body' });
    this.root = el(
      'aside',
      {
        class: 'card k-card k-story',
        role: 'dialog',
        'aria-modal': 'false',
        'aria-labelledby': 'card-title',
        tabindex: '-1',
        hidden: '',
      },
      [this.body],
    );
    parent.append(this.root);
    addEventListener('keydown', (e) => {
      if (this.open && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    });
  }

  show(
    story: Story,
    handlers: {
      onClose: () => void;
      onAction?: (s: Story) => void;
      actionDisabled?: boolean;
      actionLabel?: string;
      hideAction?: boolean;
    },
  ): void {
    this.onClose = handlers.onClose;
    this.onAction = handlers.onAction ?? null;
    this.lastFocus = document.activeElement as HTMLElement | null;
    this.body.replaceChildren(
      ...this.render(
        story,
        handlers.actionDisabled ?? false,
        handlers.actionLabel,
        handlers.hideAction ?? false,
      ),
    );
    this.root.hidden = false;
    // Next frame so the transition runs from the hidden state.
    requestAnimationFrame(() => this.root.classList.add('is-open'));
    this.open = true;
    this.onOpenChange?.(true);
    this.root.focus({ preventScroll: true });
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.onOpenChange?.(false);
    this.root.classList.remove('is-open');
    setTimeout(() => {
      if (!this.open) this.root.hidden = true;
    }, 350);
    this.lastFocus?.focus?.({ preventScroll: true });
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
  }

  private render(
    story: Story,
    actionDisabled: boolean,
    actionLabel?: string,
    hideAction = false,
  ): Node[] {
    const sourceKeys = [...new Set(story.factIds.flatMap((id) => factById(id)?.sources ?? []))];
    const nodes: Node[] = [
      el('p', { class: 'k-story__date' }, [story.date]),
      el('h2', { class: 'k-story__title', id: 'card-title' }, [story.title]),
      ...story.paragraphs.map((p) => el('p', { class: 'k-story__text' }, [p])),
    ];
    if (story.note) nodes.push(el('p', { class: 'k-story__note' }, [story.note]));

    const closeBtn = el(
      'button',
      { class: 'k-btn k-btn--small', type: 'button', 'aria-label': 'Close story' },
      ['Close'],
    );
    closeBtn.addEventListener('click', () => this.hide());

    const sourceList = el(
      'ul',
      { class: 'card-sources-list', hidden: '' },
      sourceKeys.map((k) => el('li', {}, [SOURCES[k] ?? k])),
    );
    const sourcesBtn = el(
      'button',
      {
        class: 'k-btn k-btn--small k-btn--quiet',
        type: 'button',
        'aria-expanded': 'false',
      },
      ['Sources'],
    );
    sourcesBtn.addEventListener('click', () => {
      const open = sourceList.hidden;
      sourceList.hidden = !open;
      sourcesBtn.setAttribute('aria-expanded', String(open));
    });

    const buttons: HTMLElement[] = [closeBtn, sourcesBtn];
    if (story.action && !hideAction) {
      const label = actionDisabled
        ? (actionLabel ?? 'Visit the other stops first')
        : story.action.label;
      const actionBtn = el(
        'button',
        { class: 'card-action k-btn k-btn--small k-btn--primary', type: 'button' },
        [label],
      );
      if (actionDisabled) actionBtn.disabled = true;
      else actionBtn.addEventListener('click', () => this.onAction?.(story));
      buttons.push(actionBtn);
    }

    nodes.push(el('div', { class: 'card-actions' }, buttons), sourceList);
    return nodes;
  }
}
