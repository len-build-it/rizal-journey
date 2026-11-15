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

/** Adds brass-rimmed lit cabin portholes flush against a steamer hull for night scenes. */
export function createLitPortholes(cx: number, y: number, zSide: number, count = 7): THREE.Group {
  const group = new THREE.Group();
  const rimGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 10);
  rimGeo.rotateX(Math.PI / 2);
  const glassGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 10);
  glassGeo.rotateX(Math.PI / 2);
  const rimMat = mat(palette.brass, { roughness: 0.45 });
  const glassMat = mat(0xf7d68a, {
    emissive: 0xe6aa48,
    roughness: 0.3,
  });
  glassMat.emissiveIntensity = 0.85;
  for (let i = 0; i < count; i++) {
    const px = cx - (count - 1) * 1.05 + i * 2.1;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.set(px, y, zSide);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(px, y, zSide - 0.01);
    group.add(rim, glass);
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
  // Unlit stripes keep blue, white, and red crisp against warm 1889 evening sunlight.
  const colors = [0x244885, palette.shirt, palette.vermilion];
  colors.forEach((c, i) => {
    const s = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: c }));
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
