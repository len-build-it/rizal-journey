import * as THREE from 'three';
import { palette } from '../../world/palette';
import type { PersonActor } from '../figures';
import { createLitPortholes, createSailingBoat, createSteamPlume } from './props';
import type { SceneScript } from './types';

const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

function trunkBox(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.34, 0.65),
    new THREE.MeshStandardMaterial({ color: palette.crateDark, flatShading: true }),
  );
}

/**
 * Shared train-departure helper for station scenes across Marseille, Paris, and Biarritz.
 */
export function makeTrainDepartureScene(opts: {
  storyId: string;
  boardStart: THREE.Vector3;
  boardEnd: THREE.Vector3;
  trainPos: THREE.Vector3;
  camStart: THREE.Vector3;
  camEnd: THREE.Vector3;
  lookStart: THREE.Vector3;
  lookEnd: THREE.Vector3;
  dir?: 1 | -1;
  travelDist?: number;
  lingers?: boolean;
  nightLook?: Partial<import('../../world/Area').AreaLook>;
}): SceneScript {
  let steam: ReturnType<typeof createSteamPlume>;
  let boarded = false;
  const smokeOrigin = new THREE.Vector3();
  const dir = opts.dir ?? 1;
  const travelDist = opts.travelDist ?? 18;

  return {
    storyId: opts.storyId,
    duration: 11,
    setup(ctx) {
      if (opts.nightLook) ctx.setLook(opts.nightLook);
      boarded = false;
      ctx.rizal.setPose(opts.boardStart.x, opts.boardStart.y, opts.boardStart.z, 0, 'idle');
      ctx.rizal.walkTo(opts.boardEnd, 1.85);
      steam = createSteamPlume(10);
      ctx.prop(steam.group);
      ctx.area.setTrainOffset?.(0, 0);
      ctx.cutCamera(opts.camStart, opts.lookStart);
      ctx.onDispose(() => {
        ctx.area.setTrainOffset?.(0, 1);
        steam.dispose();
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
      const moveX = rollU * travelDist * dir;
      ctx.area.setTrainOffset?.(moveX, doorClose);

      smokeOrigin.set(
        opts.trainPos.x + (opts.lingers ? moveX : moveX) + 2.8 * dir,
        opts.trainPos.y + 3.85,
        opts.trainPos.z,
      );
      steam.update(smokeOrigin, elapsed, u > 0.52 ? 1.35 : 0.9);

      const camU = THREE.MathUtils.smoothstep(u, 0.15, 0.95);
      tmpPos.lerpVectors(opts.camStart, opts.camEnd, camU);
      tmpTarget.lerpVectors(opts.lookStart, opts.lookEnd, camU);
      if (!opts.lingers) {
        tmpTarget.x += moveX * 0.45;
      }
      ctx.moveCamera(tmpPos, tmpTarget, dt, 2.8);
    },
  };
}

const marseilleLanding: SceneScript = {
  storyId: 'marseille-landing',
  duration: 11.5,
  setup(ctx) {
    // Deep blue moonlit night arrival on the quay; warm ship lanterns light the gangway and figures.
    ctx.setLook({
      sky: 0x1b2b4a,
      fog: 0x24375c,
      sunColor: 0xaec8f5,
      sunIntensity: 0.9,
      hemiSky: 0x516ea6,
      hemiGround: 0x3b3126,
      hemiIntensity: 0.95,
    });
    const portholes = createLitPortholes(14, 0.42, 14.08, 7);
    ctx.prop(portholes);

    const gangwayLight = new THREE.PointLight(0xffcd82, 4.2, 18, 1.0);
    gangwayLight.position.set(10.6, 3.2, 11.4);
    ctx.prop(gangwayLight);

    const shipLight = new THREE.PointLight(0xffd28c, 4.2, 22, 1.0);
    shipLight.position.set(13.5, 4.8, 12.6);
    ctx.prop(shipLight);

    const quayFill = new THREE.PointLight(0xffe1ad, 2.2, 24, 1.0);
    quayFill.position.set(8.6, 4.5, 8.8);
    ctx.prop(quayFill);

    // Porters carrying trunks down the gangway from Djemnah onto the quay.
    const porter1 = ctx.actor({ coat: 'work', hat: 'bowler' }, 10.2, 0.95, 13.8, Math.PI);
    const trunk1 = trunkBox();
    trunk1.position.set(0.28, 1.05, 0.18);
    porter1.root.add(trunk1);
    porter1.walkTo(new THREE.Vector3(8.2, 0, 10.7), 1.35);

    const porter2 = ctx.actor({ coat: 'work', hat: 'none' }, 11.0, 0.75, 12.8, Math.PI);
    const trunk2 = trunkBox();
    trunk2.position.set(-0.28, 1.02, 0.18);
    porter2.root.add(trunk2);
    porter2.walkTo(new THREE.Vector3(12.8, 0, 10.9), 1.25);

    // Rizal steps off the gangway with a small travel bag.
    const handBag = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.24, 0.34),
      new THREE.MeshStandardMaterial({ color: palette.crateDark, flatShading: true }),
    );
    handBag.position.set(0.06, -0.62, 0.02);
    ctx.rizal.rig.armR.add(handBag);
    ctx.rizal.setPose(10.5, 0.85, 13.4, Math.PI, 'idle');
    ctx.rizal.walkTo(new THREE.Vector3(10.6, 0, 10.4), 1.1);

    ctx.cutCamera(new THREE.Vector3(4.8, 2.45, 4.2), new THREE.Vector3(10.6, 1.55, 13.2));
    ctx.onDispose(() => {
      handBag.removeFromParent();
      handBag.geometry.dispose();
      (handBag.material as THREE.Material).dispose();
      trunk1.geometry.dispose();
      (trunk1.material as THREE.Material).dispose();
      trunk2.geometry.dispose();
      (trunk2.material as THREE.Material).dispose();
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    tmpPos.lerpVectors(
      new THREE.Vector3(4.8, 2.45, 4.2),
      new THREE.Vector3(5.8, 2.35, 4.6),
      THREE.MathUtils.smoothstep(u, 0, 1),
    );
    tmpTarget.lerpVectors(
      new THREE.Vector3(10.6, 1.55, 13.2),
      new THREE.Vector3(10.2, 1.5, 12.6),
      THREE.MathUtils.smoothstep(u, 0.2, 0.9),
    );
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.6);
  },
};

const chateauDif: SceneScript = {
  storyId: 'marseille-chateau-dif',
  duration: 11,
  setup(ctx) {
    ctx.rizal.setPose(-27.2, 0, 10.6, 0, 'idle');
    const boat = createSailingBoat(palette.shutterBlue);
    boat.position.set(-44, -0.85, 27);
    boat.rotation.y = 0.08;
    ctx.prop(boat);
    (ctx as { boat?: THREE.Group }).boat = boat;

    ctx.cutCamera(new THREE.Vector3(-22, 5.2, 4.2), new THREE.Vector3(-28, 1.2, 22));
    ctx.onDispose(() => {
      delete (ctx as { boat?: THREE.Group }).boat;
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const boat = (ctx as { boat?: THREE.Group }).boat;
    if (boat) {
      boat.position.x = THREE.MathUtils.lerp(-45, -14, u);
      boat.position.y = -0.85 + Math.sin(elapsed * 2.2) * 0.08;
      boat.rotation.z = Math.sin(elapsed * 1.7) * 0.04;
    }
    const camU = THREE.MathUtils.smoothstep(u, 0.05, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(-22, 5.2, 4.2), new THREE.Vector3(-12, 6.5, 25), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(-28, 1.2, 22), new THREE.Vector3(-30, 2.8, 40), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.4);
  },
};

const marseilleStation = makeTrainDepartureScene({
  storyId: 'marseille-station',
  boardStart: new THREE.Vector3(24.5, 0, -54.8),
  boardEnd: new THREE.Vector3(25.6, 0, -52.8),
  trainPos: new THREE.Vector3(30, 0, -52),
  camStart: new THREE.Vector3(19, 4.8, -63),
  camEnd: new THREE.Vector3(34, 6.2, -62.5),
  lookStart: new THREE.Vector3(26, 1.8, -52),
  lookEnd: new THREE.Vector3(35, 2.1, -52),
  dir: 1,
  travelDist: 14,
});

const marseilleMelbourne: SceneScript = {
  storyId: 'marseille-1891-melbourne',
  duration: 11,
  setup(ctx) {
    const porter1: PersonActor = ctx.actor({ coat: 'work', hat: 'bowler' }, 12.2, 0, 9.2, 0);
    const c1 = trunkBox();
    c1.position.set(0.26, 1.0, 0.16);
    porter1.root.add(c1);
    porter1.walkTo(new THREE.Vector3(10.5, 0.85, 13.6), 1.35);

    const porter2: PersonActor = ctx.actor({ coat: 'work', hat: 'none' }, 8.6, 0, 8.8, 0);
    porter2.walkTo(new THREE.Vector3(11.6, 0, 10.6), 1.15);

    ctx.rizal.setPose(9.4, 0, 7.8, 0, 'idle');
    ctx.rizal.walkTo(new THREE.Vector3(11.4, 0.95, 14.5), 1.2);

    const steam = createSteamPlume(12);
    ctx.prop(steam.group);
    (ctx as { steam?: ReturnType<typeof createSteamPlume> }).steam = steam;

    ctx.cutCamera(new THREE.Vector3(24, 6.8, 4.2), new THREE.Vector3(13.5, 1.8, 13.5));
    ctx.onDispose(() => {
      c1.geometry.dispose();
      (c1.material as THREE.Material).dispose();
      steam.dispose();
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const steam = (ctx as { steam?: ReturnType<typeof createSteamPlume> }).steam;
    if (steam) {
      // Visual horn puff bursts upward near the end caption.
      const hornBurst = u > 0.65 && u < 0.9 ? 1.85 : 1.0;
      steam.update(new THREE.Vector3(15.5, 6.3, 16.4), elapsed, hornBurst);
    }
    const camU = THREE.MathUtils.smoothstep(u, 0, 0.95);
    tmpPos.lerpVectors(new THREE.Vector3(24, 6.8, 4.2), new THREE.Vector3(22, 6.2, 5.8), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(13.5, 1.8, 13.5), new THREE.Vector3(13, 2.8, 15.2), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.5);
  },
};

const marseilleLessons: SceneScript = {
  storyId: 'marseille-1891-lessons',
  duration: 11.5,
  setup(ctx) {
    ctx.setLook({
      sky: 0xd9875b,
      fog: 0xe3a77d,
      sunColor: 0xffb163,
      sunIntensity: 2.75,
      sunDirection: new THREE.Vector3(-0.6, 0.28, 0.72).normalize(),
      hemiSky: 0xf2b588,
      hemiGround: 0x6b5748,
      hemiIntensity: 1.05,
    });
    ctx.rizal.setPose(-1.5, 0, 10.6, 0.7, 'idle');
    const steam = createSteamPlume(10);
    ctx.prop(steam.group);
    (ctx as { steam?: ReturnType<typeof createSteamPlume> }).steam = steam;

    ctx.cutCamera(new THREE.Vector3(-9, 5.6, 2.0), new THREE.Vector3(12, 2.2, 18));
    ctx.onDispose(() => {
      ctx.area.setShipOffset?.(0, 0, 0);
      steam.dispose();
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const moveU = THREE.MathUtils.smoothstep(u, 0.05, 1.0);
    const sx = moveU * 20;
    const sz = moveU * 18;
    ctx.area.setShipOffset?.(sx, sz, 0);
    const steam = (ctx as { steam?: ReturnType<typeof createSteamPlume> }).steam;
    if (steam) {
      steam.update(new THREE.Vector3(15.5 + sx, 6.3, 16.4 + sz), elapsed, 1.1);
    }
    const camU = THREE.MathUtils.smoothstep(u, 0, 1);
    tmpPos.lerpVectors(new THREE.Vector3(-9, 5.6, 2.0), new THREE.Vector3(0, 7.6, 2.5), camU);
    tmpTarget.lerpVectors(new THREE.Vector3(12, 2.2, 18), new THREE.Vector3(26, 2.4, 28), camU);
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.2);
  },
};

export const MARSEILLE_SCENES: SceneScript[] = [
  marseilleLanding,
  chateauDif,
  marseilleStation,
  marseilleMelbourne,
  marseilleLessons,
];
