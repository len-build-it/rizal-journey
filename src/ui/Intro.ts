import { el } from './dom';

export interface IntroHandlers {
  hasContinue: boolean;
  onStart: () => void;
  onContinue: () => void;
  onBrochure: () => void;
}

/** Title screen with the controls for this device. */
export function showIntro(
  parent: HTMLElement,
  touch: boolean,
  handlers: IntroHandlers,
): HTMLElement {
  const start = el(
    'button',
    { class: handlers.hasContinue ? 'intro-secondary' : 'intro-start', type: 'button' },
    [handlers.hasContinue ? 'Start over' : 'Start riding'],
  );
  const cont = handlers.hasContinue
    ? el('button', { class: 'intro-start intro-continue', type: 'button' }, ['Continue'])
    : null;
  const brochure = el('button', { class: 'intro-link', type: 'button' }, ['Read as a brochure']);

  const controls = touch
    ? 'Drag anywhere on the lower left to ride. Push to the edge to gallop.'
    : 'Ride with WASD or the arrow keys. Hold Shift to gallop. Press E at a glowing stop to read its story.';

  const actions = cont ? [cont, start, brochure] : [start, brochure];

  const root = el('section', { class: 'intro', 'aria-labelledby': 'intro-title' }, [
    el('div', { class: 'intro-inner' }, [
      el('h1', { class: 'intro-title', id: 'intro-title' }, ["Through Rizal's Eyes"]),
      el('p', { class: 'intro-sub' }, ['France, 1882 to 1891']),
      el('p', { class: 'intro-text' }, [
        'France was the first place Jose Rizal set foot in Europe, and the last place he left it. Ride from stop to stop to follow his journeys and fill in the six panels of this brochure.',
      ]),
      el('p', { class: 'intro-controls' }, [controls]),
      el('div', { class: 'intro-actions' }, actions),
      el('p', { class: 'intro-credit' }, [
        "Lenard, Software Engineering, Aklan State University. Chapter 9 Activity: A Journey Through Rizal's Travels.",
      ]),
    ]),
  ]);
  parent.append(root);

  const dismiss = (cb: () => void): void => {
    root.classList.add('is-leaving');
    setTimeout(() => root.remove(), 600);
    cb();
  };

  start.addEventListener('click', () => dismiss(handlers.onStart));
  cont?.addEventListener('click', () => dismiss(handlers.onContinue));
  brochure.addEventListener('click', () => handlers.onBrochure());

  const primary = cont ?? start;
  requestAnimationFrame(() => primary.focus({ preventScroll: true }));
  return root;
}
