import * as THREE from 'three';
import { mat } from '../world/kit';
import { palette } from '../world/palette';

const COUNT = 60;

interface Puff {
  life: number;
  max: number;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  size: number;
}

/** Little puffs of dust kicked up behind the hind hooves at speed. */
export class Dust {
  private readonly mesh: THREE.InstancedMesh;
  private readonly puffs: Puff[] = [];
  private next = 0;
  private emitTimer = 0;
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();

  color = palette.dirt;

  constructor(scene: THREE.Scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.3, 0),
      mat(0xeadbbd),
      COUNT,
    );
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    for (let i = 0; i < COUNT; i++) {
      this.puffs.push({
        life: 0,
        max: 1,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        size: 1,
      });
      this.mesh.setMatrixAt(i, this.m.makeScale(0, 0, 0));
    }
    scene.add(this.mesh);
  }

  update(
    dt: number,
    player: { position: THREE.Vector3; heading: number; speed: number },
    intensity: number,
  ): void {
    this.emitTimer -= dt;
    if (intensity > 0.3 && player.speed > 4 && this.emitTimer <= 0) {
      this.emitTimer = 0.07 / intensity;
      const back = -0.75;
      const side = (Math.random() - 0.5) * 0.5;
      const sinH = Math.sin(player.heading);
      const cosH = Math.cos(player.heading);
      const p = this.puffs[this.next]!;
      this.next = (this.next + 1) % COUNT;
      p.pos.set(
        player.position.x + sinH * back + cosH * side,
        0.2,
        player.position.z + cosH * back - sinH * side,
      );
      p.vel.set(
        -sinH * 0.8 + (Math.random() - 0.5) * 0.6,
        0.25 + Math.random() * 0.35,
        -cosH * 0.8 + (Math.random() - 0.5) * 0.6,
      );
      p.max = 0.7 + Math.random() * 0.4;
      p.life = p.max;
      p.size = 0.6 + Math.random() * 0.6;
    }

    for (let i = 0; i < COUNT; i++) {
      const p = this.puffs[i]!;
      if (p.life <= 0) continue;
      p.life -= dt;
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(1 - 2.5 * dt);
      const t = 1 - Math.max(0, p.life) / p.max;
      const scale = p.size * Math.sin(Math.min(1, t) * Math.PI) * (p.life > 0 ? 1 : 0);
      this.s.setScalar(scale);
      this.m.compose(p.pos, this.q, this.s);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
