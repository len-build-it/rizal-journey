import { describe, expect, it } from 'vitest';
import { factById } from '../src/content/facts';
import { STORIES } from '../src/content/stories';
import { CHAPTERS, SCENES } from '../src/content/narrative';

describe('narrative content', () => {
  it('every chapter and scene cites verified facts', () => {
    for (const block of [
      ...CHAPTERS.map((c) => ({ id: c.title, factIds: c.factIds })),
      ...SCENES.map((s) => ({ id: s.storyId, factIds: s.factIds })),
    ]) {
      expect(block.factIds.length, block.id).toBeGreaterThan(0);
      for (const id of block.factIds)
        expect(factById(id)?.confidence, `${block.id} cites ${id}`).toBe('ok');
    }
  });

  it('every story has exactly one scene', () => {
    for (const story of STORIES) {
      expect(SCENES.filter((s) => s.storyId === story.id).length, story.id).toBe(1);
    }
    expect(SCENES.length).toBe(STORIES.length);
  });

  it('every area and Paris era has a chapter', () => {
    const keys = new Set(STORIES.map((s) => `${s.area}:${s.era ?? ''}`));
    for (const key of keys) {
      const [area, era] = key.split(':');
      expect(
        CHAPTERS.some((c) => c.area === area && (c.era ?? '') === era),
        key,
      ).toBe(true);
    }
  });

  it('captions are short enough to read as subtitles', () => {
    for (const s of SCENES) {
      expect(s.captions.length, s.storyId).toBeGreaterThanOrEqual(2);
      expect(s.captions.length, s.storyId).toBeLessThanOrEqual(3);
      for (const line of s.captions)
        expect(line.length, `${s.storyId}: ${line}`).toBeLessThanOrEqual(100);
    }
  });
});
