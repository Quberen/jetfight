export class ObjectPool {
    constructor(createFn, resetFn, initialSize = 0) {
        Object.defineProperty(this, "pool", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "createFn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "resetFn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.createFn = createFn;
        this.resetFn = resetFn;
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(createFn());
        }
    }
    acquire() {
        return this.pool.length > 0 ? this.pool.pop() : this.createFn();
    }
    release(obj) {
        this.resetFn(obj);
        this.pool.push(obj);
    }
    get available() {
        return this.pool.length;
    }
}
