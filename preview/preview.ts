/**
 * Preview pages for the UI kit and the finished brochure (reviewer reference only).
 * The brochure uses the default snapshots captured from the game.
 */
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/literata/standard.css';
import '@fontsource-variable/literata/standard-italic.css';
import '../src/ui/kit/kit.css';
import '../src/ui/brochure/brochure.css';
import { STORIES } from '../src/content/stories';
import {
  defaultSnapshots,
  fitBrochure,
  layoutBrochure,
  overflowingPanels,
  renderBrochure,
} from '../src/ui/brochure/renderBrochure';

const page = document.body.dataset.page;
if (page === 'brochure') {
  // One stop is left unvisited to show the empty frame; ?unvisited=all shows a ride with no stops.
  const noneVisited = new URLSearchParams(location.search).get('unvisited') === 'all';
  const visited = new Set(
    noneVisited ? [] : STORIES.map((s) => s.id).filter((id) => id !== 'paris-1889-godfather'),
  );
  const snapshots = defaultSnapshots();
  const root = renderBrochure({
    visited,
    snapshots,
    credit: {
      name: 'Lenard Angelo A. Olajay',
      course: 'SE - 2A, Aklan State University',
      activity: "Chapter 9 Activity: A Journey Through Rizal's Travels",
    },
  });
  document.getElementById('app')!.append(root);
  const fit = (): void => fitBrochure(root, Math.min(innerWidth - 48, 1500));
  fit();
  const w = window as unknown as { __overflow: () => string[]; __ready: Promise<void> };
  w.__overflow = () => overflowingPanels(root);
  w.__ready = layoutBrochure(root);
  addEventListener('resize', fit);
}
