import type { Destination, ParisEra } from '../content/stories';
import type { Area } from '../world/Area';

export type AreaDestination = Exclude<Destination, { area: 'finale' }>;

export interface ProgressState {
  destination: AreaDestination;
  visited: string[];
  panels: number[];
  completed: boolean;
  snapshots?: Record<string, string>;
}

const STORAGE_KEY = 'rizal-france-progress-v1';
const memorySnapshots: Record<string, string> = {};

function sanitizeSnapshots(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof k === 'string' && typeof v === 'string' && v.startsWith('data:image/')) {
      out[k] = v;
    }
  }
  return out;
}

export function initialProgress(): ProgressState {
  return {
    destination: { area: 'marseille-1882' },
    visited: [],
    panels: [1],
    completed: false,
    snapshots: { ...memorySnapshots },
  };
}

export function hasSavedProgress(state: ProgressState | null): state is ProgressState {
  if (!state) return false;
  return state.visited.length > 0 || state.destination.area !== 'marseille-1882' || state.completed;
}

export function loadProgress(): ProgressState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    if (!parsed || typeof parsed !== 'object' || !isValidAreaDest(parsed.destination)) return null;
    const visited = Array.isArray(parsed.visited)
      ? parsed.visited.filter((x): x is string => typeof x === 'string')
      : [];
    const panels = Array.isArray(parsed.panels)
      ? parsed.panels.filter((x): x is number => typeof x === 'number' && x >= 1 && x <= 6)
      : [1];
    if (!panels.includes(1)) panels.unshift(1);
    const storedSnapshots = sanitizeSnapshots(parsed.snapshots);
    Object.assign(memorySnapshots, storedSnapshots);
    return {
      destination: parsed.destination,
      visited,
      panels,
      completed: Boolean(parsed.completed),
      snapshots: { ...storedSnapshots, ...memorySnapshots },
    };
  } catch {
    return null;
  }
}

export function saveProgress(state: ProgressState): void {
  if (state.snapshots) {
    Object.assign(memorySnapshots, state.snapshots);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded or restricted storage: save metadata without snapshots and keep images in memory.
    try {
      const compact: ProgressState = {
        destination: state.destination,
        visited: state.visited,
        panels: state.panels,
        completed: state.completed,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch {
      // Memory fallback already holds snapshots.
    }
  }
}

export function clearProgress(): void {
  for (const key of Object.keys(memorySnapshots)) delete memorySnapshots[key];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function destinationPlace(dest: AreaDestination): { year: string; place: string } {
  switch (dest.area) {
    case 'marseille-1882':
      return { year: '1882', place: 'Marseille' };
    case 'paris':
      return { year: dest.era, place: 'Paris' };
    case 'biarritz-1891':
      return { year: '1891', place: 'Biarritz' };
    case 'marseille-1891':
      return { year: '1891', place: 'Marseille' };
  }
}

export function allOtherStopsVisited(
  area: Area,
  currentStoryId: string,
  visited: Set<string>,
): boolean {
  return area.stops.every((s) => s.story.id === currentStoryId || visited.has(s.story.id));
}

function isValidAreaDest(d: unknown): d is AreaDestination {
  if (!d || typeof d !== 'object') return false;
  const obj = d as { area?: unknown; era?: unknown };
  if (
    obj.area === 'marseille-1882' ||
    obj.area === 'biarritz-1891' ||
    obj.area === 'marseille-1891'
  ) {
    return true;
  }
  if (obj.area === 'paris') {
    const validEras: ParisEra[] = ['1883', '1885', '1889'];
    return typeof obj.era === 'string' && validEras.includes(obj.era as ParisEra);
  }
  return false;
}
