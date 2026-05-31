import { ControlInput, defaultInput } from '../flight/ControlInput.js';
import { JoystickController } from './JoystickController.js';
import { ThrottleController } from './ThrottleController.js';
import { ButtonController } from './ButtonController.js';
import { GyroController } from './GyroController.js';
import { lerp } from '../utils/MathUtils.js';

export type ControlMode = 'joystick' | 'gyro' | 'hybrid';

export class InputManager {
  private joystick: JoystickController;
  private throttle: ThrottleController;
  private buttons: ButtonController;
  private gyro: GyroController;

  private mode: ControlMode = 'joystick';
  private sensitivity = 1.0;
  private invertPitch = false;

  // Gyro blend weight: 1.0 = full gyro, 0 = full joystick
  private readonly GYRO_WEIGHT = 0.75;

  constructor() {
    const base   = document.getElementById('joystick-base')!;
    const knob   = document.getElementById('joystick-knob')!;
    const track  = document.getElementById('throttle-track')!;
    const fill   = document.getElementById('throttle-fill')!;
    const handle = document.getElementById('throttle-handle')!;
    const pct    = document.getElementById('throttle-pct')!;
    const zone   = document.getElementById('throttle-zone')!;
    const gun    = document.getElementById('btn-gun')!;
    const missile= document.getElementById('btn-missile')!;

    this.joystick = new JoystickController(base, knob, 50);
    this.throttle = new ThrottleController(track, fill, handle, pct, zone);
    this.buttons  = new ButtonController(gun, missile);
    this.gyro     = new GyroController();

    this.bindSettings();
  }

  private bindSettings(): void {
    document.getElementById('btn-gyro-toggle')?.addEventListener('click', () => {
      this.cycleControlMode();
    });
  }

  private cycleControlMode(): void {
    const modes: ControlMode[] = ['joystick', 'gyro', 'hybrid'];
    const idx = modes.indexOf(this.mode);
    this.setMode(modes[(idx + 1) % modes.length]);
  }

  async setMode(mode: ControlMode): Promise<void> {
    if (mode !== 'joystick') {
      const granted = await this.gyro.requestPermission();
      if (!granted) { mode = 'joystick'; }
    }
    this.mode = mode;
    this.gyro.setEnabled(mode !== 'joystick');

    const btn = document.getElementById('btn-gyro-toggle');
    btn?.classList.toggle('active', mode !== 'joystick');

    // Show mode change indicator
    this.showModeHint(mode.toUpperCase());

    // Update settings panel UI
    document.getElementById('mode-joystick')?.classList.toggle('active', mode === 'joystick');
    document.getElementById('mode-gyro')?.classList.toggle('active', mode === 'gyro');
    document.getElementById('mode-hybrid')?.classList.toggle('active', mode === 'hybrid');

    // Hide joystick zone in pure gyro mode
    const jzone = document.getElementById('joystick-zone');
    if (jzone) jzone.style.opacity = mode === 'gyro' ? '0.3' : '1';
  }

  private showModeHint(label: string): void {
    let el = document.getElementById('control-mode-display');
    if (!el) {
      el = document.createElement('div');
      el.id = 'control-mode-display';
      document.getElementById('controls-layer')?.appendChild(el);
    }
    el.textContent = `CTRL: ${label}`;
    el.classList.add('visible');
    setTimeout(() => el!.classList.remove('visible'), 2000);
  }

  setSensitivity(pct: number): void { this.sensitivity = pct / 100; }
  setInvertPitch(v: boolean): void { this.invertPitch = v; }

  update(dt: number): ControlInput {
    this.joystick.update(dt);
    this.buttons.update(dt);

    const joy = this.joystick.output;
    const gyro = this.gyro.output;

    let pitch: number;
    let roll: number;

    switch (this.mode) {
      case 'gyro':
        pitch = gyro.pitch;
        roll  = gyro.roll;
        break;
      case 'hybrid':
        // Joystick and gyro both contribute
        pitch = lerp(joy.y,    gyro.pitch, this.GYRO_WEIGHT);
        roll  = lerp(joy.x,    gyro.roll,  this.GYRO_WEIGHT);
        // Joystick overrides gyro when actively touched
        if (joy.active) {
          pitch = lerp(gyro.pitch, joy.y, 0.7);
          roll  = lerp(gyro.roll,  joy.x, 0.7);
        }
        break;
      default: // joystick
        pitch = joy.y;
        roll  = joy.x;
    }

    // Sensitivity scale
    pitch *= this.sensitivity;
    roll  *= this.sensitivity;

    if (this.invertPitch) pitch = -pitch;

    return {
      pitch,
      roll,
      throttle: this.throttle.throttle,
      fire:    this.buttons.isGunFiring,
      missile: this.buttons.consumeMissile(),
    };
  }

  get gyroAvailable(): boolean { return this.gyro.isAvailable; }

  destroy(): void {
    this.joystick.destroy();
    this.throttle.destroy();
    this.gyro.destroy();
  }
}
