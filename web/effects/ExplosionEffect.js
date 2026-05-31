import * as THREE from 'three';
import { ObjectPool } from '../utils/ObjectPool.js';
import { EffectParams } from '../game/Config.js';
function makeParticle() {
    return {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
    };
}
function resetParticle(p) {
    p.position.set(0, 0, 0);
    p.velocity.set(0, 0, 0);
    p.life = 0;
    p.maxLife = 1;
}
export class ExplosionEffect {
    constructor(scene) {
        Object.defineProperty(this, "scene", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "active", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "points", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "positions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colors", {
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
        Object.defineProperty(this, "MAX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 300
        });
        this.scene = scene;
        this.pool = new ObjectPool(makeParticle, resetParticle, 300);
        this.positions = new Float32Array(this.MAX * 3);
        this.colors = new Float32Array(this.MAX * 3);
        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
        const mat = new THREE.PointsMaterial({
            size: 6,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            depthWrite: false,
        });
        this.points = new THREE.Points(this.geo, mat);
        this.points.frustumCulled = false;
        scene.add(this.points);
    }
    spawn(origin, isBig = true) {
        const count = isBig ? EffectParams.explosionParticles : 20;
        const speed = isBig ? 60 : 25;
        const life = isBig ? 1.6 : 0.8;
        for (let i = 0; i < count; i++) {
            const p = this.pool.acquire();
            p.position.copy(origin);
            p.velocity.set((Math.random() - 0.5) * speed * 2, (Math.random() - 0.5) * speed * 2 + speed * 0.5, (Math.random() - 0.5) * speed * 2);
            p.maxLife = life * (0.5 + Math.random() * 0.5);
            p.life = p.maxLife;
            this.active.push(p);
        }
    }
    update(dt) {
        let count = 0;
        const toRelease = [];
        for (const p of this.active) {
            p.life -= dt;
            if (p.life <= 0) {
                toRelease.push(p);
                continue;
            }
            p.position.addScaledVector(p.velocity, dt);
            p.velocity.y -= 12 * dt; // gravity on sparks
            if (count < this.MAX) {
                const t = p.life / p.maxLife;
                const i3 = count * 3;
                this.positions[i3] = p.position.x;
                this.positions[i3 + 1] = p.position.y;
                this.positions[i3 + 2] = p.position.z;
                // Color: white -> orange -> red
                this.colors[i3] = 1.0;
                this.colors[i3 + 1] = t > 0.5 ? 1.0 : t * 2;
                this.colors[i3 + 2] = t > 0.7 ? 0.5 : 0;
                count++;
            }
        }
        for (const p of toRelease) {
            this.active.splice(this.active.indexOf(p), 1);
            this.pool.release(p);
        }
        this.geo.getAttribute('position').needsUpdate = true;
        this.geo.getAttribute('color').needsUpdate = true;
        this.geo.setDrawRange(0, count);
    }
}
