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

  constructor(parent: HTMLElement) {
    this.body = el('div', { class: 'card-body' });
    const close = el(
      'button',
      { class: 'card-close', type: 'button', 'aria-label': 'Close story' },
      ['Close'],
    );
    close.addEventListener('click', () => this.hide());
    this.root = el(
      'aside',
      {
        class: 'card',
        role: 'dialog',
        'aria-modal': 'false',
        'aria-labelledby': 'card-title',
        tabindex: '-1',
        hidden: '',
      },
      [close, this.body],
    );
    parent.append(this.root);
    addEventListener('keydown', (e) => {
      if (this.open && e.key === 'Escape') this.hide();
    });
  }

  show(story: Story, handlers: { onClose: () => void; onAction?: (s: Story) => void }): void {
    this.onClose = handlers.onClose;
    this.onAction = handlers.onAction ?? null;
    this.lastFocus = document.activeElement as HTMLElement | null;
    this.body.replaceChildren(...this.render(story));
    this.root.hidden = false;
    // Next frame so the transition runs from the hidden state.
    requestAnimationFrame(() => this.root.classList.add('is-open'));
    this.open = true;
    this.root.focus({ preventScroll: true });
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.root.classList.remove('is-open');
    setTimeout(() => {
      if (!this.open) this.root.hidden = true;
    }, 350);
    this.lastFocus?.focus?.({ preventScroll: true });
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
  }

  private render(story: Story): Node[] {
    const sourceKeys = [...new Set(story.factIds.flatMap((id) => factById(id)?.sources ?? []))];
    const nodes: Node[] = [
      el('p', { class: 'card-panel' }, [`Brochure panel ${story.panel} of 6`]),
      el('p', { class: 'card-date' }, [story.date]),
      el('h2', { class: 'card-title', id: 'card-title' }, [story.title]),
      ...story.paragraphs.map((p) => el('p', { class: 'card-text' }, [p])),
    ];
    if (story.note) nodes.push(el('p', { class: 'card-note' }, [story.note]));
    if (story.action) {
      const btn = el('button', { class: 'card-action', type: 'button' }, [story.action.label]);
      btn.addEventListener('click', () => this.onAction?.(story));
      nodes.push(btn);
    }
    const sources = el('details', { class: 'card-sources' }, [
      el('summary', {}, ['Sources']),
      el(
        'ul',
        {},
        sourceKeys.map((k) => el('li', {}, [SOURCES[k] ?? k])),
      ),
    ]);
    nodes.push(sources);
    return nodes;
  }
}
