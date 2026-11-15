/**
 * Preview pages for the UI kit and the finished brochure (reviewer reference only).
 * Placeholder pictures stand in for the ink snapshots the game captures.
 */
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/literata/standard.css';
import '@fontsource-variable/literata/standard-italic.css';
import '../src/ui/kit/kit.css';
import '../src/ui/brochure/brochure.css';
import { STORIES } from '../src/content/stories';
import { fitBrochure, overflowingPanels, renderBrochure } from '../src/ui/brochure/renderBrochure';

function placeholder(i: number): string {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 400;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e2d3b3';
  g.fillRect(0, 0, 600, 400);
  g.strokeStyle = '#20324a';
  g.lineWidth = 3;
  for (let k = 0; k < 7; k++) {
    g.beginPath();
    const y = 80 + k * 40 + (i % 3) * 6;
    g.moveTo(40, y);
    g.bezierCurveTo(200, y - 50 + k * 4, 400, y + 40, 560, y - 10);
    g.stroke();
  }
  return c.toDataURL('image/jpeg', 0.7);
}

const page = document.body.dataset.page;
if (page === 'brochure') {
  const visited = new Set(STORIES.map((s) => s.id).filter((_, i) => i !== 8));
  const snapshots = new Map(
    STORIES.filter((s) => visited.has(s.id)).map((s, i) => [s.id, placeholder(i)]),
  );
  const root = renderBrochure({
    visited,
    snapshots,
    credit: {
      name: 'Lenard',
      course: 'Software Engineering, Aklan State University',
      activity: "Chapter 9 Activity: A Journey Through Rizal's Travels",
    },
  });
  document.getElementById('app')!.append(root);
  const fit = (): void => fitBrochure(root, Math.min(innerWidth - 48, 1500));
  fit();
  (window as unknown as { __overflow: () => string[] }).__overflow = () => overflowingPanels(root);
  addEventListener('resize', fit);
}
