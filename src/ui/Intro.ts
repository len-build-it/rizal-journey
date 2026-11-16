import { el } from './dom';

export interface IntroHandlers {
  hasContinue: boolean;
  onOpen: () => Promise<void> | void;
  onRestart: () => Promise<void> | void;
  onBrochure: () => void;
}

/** Opening overlay paired with the 3D desk scene and brochure buttons. */
export function showIntro(
  parent: HTMLElement,
  touch: boolean,
  handlers: IntroHandlers,
): HTMLElement {
  const openBtn = el('button', { class: 'intro-start k-btn k-btn--primary', type: 'button' }, [
    handlers.hasContinue ? 'Continue your ride' : 'Open the brochure',
  ]);
  const restartBtn = handlers.hasContinue
    ? el('button', { class: 'intro-secondary k-btn k-btn--quiet', type: 'button' }, ['Start over'])
    : null;
  const brochure = el('button', { class: 'intro-link k-btn k-btn--quiet', type: 'button' }, [
    'Read as a brochure',
  ]);

  const controls = touch
    ? 'Drag anywhere on the lower left to ride. Push to the edge to gallop.'
    : 'Ride with WASD or arrow keys. Hold Shift to gallop. Press E at a stop. Esc for the menu.';

  const actions = restartBtn ? [openBtn, restartBtn, brochure] : [openBtn, brochure];

  const root = el('section', { class: 'intro is-desk', 'aria-labelledby': 'intro-title' }, [
    el('div', { class: 'intro-inner k-card' }, [
      el('p', { class: 'k-label intro-kicker' }, ['France, 1882 to 1891']),
      el('h1', { class: 'intro-title k-display', id: 'intro-title' }, ["Through Rizal's Eyes"]),
      el('p', { class: 'intro-text' }, [
        'Ride from stop to stop across France to fill in the six panels of Jose Rizal\'s travel brochure.',
      ]),
      el('p', { class: 'intro-controls' }, [controls]),
      el('div', { class: 'intro-actions' }, actions),
    ]),
  ]);
  parent.append(root);

  let busy = false;
  const trigger = (cb: () => Promise<void> | void): void => {
    if (busy) return;
    busy = true;
    root.classList.add('is-leaving');
    window.setTimeout(() => root.remove(), 420);
    void cb();
  };

  const openConfirm = (): void => {
    if (busy || !restartBtn) return;
    const confirmBtn = el(
      'button',
      { class: 'k-btn k-btn--primary', type: 'button' },
      ['Start over'],
    ) as HTMLButtonElement;
    const keepBtn = el(
      'button',
      { class: 'k-btn', type: 'button' },
      ['Keep my ride'],
    ) as HTMLButtonElement;

    const card = el(
      'div',
      {
        class: 'intro-confirm k-card',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'intro-confirm-msg',
      },
      [
        el('p', { class: 'intro-confirm__msg', id: 'intro-confirm-msg' }, [
          'Start a new ride? Your stamps and snapshots will be cleared.',
        ]),
        el('div', { class: 'intro-confirm__actions' }, [confirmBtn, keepBtn]),
      ],
    );
    const overlay = el('div', { class: 'intro-confirm-overlay' }, [card]);
    parent.append(overlay);
    requestAnimationFrame(() => overlay.classList.add('is-open'));

    const close = (restoreFocus: boolean): void => {
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      if (restoreFocus) restartBtn.focus({ preventScroll: true });
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close(true);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const next = document.activeElement === confirmBtn ? keepBtn : confirmBtn;
        next.focus({ preventScroll: true });
      }
    };

    window.addEventListener('keydown', onKey, true);
    keepBtn.addEventListener('click', () => close(true));
    confirmBtn.addEventListener('click', () => {
      close(false);
      trigger(handlers.onRestart);
    });
    confirmBtn.focus({ preventScroll: true });
  };

  openBtn.addEventListener('click', () => trigger(handlers.onOpen));
  restartBtn?.addEventListener('click', openConfirm);
  brochure.addEventListener('click', () => handlers.onBrochure());

  requestAnimationFrame(() => openBtn.focus({ preventScroll: true }));
  return root;
}
