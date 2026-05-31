import * as THREE from 'three';
import { GameLoop } from './GameLoop.js';
import { GameState } from './GameState.js';
import { bus } from './EventBus.js';
import { FlightModel } from '../flight/FlightModel.js';
import { CameraRig } from '../flight/CameraRig.js';
import { createAircraftState } from '../flight/AircraftState.js';
import { InputManager } from '../input/InputManager.js';
import { WorldBuilder } from '../world/WorldBuilder.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { HUD } from '../ui/HUD.js';
import { ScreenShake } from '../effects/ScreenShake.js';
import { DamageFlash } from '../effects/DamageFlash.js';
import { GForceEffect } from '../effects/GForceEffect.js';
import { ContrailSystem } from '../effects/ContrailSystem.js';
import { ExplosionEffect } from '../effects/ExplosionEffect.js';
import { HitSparkEffect } from '../effects/HitSparkEffect.js';
import { AssetRegistry } from '../assets/AssetRegistry.js';
import { PlaceholderFactory } from '../assets/PlaceholderFactory.js';
import { CombatParams, EffectParams } from './Config.js';
import { clamp01 } from '../utils/MathUtils.js';
export class Game {
    constructor(canvas) {
        Object.defineProperty(this, "renderer", {
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
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "loop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "flightModel", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cameraRig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerState", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "playerMesh", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "input", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "world", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "combat", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "hud", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "screenShake", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "damageFlash", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "gforceEffect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "contrails", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "explosions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sparks", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: GameState.Loading
        });
        Object.defineProperty(this, "kills", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "score", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // ── Renderer ──
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            powerPreference: 'high-performance',
            precision: 'mediump',
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        // ── Scene / Camera ──
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 60000);
        // ── Systems ──
        this.world = new WorldBuilder(this.scene);
        this.flightModel = new FlightModel();
        this.playerState = createAircraftState(new THREE.Vector3(0, 800, 0));
        this.cameraRig = new CameraRig(this.camera);
        this.input = new InputManager();
        this.combat = new CombatSystem(this.scene);
        // ── Player mesh ──
        const playerTemplate = AssetRegistry.get('player_jet') ?? PlaceholderFactory.create('player_jet');
        this.playerMesh = playerTemplate.clone();
        this.scene.add(this.playerMesh);
        // ── Effects ──
        this.screenShake = new ScreenShake();
        this.damageFlash = new DamageFlash();
        this.gforceEffect = new GForceEffect();
        this.contrails = new ContrailSystem(this.scene);
        this.explosions = new ExplosionEffect(this.scene);
        this.sparks = new HitSparkEffect(this.scene);
        // ── HUD ──
        this.hud = new HUD();
        this.hud.buildMissilePips(CombatParams.missileCount);
        // ── Spawn enemies ──
        this.combat.spawnEnemies();
        // ── Game Loop ──
        this.loop = new GameLoop((dt) => this.physicsUpdate(dt), (alpha) => this.renderFrame(alpha));
        this.bindEvents();
        this.bindUI();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }
    bindEvents() {
        bus.on('player-hit', ({ damage, hitPoint }) => {
            if (damage <= 0) {
                // Gun spark only
                this.sparks.spawn(hitPoint, new THREE.Vector3(0, 1, 0));
                return;
            }
            this.playerState.hp -= damage;
            this.screenShake.trigger(damage > 50
                ? EffectParams.screenShakeMissileHit
                : EffectParams.screenShakeHit);
            this.damageFlash.trigger(damage / 100);
            this.damageFlash.setLowHealthVignette(clamp01(this.playerState.hp / this.playerState.maxHp));
            if (this.playerState.hp <= 0 && !this.playerState.isDead) {
                this.playerState.isDead = true;
                this.explosions.spawn(this.playerState.position.clone(), true);
                bus.emit('player-destroyed');
                setTimeout(() => this.showGameOver(), 2000);
            }
        });
        bus.on('enemy-destroyed', ({ position }) => {
            this.explosions.spawn(position, true);
            this.screenShake.trigger(EffectParams.screenShakeNearMiss);
        });
        bus.on('enemy-hit', ({ damage }) => {
            // Small shake for feedback
            this.screenShake.trigger(0.06);
        });
        bus.on('score-update', ({ score, kills }) => {
            this.score = score;
            this.kills = kills;
            if (this.combat.enemyAI.getLivingEnemies().length === 0) {
                setTimeout(() => this.showVictory(), 1500);
            }
        });
    }
    bindUI() {
        document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());
        document.getElementById('btn-resume')?.addEventListener('click', () => this.resume());
        document.getElementById('btn-retry')?.addEventListener('click', () => location.reload());
        document.getElementById('btn-quit')?.addEventListener('click', () => location.reload());
        document.getElementById('btn-settings')?.addEventListener('click', () => {
            document.getElementById('pause-menu').classList.add('hidden');
            document.getElementById('settings-panel').classList.remove('hidden');
        });
        document.getElementById('btn-settings-back')?.addEventListener('click', () => {
            document.getElementById('settings-panel').classList.add('hidden');
            document.getElementById('pause-menu').classList.remove('hidden');
        });
        // Settings controls
        document.getElementById('sensitivity-slider')?.addEventListener('input', (e) => {
            const v = parseInt(e.target.value);
            document.getElementById('sensitivity-value').textContent = `${v}%`;
            this.input.setSensitivity(v);
        });
        document.getElementById('toggle-invert')?.addEventListener('click', (e) => {
            const btn = e.target;
            const on = btn.textContent === 'OFF';
            btn.textContent = on ? 'ON' : 'OFF';
            btn.classList.toggle('active', on);
            this.input.setInvertPitch(on);
        });
        const qualityHandler = (high) => {
            document.getElementById('quality-medium')?.classList.toggle('active', !high);
            document.getElementById('quality-high')?.classList.toggle('active', high);
        };
        document.getElementById('quality-medium')?.addEventListener('click', () => qualityHandler(false));
        document.getElementById('quality-high')?.addEventListener('click', () => qualityHandler(true));
        ['mode-joystick', 'mode-gyro', 'mode-hybrid'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => {
                const mode = id.replace('mode-', '');
                this.input.setMode(mode);
            });
        });
    }
    physicsUpdate(dt) {
        if (this.state !== GameState.Playing)
            return;
        const inputData = this.input.update(dt);
        this.flightModel.update(this.playerState, inputData, dt);
        // Gun fires if holding gun button
        if (inputData.fire) {
            this.combat.fireGun(dt, this.playerState);
        }
        this.combat.update(dt, this.playerState, inputData.missile);
        // Adapt quality based on frame time
        this.adaptQuality();
    }
    renderFrame(alpha) {
        if (this.state === GameState.Loading)
            return;
        this.screenShake.update(1 / 60);
        this.damageFlash.update(1 / 60);
        this.gforceEffect.update(this.playerState.gForce, 1 / 60);
        // Attach shake offset to camera rig
        this.cameraRig.shake.copy(this.screenShake.offset);
        this.cameraRig.update(this.playerState, 1 / 60);
        // Sync player mesh
        this.playerMesh.position.copy(this.playerState.position);
        this.playerMesh.quaternion.copy(this.playerState.quaternion);
        // Effects
        this.contrails.update(this.playerState, 1 / 60);
        this.explosions.update(1 / 60);
        this.sparks.update(1 / 60);
        // World
        this.world.update(this.playerState.position);
        // HUD
        this.hud.update(1 / 60, this.playerState, this.combat, this.camera, this.renderer);
        this.renderer.render(this.scene, this.camera);
    }
    adaptQuality() {
        if (this.loop.avgFrameTime > 0.022) {
            // Frame time > 22ms → disable expensive features
            this.renderer.setPixelRatio(1);
        }
    }
    start() {
        this.state = GameState.Playing;
        this.loop.start();
    }
    togglePause() {
        if (this.state === GameState.Playing) {
            this.state = GameState.Paused;
            document.getElementById('pause-menu').classList.remove('hidden');
        }
        else if (this.state === GameState.Paused) {
            this.resume();
        }
    }
    resume() {
        this.state = GameState.Playing;
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('settings-panel').classList.add('hidden');
    }
    showGameOver() {
        this.state = GameState.GameOver;
        document.getElementById('final-score').textContent = `SCORE: ${this.score}`;
        document.getElementById('kills-display').textContent = `KILLS: ${this.kills}`;
        document.getElementById('game-over').classList.remove('hidden');
    }
    showVictory() {
        this.state = GameState.GameOver;
        const panel = document.getElementById('game-over');
        panel.querySelector('.menu-title').textContent = 'MISSION COMPLETE';
        panel.querySelector('.menu-title').classList.remove('red');
        document.getElementById('final-score').textContent = `SCORE: ${this.score}`;
        document.getElementById('kills-display').textContent = `KILLS: ${this.kills}`;
        panel.classList.remove('hidden');
    }
    handleResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
}
