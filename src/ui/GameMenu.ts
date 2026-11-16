import { el } from './dom';

export type MenuContext = 'riding' | 'scene' | 'scene-end' | 'travel';

export interface GameMenuHandlers {
  onResume: () => void;
  onSkipScene: () => void;
  onLeaveScene: () => void;
  onSkipJourney: () => void;
  onBrochureSoFar: () => void;
  onPlaces?: () => void;
  onBackToDesk: () => void;
}

/**
 * Centered soft-cardstock pause menu dialog with context-sensitive actions,
 * inline controls reference, Tab focus trapping, and Escape handling.
 */
export class GameMenu {
  readonly root: HTMLElement;
  private readonly card: HTMLElement;
  private readonly titleEl: HTMLElement;
  private readonly body: HTMLElement;
  private readonly onReturnFocus: () => void;
  private controlsOpen = false;
  private currentContext: MenuContext = 'riding';
  private handlers: GameMenuHandlers | null = null;
  private _open = false;

  constructor(
    parent: HTMLElement,
    private readonly touch: boolean,
    onReturnFocus: () => void,
  ) {
    this.onReturnFocus = onReturnFocus;
    this.titleEl = el('h2', { class: 'k-display menu-title', id: 'menu-title' }, ['Paused']);
    this.body = el('div', { class: 'menu-body' });
    this.card = el(
      'div',
      {
        class: 'menu-card k-card',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'menu-title',
        tabindex: '-1',
      },
      [this.titleEl, this.body],
    );
    this.root = el('div', { class: 'menu-overlay', hidden: '' }, [this.card]);
    parent.append(this.root);

    this.root.addEventListener('keydown', (e) => {
      if (!this._open) return;
      if (e.key === 'Tab') {
        this.trapFocus(e);
      }
    });
  }

  get open(): boolean {
    return this._open;
  }

  show(context: MenuContext, handlers: GameMenuHandlers): void {
    this.currentContext = context;
    this.handlers = handlers;
    this.controlsOpen = false;
    this._open = true;
    this.renderMain();
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add('is-open'));
    const firstBtn = this.card.querySelector<HTMLButtonElement>('button:not(:disabled)');
    firstBtn?.focus({ preventScroll: true });
  }

  hide(options: { returnFocus?: boolean } = {}): void {
    if (!this._open) return;
    this._open = false;
    this.root.classList.remove('is-open');
    this.root.hidden = true;
    this.controlsOpen = false;
    if (options.returnFocus !== false) {
      this.onReturnFocus();
    }
  }

  showCustomView(title: string, content: HTMLElement[], focusSelector?: string): void {
    this.titleEl.textContent = title;
    this.body.replaceChildren(...content);
    if (focusSelector) {
      this.card.querySelector<HTMLElement>(focusSelector)?.focus({ preventScroll: true });
    }
  }

  showMainMenu(focusButtonText?: string): void {
    this.renderMain();
    if (focusButtonText) {
      const btn = [...this.card.querySelectorAll<HTMLButtonElement>('button')].find(
        (b) => b.textContent === focusButtonText,
      );
      if (btn) {
        btn.focus({ preventScroll: true });
        return;
      }
    }
    this.card.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({ preventScroll: true });
  }

  private renderMain(): void {
    const h = this.handlers;
    if (!h) return;
    this.titleEl.textContent = 'Paused';

    const btn = (label: string, onClick: () => void, primary = false): HTMLButtonElement => {
      const b = el(
        'button',
        { class: primary ? 'k-btn k-btn--primary menu-btn' : 'k-btn menu-btn', type: 'button' },
        [label],
      ) as HTMLButtonElement;
      b.addEventListener('click', onClick);
      return b;
    };

    const actions: HTMLElement[] = [btn('Resume', () => h.onResume(), true)];

    if (this.currentContext === 'scene') {
      actions.push(btn('Skip to the end', () => h.onSkipScene()));
      actions.push(btn('Leave this scene', () => h.onLeaveScene()));
    } else if (this.currentContext === 'travel') {
      actions.push(btn('Skip the journey', () => h.onSkipJourney()));
    }

    actions.push(btn('Your brochure so far', () => h.onBrochureSoFar()));
    actions.push(btn('Places', () => h.onPlaces?.()));

    const controlsPanel = this.buildControlsPanel();
    controlsPanel.hidden = !this.controlsOpen;

    const controlsBtn = el(
      'button',
      {
        class: 'k-btn menu-btn',
        type: 'button',
        'aria-expanded': String(this.controlsOpen),
      },
      ['Controls'],
    ) as HTMLButtonElement;
    controlsBtn.addEventListener('click', () => {
      this.controlsOpen = !this.controlsOpen;
      controlsPanel.hidden = !this.controlsOpen;
      controlsBtn.setAttribute('aria-expanded', String(this.controlsOpen));
    });

    actions.push(controlsBtn, controlsPanel);
    actions.push(btn('Back to the desk', () => h.onBackToDesk()));

    const saveNote = el('p', { class: 'menu-save-note' }, ['Your progress is saved.']);

    this.body.replaceChildren(el('div', { class: 'menu-actions' }, actions), saveNote);
  }

  private buildControlsPanel(): HTMLElement {
    const rows: [string, string][] = this.touch
      ? [
          ['Lower left', 'Drag to ride, push to the edge to gallop'],
          ['Prompt', 'Tap to visit a stop'],
          ['Captions', 'Tap to continue a scene'],
          ['Menu', 'Tap for this menu'],
        ]
      : [
          ['WASD or arrows', 'To ride'],
          ['Shift', 'To gallop'],
          ['E', 'To visit a stop'],
          ['Space or Enter', 'To continue a scene'],
          ['Escape', 'For this menu'],
        ];

    return el(
      'div',
      { class: 'menu-controls', hidden: '' },
      [
        el(
          'dl',
          { class: 'menu-controls__list' },
          rows.flatMap(([key, desc]) => [
            el('dt', { class: 'menu-controls__key' }, [el('kbd', { class: 'k-key' }, [key])]),
            el('dd', { class: 'menu-controls__desc' }, [desc]),
          ]),
        ),
      ],
    );
  }

  private trapFocus(e: KeyboardEvent): void {
    const focusable = [
      ...this.card.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((node) => !node.hidden && !node.closest('[hidden]'));

    if (focusable.length === 0) {
      e.preventDefault();
      this.card.focus();
      return;
    }

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || !this.card.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last || !this.card.contains(active)) {
      e.preventDefault();
      first.focus();
    }
  }
}
