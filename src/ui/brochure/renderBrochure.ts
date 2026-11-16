/**
 * The finished brochure: a real A4 landscape Z-fold, printed on both sides.
 *   Side A (outside): panel 1 (cover) | panel 2 | panel 3
 *   Side B (inside):  panel 4 | panel 5 | panel 6
 * The same markup is used on screen (scaled to fit) and in print (true millimetres).
 *
 * Design: the player's ink snapshots are taped-in prints, train journeys are travel stubs,
 * each city gets a postmark, and one vermilion route runs through every panel like the trail
 * in the game. Every panel has its own layout so the six panels never read as one list.
 *
 * All text comes from the verified content files; this module only arranges it.
 * After inserting the brochure into the page, call layoutBrochure() to draw the route.
 */
import { STORIES, type Story } from '../../content/stories';
import { scenesFor } from '../../content/narrative';
import { SOURCES, factById } from '../../content/facts';
import { routeMapSvg } from './routeMap';
import { postmarkSvg } from './postmark';

export interface BrochureInput {
  /** Story ids the player has seen. Unseen stories are still listed, with an empty frame. */
  visited: ReadonlySet<string>;
  /** Ink snapshot image URLs keyed by story id. */
  snapshots: ReadonlyMap<string, string>;
  credit: { name: string; course: string; activity: string };
}

type PanelNo = 2 | 3 | 4 | 5 | 6;

const PANELS: Record<PanelNo, { title: string; place: string }> = {
  2: { title: 'First steps', place: 'Marseille 1882 and Paris 1883' },
  3: { title: 'The eye doctor', place: 'Paris, 1885 to 1886' },
  4: { title: "The World's Fair", place: 'Paris, 1889' },
  5: { title: 'The historian and the novelist', place: 'Paris 1889 to Biarritz 1891' },
  6: { title: 'Farewell to Europe', place: 'Marseille, 1891' },
};

/**
 * How each story is laid out.
 * bleed: full-width picture at the top of the panel, with the panel title on it.
 * tall: a tall picture with the year set large over it.
 * feature: a full-width picture with the text below.
 * stop: a small picture beside the text, alternating sides down the panel.
 * ticket: a travel stub for a journey between cities (only places and dates from the facts).
 * closing: the last story, set as a dark card.
 */
type Layout =
  | { kind: 'bleed' | 'tall' | 'feature' | 'stop' | 'closing' }
  | { kind: 'ticket'; from: string; to: string };

const LAYOUT: Record<string, Layout> = {
  'marseille-landing': { kind: 'bleed' },
  'marseille-chateau-dif': { kind: 'stop' },
  'marseille-station': { kind: 'ticket', from: 'Marseille', to: 'Barcelona' },
  'paris-1883-hotel': { kind: 'stop' },
  'paris-1883-hospital': { kind: 'stop' },
  'paris-1883-station': { kind: 'ticket', from: 'Paris', to: 'Madrid' },
  'paris-1885-clinic': { kind: 'feature' },
  'paris-1885-studio': { kind: 'feature' },
  'paris-1885-station': { kind: 'ticket', from: 'Paris', to: 'Heidelberg' },
  'paris-1889-tower': { kind: 'tall' },
  'paris-1889-indios-bravos': { kind: 'stop' },
  'paris-1889-godfather': { kind: 'stop' },
  'paris-1889-morga': { kind: 'stop' },
  'paris-1889-station': { kind: 'ticket', from: 'Paris', to: 'Brussels' },
  'biarritz-villa': { kind: 'stop' },
  'biarritz-manuscript': { kind: 'feature' },
  'biarritz-station': { kind: 'ticket', from: 'Paris', to: 'Marseille' },
  'marseille-1891-melbourne': { kind: 'stop' },
  'marseille-1891-lessons': { kind: 'closing' },
};

function layoutOf(story: Story): Layout {
  return LAYOUT[story.id] ?? { kind: 'stop' };
}

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

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December';
const LEADING_DATE = new RegExp(
  `^(?:[A-Z][a-z]+day, )?(?:(?:${MONTHS})(?: \\d{1,2})?,? )?\\d{4}\\.\\s*`,
);

/** The date already sits above the summary, so drop a caption that opens with the same date. */
function summaryOf(story: Story): string {
  const captions = scenesFor(story.id)?.captions ?? [];
  return captions.join(' ').replace(LEADING_DATE, '');
}

/** Which city chapter a story belongs to, used for postmarks. */
function cityOf(story: Story): { city: string; year: string } {
  if (story.area === 'paris') return { city: 'Paris', year: story.era ?? '' };
  if (story.area === 'biarritz-1891') return { city: 'Biarritz', year: '1891' };
  return { city: 'Marseille', year: story.area === 'marseille-1882' ? '1882' : '1891' };
}

/** Story ids that open a new city chapter: they carry a postmark. */
const FIRST_IN_CITY = new Set(
  STORIES.filter((s, i) => {
    const prev = STORIES[i - 1];
    if (!prev) return true;
    const a = cityOf(s);
    const b = cityOf(prev);
    return a.city !== b.city || a.year !== b.year;
  }).map((s) => s.id),
);

/** A small, fixed tilt per story so prints look placed by hand, the same on every render. */
function tiltOf(id: string): number {
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) % 997;
  return ((n % 7) - 3) * 0.45;
}

function print(story: Story, input: BrochureInput, cls: string): HTMLElement {
  const snap = input.visited.has(story.id) ? input.snapshots.get(story.id) : undefined;
  const fig = h('figure', `b-print ${cls}${snap ? '' : ' is-empty'}`);
  fig.style.setProperty('--tilt', `${tiltOf(story.id)}deg`);
  if (snap) {
    const img = document.createElement('img');
    img.src = snap;
    img.alt = `Ink sketch of the scene: ${story.title}`;
    img.decoding = 'async';
    fig.append(h('div', 'b-print__frame', [img]));
  } else {
    fig.append(h('div', 'b-print__frame', [h('span', 'b-print__empty', ['Not visited'])]));
  }
  if (FIRST_IN_CITY.has(story.id)) {
    const { city, year } = cityOf(story);
    const mark = h('div', 'b-postmark');
    mark.innerHTML = postmarkSvg(city, year, story.id);
    mark.setAttribute('role', 'img');
    mark.setAttribute('aria-label', `${city}, ${year}`);
    fig.append(mark);
  }
  return fig;
}

function text(story: Story, extra: (Node | null)[] = []): HTMLElement {
  return h('div', 'b-text', [
    h('p', 'b-date', [story.date]),
    h('h3', 'b-title', [story.title]),
    h('p', 'b-summary', [summaryOf(story)]),
    ...extra,
  ]);
}

/**
 * Marks the element the route passes through. 'print' runs it down the middle of a small
 * print; 'lane' runs it down the free lane on the left of a full-width story.
 */
function routeNode<T extends HTMLElement>(el: T, anchor: 'print' | 'lane'): T {
  el.dataset.route = anchor;
  return el;
}

function bleed(story: Story, input: BrochureInput, panel: PanelNo): HTMLElement {
  const meta = PANELS[panel];
  const top = routeNode(
    h('div', 'b-bleed', [
      print(story, input, 'b-print--bleed'),
      h('header', 'b-bleed__head', [
        h('h2', 'b-panel__title', [meta.title]),
        h('p', 'b-panel__place', [meta.place]),
      ]),
    ]),
    'lane',
  );
  return h('article', 'b-story b-story--bleed b-lane', [top, text(story)]);
}

function tall(story: Story, input: BrochureInput): HTMLElement {
  const pic = print(story, input, 'b-print--tall');
  const year = h('span', 'b-bigyear', [story.date.replace(/\D+/g, '').slice(0, 4)]);
  year.setAttribute('aria-hidden', 'true');
  return h('article', 'b-story b-story--tall b-lane', [
    routeNode(h('div', 'b-tall', [pic, year]), 'lane'),
    text(story),
  ]);
}

function feature(story: Story, input: BrochureInput): HTMLElement {
  return h('article', 'b-story b-story--feature b-lane', [
    routeNode(print(story, input, 'b-print--feature'), 'lane'),
    text(story),
  ]);
}

function stop(story: Story, input: BrochureInput, side: 'left' | 'right'): HTMLElement {
  return h('article', `b-story b-story--stop is-${side}`, [
    routeNode(print(story, input, 'b-print--stop'), 'print'),
    text(story),
  ]);
}

function ticket(story: Story, input: BrochureInput, from: string, to: string): HTMLElement {
  const seen = input.visited.has(story.id);
  const stub = routeNode(
    h('div', 'b-ticket__stub', [
      h('p', 'b-ticket__from', [from]),
      h('p', 'b-ticket__to', [`to ${to}`]),
      h('p', 'b-ticket__date', [story.date]),
    ]),
    'print',
  );
  const body = h('div', 'b-ticket__body', [
    h('h3', 'b-title', [story.title]),
    h('p', 'b-summary', [summaryOf(story)]),
    seen ? null : h('p', 'b-unseen-note', ['Not visited on this ride.']),
  ]);
  const art = h('article', `b-story b-ticket${seen ? '' : ' is-unseen'}`, [stub, body]);
  art.setAttribute('aria-label', `Journey from ${from} to ${to}, ${story.date}`);
  return art;
}

function closing(story: Story, input: BrochureInput): HTMLElement {
  const lessons = h(
    'ul',
    'b-closing__lessons',
    story.paragraphs.map((p) => {
      const cut = p.indexOf('. ');
      if (cut < 0) return h('li', '', [p]);
      return h('li', '', [h('strong', '', [p.slice(0, cut + 1)]), ` ${p.slice(cut + 2)}`]);
    }),
  );
  return h('article', 'b-story b-closing', [
    h('p', 'b-date', [story.date]),
    h('h3', 'b-closing__title', [story.title]),
    lessons,
    input.visited.has(story.id) ? null : h('p', 'b-unseen-note', ['Not visited on this ride.']),
  ]);
}

function references(): HTMLElement {
  // Titles link to the source on screen; the printed copy points readers to the site for links.
  const list = h(
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
  return h('footer', 'b-refs', [
    h('h3', 'b-refs__title', ['References']),
    list,
    h('p', 'b-refs__note', ['Links to every source are in the online brochure.']),
  ]);
}

function storyPanel(no: PanelNo, input: BrochureInput): HTMLElement {
  const meta = PANELS[no];
  const stories = STORIES.filter((s) => s.panel === no);
  const opensWithBleed = stories[0] && layoutOf(stories[0]).kind === 'bleed';
  const panel = h('section', `b-panel b-panel--${no}`);
  panel.setAttribute('aria-label', `Panel ${no}: ${meta.title}`);
  panel.append(h('div', 'b-route'));
  if (!opensWithBleed) {
    panel.append(
      h('header', 'b-panel__head', [
        h('h2', 'b-panel__title', [meta.title]),
        h('p', 'b-panel__place', [meta.place]),
      ]),
    );
  }
  const flow = h('div', 'b-flow');
  let side: 'left' | 'right' = 'left';
  for (const s of stories) {
    const l = layoutOf(s);
    if (l.kind === 'bleed') flow.append(bleed(s, input, no));
    else if (l.kind === 'tall') flow.append(tall(s, input));
    else if (l.kind === 'feature') flow.append(feature(s, input));
    else if (l.kind === 'ticket') flow.append(ticket(s, input, l.from, l.to));
    else if (l.kind === 'closing') flow.append(closing(s, input));
    else {
      flow.append(stop(s, input, side));
      side = side === 'left' ? 'right' : 'left';
    }
  }
  panel.append(flow);
  if (no === 6) panel.append(references());
  return panel;
}

function cover(input: BrochureInput): HTMLElement {
  const map = h('figure', 'b-map');
  map.innerHTML = routeMapSvg();
  return h('section', 'b-panel b-panel--1 b-cover', [
    h('div', 'b-cover__block', [
      h('h1', 'b-cover__title', ["Through Rizal's Eyes"]),
      h('p', 'b-cover__sub', ['France, 1882 to 1891']),
    ]),
    map,
    h('p', 'b-cover__intro', [
      'France was the first place Jose Rizal set foot in Europe, and the last place he left it. Follow him from a 20-year-old student on his way to Spain to a published novelist leaving Europe.',
    ]),
    h('p', 'b-cover__credit', [
      `${input.credit.name}. ${input.credit.course}. ${input.credit.activity}.`,
    ]),
  ]);
}

/** One shared SVG filter turns every snapshot into the same two-ink print. */
function inkFilter(): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'b-defs');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `<filter id="b-ink" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.125 0.2 0.62 0.949"/>
      <feFuncG type="table" tableValues="0.196 0.27 0.61 0.918"/>
      <feFuncB type="table" tableValues="0.29 0.36 0.6 0.847"/>
    </feComponentTransfer>
  </filter>`;
  return svg;
}

/** Builds both sides of the brochure. Insert it, then call layoutBrochure() and fitBrochure(). */
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
  const root = h('div', 'b-brochure', [sideA, sideB]);
  root.prepend(inkFilter());
  return root;
}

/* ------------------------------------------------------------------ */
/* The route                                                           */
/* ------------------------------------------------------------------ */

const PANEL_W = 99;
const PANEL_H = 210;
/** Full-width stories keep a lane free on the left for the route (see .b-lane in the CSS). */
const LANE_X = 9.6;

interface Node2 {
  x: number;
  /** Bottom of the picture in this story, where the panel 2 route starts. */
  picBottom: number;
  top: number;
  bottom: number;
}

const f = (n: number): string => n.toFixed(2);

/** A smooth S-bend from one point down to the next, staying inside the gap between them. */
function bend(x1: number, y1: number, x2: number, y2: number): string {
  const k = Math.max(2, (y2 - y1) * 0.85);
  return `C ${f(x1)} ${f(y1 + k)} ${f(x2)} ${f(y2 - k)} ${f(x2)} ${f(y2)}`;
}

function drawPanelRoute(panel: HTMLElement): void {
  const layer = panel.querySelector<HTMLElement>(':scope > .b-route');
  if (!layer) return;
  const box = panel.getBoundingClientRect();
  if (box.width === 0) return;
  const mm = box.width / PANEL_W;
  const nodes: Node2[] = [...panel.querySelectorAll<HTMLElement>('[data-route]')].map((el) => {
    const r = el.getBoundingClientRect();
    const row = (el.closest('.b-story') ?? el).getBoundingClientRect();
    const pic = el.querySelector('.b-print') ?? el;
    return {
      picBottom: (pic.getBoundingClientRect().bottom - box.top) / mm,
      x: el.dataset.route === 'lane' ? LANE_X : (r.left + r.width / 2 - box.left) / mm,
      top: (row.top - box.top) / mm,
      bottom: (row.bottom - box.top) / mm,
    };
  });
  if (nodes.length === 0) {
    layer.innerHTML = '';
    return;
  }

  const no = Number(/b-panel--(\d)/.exec(panel.className)?.[1] ?? 0);
  const first = nodes[0]!;
  const last = nodes[nodes.length - 1]!;
  let d = '';

  // Enter from the fold on the left, under the heading, unless the panel opens on a picture.
  if (no === 2) {
    d = `M ${f(first.x)} ${f(first.picBottom + 1.5)}`;
  } else {
    const yIn = Math.max(4, first.top - 3.2);
    d = `M 0 ${f(yIn)} C ${f(first.x * 0.6)} ${f(yIn)} ${f(first.x)} ${f(yIn)} ${f(first.x)} ${f(first.top + 2)}`;
  }
  // Down through each print (hidden behind it), then bend across the gap to the next one.
  nodes.forEach((n, i) => {
    d += ` L ${f(n.x)} ${f(n.bottom)}`;
    const next = nodes[i + 1];
    if (next) d += ` ${bend(n.x, n.bottom, next.x, next.top)}`;
  });

  let end = '';
  if (no === 6) {
    // The journey ends at the last port: a dot and an arrow out to sea.
    end = `<circle cx="${f(last.x)}" cy="${f(last.bottom)}" r="1.2" class="b-route__end"/>`;
  } else {
    // Leave across the fold on the right, toward the next panel.
    const yOut = Math.min(PANEL_H - 4, last.bottom + 3.2);
    d += ` C ${f(last.x)} ${f(yOut)} ${f(last.x + (PANEL_W - last.x) * 0.4)} ${f(yOut)} ${f(PANEL_W)} ${f(yOut)}`;
  }
  const start =
    no === 2
      ? `<circle cx="${f(first.x)}" cy="${f(first.picBottom + 1.5)}" r="1.2" class="b-route__end"/>`
      : '';

  layer.innerHTML = `<svg viewBox="0 0 ${PANEL_W} ${PANEL_H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" class="b-route__line"/>${start}${end}</svg>`;
}

/**
 * Draws the route through every panel. Call once after the brochure is in the document
 * (it measures the laid-out prints), and again if its contents change. Works at any zoom.
 */
export async function layoutBrochure(root: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await Promise.all(
    [...root.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)),
  );
  root.querySelectorAll<HTMLElement>('.b-panel').forEach(drawPanelRoute);
}

/** Panels whose content does not fit; used by tests and the review script. Should be empty. */
export function overflowingPanels(root: HTMLElement): string[] {
  return [...root.querySelectorAll<HTMLElement>('.b-panel')]
    .filter((p) => {
      const flow = p.querySelector<HTMLElement>('.b-flow');
      if (p.scrollHeight > p.clientHeight + 1) return true;
      // The flow is allowed to shrink; it must still hold every story.
      return flow ? flow.scrollHeight > flow.clientHeight + 1 : false;
    })
    .map((p) => p.getAttribute('aria-label') ?? p.className);
}

/** Scales the millimetre-sized sheets to fit a container's width on screen. */
export function fitBrochure(root: HTMLElement, maxWidthPx: number): void {
  const mm = 96 / 25.4;
  const sheetWidthPx = 297 * mm;
  const scale = Math.min(1, maxWidthPx / sheetWidthPx);
  root.style.setProperty('--b-scale', String(scale));
}

/** Pictures used when nobody has ridden yet, for the read-as-brochure fallback. */
export function defaultSnapshots(): Map<string, string> {
  const files = import.meta.glob<string>('./defaults/*.jpg', {
    eager: true,
    query: '?url',
    import: 'default',
  });
  const out = new Map<string, string>();
  for (const [path, url] of Object.entries(files)) {
    const id = /\/([^/]+)\.jpg$/.exec(path)?.[1];
    if (id) out.set(id, url);
  }
  return out;
}
