import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  PERSON_LEG_LENGTH,
  rolePreset,
  strideOmega,
  walkSwingAngle,
  type PersonOptions,
  type PersonRole,
} from '../src/story/figures';
import {
  buildCatGeometry,
  buildDogGeometry,
  buildHarnessHorseGeometry,
  buildSheepGeometry,
} from '../src/world/life/animals';
import {
  LIFE_ANIM_DIST,
  bakePersonGeometry,
  prepareLifeGeometry,
} from '../src/world/life/instancing';
import {
  buildCartGeometry,
  buildFiacreGeometry,
  buildHandcartGeometry,
  buildOmnibusGeometry,
} from '../src/world/life/vehicles';

const ROLES: PersonRole[] = [
  'dockWorker',
  'fisherman',
  'marketWoman',
  'gentleman',
  'lady',
  'child',
  'nurse',
  'coachman',
  'gendarme',
  'vendor',
];

function partCounts(geo: THREE.BufferGeometry): Map<number, number> {
  const attr = geo.getAttribute('aLifePart');
  const counts = new Map<number, number>();
  if (!attr) return counts;
  for (let i = 0; i < attr.count; i++) {
    const id = Math.round(attr.getX(i));
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

describe('background life rig part tagging', () => {
  it('tags parts 1..5 for every person role and coat style', () => {
    const triSummary: string[] = [];
    for (const role of ROLES) {
      for (const winter of [false, true]) {
        for (const seed of [0, 1, 2]) {
          const geo = bakePersonGeometry(rolePreset(role, winter, seed));
          const counts = partCounts(geo);
          const tris = geo.getAttribute('position').count / 3;
          if (!winter && seed === 0) triSummary.push(`${role}=${tris}`);
          expect(tris, `${role} winter=${winter} seed=${seed} triangles`).toBeLessThan(600);
          for (const id of [1, 2, 3, 4, 5, 11, 12]) {
            expect(counts.get(id) ?? 0, `${role} winter=${winter} part ${id}`).toBeGreaterThan(0);
          }
          if (role === 'lady' || role === 'marketWoman' || role === 'nurse') {
            expect(counts.get(9) ?? 0, `${role} skirt part 9`).toBeGreaterThan(0);
          }
          geo.dispose();
        }
      }
    }
    console.log('person-triangles:', triSummary.join(', '));

    const styles: PersonOptions[] = [
      { coat: 'frock', hat: 'top' },
      { coat: 'work', hat: 'flatcap' },
      { coat: 'smock', hat: 'none', scale: 0.72 },
      { coat: 'dress', skirt: true, hat: 'small' },
      { coat: 'waistcoat', rolledTrousers: true },
    ];
    for (const [idx, opts] of styles.entries()) {
      const geo = bakePersonGeometry(opts);
      const counts = partCounts(geo);
      for (const id of [1, 2, 3, 4, 5]) {
        expect(counts.get(id) ?? 0, `style#${idx} part ${id}`).toBeGreaterThan(0);
      }
      geo.dispose();
    }
  });

  it('tags quadruped legs and heads from rig for horses, carriage horses, dogs, cats, and sheep', () => {
    const animals: [string, THREE.BufferGeometry, number][] = [
      ['horse', prepareLifeGeometry(buildHarnessHorseGeometry(), 'quad'), 0.85],
      ['dog', prepareLifeGeometry(buildDogGeometry(), 'quad'), 0.2],
      ['cat', prepareLifeGeometry(buildCatGeometry(), 'quad'), 0.12],
      ['sheep', prepareLifeGeometry(buildSheepGeometry(), 'quad'), 0.28],
      ['fiacre', prepareLifeGeometry(buildFiacreGeometry()), 0.85],
      ['omnibus', prepareLifeGeometry(buildOmnibusGeometry()), 0.85],
      ['cart', prepareLifeGeometry(buildCartGeometry()), 0.85],
    ];

    for (const [name, geo, minUpperLegY] of animals) {
      const counts = partCounts(geo);
      for (const id of [1, 2, 3, 4, 5]) {
        expect(counts.get(id) ?? 0, `${name} part ${id}`).toBeGreaterThan(0);
      }
      const pos = geo.getAttribute('position');
      const part = geo.getAttribute('aLifePart');
      let maxLegY = -Infinity;
      for (let i = 0; i < pos.count; i++) {
        const pid = Math.round(part.getX(i));
        if (pid >= 1 && pid <= 4) maxLegY = Math.max(maxLegY, pos.getY(i));
      }
      expect(maxLegY, `${name} upper leg y`).toBeGreaterThan(minUpperLegY);
      geo.dispose();
    }

    // Handcart pusher also keeps legL(1), legR(2), and head(5) tagged.
    const handcart = prepareLifeGeometry(buildHandcartGeometry());
    const hcCounts = partCounts(handcart);
    expect(hcCounts.get(1) ?? 0).toBeGreaterThan(0);
    expect(hcCounts.get(2) ?? 0).toBeGreaterThan(0);
    expect(hcCounts.get(5) ?? 0).toBeGreaterThan(0);
    handcart.dispose();
  });

  it('bakes scaled rig pivots into aLifePivot for people and quadrupeds', () => {
    const firstPivotY = (geo: THREE.BufferGeometry, partId: number): number => {
      const part = geo.getAttribute('aLifePart');
      const pivot = geo.getAttribute('aLifePivot');
      for (let i = 0; i < part.count; i++) {
        if (Math.round(part.getX(i)) === partId) return pivot.getY(i);
      }
      return NaN;
    };

    const adult = bakePersonGeometry(rolePreset('gentleman', false, 0));
    const child = bakePersonGeometry(rolePreset('child', false, 0));
    const dress = bakePersonGeometry(rolePreset('lady', false, 0));
    expect(firstPivotY(adult, 1)).toBeCloseTo(0.76, 3);
    expect(firstPivotY(adult, 3)).toBeCloseTo(1.26, 3);
    expect(firstPivotY(child, 1)).toBeCloseTo(0.76 * 0.72, 3);
    expect(firstPivotY(child, 3)).toBeCloseTo(1.26 * 0.72, 3);
    expect(firstPivotY(dress, 1)).toBeCloseTo(0.76, 3);
    adult.dispose();
    child.dispose();
    dress.dispose();

    const fiacre = prepareLifeGeometry(buildFiacreGeometry());
    const part = fiacre.getAttribute('aLifePart');
    const pivot = fiacre.getAttribute('aLifePivot');
    let frontPivotZ = -Infinity;
    for (let i = 0; i < part.count; i++) {
      if (Math.round(part.getX(i)) === 1) {
        frontPivotZ = Math.max(frontPivotZ, pivot.getZ(i));
      }
    }
    expect(frontPivotZ).toBeGreaterThan(1.8);
    fiacre.dispose();
  });

  it('matches cadence to speed so a planted foot slides at most 5 cm during a step', () => {
    for (const [label, legLength, speed] of [
      ['adult', PERSON_LEG_LENGTH, 1.22],
      ['hurry', PERSON_LEG_LENGTH, 1.85],
      ['child', PERSON_LEG_LENGTH * 0.72, 1.22],
      ['dog', 0.24, 1.2],
      ['horse', 1.06, 3.2],
    ] as const) {
      const stride = 1.6 * legLength;
      const omega = strideOmega(speed, legLength);
      const stepDuration = Math.PI / omega;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (let i = 0; i <= 100; i++) {
        const t = -stepDuration / 2 + (stepDuration * i) / 100;
        const phase = omega * t;
        const bodyZ = speed * t;
        const footWorldZ = bodyZ - legLength * Math.sin(walkSwingAngle(phase));
        minZ = Math.min(minZ, footWorldZ);
        maxZ = Math.max(maxZ, footWorldZ);
      }
      expect(maxZ - minZ, `${label} planted foot slide`).toBeLessThanOrEqual(0.05);
      expect(stride / stepDuration).toBeCloseTo(2 * speed, 4);
    }
    expect(LIFE_ANIM_DIST).toBeGreaterThanOrEqual(80);
  });
});
