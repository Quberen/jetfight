export class AltitudeIndicator {
    constructor() {
        Object.defineProperty(this, "strip", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "valueEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tapeEl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastAlt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
        Object.defineProperty(this, "TICK_PX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 18
        });
        this.strip = document.getElementById('altitude-strip');
        this.valueEl = document.getElementById('altitude-value');
        this.tapeEl = document.getElementById('altitude-tape');
        this.buildStrip();
    }
    buildStrip() {
        const ticks = [];
        for (let v = 12000; v >= 0; v -= 100) {
            const major = v % 500 === 0;
            ticks.push(`<div class="tick${major ? ' major' : ''}">${major ? v : ''}</div>`);
        }
        this.strip.innerHTML = ticks.join('');
    }
    update(altitude) {
        const a = Math.round(altitude / 10) * 10;
        if (a === this.lastAlt)
            return;
        this.lastAlt = a;
        const offset = (a / 100) * this.TICK_PX;
        this.strip.style.transform = `translateY(${offset - 60}px)`;
        this.valueEl.textContent = String(Math.round(altitude));
        // Warn below 300m
        this.tapeEl.classList.toggle('altitude-warn', altitude < 300);
    }
}
