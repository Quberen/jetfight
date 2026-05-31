import * as THREE from 'three';
import { AceParams } from '../game/Config';
import { AircraftState } from './AircraftState';
import { ControlInput } from './ControlInput';
import { clamp, clamp01, lerp, expoCurve } from '../utils/MathUtils';

// Pre-allocated scratch vectors to avoid GC in hot path
const _fwd = new THREE.Vector3();
const _up = new THREE.Vector3();
const _worldY = new THREE.Vector3(0, 1, 0);
const _localPitchAxis = new THREE.Vector3(1, 0, 0);
const _localRollAxis = new THREE.Vector3(0, 0, 1);
const _qPitch = new THREE.Quaternion();
const _qRoll = new THREE.Quaternion();
const _qYaw = new THREE.Quaternion();
const _euler = new THREE.Euler();

export class FlightModel {
  private sensitivity = 1.0;
  private invertPitch = false;

  setSensitivity(s: number): void { this.sensitivity = s; }
  setInvertPitch(v: boolean): void { this.invertPitch = v; }

  update(state: AircraftState, input: ControlInput, dt: number): void {
    if (state.isDead) return;

    // ── Apply expo + deadzone to raw input ──
    let pitchIn = this.applyInput(input.pitch * (this.invertPitch ? -1 : 1), AceParams.pitchExpo);
    let rollIn  = this.applyInput(input.roll, AceParams.rollExpo);
    pitchIn *= this.sensitivity;
    rollIn  *= this.sensitivity;

    // ── Speed integration ──
    const isAB = input.throttle > AceParams.afterburnerThreshold;
    const targetSpeed = isAB
      ? AceParams.speedAfterburner
      : lerp(AceParams.speedMin, AceParams.speedMax, input.throttle);
    const accel = targetSpeed > state.airspeed ? AceParams.throttleAccel : AceParams.throttleDecel;
    state.airspeed += clamp(targetSpeed - state.airspeed, -accel * dt, accel * dt);
    state.throttle = input.throttle;
    state.isAfterburner = isAB;

    // ── Control effectiveness (scales with airspeed) ──
    const effectiveness = clamp(
      (state.airspeed - AceParams.stallSpeed) / (AceParams.cruiseSpeed - AceParams.stallSpeed),
      AceParams.stallControlFactor,
      1.25
    );

    // ── Target angular rates ──
    const targetPitch = pitchIn * AceParams.pitchRate * effectiveness;
    const targetRoll  = rollIn  * AceParams.rollRate  * effectiveness;

    // ── Coordinated turn: bank angle drives yaw automatically ──
    _euler.setFromQuaternion(state.quaternion, 'YXZ');
    const bankAngle = _euler.z;
    const speedRatio = state.airspeed / AceParams.cruiseSpeed;
    const targetYaw = -Math.sin(bankAngle) * AceParams.bankToTurnRate * speedRatio * AceParams.coordinatedTurnStrength;

    // ── Smooth angular rates (inertia) ──
    state.pitchRate = lerp(state.pitchRate, targetPitch, 1 - AceParams.pitchInertia);
    state.rollRate  = lerp(state.rollRate,  targetRoll,  1 - AceParams.rollInertia);
    state.yawRate   = lerp(state.yawRate,   targetYaw,   1 - AceParams.yawInertia);

    // ── Apply rotations ──
    // Yaw in world space (avoids gimbal lock)
    _qYaw.setFromAxisAngle(_worldY, state.yawRate * dt);
    // Pitch + roll in local body frame
    _localPitchAxis.set(1, 0, 0).applyQuaternion(state.quaternion);
    _localRollAxis.set(0, 0, 1).applyQuaternion(state.quaternion);
    _qPitch.setFromAxisAngle(_localPitchAxis, state.pitchRate * dt);
    _qRoll.setFromAxisAngle(_localRollAxis,  state.rollRate  * dt);

    state.quaternion.premultiply(_qYaw);
    state.quaternion.multiply(_qPitch);
    state.quaternion.multiply(_qRoll);
    state.quaternion.normalize();

    // ── Forward/up vectors ──
    _fwd.set(0, 0, -1).applyQuaternion(state.quaternion);
    _up.set(0, 1, 0).applyQuaternion(state.quaternion);

    // ── Lift + gravity ──
    const liftMag = state.airspeed * state.airspeed * AceParams.liftCoefficient;
    const liftY  = _up.y * liftMag;
    const gravNet = liftY - AceParams.gravityStrength;

    // Main velocity = forward * airspeed + vertical gravity correction
    state.velocity.copy(_fwd).multiplyScalar(state.airspeed);
    state.velocity.y += gravNet * dt;

    // ── Position ──
    state.position.addScaledVector(state.velocity, dt);

    // ── Ground clamp ──
    if (state.position.y < AceParams.groundClamp) {
      state.position.y = AceParams.groundClamp;
      state.velocity.y = Math.max(0, state.velocity.y);
      // Flatten pitch on ground approach
      state.pitchRate *= 0.7;
    }

    // ── G-force (felt centripetal + pitch) ──
    const centripetal = Math.abs(state.yawRate * state.airspeed);
    const pitchG = Math.abs(state.pitchRate * state.airspeed);
    const rawG = (centripetal + pitchG) / 9.8 + 1;
    state.gForce = lerp(state.gForce, rawG, 0.12);
  }

  private applyInput(raw: number, expo: number): number {
    if (Math.abs(raw) < AceParams.deadzone) return 0;
    const normalized = (raw - Math.sign(raw) * AceParams.deadzone) / (1 - AceParams.deadzone);
    return clamp(expoCurve(normalized, expo), -1, 1);
  }
}
