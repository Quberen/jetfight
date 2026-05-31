import * as THREE from 'three';
import { EffectParams } from '../game/Config.js';
import { clamp } from '../utils/MathUtils.js';
import { nextNoise } from '../utils/MathUtils.js';
export class ScreenShake {
    constructor() {
        Object.defineProperty(this, "intensity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "offset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
    }
    trigger(amount) {
        this.intensity = clamp(this.intensity + amount, 0, EffectParams.screenShakeMax);
    }
    update(dt) {
        if (this.intensity < 0.001) {
            this.offset.set(0, 0, 0);
            return;
        }
        this.offset.set(nextNoise() * this.intensity, nextNoise() * this.intensity, 0);
        this.intensity = Math.max(0, this.intensity - EffectParams.screenShakeDecay * dt);
    }
}
