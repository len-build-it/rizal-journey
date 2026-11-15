import { BIARRITZ_SCENES } from './biarritzScenes';
import { MARSEILLE_SCENES } from './marseilleScenes';
import { PARIS_SCENES } from './parisScenes';
import type { SceneScript } from './types';

const REGISTRY = new Map<string, SceneScript>();

export function registerScenes(scripts: SceneScript[]): void {
  for (const s of scripts) REGISTRY.set(s.storyId, s);
}

registerScenes(MARSEILLE_SCENES);
registerScenes(PARIS_SCENES);
registerScenes(BIARRITZ_SCENES);

export function getSceneScript(storyId: string): SceneScript | undefined {
  return REGISTRY.get(storyId);
}
