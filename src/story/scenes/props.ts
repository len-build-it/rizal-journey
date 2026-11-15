import * as THREE from 'three';
import { mat } from '../../world/kit';
import { palette } from '../../world/palette';

/**
 * Pool of soft white steam puffs rising from a locomotive funnel or steamer whistle.
 */
export function createSteamPlume(count = 10): {
  group: THREE.Group;
  update(origin: THREE.Vector3, time: number, burst?: number): void;
  dispose(): void;
} {
  const group = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(0.35, 0);
  const m = mat(palette.foam, { roughness: 0.95 });
  const puffs: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(geo, m);
    mesh.castShadow = false;
    group.add(mesh);
    puffs.push(mesh);
  }
  return {
    group,
    update(origin: THREE.Vector3, time: number, burst = 1) {
      puffs.forEach((p, i) => {
        const life = ((time * 0.65 + i / count) % 1);
        const s = (0.45 + life * 1.65) * burst;
        p.position.set(
          origin.x - life * 1.2 + Math.sin(time * 2 + i) * 0.25,
          origin.y + life * 3.8 * burst,
          origin.z + Math.cos(time * 1.7 + i) * 0.2,
        );
        p.scale.setScalar(s * (1 - life * 0.35));
      });
    },
    dispose() {
      group.removeFromParent();
      geo.dispose();
    },
  };
}

/** Adds warm emissive portholes along a steamer hull for dusk/night arrival scenes. */
export function createLitPortholes(cx: number, y: number, zSide: number, count = 8): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.16, 0.16, 0.08, 8);
  geo.rotateX(Math.PI / 2);
  const m = mat(palette.gaslight, { emissive: palette.gaslight, roughness: 0.4 });
  for (let i = 0; i < count; i++) {
    const p = new THREE.Mesh(geo, m);
    p.position.set(cx - (count - 1) * 0.9 + i * 1.8, y, zSide);
    group.add(p);
  }
  return group;
}

/** Small sailing boat with lateen sail for bay panning scenes. */
export function createSailingBoat(hullColor = palette.shutterBlue): THREE.Group {
  const group = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 4.2, 6),
    mat(hullColor),
  );
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(0.65, 1, 0.9);
  hull.position.y = 0.15;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 5), mat(palette.deckWood));
  mast.position.y = 1.7;
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.95, 2.5, 3), mat(palette.sail));
  sail.scale.set(0.14, 1, 1.15);
  sail.position.set(0.65, 1.95, 0);
  sail.rotation.z = -0.35;
  group.add(hull, mast, sail);
  return group;
}

/** Vertical flagpole + French tricolor flag that rises and unfurls as `progress` goes 0..1. */
export function createFrenchFlag(): {
  group: THREE.Group;
  setProgress(p: number): void;
} {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 5.2, 6),
    mat(palette.shirt),
  );
  pole.position.y = 2.6;
  group.add(pole);

  const flagPivot = new THREE.Group();
  const stripeW = 0.95;
  const stripeH = 1.4;
  const stripeGeo = new THREE.BoxGeometry(stripeW, stripeH, 0.06);
  const colors = [palette.streetSignBlue, palette.shirt, palette.awningRed];
  colors.forEach((c, i) => {
    const s = new THREE.Mesh(stripeGeo, mat(c));
    s.position.set(stripeW * (i + 0.5), -stripeH / 2, 0);
    flagPivot.add(s);
  });
  group.add(flagPivot);

  return {
    group,
    setProgress(p: number) {
      const clamped = THREE.MathUtils.clamp(p, 0, 1);
      flagPivot.position.y = THREE.MathUtils.lerp(1.4, 5.1, clamped);
      const unfurl = THREE.MathUtils.smoothstep(clamped, 0.45, 1.0);
      flagPivot.scale.set(0.25 + 0.75 * unfurl, 1, 1);
      flagPivot.rotation.y = Math.sin(performance.now() * 0.005) * (0.06 + 0.14 * unfurl);
    },
  };
}
