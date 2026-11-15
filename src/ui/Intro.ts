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
  const openBtn = el('button', { class: 'intro-start', type: 'button' }, [
    'Open the brochure',
  ]);
  const restartBtn = handlers.hasContinue
    ? el('button', { class: 'intro-secondary', type: 'button' }, ['Start over'])
    : null;
  const brochure = el('button', { class: 'intro-link', type: 'button' }, ['Read as a brochure']);

  const controls = touch
    ? 'Drag anywhere on the lower left to ride. Push to the edge to gallop.'
    : 'Ride with WASD or arrow keys. Hold Shift to gallop. Press E at a stop.';

  const actions = restartBtn ? [openBtn, restartBtn, brochure] : [openBtn, brochure];

  const root = el('section', { class: 'intro is-desk', 'aria-labelledby': 'intro-title' }, [
    el('div', { class: 'intro-inner' }, [
      el('p', { class: 'intro-kicker' }, ['France, 1882 to 1891']),
      el('h1', { class: 'intro-title', id: 'intro-title' }, ["Through Rizal's Eyes"]),
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

  openBtn.addEventListener('click', () => trigger(handlers.onOpen));
  restartBtn?.addEventListener('click', () => trigger(handlers.onRestart));
  brochure.addEventListener('click', () => handlers.onBrochure());

  requestAnimationFrame(() => openBtn.focus({ preventScroll: true }));
  return root;
}
