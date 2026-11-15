import { el } from './dom';

/** Title screen with the controls for this device. */
export function showIntro(parent: HTMLElement, touch: boolean, onStart: () => void): HTMLElement {
  const start = el('button', { class: 'intro-start', type: 'button' }, ['Start riding']);
  const controls = touch
    ? 'Drag anywhere on the lower left to ride. Push to the edge to gallop.'
    : 'Ride with WASD or the arrow keys. Hold Shift to gallop. Press E at a glowing stop to read its story.';

  const root = el('section', { class: 'intro', 'aria-labelledby': 'intro-title' }, [
    el('div', { class: 'intro-inner' }, [
      el('h1', { class: 'intro-title', id: 'intro-title' }, ["Through Rizal's Eyes"]),
      el('p', { class: 'intro-sub' }, ['France, 1882 to 1891']),
      el('p', { class: 'intro-text' }, [
        'France was the first place Jose Rizal set foot in Europe, and the last place he left it. Ride from stop to stop to follow his journeys and fill in the six panels of this brochure.',
      ]),
      el('p', { class: 'intro-controls' }, [controls]),
      start,
      el('p', { class: 'intro-credit' }, [
        "Lenard, Software Engineering, Aklan State University. Chapter 9 Activity: A Journey Through Rizal's Travels.",
      ]),
    ]),
  ]);
  parent.append(root);
  start.addEventListener('click', () => {
    root.classList.add('is-leaving');
    setTimeout(() => root.remove(), 600);
    onStart();
  });
  requestAnimationFrame(() => start.focus({ preventScroll: true }));
  return root;
}
