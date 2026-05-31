import * as THREE from 'three';
import { CombatParams } from '../game/Config';
import { AircraftState } from '../flight/AircraftState';
import { bus } from '../game/EventBus';
import { EnemyAI } from './EnemyAI';
import { LockOnSystem } from './LockOnSystem';
import { MissileController } from './MissileController';
import { GunSystem } from './GunSystem';
import { AssetRegistry } from '../assets/AssetRegistry';
import { PlaceholderFactory } from '../assets/PlaceholderFactory';

export class CombatSystem {
  readonly enemyAI: EnemyAI;
  readonly lockOn: LockOnSystem;
  readonly missiles: MissileController;
  readonly gun: GunSystem;

  private scene: THREE.Scene;
  private missilesRemaining = CombatParams.missileCount;
  private score = 0;
  private kills = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.enemyAI = new EnemyAI(scene);
    this.lockOn   = new LockOnSystem();
    this.missiles = new MissileController(scene);
    this.gun      = new GunSystem(scene);
    this.bindEvents();
  }

  private bindEvents(): void {
    bus.on('enemy-hit', ({ enemyId, damage }) => {
      const killed = this.enemyAI.hitEnemy(enemyId, damage);
      if (killed) {
        this.kills++;
        this.score += 1000;
        bus.emit('score-update', { score: this.score, kills: this.kills });
      }
    });
  }

  spawnEnemies(): void {
    for (let i = 0; i < CombatParams.enemyCount; i++) {
      const angle = (i / CombatParams.enemyCount) * Math.PI * 2;
      const pos = new THREE.Vector3(
        Math.cos(angle) * 3000,
        600 + Math.random() * 400,
        Math.sin(angle) * 3000
      );
      const mesh = AssetRegistry.get('enemy_jet') ??
                   PlaceholderFactory.create('enemy_jet');
      const clone = mesh.clone();
      this.enemyAI.spawnEnemy(clone, pos);
    }
  }

  update(dt: number, playerState: AircraftState, fireMissile: boolean): void {
    const playerFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerState.quaternion);
    const living = this.enemyAI.getLivingEnemies();

    this.enemyAI.update(dt, playerState.position, playerFwd);
    this.lockOn.update(dt, playerState.position, playerFwd, living);
    this.missiles.update(dt, living);
    this.gun.update(dt, false, playerState.position, playerFwd, living);

    // Fire missile on input
    if (fireMissile && this.missilesRemaining > 0 && this.lockOn.isLocked) {
      const targetId = this.lockOn.targetId!;
      const mesh = PlaceholderFactory.create('missile');
      this.missiles.fire(
        playerState.position.clone(),
        playerFwd,
        targetId,
        mesh
      );
      this.missilesRemaining--;
    }
  }

  fireGun(dt: number, playerState: AircraftState): void {
    const playerFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerState.quaternion);
    const living = this.enemyAI.getLivingEnemies();
    this.gun.update(dt, true, playerState.position, playerFwd, living);
  }

  get missileCount(): number { return this.missilesRemaining; }
  get currentScore(): number { return this.score; }
  get killCount(): number { return this.kills; }
}
