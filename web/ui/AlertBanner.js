export class AlertBanner {
    constructor() {
        Object.defineProperty(this, "container", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "active", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.container = document.getElementById('alert-banner');
    }
    show(key, text, type, duration = 2.5) {
        if (this.active.has(key)) {
            // Refresh timer
            this.active.get(key).timer = duration;
            return;
        }
        const el = document.createElement('div');
        el.className = `alert-item ${type}`;
        el.textContent = text;
        this.container.appendChild(el);
        this.active.set(key, { key, el, timer: duration });
    }
    showPersistent(key, text, type) {
        this.show(key, text, type, Infinity);
    }
    hide(key) {
        const entry = this.active.get(key);
        if (entry) {
            entry.el.remove();
            this.active.delete(key);
        }
    }
    update(dt) {
        for (const [key, entry] of this.active) {
            if (entry.timer === Infinity)
                continue;
            entry.timer -= dt;
            if (entry.timer <= 0) {
                entry.el.remove();
                this.active.delete(key);
            }
        }
    }
}
