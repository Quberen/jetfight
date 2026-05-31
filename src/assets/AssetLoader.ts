import * as THREE from 'three';
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

  private async loadEntry(entry: AssetEntry): Promise<void> {
    try {
      const gltf = await this.loader.loadAsync(entry.path);
      AssetRegistry.set(entry.key, gltf.scene);
    } catch {
      // Use placeholder — this is expected when external assets aren't present
      AssetRegistry.set(entry.key, PlaceholderFactory.create(entry.key));
    }
  }
}
