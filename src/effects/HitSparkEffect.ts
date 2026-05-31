import * as THREE from 'three';
import { ObjectPool } from '../utils/ObjectPool.js';

interface Spark { pos: THREE.Vector3; vel: THREE.Vector3; life: number; }
const makeS = (): Spark => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0 });
const resetS = (s: Spark): void => { s.pos.set(0,0,0); s.vel.set(0,0,0); s.life = 0; };

export class HitSparkEffect {
  private pool = new ObjectPool<Spark>(makeS, resetS, 100);
  private active: Spark[] = [];
  private positions: Float32Array;
  private geo: THREE.BufferGeometry;
  private points: THREE.Points;
  private MAX = 100;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.MAX * 3);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffcc44, size: 3, sizeAttenuation: true, depthWrite: false });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  spawn(origin: THREE.Vector3, normal: THREE.Vector3): void {
    for (let i = 0; i < 10; i++) {
      const s = this.pool.acquire();
      s.pos.copy(origin);
      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().add(normal.clone().multiplyScalar(0.6)).normalize();
      s.vel.copy(spread).multiplyScalar(20 + Math.random() * 30);
      s.life = 0.15 + Math.random() * 0.15;
      this.active.push(s);
    }
  }

  update(dt: number): void {
    const dead: Spark[] = [];
    let c = 0;
    for (const s of this.active) {
      s.life -= dt;
      if (s.life <= 0) { dead.push(s); continue; }
      s.pos.addScaledVector(s.vel, dt);
      if (c < this.MAX) {
        this.positions[c*3]   = s.pos.x;
        this.positions[c*3+1] = s.pos.y;
        this.positions[c*3+2] = s.pos.z;
        c++;
      }
    }
    for (const s of dead) {
      this.active.splice(this.active.indexOf(s), 1);
      this.pool.release(s);
    }
    this.geo.getAttribute('position').needsUpdate = true;
    this.geo.setDrawRange(0, c);
  }
}
