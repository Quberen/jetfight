import * as THREE from 'three';
export class ArtificialHorizon {
    constructor() {
        Object.defineProperty(this, "group", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pitchLadder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "PITCH_SCALE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1.8
        }); // px per degree
        this.group = document.getElementById('horizon-group');
        this.pitchLadder = document.getElementById('pitch-ladder');
        this.buildPitchLadder();
    }
    buildPitchLadder() {
        const svgNS = 'http://www.w3.org/2000/svg';
        const lines = [];
        for (let deg = -30; deg <= 30; deg += 5) {
            if (deg === 0)
                continue;
            const y = -deg * this.PITCH_SCALE;
            const major = deg % 10 === 0;
            const w = major ? 30 : 16;
            const label = major ? `${deg}` : '';
            lines.push(`<line x1="${-w}" y1="${y}" x2="${w}" y2="${y}" ` +
                `stroke="rgba(0,255,136,${major ? 0.6 : 0.3})" stroke-width="${major ? 0.8 : 0.5}"/>` +
                (label ? `<text x="${w + 3}" y="${y + 2}" font-size="4" fill="rgba(0,255,136,0.5)">${label}</text>` : ''));
        }
        this.pitchLadder.innerHTML = lines.join('');
    }
    update(euler) {
        // euler order YXZ: x=pitch, z=roll
        const pitchDeg = THREE.MathUtils.radToDeg(euler.x);
        const rollDeg = THREE.MathUtils.radToDeg(euler.z);
        const pitchOffset = pitchDeg * this.PITCH_SCALE;
        this.group.setAttribute('transform', `rotate(${rollDeg}) translate(0, ${pitchOffset})`);
    }
}
