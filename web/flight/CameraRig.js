import * as THREE from 'three';
import { AceParams } from '../game/Config.js';
import { clamp01, smoothDampV3 } from '../utils/MathUtils.js';
const _fwd = new THREE.Vector3();
const _up = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _camVel = new THREE.Vector3();
const _worldY = new THREE.Vector3(0, 1, 0);
export class CameraRig {
    constructor(camera) {
        Object.defineProperty(this, "camera", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "camVelocity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        Object.defineProperty(this, "shakeOffset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        // Externally written by ScreenShake
        Object.defineProperty(this, "shake", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new THREE.Vector3()
        });
        this.camera = camera;
    }
    update(state, dt) {
        _fwd.set(0, 0, -1).applyQuaternion(state.quaternion);
        _up.set(0, 1, 0).applyQuaternion(state.quaternion);
        // G-force factor: push camera back & down under high G
        const gEffect = clamp01((state.gForce - AceParams.gForceThreshold) /
            (AceParams.gForceMax - AceParams.gForceThreshold));
        const boomExt = AceParams.cameraBoomLength + gEffect * AceParams.cameraMaxLag;
        // Desired camera position: behind + above aircraft
        _desired.copy(state.position)
            .addScaledVector(_fwd, -boomExt)
            .addScaledVector(_worldY, AceParams.cameraHeightOffset - gEffect * 0.6);
        // Spring toward desired position
        smoothDampV3(this.camera.position, _desired, this.camVelocity, AceParams.cameraSmooth, dt);
        // Screen-shake offset
        this.camera.position.add(this.shake);
        // Look target: ahead of aircraft, biased toward velocity direction
        _lookTarget.copy(state.position)
            .addScaledVector(_fwd, 20)
            .addScaledVector(state.velocity.clone().normalize(), 5 * AceParams.cameraLookAheadStrength);
        this.camera.lookAt(_lookTarget);
    }
}
