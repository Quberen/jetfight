// Scrolling vertical tape speed indicator
export class SpeedIndicator {
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
        Object.defineProperty(this, "lastSpeed", {
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
        }); // pixels per 10 m/s
        Object.defineProperty(this, "RANGE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 20
        }); // ticks visible above/below cursor
        this.strip = document.getElementById('speed-strip');
        this.valueEl = document.getElementById('speed-value');
        this.tapeEl = document.getElementById('speed-tape');
        this.buildStrip();
    }
    buildStrip() {
        const ticks = [];
        for (let v = 600; v >= 0; v -= 10) {
            const major = v % 50 === 0;
            ticks.push(`<div class="tick${major ? ' major' : ''}">${major ? v : ''}</div>`);
        }
        this.strip.innerHTML = ticks.join('');
    }
    update(speed) {
        const s = Math.round(speed);
        if (s === this.lastSpeed)
            return;
        this.lastSpeed = s;
        // Scroll: 0 m/s at bottom, higher speeds scroll strip up
        const offset = (s / 10) * this.TICK_PX;
        this.strip.style.transform = `translateY(${offset - 60}px)`;
        this.valueEl.textContent = String(s);
    }
}
