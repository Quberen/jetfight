import * as THREE from 'three';
export function lerp(a, b, t) {
    return a + (b - a) * t;
}
export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}
export function clamp01(v) {
    return clamp(v, 0, 1);
}
export function inverseLerp(a, b, v) {
    if (Math.abs(b - a) < 1e-6)
        return 0;
    return clamp01((v - a) / (b - a));
}
export function smoothDamp(current, target, currentVelocity, smoothTime, dt, maxSpeed = Infinity) {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const originalTo = target;
    const maxChange = maxSpeed * smoothTime;
    change = clamp(change, -maxChange, maxChange);
    const temp = (currentVelocity.v + omega * change) * dt;
    currentVelocity.v = (currentVelocity.v - omega * temp) * exp;
    let output = (current - change) + (change + temp) * exp;
    if (originalTo - current > 0 === output > originalTo) {
        output = originalTo;
        currentVelocity.v = (output - originalTo) / dt;
    }
    return output;
}
export function smoothDampV3(current, target, velocity, smoothTime, dt) {
    const vx = { v: velocity.x };
    const vy = { v: velocity.y };
    const vz = { v: velocity.z };
    current.x = smoothDamp(current.x, target.x, vx, smoothTime, dt);
    current.y = smoothDamp(current.y, target.y, vy, smoothTime, dt);
    current.z = smoothDamp(current.z, target.z, vz, smoothTime, dt);
    velocity.set(vx.v, vy.v, vz.v);
    return current;
}
export function degToRad(deg) {
    return deg * Math.PI / 180;
}
export function radToDeg(rad) {
    return rad * 180 / Math.PI;
}
export function signedAngle(from, to, axis) {
    const angle = from.angleTo(to);
    const cross = new THREE.Vector3().crossVectors(from, to);
    return cross.dot(axis) < 0 ? -angle : angle;
}
// Expo sensitivity curve: more precision near center, faster at edges
export function expoCurve(raw, expo = 0.3) {
    const s = Math.sign(raw);
    const a = Math.abs(raw);
    return s * (a * (1 - expo) + Math.pow(a, 3) * expo);
}
export function wrapAngle(a) {
    while (a > Math.PI)
        a -= 2 * Math.PI;
    while (a < -Math.PI)
        a += 2 * Math.PI;
    return a;
}
// Noise for screen shake
let noiseSeed = 0;
export function pseudoNoise(seed) {
    const x = Math.sin(seed) * 43758.5453123;
    return x - Math.floor(x);
}
export function nextNoise() {
    return pseudoNoise(++noiseSeed) * 2 - 1;
}
