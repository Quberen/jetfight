// Horizontal scrolling compass strip
export class HeadingCompass {
    constructor() {
        Object.defineProperty(this, "strip", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lastHeading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        });
        // Each degree = 2px, full 360° = 720px strip, rendered 3x for seamless wrap
        Object.defineProperty(this, "DEG_PX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 2.2
        });
        this.strip = document.getElementById('compass-strip');
        this.buildStrip();
    }
    buildStrip() {
        const labels = {
            0: 'N', 45: 'NE', 90: 'E', 135: 'SE',
            180: 'S', 225: 'SW', 270: 'W', 315: 'NW',
        };
        const ticks = [];
        // Render 3 full rotations so we can scroll infinitely
        for (let rep = 0; rep < 3; rep++) {
            for (let d = 0; d < 360; d += 5) {
                const major = d % 45 === 0;
                const label = labels[d] ?? (d % 10 === 0 ? d : '');
                ticks.push(`<span style="display:inline-block;width:${this.DEG_PX * 5}px;text-align:center;` +
                    `border-left:1px solid rgba(0,255,136,${major ? 0.6 : 0.2});` +
                    `font-size:${major ? '0.6' : '0.45'}rem;color:rgba(0,255,136,${major ? 0.9 : 0.4})` +
                    `">${major ? label : ''}</span>`);
            }
        }
        this.strip.innerHTML = ticks.join('');
    }
    update(headingDeg) {
        // Normalize to [0, 360)
        const h = ((headingDeg % 360) + 360) % 360;
        if (Math.abs(h - this.lastHeading) < 0.5)
            return;
        this.lastHeading = h;
        // Offset: center the current heading in the 260px window
        // We use the middle repetition (rep=1) as reference, offset by 360*DEG_PX
        const stripWidth = 360 * this.DEG_PX;
        const windowWidth = 260;
        const offset = -(h * this.DEG_PX) - windowWidth / 2 + stripWidth;
        this.strip.style.transform = `translateX(${offset}px)`;
    }
}
