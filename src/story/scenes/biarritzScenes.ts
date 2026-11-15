import * as THREE from 'three';
import { mat } from '../../world/kit';
import { palette } from '../../world/palette';
import { makeTrainDepartureScene } from './marseilleScenes';
import type { SceneScript } from './types';

const PLATEAU_Y = 2.6;
const tmpPos = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

const biarritzVilla: SceneScript = {
  storyId: 'biarritz-villa',
  duration: 10.5,
  setup(ctx) {
    // Boustead family + young woman waving from the villa garden/terrace inside the gate (z ~ -18.6).
    const daughter = ctx.actor({ coat: 'dress', hat: 'small', skirt: true }, -13.4, PLATEAU_Y, -18.3, 0);
    const mother = ctx.actor({ coat: 'dress', hat: 'none', skirt: true }, -14.8, PLATEAU_Y, -18.7, 0);
    const father = ctx.actor({ coat: 'frock', hat: 'top' }, -15.6, PLATEAU_Y, -18.6, 0);
    daughter.setAction('wave');
    mother.setAction('wave');
    father.setAction('gesture');

    ctx.rizal.setPose(-14.0, PLATEAU_Y, -11.4, Math.PI, 'idle');
    ctx.rizal.walkTo(new THREE.Vector3(-14.0, PLATEAU_Y, -16.1), 1.15);

    ctx.cutCamera(new THREE.Vector3(-8.2, PLATEAU_Y + 2.8, -6.8), new THREE.Vector3(-14.0, PLATEAU_Y + 1.5, -18.5));
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const camU = THREE.MathUtils.smoothstep(u, 0.05, 0.95);
    tmpPos.lerpVectors(
      new THREE.Vector3(-8.2, PLATEAU_Y + 2.8, -6.8),
      new THREE.Vector3(-10.4, PLATEAU_Y + 2.1, -9.8),
      camU,
    );
    tmpTarget.lerpVectors(
      new THREE.Vector3(-14.0, PLATEAU_Y + 1.5, -18.5),
      new THREE.Vector3(-14.1, PLATEAU_Y + 1.35, -18.0),
      camU,
    );
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.4);
  },
};

const biarritzManuscript: SceneScript = {
  storyId: 'biarritz-manuscript',
  duration: 11.0,
  setup(ctx) {
    // Late evening / dusk golden light so the table lamp glows over the finished pages.
    ctx.setLook({
      sky: 0x3b354f,
      fog: 0x5c4f63,
      sunColor: 0xffb36c,
      sunIntensity: 1.35,
      sunDirection: new THREE.Vector3(-0.6, 0.25, 0.7).normalize(),
      hemiSky: 0x6f6885,
      hemiGround: 0x453b31,
      hemiIntensity: 0.85,
    });

    const terraceY = PLATEAU_Y + 0.25;
    const tx = -3.5;
    const tz = -19.6;
    const tableTopY = PLATEAU_Y + 1.0;

    // Rizal seated at the terrace chair facing +Z across the writing table.
    ctx.rizal.setPose(tx, terraceY, tz - 0.85, 0, 'sit');

    // Warm glowing table lamp, stack of finished manuscript sheets, and final sheet settling on top.
    const lampGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.34, 8);
    const shadeGeo = new THREE.ConeGeometry(0.18, 0.16, 10);
    const pageGeo = new THREE.BoxGeometry(0.32, 0.045, 0.42);
    const sheetGeo = new THREE.BoxGeometry(0.3, 0.012, 0.4);

    const lampStem = new THREE.Mesh(stemGeo, mat(palette.brass));
    lampStem.position.set(tx - 0.42, tableTopY + 0.17, tz - 0.12);
    const lampShade = new THREE.Mesh(
      shadeGeo,
      mat(palette.gaslight, { emissive: palette.gaslight, roughness: 0.4 }),
    );
    lampShade.position.set(tx - 0.42, tableTopY + 0.36, tz - 0.12);
    const deskLight = new THREE.PointLight(0xffcb78, 2.4, 5.5, 1.5);
    deskLight.position.set(tx - 0.38, tableTopY + 0.38, tz - 0.1);

    const stack = new THREE.Mesh(pageGeo, mat(palette.shirt));
    stack.position.set(tx + 0.05, tableTopY + 0.045, tz);
    stack.rotation.y = 0.08;

    const finalSheet = new THREE.Mesh(sheetGeo, mat(palette.awningCream));
    finalSheet.position.set(tx + 0.04, tableTopY + 0.32, tz);
    finalSheet.rotation.set(0.06, -0.05, 0.08);

    lampGroup.add(lampStem, lampShade, deskLight, stack, finalSheet);
    ctx.prop(lampGroup);
    (ctx as { finalSheet?: THREE.Mesh }).finalSheet = finalSheet;

    ctx.cutCamera(new THREE.Vector3(-1.3, PLATEAU_Y + 2.05, -17.1), new THREE.Vector3(tx, tableTopY + 0.15, tz));
    ctx.onDispose(() => {
      stemGeo.dispose();
      shadeGeo.dispose();
      pageGeo.dispose();
      sheetGeo.dispose();
      delete (ctx as { finalSheet?: THREE.Mesh }).finalSheet;
    });
  },
  update(ctx, elapsed, dt) {
    const u = THREE.MathUtils.clamp(elapsed / ctx.duration, 0, 1);
    const sheet = (ctx as { finalSheet?: THREE.Mesh }).finalSheet;
    if (sheet) {
      const dropU = THREE.MathUtils.smoothstep(u, 0.25, 0.72);
      const topY = PLATEAU_Y + 1.0 + 0.075;
      sheet.position.y = THREE.MathUtils.lerp(topY + 0.26, topY, dropU);
      sheet.rotation.x = THREE.MathUtils.lerp(0.14, 0, dropU);
      sheet.rotation.z = THREE.MathUtils.lerp(0.16, 0, dropU);
    }
    const camU = THREE.MathUtils.smoothstep(u, 0, 0.95);
    tmpPos.lerpVectors(
      new THREE.Vector3(-1.3, PLATEAU_Y + 2.05, -17.1),
      new THREE.Vector3(-2.1, PLATEAU_Y + 1.65, -17.85),
      camU,
    );
    tmpTarget.lerpVectors(
      new THREE.Vector3(-3.5, PLATEAU_Y + 1.15, -19.6),
      new THREE.Vector3(-3.5, PLATEAU_Y + 1.05, -19.65),
      camU,
    );
    ctx.moveCamera(tmpPos, tmpTarget, dt, 2.3);
  },
};

const biarritzStation = makeTrainDepartureScene({
  storyId: 'biarritz-station',
  boardStart: new THREE.Vector3(19.6, PLATEAU_Y, -42.8),
  boardEnd: new THREE.Vector3(20.4, PLATEAU_Y, -41.4),
  trainPos: new THREE.Vector3(28, PLATEAU_Y, -40.2),
  camStart: new THREE.Vector3(15.5, PLATEAU_Y + 4.8, -53.2),
  camEnd: new THREE.Vector3(31.0, PLATEAU_Y + 5.6, -53.0),
  lookStart: new THREE.Vector3(23.5, PLATEAU_Y + 1.8, -40.2),
  lookEnd: new THREE.Vector3(33.5, PLATEAU_Y + 2.0, -40.2),
  dir: 1,
  travelDist: 16,
});

export const BIARRITZ_SCENES: SceneScript[] = [biarritzVilla, biarritzManuscript, biarritzStation];
