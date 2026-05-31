import * as THREE from 'three';
import { SpeedIndicator } from './SpeedIndicator.js';
import { AltitudeIndicator } from './AltitudeIndicator.js';
import { HeadingCompass } from './HeadingCompass.js';
import { ArtificialHorizon } from './ArtificialHorizon.js';
import { RadarDisplay } from './RadarDisplay.js';
import { LockOnReticle } from './LockOnReticle.js';
import { AlertBanner } from './AlertBanner.js';
import { bus } from '../game/EventBus.js';
import { clamp01 } from '../utils/MathUtils.js';
const _euler = new THREE.Euler();
export class HUD {
    constructor() {
        Object.defineProperty(this, "speed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "altitude", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "compass", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "horizon", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "radar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "reticle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "alerts", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "healthFill", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gforceVal", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "missilePips", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gunCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targetInfo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targetName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targetDist", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targetHpFill", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lockProgress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "lockedEnemyId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.speed = new SpeedIndicator();
        this.altitude = new AltitudeIndicator();
        this.compass = new HeadingCompass();
        this.horizon = new ArtificialHorizon();
        this.radar = new RadarDisplay();
        this.reticle = new LockOnReticle();
        this.alerts = new AlertBanner();
        this.healthFill = document.getElementById('health-fill');
        this.gforceVal = document.getElementById('gforce-value');
        this.missilePips = document.getElementById('missile-pips');
        this.gunCount = document.getElementById('gun-count');
        this.targetInfo = document.getElementById('target-info');
        this.targetName = document.getElementById('target-name');
        this.targetDist = document.getElementById('target-distance');
        this.targetHpFill = document.getElementById('target-health-fill');
        this.bindEvents();
    }
    bindEvents() {
        bus.on('lock-progress', ({ enemyId, progress }) => {
            this.lockProgress = progress;
            this.lockedEnemyId = enemyId;
        });
        bus.on('lock-achieved', ({ enemyId }) => {
            this.alerts.show('lock', '◆ LOCKED ON ◆', 'danger', 1.0);
        });
        bus.on('lock-broken', () => {
            this.lockProgress = 0;
            this.lockedEnemyId = null;
            this.alerts.hide('lock');
        });
        bus.on('altitude-warning', ({ altitude }) => {
            this.alerts.show('altitude', '▼ PULL UP ▼', 'danger');
        });
        bus.on('player-hit', ({ damage }) => {
            if (damage > 0) {
                this.alerts.show('hit', '★ HIT ★', 'danger', 0.6);
            }
        });
    }
    buildMissilePips(count) {
        this.missilePips.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const pip = document.createElement('div');
            pip.className = 'missile-pip';
            pip.dataset.index = String(i);
            this.missilePips.appendChild(pip);
        }
    }
    update(dt, playerState, combat, camera, renderer) {
        this.alerts.update(dt);
        // ── Flight instruments ──
        this.speed.update(playerState.airspeed);
        this.altitude.update(playerState.position.y);
        _euler.setFromQuaternion(playerState.quaternion, 'YXZ');
        const headingDeg = THREE.MathUtils.radToDeg(-_euler.y);
        this.compass.update(headingDeg);
        this.horizon.update(_euler);
        // ── G-force ──
        this.gforceVal.textContent = playerState.gForce.toFixed(1);
        const gHigh = playerState.gForce > 5;
        this.gforceVal.parentElement.style.color =
            gHigh ? 'var(--hud-amber)' : 'var(--hud-dim)';
        // ── Health ──
        const hpRatio = clamp01(playerState.hp / playerState.maxHp);
        this.healthFill.style.width = `${hpRatio * 100}%`;
        this.healthFill.classList.toggle('warn', hpRatio < 0.5 && hpRatio >= 0.25);
        this.healthFill.classList.toggle('danger', hpRatio < 0.25);
        // ── Ammo ──
        this.gunCount.textContent = String(combat.gun.currentAmmo);
        const remaining = combat.missileCount;
        const pips = this.missilePips.querySelectorAll('.missile-pip');
        pips.forEach((p, i) => p.classList.toggle('spent', i >= remaining));
        // ── Altitude warning ──
        if (playerState.position.y < 250) {
            this.alerts.show('alt', '▼ PULL UP ▼', 'danger');
        }
        else {
            this.alerts.hide('alt');
        }
        // ── Radar ──
        const enemies = combat.enemyAI.getLivingEnemies();
        this.radar.update(dt, playerState.position, headingDeg, enemies);
        // ── Lock-on reticle ──
        const lockedEnemy = this.lockedEnemyId !== null
            ? enemies.find(e => e.id === this.lockedEnemyId) ?? null
            : null;
        this.reticle.updateTarget(lockedEnemy, this.lockProgress, camera, renderer);
        // ── Target info box ──
        if (lockedEnemy) {
            this.targetInfo.classList.remove('hidden');
            this.targetName.textContent = `ENEMY ${lockedEnemy.id + 1}`;
            const dist = playerState.position.distanceTo(lockedEnemy.position);
            this.targetDist.textContent = `${(dist / 1000).toFixed(1)}km`;
            const hpFrac = clamp01(lockedEnemy.hp / 100);
            this.targetHpFill.style.width = `${hpFrac * 100}%`;
        }
        else {
            this.targetInfo.classList.add('hidden');
        }
    }
}
