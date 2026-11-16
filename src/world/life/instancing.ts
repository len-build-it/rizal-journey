import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  buildPerson,
  personPartId,
  personPivotGroup,
  type PersonOptions,
} from '../../story/figures';
import { injectWorldShader } from '../paperShader';

export const LIFE_ANIM_DIST = 45;

export const lifeShaderUniforms = {
  uLifeTime: { value: 0 },
  uLifeFocus: { value: new THREE.Vector3() },
  uLifeAnimDist: { value: LIFE_ANIM_DIST },
};

export function setLifeFrame(time: number, focus: THREE.Vector3): void {
  lifeShaderUniforms.uLifeTime.value = time;
  lifeShaderUniforms.uLifeFocus.value.copy(focus);
}

export const AnimMode = {
  Still: 0,
  Walk: 1,
  Gesture: 2,
  BirdFly: 3,
  BirdGround: 4,
  Vehicle: 5,
  Quad: 6,
  Fish: 7,
} as const;

let sharedLifeMaterial: THREE.MeshStandardMaterial | null = null;

/**
 * Shared flat-shaded instanced material compatible with paper edge fading
 * and zero-cost GPU limb/wing/wheel animation within 45 units of the focus.
 */
export function getLifeMaterial(): THREE.MeshStandardMaterial {
  if (sharedLifeMaterial) return sharedLifeMaterial;

  const m = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0,
    flatShading: true,
    vertexColors: true,
  });
  injectWorldShader(m);
  const baseCompile = m.onBeforeCompile;
  m.customProgramCacheKey = () => 'world-paper-life-v2';
  m.onBeforeCompile = (shader, renderer) => {
    baseCompile?.(shader, renderer);
    shader.uniforms.uLifeTime = lifeShaderUniforms.uLifeTime;
    shader.uniforms.uLifeFocus = lifeShaderUniforms.uLifeFocus;
    shader.uniforms.uLifeAnimDist = lifeShaderUniforms.uLifeAnimDist;

    shader.vertexShader = shader.vertexShader
      .replace(
        'void main() {',
        `attribute vec4 aLifeAnim;
        attribute float aLifePart;
        attribute vec3 aLifePivot;
        uniform float uLifeTime;
        uniform vec3 uLifeFocus;
        uniform float uLifeAnimDist;
        vec2 lifeRot2(vec2 p, vec2 piv, float a) {
          vec2 d = p - piv;
          float c = cos(a);
          float s = sin(a);
          return piv + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
        }
        void main() {`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float lifeMode = aLifeAnim.x;
        if (lifeMode > 0.25) {
          vec3 lifeInstPos = vec3(0.0);
          #ifdef USE_INSTANCING
            lifeInstPos = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
          #endif
          float distLife = length(lifeInstPos.xz - uLifeFocus.xz);
          float lifeFade = 1.0 - smoothstep(uLifeAnimDist * 0.84, uLifeAnimDist, distLife);
          float lt = uLifeTime * aLifeAnim.z + aLifeAnim.y;
          float amp = aLifeAnim.w * lifeFade;

          if (lifeMode < 1.5) {
            // Walk / stroll / hurry
            float swing = sin(lt) * 0.48 * amp;
            if (aLifePart > 0.5 && aLifePart < 1.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, swing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 1.5 && aLifePart < 2.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -swing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 2.5 && aLifePart < 3.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -swing * 0.72);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 3.5 && aLifePart < 4.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, swing * 0.72);
              transformed.y = r.x; transformed.z = r.y;
            }
            transformed.y += abs(sin(lt)) * 0.035 * amp;
          } else if (lifeMode < 2.5) {
            // Stationary gesture / lookUp / sweep
            if (amp > 1.35 && amp < 2.35) {
              if (aLifePart > 4.5 && aLifePart < 5.5) {
                vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -0.34 + sin(lt * 0.45) * 0.06);
                transformed.y = r.x; transformed.z = r.y;
              }
            } else if (amp >= 2.35) {
              if (aLifePart > 2.5 && aLifePart < 4.5) {
                vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -0.5 + sin(lt) * 0.32);
                transformed.y = r.x; transformed.z = r.y;
              }
            } else {
              if (aLifePart > 2.5 && aLifePart < 3.5) {
                vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -0.22 + sin(lt) * 0.25 * amp);
                transformed.y = r.x; transformed.z = r.y;
              } else if (aLifePart > 4.5 && aLifePart < 5.5) {
                vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, sin(lt * 0.8) * 0.1 * amp);
                transformed.y = r.x; transformed.z = r.y;
              }
            }
          } else if (lifeMode < 3.5) {
            // Flying bird wing flap
            float flap = sin(lt) * 0.62 * amp;
            if (aLifePart > 5.5 && aLifePart < 6.5) {
              vec2 r = lifeRot2(transformed.xy, aLifePivot.xy, flap);
              transformed.x = r.x; transformed.y = r.y;
            } else if (aLifePart > 6.5 && aLifePart < 7.5) {
              vec2 r = lifeRot2(transformed.xy, aLifePivot.xy, -flap);
              transformed.x = r.x; transformed.y = r.y;
            }
          } else if (lifeMode < 4.5) {
            // Ground bird peck
            if (aLifePart > 4.5 && aLifePart < 5.5) {
              float peck = pow(max(0.0, sin(lt)), 6.0) * 0.48 * amp;
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -peck);
              transformed.y = r.x; transformed.z = r.y;
            }
          } else if (lifeMode < 5.5) {
            // Vehicle / boat / carriage bounce, horse/pusher legs & oars
            float swing = sin(lt) * 0.42 * amp;
            if (aLifePart > 0.5 && aLifePart < 1.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, swing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 1.5 && aLifePart < 2.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -swing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 2.5 && aLifePart < 3.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -swing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 3.5 && aLifePart < 4.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, swing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 5.5 && aLifePart < 7.5) {
              float stroke = sin(lt) * 0.34 * amp;
              transformed.z += stroke * 0.32;
              transformed.y += cos(lt) * 0.08 * amp;
            } else {
              transformed.y += sin(lt * 2.0) * 0.015 * amp;
            }
          } else if (lifeMode < 6.5) {
            // Quadruped walk / graze
            float qSwing = sin(lt) * 0.38 * amp;
            if (aLifePart > 0.5 && aLifePart < 1.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, qSwing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 1.5 && aLifePart < 2.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -qSwing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 2.5 && aLifePart < 3.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, -qSwing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 3.5 && aLifePart < 4.5) {
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, qSwing);
              transformed.y = r.x; transformed.z = r.y;
            } else if (aLifePart > 4.5 && aLifePart < 5.5) {
              float graze = amp < 0.45 ? -0.35 + sin(lt * 0.5) * 0.08 : sin(lt) * 0.08 * amp;
              vec2 r = lifeRot2(transformed.yz, aLifePivot.yz, graze);
              transformed.y = r.x; transformed.z = r.y;
            }
          } else {
            // Fish tail wiggle
            transformed.x += sin(lt * 2.0 + transformed.z * 5.0) * 0.06 * amp;
          }
        }`,
      );
  };

  sharedLifeMaterial = m;
  return m;
}

export type LifeTagMode = 'none' | 'birdFly' | 'birdGround' | 'quad' | 'fish';

/**
 * Ensures vertex attributes needed by the instanced world/life shader are present:
 * zeroed `aPopupAnchor` (so background figures do not flatten far from (0,0,0))
 * and `aLifePart` limb/wing tags derived automatically when not pre-baked.
 */
export function prepareLifeGeometry(
  source: THREE.BufferGeometry,
  tagMode: LifeTagMode = 'none',
): THREE.BufferGeometry {
  const geo = source.index ? source.toNonIndexed() : source.clone();
  const pos = geo.getAttribute('position');
  const count = pos.count;

  if (!geo.getAttribute('aPopupAnchor')) {
    geo.setAttribute('aPopupAnchor', new THREE.BufferAttribute(new Float32Array(count * 4), 4));
  }

  if (!geo.getAttribute('aLifePart')) {
    const parts = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      if (tagMode === 'birdFly') {
        parts[i] = x < -0.14 ? 6 : x > 0.14 ? 7 : 0;
      } else if (tagMode === 'birdGround') {
        parts[i] = y > 0.11 ? 5 : 0;
      } else if (tagMode === 'quad') {
        parts[i] = z > 0.18 && y > 0.2 ? 5 : y < 0.25 ? 1 : 0;
      } else if (tagMode === 'fish') {
        parts[i] = 8;
      }
    }
    geo.setAttribute('aLifePart', new THREE.BufferAttribute(parts, 1));
  }

  if (!geo.getAttribute('aLifePivot')) {
    const pivots = new Float32Array(count * 3);
    const part = geo.getAttribute('aLifePart');
    for (let i = 0; i < count; i++) {
      const pid = part ? Math.round(part.getX(i)) : 0;
      if (tagMode === 'birdFly') {
        if (pid === 6) {
          pivots[i * 3] = -0.08;
          pivots[i * 3 + 1] = 0.22;
        } else if (pid === 7) {
          pivots[i * 3] = 0.08;
          pivots[i * 3 + 1] = 0.22;
        }
      } else if (tagMode === 'birdGround' && pid === 5) {
        pivots[i * 3 + 1] = 0.14;
        pivots[i * 3 + 2] = 0.04;
      }
    }
    geo.setAttribute('aLifePivot', new THREE.BufferAttribute(pivots, 3));
  }

  return geo;
}

const tmpPivot = new THREE.Vector3();

/**
 * Bakes an articulated `buildPerson` rig into a single geometry annotated with `aLifePart`
 * and `aLifePivot` attributes so background pedestrians animate around their scaled rig pivots.
 */
export function bakePersonGeometry(opts: PersonOptions): THREE.BufferGeometry {
  const rig = buildPerson(opts);
  rig.root.updateMatrixWorld(true);
  const parts: THREE.BufferGeometry[] = [];

  rig.root.traverse((c) => {
    if (c instanceof THREE.Mesh) {
      const g = c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone();
      g.applyMatrix4(c.matrixWorld);
      const partId = personPartId(c, rig);
      personPivotGroup(c, rig).getWorldPosition(tmpPivot);

      const count = g.getAttribute('position').count;
      const partAttr = new Float32Array(count);
      partAttr.fill(partId);
      const pivotAttr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pivotAttr[i * 3] = tmpPivot.x;
        pivotAttr[i * 3 + 1] = tmpPivot.y;
        pivotAttr[i * 3 + 2] = tmpPivot.z;
      }
      g.setAttribute('aLifePart', new THREE.BufferAttribute(partAttr, 1));
      g.setAttribute('aLifePivot', new THREE.BufferAttribute(pivotAttr, 3));
      g.setAttribute('aPopupAnchor', new THREE.BufferAttribute(new Float32Array(count * 4), 4));
      parts.push(g);
    }
  });
  rig.dispose();

  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  if (!merged) return new THREE.BufferGeometry();
  merged.computeVertexNormals();
  return merged;
}

const dummyObj = new THREE.Object3D();
const tmpTint = new THREE.Color();

export class InstancedPool {
  readonly mesh: THREE.InstancedMesh;
  readonly capacity: number;
  private readonly animData: Float32Array;
  private readonly animAttr: THREE.InstancedBufferAttribute;
  private readonly ownsGeometry: boolean;

  constructor(
    geometry: THREE.BufferGeometry,
    capacity: number,
    name: string,
    ownsGeometry = true,
  ) {
    this.capacity = Math.max(1, capacity);
    this.ownsGeometry = ownsGeometry;
    this.animData = new Float32Array(this.capacity * 4);
    this.animAttr = new THREE.InstancedBufferAttribute(this.animData, 4);
    this.animAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aLifeAnim', this.animAttr);

    this.mesh = new THREE.InstancedMesh(geometry, getLifeMaterial(), this.capacity);
    this.mesh.name = name;
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;

    for (let i = 0; i < this.capacity; i++) {
      this.mesh.setColorAt(i, tmpTint.setHex(0xffffff));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  setSlot(
    index: number,
    x: number,
    y: number,
    z: number,
    ry: number,
    scale: number,
    mode: number,
    phase: number,
    speed: number,
    amp: number,
    tintHex?: number,
  ): void {
    if (index < 0 || index >= this.capacity) return;
    dummyObj.position.set(x, y, z);
    dummyObj.rotation.set(0, ry, 0);
    dummyObj.scale.setScalar(scale);
    dummyObj.updateMatrix();
    this.mesh.setMatrixAt(index, dummyObj.matrix);

    const base = index * 4;
    this.animData[base] = mode;
    this.animData[base + 1] = phase;
    this.animData[base + 2] = speed;
    this.animData[base + 3] = amp;

    if (tintHex !== undefined) {
      this.mesh.setColorAt(index, tmpTint.setHex(tintHex));
    }
  }

  commit(activeCount: number, updateColors = false): void {
    this.mesh.count = Math.min(this.capacity, Math.max(0, activeCount));
    this.mesh.instanceMatrix.needsUpdate = true;
    this.animAttr.needsUpdate = true;
    if (updateColors && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  dispose(): void {
    this.mesh.removeFromParent();
    this.mesh.dispose();
    if (this.ownsGeometry) this.mesh.geometry.dispose();
  }
}
