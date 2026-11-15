import * as THREE from 'three';
import type { ParisEra } from '../../content/stories';
import { palette } from '../palette';
import type { AreaDressing } from './BackgroundLife';

const v = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

export function marseilleDressing(year: 1882 | 1891): AreaDressing {
  const quayWalkWest = [v(-22, 0.06, 2.4), v(2, 0.06, 2.4)];
  const quayWalkEast = [v(16, 0.06, 2.4), v(40, 0.06, 2.4)];
  const plazaWalkW = [v(-5, 0.04, -26), v(-5, 0.04, -42), v(3, 0.04, -42), v(3, 0.04, -26)];
  const plazaWalkE = [v(17, 0.04, -26), v(25, 0.04, -26), v(25, 0.04, -41), v(17, 0.04, -41)];
  const cargoShuttleW = [v(-12, 0.06, 9.2), v(4.2, 0.06, 9.2)];
  const cargoShuttleE = [v(15.2, 0.06, 9.2), v(24.5, 0.06, 9.2)];
  const vehicleLoop = [
    v(12.6, 0.04, -25),
    v(12.6, 0.04, 1.8),
    v(-21, 0.04, 1.8),
    v(-21, 0.04, 0.2),
    v(7.4, 0.04, 0.2),
    v(7.4, 0.04, -25),
  ];

  return {
    walkers: [
      { role: 'dockWorker', path: cargoShuttleW, closed: false, speed: 1.35, startOffset: 0.15, action: 'carry' },
      { role: 'dockWorker', path: cargoShuttleE, closed: false, speed: 1.3, startOffset: 0.45, action: 'carry' },
      { role: 'dockWorker', path: cargoShuttleE, closed: false, speed: 1.25, startOffset: 0.85, action: 'carry' },
      { role: 'marketWoman', path: quayWalkWest, closed: false, speed: 1.22, startOffset: 0.25 },
      { role: 'marketWoman', path: quayWalkEast, closed: false, speed: 1.25, startOffset: 0.6 },
      { role: 'gentleman', path: quayWalkWest, closed: false, speed: 1.15, startOffset: 0.7, pairRole: 'lady' },
      { role: 'gentleman', path: quayWalkEast, closed: false, speed: 1.12, startOffset: 0.2, pairRole: 'lady' },
      { role: 'gentleman', path: plazaWalkW, speed: 1.18, startOffset: 0.15, pairRole: 'lady' },
      { role: 'child', path: plazaWalkE, speed: 1.68, startOffset: 0.4, action: 'hurry' },
      { role: 'vendor', path: plazaWalkW, speed: 1.2, startOffset: 0.68 },
    ],
    stations: [
      { role: 'fisherman', x: -12, y: 0.06, z: 10.6, ry: 0.15, action: 'fish' },
      { role: 'fisherman', x: -18, y: 0.06, z: 10.6, ry: -0.1, action: 'mendNet' },
      { role: 'gentleman', x: 24.5, y: 0.04, z: -30.1, ry: -0.3, action: 'sit' },
      { role: 'lady', x: 25.5, y: 0.04, z: -34.6, ry: -1.4, action: 'sit' },
      { role: 'gentleman', x: -4.0, y: 0.04, z: -32.1, ry: 1.2, action: 'readNewspaper' },
      { role: 'child', x: 6.2, y: 0.04, z: -33.6, ry: 1.5, action: 'chat' },
    ],
    vehicles: [
      { kind: 'cart', cargo: 'barrels', path: vehicleLoop, speed: 2.35, startOffset: 0.12 },
      { kind: 'fiacre', bodyColor: palette.hull, path: vehicleLoop, speed: 3.4, startOffset: 0.56 },
      {
        kind: 'rowingBoat',
        bodyColor: year === 1891 ? palette.shutterBlue : palette.hull,
        path: [v(-26, -1.18, 22), v(36, -1.18, 25)],
        closed: false,
        speed: 1.45,
        startOffset: 0.2,
      },
      {
        kind: 'rowingBoat',
        bodyColor: palette.roofTile,
        path: [v(32, -1.18, 29), v(-14, -1.18, 28)],
        closed: false,
        speed: 1.25,
        startOffset: 0.7,
      },
    ],
    birds: [
      { species: 'gull', x: -16, y: 0.06, z: 9.2, count: 8, radius: 2.4, flightHeight: 5.5, flightRadius: 7.5 },
      { species: 'gull', x: 22, y: 0.06, z: 9.6, count: 7, radius: 2.2, flightHeight: 5.2, flightRadius: 7.0 },
      { species: 'gull', x: 14, y: 0, z: 24, count: 6, radius: 3.0, roosting: true, flightHeight: 6.5, flightRadius: 9 },
      { species: 'pigeon', x: 6.5, y: 0.04, z: -34.2, count: 8, radius: 2.2, flightHeight: 4.5, flightRadius: 5.5 },
    ],
    animals: [
      { species: 'cat', x: -3.5, y: 0.06, z: 0.8, ry: 0.4, count: 1 },
      { species: 'dog', x: 18.0, y: 0.06, z: 3.2, ry: 1.1, count: 1, roamRadius: 2.0 },
      { species: 'fish', x: -8, y: -1.1, z: 23, count: 2, roamRadius: 4 },
    ],
  };
}

export function parisDressing(era: ParisEra): AreaDressing {
  const winter = era === '1885';
  const busy = era === '1889';
  const westSidewalk = [v(-4.2, 0.08, -32), v(-4.2, 0.08, 38)];
  const eastSidewalk = [v(13.0, 0.08, -32), v(13.0, 0.08, 38)];
  const maubeugeWalk = [v(15, 0.08, -20.2), v(43, 0.08, -20.2)];
  const chercheMidiWalk = [v(15, 0.08, 12.6), v(43, 0.08, 12.6)];
  const saintsPeresWalk = [v(15, 0.08, 22.8), v(43, 0.08, 22.8)];
  const seineQuayWalk = [v(-54, 0.08, -36), v(-54, 0.08, 36)];

  const blvdLoop = [
    v(1.8, 0.04, -39),
    v(1.8, 0.04, 42),
    v(7.4, 0.04, 42),
    v(7.4, 0.04, -39),
  ];
  const eastLoop = [
    v(7.4, 0.04, -23.5),
    v(46.5, 0.04, -23.5),
    v(46.5, 0.04, 9.5),
    v(7.4, 0.04, 9.5),
  ];

  const speedScale = winter ? 1.38 : 1.0;

  return {
    walkers: [
      { role: 'gentleman', winter, path: westSidewalk, closed: false, speed: 1.2 * speedScale, startOffset: 0.12, pairRole: 'lady' },
      { role: 'gentleman', winter, path: westSidewalk, closed: false, speed: 1.18 * speedScale, startOffset: 0.56, pairRole: 'lady' },
      { role: 'gentleman', winter, path: eastSidewalk, closed: false, speed: 1.22 * speedScale, startOffset: 0.3, pairRole: 'lady' },
      { role: 'gentleman', winter, path: eastSidewalk, closed: false, speed: 1.15 * speedScale, startOffset: 0.78 },
      { role: 'marketWoman', winter, path: maubeugeWalk, closed: false, speed: 1.25 * speedScale, startOffset: 0.35 },
      { role: 'vendor', winter, path: saintsPeresWalk, closed: false, speed: 1.2 * speedScale, startOffset: 0.55 },
      { role: 'gentleman', winter, path: seineQuayWalk, closed: false, speed: 1.16 * speedScale, startOffset: 0.42 },
      { role: 'nurse', path: chercheMidiWalk, closed: false, speed: 1.18, startOffset: 0.5 },
      ...(busy
        ? [
            { role: 'gentleman' as const, path: westSidewalk, closed: false, speed: 1.1, startOffset: 0.85, pairRole: 'lady' as const },
            { role: 'child' as const, path: eastSidewalk, closed: false, speed: 1.6, startOffset: 0.2 },
          ]
        : []),
    ],
    stations: [
      { role: 'gendarme', x: 11.4, y: 0.08, z: -2.5, ry: -Math.PI * 0.5, action: 'chat' },
      { role: 'vendor', x: -3.4, y: 0.08, z: 16.5, ry: 1.3, action: 'chat' },
      ...(busy
        ? [
            { role: 'gentleman' as const, x: -12, y: 0.08, z: -5.5, ry: -1.4, action: 'lookUp' as const },
            { role: 'lady' as const, x: -12.4, y: 0.08, z: -4.7, ry: -1.5, action: 'lookUp' as const },
            { role: 'child' as const, x: -13.2, y: 0.08, z: -5.1, ry: -1.5, action: 'lookUp' as const },
          ]
        : []),
    ],
    vehicles: [
      { kind: 'fiacre', bodyColor: palette.hull, path: blvdLoop, speed: winter ? 3.2 : 4.1, startOffset: 0.08 },
      { kind: 'fiacre', bodyColor: palette.doorBrown, path: blvdLoop, speed: winter ? 3.2 : 4.2, startOffset: 0.58 },
      { kind: 'omnibus', bodyColor: palette.awningBlue, path: blvdLoop, speed: 3.4, startOffset: 0.34 },
      { kind: 'cart', cargo: 'produce', path: eastLoop, speed: 2.5, startOffset: 0.24 },
      ...(busy
        ? [{ kind: 'pennyFarthing' as const, path: blvdLoop, speed: 4.8, startOffset: 0.72 }]
        : []),
      {
        kind: 'rowingBoat',
        bodyColor: palette.hull,
        path: [v(-71, -1.18, -42), v(-71, -1.18, 42)],
        closed: false,
        speed: 1.5,
        startOffset: 0.35,
      },
    ],
    birds: [
      { species: 'pigeon', x: 12.2, y: 0.08, z: -12, count: winter ? 5 : busy ? 12 : 9, radius: 2.2, flightHeight: 5.5, flightRadius: 7 },
      { species: 'pigeon', x: -53.8, y: 0.08, z: 12, count: winter ? 4 : 8, radius: 2.0, flightHeight: 5.5, flightRadius: 6.5 },
    ],
    animals: [
      { species: 'dog', x: 12.0, y: 0.08, z: 20, count: 1, roamRadius: 2.2 },
      ...(busy ? [{ species: 'duck' as const, x: -67, y: -1.18, z: -10, count: 5, roamRadius: 3.5 }] : []),
    ],
  };
}

export function biarritzDressing(): AreaDressing {
  const promWalk = [v(-26, 0.44, 3.6), v(26, 0.44, 3.6)];
  const plateauRoad = [v(-2, 2.66, -14.2), v(26, 2.66, -14.2)];

  return {
    walkers: [
      { role: 'gentleman', winter: true, path: promWalk, closed: false, speed: 1.15, startOffset: 0.15, pairRole: 'lady' },
      { role: 'gentleman', winter: true, path: promWalk, closed: false, speed: 1.1, startOffset: 0.62, pairRole: 'lady' },
      { role: 'child', path: [v(-10, -0.75, 11), v(12, -0.75, 11)], closed: false, speed: 1.75, startOffset: 0.3, action: 'hurry' },
    ],
    stations: [
      { role: 'fisherman', x: -24, y: -0.72, z: 13.5, ry: 0.4, action: 'mendNet' },
      { role: 'dockWorker', x: -22, y: 2.66, z: -20, ry: 0.6, action: 'sweep' },
    ],
    vehicles: [
      { kind: 'cart', cargo: 'crates', path: plateauRoad, closed: false, speed: 2.2, startOffset: 0.3 },
      {
        kind: 'rowingBoat',
        bodyColor: palette.shutterBlue,
        path: [v(-26, -0.92, 25), v(24, -0.92, 27)],
        closed: false,
        speed: 1.35,
        startOffset: 0.25,
      },
    ],
    birds: [
      { species: 'gull', x: -8, y: -0.75, z: 13, count: 8, radius: 3.2, flightHeight: 5.5, flightRadius: 7 },
      { species: 'gull', x: 18, y: -0.75, z: 14, count: 7, radius: 3.0, flightHeight: 5.5, flightRadius: 7 },
    ],
    animals: [
      { species: 'dog', x: 2, y: -0.75, z: 11.5, count: 1, roamRadius: 2.5 },
      { species: 'sheep', x: 8, y: 1.5, z: -6.5, count: 7, roamRadius: 3.2, graze: true },
      { species: 'horse', x: -26, y: 2.66, z: -26, count: 2, roamRadius: 1.8, graze: true },
    ],
  };
}
