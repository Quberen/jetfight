import * as THREE from 'three';
import { CombatParams } from '../game/Config.js';
import { Enemy } from './EnemyAI.js';
import { bus } from '../game/EventBus.js';

const _ray = new THREE.Raycaster();
_ray.far = CombatParams.gunRange;

export class GunSystem {
  private ammo = CombatParams.gunAmmoMax;
  private cooldown = 0;
  private readonly FIRE_INTERVAL = 1 / CombatParams.gunFireRate;
  private readonly GUN_RANGE = CombatParams.gunRange;

  // Tracer bullets (visual only)
  private tracers: Array<{ mesh: THREE.Line; life: number }> = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  update(
    dt: number,
    firing: boolean,
    playerPos: THREE.Vector3,
    playerFwd: THREE.Vector3,
    enemies: Enemy[]
  ): void {
    this.cooldown -= dt;

    if (firing && this.ammo > 0 && this.cooldown <= 0) {
      this.fire(playerPos, playerFwd, enemies);
      this.cooldown = this.FIRE_INTERVAL;
      this.ammo--;
    }

    // Update tracer visuals
    const dead: typeof this.tracers = [];
    for (const t of this.tracers) {
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.mesh);
        dead.push(t);
      } else {
        const mat = t.mesh.material as THREE.LineBasicMaterial;
        mat.opacity = t.life / 0.1;
      }
    }
    for (const t of dead) this.tracers.splice(this.tracers.indexOf(t), 1);
  }

  private fire(origin: THREE.Vector3, fwd: THREE.Vector3, enemies: Enemy[]): void {
    // Small spread for realism
    const spread = 0.008;
    const dir = fwd.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    )).normalize();

    // Raycast against enemy bounding spheres
    _ray.set(origin, dir);
    let hit: Enemy | null = null;
    let minDist: number = this.GUN_RANGE;

    for (const e of enemies) {
      if (e.isDead) continue;
      const intersects = _ray.intersectObject(e.mesh, true);
      if (intersects.length > 0 && intersects[0].distance < minDist) {
        minDist = intersects[0].distance as number;
        hit = e;
      }
    }

    if (hit) {
      const dmg = CombatParams.gunDamage * (0.85 + Math.random() * 0.3);
      bus.emit('enemy-hit', { enemyId: hit.id, damage: dmg });
      const hitPoint = origin.clone().addScaledVector(dir, minDist);
      bus.emit('player-hit', { damage: 0, hitPoint }); // reuse event for spark trigger
    }

    // Spawn tracer
    this.spawnTracer(origin, dir, minDist);
  }

  private spawnTracer(origin: THREE.Vector3, dir: THREE.Vector3, length: number): void {
    const end = origin.clone().addScaledVector(dir, Math.min(length, 400));
    const geo = new THREE.BufferGeometry().setFromPoints([origin.clone(), end]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 1,
    });
    const line = new THREE.Line(geo, mat);
    line.frustumCulled = false;
    this.scene.add(line);
    this.tracers.push({ mesh: line, life: 0.1 });
  }

  get currentAmmo(): number { return this.ammo; }
  get maxAmmo(): number { return CombatParams.gunAmmoMax; }
}
