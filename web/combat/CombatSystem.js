import * as THREE from 'three';
import { CombatParams } from '../game/Config.js';
import { bus } from '../game/EventBus.js';
import { EnemyAI } from './EnemyAI.js';
import { LockOnSystem } from './LockOnSystem.js';
import { MissileController } from './MissileController.js';
import { GunSystem } from './GunSystem.js';
import { AssetRegistry } from '../assets/AssetRegistry.js';
import { PlaceholderFactory } from '../assets/PlaceholderFactory.js';
export class CombatSystem {
    constructor(scene) {
        Object.defineProperty(this, "enemyAI", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lockOn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "missiles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gun", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "scene", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "missilesRemaining", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: CombatParams.missileCount
        });
        Object.defineProperty(this, "score", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "kills", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        this.scene = scene;
        this.enemyAI = new EnemyAI(scene);
        this.lockOn = new LockOnSystem();
        this.missiles = new MissileController(scene);
        this.gun = new GunSystem(scene);
        this.bindEvents();
    }
    bindEvents() {
        bus.on('enemy-hit', ({ enemyId, damage }) => {
            const killed = this.enemyAI.hitEnemy(enemyId, damage);
            if (killed) {
                this.kills++;
                this.score += 1000;
                bus.emit('score-update', { score: this.score, kills: this.kills });
            }
        });
    }
    spawnEnemies() {
        for (let i = 0; i < CombatParams.enemyCount; i++) {
            const angle = (i / CombatParams.enemyCount) * Math.PI * 2;
            const pos = new THREE.Vector3(Math.cos(angle) * 3000, 600 + Math.random() * 400, Math.sin(angle) * 3000);
            const mesh = AssetRegistry.get('enemy_jet') ??
                PlaceholderFactory.create('enemy_jet');
            const clone = mesh.clone();
            this.enemyAI.spawnEnemy(clone, pos);
        }
    }
    update(dt, playerState, fireMissile) {
        const playerFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerState.quaternion);
        const living = this.enemyAI.getLivingEnemies();
        this.enemyAI.update(dt, playerState.position, playerFwd);
        this.lockOn.update(dt, playerState.position, playerFwd, living);
        this.missiles.update(dt, living);
        this.gun.update(dt, false, playerState.position, playerFwd, living);
        // Fire missile on input
        if (fireMissile && this.missilesRemaining > 0 && this.lockOn.isLocked) {
            const targetId = this.lockOn.targetId;
            const mesh = PlaceholderFactory.create('missile');
            this.missiles.fire(playerState.position.clone(), playerFwd, targetId, mesh);
            this.missilesRemaining--;
        }
    }
    fireGun(dt, playerState) {
        const playerFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerState.quaternion);
        const living = this.enemyAI.getLivingEnemies();
        this.gun.update(dt, true, playerState.position, playerFwd, living);
    }
    get missileCount() { return this.missilesRemaining; }
    get currentScore() { return this.score; }
    get killCount() { return this.kills; }
}
