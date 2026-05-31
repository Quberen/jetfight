// All tunable game constants in one place — tweak here for feel
export const AceParams = {
    // ── Speed Envelope ──
    speedMin: 80,
    speedMax: 400,
    speedAfterburner: 480,
    cruiseSpeed: 220,
    throttleAccel: 70,
    throttleDecel: 40,
    afterburnerThreshold: 0.92, // throttle above this = afterburner
    // ── Rotation Rates (rad/s at cruise speed) ──
    pitchRate: 1.9,
    rollRate: 2.6,
    yawRate: 0.35,
    // ── Inertia (0=instant, closer to 1 = more lag) ──
    pitchInertia: 0.10,
    rollInertia: 0.07,
    yawInertia: 0.16,
    // ── Coordinated Turn (the Ace Combat magic) ──
    coordinatedTurnStrength: 0.88,
    bankToTurnRate: 1.25,
    // ── Auto-Level (wing leveling when no roll input) ──
    autoLevelStrength: 0.8, // rad/s per radian of bank; T=1.25s at 90° bank
    // ── Lift / Gravity ──
    liftCoefficient: 0.14,
    gravityStrength: 9.8,
    groundClamp: 80, // minimum altitude (m) — soft floor
    // ── Stall ──
    stallSpeed: 65,
    stallControlFactor: 0.35, // control authority at stall
    // ── Camera ──
    cameraBoomLength: 9,
    cameraHeightOffset: 2.2,
    cameraLookAheadStrength: 0.28,
    cameraSmooth: 0.13, // spring smoothing time (s)
    cameraMaxLag: 3.0, // max boom extension at high G
    // ── G-Force ──
    gForceThreshold: 2.5,
    gForceMax: 9.0,
    gForceTunnelVisionThreshold: 4.0,
    // ── Control Sensitivity ──
    pitchExpo: 0.30,
    rollExpo: 0.25,
    deadzone: 0.07,
};
export const CombatParams = {
    gunDamage: 12,
    gunRange: 1600,
    gunFireRate: 18, // rounds/sec
    gunAmmoMax: 500,
    missileDamage: 80,
    missileSpeed: 580,
    missileMaxG: 28,
    missileRange: 4500,
    missileLifetime: 9, // seconds
    missileKillRadius: 9,
    missileProximityRadius: 28,
    missileCount: 6,
    lockOnRange: 5200,
    lockOnConeAngle: 38, // degrees
    lockOnTime: 2.8, // seconds to full lock
    lockBreakSpeed: 2.0, // multiplier for how fast lock breaks
    enemyCount: 5,
    enemyHp: 100,
    playerHp: 200,
};
export const EffectParams = {
    screenShakeHit: 0.18,
    screenShakeMissileHit: 0.65,
    screenShakeNearMiss: 0.28,
    screenShakeDecay: 9.0,
    screenShakeMax: 2.0,
    contrailLengthPoints: 70,
    contrailOpacityDecay: 0.015,
    contrailMinAltitude: 5000, // realistic contrail altitude
    contrailHighGThreshold: 4, // always show above this G
    explosionParticles: 60,
    sparkParticles: 12,
};
