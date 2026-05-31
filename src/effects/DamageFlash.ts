import { clamp01 } from '../utils/MathUtils.js';

export class DamageFlash {
  private flashEl: HTMLElement;
  private vignetteEl: HTMLElement;
  private flashTimer = 0;

  constructor() {
    this.flashEl   = document.getElementById('damage-flash')!;
    this.vignetteEl= document.getElementById('damage-vignette')!;
  }

  trigger(intensity = 1.0): void {
    this.flashTimer = 0.35 * intensity;
    this.flashEl.style.opacity = String(clamp01(0.8 * intensity));
  }

  setLowHealthVignette(hpRatio: number): void {
    // Vignette intensifies below 30% hp
    const v = hpRatio < 0.3 ? (1 - hpRatio / 0.3) * 0.6 : 0;
    this.vignetteEl.style.opacity = String(v);
  }

  update(dt: number): void {
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      const t = clamp01(this.flashTimer / 0.35);
      this.flashEl.style.opacity = String(t * 0.8);
    } else {
      this.flashEl.style.opacity = '0';
    }
  }
}
