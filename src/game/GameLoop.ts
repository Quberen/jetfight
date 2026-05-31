const FIXED_DT = 1 / 60;
const MAX_FRAME_TIME = 0.1;

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;

  private onPhysics: (dt: number) => void;
  private onRender: (alpha: number) => void;

  // Rolling frame time average for adaptive quality
  private frameTimes: number[] = [];
  avgFrameTime = 0;

  constructor(onPhysics: (dt: number) => void, onRender: (alpha: number) => void) {
    this.onPhysics = onPhysics;
    this.onRender = onRender;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);

    const frameTime = Math.min((timestamp - this.lastTime) / 1000, MAX_FRAME_TIME);
    this.lastTime = timestamp;

    // Track rolling average frame time (last 30 frames)
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > 30) this.frameTimes.shift();
    this.avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;

    this.accumulator += frameTime;

    while (this.accumulator >= FIXED_DT) {
      this.onPhysics(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }

    const alpha = this.accumulator / FIXED_DT;
    this.onRender(alpha);
  };
}
