import { clamp01 } from '../utils/MathUtils.js';
export class ThrottleController {
    constructor(trackEl, fillEl, handleEl, pctLabel, zone) {
        Object.defineProperty(this, "track", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fill", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "handle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pctLabel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zone", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.6
        });
        Object.defineProperty(this, "touchId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "trackRect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "onStart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                e.preventDefault();
                if (this.touchId !== null)
                    return;
                const t = e.changedTouches[0];
                this.touchId = t.identifier;
                this.trackRect = this.track.getBoundingClientRect();
                this.updateFromTouch(t.clientY);
            }
        });
        Object.defineProperty(this, "onMove", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                if (this.touchId === null)
                    return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.identifier === this.touchId) {
                        e.preventDefault();
                        this.updateFromTouch(t.clientY);
                        return;
                    }
                }
            }
        });
        Object.defineProperty(this, "onEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.touchId) {
                        this.touchId = null;
                        this.trackRect = null;
                        return;
                    }
                }
            }
        });
        this.track = trackEl;
        this.fill = fillEl;
        this.handle = handleEl;
        this.pctLabel = pctLabel;
        this.zone = zone;
        this.track.addEventListener('touchstart', this.onStart, { passive: false });
        document.addEventListener('touchmove', this.onMove, { passive: false });
        document.addEventListener('touchend', this.onEnd);
        document.addEventListener('touchcancel', this.onEnd);
        this.applyVisual();
    }
    updateFromTouch(clientY) {
        if (!this.trackRect)
            return;
        const rel = (this.trackRect.bottom - clientY) / this.trackRect.height;
        this.value = clamp01(rel);
        this.applyVisual();
    }
    applyVisual() {
        const pct = this.value * 100;
        this.fill.style.height = `${pct}%`;
        this.handle.style.bottom = `${pct}%`;
        const isAB = this.value > 0.92;
        this.zone.classList.toggle('afterburner', isAB);
        this.pctLabel.textContent = isAB ? 'AB' : `${Math.round(pct)}%`;
    }
    get throttle() { return this.value; }
    set throttle(v) { this.value = clamp01(v); this.applyVisual(); }
    destroy() {
        this.track.removeEventListener('touchstart', this.onStart);
        document.removeEventListener('touchmove', this.onMove);
        document.removeEventListener('touchend', this.onEnd);
        document.removeEventListener('touchcancel', this.onEnd);
    }
}
