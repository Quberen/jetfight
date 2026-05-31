import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AssetRegistry } from './AssetRegistry';
import { PlaceholderFactory } from './PlaceholderFactory';

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

  private async fileExists(path: string): Promise<boolean> {
    try {
      const res = await Promise.race([
        fetch(path, { method: 'HEAD' }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2000)
        ),
      ]);
      return (res as Response).ok;
    } catch {
      return false;
    }
  }

  private async loadEntry(entry: AssetEntry): Promise<void> {
    try {
      // Fast HEAD check before committing to a full GLTFLoader load.
      // GLTFLoader.loadAsync can hang silently on some browsers when the
      // file returns a non-JSON 404 body, so we gate on existence first.
      const exists = await this.fileExists(entry.path);
      if (!exists) {
        AssetRegistry.set(entry.key, PlaceholderFactory.create(entry.key));
        return;
      }

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
