import { ParticlePool } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { COLORS } from './fireworkColors';

interface CrackerNode {
  x: number;
  y: number;
  exploded: boolean;
  angle: number;
}

/**
 * Traditional Indian 1000-Wala Firecracker Garland (Ladi)
 * Features:
 * - Hanging curved string of red firecracker tubes with golden fuse
 * - High-speed staccato sequential detonations down the chain
 * - Blinding micro-flashes, crackling sparks, flying red paper fragments, and billowing smoke
 * - Authentic machine-gun rhythmic Diwali pyrotechnic sound triggers
 */
export class ThousandWala implements FireworkEffect {
  public active: boolean = true;
  private x: number;
  private y: number;
  private onSound?: SoundTriggerCallback;

  private crackers: CrackerNode[] = [];
  private currentIdx: number = 0;
  private burstTimer: number = 0;
  private readonly BURST_INTERVAL: number = 0.055; // Fast staccato tempo (18 explosions/sec)
  private chainAlpha: number = 1.0;

  constructor(x: number, y: number, onSound?: SoundTriggerCallback) {
    this.x = x;
    this.y = y;
    this.onSound = onSound;
    this.generateGarland();
  }

  private generateGarland(): void {
    // Generate an authentic hanging curved garland with 32 clustered detonation nodes
    const nodeCount = 32;
    const height = 340;

    for (let i = 0; i < nodeCount; i++) {
      const t = i / nodeCount;
      // Slight natural S-curve sag
      const curveX = Math.sin(t * Math.PI * 1.5) * 28 + (Math.random() - 0.5) * 8;
      const posY = t * height;

      this.crackers.push({
        x: this.x + curveX,
        y: this.y + posY,
        exploded: false,
        angle: (Math.random() - 0.5) * 0.4
      });
    }
  }

  public update(dt: number, pool: ParticlePool): void {
    if (!this.active) return;

    this.burstTimer += dt;

    // Trigger sequential bursts along the chain
    while (this.burstTimer >= this.BURST_INTERVAL && this.currentIdx < this.crackers.length) {
      this.burstTimer -= this.BURST_INTERVAL;
      const node = this.crackers[this.currentIdx];
      node.exploded = true;
      this.detonateNode(node, pool);
      this.currentIdx++;
    }

    if (this.currentIdx >= this.crackers.length) {
      this.chainAlpha = Math.max(0, this.chainAlpha - dt * 2);
      if (this.chainAlpha <= 0) {
        this.active = false;
      }
    }
  }

  private detonateNode(node: CrackerNode, pool: ParticlePool): void {
    // Trigger rapid firecracker pop sound
    this.onSound?.('CRACKER_CHAIN', 0.85);

    // 1. Intense localized micro-flash
    pool.addFlash(node.x, node.y, 220, COLORS.GOLD, 0.65);

    // 2. Billowing smoke puff
    for (let s = 0; s < 3; s++) {
      pool.spawn({
        kind: 'SMOKE',
        x: node.x + (Math.random() - 0.5) * 10,
        y: node.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -(Math.random() * 2.2 + 0.8),
        color: COLORS.SMOKE_WARM,
        fadeColor: COLORS.SMOKE_GRAY,
        size: 14 + Math.random() * 8,
        life: 1.1 + Math.random() * 0.4
      });
    }

    // 3. Incandescent golden & white-hot spark burst (30 sparks)
    const sparkCount = 30;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 14 + 3;
      const isWhite = Math.random() < 0.45;

      pool.spawn({
        kind: 'SPARK',
        x: node.x,
        y: node.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isWhite ? COLORS.WHITE_HOT : COLORS.GOLD,
        fadeColor: COLORS.DEEP_ORANGE,
        size: 2.8 + Math.random() * 1.5,
        life: 0.45 + Math.random() * 0.35,
        drag: 0.94,
        gravity: 0.14,
        flicker: true,
        crackle: true,
        trail: true
      });
    }

    // 4. Flying red paper casing shreds
    for (let p = 0; p < 8; p++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 1.5;
      pool.spawn({
        kind: 'SPARK',
        x: node.x,
        y: node.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 1.5, // Flutter down
        color: COLORS.CRIMSON,
        fadeColor: COLORS.DEEP_ORANGE,
        size: 2.5,
        life: 0.7 + Math.random() * 0.4,
        drag: 0.92,
        gravity: 0.22,
        trail: false
      });
    }
  }

  /**
   * Renders the authentic hanging red firecracker garland with unexploded crackers
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.chainAlpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.chainAlpha;

    // 1. Central suspension rope & fuse string
    ctx.strokeStyle = '#ffe082';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < this.crackers.length; i++) {
      const c = this.crackers[i];
      if (i === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    }
    ctx.stroke();

    // 2. Hanging Red Cracker Tubes
    for (let i = 0; i < this.crackers.length; i++) {
      const c = this.crackers[i];
      if (c.exploded) continue; // Exploded nodes are already charred away

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);

      // Cracker body (crimson cylinder with gold band)
      ctx.fillStyle = '#d32f2f';
      ctx.fillRect(-4, -2, 8, 14);

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-4, 3, 8, 3); // Gold belly band

      // Fuse string
      ctx.strokeStyle = '#b0bec5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -2);
      ctx.lineTo(0, -6);
      ctx.stroke();

      ctx.restore();
    }

    ctx.restore();
  }
}
