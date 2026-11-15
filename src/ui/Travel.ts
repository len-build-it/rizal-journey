import * as THREE from 'three';
import type { Journey } from '../content/journeys';
import type { Area } from '../world/Area';
import { el } from './dom';

const SVG_NS = 'http://www.w3.org/2000/svg';

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
  // Rail line across the full width.
  svg.append(svgEl('line', { x1: '0', y1: '84', x2: '560', y2: '84', class: 'train-rail' }));

  const train = svgEl('g', { class: 'train-group' });
  // Passenger coach trailing behind the locomotive.
  train.append(
    svgEl('rect', { x: '14', y: '34', width: '96', height: '38', rx: '3', fill: '#3b4259' }),
    svgEl('rect', { x: '10', y: '30', width: '104', height: '6', rx: '2', fill: '#9c3b2a' }),
    svgEl('rect', { x: '24', y: '42', width: '16', height: '14', rx: '1', fill: '#e2b04a' }),
    svgEl('rect', { x: '48', y: '42', width: '16', height: '14', rx: '1', fill: '#e2b04a' }),
    svgEl('rect', { x: '72', y: '42', width: '16', height: '14', rx: '1', fill: '#e2b04a' }),
    svgEl('rect', { x: '108', y: '66', width: '12', height: '4', fill: '#5a5d66' }),
    svgEl('circle', { cx: '34', cy: '76', r: '6', fill: '#9c3b2a' }),
    svgEl('circle', { cx: '90', cy: '76', r: '6', fill: '#9c3b2a' }),
  );

  // Steam locomotive: cab, boiler, funnel and driving wheels.
  train.append(
    svgEl('rect', { x: '120', y: '30', width: '34', height: '40', rx: '2', fill: '#24252b' }),
    svgEl('rect', { x: '117', y: '26', width: '40', height: '5', rx: '2', fill: '#9c3b2a' }),
    svgEl('rect', { x: '129', y: '37', width: '14', height: '13', rx: '1', fill: '#e2b04a' }),
    svgEl('rect', { x: '154', y: '40', width: '62', height: '26', rx: '4', fill: '#2c3244' }),
    svgEl('rect', { x: '176', y: '32', width: '10', height: '8', rx: '3', fill: '#e2b04a' }),
    svgEl('polygon', { points: '198,40 208,40 211,22 195,22', fill: '#24252b' }),
    svgEl('polygon', { points: '216,58 232,74 216,74', fill: '#5a5d66' }),
    svgEl('rect', { x: '122', y: '66', width: '96', height: '6', fill: '#121729' }),
    svgEl('circle', { cx: '136', cy: '75', r: '8', fill: '#9c3b2a' }),
    svgEl('circle', { cx: '160', cy: '75', r: '8', fill: '#9c3b2a' }),
    svgEl('circle', { cx: '188', cy: '77', r: '6', fill: '#9c3b2a' }),
    svgEl('circle', { cx: '206', cy: '77', r: '6', fill: '#9c3b2a' }),
    // Steam puffs.
    svgEl('circle', { cx: '192', cy: '14', r: '5', fill: '#d9dee0', opacity: '0.65' }),
    svgEl('circle', { cx: '178', cy: '10', r: '7', fill: '#d9dee0', opacity: '0.45' }),
    svgEl('circle', { cx: '160', cy: '8', r: '8', fill: '#d9dee0', opacity: '0.28' }),
  );
  svg.append(train);
  return svg;
}

/** Full-screen night-blue train interlude with line-by-line travel notes and skip support. */
export async function playTrainJourney(
  parent: HTMLElement,
  journey: Journey,
  prepareArea: () => Promise<void>,
): Promise<void> {
  const reduced = prefersReducedMotion();
  const linesWrap = el('div', { class: 'travel-lines' });
  const lineEls = journey.lines.map((line) => {
    const p = el('p', { class: reduced ? 'travel-line is-visible' : 'travel-line' }, [line]);
    linesWrap.append(p);
    return p;
  });

  const skipHint = el('button', { class: 'travel-skip', type: 'button' }, [
    reduced ? 'Continue' : 'Tap or press any key to continue',
  ]);
  const root = el('section', { class: 'travel', role: 'dialog', 'aria-label': 'Train journey' }, [
    el('div', { class: 'travel-inner' }, [buildTrainSvg(), linesWrap, skipHint]),
  ]);
  if (reduced) root.classList.add('is-reduced');
  parent.append(root);
  requestAnimationFrame(() => root.classList.add('is-open'));

  const areaReady = prepareArea();

  await new Promise<void>((resolve) => {
    let finished = false;
    const timers: number[] = [];

    const finish = (): void => {
      if (finished) return;
      finished = true;
      for (const t of timers) clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      root.removeEventListener('click', onTap);
      void areaReady.then(() => {
        root.classList.remove('is-open');
        setTimeout(
          () => {
            root.remove();
            resolve();
          },
          reduced ? 180 : 380,
        );
      });
    };

    const canSkipAt = performance.now() + 260;
    const onKey = (e: KeyboardEvent): void => {
      if (performance.now() < canSkipAt) return;
      if (e.key === 'Tab' || e.key === 'Shift') return;
      finish();
    };
    const onTap = (): void => {
      if (performance.now() < canSkipAt) return;
      finish();
    };

    window.addEventListener('keydown', onKey);
    root.addEventListener('click', onTap);

    if (!reduced) {
      lineEls.forEach((p, i) => {
        timers.push(
          window.setTimeout(
            () => {
              p.classList.add('is-visible');
            },
            350 + i * 1600,
          ),
        );
      });
      timers.push(window.setTimeout(finish, 350 + lineEls.length * 1600 + 800));
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
): Promise<void> {
  const center = area.towerCenter ?? new THREE.Vector3(-34, 0, 0);
  const reduced = prefersReducedMotion();

  if (reduced) {
    area.setTowerProgress?.(1);
    camera.position.set(center.x + 48, 24, center.z - 16);
    camera.lookAt(center.x, 19, center.z);
    const caption = el('section', { class: 'timelapse-hud is-reduced' }, [
      el(
        'div',
        { class: 'timelapse-lines' },
        journey.lines.map((l) => el('p', {}, [l])),
      ),
      el('button', { class: 'travel-skip', type: 'button' }, ['Continue']),
    ]);
    parent.append(caption);
    await new Promise<void>((resolve) => {
      const done = (): void => {
        window.removeEventListener('keydown', onKey);
        caption.remove();
        resolve();
      };
      const onKey = (): void => done();
      caption.addEventListener('click', done);
      window.addEventListener('keydown', onKey);
    });
    return;
  }

  area.setTowerProgress?.(0);
  const lineEl = el('p', { class: 'timelapse-line' }, [journey.lines[0] ?? '']);
  const skipBtn = el('button', { class: 'timelapse-skip', type: 'button' }, ['Skip']);
  const hud = el('section', { class: 'timelapse-hud', 'aria-live': 'polite' }, [lineEl, skipBtn]);
  parent.append(hud);

  const thresholds = [0, 0.05, 0.55, 0.96];
  const DURATION = 8.0;
  const BUILD_END = 7.1;

  await new Promise<void>((resolve) => {
    let raf = 0;
    let skipped = false;
    const start = performance.now();
    const canSkipAt = start + 300;
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
      if (performance.now() < canSkipAt || skipped) return;
      skipped = true;
      cleanup();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Tab' || e.key === 'Shift') return;
      onSkip();
    };
    skipBtn.addEventListener('click', onSkip);
    window.addEventListener('keydown', onKey);

    const tick = (now: number): void => {
      if (skipped) return;
      const elapsed = (now - start) / 1000;
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
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
  });
}
