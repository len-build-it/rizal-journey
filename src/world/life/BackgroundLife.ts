import * as THREE from 'three';
import {
  rolePreset,
  type PersonAction,
  type PersonRole,
} from '../../story/figures';
import { seeded } from '../kit';
import { palette } from '../palette';
import type { PhysicsCtx } from '../physics';
import type { StopMarker } from '../StopMarker';
import {
  buildCatGeometry,
  buildDogGeometry,
  buildDuckGeometry,
  buildFishGeometry,
  buildHarnessHorseGeometry,
  buildPigeonGeometry,
  buildSeagullGeometry,
  buildSheepGeometry,
} from './animals';
import {
  AnimMode,
  InstancedPool,
  LIFE_ANIM_DIST,
  bakePersonGeometry,
  prepareLifeGeometry,
} from './instancing';
import {
  buildCartGeometry,
  buildFiacreGeometry,
  buildHandcartGeometry,
  buildOmnibusGeometry,
  buildPennyFarthingGeometry,
  buildRowingBoatGeometry,
  type VehicleKind,
} from './vehicles';

export interface PersonWalkSpec {
  role: PersonRole;
  winter?: boolean;
  path: THREE.Vector3[];
  closed?: boolean;
  speed?: number;
  startOffset?: number;
  pairRole?: PersonRole;
  action?: PersonAction;
}

export interface PersonStationSpec {
  role: PersonRole;
  winter?: boolean;
  x: number;
  y: number;
  z: number;
  ry: number;
  action: 'chat' | 'sit' | 'lean' | 'sweep' | 'fish' | 'mendNet' | 'readNewspaper' | 'lookUp';
  scale?: number;
  solid?: boolean;
}

export interface VehicleRouteSpec {
  kind: VehicleKind;
  cargo?: 'crates' | 'barrels' | 'produce';
  bodyColor?: number;
  path: THREE.Vector3[];
  closed?: boolean;
  speed: number;
  startOffset?: number;
  bobWater?: boolean;
}

export interface BirdFlockSpec {
  species: 'pigeon' | 'gull';
  x: number;
  y: number;
  z: number;
  count: number;
  radius?: number;
  roosting?: boolean;
  flightHeight?: number;
  flightRadius?: number;
}

export interface RoamAnimalSpec {
  species: 'dog' | 'cat' | 'sheep' | 'duck' | 'horse' | 'fish';
  x: number;
  y: number;
  z: number;
  ry?: number;
  count?: number;
  roamRadius?: number;
  graze?: boolean;
}

export interface AreaDressing {
  walkers: PersonWalkSpec[];
  stations: PersonStationSpec[];
  vehicles: VehicleRouteSpec[];
  birds: BirdFlockSpec[];
  animals: RoamAnimalSpec[];
}

export interface LifeRuntimeState {
  playerPos: THREE.Vector3;
  playerHeading: number;
  playerSpeed: number;
  focusPos: THREE.Vector3;
  excludeCenters: THREE.Vector3[];
  excludeRadius: number;
}

interface CompiledPath {
  points: THREE.Vector3[];
  segLens: number[];
  totalLen: number;
  closed: boolean;
}

function compilePath(points: THREE.Vector3[], closed: boolean): CompiledPath {
  const segLens: number[] = [];
  let totalLen = 0;
  const count = closed ? points.length : Math.max(0, points.length - 1);
  for (let i = 0; i < count; i++) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    const len = a.distanceTo(b);
    segLens.push(len);
    totalLen += len;
  }
  return { points, segLens, totalLen: Math.max(0.001, totalLen), closed };
}

function samplePath(
  path: CompiledPath,
  dist: number,
  outPos: THREE.Vector3,
  outDir: THREE.Vector3,
): void {
  const n = path.points.length;
  if (n === 0) return;
  if (n === 1) {
    outPos.copy(path.points[0]!);
    outDir.set(0, 0, 1);
    return;
  }

  let d: number;
  let reverse = false;
  if (path.closed) {
    d = ((dist % path.totalLen) + path.totalLen) % path.totalLen;
  } else {
    const cycle = path.totalLen * 2;
    const mod = ((dist % cycle) + cycle) % cycle;
    if (mod <= path.totalLen) {
      d = mod;
    } else {
      d = cycle - mod;
      reverse = true;
    }
  }

  let acc = 0;
  for (let i = 0; i < path.segLens.length; i++) {
    const len = path.segLens[i]!;
    if (acc + len >= d || i === path.segLens.length - 1) {
      const a = path.points[i]!;
      const b = path.points[(i + 1) % n]!;
      const t = len > 0.0001 ? THREE.MathUtils.clamp((d - acc) / len, 0, 1) : 0;
      outPos.lerpVectors(a, b, t);
      outDir.subVectors(b, a);
      if (reverse) outDir.negate();
      outDir.y = 0;
      if (outDir.lengthSq() > 0.0001) outDir.normalize();
      else outDir.set(0, 0, 1);
      return;
    }
    acc += len;
  }
}

interface PersonEntity {
  role: PersonRole;
  stationary: boolean;
  path: CompiledPath | null;
  distance: number;
  baseSpeed: number;
  lateralOffset: number;
  x: number;
  y: number;
  z: number;
  homeX: number;
  homeY: number;
  homeZ: number;
  ry: number;
  homeRy: number;
  scale: number;
  mode: number;
  amp: number;
  phase: number;
  tint: number;
  dodge: number;
  dodgeDir: number;
  steppingAside: boolean;
  solid: boolean;
  body: ReturnType<PhysicsCtx['world']['createRigidBody']> | null;
}

interface VehicleEntity {
  poolKey: string;
  kind: VehicleKind;
  path: CompiledPath;
  distance: number;
  speed: number;
  yieldFactor: number;
  bobWater: boolean;
  phase: number;
  x: number;
  y: number;
  z: number;
  ry: number;
  hidden: boolean;
  body: ReturnType<PhysicsCtx['world']['createRigidBody']> | null;
}

interface BirdEntity {
  species: 'pigeon' | 'gull';
  homeX: number;
  homeY: number;
  homeZ: number;
  x: number;
  y: number;
  z: number;
  ry: number;
  phase: number;
  roosting: boolean;
  flightHeight: number;
  flightRadius: number;
  flightTimer: number;
  orbitAngle: number;
  hidden: boolean;
}

interface AnimalEntity {
  species: 'dog' | 'cat' | 'sheep' | 'duck' | 'horse' | 'fish';
  homeX: number;
  homeY: number;
  homeZ: number;
  x: number;
  y: number;
  z: number;
  ry: number;
  roamRadius: number;
  phase: number;
  graze: boolean;
  followTimer: number;
  hidden: boolean;
  body: ReturnType<PhysicsCtx['world']['createRigidBody']> | null;
}

const PERSON_TINTS = [
  0xffffff,
  palette.shirt,
  palette.parisLimestone,
  palette.awningCream,
  palette.sand,
] as const;

const tmpPos = new THREE.Vector3();
const tmpDir = new THREE.Vector3();

function actionToAnim(action: PersonStationSpec['action']): { mode: number; amp: number } {
  switch (action) {
    case 'lookUp':
      return { mode: AnimMode.Gesture, amp: 1.8 };
    case 'sweep':
    case 'mendNet':
    case 'fish':
      return { mode: AnimMode.Gesture, amp: 2.6 };
    case 'sit':
    case 'lean':
    case 'readNewspaper':
      return { mode: AnimMode.Gesture, amp: 0.45 };
    case 'chat':
    default:
      return { mode: AnimMode.Gesture, amp: 1.0 };
  }
}

export class BackgroundLife {
  readonly group = new THREE.Group();
  private readonly personPools = new Map<PersonRole, InstancedPool>();
  private readonly birdGroundPools = new Map<'pigeon' | 'gull', InstancedPool>();
  private readonly birdFlyPools = new Map<'pigeon' | 'gull', InstancedPool>();
  private readonly animalPools = new Map<AnimalEntity['species'], InstancedPool>();
  private readonly vehiclePools = new Map<string, InstancedPool>();

  private readonly people: PersonEntity[] = [];
  private readonly vehicles: VehicleEntity[] = [];
  private readonly birds: BirdEntity[] = [];
  private readonly animals: AnimalEntity[] = [];
  private readonly stops: readonly StopMarker[];
  private readonly ctx: PhysicsCtx;

  private runtime: LifeRuntimeState = {
    playerPos: new THREE.Vector3(),
    playerHeading: 0,
    playerSpeed: 0,
    focusPos: new THREE.Vector3(),
    excludeCenters: [],
    excludeRadius: 14,
  };
  private reactionReady = false;
  private colorsDirty = true;

  constructor(
    scene: THREE.Scene,
    ctx: PhysicsCtx,
    stops: readonly StopMarker[],
    dressing: AreaDressing,
    seedNum: number,
    mobile = false,
  ) {
    this.ctx = ctx;
    this.stops = stops;
    this.group.name = 'background-life';
    scene.add(this.group);

    const rnd = seeded(seedNum);
    const keep = (idx: number): boolean => !mobile || idx % 2 === 0;

    // 1. Spawn walking pedestrians (and walking companions).
    dressing.walkers.forEach((w, wi) => {
      if (!keep(wi) || w.path.length < 2) return;
      const compiled = compilePath(w.path, w.closed ?? true);
      const baseStart = (w.startOffset ?? rnd()) * compiled.totalLen;
      const baseSpeed = w.speed ?? (w.action === 'hurry' ? 1.85 : 1.22);

      const addWalker = (role: PersonRole, lateral: number): void => {
        samplePath(compiled, baseStart, tmpPos, tmpDir);
        const rightX = -tmpDir.z;
        const rightZ = tmpDir.x;
        const px = tmpPos.x + rightX * lateral;
        const pz = tmpPos.z + rightZ * lateral;
        this.people.push({
          role,
          stationary: false,
          path: compiled,
          distance: baseStart,
          baseSpeed,
          lateralOffset: lateral,
          x: px,
          y: tmpPos.y,
          z: pz,
          homeX: px,
          homeY: tmpPos.y,
          homeZ: pz,
          ry: Math.atan2(tmpDir.x, tmpDir.z),
          homeRy: Math.atan2(tmpDir.x, tmpDir.z),
          scale: role === 'child' ? 0.72 : 0.96 + rnd() * 0.06,
          mode: AnimMode.Walk,
          amp: w.action === 'hurry' ? 1.25 : 0.95,
          phase: rnd() * Math.PI * 2,
          tint: PERSON_TINTS[Math.floor(rnd() * PERSON_TINTS.length)]!,
          dodge: 0,
          dodgeDir: 1,
          steppingAside: false,
          solid: true,
          body: null,
        });
      };

      addWalker(w.role, w.pairRole ? -0.36 : 0);
      if (w.pairRole) addWalker(w.pairRole, 0.36);
    });

    // 2. Spawn stationary vignettes.
    dressing.stations.forEach((st, si) => {
      if (!keep(si) || this.nearStop(st.x, st.z, 3.0)) return;
      const { mode, amp } = actionToAnim(st.action);
      this.people.push({
        role: st.role,
        stationary: true,
        path: null,
        distance: 0,
        baseSpeed: 0,
        lateralOffset: 0,
        x: st.x,
        y: st.y,
        z: st.z,
        homeX: st.x,
        homeY: st.y,
        homeZ: st.z,
        ry: st.ry,
        homeRy: st.ry,
        scale: st.scale ?? (st.role === 'child' ? 0.72 : 0.97 + rnd() * 0.05),
        mode,
        amp,
        phase: rnd() * Math.PI * 2,
        tint: PERSON_TINTS[Math.floor(rnd() * PERSON_TINTS.length)]!,
        dodge: 0,
        dodgeDir: 1,
        steppingAside: false,
        solid: st.solid ?? st.action !== 'sit',
        body: null,
      });
    });

    // Build at most one InstancedPool per active PersonRole in this area.
    const roleCounts = new Map<PersonRole, number>();
    const roleWinter = new Map<PersonRole, boolean>();
    for (const p of this.people) {
      roleCounts.set(p.role, (roleCounts.get(p.role) ?? 0) + 1);
    }
    for (const w of dressing.walkers) {
      if (w.winter) roleWinter.set(w.role, true);
      if (w.pairRole && w.winter) roleWinter.set(w.pairRole, true);
    }
    for (const st of dressing.stations) {
      if (st.winter) roleWinter.set(st.role, true);
    }
    let roleIdx = 0;
    for (const [role, count] of roleCounts) {
      const geo = bakePersonGeometry(rolePreset(role, roleWinter.get(role) ?? false, roleIdx++));
      const pool = new InstancedPool(geo, count, `life-people-${role}`);
      this.group.add(pool.mesh);
      this.personPools.set(role, pool);
    }

    // 3. Spawn vehicles & boats.
    const vehicleGroups = new Map<
      string,
      { kind: VehicleKind; cargo?: 'crates' | 'barrels' | 'produce'; color?: number; count: number }
    >();
    dressing.vehicles.forEach((v, vi) => {
      if (mobile && v.kind !== 'fiacre' && v.kind !== 'omnibus' && vi % 2 === 1) return;
      if (mobile && (v.kind === 'fiacre' || v.kind === 'omnibus') && vi % 2 === 1) return;
      if (v.path.length < 2) return;
      const compiled = compilePath(v.path, v.closed ?? true);
      const startDist = (v.startOffset ?? rnd()) * compiled.totalLen;
      samplePath(compiled, startDist, tmpPos, tmpDir);
      const key = `${v.kind}-${v.cargo ?? 'std'}`;
      const existing = vehicleGroups.get(key);
      if (existing) existing.count += 1;
      else vehicleGroups.set(key, { kind: v.kind, cargo: v.cargo, color: v.bodyColor, count: 1 });

      this.vehicles.push({
        poolKey: key,
        kind: v.kind,
        path: compiled,
        distance: startDist,
        speed: v.speed,
        yieldFactor: 1,
        bobWater: Boolean(v.bobWater || v.kind === 'rowingBoat'),
        phase: rnd() * Math.PI * 2,
        x: tmpPos.x,
        y: tmpPos.y,
        z: tmpPos.z,
        ry: Math.atan2(tmpDir.x, tmpDir.z),
        hidden: false,
        body: null,
      });
    });

    for (const [key, spec] of vehicleGroups) {
      let geo: THREE.BufferGeometry;
      switch (spec.kind) {
        case 'fiacre':
          geo = buildFiacreGeometry(spec.color);
          break;
        case 'omnibus':
          geo = buildOmnibusGeometry(spec.color);
          break;
        case 'cart':
          geo = buildCartGeometry(spec.cargo);
          break;
        case 'handcart':
          geo = buildHandcartGeometry();
          break;
        case 'pennyFarthing':
          geo = buildPennyFarthingGeometry();
          break;
        case 'rowingBoat':
          geo = buildRowingBoatGeometry(spec.color);
          break;
      }
      const pool = new InstancedPool(prepareLifeGeometry(geo), spec.count, `life-veh-${key}`);
      geo.dispose();
      if (spec.kind === 'rowingBoat') pool.mesh.castShadow = false;
      this.group.add(pool.mesh);
      this.vehiclePools.set(key, pool);
    }

    // 4. Spawn bird flocks (pigeons & gulls).
    const birdMax = new Map<'pigeon' | 'gull', number>();
    for (const b of dressing.birds) {
      const n = mobile ? Math.max(2, Math.round(b.count * 0.5)) : b.count;
      const spread = b.radius ?? 1.9;
      for (let i = 0; i < n; i++) {
        const ang = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * spread;
        const bx = b.x + Math.cos(ang) * r;
        const bz = b.z + Math.sin(ang) * r;
        this.birds.push({
          species: b.species,
          homeX: bx,
          homeY: b.y,
          homeZ: bz,
          x: bx,
          y: b.roosting ? b.y + (b.flightHeight ?? 4.5) : b.y,
          z: bz,
          ry: rnd() * Math.PI * 2,
          phase: rnd() * Math.PI * 2,
          roosting: Boolean(b.roosting),
          flightHeight: b.flightHeight ?? 4.5,
          flightRadius: b.flightRadius ?? 6.5,
          flightTimer: b.roosting ? 999 : 0,
          orbitAngle: rnd() * Math.PI * 2,
          hidden: false,
        });
      }
      birdMax.set(b.species, (birdMax.get(b.species) ?? 0) + n);
    }
    for (const [species, maxCount] of birdMax) {
      const gndSrc =
        species === 'pigeon' ? buildPigeonGeometry(false) : buildSeagullGeometry(false);
      const flySrc =
        species === 'pigeon' ? buildPigeonGeometry(true) : buildSeagullGeometry(true);
      const gndPool = new InstancedPool(
        prepareLifeGeometry(gndSrc, 'birdGround'),
        maxCount,
        `life-bird-gnd-${species}`,
      );
      const flyPool = new InstancedPool(
        prepareLifeGeometry(flySrc, 'birdFly'),
        maxCount,
        `life-bird-fly-${species}`,
      );
      gndSrc.dispose();
      flySrc.dispose();
      gndPool.mesh.castShadow = false;
      flyPool.mesh.castShadow = false;
      this.group.add(gndPool.mesh, flyPool.mesh);
      this.birdGroundPools.set(species, gndPool);
      this.birdFlyPools.set(species, flyPool);
    }

    // 5. Spawn animals (dogs, cats, sheep, ducks, horses, fish).
    const animalCounts = new Map<AnimalEntity['species'], number>();
    for (const a of dressing.animals) {
      const count = a.count ?? 1;
      const effective = mobile && count > 2 ? Math.ceil(count * 0.5) : count;
      const spread = a.roamRadius ?? 0;
      for (let i = 0; i < effective; i++) {
        const ang = rnd() * Math.PI * 2;
        const dist = effective > 1 ? Math.sqrt(rnd()) * spread : 0;
        const ax = a.x + Math.cos(ang) * dist;
        const az = a.z + Math.sin(ang) * dist;
        this.animals.push({
          species: a.species,
          homeX: ax,
          homeY: a.y,
          homeZ: az,
          x: ax,
          y: a.y,
          z: az,
          ry: a.ry ?? rnd() * Math.PI * 2,
          roamRadius: a.roamRadius ?? 1.4,
          phase: rnd() * Math.PI * 2,
          graze: Boolean(a.graze),
          followTimer: 0,
          hidden: false,
          body: null,
        });
      }
      animalCounts.set(a.species, (animalCounts.get(a.species) ?? 0) + effective);
    }
    for (const [species, maxCount] of animalCounts) {
      let src: THREE.BufferGeometry;
      switch (species) {
        case 'dog':
          src = buildDogGeometry();
          break;
        case 'cat':
          src = buildCatGeometry();
          break;
        case 'sheep':
          src = buildSheepGeometry();
          break;
        case 'duck':
          src = buildDuckGeometry();
          break;
        case 'horse':
          src = buildHarnessHorseGeometry();
          break;
        case 'fish':
          src = buildFishGeometry();
          break;
      }
      const tag = species === 'fish' ? 'fish' : species === 'duck' ? 'birdGround' : 'quad';
      const pool = new InstancedPool(
        prepareLifeGeometry(src, tag),
        maxCount,
        `life-animal-${species}`,
      );
      src.dispose();
      if (species === 'fish' || species === 'duck' || species === 'cat') {
        pool.mesh.castShadow = false;
      }
      this.group.add(pool.mesh);
      this.animalPools.set(species, pool);
    }

    this.syncPools(0);
    this.enableReactionsAndColliders();
  }

  /** Enables kinematic colliders, rider reactions, and scene exclusions (wired in Step 4). */
  enableReactionsAndColliders(): void {
    if (this.reactionReady) return;
    this.reactionReady = true;

    const { rapier, world, bodies, colliders } = this.ctx;

    for (const p of this.people) {
      if (!p.solid) continue;
      const rb = world.createRigidBody(
        rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(p.x, p.y + 0.85, p.z),
      );
      const col = world.createCollider(rapier.ColliderDesc.cylinder(0.82, 0.28), rb);
      bodies?.push(rb);
      colliders?.push(col);
      p.body = rb;
    }

    for (const v of this.vehicles) {
      if (v.kind === 'rowingBoat') continue;
      const halfZ = v.kind === 'omnibus' ? 2.2 : v.kind === 'pennyFarthing' ? 0.75 : 1.55;
      const halfX = v.kind === 'omnibus' ? 0.85 : v.kind === 'pennyFarthing' ? 0.32 : 0.72;
      const rb = world.createRigidBody(
        rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(v.x, v.y + 0.9, v.z),
      );
      const col = world.createCollider(rapier.ColliderDesc.cuboid(halfX, 0.9, halfZ), rb);
      bodies?.push(rb);
      colliders?.push(col);
      v.body = rb;
    }

    for (const a of this.animals) {
      if (a.species !== 'sheep' && a.species !== 'horse' && a.species !== 'dog') continue;
      const rad = a.species === 'horse' ? 0.65 : a.species === 'sheep' ? 0.42 : 0.28;
      const rb = world.createRigidBody(
        rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(a.x, a.y + rad, a.z),
      );
      const col = world.createCollider(rapier.ColliderDesc.cylinder(rad, rad), rb);
      bodies?.push(rb);
      colliders?.push(col);
      a.body = rb;
    }
  }

  setContext(ctx: LifeRuntimeState): void {
    this.runtime = ctx;
  }

  update(dt: number, time: number): void {
    const safeDt = Math.min(dt, 0.05);
    const { playerPos, playerHeading, playerSpeed, focusPos, excludeCenters, excludeRadius } =
      this.runtime;
    const galloping = playerSpeed > 8.5;
    const playerRightX = Math.cos(playerHeading);
    const playerRightZ = -Math.sin(playerHeading);

    // Pedestrians
    for (const p of this.people) {
      const excluded = this.isExcluded(p.homeX, p.homeZ, p.x, p.z, excludeCenters, excludeRadius);
      if (excluded && p.stationary) {
        this.parkBody(p.body);
        continue;
      }

      const distFocus = Math.hypot(p.x - focusPos.x, p.z - focusPos.z);
      if (distFocus > LIFE_ANIM_DIST + 8 && !p.steppingAside) {
        if (p.body && !excluded) {
          p.body.setNextKinematicTranslation({ x: p.x, y: p.y + 0.85, z: p.z });
        }
        continue;
      }

      let hideWalking = false;
      if (excluded && !p.stationary) {
        // Walk briskly away from the exclusion circle if still close, otherwise hide.
        const c = excludeCenters[0];
        if (c && Math.hypot(p.x - c.x, p.z - c.z) < excludeRadius) {
          hideWalking = true;
        }
      }

      if (!p.stationary && p.path && !hideWalking) {
        const speedMul = p.steppingAside ? 0.15 : 1.0;
        p.distance += p.baseSpeed * speedMul * safeDt;
        samplePath(p.path, p.distance, tmpPos, tmpDir);
        const pathRightX = -tmpDir.z;
        const pathRightZ = tmpDir.x;
        p.homeX = tmpPos.x + pathRightX * p.lateralOffset;
        p.homeY = tmpPos.y;
        p.homeZ = tmpPos.z + pathRightZ * p.lateralOffset;
        p.homeRy = Math.atan2(tmpDir.x, tmpDir.z);
      }

      if (this.reactionReady && !hideWalking) {
        const dx = p.homeX - playerPos.x;
        const dz = p.homeZ - playerPos.z;
        const dPlayer = Math.hypot(dx, dz);
        const reactDist = galloping ? 5.6 : 4.2;
        if (dPlayer < reactDist) {
          if (!p.steppingAside) {
            const sideDot = dx * playerRightX + dz * playerRightZ;
            p.dodgeDir = sideDot >= 0 ? 1 : -1;
            p.steppingAside = true;
          }
          const targetDodge = galloping ? 1.95 : 1.25;
          p.dodge = THREE.MathUtils.lerp(p.dodge, targetDodge * p.dodgeDir, safeDt * 6.5);
          p.x = p.homeX + playerRightX * p.dodge;
          p.y = p.homeY;
          p.z = p.homeZ + playerRightZ * p.dodge;
          p.ry = Math.atan2(playerPos.x - p.x, playerPos.z - p.z);
        } else {
          p.steppingAside = false;
          p.dodge = THREE.MathUtils.lerp(p.dodge, 0, safeDt * 3.5);
          p.x = p.homeX + playerRightX * p.dodge;
          p.y = p.homeY;
          p.z = p.homeZ + playerRightZ * p.dodge;
          p.ry = p.homeRy;
        }
      } else {
        p.x = p.homeX;
        p.y = p.homeY;
        p.z = p.homeZ;
        p.ry = p.homeRy;
      }

      if (p.body) {
        if (hideWalking) this.parkBody(p.body);
        else p.body.setNextKinematicTranslation({ x: p.x, y: p.y + 0.85, z: p.z });
      }
    }

    // Vehicles & rowing boats
    for (const v of this.vehicles) {
      v.hidden = this.isExcluded(v.x, v.z, v.x, v.z, excludeCenters, excludeRadius);
      if (v.hidden) {
        this.parkBody(v.body);
        continue;
      }

      // Yield when the player is directly ahead in the vehicle's path.
      let wantYield = 1;
      if (this.reactionReady && v.kind !== 'rowingBoat') {
        const fwdX = Math.sin(v.ry);
        const fwdZ = Math.cos(v.ry);
        const rx = playerPos.x - v.x;
        const rz = playerPos.z - v.z;
        const ahead = rx * fwdX + rz * fwdZ;
        const lateral = Math.abs(rx * fwdZ - rz * fwdX);
        if (ahead > 0.6 && ahead < 5.8 && lateral < 1.8) {
          wantYield = 0;
        }
      }
      v.yieldFactor = THREE.MathUtils.lerp(v.yieldFactor, wantYield, safeDt * 4.5);
      v.distance += v.speed * v.yieldFactor * safeDt;
      samplePath(v.path, v.distance, tmpPos, tmpDir);
      v.x = tmpPos.x;
      v.y = tmpPos.y + (v.bobWater ? Math.sin(time * 2.1 + v.phase) * 0.04 : 0);
      v.z = tmpPos.z;
      v.ry = Math.atan2(tmpDir.x, tmpDir.z);

      if (v.body) {
        v.body.setNextKinematicTranslation({ x: v.x, y: v.y + 0.9, z: v.z });
        const halfYaw = v.ry * 0.5;
        v.body.setNextKinematicRotation({ x: 0, y: Math.sin(halfYaw), z: 0, w: Math.cos(halfYaw) });
      }
    }

    // Birds (pecking ground -> burst upward circling flight when player approaches)
    for (const b of this.birds) {
      b.hidden = this.isExcluded(b.homeX, b.homeZ, b.x, b.z, excludeCenters, excludeRadius);
      if (b.hidden) continue;

      if (b.roosting) {
        b.orbitAngle += safeDt * 0.55;
        b.x = b.homeX + Math.cos(b.orbitAngle) * b.flightRadius;
        b.z = b.homeZ + Math.sin(b.orbitAngle) * b.flightRadius;
        b.y = b.homeY + b.flightHeight + Math.sin(time * 1.4 + b.phase) * 0.55;
        b.ry = Math.atan2(-Math.sin(b.orbitAngle), Math.cos(b.orbitAngle));
        continue;
      }

      if (this.reactionReady) {
        const dPlayer = Math.hypot(b.x - playerPos.x, b.z - playerPos.z);
        if (dPlayer < 6.8) {
          if (b.flightTimer <= 0.1) {
            b.orbitAngle = Math.atan2(b.z - playerPos.z, b.x - playerPos.x);
          }
          b.flightTimer = Math.max(b.flightTimer, 4.4 + (b.phase % 1.4));
        }
      }

      if (b.flightTimer > 0) {
        b.flightTimer = Math.max(0, b.flightTimer - safeDt);
        b.orbitAngle += safeDt * 1.15;
        const arcProgress = b.flightTimer > 1.2 ? 1 : b.flightTimer / 1.2;
        const rad = b.flightRadius * 0.65 * arcProgress;
        const tx = b.homeX + Math.cos(b.orbitAngle) * rad;
        const tz = b.homeZ + Math.sin(b.orbitAngle) * rad;
        const ty = b.homeY + (b.flightHeight * 0.8 + Math.sin(b.orbitAngle * 2) * 0.5) * arcProgress;
        b.ry = Math.atan2(tx - b.x, tz - b.z);
        b.x = THREE.MathUtils.lerp(b.x, tx, safeDt * 4.0);
        b.y = THREE.MathUtils.lerp(b.y, ty, safeDt * 4.0);
        b.z = THREE.MathUtils.lerp(b.z, tz, safeDt * 4.0);
      } else {
        const wanderR = 0.35;
        b.x = b.homeX + Math.cos(time * 0.55 + b.phase) * wanderR;
        b.y = b.homeY;
        b.z = b.homeZ + Math.sin(time * 0.48 + b.phase) * wanderR;
        b.ry += safeDt * 0.25 * Math.sin(time * 0.4 + b.phase);
      }
    }

    // Quad animals, ducks, sheep, fish
    for (const a of this.animals) {
      a.hidden = this.isExcluded(a.homeX, a.homeZ, a.x, a.z, excludeCenters, excludeRadius);
      if (a.hidden) {
        this.parkBody(a.body);
        continue;
      }

      if (a.species === 'fish') {
        const cycle = (time * 0.55 + a.phase) % 4.5;
        if (cycle < 1.0) {
          const arc = Math.sin(cycle * Math.PI);
          a.x = a.homeX + (cycle - 0.5) * 1.6;
          a.y = a.homeY + arc * 0.72 - 0.12;
          a.z = a.homeZ;
        } else {
          a.y = a.homeY - 0.85;
        }
        continue;
      }

      if (a.species === 'dog' && this.reactionReady) {
        const dPlayer = Math.hypot(a.x - playerPos.x, a.z - playerPos.z);
        if (dPlayer < 5.8 && Math.hypot(playerPos.x - a.homeX, playerPos.z - a.homeZ) < 16) {
          a.followTimer = 2.5;
        }
        if (a.followTimer > 0) {
          a.followTimer = Math.max(0, a.followTimer - safeDt);
          const tx = playerPos.x + playerRightX * 1.65;
          const tz = playerPos.z + playerRightZ * 1.65;
          a.ry = Math.atan2(tx - a.x, tz - a.z);
          a.x = THREE.MathUtils.lerp(a.x, tx, safeDt * 2.4);
          a.z = THREE.MathUtils.lerp(a.z, tz, safeDt * 2.4);
          a.body?.setNextKinematicTranslation({ x: a.x, y: a.y + 0.28, z: a.z });
          continue;
        }
      }

      if (a.roamRadius > 0.2 && a.species !== 'cat' && !a.graze) {
        const spd = a.species === 'sheep' ? 0.22 : a.species === 'duck' ? 0.32 : 0.4;
        const tx = a.homeX + Math.cos(time * spd + a.phase) * a.roamRadius;
        const tz = a.homeZ + Math.sin(time * spd * 0.8 + a.phase) * a.roamRadius;
        a.ry = Math.atan2(tx - a.x, tz - a.z);
        a.x = THREE.MathUtils.lerp(a.x, tx, safeDt * 1.5);
        a.z = THREE.MathUtils.lerp(a.z, tz, safeDt * 1.5);
        if (a.species === 'duck') {
          a.y = a.homeY + Math.sin(time * 2.2 + a.phase) * 0.03;
        }
      }

      if (a.body) {
        const rad = a.species === 'horse' ? 0.65 : a.species === 'sheep' ? 0.42 : 0.28;
        a.body.setNextKinematicTranslation({ x: a.x, y: a.y + rad, z: a.z });
      }
    }

    this.syncPools(time);
  }

  private syncPools(_time: number): void {
    const { excludeCenters, excludeRadius } = this.runtime;

    // 1. People pools grouped by role.
    const personCounts = new Map<PersonRole, number>();
    for (const role of this.personPools.keys()) personCounts.set(role, 0);

    for (const p of this.people) {
      if (this.isExcluded(p.homeX, p.homeZ, p.x, p.z, excludeCenters, excludeRadius)) continue;
      const pool = this.personPools.get(p.role);
      if (!pool) continue;
      const slot = personCounts.get(p.role) ?? 0;
      const activeMode = p.steppingAside ? AnimMode.Gesture : p.mode;
      const speed = activeMode === AnimMode.Walk ? p.baseSpeed * 3.4 : 2.1;
      const amp = p.steppingAside ? 0.65 : p.amp;
      pool.setSlot(
        slot,
        p.x,
        p.y,
        p.z,
        p.ry,
        p.scale,
        activeMode,
        p.phase,
        speed,
        amp,
        this.colorsDirty ? p.tint : undefined,
      );
      personCounts.set(p.role, slot + 1);
    }
    for (const [role, pool] of this.personPools) {
      pool.commit(personCounts.get(role) ?? 0, this.colorsDirty);
    }
    this.colorsDirty = false;

    // 2. Vehicles.
    const vehCounts = new Map<string, number>();
    for (const key of this.vehiclePools.keys()) vehCounts.set(key, 0);
    for (const v of this.vehicles) {
      if (v.hidden) continue;
      const pool = this.vehiclePools.get(v.poolKey);
      if (!pool) continue;
      const slot = vehCounts.get(v.poolKey) ?? 0;
      const moving = v.yieldFactor > 0.2;
      pool.setSlot(
        slot,
        v.x,
        v.y,
        v.z,
        v.ry,
        1.0,
        moving ? AnimMode.Vehicle : AnimMode.Still,
        v.phase,
        v.kind === 'rowingBoat' ? 2.4 : v.speed * 1.4,
        v.yieldFactor,
      );
      vehCounts.set(v.poolKey, slot + 1);
    }
    for (const [key, pool] of this.vehiclePools) {
      pool.commit(vehCounts.get(key) ?? 0);
    }

    // 3. Birds (ground vs flying pools).
    const gndCounts = new Map<'pigeon' | 'gull', number>();
    const flyCounts = new Map<'pigeon' | 'gull', number>();
    for (const s of this.birdGroundPools.keys()) {
      gndCounts.set(s, 0);
      flyCounts.set(s, 0);
    }
    for (const b of this.birds) {
      if (b.hidden) continue;
      const flying = b.roosting || b.flightTimer > 0.05;
      if (flying) {
        const pool = this.birdFlyPools.get(b.species);
        if (!pool) continue;
        const slot = flyCounts.get(b.species) ?? 0;
        pool.setSlot(slot, b.x, b.y, b.z, b.ry, 1.0, AnimMode.BirdFly, b.phase, 7.2, 1.0);
        flyCounts.set(b.species, slot + 1);
      } else {
        const pool = this.birdGroundPools.get(b.species);
        if (!pool) continue;
        const slot = gndCounts.get(b.species) ?? 0;
        pool.setSlot(slot, b.x, b.y, b.z, b.ry, 1.0, AnimMode.BirdGround, b.phase, 3.6, 1.0);
        gndCounts.set(b.species, slot + 1);
      }
    }
    for (const [s, pool] of this.birdGroundPools) pool.commit(gndCounts.get(s) ?? 0);
    for (const [s, pool] of this.birdFlyPools) pool.commit(flyCounts.get(s) ?? 0);

    // 4. Other animals.
    const animalCounts = new Map<AnimalEntity['species'], number>();
    for (const s of this.animalPools.keys()) animalCounts.set(s, 0);
    for (const a of this.animals) {
      if (a.hidden) continue;
      const pool = this.animalPools.get(a.species);
      if (!pool) continue;
      const slot = animalCounts.get(a.species) ?? 0;
      const mode =
        a.species === 'fish'
          ? AnimMode.Fish
          : a.species === 'duck'
            ? AnimMode.BirdGround
            : AnimMode.Quad;
      const amp = a.graze ? 0.35 : a.followTimer > 0 ? 1.25 : 0.75;
      pool.setSlot(slot, a.x, a.y, a.z, a.ry, 1.0, mode, a.phase, 4.2, amp);
      animalCounts.set(a.species, slot + 1);
    }
    for (const [s, pool] of this.animalPools) pool.commit(animalCounts.get(s) ?? 0);
  }

  private nearStop(x: number, z: number, minDist: number): boolean {
    for (const s of this.stops) {
      if (Math.hypot(x - s.position.x, z - s.position.z) < minDist) return true;
    }
    return false;
  }

  private isExcluded(
    homeX: number,
    homeZ: number,
    curX: number,
    curZ: number,
    centers: THREE.Vector3[],
    radius: number,
  ): boolean {
    if (centers.length === 0) return false;
    for (const c of centers) {
      if (Math.hypot(homeX - c.x, homeZ - c.z) < radius) return true;
      if (Math.hypot(curX - c.x, curZ - c.z) < radius) return true;
    }
    return false;
  }

  private parkBody(body: PersonEntity['body']): void {
    body?.setNextKinematicTranslation({ x: 0, y: -60, z: 0 });
  }

  dispose(): void {
    for (const pool of this.personPools.values()) pool.dispose();
    for (const pool of this.birdGroundPools.values()) pool.dispose();
    for (const pool of this.birdFlyPools.values()) pool.dispose();
    for (const pool of this.animalPools.values()) pool.dispose();
    for (const pool of this.vehiclePools.values()) pool.dispose();
    this.personPools.clear();
    this.birdGroundPools.clear();
    this.birdFlyPools.clear();
    this.animalPools.clear();
    this.vehiclePools.clear();
    this.group.removeFromParent();
  }
}
