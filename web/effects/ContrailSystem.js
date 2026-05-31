import * as THREE from 'three';
import { EffectParams } from '../game/Config.js';
const MAX_POINTS = EffectParams.contrailLengthPoints;
class ContrailTrail {
    constructor(scene) {
        Object.defineProperty(this, "mesh", {
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
        Object.defineProperty(this, "count", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "geo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.positions = new Float32Array(MAX_POINTS * 3);
        this.geo = new THREE.BufferGeometry();
        this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.geo.setDrawRange(0, 0);
        const mat = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.45,
            linewidth: 1,
        });
        this.mesh = new THREE.Line(this.geo, mat);
        this.mesh.frustumCulled = false;
        scene.add(this.mesh);
    }
    addPoint(p) {
        if (this.count < MAX_POINTS) {
            // Shift existing
            this.positions.copyWithin(3, 0, this.count * 3);
        }
        else {
            this.positions.copyWithin(3, 0, (MAX_POINTS - 1) * 3);
        }
        this.positions[0] = p.x;
        this.positions[1] = p.y;
        this.positions[2] = p.z;
        this.count = Math.min(this.count + 1, MAX_POINTS);
        this.geo.getAttribute('position').needsUpdate = true;
        this.geo.setDrawRange(0, this.count);
    }
    clear() {
        this.count = 0;
        this.geo.setDrawRange(0, 0);
    }
    setVisible(v) {
        this.mesh.visible = v;
    }
}
export class ContrailSystem {
    constructor(scene) {
        Object.defineProperty(this, "leftTrail", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rightTrail", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "visible", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "timer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // Wingtip offsets in local aircraft space
        Object.defineProperty(this, "LEFT_OFFSET", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3(-4.5, 0, 0)
        });
        Object.defineProperty(this, "RIGHT_OFFSET", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3(4.5, 0, 0)
        });
        Object.defineProperty(this, "_tmp", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        this.leftTrail = new ContrailTrail(scene);
        this.rightTrail = new ContrailTrail(scene);
    }
    update(state, dt) {
        this.timer += dt;
        if (this.timer < 0.033)
            return; // 30 Hz trail updates
        this.timer = 0;
        const shouldShow = state.position.y > EffectParams.contrailMinAltitude ||
            state.gForce > EffectParams.contrailHighGThreshold ||
            state.isAfterburner;
        this.leftTrail.setVisible(shouldShow);
        this.rightTrail.setVisible(shouldShow);
        if (!shouldShow) {
            this.leftTrail.clear();
            this.rightTrail.clear();
            return;
        }
        this._tmp.copy(this.LEFT_OFFSET).applyQuaternion(state.quaternion).add(state.position);
        this.leftTrail.addPoint(this._tmp);
        this._tmp.copy(this.RIGHT_OFFSET).applyQuaternion(state.quaternion).add(state.position);
        this.rightTrail.addPoint(this._tmp);
    }
    dispose(scene) {
        scene.remove(this.leftTrail.mesh);
        scene.remove(this.rightTrail.mesh);
    }
}
