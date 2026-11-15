import type * as THREE from 'three';
import type { StopMarker } from './StopMarker';

export interface AreaLook {
  sky: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  sunColor: number;
  sunIntensity: number;
  /** Direction from the target toward the sun. */
  sunDirection: THREE.Vector3;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
}

export interface Area {
  id: string;
  name: string;
  spawn: THREE.Vector3;
  spawnHeading: number;
  stops: StopMarker[];
  look: AreaLook;
  update(dt: number, time: number): void;
  dispose(): void;
  setTowerProgress?(p: number): void;
  towerCenter?: THREE.Vector3;
  staticDrawCalls?: number;
}
