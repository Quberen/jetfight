import * as THREE from 'three';
import { AircraftState } from '../flight/AircraftState.js';
import { AceParams, EffectParams } from '../game/Config.js';

const MAX_POINTS = EffectParams.contrailLengthPoints;

class ContrailTrail {
  mesh: THREE.Line;
  private positions: Float32Array;
  private count = 0;
  private geo: THREE.BufferGeometry;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(MAX_POINTS * 3);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setDrawRange(0, 0);

    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      linewidth: 1,
    });
    this.mesh = new THREE.Line(this.geo, mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  addPoint(p: THREE.Vector3): void {
    if (this.count < MAX_POINTS) {
      // Shift existing
      this.positions.copyWithin(3, 0, this.count * 3);
    } else {
      this.positions.copyWithin(3, 0, (MAX_POINTS - 1) * 3);
    }
    this.positions[0] = p.x;
    this.positions[1] = p.y;
    this.positions[2] = p.z;
    this.count = Math.min(this.count + 1, MAX_POINTS);
    this.geo.getAttribute('position').needsUpdate = true;
    this.geo.setDrawRange(0, this.count);
  }

  clear(): void {
    this.count = 0;
    this.geo.setDrawRange(0, 0);
  }

  setVisible(v: boolean): void {
    this.mesh.visible = v;
  }
}

export class ContrailSystem {
  private leftTrail: ContrailTrail;
  private rightTrail: ContrailTrail;
  private visible = false;
  private timer = 0;

  // Wingtip offsets in local aircraft space
  private readonly LEFT_OFFSET  = new THREE.Vector3(-4.5, 0, 0);
  private readonly RIGHT_OFFSET = new THREE.Vector3( 4.5, 0, 0);
  private _tmp = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.leftTrail  = new ContrailTrail(scene);
    this.rightTrail = new ContrailTrail(scene);
  }

  update(state: AircraftState, dt: number): void {
    this.timer += dt;
    if (this.timer < 0.033) return; // 30 Hz trail updates
    this.timer = 0;

    const shouldShow =
      state.position.y > EffectParams.contrailMinAltitude ||
      state.gForce > EffectParams.contrailHighGThreshold ||
      state.isAfterburner;

    this.leftTrail.setVisible(shouldShow);
    this.rightTrail.setVisible(shouldShow);

    if (!shouldShow) {
      this.leftTrail.clear();
      this.rightTrail.clear();
      return;
    }

    this._tmp.copy(this.LEFT_OFFSET).applyQuaternion(state.quaternion).add(state.position);
    this.leftTrail.addPoint(this._tmp);

    this._tmp.copy(this.RIGHT_OFFSET).applyQuaternion(state.quaternion).add(state.position);
    this.rightTrail.addPoint(this._tmp);
  }

  dispose(scene: THREE.Scene): void {
    scene.remove(this.leftTrail.mesh);
    scene.remove(this.rightTrail.mesh);
  }
}
