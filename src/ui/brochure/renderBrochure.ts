/**
 * The finished brochure: a real A4 landscape Z-fold, printed on both sides.
 *   Side A (outside): panel 1 (cover) | panel 2 | panel 3
 *   Side B (inside):  panel 4 | panel 5 | panel 6
 * The same markup is used on screen (scaled to fit) and in print (true millimetres).
 *
 * All text comes from the verified content files; this module only arranges it.
 */
import { STORIES, type Story } from '../../content/stories';
import { scenesFor } from '../../content/narrative';
import { SOURCES, factById } from '../../content/facts';
import { routeMapSvg } from './routeMap';

export interface BrochureInput {
  /** Story ids the player has seen. Unseen stories are still listed, without a picture. */
  visited: ReadonlySet<string>;
  /** Ink snapshot data URLs keyed by story id. */
  snapshots: ReadonlyMap<string, string>;
  credit: { name: string; course: string; activity: string };
}

type PanelNo = 2 | 3 | 4 | 5 | 6;

const PANELS: Record<PanelNo, { label: string; title: string; place: string }> = {
  2: { label: 'Panel two', title: 'First steps', place: 'Marseille 1882 and Paris 1883' },
  3: { label: 'Panel three', title: 'The eye doctor', place: 'Paris, 1885 to 1886' },
  4: { label: 'Panel four', title: "The World's Fair", place: 'Paris, 1889' },
  5: {
    label: 'Panel five',
    title: 'The historian and the novelist',
    place: 'Paris 1889 to Biarritz 1891',
  },
  6: { label: 'Panel six', title: 'Farewell to Europe', place: 'Marseille, 1891' },
};

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls: string,
  children: (Node | string | null)[] = [],
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  for (const c of children)
    if (c != null) n.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return n;
}

export interface Reference {
  text: string;
  url?: string;
}

/** Every source cited by a story or a scene caption, in the order of the source list. */
export function citedReferences(): Reference[] {
  const used = new Set<string>();
  for (const s of STORIES) {
    const ids = [...s.factIds, ...(scenesFor(s.id)?.factIds ?? [])];
    for (const id of ids) for (const src of factById(id)?.sources ?? []) used.add(src);
  }
  return Object.keys(SOURCES)
    .filter((k) => used.has(k))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((k) => {
      const full = SOURCES[k]!;
      const at = full.search(/https?:\/\//);
      if (at < 0) return { text: full };
      return { text: full.slice(0, at).trim(), url: full.slice(at).trim() };
    });
}

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const LEADING_DATE = new RegExp(`^(?:[A-Z][a-z]+day, )?(?:(?:${MONTHS})(?: \\d{1,2})?,? )?\\d{4}\\.\\s*`);

/** The date already sits above the summary, so drop a caption that opens with the same date. */
function withoutLeadingDate(text: string): string {
  return text.replace(LEADING_DATE, '');
}

function entry(story: Story, input: BrochureInput): HTMLElement {
  const seen = input.visited.has(story.id);
  const snap = input.snapshots.get(story.id);
  const art = h('article', `b-entry${seen ? '' : ' is-unseen'}${snap ? ' has-picture' : ''}`);
  if (snap) {
    const img = document.createElement('img');
    img.src = snap;
    img.alt = `Ink sketch of the scene: ${story.title}`;
    art.append(h('figure', 'b-picture', [img]));
  }
  const body = h('div', 'b-entry__body', [
    h('p', 'b-date', [story.date]),
    h('h3', 'b-title', [story.title]),
  ]);
  const captions = scenesFor(story.id)?.captions ?? [];
  body.append(h('p', 'b-summary', [withoutLeadingDate(captions.join(' '))]));
  if (!seen) body.append(h('p', 'b-unseen-note', ['Not visited on this ride.']));
  art.append(body);
  return art;
}

function storyPanel(no: PanelNo, input: BrochureInput): HTMLElement {
  const meta = PANELS[no];
  const panel = h('section', `b-panel b-panel--${no}`, [
    h('header', 'b-panel__head', [
      h('p', 'b-panel__label', [meta.label]),
      h('h2', 'b-panel__title', [meta.title]),
      h('p', 'b-panel__place', [meta.place]),
    ]),
  ]);
  panel.setAttribute('aria-label', `${meta.label}: ${meta.title}`);
  const list = h('div', 'b-entries');
  for (const s of STORIES.filter((st) => st.panel === no)) list.append(entry(s, input));
  panel.append(list);
  if (no === 6) {
    // Titles link to the source on screen; the printed copy points readers to the site for links.
    const refs = h(
      'ol',
      'b-refs__list',
      citedReferences().map((r) => {
        if (!r.url) return h('li', '', [r.text]);
        const a = document.createElement('a');
        a.href = r.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = r.text;
        return h('li', '', [a]);
      }),
    );
    panel.append(
      h('footer', 'b-refs', [
        h('h3', 'b-refs__title', ['References']),
        refs,
        h('p', 'b-refs__note', ['Links to every source are in the online brochure.']),
      ]),
    );
  }
  return panel;
}

function cover(input: BrochureInput): HTMLElement {
  const map = h('figure', 'b-map');
  map.innerHTML = routeMapSvg();
  return h('section', 'b-panel b-panel--1 b-cover', [
    h('h1', 'b-cover__title', ["Through Rizal's Eyes"]),
    h('p', 'b-cover__sub', ['France, 1882 to 1891']),
    map,
    h('p', 'b-cover__intro', [
      'France was the first place Jose Rizal set foot in Europe, and the last place he left it. Follow him from a 20-year-old student on his way to Spain to a published novelist leaving Europe.',
    ]),
    h('p', 'b-cover__credit', [
      `${input.credit.name}. ${input.credit.course}. ${input.credit.activity}.`,
    ]),
  ]);
}

/** Builds both sides of the brochure. Call fitBrochure() after inserting it on screen. */
export function renderBrochure(input: BrochureInput): HTMLElement {
  const sideA = h('div', 'b-sheet b-sheet--a', [
    cover(input),
    storyPanel(2, input),
    storyPanel(3, input),
  ]);
  const sideB = h('div', 'b-sheet b-sheet--b', [
    storyPanel(4, input),
    storyPanel(5, input),
    storyPanel(6, input),
  ]);
  sideA.setAttribute('aria-label', 'Outside of the brochure');
  sideB.setAttribute('aria-label', 'Inside of the brochure');
  return h('div', 'b-brochure', [sideA, sideB]);
}

/** Panels whose content does not fit; used by tests and the review script. Should be empty. */
export function overflowingPanels(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>('.b-panel')]
    .filter((p) => p.scrollHeight > p.clientHeight + 1)
    .map((p) => p.getAttribute('aria-label') ?? p.className);
}

/** Scales the millimetre-sized sheets to fit a container's width on screen. */
export function fitBrochure(root: HTMLElement, maxWidthPx: number): void {
  const mm = 96 / 25.4;
  const sheetWidthPx = 297 * mm;
  const scale = Math.min(1, maxWidthPx / sheetWidthPx);
  root.style.setProperty('--b-scale', String(scale));
}
