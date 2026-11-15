import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FACTS, SOURCES, factById } from '../src/content/facts';
import { STORIES } from '../src/content/stories';
import { JOURNEYS } from '../src/content/journeys';

describe('content integrity', () => {
  it('every story cites facts that exist and are verified', () => {
    for (const story of STORIES) {
      expect(story.factIds.length, story.id).toBeGreaterThan(0);
      for (const id of story.factIds) {
        const fact = factById(id);
        expect(fact, `${story.id} cites missing ${id}`).toBeDefined();
        expect(fact?.confidence, `${story.id} cites ${id}`).toBe('ok');
      }
    }
  });

  it('every journey cites verified facts and starts from a real story', () => {
    for (const j of JOURNEYS) {
      expect(
        STORIES.some((s) => s.id === j.from),
        j.from,
      ).toBe(true);
      for (const id of j.factIds)
        expect(factById(id)?.confidence, `${j.from} cites ${id}`).toBe('ok');
    }
  });

  it('every story with a travel action that is not the finale has a journey', () => {
    for (const s of STORIES) {
      if (!s.action || s.action.to.area === 'finale') continue;
      expect(
        JOURNEYS.some((j) => j.from === s.id),
        s.id,
      ).toBe(true);
    }
  });

  it('all six brochure panels can be filled (panel 1 is the title screen)', () => {
    const panels = new Set(STORIES.map((s) => s.panel));
    for (const p of [2, 3, 4, 5, 6]) expect(panels.has(p as 2), `panel ${p}`).toBe(true);
  });

  it('every fact points at a listed source', () => {
    for (const fact of FACTS) {
      for (const s of fact.sources) expect(SOURCES[s], `${fact.id} -> ${s}`).toBeDefined();
    }
  });

  it('story ids are unique', () => {
    const ids = STORIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('style rules', () => {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|css|html|md)$/.test(name)) files.push(p);
    }
  };
  walk('src');
  files.push('index.html', 'SPEC.md', 'HANDOFF.md');

  it('no em dashes anywhere in source or copy', () => {
    for (const f of files) {
      expect(readFileSync(f, 'utf8').includes('—'), f).toBe(false);
    }
  });
});
