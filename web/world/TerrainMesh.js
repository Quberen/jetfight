import * as THREE from 'three';
export class TerrainMesh {
    constructor(scene) {
        Object.defineProperty(this, "mesh", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "SIZE", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 80000
        });
        Object.defineProperty(this, "SEGMENTS", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 128
        });
        const geo = new THREE.PlaneGeometry(this.SIZE, this.SIZE, this.SEGMENTS, this.SEGMENTS);
        geo.rotateX(-Math.PI / 2);
        // Simple height map using noise-like function
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const h = this.height(x, z);
            pos.setY(i, h);
        }
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        const mat = new THREE.MeshLambertMaterial({
            color: 0x2d4a1e,
            wireframe: false,
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.receiveShadow = false;
        scene.add(this.mesh);
        // Ocean plane
        const oceanGeo = new THREE.PlaneGeometry(this.SIZE * 2, this.SIZE * 2);
        oceanGeo.rotateX(-Math.PI / 2);
        const oceanMat = new THREE.MeshLambertMaterial({
            color: 0x1a3a5c,
            transparent: true,
            opacity: 0.85,
        });
        const ocean = new THREE.Mesh(oceanGeo, oceanMat);
        ocean.position.y = -2;
        scene.add(ocean);
    }
    height(x, z) {
        // Layered sine waves for terrain-like appearance
        const scale1 = 0.0003, scale2 = 0.0008, scale3 = 0.002;
        const h = Math.sin(x * scale1) * Math.cos(z * scale1) * 300 +
            Math.sin(x * scale2 + 1.3) * Math.cos(z * scale2 + 0.7) * 120 +
            Math.sin(x * scale3 + 2.1) * Math.cos(z * scale3 + 1.8) * 40;
        return Math.max(0, h);
    }
    getHeightAt(x, z) {
        return this.height(x, z);
    }
}
