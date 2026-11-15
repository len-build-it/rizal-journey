import type { SceneScript } from './types';

const REGISTRY = new Map<string, SceneScript>();

export function registerScenes(scripts: SceneScript[]): void {
  for (const s of scripts) REGISTRY.set(s.storyId, s);
}

export function getSceneScript(storyId: string): SceneScript | undefined {
  return REGISTRY.get(storyId);
}
