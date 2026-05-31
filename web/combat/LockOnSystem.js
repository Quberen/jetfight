import * as THREE from 'three';
import { CombatParams } from '../game/Config.js';
import { bus } from '../game/EventBus.js';
import { clamp01 } from '../utils/MathUtils.js';
const _toEnemy = new THREE.Vector3();
export class LockOnSystem {
    constructor() {
        Object.defineProperty(this, "lockedId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "progress", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    update(dt, playerPos, playerFwd, enemies) {
        const candidate = this.findBestTarget(playerPos, playerFwd, enemies);
        if (candidate !== null && candidate.id === this.lockedId) {
            // Building lock on same target
            const angle = this.getAngleToTarget(playerPos, playerFwd, candidate);
            const centerFactor = 1 - clamp01(angle / CombatParams.lockOnConeAngle);
            this.progress += dt * (0.35 + centerFactor * 0.65) / CombatParams.lockOnTime;
            this.progress = clamp01(this.progress);
            bus.emit('lock-progress', { enemyId: candidate.id, progress: this.progress });
            if (this.progress >= 1.0) {
                bus.emit('lock-achieved', { enemyId: candidate.id });
            }
        }
        else {
            // Target changed or left cone — break lock faster than it builds
            this.progress = Math.max(0, this.progress - dt * CombatParams.lockBreakSpeed / CombatParams.lockOnTime);
            this.lockedId = candidate?.id ?? null;
            if (this.progress <= 0 && this.lockedId !== null) {
                bus.emit('lock-broken');
            }
        }
    }
    findBestTarget(playerPos, playerFwd, enemies) {
        let bestScore = -1;
        let best = null;
        const cosMax = Math.cos(CombatParams.lockOnConeAngle * Math.PI / 180);
        for (const e of enemies) {
            if (e.isDead)
                continue;
            _toEnemy.copy(e.position).sub(playerPos);
            const dist = _toEnemy.length();
            if (dist > CombatParams.lockOnRange)
                continue;
            _toEnemy.normalize();
            const dot = _toEnemy.dot(playerFwd);
            if (dot < cosMax)
                continue;
            // Score: closer + more centered = better
            const score = dot - dist / CombatParams.lockOnRange * 0.3;
            if (score > bestScore) {
                bestScore = score;
                best = e;
            }
        }
        return best;
    }
    getAngleToTarget(pos, fwd, e) {
        _toEnemy.copy(e.position).sub(pos).normalize();
        return Math.acos(Math.max(-1, Math.min(1, _toEnemy.dot(fwd)))) * 180 / Math.PI;
    }
    get isLocked() { return this.progress >= 1.0; }
    get lockProgress() { return this.progress; }
    get targetId() { return this.lockedId; }
    reset() {
        this.lockedId = null;
        this.progress = 0;
    }
}
