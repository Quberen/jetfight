interface AlertEntry {
  key: string;
  el: HTMLElement;
  timer: number;
}

export class AlertBanner {
  private container: HTMLElement;
  private active = new Map<string, AlertEntry>();

  constructor() {
    this.container = document.getElementById('alert-banner')!;
  }

  show(key: string, text: string, type: 'warning' | 'danger', duration = 2.5): void {
    if (this.active.has(key)) {
      // Refresh timer
      this.active.get(key)!.timer = duration;
      return;
    }
    const el = document.createElement('div');
    el.className = `alert-item ${type}`;
    el.textContent = text;
    this.container.appendChild(el);
    this.active.set(key, { key, el, timer: duration });
  }

  showPersistent(key: string, text: string, type: 'warning' | 'danger'): void {
    this.show(key, text, type, Infinity);
  }

  hide(key: string): void {
    const entry = this.active.get(key);
    if (entry) {
      entry.el.remove();
      this.active.delete(key);
    }
  }

  update(dt: number): void {
    for (const [key, entry] of this.active) {
      if (entry.timer === Infinity) continue;
      entry.timer -= dt;
      if (entry.timer <= 0) {
        entry.el.remove();
        this.active.delete(key);
      }
    }
  }
}
