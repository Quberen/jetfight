import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssetRegistry } from './AssetRegistry.js';
import { PlaceholderFactory } from './PlaceholderFactory.js';

// Set to true and provide real GLB files under public/assets/models/ to load external models.
const LOAD_EXTERNAL_MODELS = false;

interface AssetEntry {
  key: string;
  path: string;
  critical: boolean;
}

const MANIFEST: AssetEntry[] = [
  { key: 'player_jet', path: '/assets/models/player_jet.glb', critical: true },
  { key: 'enemy_jet',  path: '/assets/models/enemy_jet.glb',  critical: true },
  { key: 'missile',    path: '/assets/models/missile.glb',     critical: false },
];

export class AssetLoader {
  private loader = new GLTFLoader();

  async loadCritical(onProgress: (pct: number) => void): Promise<void> {
    const critical = MANIFEST.filter(a => a.critical);
    let loaded = 0;
    for (const entry of critical) {
      await this.loadEntry(entry);
      loaded++;
      onProgress(loaded / critical.length);
    }
  }

  loadBackground(): void {
    const optional = MANIFEST.filter(a => !a.critical);
    for (const entry of optional) {
      this.loadEntry(entry).catch(() => {});
    }
  }

  private async loadEntry(entry: AssetEntry): Promise<void> {
    if (!LOAD_EXTERNAL_MODELS) {
      AssetRegistry.set(entry.key, PlaceholderFactory.create(entry.key));
      return;
    }
    try {
      const gltf = await Promise.race([
        this.loader.loadAsync(entry.path),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('load timeout')), 15000)
        ),
      ]);
      AssetRegistry.set(entry.key, gltf.scene);
    } catch {
      AssetRegistry.set(entry.key, PlaceholderFactory.create(entry.key));
    }
  }
}
