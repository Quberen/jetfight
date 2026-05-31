// Custom virtual joystick — no external deps, full control over feel
import { clamp } from '../utils/MathUtils.js';
export class JoystickController {
    constructor(baseEl, knobEl, radius = 50) {
        Object.defineProperty(this, "base", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "knob", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "radius", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "touch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "_output", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: { x: 0, y: 0, active: false }
        });
        // Return-to-center spring
        Object.defineProperty(this, "targetX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "targetY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "currentX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "currentY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "onTouchStart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                e.preventDefault();
                if (this.touch !== null)
                    return; // only one finger on stick
                const t = e.changedTouches[0];
                const rect = this.base.getBoundingClientRect();
                this.touch = {
                    id: t.identifier,
                    startX: rect.left + rect.width / 2,
                    startY: rect.top + rect.height / 2,
                    curX: t.clientX,
                    curY: t.clientY,
                };
                this.base.classList.add('active');
                this._output.active = true;
            }
        });
        Object.defineProperty(this, "onTouchMove", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                if (!this.touch)
                    return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    if (t.identifier !== this.touch.id)
                        continue;
                    this.touch.curX = t.clientX;
                    this.touch.curY = t.clientY;
                    e.preventDefault();
                }
            }
        });
        Object.defineProperty(this, "onTouchEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (e) => {
                if (!this.touch)
                    return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.touch.id) {
                        this.touch = null;
                        this.targetX = 0;
                        this.targetY = 0;
                        this._output.active = false;
                        this.base.classList.remove('active');
                        return;
                    }
                }
            }
        });
        this.base = baseEl;
        this.knob = knobEl;
        this.radius = radius;
        this.bind();
    }
    bind() {
        this.base.addEventListener('touchstart', this.onTouchStart, { passive: false });
        document.addEventListener('touchmove', this.onTouchMove, { passive: false });
        document.addEventListener('touchend', this.onTouchEnd);
        document.addEventListener('touchcancel', this.onTouchEnd);
    }
    update(dt) {
        if (this.touch) {
            const dx = this.touch.curX - this.touch.startX;
            const dy = this.touch.curY - this.touch.startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const scale = dist > this.radius ? this.radius / dist : 1;
            this.targetX = clamp(dx * scale / this.radius, -1, 1);
            this.targetY = clamp(dy * scale / this.radius, -1, 1);
        }
        else {
            this.targetX = 0;
            this.targetY = 0;
        }
        // Smooth spring return
        const spring = this.touch ? 1.0 : Math.min(1, dt * 20);
        this.currentX += (this.targetX - this.currentX) * spring;
        this.currentY += (this.targetY - this.currentY) * spring;
        this._output.x = this.currentX;
        this._output.y = this.currentY;
        // Move knob visual
        const px = this.currentX * this.radius;
        const py = this.currentY * this.radius;
        this.knob.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
    }
    get output() { return this._output; }
    destroy() {
        this.base.removeEventListener('touchstart', this.onTouchStart);
        document.removeEventListener('touchmove', this.onTouchMove);
        document.removeEventListener('touchend', this.onTouchEnd);
        document.removeEventListener('touchcancel', this.onTouchEnd);
    }
}
