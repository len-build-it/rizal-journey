import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildRiderlessHorse, HEAD_REST, NECK_REST, type HorseRig } from '../../player/models';
import { disposeObject, mat, paintPart } from '../../world/kit';
import { palette } from '../../world/palette';
import type { CrowdSpec } from '../figures';
import { makeTrainDepartureScene } from './marseilleScenes';
import { createFrenchFlag, createSteamPlume } from './props';
import type { SceneScript } from './types';

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

function handBagMesh(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.24, 0.34),
    new THREE.MeshStandardMaterial({ color: palette.crateDark, flatShading: true }),
  );
}

function compactPivotMeshes(group: THREE.Group): void {
  group.updateMatrix();
  const children = group.children.filter((c): c is THREE.Mesh => c instanceof THREE.Mesh);
  if (children.length === 0) return;
  const parts: THREE.BufferGeometry[] = [];
  for (const child of children) {
    child.updateMatrix();
    const cloned = child.geometry.clone();
    cloned.applyMatrix4(child.matrix);
    const m = child.material as THREE.MeshStandardMaterial;
    const g = paintPart(cloned, m.color.getHex());
    if (g !== cloned) cloned.dispose();
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    parts.push(g);
    child.removeFromParent();
    child.geometry.dispose();
  }
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  const mesh = new THREE.Mesh(merged, mat(0xffffff, { vertexColors: true }));
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);
}

function compactHorseRig(rig: HorseRig): void {
  compactPivotMeshes(rig.body);
  compactPivotMeshes(rig.neck);
  compactPivotMeshes(rig.head);
  compactPivotMeshes(rig.tail);
  for (const l of rig.legs) {
    compactPivotMeshes(l.hip);
    compactPivotMeshes(l.knee);
  }
}

const paris1883Hotel: SceneScript = {
  storyId: 'paris-1883-hotel',
  duration: 10.5,
  setup(ctx) {
    const bag = handBagMesh();
    bag.position.set(0.06, -0.62, 0.02);
    ctx.rizal.rig.armR.add(bag);

    const doorman = ctx.actor({ coat: 'frock', hat: 'top' }, 19.6, 0, -19.8, Math.PI);
    doorman.setAction('idle');

    // Approach from the east sidewalk along z = -19.8; shoot along the facade at z = -19.4 so the parked horse stays behind.
    ctx.rizal.setPose(22.2, 0, -19.9, -Math.PI * 0.5, 'idle');
    ctx.rizal.walkTo(new THREE.Vector3(19.0, 0, -19.8), 1.2);

    ctx.cutCamera(new THREE.Vector3(15.6, 2.35, -19.4), new THREE.Vector3(19.4, 1.35, -19.8));
    ctx.onDispose(() => {
      bag.removeFromParent();
      bag.geometry.dispose();
      (bag.material as THREE.Material).dispose();
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const camU = THREE.MathUtils.smoothstep(u, 0, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(15.6, 2.35, -19.4), new THREE.Vector3(17.1, 2.05, -19.45), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(19.4, 1.35, -19.8), new THREE.Vector3(19.3, 1.3, -19.7), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.5);
  },
};

const paris1883Hospital: SceneScript = {
  storyId: 'paris-1883-hospital',
  duration: 10.5,
  setup(ctx) {
    // Medical students in the Laennec courtyard (x = 29..37, z = -10..+2; open gate at x = 37, z = -4).
    const s1 = ctx.actor({ coat: 'frock', hat: 'bowler' }, 31.8, 0, -5.6, 0.5);
    const s2 = ctx.actor({ coat: 'frock', hat: 'top' }, 32.8, 0, -5.1, -2.3);
    s1.setAction('gesture');
    s2.setAction('idle');

    const s3 = ctx.actor({ coat: 'frock', hat: 'bowler' }, 35.8, 0, -2.2, 2.8);
    s3.walkTo(new THREE.Vector3(31.4, 0, -2.6), 0.9);

    ctx.rizal.setPose(40.2, 0, -4.0, -Math.PI / 2, 'idle');
    ctx.rizal.walkTo(new THREE.Vector3(33.4, 0, -4.0), 1.35);

    ctx.cutCamera(new THREE.Vector3(45.5, 4.8, -7.0), new THREE.Vector3(33.0, 1.5, -4.0));
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const camU = THREE.MathUtils.smoothstep(u, 0, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(45.5, 4.8, -7.0), new THREE.Vector3(41.8, 3.9, -2.2), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(33.0, 1.5, -4.0), new THREE.Vector3(32.0, 1.4, -4.2), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.6);
  },
};

const paris1883Station = makeTrainDepartureScene({
  storyId: 'paris-1883-station',
  boardStart: new THREE.Vector3(8.2, 0, -53.8),
  boardEnd: new THREE.Vector3(9.1, 0, -58.2),
  trainPos: new THREE.Vector3(1.5, 0, -59.5),
  camStart: new THREE.Vector3(13.2, 4.8, -50.8),
  camEnd: new THREE.Vector3(4.5, 5.6, -50.2),
  lookStart: new THREE.Vector3(7.5, 1.9, -59.5),
  lookEnd: new THREE.Vector3(-4.5, 2.1, -59.5),
  dir: -1,
  travelDist: 14,
});

const paris1885Clinic: SceneScript = {
  storyId: 'paris-1885-clinic',
  duration: 11,
  setup(ctx) {
    // Pale winter light along Rue du Cherche-Midi.
    ctx.setLook({
      sky: 0xb0bcc6,
      fog: 0xc2ccd4,
      sunColor: 0xfff0db,
      sunIntensity: 2.15,
      hemiSky: 0xd0dae2,
      hemiGround: 0x7c7468,
      hemiIntensity: 1.15,
    });

    // Two patients seated on the clinic bench (20.3, 0, 13.6) facing the street, wearing eye bandages.
    const p1 = ctx.actor({ coat: 'frock', hat: 'bowler', eyeBandage: true }, 19.9, 0, 13.55, Math.PI);
    p1.setAction('sit');
    const p2 = ctx.actor({ coat: 'dress', hat: 'small', skirt: true, eyeBandage: true }, 20.75, 0, 13.55, Math.PI);
    p2.setAction('sit');

    // Dr. de Wecker in a clinic smock leaning in to check the seated patients, with Rizal beside him.
    const doctor = ctx.actor({ coat: 'smock', hat: 'none' }, 19.35, 0, 12.85, Math.PI * 0.35);
    doctor.setAction('gesture');

    ctx.rizal.setPose(18.3, 0, 11.9, Math.PI * 0.42, 'idle');
    ctx.rizal.walkTo(new THREE.Vector3(18.55, 0, 12.55), 0.9);

    // Frame from the east carriageway so Rizal, de Wecker, and the seated patients fill the shot cleanly.
    ctx.cutCamera(new THREE.Vector3(23.4, 2.25, 8.4), new THREE.Vector3(19.7, 1.1, 13.2));
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const camU = THREE.MathUtils.smoothstep(u, 0.05, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(23.4, 2.25, 8.4), new THREE.Vector3(22.6, 2.0, 9.2), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(19.7, 1.1, 13.2), new THREE.Vector3(19.7, 1.05, 13.3), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.4);
  },
};

const paris1885Studio: SceneScript = {
  storyId: 'paris-1885-studio',
  duration: 11.5,
  setup(ctx) {
    // Inside Luna's top studio (wooden floor y = 9.54); painter faces the main canvas on his easel.
    const floorY = 9.54;
    const painter = ctx.actor({ coat: 'smock', hat: 'none' }, 33.7, floorY, 34.05, 0.8);
    painter.setAction('paint');

    const friend = ctx.actor({ coat: 'frock', hat: 'none' }, 36.55, floorY, 34.1, -Math.PI * 0.48);
    friend.setAction('gesture');

    ctx.rizal.setPose(35.6, floorY, 34.1, Math.PI * 0.48, 'gesture');

    // Cool north skylight fill from the tall window + warm interior studio glow over the canvas.
    const northFill = new THREE.PointLight(0xd8e8ff, 2.0, 12, 1.4);
    northFill.position.set(35.2, 12.6, 32.6);
    ctx.prop(northFill);

    const studioLight = new THREE.PointLight(0xffdfa8, 2.8, 11, 1.5);
    studioLight.position.set(35.0, 12.0, 34.9);
    ctx.prop(studioLight);

    ctx.cutCamera(new THREE.Vector3(33.0, 11.8, 25.0), new THREE.Vector3(35.1, 10.9, 34.4));
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const camU = THREE.MathUtils.smoothstep(u, 0, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(33.0, 11.8, 25.0), new THREE.Vector3(35.4, 11.4, 27.7), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(35.1, 10.9, 34.4), new THREE.Vector3(35.1, 10.7, 34.4), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.4);
  },
};

const paris1885Station: SceneScript = (() => {
  let steam: ReturnType<typeof createSteamPlume> | null = null;
  let boarded = false;
  const smokeOrigin = new THREE.Vector3();
  const c0 = new THREE.Vector3(12.2, 4.8, -51.0);
  const c1 = new THREE.Vector3(4.5, 9.2, -2.5);
  const l0 = new THREE.Vector3(7.5, 1.9, -59.5);
  const l1 = new THREE.Vector3(-34.0, 2.2, 0.5);
  return {
    storyId: 'paris-1885-station',
    duration: 11,
    setup(ctx) {
      boarded = false;
      ctx.rizal.setPose(8.2, 0, -53.8, 0, 'idle');
      ctx.rizal.walkTo(new THREE.Vector3(9.1, 0, -58.2), 1.85);
      steam = createSteamPlume(10);
      ctx.prop(steam.group);
      ctx.area.setTrainOffset?.(0, 0);
      ctx.cutCamera(c0, l0);
      ctx.onDispose(() => {
        ctx.area.setTrainOffset?.(0, 1);
        steam?.dispose();
        steam = null;
      });
    },
    update(ctx, elapsed, dt) {
      const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
      if (!boarded && u > 0.36) {
        boarded = true;
        ctx.rizal.root.visible = false;
      }
      const doorClose = THREE.MathUtils.smoothstep(u, 0.36, 0.52);
      const rollU = THREE.MathUtils.smoothstep(u, 0.54, 1.0);
      const moveX = -rollU * 14;
      ctx.area.setTrainOffset?.(moveX, doorClose);
      smokeOrigin.set(1.5 + moveX - 2.8, 3.85, -59.5);
      steam?.update(smokeOrigin, elapsed, u > 0.52 ? 1.35 : 0.9);

      // Keep x along the open central boulevard (0..10) all the way down to Champ de Mars at z = -2.5.
      const camU = THREE.MathUtils.smoothstep(u, 0.25, 0.95);
      tmpPos.lerpVectors(c0, c1, camU);
      tmpPos.x = THREE.MathUtils.lerp(c0.x, c1.x, Math.sqrt(camU));
      tmpTarget.lerpVectors(l0, l1, THREE.MathUtils.smoothstep(u, 0.45, 0.95));
      ctx.moveCamera(tmpPos, tmpTarget, dt, 2.6);
    },
  };
})();

const paris1889Tower: SceneScript = {
  storyId: 'paris-1889-tower',
  duration: 12.0,
  setup(ctx) {
    ctx.rizal.setPose(-21.2, 0, 3.8, -Math.PI * 0.68, 'idle');

    // Fairground crowd admiring the base of the Eiffel Tower.
    const specs: CrowdSpec[] = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 10.2 + (i % 3) * 2.0;
      specs.push({
        x: -34 + Math.cos(a) * r,
        y: 0,
        z: Math.sin(a) * r,
        ry: a + Math.PI,
        variant: i % 3,
      });
    }
    ctx.crowd(specs);

    // Workers and officials on the top platform deck (y = 42.32, half = 1.38) raising the French flag.
    const deckY = 42.65;
    const hoist1 = ctx.actor({ coat: 'work', hat: 'none' }, -34.7, deckY, 0.55, Math.PI * 0.75);
    const hoist2 = ctx.actor({ coat: 'frock', hat: 'top' }, -33.3, deckY, 0.55, -Math.PI * 0.75);
    const hoist3 = ctx.actor({ coat: 'work', hat: 'bowler' }, -34.0, deckY, -0.75, 0);
    hoist1.setAction('pull');
    hoist2.setAction('gesture');
    hoist3.setAction('pull');

    const flag = createFrenchFlag();
    flag.group.position.set(-34.0, deckY, 0);
    flag.setProgress(0.05);
    ctx.prop(flag.group);
    (ctx as { flag?: ReturnType<typeof createFrenchFlag> }).flag = flag;

    ctx.cutCamera(new THREE.Vector3(-17.5, 4.8, 12.0), new THREE.Vector3(-33.5, 9.5, 0));
    ctx.onDispose(() => {
      delete (ctx as { flag?: ReturnType<typeof createFrenchFlag> }).flag;
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const flag = (ctx as { flag?: ReturnType<typeof createFrenchFlag> }).flag;
    if (flag) {
      flag.setProgress(THREE.MathUtils.smoothstep(u, 0.28, 0.92));
    }
    // Tilt from the base crowd up to the summit tricolor (framed so the full flag fits cleanly).
    const ascendU = THREE.MathUtils.smoothstep(u, 0.14, 0.92);
    tmpPos.lerpVectors(new THREE.Vector3(-17.5, 4.8, 12.0), new THREE.Vector3(-21.2, 47.4, 12.4), ascendU);
    tmpTarget.lerpVectors(new THREE.Vector3(-33.5, 9.5, 0), new THREE.Vector3(-34.0, 46.1, 0), ascendU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.3);
  },
};

const paris1889IndiosBravos: SceneScript = {
  storyId: 'paris-1889-indios-bravos',
  duration: 11.5,
  setup(ctx) {
    ctx.area.setArenaSceneActive?.(true);

    // Spectator crowd seated cleanly on both grandstands (no Native American figures anywhere).
    const specs: CrowdSpec[] = [];
    for (let i = 0; i < 16; i++) {
      const sx = -44.8 + i * 1.18;
      specs.push({ x: sx, y: 0.72, z: 32.9, ry: 0, variant: i % 3 });
      specs.push({ x: sx + 0.3, y: 1.42, z: 31.8, ry: 0, variant: (i + 1) % 3 });
      specs.push({ x: sx, y: 0.72, z: 49.9, ry: Math.PI, variant: (i + 2) % 3 });
      specs.push({ x: sx + 0.2, y: 1.42, z: 51.0, ry: Math.PI, variant: i % 3 });
    }
    ctx.crowd(specs);

    // Rizal and friends watching beside the east arena arch (x = -21.6, z = 41.5).
    ctx.rizal.setPose(-19.8, 0, 40.3, -Math.PI * 0.55, 'gesture');
    const f1 = ctx.actor({ coat: 'frock', hat: 'top' }, -19.2, 0, 41.6, -Math.PI * 0.5);
    const f2 = ctx.actor({ coat: 'frock', hat: 'bowler' }, -19.6, 0, 42.7, -Math.PI * 0.45);
    f1.setAction('idle');
    f2.setAction('gesture');

    // Riderless horses galloping around the oval track inside the ring (compacted for low draw calls).
    const horses: { rig: HorseRig; phase: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const rig = buildRiderlessHorse();
      compactHorseRig(rig);
      ctx.prop(rig.root);
      horses.push({ rig, phase: (i * Math.PI * 2) / 3 });
    }
    (ctx as { arenaHorses?: { rig: HorseRig; phase: number }[] }).arenaHorses = horses;

    ctx.cutCamera(new THREE.Vector3(-12.5, 5.2, 34.5), new THREE.Vector3(-29.5, 1.4, 41.5));
    ctx.onDispose(() => {
      ctx.area.setArenaSceneActive?.(false);
      for (const h of horses) disposeObject(h.rig.root);
      delete (ctx as { arenaHorses?: { rig: HorseRig; phase: number }[] }).arenaHorses;
    });
  },
  update(ctx, elapsed, dt) {
    const horses = (ctx as { arenaHorses?: { rig: HorseRig; phase: number }[] }).arenaHorses;
    if (horses) {
      horses.forEach(({ rig, phase }, idx) => {
        const theta = elapsed * 0.9 + phase;
        const rx = 10.6;
        const rz = 4.6;
        const x = -36 + Math.cos(theta) * rx;
        const z = 41.5 + Math.sin(theta) * rz;
        const tx = -Math.sin(theta) * rx;
        const tz = Math.cos(theta) * rz;
        const g = elapsed * 10 + idx * 1.4;
        rig.root.position.set(x, 0.04 + Math.max(0, Math.sin(g * 2)) * 0.05, z);
        rig.root.rotation.y = Math.atan2(tx, tz);
        rig.body.position.y = Math.sin(g * 2) * 0.04;
        rig.body.rotation.x = Math.sin(g) * 0.05;
        rig.neck.rotation.x = NECK_REST + Math.sin(g - 0.5) * 0.14;
        rig.head.rotation.x = HEAD_REST - Math.sin(g - 0.5) * 0.1;
        rig.tail.rotation.x = -0.55 + Math.sin(g) * 0.15;
        for (const leg of rig.legs) {
          const p = g + (leg.front ? 0 : Math.PI) + (leg.side < 0 ? 0.35 : 0);
          leg.hip.rotation.x = Math.sin(p) * 0.55;
          leg.knee.rotation.x = Math.max(0, Math.cos(p)) * 0.65;
        }
      });
    }

    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const camU = THREE.MathUtils.smoothstep(u, 0, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(-12.5, 5.2, 34.5), new THREE.Vector3(-18.2, 7.2, 33.2), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(-29.5, 1.4, 41.5), new THREE.Vector3(-32.5, 1.4, 41.5), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.4);
  },
};

const paris1889Godfather: SceneScript = {
  storyId: 'paris-1889-godfather',
  duration: 10.5,
  setup(ctx) {
    // Outside Luna's studio on Rue des Saints-Peres (x = 36, z = 30.8 facing north -Z).
    const mother = ctx.actor({ coat: 'dress', hat: 'small', skirt: true, baby: true }, 35.15, 0, 30.8, Math.PI);
    mother.setAction('hold');
    const father = ctx.actor({ coat: 'frock', hat: 'bowler' }, 36.05, 0, 30.8, Math.PI);
    father.setAction('idle');

    const f1 = ctx.actor({ coat: 'frock', hat: 'top' }, 36.85, 0, 30.1, -Math.PI * 0.72);
    const f2 = ctx.actor({ coat: 'frock', hat: 'bowler' }, 33.75, 0, 30.5, Math.PI * 0.75);
    f1.setAction('idle');
    f2.setAction('idle');

    ctx.rizal.setPose(34.45, 0, 29.9, Math.PI * 0.65, 'gesture');

    // Frame from Rue des Saints-Peres so the full group and faces read clearly.
    ctx.cutCamera(new THREE.Vector3(33.2, 2.25, 24.8), new THREE.Vector3(35.5, 1.1, 30.4));
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const camU = THREE.MathUtils.smoothstep(u, 0, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(33.2, 2.25, 24.8), new THREE.Vector3(33.8, 2.1, 25.6), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(35.5, 1.1, 30.4), new THREE.Vector3(35.5, 1.08, 30.45), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.4);
  },
};

const paris1889Morga: SceneScript = {
  storyId: 'paris-1889-morga',
  duration: 11.0,
  setup(ctx) {
    // Soften north-side facade shadows evenly without harsh close point-light rings.
    ctx.setLook({
      sunDirection: new THREE.Vector3(-0.35, 0.55, -0.75).normalize(),
      sunIntensity: 2.9,
      hemiIntensity: 1.45,
    });

    // Bookstall display desk outside the bookshop on Rue des Saints-Peres (x = 17.5, front z = 31.95).
    const stallGroup = new THREE.Group();
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.08, 0.9),
      mat(palette.deckWood),
    );
    deskTop.position.set(17.5, 0.86, 31.0);
    stallGroup.add(deskTop);

    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.03, 0.72),
      mat(palette.sail),
    );
    cloth.position.set(17.5, 0.91, 31.0);
    stallGroup.add(cloth);

    for (const lx of [-0.75, 0.75]) {
      for (const lz of [-0.36, 0.36]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.86, 0.08),
          mat(palette.crateDark),
        );
        leg.position.set(17.5 + lx, 0.43, 31.0 + lz);
        stallGroup.add(leg);
      }
    }

    // Small brass lamp on the corner of the desk lighting the Morga edition.
    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.24, 8),
      mat(palette.brass),
    );
    lampBase.position.set(16.9, 1.04, 31.1);
    stallGroup.add(lampBase);
    const lampShadeMat = new THREE.MeshBasicMaterial({ color: palette.gaslight });
    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.14, 8),
      lampShadeMat,
    );
    lampShade.position.set(16.9, 1.22, 31.1);
    stallGroup.add(lampShade);

    // Neat stack of books beside the featured Morga volume.
    for (let i = 0; i < 3; i++) {
      const stackBook = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.08, 0.24),
        mat(i === 1 ? palette.awningRed : palette.streetSignBlue),
      );
      stackBook.position.set(18.0, 0.96 + i * 0.082, 31.02);
      stackBook.rotation.y = i * 0.14;
      stallGroup.add(stackBook);
    }
    ctx.prop(stallGroup);

    const windowLight = new THREE.PointLight(0xffe1ad, 2.0, 16, 1.0);
    windowLight.position.set(17.2, 3.2, 29.4);
    ctx.prop(windowLight);

    const seller = ctx.actor({ coat: 'work', hat: 'none' }, 18.25, 0, 31.35, -0.45);
    seller.setAction('gesture');

    // Cream-and-ink featured copy of Sucesos de las Islas Filipinas placed upright on the lit desk.
    const bookGroup = new THREE.Group();
    const coverGeo = new THREE.BoxGeometry(0.36, 0.48, 0.12);
    const pagesGeo = new THREE.BoxGeometry(0.32, 0.44, 0.14);
    const cover = new THREE.Mesh(coverGeo, mat(palette.sail));
    const spine = new THREE.Mesh(pagesGeo, mat(palette.awningRed));
    spine.position.z = -0.01;
    bookGroup.add(cover, spine);
    bookGroup.position.set(17.7, 1.15, 31.05);
    bookGroup.rotation.set(-0.25, -0.35, 0);
    ctx.prop(bookGroup);
    (ctx as { morgaBook?: THREE.Group }).morgaBook = bookGroup;

    ctx.rizal.setPose(16.15, 0, 30.8, Math.PI * 0.42, 'idle');

    // Frame Rizal, the bookseller, the lit desk, and the Morga volume cleanly from the west sidewalk.
    ctx.cutCamera(new THREE.Vector3(14.1, 2.05, 27.5), new THREE.Vector3(17.4, 1.05, 31.0));
    ctx.onDispose(() => {
      coverGeo.dispose();
      pagesGeo.dispose();
      lampShadeMat.dispose();
      delete (ctx as { morgaBook?: THREE.Group }).morgaBook;
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const book = (ctx as { morgaBook?: THREE.Group }).morgaBook;
    if (book) {
      const placeU = THREE.MathUtils.smoothstep(u, 0.15, 0.55);
      book.position.set(
        THREE.MathUtils.lerp(17.95, 17.5, placeU),
        THREE.MathUtils.lerp(1.1, 1.16, placeU),
        THREE.MathUtils.lerp(31.18, 30.95, placeU),
      );
    }
    const camU = THREE.MathUtils.smoothstep(u, 0.2, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(14.1, 2.05, 27.5), new THREE.Vector3(14.6, 1.92, 27.9), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(17.4, 1.05, 31.0), new THREE.Vector3(17.4, 1.05, 31.05), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.4);
  },
};

const paris1889Station = makeTrainDepartureScene({
  storyId: 'paris-1889-station',
  boardStart: new THREE.Vector3(8.2, 0, -53.8),
  boardEnd: new THREE.Vector3(9.1, 0, -58.2),
  trainPos: new THREE.Vector3(1.5, 0, -59.5),
  camStart: new THREE.Vector3(13.2, 4.8, -50.8),
  camEnd: new THREE.Vector3(4.5, 5.6, -50.2),
  lookStart: new THREE.Vector3(7.5, 1.9, -59.5),
  lookEnd: new THREE.Vector3(-4.5, 2.1, -59.5),
  dir: -1,
  travelDist: 14,
  nightLook: {
    sky: 0x3b334f,
    fog: 0x5c4b5e,
    sunColor: 0xffa66b,
    sunIntensity: 1.55,
    sunDirection: new THREE.Vector3(-0.55, 0.25, 0.78).normalize(),
    hemiSky: 0x706384,
    hemiGround: 0x453a32,
    hemiIntensity: 0.85,
  },
});

export const PARIS_SCENES: SceneScript[] = [
  paris1883Hotel,
  paris1883Hospital,
  paris1883Station,
  paris1885Clinic,
  paris1885Studio,
  paris1885Station,
  paris1889Tower,
  paris1889IndiosBravos,
  paris1889Godfather,
  paris1889Morga,
  paris1889Station,
];
