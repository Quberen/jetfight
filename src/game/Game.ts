import * as THREE from 'three';
import { GameLoop } from './GameLoop';
import { GameState } from './GameState';
import { bus } from './EventBus';
import { FlightModel } from '../flight/FlightModel';
import { CameraRig } from '../flight/CameraRig';
import { AircraftState, createAircraftState } from '../flight/AircraftState';
import { InputManager } from '../input/InputManager';
import { WorldBuilder } from '../world/WorldBuilder';
import { CombatSystem } from '../combat/CombatSystem';
import { HUD } from '../ui/HUD';
import { ScreenShake } from '../effects/ScreenShake';
import { DamageFlash } from '../effects/DamageFlash';
import { GForceEffect } from '../effects/GForceEffect';
import { ContrailSystem } from '../effects/ContrailSystem';
import { ExplosionEffect } from '../effects/ExplosionEffect';
import { HitSparkEffect } from '../effects/HitSparkEffect';
import { AssetRegistry } from '../assets/AssetRegistry';
import { PlaceholderFactory } from '../assets/PlaceholderFactory';
import { CombatParams, EffectParams } from './Config';
import { clamp01 } from '../utils/MathUtils';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;
  private loop:     GameLoop;

  private flightModel:  FlightModel;
  private cameraRig:    CameraRig;
  private playerState:  AircraftState;
  private playerMesh:   THREE.Object3D;
  private input:        InputManager;
  private world:        WorldBuilder;
  private combat:       CombatSystem;
  private hud:          HUD;

  private screenShake:  ScreenShake;
  private damageFlash:  DamageFlash;
  private gforceEffect: GForceEffect;
  private contrails:    ContrailSystem;
  private explosions:   ExplosionEffect;
  private sparks:       HitSparkEffect;

  private state = GameState.Loading;
  private kills = 0;
  private score = 0;

  constructor(canvas: HTMLCanvasElement) {
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
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 1, 60000);

    // ── Systems ──
    this.world       = new WorldBuilder(this.scene);
    this.flightModel = new FlightModel();
    this.playerState = createAircraftState(new THREE.Vector3(0, 800, 0));
    this.cameraRig   = new CameraRig(this.camera);
    this.input       = new InputManager();
    this.combat      = new CombatSystem(this.scene);

    // ── Player mesh ──
    const playerTemplate = AssetRegistry.get('player_jet') ?? PlaceholderFactory.create('player_jet');
    this.playerMesh = playerTemplate.clone();
    this.scene.add(this.playerMesh);

    // ── Effects ──
    this.screenShake  = new ScreenShake();
    this.damageFlash  = new DamageFlash();
    this.gforceEffect = new GForceEffect();
    this.contrails    = new ContrailSystem(this.scene);
    this.explosions   = new ExplosionEffect(this.scene);
    this.sparks       = new HitSparkEffect(this.scene);

    // ── HUD ──
    this.hud = new HUD();
    this.hud.buildMissilePips(CombatParams.missileCount);

    // ── Spawn enemies ──
    this.combat.spawnEnemies();

    // ── Game Loop ──
    this.loop = new GameLoop(
      (dt) => this.physicsUpdate(dt),
      (alpha) => this.renderFrame(alpha)
    );

    this.bindEvents();
    this.bindUI();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private bindEvents(): void {
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

  private bindUI(): void {
    document.getElementById('btn-pause')?.addEventListener('click', () => this.togglePause());
    document.getElementById('btn-resume')?.addEventListener('click', () => this.resume());
    document.getElementById('btn-retry')?.addEventListener('click', () => location.reload());
    document.getElementById('btn-quit')?.addEventListener('click', () => location.reload());

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      document.getElementById('pause-menu')!.classList.add('hidden');
      document.getElementById('settings-panel')!.classList.remove('hidden');
    });
    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
      document.getElementById('settings-panel')!.classList.add('hidden');
      document.getElementById('pause-menu')!.classList.remove('hidden');
    });

    // Settings controls
    document.getElementById('sensitivity-slider')?.addEventListener('input', (e) => {
      const v = parseInt((e.target as HTMLInputElement).value);
      document.getElementById('sensitivity-value')!.textContent = `${v}%`;
      this.input.setSensitivity(v);
    });

    document.getElementById('toggle-invert')?.addEventListener('click', (e) => {
      const btn = e.target as HTMLButtonElement;
      const on = btn.textContent === 'OFF';
      btn.textContent = on ? 'ON' : 'OFF';
      btn.classList.toggle('active', on);
      this.input.setInvertPitch(on);
    });

    const qualityHandler = (high: boolean) => {
      document.getElementById('quality-medium')?.classList.toggle('active', !high);
      document.getElementById('quality-high')?.classList.toggle('active', high);
    };
    document.getElementById('quality-medium')?.addEventListener('click', () => qualityHandler(false));
    document.getElementById('quality-high')?.addEventListener('click',   () => qualityHandler(true));

    ['mode-joystick', 'mode-gyro', 'mode-hybrid'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', () => {
        const mode = id.replace('mode-', '') as any;
        this.input.setMode(mode);
      });
    });
  }

  private physicsUpdate(dt: number): void {
    if (this.state !== GameState.Playing) return;

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

  private renderFrame(alpha: number): void {
    if (this.state === GameState.Loading) return;

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

  private adaptQuality(): void {
    if (this.loop.avgFrameTime > 0.022) {
      // Frame time > 22ms → disable expensive features
      this.renderer.setPixelRatio(1);
    }
  }

  start(): void {
    this.state = GameState.Playing;
    this.loop.start();
  }

  togglePause(): void {
    if (this.state === GameState.Playing) {
      this.state = GameState.Paused;
      document.getElementById('pause-menu')!.classList.remove('hidden');
    } else if (this.state === GameState.Paused) {
      this.resume();
    }
  }

  resume(): void {
    this.state = GameState.Playing;
    document.getElementById('pause-menu')!.classList.add('hidden');
    document.getElementById('settings-panel')!.classList.add('hidden');
  }

  private showGameOver(): void {
    this.state = GameState.GameOver;
    document.getElementById('final-score')!.textContent = `SCORE: ${this.score}`;
    document.getElementById('kills-display')!.textContent = `KILLS: ${this.kills}`;
    document.getElementById('game-over')!.classList.remove('hidden');
  }

  private showVictory(): void {
    this.state = GameState.GameOver;
    const panel = document.getElementById('game-over')!;
    panel.querySelector('.menu-title')!.textContent = 'MISSION COMPLETE';
    panel.querySelector('.menu-title')!.classList.remove('red');
    document.getElementById('final-score')!.textContent = `SCORE: ${this.score}`;
    document.getElementById('kills-display')!.textContent = `KILLS: ${this.kills}`;
    panel.classList.remove('hidden');
  }

  private handleResize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
