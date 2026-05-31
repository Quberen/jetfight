// Multi-touch fire/missile buttons — handles simultaneous touches
export class ButtonController {
    constructor(gunBtn, missileBtn) {
        Object.defineProperty(this, "gunActive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "missileActive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "missileQueued", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "missileCooldown", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "MISSILE_COOLDOWN", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.5
        });
        Object.defineProperty(this, "gunTouches", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "missileTouches", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        this.bind(gunBtn, 'gun');
        this.bind(missileBtn, 'missile');
    }
    bind(el, kind) {
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const id = e.changedTouches[i].identifier;
                if (kind === 'gun')
                    this.gunTouches.add(id);
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
                if (kind === 'gun')
                    this.gunTouches.delete(id);
                else
                    this.missileTouches.delete(id);
            }
            if ((kind === 'gun' && this.gunTouches.size === 0) ||
                (kind === 'missile' && this.missileTouches.size === 0)) {
                el.classList.remove('active');
            }
        });
        el.addEventListener('touchcancel', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const id = e.changedTouches[i].identifier;
                if (kind === 'gun')
                    this.gunTouches.delete(id);
                else
                    this.missileTouches.delete(id);
            }
            el.classList.remove('active');
        });
    }
    update(dt) {
        this.gunActive = this.gunTouches.size > 0;
        this.missileCooldown = Math.max(0, this.missileCooldown - dt);
    }
    get isGunFiring() { return this.gunActive; }
    consumeMissile() {
        if (this.missileQueued && this.missileCooldown <= 0) {
            this.missileQueued = false;
            this.missileCooldown = this.MISSILE_COOLDOWN;
            return true;
        }
        this.missileQueued = false;
        return false;
    }
}
