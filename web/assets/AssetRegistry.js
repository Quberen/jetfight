export class AssetRegistry {
    static set(key, obj) {
        this.cache.set(key, obj);
    }
    static get(key) {
        return this.cache.get(key);
    }
    static has(key) {
        return this.cache.has(key);
    }
}
Object.defineProperty(AssetRegistry, "cache", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new Map()
});
