import * as THREE from 'three';
import { Enemy } from '../combat/EnemyAI.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface ReticleEl {
  container: HTMLDivElement;
  arc: SVGCircleElement;
  brackets: SVGPathElement[];
  label: SVGTextElement;
}

export class LockOnReticle {
  private container: HTMLElement;
  private reticle: ReticleEl | null = null;
  private currentTarget: Enemy | null = null;
  private progress = 0;

  constructor() {
    this.container = document.getElementById('lock-on-container')!;
  }

  private createReticle(): ReticleEl {
    const div = document.createElement('div');
    div.className = 'lock-reticle';

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 80 80');
    svg.style.width = '80px';
    svg.style.height = '80px';

    // Progress arc (circle with stroke-dasharray)
    const arc = document.createElementNS(SVG_NS, 'circle');
    arc.setAttribute('cx', '40');
    arc.setAttribute('cy', '40');
    arc.setAttribute('r', '32');
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#ffaa00');
    arc.setAttribute('stroke-width', '1.5');
    arc.setAttribute('stroke-dasharray', `${2 * Math.PI * 32}`);
    arc.setAttribute('stroke-dashoffset', `${2 * Math.PI * 32}`);
    arc.setAttribute('transform', 'rotate(-90 40 40)');
    svg.appendChild(arc);

    // Corner brackets (4 L-shapes)
    const bracketData = [
      'M 12 20 L 12 12 L 20 12',
      'M 60 20 L 60 12 L 68 12',  // adjusted
      'M 12 60 L 12 68 L 20 68',
      'M 60 60 L 60 68 L 68 68',  // adjusted
    ];
    const brackets = bracketData.map(d => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#00ff88');
      p.setAttribute('stroke-width', '2');
      svg.appendChild(p);
      return p;
    });

    // Label
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', '40');
    label.setAttribute('y', '74');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '7');
    label.setAttribute('font-family', 'Share Tech Mono, monospace');
    label.setAttribute('fill', '#ffaa00');
    label.textContent = '';
    svg.appendChild(label);

    div.appendChild(svg);
    this.container.appendChild(div);

    return { container: div, arc, brackets, label };
  }

  updateTarget(
    target: Enemy | null,
    progress: number,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer
  ): void {
    this.progress = progress;

    if (!target) {
      if (this.reticle) this.reticle.container.style.display = 'none';
      this.currentTarget = null;
      return;
    }

    if (!this.reticle) this.reticle = this.createReticle();
    this.reticle.container.style.display = 'block';
    this.currentTarget = target;

    // Project enemy world position to screen
    const pos = target.position.clone();
    pos.project(camera);

    const w = renderer.domElement.clientWidth;
    const h = renderer.domElement.clientHeight;
    const sx = (pos.x * 0.5 + 0.5) * w;
    const sy = (-pos.y * 0.5 + 0.5) * h;

    // Behind camera — hide
    if (pos.z > 1) {
      this.reticle.container.style.display = 'none';
      return;
    }

    this.reticle.container.style.left = `${sx}px`;
    this.reticle.container.style.top  = `${sy}px`;

    // Update arc progress
    const circumference = 2 * Math.PI * 32;
    const offset = circumference * (1 - progress);
    this.reticle.arc.setAttribute('stroke-dashoffset', String(offset));

    // Color shift: white -> amber -> red
    const isLocked = progress >= 1.0;
    const color = isLocked ? '#ff3333' : progress > 0.1 ? '#ffaa00' : '#00ff88';
    this.reticle.arc.setAttribute('stroke', color);
    this.reticle.brackets.forEach(b => b.setAttribute('stroke', color));

    // Label
    if (isLocked) {
      this.reticle.label.textContent = 'LOCKED';
      this.reticle.label.setAttribute('fill', '#ff3333');
    } else if (progress > 0) {
      this.reticle.label.textContent = 'LOCKING';
      this.reticle.label.setAttribute('fill', '#ffaa00');
    } else {
      this.reticle.label.textContent = '';
    }

    // Bracket contraction as lock builds
    const scale = 1 - progress * 0.3;
    this.reticle.container.style.transform = `translate(-50%, -50%) scale(${scale + 0.7})`;
  }
}
