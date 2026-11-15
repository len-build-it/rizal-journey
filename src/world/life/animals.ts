import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildRiderlessHorse } from '../../player/models';
import { mat, paintPart } from '../kit';
import { palette } from '../palette';

function mergeAnimalParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return new THREE.BufferGeometry();
  merged.computeVertexNormals();
  return merged;
}

export function buildPigeonGeometry(flying = false, coatColor = palette.railSteel): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintPart(new THREE.IcosahedronGeometry(0.11, 0), coatColor, {
      y: 0.14,
      sx: 0.85,
      sy: 0.85,
      sz: 1.35,
    }),
    paintPart(new THREE.IcosahedronGeometry(0.065, 0), palette.shirt, {
      y: 0.23,
      z: 0.11,
    }),
    paintPart(new THREE.ConeGeometry(0.022, 0.06, 4), palette.ochre, {
      y: 0.22,
      z: 0.18,
      rx: Math.PI * 0.5,
    }),
    paintPart(new THREE.BoxGeometry(0.11, 0.03, 0.14), coatColor, {
      y: 0.11,
      z: -0.17,
      rx: 0.25,
    }),
  ];
  if (flying) {
    for (const side of [-1, 1] as const) {
      parts.push(
        paintPart(new THREE.BoxGeometry(0.24, 0.025, 0.12), coatColor, {
          x: side * 0.16,
          y: 0.24,
          z: 0.02,
          rz: side * 0.52,
        }),
      );
    }
  } else {
    for (const side of [-1, 1] as const) {
      parts.push(
        paintPart(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 4), palette.awningRed, {
          x: side * 0.04,
          y: 0.045,
          z: 0.01,
        }),
      );
    }
  }
  return mergeAnimalParts(parts);
}

export function buildSeagullGeometry(flying = true): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintPart(new THREE.IcosahedronGeometry(0.13, 0), palette.shirt, {
      y: 0.16,
      sx: 0.85,
      sy: 0.78,
      sz: 1.55,
    }),
    paintPart(new THREE.IcosahedronGeometry(0.075, 0), palette.shirt, {
      y: 0.22,
      z: 0.17,
    }),
    paintPart(new THREE.ConeGeometry(0.026, 0.08, 4), palette.gaslight, {
      y: 0.21,
      z: 0.25,
      rx: Math.PI * 0.5,
    }),
    paintPart(new THREE.BoxGeometry(0.14, 0.028, 0.16), palette.sail, {
      y: 0.15,
      z: -0.22,
      rx: 0.12,
    }),
  ];
  if (flying) {
    for (const side of [-1, 1] as const) {
      parts.push(
        paintPart(new THREE.BoxGeometry(0.32, 0.03, 0.15), palette.shirt, {
          x: side * 0.21,
          y: 0.22,
          z: 0.02,
          rz: side * 0.22,
        }),
        paintPart(new THREE.BoxGeometry(0.2, 0.026, 0.11), palette.railSteel, {
          x: side * 0.44,
          y: 0.24,
          z: -0.02,
          rz: -side * 0.12,
        }),
      );
    }
  } else {
    for (const side of [-1, 1] as const) {
      parts.push(
        paintPart(new THREE.BoxGeometry(0.05, 0.12, 0.22), palette.railSteel, {
          x: side * 0.11,
          y: 0.16,
          z: -0.03,
        }),
        paintPart(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 4), palette.gaslight, {
          x: side * 0.045,
          y: 0.05,
        }),
      );
    }
  }
  return mergeAnimalParts(parts);
}

export function buildDogGeometry(coatColor = palette.ochre): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintPart(new THREE.BoxGeometry(0.24, 0.24, 0.56), coatColor, { y: 0.34 }),
    paintPart(new THREE.IcosahedronGeometry(0.13, 0), coatColor, { y: 0.49, z: 0.31 }),
    paintPart(new THREE.BoxGeometry(0.1, 0.09, 0.12), palette.doorBrown, { y: 0.46, z: 0.41 }),
    paintPart(new THREE.ConeGeometry(0.045, 0.1, 4), palette.doorBrown, {
      x: -0.09,
      y: 0.59,
      z: 0.28,
      rz: 0.25,
    }),
    paintPart(new THREE.ConeGeometry(0.045, 0.1, 4), palette.doorBrown, {
      x: 0.09,
      y: 0.59,
      z: 0.28,
      rz: -0.25,
    }),
    paintPart(new THREE.CylinderGeometry(0.025, 0.035, 0.24, 5), coatColor, {
      y: 0.44,
      z: -0.32,
      rx: -0.65,
    }),
  ];
  for (const [lx, lz] of [
    [-0.08, 0.2],
    [0.08, 0.2],
    [-0.08, -0.2],
    [0.08, -0.2],
  ] as const) {
    parts.push(
      paintPart(new THREE.CylinderGeometry(0.038, 0.03, 0.24, 5), coatColor, {
        x: lx,
        y: 0.12,
        z: lz,
      }),
    );
  }
  return mergeAnimalParts(parts);
}

export function buildCatGeometry(coatColor = palette.crateDark): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintPart(new THREE.CapsuleGeometry(0.085, 0.24, 3, 6), coatColor, {
      y: 0.17,
      rx: Math.PI / 2,
    }),
    paintPart(new THREE.IcosahedronGeometry(0.085, 0), coatColor, { y: 0.27, z: 0.19 }),
    paintPart(new THREE.ConeGeometry(0.03, 0.075, 4), coatColor, {
      x: -0.055,
      y: 0.35,
      z: 0.18,
    }),
    paintPart(new THREE.ConeGeometry(0.03, 0.075, 4), coatColor, {
      x: 0.055,
      y: 0.35,
      z: 0.18,
    }),
    paintPart(new THREE.CylinderGeometry(0.018, 0.024, 0.24, 5), coatColor, {
      y: 0.28,
      z: -0.2,
      rx: -0.35,
    }),
  ];
  for (const [lx, lz] of [
    [-0.05, 0.11],
    [0.05, 0.11],
    [-0.05, -0.11],
    [0.05, -0.11],
  ] as const) {
    parts.push(
      paintPart(new THREE.CylinderGeometry(0.022, 0.018, 0.14, 5), coatColor, {
        x: lx,
        y: 0.07,
        z: lz,
      }),
    );
  }
  return mergeAnimalParts(parts);
}

export function buildSheepGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintPart(new THREE.IcosahedronGeometry(0.32, 0), palette.foam, {
      y: 0.56,
      sx: 0.95,
      sy: 0.9,
      sz: 1.35,
    }),
    paintPart(new THREE.IcosahedronGeometry(0.24, 0), palette.shirt, {
      y: 0.62,
      z: 0.14,
    }),
    paintPart(new THREE.IcosahedronGeometry(0.13, 0), palette.bayDark, {
      y: 0.64,
      z: 0.44,
      sx: 0.85,
      sy: 0.9,
      sz: 1.15,
    }),
    paintPart(new THREE.BoxGeometry(0.24, 0.05, 0.06), palette.bayDark, {
      y: 0.68,
      z: 0.4,
    }),
  ];
  for (const [lx, lz] of [
    [-0.14, 0.2],
    [0.14, 0.2],
    [-0.14, -0.2],
    [0.14, -0.2],
  ] as const) {
    parts.push(
      paintPart(new THREE.CylinderGeometry(0.042, 0.032, 0.32, 5), palette.bayDark, {
        x: lx,
        y: 0.16,
        z: lz,
      }),
    );
  }
  return mergeAnimalParts(parts);
}

export function buildDuckGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintPart(new THREE.IcosahedronGeometry(0.16, 0), palette.crate, {
      y: 0.11,
      sx: 0.85,
      sy: 0.72,
      sz: 1.35,
    }),
    paintPart(new THREE.CylinderGeometry(0.055, 0.07, 0.16, 6), palette.pine, {
      y: 0.22,
      z: 0.14,
      rx: 0.22,
    }),
    paintPart(new THREE.IcosahedronGeometry(0.072, 0), palette.pine, {
      y: 0.31,
      z: 0.18,
    }),
    paintPart(new THREE.BoxGeometry(0.06, 0.025, 0.1), palette.ochre, {
      y: 0.29,
      z: 0.26,
    }),
  ];
  return mergeAnimalParts(parts);
}

export function buildFishGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    paintPart(new THREE.IcosahedronGeometry(0.12, 0), palette.railSteel, {
      y: 0.12,
      sx: 0.45,
      sy: 0.72,
      sz: 1.85,
    }),
    paintPart(new THREE.BoxGeometry(0.04, 0.16, 0.12), palette.zincRoofDark, {
      y: 0.12,
      z: -0.24,
      rx: 0.2,
    }),
  ];
  return mergeAnimalParts(parts);
}

/**
 * Reuses the riderless bay horse geometry and adds leather collar and harness straps.
 * Static merged geometry keeps each horse-drawn vehicle lean.
 */
export function buildHarnessHorseGeometry(coatTint = palette.bay): THREE.BufferGeometry {
  const rig = buildRiderlessHorse();
  rig.neck.rotation.x = 0.72;
  rig.head.rotation.x = 1.05;
  rig.root.updateMatrixWorld(true);

  const parts: THREE.BufferGeometry[] = [];
  rig.root.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      const geo = c.geometry.clone();
      geo.applyMatrix4(c.matrixWorld);
      const color =
        c.material instanceof THREE.MeshStandardMaterial ? c.material.color.getHex() : coatTint;
      parts.push(paintPart(geo, color === palette.bay ? coatTint : color));
      c.geometry.dispose();
    }
  });

  // Leather collar and girth strap.
  parts.push(
    paintPart(new THREE.TorusGeometry(0.24, 0.045, 5, 10), palette.saddle, {
      y: 1.48,
      z: 0.58,
      rx: 0.42,
    }),
    paintPart(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 10, 1, true), palette.doorBrown, {
      y: 1.36,
      z: 0.08,
      rx: Math.PI / 2,
      sx: 0.85,
      sz: 1.08,
    }),
  );

  return mergeAnimalParts(parts);
}

/** Convenience preview mesh wrapper for showcase/testing. */
export function previewAnimalMesh(geo: THREE.BufferGeometry): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat(0xffffff, { vertexColors: true }));
  m.castShadow = true;
  m.receiveShadow = false;
  return m;
}
