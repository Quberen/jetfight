import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssetRegistry } from './AssetRegistry.js';
import { PlaceholderFactory } from './PlaceholderFactory.js';
// Set to true and provide real GLB files under public/assets/models/ to load external models.
const LOAD_EXTERNAL_MODELS = false;
const MANIFEST = [
    { key: 'player_jet', path: '/assets/models/player_jet.glb', critical: true },
    { key: 'enemy_jet', path: '/assets/models/enemy_jet.glb', critical: true },
    { key: 'missile', path: '/assets/models/missile.glb', critical: false },
];
export class AssetLoader {
    constructor() {
        Object.defineProperty(this, "loader", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new GLTFLoader()
        });
    }
    async loadCritical(onProgress) {
        const critical = MANIFEST.filter(a => a.critical);
        let loaded = 0;
        for (const entry of critical) {
            await this.loadEntry(entry);
            loaded++;
            onProgress(loaded / critical.length);
        }
    }
    loadBackground() {
        const optional = MANIFEST.filter(a => !a.critical);
        for (const entry of optional) {
            this.loadEntry(entry).catch(() => { });
        }
    }
    async loadEntry(entry) {
        if (!LOAD_EXTERNAL_MODELS) {
            AssetRegistry.set(entry.key, PlaceholderFactory.create(entry.key));
            return;
        }
        try {
            const gltf = await Promise.race([
                this.loader.loadAsync(entry.path),
                new Promise((_, reject) => setTimeout(() => reject(new Error('load timeout')), 15000)),
            ]);
            AssetRegistry.set(entry.key, gltf.scene);
        }
        catch {
            AssetRegistry.set(entry.key, PlaceholderFactory.create(entry.key));
        }
    }
}
