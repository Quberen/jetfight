import { AceParams } from '../game/Config';
import { clamp01 } from '../utils/MathUtils';

export class GForceEffect {
  private vignetteEl: HTMLElement;
  private currentIntensity = 0;

  constructor() {
    this.vignetteEl = document.getElementById('gforce-vignette')!;
  }

  update(gForce: number, dt: number): void {
    const target = clamp01(
      (gForce - AceParams.gForceTunnelVisionThreshold) /
      (AceParams.gForceMax - AceParams.gForceTunnelVisionThreshold)
    );
    // Smooth transition
    this.currentIntensity += (target - this.currentIntensity) * Math.min(1, dt * 5);
    this.vignetteEl.style.opacity = String(this.currentIntensity * 0.9);

    // Grayscale filter on high G
    const gray = this.currentIntensity * 0.7;
    document.body.style.filter = gray > 0.05 ? `grayscale(${gray})` : '';
  }

  reset(): void {
    this.currentIntensity = 0;
    this.vignetteEl.style.opacity = '0';
    document.body.style.filter = '';
  }
}
