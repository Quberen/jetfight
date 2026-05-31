export class AltitudeIndicator {
  private strip: HTMLElement;
  private valueEl: HTMLElement;
  private tapeEl: HTMLElement;
  private lastAlt = -1;
  private readonly TICK_PX = 18;

  constructor() {
    this.strip   = document.getElementById('altitude-strip')!;
    this.valueEl = document.getElementById('altitude-value')!;
    this.tapeEl  = document.getElementById('altitude-tape')!;
    this.buildStrip();
  }

  private buildStrip(): void {
    const ticks: string[] = [];
    for (let v = 12000; v >= 0; v -= 100) {
      const major = v % 500 === 0;
      ticks.push(
        `<div class="tick${major ? ' major' : ''}">${major ? v : ''}</div>`
      );
    }
    this.strip.innerHTML = ticks.join('');
  }

  update(altitude: number): void {
    const a = Math.round(altitude / 10) * 10;
    if (a === this.lastAlt) return;
    this.lastAlt = a;

    const offset = (a / 100) * this.TICK_PX;
    this.strip.style.transform = `translateY(${offset - 60}px)`;
    this.valueEl.textContent = String(Math.round(altitude));

    // Warn below 300m
    this.tapeEl.classList.toggle('altitude-warn', altitude < 300);
  }
}
