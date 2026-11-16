import { STORIES } from '../content/stories';
import {
  defaultSnapshots,
  fitBrochure,
  layoutBrochure,
  renderBrochure,
} from './brochure/renderBrochure';
import { CREDIT } from './credit';
import { el } from './dom';

export interface BrochureViewOpts {
  mode: 'finale' | 'fallback';
  visited?: Set<string>;
  snapshots?: Record<string, string>;
  note?: string;
  onBack?: () => void;
  backLabel?: string;
}

export function showBrochureView(parent: HTMLElement, opts: BrochureViewOpts): HTMLElement {
  const isFinale = opts.mode === 'finale';
  const visited = isFinale ? (opts.visited ?? new Set<string>()) : new Set(STORIES.map((s) => s.id));
  const snapshots = isFinale
    ? new Map(Object.entries(opts.snapshots ?? {}))
    : defaultSnapshots();

  const printNote = el('p', {
    class: 'brochure-print-note',
    role: 'status',
    'aria-live': 'polite',
  });
  const printBtn = el('button', { class: 'k-btn k-btn--primary', type: 'button' }, [
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
    ? el('button', { class: 'k-btn', type: 'button' }, [opts.backLabel ?? 'Back'])
    : null;

  const header = el('header', { class: 'brochure-header' }, [
    el('div', { class: 'brochure-header-copy' }, [
      el('h1', { class: 'k-display brochure-title' }, [
        isFinale ? 'Your finished brochure' : "Through Rizal's Eyes",
      ]),
      el('p', { class: 'brochure-sub' }, [
        isFinale
          ? 'Six Z-fold panels from Marseille to Paris, Biarritz and back.'
          : 'France, 1882 to 1891. All six panels of Jose Rizal in France.',
      ]),
      opts.note ? el('p', { class: 'brochure-banner' }, [opts.note]) : null,
    ]),
    el('div', { class: 'brochure-actions' }, [printBtn, backBtn]),
    printNote,
  ]);

  const brochure = renderBrochure({
    visited,
    snapshots,
    credit: CREDIT,
  });

  const mount = el('div', { class: 'brochure-mount' }, [brochure]);
  const root = el(
    'section',
    {
      class: `brochure-view ${isFinale ? 'is-finale' : 'is-fallback'}`,
      role: 'region',
      'aria-label': 'Travel brochure',
    },
    [header, mount],
  );
  parent.append(root);

  const fit = (): void => {
    fitBrochure(brochure, Math.min(window.innerWidth - 48, 1240));
  };
  fit();
  void layoutBrochure(brochure).then(() => {
    brochure.dataset.routeReady = 'true';
  });
  window.addEventListener('resize', fit);

  backBtn?.addEventListener('click', () => {
    window.removeEventListener('resize', fit);
    root.remove();
    opts.onBack?.();
  });

  return root;
}
