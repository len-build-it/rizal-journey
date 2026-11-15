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

export interface PlayBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface RoadGraph {
  waypoints: THREE.Vector3[];
  edges: [number, number][];
  stopWaypoints: Record<string, number>;
}

export interface Area {
  id: string;
  name: string;
  spawn: THREE.Vector3;
  spawnHeading: number;
  stops: StopMarker[];
  look: AreaLook;
  roadGraph?: RoadGraph;
  playBounds?: PlayBounds;
  visualBounds?: PlayBounds;
  update(dt: number, time: number): void;
  dispose(): void;
  setTowerProgress?(p: number): void;
  towerCenter?: THREE.Vector3;
  setTrainOffset?(offsetX: number, doorClose?: number): void;
  setShipOffset?(offsetX: number, offsetZ?: number, yaw?: number): void;
  setArenaSceneActive?(active: boolean): void;
  staticDrawCalls?: number;
}
