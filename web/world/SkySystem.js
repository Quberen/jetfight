import * as THREE from 'three';
export class SkySystem {
    constructor(scene) {
        Object.defineProperty(this, "mesh", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Sky sphere with gradient shader
        const geo = new THREE.SphereGeometry(40000, 16, 8);
        geo.scale(-1, 1, 1); // invert for inside view
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0a1a3a) },
                bottomColor: { value: new THREE.Color(0x2a4a6a) },
                offset: { value: 400 },
                exponent: { value: 0.4 },
            },
            vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
            side: THREE.BackSide,
        });
        this.mesh = new THREE.Mesh(geo, mat);
        scene.add(this.mesh);
        // Sun
        const sunGeo = new THREE.SphereGeometry(600, 16, 8);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.position.set(15000, 12000, -30000);
        scene.add(sun);
    }
    update(playerPos) {
        this.mesh.position.copy(playerPos);
    }
}
