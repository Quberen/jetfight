export class EventBus {
    constructor() {
        Object.defineProperty(this, "handlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(handler);
    }
    off(event, handler) {
        this.handlers.get(event)?.delete(handler);
    }
    emit(event, ...args) {
        const set = this.handlers.get(event);
        if (!set)
            return;
        for (const h of set) {
            h(args[0]);
        }
    }
}
export const bus = new EventBus();
