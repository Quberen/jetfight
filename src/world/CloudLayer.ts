import * as THREE from 'three';

const CLOUD_COUNT = 20;
const PUFFS_PER_CLOUD = 5;

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

const PUFF_OFFSETS: [number, number, number, number][] = [
  [ 0.0,  0.0,  0.0, 1.00],
  [ 1.8,  0.2,  0.2, 0.75],
  [-1.5,  0.1, -0.1, 0.80],
  [ 0.7,  0.6,  0.5, 0.55],
  [-0.6,  0.5, -0.5, 0.65],
];

export class CloudLayer {
  private mesh: THREE.InstancedMesh;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.SphereGeometry(1, 7, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xdde8f0,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, CLOUD_COUNT * PUFFS_PER_CLOUD);
    this.mesh.frustumCulled = false;

    let idx = 0;
    for (let c = 0; c < CLOUD_COUNT; c++) {
      const angle = (c / CLOUD_COUNT) * Math.PI * 2 + c * 0.5;
      const radius = 4000 + (c * 1234 % 8000);
      const cx = Math.cos(angle) * radius;
      const cz = Math.sin(angle) * radius;
      const cy = 2800 + (c * 997 % 2200);
      const baseScale = 500 + (c * 613 % 600);

      for (const [px, py, pz, ps] of PUFF_OFFSETS) {
        _p.set(cx + px * baseScale, cy + py * baseScale, cz + pz * baseScale);
        _s.setScalar(baseScale * ps);
        _m.compose(_p, _q, _s);
        this.mesh.setMatrixAt(idx++, _m);
      }
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    scene.add(this.mesh);
  }

  update(_playerPos: THREE.Vector3): void {}
}
