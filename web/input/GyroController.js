import { clamp } from '../utils/MathUtils.js';
// Maps device tilt to aircraft control — calibrate on activation
export class GyroController {
    constructor() {
        Object.defineProperty(this, "available", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "enabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "calibratedBeta", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // rest pitch (beta = front-back tilt)
        Object.defineProperty(this, "calibratedGamma", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // rest roll  (gamma = left-right tilt)
        Object.defineProperty(this, "currentBeta", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "currentGamma", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "RANGE_BETA", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 35
        }); // degrees tilt = full pitch input
        Object.defineProperty(this, "RANGE_GAMMA", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 40
        }); // degrees tilt = full roll input
        Object.defineProperty(this, "DEADZONE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2
        }); // degrees
        Object.defineProperty(this, "onOrientation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                this.currentBeta = e.beta ?? 0;
                this.currentGamma = e.gamma ?? 0;
            }
        });
        if ('DeviceOrientationEvent' in window) {
            this.available = true;
            window.addEventListener('deviceorientation', this.onOrientation);
        }
    }
    async requestPermission() {
        // iOS 13+ requires explicit permission
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const perm = await DeviceOrientationEvent.requestPermission();
                return perm === 'granted';
            }
            catch {
                return false;
            }
        }
        return this.available;
    }
    calibrate() {
        this.calibratedBeta = this.currentBeta;
        this.calibratedGamma = this.currentGamma;
    }
    setEnabled(v) {
        this.enabled = v;
        if (v)
            this.calibrate();
    }
    get output() {
        if (!this.enabled || !this.available) {
            return { pitch: 0, roll: 0, available: this.available };
        }
        let dBeta = this.currentBeta - this.calibratedBeta;
        let dGamma = this.currentGamma - this.calibratedGamma;
        // Deadzone
        if (Math.abs(dBeta) < this.DEADZONE)
            dBeta = 0;
        if (Math.abs(dGamma) < this.DEADZONE)
            dGamma = 0;
        return {
            pitch: clamp(dBeta / this.RANGE_BETA, -1, 1),
            roll: clamp(dGamma / this.RANGE_GAMMA, -1, 1),
            available: true,
        };
    }
    get isEnabled() { return this.enabled; }
    get isAvailable() { return this.available; }
    destroy() {
        window.removeEventListener('deviceorientation', this.onOrientation);
    }
}
