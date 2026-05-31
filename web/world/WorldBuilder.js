import * as THREE from 'three';
import { SkySystem } from './SkySystem.js';
import { TerrainMesh } from './TerrainMesh.js';
export class WorldBuilder {
    constructor(scene) {
        Object.defineProperty(this, "sky", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "terrain", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Lighting
        const ambient = new THREE.AmbientLight(0x334455, 1.2);
        scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xfff5cc, 2.0);
        sun.position.set(1, 0.8, -1).normalize().multiplyScalar(10000);
        scene.add(sun);
        const fill = new THREE.DirectionalLight(0x334488, 0.4);
        fill.position.set(-1, 0.2, 1);
        scene.add(fill);
        this.sky = new SkySystem(scene);
        this.terrain = new TerrainMesh(scene);
        // Fog for depth
        scene.fog = new THREE.FogExp2(0x1a2a3a, 0.000012);
    }
    update(playerPos) {
        this.sky.update(playerPos);
    }
}
