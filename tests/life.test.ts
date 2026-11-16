import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { rolePreset, type PersonOptions, type PersonRole } from '../src/story/figures';
import {
  buildCatGeometry,
  buildDogGeometry,
  buildHarnessHorseGeometry,
  buildSheepGeometry,
} from '../src/world/life/animals';
import { bakePersonGeometry, prepareLifeGeometry } from '../src/world/life/instancing';
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
    for (const role of ROLES) {
      for (const winter of [false, true]) {
        const geo = bakePersonGeometry(rolePreset(role, winter, 0));
        const counts = partCounts(geo);
        for (const id of [1, 2, 3, 4, 5]) {
          expect(counts.get(id) ?? 0, `${role} winter=${winter} part ${id}`).toBeGreaterThan(0);
        }
        geo.dispose();
      }
    }

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
});
