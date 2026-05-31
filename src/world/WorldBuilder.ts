import * as THREE from 'three';
import { SkySystem } from './SkySystem.js';
import { TerrainMesh } from './TerrainMesh.js';
import { CloudLayer } from './CloudLayer.js';

export class WorldBuilder {
  readonly sky: SkySystem;
  readonly terrain: TerrainMesh;
  readonly clouds: CloudLayer;

  constructor(scene: THREE.Scene) {
    // Lighting
    const ambient = new THREE.AmbientLight(0x5577aa, 1.5);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5cc, 2.0);
    sun.position.set(1, 0.8, -1).normalize().multiplyScalar(10000);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x334488, 0.4);
    fill.position.set(-1, 0.2, 1);
    scene.add(fill);

    this.sky     = new SkySystem(scene);
    this.terrain = new TerrainMesh(scene);
    this.clouds  = new CloudLayer(scene);

    // Fog matches horizon color
    scene.fog = new THREE.FogExp2(0x5080c0, 0.000015);
  }

  update(playerPos: THREE.Vector3): void {
    this.sky.update(playerPos);
    this.clouds.update(playerPos);
  }
}
