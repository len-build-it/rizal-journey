import type { Story } from '../content/stories';

export interface RideProgress {
  visited: Set<string>;
  filled: Set<number>;
  leftEarly: Set<string>;
  snapshots: Record<string, string>;
}

export type StopEntryAction =
  | { kind: 'autoplay' }
  | { kind: 'prompt'; label: string };

/**
 * Records a completed (or skipped-to-end) stop scene: marks the stop visited once,
 * fills its brochure panel, clears any left-early flag, and saves an optional snapshot.
 */
export function completeStopScene(
  progress: RideProgress,
  story: Pick<Story, 'id' | 'panel'>,
  snapshotUrl?: string | null,
): { newlyVisited: boolean; newlyFilledPanel: boolean } {
  const newlyVisited = !progress.visited.has(story.id);
  progress.visited.add(story.id);
  progress.leftEarly.delete(story.id);

  const newlyFilledPanel = !progress.filled.has(story.panel);
  progress.filled.add(story.panel);

  if (snapshotUrl) {
    progress.snapshots[story.id] = snapshotUrl;
  }

  return { newlyVisited, newlyFilledPanel };
}

/**
 * Records that the player left a stop scene early: keeps the stop unvisited,
 * fills no brochure panel, takes no snapshot, and suppresses future auto-start.
 */
export function leaveStopSceneEarly(progress: RideProgress, storyId: string): void {
  progress.leftEarly.add(storyId);
}

/**
 * Determines what should happen when Rizal stands inside a stop ring.
 */
export function stopEntryAction(
  story: Pick<Story, 'id' | 'title'>,
  opts: {
    visited: ReadonlySet<string>;
    leftEarly: ReadonlySet<string>;
    isLockedStation: boolean;
  },
): StopEntryAction {
  if (opts.isLockedStation) {
    return { kind: 'prompt', label: 'Visit the other stops first' };
  }
  if (!opts.visited.has(story.id)) {
    if (opts.leftEarly.has(story.id)) {
      return { kind: 'prompt', label: `Watch: ${story.title}` };
    }
    return { kind: 'autoplay' };
  }
  return { kind: 'prompt', label: `Replay: ${story.title}` };
}
