import * as THREE from 'three';

export interface GameEvents {
  'lock-progress': { enemyId: number; progress: number };
  'lock-achieved': { enemyId: number };
  'lock-broken': void;
  'missile-fired': { missileId: number };
  'player-hit': { damage: number; hitPoint: THREE.Vector3 };
  'enemy-hit': { enemyId: number; damage: number };
  'enemy-destroyed': { enemyId: number; position: THREE.Vector3 };
  'player-destroyed': void;
  'altitude-warning': { altitude: number };
  'game-state-change': { from: string; to: string };
  'score-update': { score: number; kills: number };
  'throttle-change': { value: number };
}

type Handler<T> = T extends void ? () => void : (data: T) => void;

export class EventBus {
  private handlers = new Map<string, Set<Function>>();

  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends keyof GameEvents>(
    event: K,
    ...args: GameEvents[K] extends void ? [] : [GameEvents[K]]
  ): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const h of set) {
      h(args[0]);
    }
  }
}

export const bus = new EventBus();
