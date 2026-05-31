import * as THREE from 'three';
import { Enemy } from '../combat/EnemyAI.js';

export class RadarDisplay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sweepAngle = 0;
  private readonly SIZE = 90;
  private readonly RANGE = 12000; // meters represented by radar radius

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width  = this.SIZE;
    this.canvas.height = this.SIZE;
    this.ctx = this.canvas.getContext('2d')!;
    document.getElementById('radar-container')!.appendChild(this.canvas);
  }

  update(
    dt: number,
    playerPos: THREE.Vector3,
    playerHeading: number,
    enemies: Enemy[]
  ): void {
    this.sweepAngle += dt * 0.8; // one rotation every ~7.8s

    const ctx = this.ctx;
    const cx = this.SIZE / 2;
    const cy = this.SIZE / 2;
    const r  = cx - 4;

    ctx.clearRect(0, 0, this.SIZE, this.SIZE);

    // Background
    ctx.fillStyle = 'rgba(0, 8, 16, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Range rings
    ctx.strokeStyle = 'rgba(0,255,136,0.12)';
    ctx.lineWidth = 0.5;
    for (const frac of [0.33, 0.66, 1.0]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * frac, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cardinal labels
    ctx.fillStyle = 'rgba(0,255,136,0.3)';
    ctx.font = '7px Share Tech Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 10);
    ctx.fillText('S', cx, this.SIZE - 3);
    ctx.fillText('E', this.SIZE - 3, cy + 3);
    ctx.fillText('W', 6, cy + 3);

    // Sweep line
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.sweepAngle);
    const sweep = ctx.createLinearGradient(0, 0, r, 0);
    sweep.addColorStop(0, 'rgba(0,255,136,0.0)');
    sweep.addColorStop(1, 'rgba(0,255,136,0.25)');
    ctx.fillStyle = sweep;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, -0.4, 0);
    ctx.fill();
    ctx.restore();

    // Enemy blips — rotated relative to player heading
    const headRad = playerHeading * Math.PI / 180;
    for (const e of enemies) {
      if (e.isDead) continue;
      const dx = e.position.x - playerPos.x;
      const dz = e.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > this.RANGE) continue;

      // Rotate by -playerHeading so north = forward
      const angle = Math.atan2(dx, -dz) - headRad;
      const frac  = dist / this.RANGE;
      const bx    = cx + Math.sin(angle) * r * frac;
      const by    = cy - Math.cos(angle) * r * frac;

      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player dot (center)
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0,255,136,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}
