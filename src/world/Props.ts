import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { mat } from './kit';
import { palette } from './palette';
import type { PhysicsCtx } from './physics';

interface Loose {
  mesh: THREE.Object3D;
  body: RAPIER.RigidBody;
}

/**
 * Loose props the horse can knock over: crates, barrels, cafe chairs.
 * Each is a light dynamic body whose mesh follows the physics every frame.
 */
export class Props {
  private readonly items: Loose[] = [];

  constructor(
    private readonly ctx: PhysicsCtx,
    private readonly scene: THREE.Scene,
  ) {}

  crate(x: number, z: number, size = 0.8, ry = 0, y = size / 2): void {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), mat(palette.crate));
    g.add(box);
    // Dark slats on two faces read as a wooden crate at toy scale.
    const slat = new THREE.BoxGeometry(size * 1.02, size * 0.14, size * 1.02);
    for (const yy of [-0.3, 0.3]) {
      const s = new THREE.Mesh(slat, mat(palette.crateDark));
      s.position.y = yy * size;
      g.add(s);
    }
    this.add(
      g,
      x,
      y,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(size / 2, size / 2, size / 2),
      0.6,
    );
  }

  barrel(x: number, z: number, ry = 0, upright = true): void {
    const g = new THREE.Group();
    const r = 0.36;
    const h = 0.95;
    g.add(
      new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, h, 9), mat(palette.barrel)),
    );
    const belly = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h * 0.5, 9), mat(palette.barrel));
    g.add(belly);
    for (const yy of [-0.36, 0.36]) {
      const hoop = new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.05, 9),
        mat(palette.barrelHoop),
      );
      hoop.position.y = yy * h;
      g.add(hoop);
    }
    const desc = this.ctx.rapier.ColliderDesc.cylinder(h / 2, r);
    if (upright) this.add(g, x, h / 2, z, ry, desc, 0.9);
    else this.add(g, x, r, z, ry, desc, 0.9, Math.PI / 2);
  }

  cafeTable(x: number, z: number): void {
    const g = new THREE.Group();
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.05, 10),
      mat(palette.cafeTable),
    );
    top.position.y = 0.37;
    g.add(top);
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.72, 5),
      mat(palette.lampIron),
    );
    g.add(leg);
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 0.04, 8),
      mat(palette.lampIron),
    );
    foot.position.y = -0.36;
    g.add(foot);
    this.add(g, x, 0.38, z, 0, this.ctx.rapier.ColliderDesc.cylinder(0.38, 0.42), 0.35);

    for (let i = 0; i < 2; i++) {
      const a = i * Math.PI + 0.4;
      this.chair(x + Math.sin(a) * 0.85, z + Math.cos(a) * 0.85, a + Math.PI);
    }
  }

  chair(x: number, z: number, ry: number): void {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), mat(palette.cafeTable));
    seat.position.y = 0.0;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.04), mat(palette.cafeTable));
    back.position.set(0, 0.24, -0.2);
    g.add(back);
    for (const [lx, lz] of [
      [-0.18, -0.18],
      [0.18, -0.18],
      [-0.18, 0.18],
      [0.18, 0.18],
    ] as const) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.44, 0.04), mat(palette.lampIron));
      leg.position.set(lx, -0.22, lz);
      g.add(leg);
    }
    this.add(
      g,
      x,
      0.45,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(0.21, 0.45, 0.21).setTranslation(0, 0, 0),
      0.25,
    );
  }

  flowerCart(x: number, z: number, ry = 0): void {
    const g = new THREE.Group();
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.9), mat(palette.crate));
    cart.position.y = 0.22;
    g.add(cart);
    for (const s of [-1, 1]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10),
        mat(palette.doorBrown),
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(0.1, -0.05, s * 0.5);
      g.add(wheel);
    }
    const flowerColors = [palette.iron, palette.gaslight, palette.awningCream, palette.shutterBlue];
    for (let i = 0; i < 4; i++) {
      const pot = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.24, 0),
        mat(flowerColors[i % flowerColors.length]!),
      );
      pot.position.set(-0.45 + i * 0.3, 0.5, (i % 2 === 0 ? -1 : 1) * 0.18);
      g.add(pot);
    }
    this.add(
      g,
      x,
      0.38,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(0.75, 0.38, 0.52),
      0.8,
    );
  }

  beachChair(x: number, z: number, ry = 0, stripe = palette.awningRed): void {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 1.15), mat(palette.crate));
    frame.position.y = 0.12;
    g.add(frame);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.72), mat(stripe));
    back.position.set(0, 0.35, -0.22);
    back.rotation.x = 0.55;
    g.add(back);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.52), mat(palette.awningCream));
    seat.position.set(0, 0.16, 0.25);
    g.add(seat);
    this.add(
      g,
      x,
      0.22,
      z,
      ry,
      this.ctx.rapier.ColliderDesc.cuboid(0.35, 0.22, 0.6),
      0.3,
    );
  }

  private add(
    g: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    ry: number,
    desc: RAPIER.ColliderDesc,
    mass: number,
    rx = 0,
  ): void {
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0));
    const body = this.ctx.world.createRigidBody(
      this.ctx.rapier.RigidBodyDesc.dynamic()
        .setTranslation(x, y, z)
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        .setLinearDamping(0.4)
        .setAngularDamping(0.6)
        .setCanSleep(true),
    );
    this.ctx.world.createCollider(desc.setMass(mass).setFriction(0.8).setRestitution(0.15), body);
    body.sleep();
    this.ctx.bodies?.push(body);
    this.scene.add(g);
    this.items.push({ mesh: g, body });
    this.sync(g, body);
  }

  update(): void {
    for (const { mesh, body } of this.items) {
      if (body.isSleeping()) continue;
      this.sync(mesh, body);
    }
  }

  dispose(): void {
    for (const { mesh } of this.items) {
      mesh.removeFromParent();
      mesh.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    this.items.length = 0;
  }

  private sync(mesh: THREE.Object3D, body: RAPIER.RigidBody): void {
    const t = body.translation();
    const r = body.rotation();
    mesh.position.set(t.x, t.y, t.z);
    mesh.quaternion.set(r.x, r.y, r.z, r.w);
  }
}
