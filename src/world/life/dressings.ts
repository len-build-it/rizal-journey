import * as THREE from 'three';
import type { ParisEra } from '../../content/stories';
import { palette } from '../palette';
import type { AreaDressing, PersonStationSpec, PersonWalkSpec } from './BackgroundLife';

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
    v(12.6, 0.04, 2.4),
    v(-20, 0.04, 3.6),
    v(-20, 0.04, 0.2),
    v(7.4, 0.04, 0.2),
    v(7.4, 0.04, -25),
  ];

  return {
    walkers: [
      { role: 'dockWorker', path: cargoShuttleW, closed: false, speed: 1.35, startOffset: 0.15, action: 'carry' },
      { role: 'dockWorker', path: cargoShuttleW, closed: false, speed: 1.25, startOffset: 0.65, action: 'carry' },
      { role: 'dockWorker', path: cargoShuttleE, closed: false, speed: 1.32, startOffset: 0.35, action: 'carry' },
      { role: 'dockWorker', path: cargoShuttleE, closed: false, speed: 1.28, startOffset: 0.85, action: 'carry' },
      { role: 'marketWoman', path: quayWalkWest, closed: false, speed: 1.22, startOffset: 0.22 },
      { role: 'marketWoman', path: quayWalkEast, closed: false, speed: 1.26, startOffset: 0.52 },
      { role: 'marketWoman', path: plazaWalkW, speed: 1.18, startOffset: 0.48 },
      { role: 'gentleman', path: quayWalkWest, closed: false, speed: 1.15, startOffset: 0.72, pairRole: 'lady' },
      { role: 'gentleman', path: quayWalkEast, closed: false, speed: 1.14, startOffset: 0.18, pairRole: 'lady' },
      { role: 'gentleman', path: plazaWalkW, speed: 1.18, startOffset: 0.14, pairRole: 'lady' },
      { role: 'gentleman', path: plazaWalkE, speed: 1.16, startOffset: 0.64, pairRole: 'lady' },
      { role: 'child', path: plazaWalkE, speed: 1.72, startOffset: 0.28, action: 'hurry' },
      { role: 'child', path: quayWalkEast, closed: false, speed: 1.65, startOffset: 0.82, action: 'hurry' },
      { role: 'vendor', path: plazaWalkW, speed: 1.2, startOffset: 0.78 },
    ],
    stations: [
      { role: 'fisherman', x: -8, y: 0.06, z: 10.6, ry: 0.2, action: 'fish' },
      { role: 'fisherman', x: -13.5, y: 0.06, z: 10.6, ry: -0.1, action: 'fish' },
      { role: 'fisherman', x: -18.5, y: 0.06, z: 10.6, ry: 0.35, action: 'mendNet' },
      { role: 'dockWorker', x: 19.6, y: 0.06, z: 9.8, ry: -0.6, action: 'chat' },
      { role: 'marketWoman', x: 21.4, y: 0.04, z: -29.8, ry: 0.9, action: 'chat' },
      { role: 'gentleman', x: 24.5, y: 0.04, z: -30.1, ry: -0.3, action: 'sit' },
      { role: 'lady', x: 25.5, y: 0.04, z: -34.6, ry: -1.4, action: 'sit' },
      { role: 'gentleman', x: -4.0, y: 0.04, z: -32.1, ry: 1.2, action: 'readNewspaper' },
      { role: 'child', x: 6.2, y: 0.04, z: -33.6, ry: 1.5, action: 'chat' },
      { role: 'child', x: 13.6, y: 0.04, z: -34.4, ry: -1.3, action: 'chat' },
      { role: 'vendor', x: -6.2, y: 0.04, z: -27.2, ry: 0.4, action: 'sweep' },
    ],
    vehicles: [
      { kind: 'cart', cargo: 'barrels', path: vehicleLoop, speed: 2.35, startOffset: 0.14 },
      { kind: 'fiacre', bodyColor: palette.hull, path: vehicleLoop, speed: 3.4, startOffset: 0.62 },
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
        bodyColor: palette.hull,
        path: [v(32, -1.18, 29), v(-14, -1.18, 28)],
        closed: false,
        speed: 1.25,
        startOffset: 0.72,
      },
    ],
    birds: [
      { species: 'gull', x: -16, y: 0.06, z: 9.2, count: 9, radius: 2.5, flightHeight: 5.5, flightRadius: 7.5 },
      { species: 'gull', x: 22, y: 0.06, z: 9.6, count: 8, radius: 2.4, flightHeight: 5.2, flightRadius: 7.0 },
      { species: 'gull', x: 14, y: 0, z: 24, count: 6, radius: 3.0, roosting: true, flightHeight: 6.5, flightRadius: 9 },
      { species: 'pigeon', x: 6.5, y: 0.04, z: -34.2, count: 10, radius: 2.2, flightHeight: 4.5, flightRadius: 5.5 },
    ],
    animals: [
      { species: 'cat', x: -3.5, y: 0.06, z: 0.8, ry: 0.4, count: 1 },
      { species: 'cat', x: 22.5, y: 0.06, z: 0.8, ry: -0.6, count: 1 },
      { species: 'dog', x: 18.0, y: 0.06, z: 3.2, ry: 1.1, count: 1, roamRadius: 2.0 },
      { species: 'fish', x: -8, y: -1.1, z: 23, count: 2, roamRadius: 4 },
      { species: 'fish', x: 26, y: -1.1, z: 21, count: 2, roamRadius: 4 },
    ],
  };
}

export function parisDressing(era: ParisEra): AreaDressing {
  const winter = era === '1885';
  const busy = era === '1889';
  const speedScale = winter ? 1.38 : 1.0;

  const westSidewalk = [v(-4.2, 0.08, -32), v(-4.2, 0.08, 38)];
  const eastSidewalk = [v(13.0, 0.08, -32), v(13.0, 0.08, 38)];
  const maubeugeWalk = [v(15, 0.08, -20.2), v(43, 0.08, -20.2)];
  const chercheMidiWalk = [v(15, 0.08, 12.6), v(43, 0.08, 12.6)];
  const saintsPeresWalk = [v(15, 0.08, 22.8), v(43, 0.08, 22.8)];
  const hospitalWalk = [v(45.5, 0.08, -21), v(45.5, 0.08, -8)];
  const seineQuayWalk = [v(-54, 0.08, -38), v(-54, 0.08, 38)];
  const champPathN = [v(-28, 0.06, -9), v(-11, 0.06, -9)];
  const champPathS = [v(-28, 0.06, 9), v(-11, 0.06, 9)];

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
  const saintsLoop = [
    v(7.4, 0.04, 9.5),
    v(46.5, 0.04, 9.5),
    v(46.5, 0.04, 26),
    v(7.4, 0.04, 26),
  ];

  const walkers: PersonWalkSpec[] = [
    { role: 'gentleman', winter, path: westSidewalk, closed: false, speed: 1.2 * speedScale, startOffset: 0.08, pairRole: 'lady' },
    { role: 'gentleman', winter, path: westSidewalk, closed: false, speed: 1.18 * speedScale, startOffset: 0.42, pairRole: 'lady' },
    { role: 'gentleman', winter, path: westSidewalk, closed: false, speed: 1.22 * speedScale, startOffset: 0.74 },
    { role: 'gentleman', winter, path: eastSidewalk, closed: false, speed: 1.2 * speedScale, startOffset: 0.22, pairRole: 'lady' },
    { role: 'gentleman', winter, path: eastSidewalk, closed: false, speed: 1.15 * speedScale, startOffset: 0.62, pairRole: 'lady' },
    { role: 'marketWoman', winter, path: maubeugeWalk, closed: false, speed: 1.24 * speedScale, startOffset: 0.3 },
    { role: 'vendor', winter, path: saintsPeresWalk, closed: false, speed: 1.2 * speedScale, startOffset: 0.45 },
    { role: 'gentleman', winter, path: seineQuayWalk, closed: false, speed: 1.18 * speedScale, startOffset: 0.38 },
  ];

  const stations: PersonStationSpec[] = [];

  if (!winter) {
    walkers.push(
      { role: 'gentleman', path: eastSidewalk, closed: false, speed: 1.15, startOffset: 0.88, pairRole: 'lady' },
      { role: 'child', path: champPathN, closed: false, speed: 1.68, startOffset: 0.25, action: 'hurry' },
      { role: 'child', path: champPathS, closed: false, speed: 1.62, startOffset: 0.7, action: 'hurry' },
      { role: 'marketWoman', path: chercheMidiWalk, closed: false, speed: 1.22, startOffset: 0.64 },
      { role: 'vendor', path: maubeugeWalk, closed: false, speed: 1.18, startOffset: 0.82 },
      { role: 'gentleman', path: seineQuayWalk, closed: false, speed: 1.12, startOffset: 0.76, pairRole: 'lady' },
    );

    // Cafe terrace patrons (full in 1883/1889).
    stations.push(
      { role: 'gentleman', x: 13.8, y: 0.08, z: -20.8, ry: -0.4, action: 'sit' },
      { role: 'lady', x: 12.6, y: 0.08, z: -19.6, ry: 2.3, action: 'sit' },
      { role: 'gentleman', x: 28.2, y: 0.08, z: -20.4, ry: -1.1, action: 'sit' },
      { role: 'gentleman', x: 27.6, y: 0.08, z: 14.3, ry: -0.8, action: 'sit' },
      { role: 'lady', x: 32.6, y: 0.08, z: 30.6, ry: -0.6, action: 'sit' },
      { role: 'gentleman', x: 13.8, y: 0.08, z: -33.6, ry: -0.5, action: 'readNewspaper' },
      { role: 'vendor', x: 12.9, y: 0.08, z: -30.5, ry: -1.4, action: 'chat' },
      { role: 'vendor', x: -4.2, y: 0.08, z: 15.8, ry: 1.4, action: 'sweep' },
    );

    if (era === '1883') {
      walkers.push(
        { role: 'nurse', path: hospitalWalk, closed: false, speed: 1.16, startOffset: 0.2 },
        { role: 'nurse', path: chercheMidiWalk, closed: false, speed: 1.18, startOffset: 0.5 },
      );
      stations.push(
        { role: 'nurse', x: 45.2, y: 0.08, z: 3.5, ry: -1.4, action: 'chat' },
        { role: 'gentleman', x: -24.2, y: 0.06, z: -7.2, ry: 0.2, action: 'readNewspaper' },
        { role: 'lady', x: -24.2, y: 0.06, z: 8.8, ry: -0.3, action: 'sit' },
      );
    }
  } else {
    // Paris 1885 winter: patients near clinic outside stops, mostly empty open cafe terraces.
    stations.push(
      { role: 'gentleman', winter: true, x: 25.0, y: 0.08, z: 13.4, ry: 2.4, action: 'chat' },
      { role: 'lady', winter: true, x: 26.0, y: 0.08, z: 13.4, ry: -0.8, action: 'chat' },
      { role: 'gentleman', winter: true, x: 13.8, y: 0.08, z: -33.2, ry: -0.7, action: 'sit' },
    );
  }

  if (busy) {
    // 1889 Exposition Universelle: dense crowds around Champ de Mars & fair pavilions.
    walkers.push(
      { role: 'gentleman', path: champPathN, closed: false, speed: 1.12, startOffset: 0.15, pairRole: 'lady' },
      { role: 'gentleman', path: champPathN, closed: false, speed: 1.18, startOffset: 0.6, pairRole: 'lady' },
      { role: 'gentleman', path: champPathS, closed: false, speed: 1.15, startOffset: 0.3, pairRole: 'lady' },
      { role: 'marketWoman', path: champPathS, closed: false, speed: 1.25, startOffset: 0.8 },
      { role: 'child', path: westSidewalk, closed: false, speed: 1.65, startOffset: 0.5, action: 'hurry' },
      { role: 'vendor', path: eastSidewalk, closed: false, speed: 1.22, startOffset: 0.42 },
    );
    stations.push(
      // Fair visitors craning upward toward the Eiffel Tower.
      { role: 'gentleman', x: -22.5, y: 0.06, z: -5.5, ry: -1.4, action: 'lookUp' },
      { role: 'lady', x: -22.9, y: 0.06, z: -4.6, ry: -1.5, action: 'lookUp' },
      { role: 'child', x: -23.4, y: 0.06, z: -5.0, ry: -1.5, action: 'lookUp' },
      { role: 'gentleman', x: -23.0, y: 0.06, z: 6.2, ry: -2.0, action: 'lookUp' },
      { role: 'lady', x: -23.6, y: 0.06, z: 7.0, ry: -2.1, action: 'lookUp' },
      // Queues outside fair pavilions & stalls.
      { role: 'gentleman', x: -28.0, y: 0.06, z: -15.2, ry: -1.5, action: 'chat' },
      { role: 'lady', x: -26.8, y: 0.06, z: -15.3, ry: -1.5, action: 'chat' },
      { role: 'marketWoman', x: -25.6, y: 0.06, z: -15.1, ry: -1.5, action: 'chat' },
      { role: 'gentleman', x: -28.0, y: 0.06, z: 15.2, ry: -1.5, action: 'chat' },
      { role: 'lady', x: -26.8, y: 0.06, z: 15.3, ry: -1.5, action: 'chat' },
      { role: 'vendor', x: -17.8, y: 0.06, z: -7.0, ry: 1.5, action: 'chat' },
      { role: 'vendor', x: -17.8, y: 0.06, z: 10.0, ry: 1.5, action: 'chat' },
    );
  }

  // Keep a single gendarme archetype pool if needed (omitted in 1885 winter to trim calls cleanly).
  if (!winter) {
    stations.push({ role: 'dockWorker', x: 12.2, y: 0.08, z: -54.0, ry: 0.4, action: 'chat' });
  }

  return {
    walkers,
    stations,
    vehicles: [
      { kind: 'fiacre', bodyColor: palette.hull, path: blvdLoop, speed: winter ? 3.1 : 4.2, startOffset: 0.08 },
      { kind: 'fiacre', bodyColor: palette.hull, path: blvdLoop, speed: winter ? 3.1 : 4.1, startOffset: 0.56 },
      ...(winter ? [] : [{ kind: 'fiacre' as const, bodyColor: palette.hull, path: eastLoop, speed: 3.9, startOffset: 0.35 }]),
      { kind: 'omnibus', bodyColor: palette.awningBlue, path: blvdLoop, speed: winter ? 2.9 : 3.4, startOffset: 0.32 },
      ...(busy ? [{ kind: 'omnibus' as const, bodyColor: palette.awningBlue, path: blvdLoop, speed: 3.3, startOffset: 0.82 }] : []),
      { kind: 'cart', cargo: 'produce', path: eastLoop, speed: 2.5, startOffset: 0.18 },
      ...(winter ? [] : [{ kind: 'cart' as const, cargo: 'crates' as const, path: saintsLoop, speed: 2.4, startOffset: 0.68 }]),
      ...(busy ? [{ kind: 'pennyFarthing' as const, path: blvdLoop, speed: 4.9, startOffset: 0.72 }] : []),
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
      { species: 'pigeon', x: 12.2, y: 0.08, z: -12, count: winter ? 5 : busy ? 14 : 10, radius: 2.4, flightHeight: 5.5, flightRadius: 7 },
      { species: 'pigeon', x: -53.8, y: 0.08, z: 12, count: winter ? 5 : busy ? 10 : 8, radius: 2.2, flightHeight: 5.5, flightRadius: 6.5 },
      ...(busy ? [{ species: 'pigeon' as const, x: -24, y: 0.06, z: -4, count: 10, radius: 2.8, flightHeight: 6, flightRadius: 8 }] : []),
    ],
    animals: [
      { species: 'dog', x: 12.0, y: 0.08, z: 20, count: 1, roamRadius: 2.2 },
      ...(winter ? [] : [{ species: 'dog' as const, x: -23.5, y: 0.06, z: 14, count: 1, roamRadius: 2.4 }]),
      ...(winter ? [] : [{ species: 'cat' as const, x: 13.8, y: 0.12, z: -3.5, ry: -1.4, count: 1 }]),
      ...(busy ? [{ species: 'duck' as const, x: -67, y: -1.18, z: -10, count: 6, roamRadius: 3.5 }] : []),
    ],
  };
}

export function biarritzDressing(): AreaDressing {
  const promWalk = [v(-28, 0.44, 3.6), v(28, 0.44, 3.6)];
  const beachRun = [v(-12, -0.4, 11.4), v(12, -0.4, 11.4)];
  const plateauRoad = [v(-2, 2.66, -14.2), v(26, 2.66, -14.2)];
  const slopeY = (z: number): number => 0.4 + 2.2 * THREE.MathUtils.clamp(-z / 12, 0, 1);

  return {
    walkers: [
      { role: 'gentleman', winter: true, path: promWalk, closed: false, speed: 1.15, startOffset: 0.14, pairRole: 'lady' },
      { role: 'gentleman', winter: true, path: promWalk, closed: false, speed: 1.12, startOffset: 0.48, pairRole: 'lady' },
      { role: 'gentleman', winter: true, path: promWalk, closed: false, speed: 1.18, startOffset: 0.82 },
      { role: 'lady', winter: true, path: promWalk, closed: false, speed: 1.1, startOffset: 0.34 },
      { role: 'marketWoman', winter: true, path: plateauRoad, closed: false, speed: 1.2, startOffset: 0.52 },
      { role: 'child', path: beachRun, closed: false, speed: 1.75, startOffset: 0.25, action: 'hurry' },
      { role: 'child', path: beachRun, closed: false, speed: 1.65, startOffset: 0.72, action: 'hurry' },
    ],
    stations: [
      { role: 'fisherman', x: -5.2, y: -0.46, z: 13.0, ry: 0.4, action: 'mendNet' },
      { role: 'fisherman', x: -10.8, y: -0.46, z: 13.4, ry: 0.7, action: 'chat' },
      { role: 'fisherman', x: 3.2, y: slopeY(-6.0), z: -6.0, ry: 0.3, action: 'lean' },
      { role: 'dockWorker', x: 12.2, y: 2.66, z: -24.5, ry: -1.4, action: 'sweep' },
      { role: 'gentleman', winter: true, x: 10.5, y: 0.44, z: 4.8, ry: 0.1, action: 'readNewspaper' },
      { role: 'lady', winter: true, x: -6.0, y: 0.44, z: 4.8, ry: 0.2, action: 'sit' },
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
      {
        kind: 'rowingBoat',
        bodyColor: palette.shutterBlue,
        path: [v(20, -0.92, 31), v(-20, -0.92, 29)],
        closed: false,
        speed: 1.15,
        startOffset: 0.65,
      },
    ],
    birds: [
      { species: 'gull', x: -8, y: -0.42, z: 12.6, count: 9, radius: 3.2, flightHeight: 5.5, flightRadius: 7.5 },
      { species: 'gull', x: 18, y: -0.45, z: 13.5, count: 8, radius: 3.0, flightHeight: 5.5, flightRadius: 7.5 },
      { species: 'gull', x: -32, y: 2.0, z: 22, count: 6, radius: 3.0, roosting: true, flightHeight: 6.5, flightRadius: 9 },
    ],
    animals: [
      { species: 'dog', x: 2, y: -0.4, z: 11.4, count: 1, roamRadius: 2.8 },
      {
        species: 'sheep',
        x: 8,
        y: 1.5,
        z: -6.0,
        count: 8,
        roamRadius: 2.4,
        graze: true,
        yAt: (_x, z) => slopeY(z),
      },
      { species: 'horse', x: -32, y: 2.66, z: -28, count: 2, roamRadius: 2.0, graze: true },
      { species: 'fish', x: -4, y: -0.88, z: 23, count: 2, roamRadius: 3 },
    ],
  };
}
