import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import type { Input } from '../core/Input';
import { buildHorseAndRider, HEAD_REST, NECK_REST, type HorseRig } from './models';
import { Dust } from './Dust';

const CAPSULE_HALF = 0.5;
const CAPSULE_RADIUS = 0.6;
const BODY_LIFT = CAPSULE_HALF + CAPSULE_RADIUS;

const WALK_SPEED = 2.4;
const CANTER_SPEED = 6.5;
const GALLOP_SPEED = 11;

/** Leg phase offsets in order: left fore, right fore, left hind, right hind. */
const GAITS = {
  walk: { offsets: [0.25, 0.75, 0.0, 0.5], stride: 1.7, swing: 0.34, bob: 0.025, pitch: 0.01 },
  trot: { offsets: [0.0, 0.5, 0.5, 0.0], stride: 2.8, swing: 0.5, bob: 0.06, pitch: 0.02 },
  gallop: { offsets: [0.55, 0.65, 0.0, 0.1], stride: 5.2, swing: 0.72, bob: 0.1, pitch: 0.09 },
} as const;
type Gait = (typeof GAITS)[keyof typeof GAITS];

/**
 * Rizal on horseback: a kinematic character driven by screen-relative input.
 * The horse turns toward the requested direction at a limited rate, like a real mount,
 * and pushes loose props out of the way.
 */
export class Player {
  readonly rig: HorseRig;
  readonly position = new THREE.Vector3();
  heading: number;
  speed = 0;

  private readonly body: RAPIER.RigidBody;
  private readonly collider: RAPIER.Collider;
  private readonly controller: RAPIER.KinematicCharacterController;
  private readonly dust: Dust;
  private verticalVelocity = 0;
  private phase = 0;
  private lean = 0;
  private gaitMix = { walk: 1, trot: 0, gallop: 0 };
  private readonly tmpDir = new THREE.Vector3();

  constructor(
    rapier: typeof RAPIER,
    world: RAPIER.World,
    scene: THREE.Scene,
    spawn: THREE.Vector3,
    heading: number,
  ) {
    this.heading = heading;
    this.rig = buildHorseAndRider();
    scene.add(this.rig.root);
    this.dust = new Dust(scene);

    this.body = world.createRigidBody(
      rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(
        spawn.x,
        spawn.y + BODY_LIFT,
        spawn.z,
      ),
    );
    this.collider = world.createCollider(
      rapier.ColliderDesc.capsule(CAPSULE_HALF, CAPSULE_RADIUS),
      this.body,
    );
    this.controller = world.createCharacterController(0.02);
    this.controller.setSlideEnabled(true);
    this.controller.enableAutostep(0.35, 0.2, false);
    this.controller.enableSnapToGround(0.5);
    this.controller.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.controller.setApplyImpulsesToDynamicBodies(true);
    this.controller.setCharacterMass(450);

    this.position.copy(spawn);
    this.syncVisual(0);
  }

  /** Puts the rider at a new spot, used when arriving in an area. */
  teleport(p: THREE.Vector3, heading: number): void {
    this.body.setTranslation({ x: p.x, y: p.y + BODY_LIFT, z: p.z }, true);
    this.heading = heading;
    this.speed = 0;
    this.verticalVelocity = 0;
    this.lean = 0;
    this.position.copy(p);
    this.syncVisual(0);
  }

  update(dt: number, input: Input, cameraYaw: number): void {
    // Requested direction in world space, relative to the fixed camera angle.
    const cos = Math.cos(cameraYaw);
    const sin = Math.sin(cameraYaw);
    const wx = input.x * cos - input.y * sin;
    const wz = -input.x * sin - input.y * cos;
    const magnitude = Math.min(1, Math.hypot(input.x, input.y));

    let targetSpeed = 0;
    if (magnitude > 0.08) {
      const desired = Math.atan2(wx, wz);
      const diff = wrapAngle(desired - this.heading);
      const turnRate = THREE.MathUtils.lerp(4.2, 2.3, this.speed / GALLOP_SPEED);
      const step = THREE.MathUtils.clamp(diff, -turnRate * dt, turnRate * dt);
      this.heading = wrapAngle(this.heading + step);
      this.lean = THREE.MathUtils.damp(this.lean, (step / dt) * (this.speed / GALLOP_SPEED), 6, dt);

      const cap = input.sprint ? GALLOP_SPEED : magnitude > 0.6 ? CANTER_SPEED : WALK_SPEED * 1.4;
      // Slow down while turning sharply instead of sliding sideways.
      const alignment = Math.max(0.15, Math.cos(Math.min(Math.abs(diff), Math.PI / 2)));
      targetSpeed = cap * magnitude * alignment;
    } else {
      this.lean = THREE.MathUtils.damp(this.lean, 0, 6, dt);
    }

    const accel = targetSpeed > this.speed ? 7 : 11;
    this.speed = approach(this.speed, targetSpeed, accel * dt);

    this.verticalVelocity -= 24 * dt;
    const forward = this.tmpDir.set(Math.sin(this.heading), 0, Math.cos(this.heading));
    const desiredMove = {
      x: forward.x * this.speed * dt,
      y: this.verticalVelocity * dt,
      z: forward.z * this.speed * dt,
    };
    this.controller.computeColliderMovement(this.collider, desiredMove);
    const moved = this.controller.computedMovement();
    if (this.controller.computedGrounded()) this.verticalVelocity = 0;

    // If something solid stopped us, bleed off speed so the gait matches what we see.
    const planned = Math.hypot(desiredMove.x, desiredMove.z);
    const actual = Math.hypot(moved.x, moved.z);
    if (planned > 1e-4 && actual < planned * 0.5) this.speed *= 0.85;

    const t = this.body.translation();
    this.body.setNextKinematicTranslation({ x: t.x + moved.x, y: t.y + moved.y, z: t.z + moved.z });

    this.position.set(t.x + moved.x, t.y + moved.y - BODY_LIFT, t.z + moved.z);
    this.syncVisual(dt);
  }

  private syncVisual(dt: number): void {
    const { root, body, legs, neck, head, tail, rider } = this.rig;
    root.position.copy(this.position);
    root.rotation.y = this.heading;

    // Blend gaits by speed.
    const s = this.speed;
    const w = smoothBand(s, 0, 3.4);
    const g = smoothBand(s, 7.5, 9.5);
    const mix = { walk: 1 - w, trot: w * (1 - g), gallop: g };
    this.gaitMix.walk = THREE.MathUtils.damp(this.gaitMix.walk, mix.walk, 8, dt || 1);
    this.gaitMix.trot = THREE.MathUtils.damp(this.gaitMix.trot, mix.trot, 8, dt || 1);
    this.gaitMix.gallop = THREE.MathUtils.damp(this.gaitMix.gallop, mix.gallop, 8, dt || 1);
    const gm = this.gaitMix;
    const blend = (pick: (gait: Gait) => number): number =>
      pick(GAITS.walk) * gm.walk + pick(GAITS.trot) * gm.trot + pick(GAITS.gallop) * gm.gallop;

    const stride = blend((x) => x.stride);
    const moving = THREE.MathUtils.smoothstep(s, 0.05, 0.6);
    this.phase = (this.phase + (s / stride) * dt) % 1;
    const swing = blend((x) => x.swing) * moving;
    const bob = blend((x) => x.bob) * moving;
    const pitch = blend((x) => x.pitch) * moving;
    const tau = Math.PI * 2;

    legs.forEach((leg, i) => {
      const offset = blend((x) => x.offsets[i] ?? 0);
      const a = tau * (this.phase + offset);
      leg.hip.rotation.x = Math.sin(a) * swing * (leg.front ? 1 : 0.9);
      // Knees fold while the leg swings forward; hocks fold the other way.
      const fold = Math.max(0, Math.sin(a + Math.PI / 2)) * swing * 1.5;
      leg.knee.rotation.x = leg.front ? -fold : fold * 0.8;
    });

    const lift = this.gaitMix.gallop > 0.5 ? 1 : 2;
    const bobWave = Math.sin(tau * this.phase * lift);
    body.position.y = Math.abs(bobWave) * bob;
    body.rotation.x = Math.sin(tau * this.phase) * pitch;
    body.rotation.z = THREE.MathUtils.clamp(-this.lean * 0.12, -0.18, 0.18);

    neck.rotation.x =
      NECK_REST + Math.sin(tau * this.phase * lift + 0.6) * bob * 1.4 + gm.gallop * 0.22;
    head.rotation.x = HEAD_REST - gm.gallop * 0.15;
    tail.rotation.x = -0.5 - gm.gallop * 0.55 - gm.trot * 0.2;
    tail.rotation.z = Math.sin(performance.now() * 0.002) * 0.08 + this.lean * 0.1;

    rider.torso.rotation.x = gm.gallop * 0.32 + gm.trot * 0.08 - bobWave * bob * 0.8;
    rider.torso.rotation.z = -body.rotation.z * 0.6;
    rider.head.rotation.x = -rider.torso.rotation.x * 0.7;

    if (dt > 0) this.dust.update(dt, this, this.gaitMix.gallop + this.gaitMix.trot * 0.35);
  }
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function approach(v: number, target: number, delta: number): number {
  return v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);
}

/** 0 below lo, 1 above hi, smooth between. */
function smoothBand(v: number, lo: number, hi: number): number {
  return THREE.MathUtils.smoothstep(v, lo, hi);
}
