import * as THREE from 'three';
import { ObjectPool } from '../utils/ObjectPool.js';
const makeS = () => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3(), life: 0 });
const resetS = (s) => { s.pos.set(0, 0, 0); s.vel.set(0, 0, 0); s.life = 0; };
export class HitSparkEffect {
    constructor(scene) {
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new ObjectPool(makeS, resetS, 100)
        });
        Object.defineProperty(this, "active", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "positions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "geo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "points", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "MAX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 100
        });
        this.positions = new Float32Array(this.MAX * 3);
        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffcc44, size: 3, sizeAttenuation: true, depthWrite: false });
        this.points = new THREE.Points(this.geo, mat);
        this.points.frustumCulled = false;
        scene.add(this.points);
    }
    spawn(origin, normal) {
        for (let i = 0; i < 10; i++) {
            const s = this.pool.acquire();
            s.pos.copy(origin);
            const spread = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize().add(normal.clone().multiplyScalar(0.6)).normalize();
            s.vel.copy(spread).multiplyScalar(20 + Math.random() * 30);
            s.life = 0.15 + Math.random() * 0.15;
            this.active.push(s);
        }
    }
    update(dt) {
        const dead = [];
        let c = 0;
        for (const s of this.active) {
            s.life -= dt;
            if (s.life <= 0) {
                dead.push(s);
                continue;
            }
            s.pos.addScaledVector(s.vel, dt);
            if (c < this.MAX) {
                this.positions[c * 3] = s.pos.x;
                this.positions[c * 3 + 1] = s.pos.y;
                this.positions[c * 3 + 2] = s.pos.z;
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
