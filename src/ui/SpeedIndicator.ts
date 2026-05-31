// Scrolling vertical tape speed indicator
export class SpeedIndicator {
  private strip: HTMLElement;
  private valueEl: HTMLElement;
  private tapeEl: HTMLElement;
  private lastSpeed = -1;
  private readonly TICK_PX = 18;   // pixels per 10 m/s
  private readonly RANGE   = 20;   // ticks visible above/below cursor

  constructor() {
    this.strip   = document.getElementById('speed-strip')!;
    this.valueEl = document.getElementById('speed-value')!;
    this.tapeEl  = document.getElementById('speed-tape')!;
    this.buildStrip();
  }

  private buildStrip(): void {
    const ticks: string[] = [];
    for (let v = 600; v >= 0; v -= 10) {
      const major = v % 50 === 0;
      ticks.push(
        `<div class="tick${major ? ' major' : ''}">${major ? v : ''}</div>`
      );
    }
    this.strip.innerHTML = ticks.join('');
  }

  update(speed: number): void {
    const s = Math.round(speed);
    if (s === this.lastSpeed) return;
    this.lastSpeed = s;

    // Scroll: 0 m/s at bottom, higher speeds scroll strip up
    const offset = (s / 10) * this.TICK_PX;
    this.strip.style.transform = `translateY(${offset - 60}px)`;
    this.valueEl.textContent = String(s);
  }
}
