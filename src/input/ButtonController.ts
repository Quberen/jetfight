// Multi-touch fire/missile buttons — handles simultaneous touches
export class ButtonController {
  private gunActive = false;
  private missileActive = false;
  private missileQueued = false;
  private missileCooldown = 0;
  private readonly MISSILE_COOLDOWN = 0.5;

  private gunTouches = new Set<number>();
  private missileTouches = new Set<number>();

  constructor(gunBtn: HTMLElement, missileBtn: HTMLElement) {
    this.bind(gunBtn, 'gun');
    this.bind(missileBtn, 'missile');
  }

  private bind(el: HTMLElement, kind: 'gun' | 'missile'): void {
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const id = e.changedTouches[i].identifier;
        if (kind === 'gun') this.gunTouches.add(id);
        else {
          this.missileTouches.add(id);
          this.missileQueued = true;
        }
        el.classList.add('active');
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const id = e.changedTouches[i].identifier;
        if (kind === 'gun') this.gunTouches.delete(id);
        else this.missileTouches.delete(id);
      }
      if ((kind === 'gun' && this.gunTouches.size === 0) ||
          (kind === 'missile' && this.missileTouches.size === 0)) {
        el.classList.remove('active');
      }
    });

    el.addEventListener('touchcancel', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const id = e.changedTouches[i].identifier;
        if (kind === 'gun') this.gunTouches.delete(id);
        else this.missileTouches.delete(id);
      }
      el.classList.remove('active');
    });
  }

  update(dt: number): void {
    this.gunActive = this.gunTouches.size > 0;
    this.missileCooldown = Math.max(0, this.missileCooldown - dt);
  }

  get isGunFiring(): boolean { return this.gunActive; }

  consumeMissile(): boolean {
    if (this.missileQueued && this.missileCooldown <= 0) {
      this.missileQueued = false;
      this.missileCooldown = this.MISSILE_COOLDOWN;
      return true;
    }
    this.missileQueued = false;
    return false;
  }
}
