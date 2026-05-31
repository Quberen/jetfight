import * as THREE from 'three';
import { CombatParams } from '../game/Config';
import { bus } from '../game/EventBus';

export interface Enemy {
  id: number;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  airspeed: number;
  pitchRate: number;
  rollRate: number;
  yawRate: number;
  hp: number;
  isDead: boolean;
  state: EnemyState;
  stateTimer: number;
  aggroRange: number;
  attackRange: number;
}

type EnemyState = 'patrol' | 'engage' | 'attack' | 'evade' | 'flee';

const _toTarget = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _up  = new THREE.Vector3();
const _worldY = new THREE.Vector3(0, 1, 0);
const _qPitch = new THREE.Quaternion();
const _qRoll  = new THREE.Quaternion();
const _qYaw   = new THREE.Quaternion();
const _localX = new THREE.Vector3();
const _localZ = new THREE.Vector3();

const PATROL_RADIUS = 2000;
const ENGAGE_RANGE  = 8000;
const ATTACK_RANGE  = 3000;
const FLEE_HP       = 0.2;
const EVADE_DURATION= 5;

export class EnemyAI {
  private enemies: Enemy[] = [];
  private nextId = 0;
  private scene: THREE.Scene;
  private patrolAngle = 0;
  private evadeTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnEnemy(mesh: THREE.Object3D, position: THREE.Vector3): Enemy {
    mesh.position.copy(position);
    this.scene.add(mesh);
    const e: Enemy = {
      id: this.nextId++,
      mesh,
      position: position.clone(),
      quaternion: new THREE.Quaternion(),
      velocity: new THREE.Vector3(0, 0, -180),
      airspeed: 180,
      pitchRate: 0,
      rollRate: 0,
      yawRate: 0,
      hp: CombatParams.enemyHp,
      isDead: false,
      state: 'patrol',
      stateTimer: 0,
      aggroRange: ENGAGE_RANGE,
      attackRange: ATTACK_RANGE,
    };
    this.enemies.push(e);
    return e;
  }

  update(dt: number, playerPos: THREE.Vector3, playerFwd: THREE.Vector3): void {
    for (const e of this.enemies) {
      if (e.isDead) continue;
      this.updateEnemy(e, dt, playerPos, playerFwd);
    }
  }

  private updateEnemy(e: Enemy, dt: number, playerPos: THREE.Vector3, playerFwd: THREE.Vector3): void {
    e.stateTimer -= dt;

    _toTarget.copy(playerPos).sub(e.position);
    const dist = _toTarget.length();
    _fwd.set(0, 0, -1).applyQuaternion(e.quaternion);

    // State transitions
    switch (e.state) {
      case 'patrol':
        if (dist < e.aggroRange) e.state = 'engage';
        break;
      case 'engage':
        if (dist < e.attackRange) e.state = 'attack';
        if (dist > e.aggroRange * 1.5) e.state = 'patrol';
        break;
      case 'attack':
        if (dist > e.attackRange * 1.5) e.state = 'engage';
        if (e.hp / CombatParams.enemyHp < FLEE_HP) e.state = 'flee';
        break;
      case 'evade':
        if (e.stateTimer <= 0) e.state = 'engage';
        break;
      case 'flee':
        // Keep fleeing
        break;
    }

    // Compute AI inputs based on state
    let targetPitch = 0;
    let targetRoll  = 0;
    let targetYaw   = 0;
    let targetSpeed = 180;

    switch (e.state) {
      case 'patrol': {
        this.patrolAngle += dt * 0.2;
        const px = Math.cos(this.patrolAngle) * PATROL_RADIUS;
        const pz = Math.sin(this.patrolAngle) * PATROL_RADIUS;
        const wp = new THREE.Vector3(px, 800, pz);
        this.steerToward(e, wp, dt);
        targetSpeed = 160;
        break;
      }
      case 'engage':
      case 'attack': {
        this.steerToward(e, playerPos, dt);
        targetSpeed = e.state === 'attack' ? 200 : 220;
        break;
      }
      case 'evade': {
        // Hard break: full roll + high-G turn perpendicular to threat
        const breakDir = new THREE.Vector3().crossVectors(_fwd, _worldY).normalize();
        const evadeTarget = e.position.clone().addScaledVector(breakDir, 3000);
        this.steerToward(e, evadeTarget, dt);
        targetSpeed = 280;
        break;
      }
      case 'flee': {
        // Full speed away from player
        const awayDir = e.position.clone().sub(playerPos).normalize();
        const fleeTarget = e.position.clone().addScaledVector(awayDir, 5000);
        this.steerToward(e, fleeTarget, dt);
        targetSpeed = 320;
        break;
      }
    }

    // Speed integration
    e.airspeed += (targetSpeed - e.airspeed) * Math.min(1, dt * 0.8);

    // Update position via forward velocity
    _fwd.set(0, 0, -1).applyQuaternion(e.quaternion);
    e.velocity.copy(_fwd).multiplyScalar(e.airspeed);
    e.position.addScaledVector(e.velocity, dt);

    // Ground clamp
    if (e.position.y < 200) e.position.y = 200;

    // Sync mesh
    e.mesh.position.copy(e.position);
    e.mesh.quaternion.copy(e.quaternion);
  }

  private steerToward(e: Enemy, target: THREE.Vector3, dt: number): void {
    _fwd.set(0, 0, -1).applyQuaternion(e.quaternion);
    _up.set(0, 1, 0).applyQuaternion(e.quaternion);
    _toTarget.copy(target).sub(e.position).normalize();

    // Angular error between forward and target
    const pitchError = _toTarget.dot(_up) - 0;
    const yawDot = _toTarget.dot(_fwd);

    // Roll toward target using cross product
    const cross = new THREE.Vector3().crossVectors(_fwd, _toTarget);
    const rollError = cross.dot(_worldY);

    const kP = 1.5;
    e.pitchRate += (-pitchError * kP - e.pitchRate) * Math.min(1, dt * 4);
    e.rollRate  += (rollError  * kP - e.rollRate)  * Math.min(1, dt * 4);
    e.yawRate    = -Math.sin(this.getBankAngle(e)) * 1.0;

    // Clamp
    e.pitchRate = Math.max(-1.5, Math.min(1.5, e.pitchRate));
    e.rollRate  = Math.max(-2.0, Math.min(2.0, e.rollRate));

    // Apply rotations
    _localX.set(1, 0, 0).applyQuaternion(e.quaternion);
    _localZ.set(0, 0, 1).applyQuaternion(e.quaternion);
    _qYaw.setFromAxisAngle(_worldY, e.yawRate * dt);
    _qPitch.setFromAxisAngle(_localX, e.pitchRate * dt);
    _qRoll.setFromAxisAngle(_localZ,  e.rollRate  * dt);
    e.quaternion.premultiply(_qYaw).multiply(_qPitch).multiply(_qRoll).normalize();
  }

  private getBankAngle(e: Enemy): number {
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(e.quaternion);
    return Math.asin(right.y);
  }

  triggerEvade(enemyId: number): void {
    const e = this.enemies.find(en => en.id === enemyId);
    if (e && e.state !== 'flee') {
      e.state = 'evade';
      e.stateTimer = EVADE_DURATION;
    }
  }

  hitEnemy(enemyId: number, damage: number): boolean {
    const e = this.enemies.find(en => en.id === enemyId);
    if (!e || e.isDead) return false;
    e.hp -= damage;
    bus.emit('enemy-hit', { enemyId, damage });
    if (e.hp <= 0) {
      e.isDead = true;
      e.mesh.visible = false;
      bus.emit('enemy-destroyed', { enemyId, position: e.position.clone() });
      return true;
    }
    return false;
  }

  getEnemies(): Enemy[] { return this.enemies; }

  getLivingEnemies(): Enemy[] { return this.enemies.filter(e => !e.isDead); }
}
