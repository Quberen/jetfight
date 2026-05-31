import { clamp } from '../utils/MathUtils.js';

export interface GyroOutput {
  pitch: number;  // [-1, 1]
  roll: number;   // [-1, 1]
  available: boolean;
}

// Maps device tilt to aircraft control — calibrate on activation
export class GyroController {
  private available = false;
  private enabled = false;
  private calibratedBeta = 0;   // rest pitch (beta = front-back tilt)
  private calibratedGamma = 0;  // rest roll  (gamma = left-right tilt)
  private currentBeta = 0;
  private currentGamma = 0;

  private readonly RANGE_BETA  = 35; // degrees tilt = full pitch input
  private readonly RANGE_GAMMA = 40; // degrees tilt = full roll input
  private readonly DEADZONE    = 2;  // degrees

  constructor() {
    if ('DeviceOrientationEvent' in window) {
      this.available = true;
      window.addEventListener('deviceorientation', this.onOrientation);
    }
  }

  async requestPermission(): Promise<boolean> {
    // iOS 13+ requires explicit permission
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        return perm === 'granted';
      } catch {
        return false;
      }
    }
    return this.available;
  }

  calibrate(): void {
    this.calibratedBeta  = this.currentBeta;
    this.calibratedGamma = this.currentGamma;
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (v) this.calibrate();
  }

  private onOrientation = (e: DeviceOrientationEvent): void => {
    this.currentBeta  = e.beta  ?? 0;
    this.currentGamma = e.gamma ?? 0;
  };

  get output(): GyroOutput {
    if (!this.enabled || !this.available) {
      return { pitch: 0, roll: 0, available: this.available };
    }

    let dBeta  = this.currentBeta  - this.calibratedBeta;
    let dGamma = this.currentGamma - this.calibratedGamma;

    // Deadzone
    if (Math.abs(dBeta)  < this.DEADZONE) dBeta  = 0;
    if (Math.abs(dGamma) < this.DEADZONE) dGamma = 0;

    return {
      pitch: clamp(dBeta  / this.RANGE_BETA,  -1, 1),
      roll:  clamp(dGamma / this.RANGE_GAMMA, -1, 1),
      available: true,
    };
  }

  get isEnabled(): boolean { return this.enabled; }
  get isAvailable(): boolean { return this.available; }

  destroy(): void {
    window.removeEventListener('deviceorientation', this.onOrientation);
  }
}
