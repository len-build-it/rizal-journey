import * as THREE from 'three';
import type { Journey } from '../content/journeys';
import type { Area } from '../world/Area';
import { el } from './dom';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface TravelHandle {
  setPaused(paused: boolean): void;
  skip(): void;
  cancel(): Promise<void>;
}

function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
): SVGElementTagNameMap[K] {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

function buildTrainSvg(): SVGSVGElement {
  const svg = svgEl('svg', {
    class: 'travel-svg',
    viewBox: '0 0 560 96',
    'aria-hidden': 'true',
  });
  // Inked rail line across the full width of the paper spread.
  svg.append(svgEl('line', { x1: '0', y1: '84', x2: '560', y2: '84', class: 'train-rail' }));

  const train = svgEl('g', { class: 'train-group' });
  const ink = 'var(--k-ink)';
  const accent = 'var(--k-vermilion)';
  const paper = 'var(--k-card)';
  // Passenger coach sketched in ink & red hairline.
  train.append(
    svgEl('rect', { x: '14', y: '34', width: '96', height: '38', rx: '3', fill: paper, stroke: ink, 'stroke-width': '2' }),
    svgEl('rect', { x: '10', y: '30', width: '104', height: '6', rx: '2', fill: accent }),
    svgEl('rect', { x: '24', y: '42', width: '16', height: '14', rx: '1', fill: paper, stroke: ink, 'stroke-width': '1.6' }),
    svgEl('rect', { x: '48', y: '42', width: '16', height: '14', rx: '1', fill: paper, stroke: ink, 'stroke-width': '1.6' }),
    svgEl('rect', { x: '72', y: '42', width: '16', height: '14', rx: '1', fill: paper, stroke: ink, 'stroke-width': '1.6' }),
    svgEl('rect', { x: '108', y: '66', width: '12', height: '4', fill: ink }),
    svgEl('circle', { cx: '34', cy: '76', r: '6', fill: paper, stroke: accent, 'stroke-width': '2.2' }),
    svgEl('circle', { cx: '90', cy: '76', r: '6', fill: paper, stroke: accent, 'stroke-width': '2.2' }),
  );

  // Steam locomotive ink sketch.
  train.append(
    svgEl('rect', { x: '120', y: '30', width: '34', height: '40', rx: '2', fill: paper, stroke: ink, 'stroke-width': '2' }),
    svgEl('rect', { x: '117', y: '26', width: '40', height: '5', rx: '2', fill: accent }),
    svgEl('rect', { x: '129', y: '37', width: '14', height: '13', rx: '1', fill: paper, stroke: ink, 'stroke-width': '1.6' }),
    svgEl('rect', { x: '154', y: '40', width: '62', height: '26', rx: '4', fill: paper, stroke: ink, 'stroke-width': '2' }),
    svgEl('rect', { x: '176', y: '32', width: '10', height: '8', rx: '3', fill: accent }),
    svgEl('polygon', { points: '198,40 208,40 211,22 195,22', fill: ink }),
    svgEl('polygon', { points: '216,58 232,74 216,74', fill: paper, stroke: ink, 'stroke-width': '1.8' }),
    svgEl('rect', { x: '122', y: '66', width: '96', height: '5', fill: ink }),
    svgEl('circle', { cx: '136', cy: '75', r: '8', fill: paper, stroke: accent, 'stroke-width': '2.2' }),
    svgEl('circle', { cx: '160', cy: '75', r: '8', fill: paper, stroke: accent, 'stroke-width': '2.2' }),
    svgEl('circle', { cx: '188', cy: '77', r: '6', fill: paper, stroke: accent, 'stroke-width': '2' }),
    svgEl('circle', { cx: '206', cy: '77', r: '6', fill: paper, stroke: accent, 'stroke-width': '2' }),
    // Fine ink steam rings.
    svgEl('circle', { cx: '192', cy: '14', r: '5', fill: 'none', stroke: ink, 'stroke-width': '1.4', opacity: '0.55' }),
    svgEl('circle', { cx: '178', cy: '10', r: '7', fill: 'none', stroke: ink, 'stroke-width': '1.2', opacity: '0.38' }),
    svgEl('circle', { cx: '160', cy: '8', r: '8', fill: 'none', stroke: ink, 'stroke-width': '1', opacity: '0.24' }),
  );
  svg.append(train);
  return svg;
}

/**
 * Page-fold train transition: folds the captured frame of the outgoing scene away like a paper leaf,
 * revealing a paper spread with journey lines printed in sequence and an inked SVG train.
 */
export async function playTrainJourney(
  parent: HTMLElement,
  journey: Journey,
  capturedFrame: string | null,
  prepareArea: () => Promise<void>,
  onHandle?: (handle: TravelHandle) => void,
): Promise<void> {
  const reduced = prefersReducedMotion();
  const linesWrap = el('div', { class: 'travel-lines' });
  const lineEls = journey.lines.map((line) => {
    const p = el('p', { class: reduced ? 'travel-line is-visible' : 'travel-line' }, [line]);
    linesWrap.append(p);
    return p;
  });

  const skipHint = el('button', { class: 'travel-skip k-btn k-btn--small', type: 'button' }, [
    reduced ? 'Continue' : 'Tap or press any key to continue',
  ]);
  const spread = el('div', { class: 'travel-spread k-card' }, [
    el('p', { class: 'k-label travel-kicker' }, ['En route across Europe']),
    buildTrainSvg(),
    linesWrap,
    skipHint,
  ]);
  const cover = el('div', { class: 'travel-cover', 'aria-hidden': 'true' }, [
    capturedFrame ? el('img', { class: 'travel-captured', src: capturedFrame, alt: '' }) : null,
    el('div', { class: 'travel-cover-back' }),
  ]);
  const stage = el('div', { class: 'travel-fold-stage' }, [spread, cover]);
  const root = el('section', { class: 'travel is-spread', role: 'dialog', 'aria-label': 'Train journey' }, [
    stage,
  ]);
  if (reduced) root.classList.add('is-reduced');
  parent.append(root);
  requestAnimationFrame(() => {
    root.classList.add('is-open');
    if (!reduced) {
      requestAnimationFrame(() => root.classList.add('is-folded-open'));
    }
  });

  const areaReady = prepareArea();

  await new Promise<void>((resolve) => {
    let finished = false;
    let paused = false;
    interface TimerEntry {
      id: number;
      endAt: number;
      remaining: number;
      fn: () => void;
      done: boolean;
    }
    const timers: TimerEntry[] = [];

    const scheduleTimer = (ms: number, fn: () => void): void => {
      const entry: TimerEntry = {
        id: 0,
        endAt: performance.now() + ms,
        remaining: ms,
        fn,
        done: false,
      };
      entry.id = window.setTimeout(() => {
        entry.done = true;
        fn();
      }, ms);
      timers.push(entry);
    };

    const clearAllTimers = (): void => {
      for (const t of timers) {
        if (!t.done) clearTimeout(t.id);
      }
    };

    const finish = (): void => {
      if (finished) return;
      finished = true;
      clearAllTimers();
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('click', onTap);
      void areaReady.then(() => {
        root.classList.remove('is-open');
        setTimeout(
          () => {
            root.remove();
            resolve();
          },
          reduced ? 180 : 420,
        );
      });
    };

    const canSkipAt = performance.now() + 260;
    const onKey = (e: KeyboardEvent): void => {
      if (paused || performance.now() < canSkipAt) return;
      if (e.key === 'Tab' || e.key === 'Shift' || e.key === 'Escape') return;
      finish();
    };
    const onTap = (): void => {
      if (paused || performance.now() < canSkipAt) return;
      finish();
    };

    onHandle?.({
      setPaused: (next) => {
        if (finished || paused === next) return;
        paused = next;
        root.classList.toggle('is-paused', next);
        const now = performance.now();
        if (next) {
          for (const t of timers) {
            if (!t.done) {
              clearTimeout(t.id);
              t.remaining = Math.max(0, t.endAt - now);
            }
          }
        } else {
          for (const t of timers) {
            if (!t.done) {
              t.endAt = now + t.remaining;
              t.id = window.setTimeout(() => {
                t.done = true;
                t.fn();
              }, t.remaining);
            }
          }
        }
      },
      skip: () => finish(),
      cancel: async () => {
        if (!finished) {
          finished = true;
          clearAllTimers();
          window.removeEventListener('keydown', onKey);
          root.removeEventListener('click', onTap);
          root.remove();
          resolve();
        }
        await areaReady;
      },
    });

    window.addEventListener('keydown', onKey);
    root.addEventListener('click', onTap);

    if (!reduced) {
      lineEls.forEach((p, i) => {
        scheduleTimer(500 + i * 1450, () => {
          p.classList.add('is-visible');
        });
      });
      scheduleTimer(500 + lineEls.length * 1450 + 800, finish);
    }
  });
}

/**
 * Scripted camera orbit around the rising Eiffel Tower from 1887 to March 31, 1889.
 * Matches milestones from fact F09 and journeys.ts lines.
 */
export async function playTowerTimelapse(
  parent: HTMLElement,
  journey: Journey,
  camera: THREE.PerspectiveCamera,
  area: Area,
  onHandle?: (handle: TravelHandle) => void,
): Promise<void> {
  const center = area.towerCenter ?? new THREE.Vector3(-34, 0, 0);
  const reduced = prefersReducedMotion();

  if (reduced) {
    area.setTowerProgress?.(1);
    camera.position.set(center.x + 48, 24, center.z - 16);
    camera.lookAt(center.x, 19, center.z);
    const caption = el('section', { class: 'timelapse-hud k-band is-reduced' }, [
      el(
        'div',
        { class: 'timelapse-lines' },
        journey.lines.map((l) => el('p', {}, [l])),
      ),
      el('button', { class: 'travel-skip k-btn k-btn--small', type: 'button' }, ['Continue']),
    ]);
    parent.append(caption);
    await new Promise<void>((resolve) => {
      let paused = false;
      let closed = false;
      const done = (): void => {
        if (closed) return;
        closed = true;
        window.removeEventListener('keydown', onKey);
        caption.remove();
        resolve();
      };
      const onKey = (e: KeyboardEvent): void => {
        if (paused || e.key === 'Tab' || e.key === 'Shift' || e.key === 'Escape') return;
        done();
      };
      onHandle?.({
        setPaused: (next) => {
          paused = next;
        },
        skip: done,
        cancel: async () => done(),
      });
      caption.addEventListener('click', () => {
        if (!paused) done();
      });
      window.addEventListener('keydown', onKey);
    });
    return;
  }

  area.setTowerProgress?.(0);
  const lineEl = el('p', { class: 'timelapse-line' }, [journey.lines[0] ?? '']);
  const skipBtn = el('button', { class: 'timelapse-skip k-btn k-btn--small', type: 'button' }, ['Skip']);
  const hud = el('section', { class: 'timelapse-hud k-band', 'aria-live': 'polite' }, [lineEl, skipBtn]);
  parent.append(hud);

  const thresholds = [0, 0.05, 0.55, 0.96];
  const DURATION = 8.0;
  const BUILD_END = 7.1;

  await new Promise<void>((resolve) => {
    let raf = 0;
    let skipped = false;
    let paused = false;
    let elapsed = 0;
    let lastNow = performance.now();
    const canSkipAt = lastNow + 300;
    let lastLineIdx = 0;

    const cleanup = (): void => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      skipBtn.removeEventListener('click', onSkip);
      area.setTowerProgress?.(1);
      hud.remove();
      resolve();
    };

    const onSkip = (): void => {
      if (paused || performance.now() < canSkipAt || skipped) return;
      skipped = true;
      cleanup();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (paused || e.key === 'Tab' || e.key === 'Shift' || e.key === 'Escape') return;
      onSkip();
    };

    onHandle?.({
      setPaused: (next) => {
        if (paused === next) return;
        paused = next;
        if (!next) lastNow = performance.now();
      },
      skip: () => {
        if (skipped) return;
        skipped = true;
        cleanup();
      },
      cancel: async () => {
        if (skipped) return;
        skipped = true;
        cleanup();
      },
    });

    skipBtn.addEventListener('click', onSkip);
    window.addEventListener('keydown', onKey);

    const tick = (now: number): void => {
      if (skipped) return;
      const dt = paused ? 0 : Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      if (!paused) {
        elapsed += dt;
        const t = Math.min(1, elapsed / DURATION);
        const p = Math.min(1, elapsed / BUILD_END);
        area.setTowerProgress?.(p);

        // Show matching milestone line as progress crosses each keyframe.
        let lineIdx = 0;
        for (let i = 0; i < thresholds.length; i++) {
          if (p >= thresholds[i]!) lineIdx = i;
        }
        if (lineIdx !== lastLineIdx) {
          lastLineIdx = lineIdx;
          lineEl.textContent = journey.lines[lineIdx] ?? '';
        }

        const angle = 0.25 + t * Math.PI * 0.72;
        const radius = THREE.MathUtils.lerp(46, 54, t);
        const camY = THREE.MathUtils.lerp(13, 25, t);
        camera.position.set(
          center.x + Math.sin(angle) * radius,
          camY,
          center.z + Math.cos(angle) * radius,
        );
        camera.lookAt(center.x, THREE.MathUtils.lerp(14, 20, t), center.z);

        if (elapsed >= DURATION) {
          cleanup();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  });
}

/** Quick night-blue ink sweep across screen used when riding past the edge margin. */
export async function playInkWipe(
  parent: HTMLElement,
  onMidpoint: () => void,
): Promise<void> {
  const reduced = prefersReducedMotion();
  const wipe = el('div', { class: 'ink-wipe', 'aria-hidden': 'true' });
  parent.append(wipe);

  if (reduced) {
    wipe.classList.add('is-in');
    await new Promise((r) => setTimeout(r, 90));
    onMidpoint();
    wipe.classList.remove('is-in');
    await new Promise((r) => setTimeout(r, 90));
    wipe.remove();
    return;
  }

  requestAnimationFrame(() => wipe.classList.add('is-in'));
  await new Promise((r) => setTimeout(r, 240));
  onMidpoint();
  wipe.classList.add('is-out');
  await new Promise((r) => setTimeout(r, 260));
  wipe.remove();
}
