import * as THREE from 'three';

export interface AircraftState {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  airspeed: number;
  pitchRate: number;
  rollRate: number;
  yawRate: number;
  gForce: number;
  throttle: number;
  isAfterburner: boolean;
  hp: number;
  maxHp: number;
  isDead: boolean;
}

export function createAircraftState(pos?: THREE.Vector3): AircraftState {
  return {
    position: pos ?? new THREE.Vector3(0, 800, 0),
    quaternion: new THREE.Quaternion(),
    velocity: new THREE.Vector3(0, 0, -220),
    airspeed: 220,
    pitchRate: 0,
    rollRate: 0,
    yawRate: 0,
    gForce: 1,
    throttle: 0.6,
    isAfterburner: false,
    hp: 200,
    maxHp: 200,
    isDead: false,
  };
}
