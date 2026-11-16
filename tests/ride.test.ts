import { describe, expect, it } from 'vitest';
import { STORIES } from '../src/content/stories';
import {
  clearProgress,
  hasSavedProgress,
  initialProgress,
  loadProgress,
  resolveChecklistCollapsed,
  saveProgress,
  type AreaDestination,
} from '../src/core/progress';
import {
  buildAreaChecklist,
  buildJourneyOverview,
  completeStopScene,
  leaveStopSceneEarly,
  stopEntryAction,
  type RideProgress,
} from '../src/core/rideLogic';

function emptyRideProgress(): RideProgress {
  return {
    visited: new Set<string>(),
    filled: new Set<number>([1]),
    leftEarly: new Set<string>(),
    snapshots: {},
  };
}

describe('scene completion and leaving early', () => {
  it('leaving a scene early keeps the stop unvisited, takes no snapshot, and fills no panel', () => {
    const progress = emptyRideProgress();
    const story = STORIES.find((s) => s.id === 'marseille-landing')!;

    leaveStopSceneEarly(progress, story.id);

    expect(progress.visited.has(story.id)).toBe(false);
    expect(progress.filled.has(story.panel)).toBe(false);
    expect(progress.snapshots[story.id]).toBeUndefined();
    expect(progress.leftEarly.has(story.id)).toBe(true);
  });

  it('finishing or skipping a scene marks it visited and fills its panel exactly once', () => {
    const progress = emptyRideProgress();
    const story = STORIES.find((s) => s.id === 'marseille-landing')!;

    const first = completeStopScene(progress, story, 'data:image/jpeg;base64,abc');
    const second = completeStopScene(progress, story, 'data:image/jpeg;base64,abc');

    expect(first).toEqual({ newlyVisited: true, newlyFilledPanel: true });
    expect(second).toEqual({ newlyVisited: false, newlyFilledPanel: false });
    expect([...progress.visited]).toEqual([story.id]);
    expect([...progress.filled]).toEqual([1, story.panel]);
    expect(progress.snapshots[story.id]).toBe('data:image/jpeg;base64,abc');
    expect(progress.leftEarly.has(story.id)).toBe(false);
  });

  it('a stop left early shows Watch prompt instead of auto-starting, while other unvisited stops auto-start', () => {
    const progress = emptyRideProgress();
    const landing = STORIES.find((s) => s.id === 'marseille-landing')!;
    const dif = STORIES.find((s) => s.id === 'marseille-chateau-dif')!;
    const station = STORIES.find((s) => s.id === 'marseille-station')!;

    leaveStopSceneEarly(progress, landing.id);

    expect(
      stopEntryAction(landing, {
        visited: progress.visited,
        leftEarly: progress.leftEarly,
        isLockedStation: false,
      }),
    ).toEqual({ kind: 'prompt', label: `Watch: ${landing.title}` });

    expect(
      stopEntryAction(dif, {
        visited: progress.visited,
        leftEarly: progress.leftEarly,
        isLockedStation: false,
      }),
    ).toEqual({ kind: 'autoplay' });

    expect(
      stopEntryAction(station, {
        visited: progress.visited,
        leftEarly: progress.leftEarly,
        isLockedStation: true,
      }),
    ).toEqual({ kind: 'prompt', label: 'Visit the other stops first' });

    completeStopScene(progress, landing);
    expect(
      stopEntryAction(landing, {
        visited: progress.visited,
        leftEarly: progress.leftEarly,
        isLockedStation: false,
      }),
    ).toEqual({ kind: 'prompt', label: `Replay: ${landing.title}` });
  });
});

const ALL_DESTINATIONS: AreaDestination[] = [
  { area: 'marseille-1882' },
  { area: 'paris', era: '1883' },
  { area: 'paris', era: '1885' },
  { area: 'paris', era: '1889' },
  { area: 'biarritz-1891' },
  { area: 'marseille-1891' },
];

describe('places checklist', () => {
  it('orders stops for every area with the station last and locked until the others are visited', () => {
    for (const dest of ALL_DESTINATIONS) {
      const era = dest.area === 'paris' ? dest.era : undefined;
      const expectedStories = STORIES.filter((s) => s.area === dest.area && s.era === era);
      const nonStationIds = expectedStories.filter((s) => !s.action).map((s) => s.id);
      const stationId = expectedStories.find((s) => Boolean(s.action))!.id;

      const empty = buildAreaChecklist(dest, new Set());
      expect(empty.totalCount).toBe(expectedStories.length);
      expect(empty.visitedCount).toBe(0);
      expect(empty.items.at(-1)?.story.id).toBe(stationId);
      expect(empty.items.at(-1)?.isStation).toBe(true);
      expect(empty.items.at(-1)?.locked).toBe(true);
      expect(empty.items.at(-1)?.selectable).toBe(false);
      expect(empty.items.map((i) => i.story.id)).toEqual([...nonStationIds, stationId]);

      // Partial non-station visits keep station locked.
      if (nonStationIds.length > 1) {
        const partial = buildAreaChecklist(dest, new Set([nonStationIds[0]!]));
        expect(partial.visitedCount).toBe(1);
        expect(partial.items.at(-1)?.locked).toBe(true);
      }

      // Visiting all non-station stops unlocks the station.
      const unlocked = buildAreaChecklist(dest, new Set(nonStationIds), stationId);
      expect(unlocked.visitedCount).toBe(nonStationIds.length);
      expect(unlocked.allOtherVisited).toBe(true);
      expect(unlocked.items.at(-1)?.locked).toBe(false);
      expect(unlocked.items.at(-1)?.selectable).toBe(true);
      expect(unlocked.items.at(-1)?.isNext).toBe(true);
    }
  });
});

describe('saved progress and checklist collapse persistence', () => {
  it('persists checklistCollapsed across reload and clears all progress on Start over', () => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    });

    const state = initialProgress();
    state.visited.push('marseille-landing');
    state.panels.push(2);
    state.checklistCollapsed = true;
    state.snapshots = { 'marseille-landing': 'data:image/jpeg;base64,xyz' };
    saveProgress(state);

    const reloaded = loadProgress();
    expect(reloaded).not.toBeNull();
    expect(hasSavedProgress(reloaded)).toBe(true);
    expect(reloaded?.checklistCollapsed).toBe(true);
    expect(resolveChecklistCollapsed(reloaded?.checklistCollapsed, 1280)).toBe(true);

    // Explicit false (expanded on narrow screen) also survives reload.
    state.checklistCollapsed = false;
    saveProgress(state);
    const reloadedExpanded = loadProgress();
    expect(resolveChecklistCollapsed(reloadedExpanded?.checklistCollapsed, 390)).toBe(false);

    // Start over clears saved progress and restores viewport defaults.
    clearProgress();
    expect(loadProgress()).toBeNull();
    expect(resolveChecklistCollapsed(undefined, 1280)).toBe(false);
    expect(resolveChecklistCollapsed(undefined, 640)).toBe(true);
    expect(resolveChecklistCollapsed(undefined, 390)).toBe(true);
  });
});

describe('journey overview', () => {
  it('lists all 6 chapters with counts, completion state, and current chapter marker', () => {
    const visited = new Set([
      'marseille-landing',
      'marseille-chateau-dif',
      'marseille-station',
      'paris-1883-hotel',
    ]);
    const overview = buildJourneyOverview({ area: 'paris', era: '1883' }, visited);
    expect(overview).toHaveLength(6);

    expect(overview[0]).toMatchObject({
      visitedCount: 3,
      totalCount: 3,
      complete: true,
      isCurrent: false,
    });
    expect(overview[0]?.chapter.title).toBe('First steps');
    expect(overview[0]?.chapter.place).toBe('Marseille, June 1882');

    expect(overview[1]).toMatchObject({
      visitedCount: 1,
      totalCount: 3,
      complete: false,
      isCurrent: true,
    });
    expect(overview[2]).toMatchObject({
      visitedCount: 0,
      totalCount: 3,
      complete: false,
      isCurrent: false,
    });
  });
});
