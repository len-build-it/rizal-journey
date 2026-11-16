import { describe, expect, it } from 'vitest';
import { STORIES } from '../src/content/stories';
import {
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
