import { factById, SOURCES } from '../content/facts';
import { STORIES, type Story } from '../content/stories';
import { el } from './dom';
import { StoryCard } from './StoryCard';

export interface BrochureViewOpts {
  mode: 'finale' | 'fallback';
  visited?: Set<string>;
  note?: string;
  onBack?: () => void;
  backLabel?: string;
}

const PANEL_TITLES: Record<number, string> = {
  1: 'Cover',
  2: 'First steps: Marseille 1882 and Paris 1883',
  3: 'The eye doctor: Paris 1885 to 1886',
  4: "The World's Fair: Paris 1889",
  5: 'Historian and novelist: Paris 1889 and Biarritz 1891',
  6: 'Farewell and lessons: Marseille 1891',
};

function citedSources(): { key: string; text: string }[] {
  const keys = new Set<string>();
  for (const story of STORIES) {
    for (const fid of story.factIds) {
      const fact = factById(fid);
      if (!fact) continue;
      for (const sk of fact.sources) keys.add(sk);
    }
  }
  return [...keys]
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))
    .map((key) => ({ key, text: SOURCES[key] ?? key }))
    .filter((entry) => Boolean(entry.text));
}

export function showBrochureView(parent: HTMLElement, opts: BrochureViewOpts): HTMLElement {
  const isFinale = opts.mode === 'finale';
  const visited = opts.visited;
  const refs = citedSources();

  const printNote = el('p', {
    class: 'brochure-print-note',
    role: 'status',
    'aria-live': 'polite',
  });
  const printBtn = el('button', { class: 'brochure-btn is-primary', type: 'button' }, [
    'Print brochure',
  ]);
  printBtn.addEventListener('click', () => {
    printNote.textContent = '';
    let didPrint = false;
    const onBefore = (): void => {
      didPrint = true;
    };
    window.addEventListener('beforeprint', onBefore, { once: true });
    try {
      window.print();
    } catch {
      window.removeEventListener('beforeprint', onBefore);
      printNote.textContent = 'Printing works in the GitHub Pages version of this site.';
      return;
    }
    window.setTimeout(() => {
      window.removeEventListener('beforeprint', onBefore);
      if (!didPrint && window.self !== window.top) {
        printNote.textContent = 'Printing works in the GitHub Pages version of this site.';
      }
    }, 250);
  });

  const backBtn = opts.onBack
    ? el('button', { class: 'brochure-btn', type: 'button' }, [opts.backLabel ?? 'Back'])
    : null;

  const card = new StoryCard(parent);
  card.root.classList.add('is-brochure-card');

  const openStory = (story: Story): void => {
    card.show(story, {
      onClose: () => {},
      hideAction: true,
    });
  };

  const renderPanel = (panelNum: 1 | 2 | 3 | 4 | 5 | 6): HTMLElement => {
    const foldDir = panelNum % 2 === 1 ? 'is-odd' : 'is-even';
    const panel = el('article', {
      class: `brochure-panel ${foldDir}`,
      'data-panel': String(panelNum),
    });

    if (panelNum === 1) {
      panel.classList.add('is-cover');
      panel.append(
        el('p', { class: 'bp-kicker' }, ['Panel 1 of 6']),
        el('h2', { class: 'bp-cover-title' }, ["Through Rizal's Eyes"]),
        el('p', { class: 'bp-cover-sub' }, ['France, 1882 to 1891']),
        el('p', { class: 'bp-body' }, [
          'France was the first place Jose Rizal set foot in Europe, and the last place he left it.',
        ]),
        el('p', { class: 'bp-credit' }, [
          "Lenard, Software Engineering, Aklan State University. Chapter 9 Activity: A Journey Through Rizal's Travels.",
        ]),
      );
      return panel;
    }

    const stories = STORIES.filter((s) => s.panel === panelNum);
    panel.append(
      el('p', { class: 'bp-kicker' }, [`Panel ${panelNum} of 6`]),
      el('h2', { class: 'bp-heading' }, [PANEL_TITLES[panelNum] ?? `Panel ${panelNum}`]),
    );

    const list = el('div', { class: 'bp-stories' });
    for (const story of stories) {
      const collected = !visited || visited.has(story.id);
      if (isFinale) {
        const itemBtn = el(
          'button',
          {
            class: collected ? 'bp-story-btn' : 'bp-story-btn is-unvisited',
            type: 'button',
          },
          [
            el('span', { class: 'bp-story-date' }, [story.date]),
            el('span', { class: 'bp-story-title' }, [story.title]),
          ],
        );
        itemBtn.addEventListener('click', () => openStory(story));
        const printSummary = el('div', { class: 'bp-print-story' }, [
          el('p', { class: 'bp-story-date' }, [story.date]),
          el('h3', { class: 'bp-story-heading' }, [story.title]),
          ...story.paragraphs.map((p) => el('p', { class: 'bp-body' }, [p])),
        ]);
        list.append(itemBtn, printSummary);
      } else {
        const block = el('section', { class: 'bp-full-story' }, [
          el('p', { class: 'bp-story-date' }, [story.date]),
          el('h3', { class: 'bp-story-heading' }, [story.title]),
          ...story.paragraphs.map((p) => el('p', { class: 'bp-body' }, [p])),
          story.note ? el('p', { class: 'bp-note' }, [story.note]) : null,
        ]);
        list.append(block);
      }
    }
    panel.append(list);

    if (panelNum === 6) {
      panel.append(
        el('div', { class: isFinale ? 'bp-refs-block' : 'bp-print-refs' }, [
          el('h3', { class: 'bp-refs-heading' }, ['References']),
          el(
            'ol',
            { class: 'bp-refs-list' },
            refs.map((r) => el('li', {}, [r.text])),
          ),
        ]),
      );
    }

    return panel;
  };

  const sideA = el('div', { class: 'brochure-side', 'data-side': 'A' }, [
    renderPanel(1),
    renderPanel(2),
    renderPanel(3),
  ]);
  const sideB = el('div', { class: 'brochure-side', 'data-side': 'B' }, [
    renderPanel(4),
    renderPanel(5),
    renderPanel(6),
  ]);

  const refsSection = el('section', { class: 'brochure-refs', 'aria-labelledby': 'refs-title' }, [
    el('h2', { id: 'refs-title', class: 'brochure-refs-title' }, ['References']),
    el(
      'ol',
      { class: 'brochure-refs-list' },
      refs.map((r) => el('li', {}, [r.text])),
    ),
  ]);

  const header = el('header', { class: 'brochure-header' }, [
    el('div', { class: 'brochure-header-copy' }, [
      el('h1', { class: 'brochure-title' }, [
        isFinale ? 'Your finished brochure' : "Through Rizal's Eyes: Brochure",
      ]),
      el('p', { class: 'brochure-sub' }, [
        isFinale
          ? 'Six Z-fold panels from Marseille to Paris, Biarritz and back. Select any story title to read it again.'
          : 'France, 1882 to 1891. All six panels of Jose Rizal in France.',
      ]),
      opts.note ? el('p', { class: 'brochure-banner' }, [opts.note]) : null,
    ]),
    el('div', { class: 'brochure-actions' }, [printBtn, backBtn]),
    printNote,
  ]);

  const root = el(
    'section',
    {
      class: `brochure-view ${isFinale ? 'is-finale' : 'is-fallback'}`,
      role: 'region',
      'aria-label': 'Travel brochure',
    },
    isFinale
      ? [header, el('div', { class: 'brochure-fold' }, [sideA, sideB])]
      : [header, el('div', { class: 'brochure-fold' }, [sideA, sideB]), refsSection],
  );
  parent.append(root);

  backBtn?.addEventListener('click', () => {
    card.root.remove();
    root.remove();
    opts.onBack?.();
  });

  return root;
}
