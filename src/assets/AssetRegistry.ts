import * as THREE from 'three';

export class AssetRegistry {
  private static cache = new Map<string, THREE.Object3D>();

  static set(key: string, obj: THREE.Object3D): void {
    this.cache.set(key, obj);
  }

  static get(key: string): THREE.Object3D | undefined {
    return this.cache.get(key);
  }

  static has(key: string): boolean {
    return this.cache.has(key);
  }
}
