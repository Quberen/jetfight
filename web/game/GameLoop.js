const FIXED_DT = 1 / 60;
const MAX_FRAME_TIME = 0.1;
export class GameLoop {
    constructor(onPhysics, onRender) {
        Object.defineProperty(this, "accumulator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "lastTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "rafId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "running", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "onPhysics", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onRender", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Rolling frame time average for adaptive quality
        Object.defineProperty(this, "frameTimes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "avgFrameTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "loop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (timestamp) => {
                if (!this.running)
                    return;
                this.rafId = requestAnimationFrame(this.loop);
                const frameTime = Math.min((timestamp - this.lastTime) / 1000, MAX_FRAME_TIME);
                this.lastTime = timestamp;
                // Track rolling average frame time (last 30 frames)
                this.frameTimes.push(frameTime);
                if (this.frameTimes.length > 30)
                    this.frameTimes.shift();
                this.avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
                this.accumulator += frameTime;
                while (this.accumulator >= FIXED_DT) {
                    this.onPhysics(FIXED_DT);
                    this.accumulator -= FIXED_DT;
                }
                const alpha = this.accumulator / FIXED_DT;
                this.onRender(alpha);
            }
        });
        this.onPhysics = onPhysics;
        this.onRender = onRender;
    }
    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }
    stop() {
        this.running = false;
        cancelAnimationFrame(this.rafId);
    }
}
