import { clamp01 } from '../utils/MathUtils';

export class ThrottleController {
  private track: HTMLElement;
  private fill: HTMLElement;
  private handle: HTMLElement;
  private pctLabel: HTMLElement;
  private zone: HTMLElement;

  private value = 0.6;
  private touchId: number | null = null;
  private trackRect: DOMRect | null = null;

  constructor(
    trackEl: HTMLElement,
    fillEl: HTMLElement,
    handleEl: HTMLElement,
    pctLabel: HTMLElement,
    zone: HTMLElement
  ) {
    this.track  = trackEl;
    this.fill   = fillEl;
    this.handle = handleEl;
    this.pctLabel = pctLabel;
    this.zone   = zone;

    this.track.addEventListener('touchstart',  this.onStart, { passive: false });
    document.addEventListener('touchmove',   this.onMove,  { passive: false });
    document.addEventListener('touchend',    this.onEnd);
    document.addEventListener('touchcancel', this.onEnd);

    this.applyVisual();
  }

  private onStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (this.touchId !== null) return;
    const t = e.changedTouches[0];
    this.touchId = t.identifier;
    this.trackRect = this.track.getBoundingClientRect();
    this.updateFromTouch(t.clientY);
  };

  private onMove = (e: TouchEvent): void => {
    if (this.touchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.touchId) {
        e.preventDefault();
        this.updateFromTouch(t.clientY);
        return;
      }
    }
  };

  private onEnd = (e: TouchEvent): void => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.touchId) {
        this.touchId = null;
        this.trackRect = null;
        return;
      }
    }
  };

  private updateFromTouch(clientY: number): void {
    if (!this.trackRect) return;
    const rel = (this.trackRect.bottom - clientY) / this.trackRect.height;
    this.value = clamp01(rel);
    this.applyVisual();
  }

  private applyVisual(): void {
    const pct = this.value * 100;
    this.fill.style.height   = `${pct}%`;
    this.handle.style.bottom = `${pct}%`;

    const isAB = this.value > 0.92;
    this.zone.classList.toggle('afterburner', isAB);
    this.pctLabel.textContent = isAB ? 'AB' : `${Math.round(pct)}%`;
  }

  get throttle(): number { return this.value; }
  set throttle(v: number) { this.value = clamp01(v); this.applyVisual(); }

  destroy(): void {
    this.track.removeEventListener('touchstart', this.onStart);
    document.removeEventListener('touchmove',  this.onMove);
    document.removeEventListener('touchend',   this.onEnd);
    document.removeEventListener('touchcancel', this.onEnd);
  }
}
