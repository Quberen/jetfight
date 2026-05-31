import * as THREE from 'three';
import { EffectParams } from '../game/Config.js';
import { clamp } from '../utils/MathUtils.js';
import { nextNoise } from '../utils/MathUtils.js';

export class ScreenShake {
  private intensity = 0;
  readonly offset = new THREE.Vector3();

  trigger(amount: number): void {
    this.intensity = clamp(this.intensity + amount, 0, EffectParams.screenShakeMax);
  }

  update(dt: number): void {
    if (this.intensity < 0.001) {
      this.offset.set(0, 0, 0);
      return;
    }
    this.offset.set(
      nextNoise() * this.intensity,
      nextNoise() * this.intensity,
      0
    );
    this.intensity = Math.max(0, this.intensity - EffectParams.screenShakeDecay * dt);
  }
}
