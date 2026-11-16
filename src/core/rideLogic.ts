import { CHAPTERS, type Chapter } from '../content/narrative';
import { storiesFor, type Story } from '../content/stories';
import type { AreaDestination } from './progress';

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

export interface ChecklistItem {
  story: Story;
  isStation: boolean;
  visited: boolean;
  locked: boolean;
  selectable: boolean;
  isNext: boolean;
  accessibleName: string;
}

export interface AreaChecklist {
  items: ChecklistItem[];
  visitedCount: number;
  totalCount: number;
  allOtherVisited: boolean;
}

/**
 * Builds the area's Places checklist in story order with the station last
 * and locked until every other stop in the area is visited.
 */
export function buildAreaChecklist(
  dest: AreaDestination,
  visited: ReadonlySet<string>,
  nextTargetId?: string | null,
): AreaChecklist {
  const era = dest.area === 'paris' ? dest.era : undefined;
  const raw = storiesFor(dest.area, era);
  const nonStation = raw.filter((s) => !s.action);
  const station = raw.filter((s) => Boolean(s.action));
  const ordered = [...nonStation, ...station];

  const allOtherVisited = nonStation.every((s) => visited.has(s.id));
  const items: ChecklistItem[] = ordered.map((story) => {
    const isStation = Boolean(story.action);
    const isVisited = visited.has(story.id);
    const locked = isStation && !allOtherVisited;
    const selectable = !isVisited && !locked;
    const isNext = !isVisited && story.id === nextTargetId;
    const accessibleName = locked
      ? `${story.title}, locked, after the others`
      : isVisited
        ? `${story.title}, visited`
        : `${story.title}, not visited`;
    return {
      story,
      isStation,
      visited: isVisited,
      locked,
      selectable,
      isNext,
      accessibleName,
    };
  });

  return {
    items,
    visitedCount: items.filter((i) => i.visited).length,
    totalCount: items.length,
    allOtherVisited,
  };
}

export interface JourneyChapterOverview {
  chapter: Chapter;
  visitedCount: number;
  totalCount: number;
  complete: boolean;
  isCurrent: boolean;
}

/**
 * Builds the read-only chapter-by-chapter overview of the entire journey for the menu's Places view.
 */
export function buildJourneyOverview(
  dest: AreaDestination,
  visited: ReadonlySet<string>,
): JourneyChapterOverview[] {
  return CHAPTERS.map((chapter) => {
    const stories = storiesFor(chapter.area, chapter.era);
    const visitedCount = stories.filter((s) => visited.has(s.id)).length;
    const totalCount = stories.length;
    const isCurrent =
      chapter.area === dest.area &&
      (chapter.era === undefined || (dest.area === 'paris' && chapter.era === dest.era));
    return {
      chapter,
      visitedCount,
      totalCount,
      complete: totalCount > 0 && visitedCount === totalCount,
      isCurrent,
    };
  });
}
