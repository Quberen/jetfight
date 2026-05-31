import * as THREE from 'three';
import { SkySystem } from './SkySystem';
import { TerrainMesh } from './TerrainMesh';

export class WorldBuilder {
  readonly sky: SkySystem;
  readonly terrain: TerrainMesh;

  constructor(scene: THREE.Scene) {
    // Lighting
    const ambient = new THREE.AmbientLight(0x334455, 1.2);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5cc, 2.0);
    sun.position.set(1, 0.8, -1).normalize().multiplyScalar(10000);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x334488, 0.4);
    fill.position.set(-1, 0.2, 1);
    scene.add(fill);

    this.sky     = new SkySystem(scene);
    this.terrain = new TerrainMesh(scene);

    // Fog for depth
    scene.fog = new THREE.FogExp2(0x1a2a3a, 0.000012);
  }

  update(playerPos: THREE.Vector3): void {
    this.sky.update(playerPos);
  }
}
