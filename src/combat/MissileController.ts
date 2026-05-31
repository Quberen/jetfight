import * as THREE from 'three';
import { CombatParams } from '../game/Config';
import { Enemy } from './EnemyAI';
import { bus } from '../game/EventBus';

export interface Missile {
  id: number;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  prevLOS: THREE.Vector3;
  targetId: number;
  life: number;
  isDone: boolean;
}

const N = 4.0; // Navigation constant

export class MissileController {
  private missiles: Missile[] = [];
  private nextId = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  fire(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    targetId: number,
    mesh: THREE.Object3D
  ): void {
    mesh.position.copy(origin);
    this.scene.add(mesh);

    const m: Missile = {
      id: this.nextId++,
      mesh,
      position: origin.clone(),
      velocity: direction.clone().multiplyScalar(CombatParams.missileSpeed),
      prevLOS: direction.clone(),
      targetId,
      life: CombatParams.missileLifetime,
      isDone: false,
    };
    this.missiles.push(m);
    bus.emit('missile-fired', { missileId: m.id });
  }

  update(dt: number, enemies: Enemy[]): void {
    const toRemove: Missile[] = [];

    for (const m of this.missiles) {
      if (m.isDone) { toRemove.push(m); continue; }

      m.life -= dt;
      if (m.life <= 0) {
        this.destroyMissile(m);
        toRemove.push(m);
        continue;
      }

      const target = enemies.find(e => e.id === m.targetId && !e.isDead);
      if (!target) {
        // No target — fly straight
        m.position.addScaledVector(m.velocity, dt);
        m.mesh.position.copy(m.position);
        continue;
      }

      // Proportional Navigation Guidance (TPN)
      const toTarget = target.position.clone().sub(m.position);
      const dist = toTarget.length();

      if (dist < CombatParams.missileKillRadius) {
        // Direct hit
        this.destroyMissile(m);
        toRemove.push(m);
        const dmg = CombatParams.missileDamage;
        bus.emit('enemy-hit', { enemyId: target.id, damage: dmg });
        continue;
      }
      if (dist < CombatParams.missileProximityRadius) {
        // Proximity detonation — reduced damage
        this.destroyMissile(m);
        toRemove.push(m);
        const dmg = CombatParams.missileDamage * 0.5;
        bus.emit('enemy-hit', { enemyId: target.id, damage: dmg });
        continue;
      }

      const LOS = toTarget.clone().normalize();
      const LOSRate = LOS.clone().sub(m.prevLOS).divideScalar(dt);
      m.prevLOS.copy(LOS);

      // Acceleration perpendicular to missile velocity
      const accel = LOSRate.multiplyScalar(N * CombatParams.missileSpeed);
      // Clamp acceleration magnitude to max G
      const maxAccel = CombatParams.missileMaxG * 9.8;
      if (accel.length() > maxAccel) accel.setLength(maxAccel);

      m.velocity.addScaledVector(accel, dt);
      // Keep missile at fixed speed
      m.velocity.setLength(CombatParams.missileSpeed);
      m.position.addScaledVector(m.velocity, dt);

      // Orient mesh to velocity
      m.mesh.position.copy(m.position);
      m.mesh.lookAt(m.position.clone().add(m.velocity));
    }

    for (const m of toRemove) {
      this.missiles.splice(this.missiles.indexOf(m), 1);
    }
  }

  private destroyMissile(m: Missile): void {
    m.isDone = true;
    this.scene.remove(m.mesh);
  }

  getActiveMissiles(): Missile[] { return this.missiles; }
}
