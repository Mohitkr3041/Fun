import { ParticlePool } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { COLORS } from './fireworkColors';

/**
 * Handheld Diwali Phooljhadi (Magnesium Sparkler)
 * Features:
 * - Floating golden sparkling aura / light ring around the conductor's hand (as in reference image)
 * - Sizzling white-hot magnesium core node
 * - Violent branching needle-sharp golden sparks with glowing trails
 * - Lingering light-painting air trail ribbons
 */
export class Sparkler implements FireworkEffect {
  public active: boolean = true;
  private x: number;
  private y: number;
  private onSound?: SoundTriggerCallback;
  private auraAngle: number = 0;
  private auraAlpha: number = 0;

  constructor(x: number, y: number, onSound?: SoundTriggerCallback) {
    this.x = x;
    this.y = y;
    this.onSound = onSound;
  }

  public updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public update(dt: number, pool: ParticlePool): void {
    if (!this.active) return;

    this.onSound?.('SPARKLER_LOOP');
    this.auraAngle += dt * 3.5;
    this.auraAlpha = Math.min(1.0, this.auraAlpha + dt * 4);

    // 1. Intense golden hand illumination
    pool.addFlash(this.x, this.y, 240, COLORS.GOLD, 0.42);

    // 2. Violent High-Speed Needle Sparks (36 per frame)
    const sparkCount = 36;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 15 + 4.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const isWhite = Math.random() < 0.42;

      pool.spawn({
        kind: 'SPARK',
        x: this.x + (Math.random() - 0.5) * 6,
        y: this.y + (Math.random() - 0.5) * 6,
        vx,
        vy,
        color: isWhite ? COLORS.WHITE_HOT : COLORS.GOLD,
        fadeColor: isWhite ? COLORS.GOLD : COLORS.AMBER,
        size: 2.8 + Math.random() * 1.8,
        life: 0.65 + Math.random() * 0.45,
        drag: 0.945,
        gravity: 0.12,
        flicker: true,
        crackle: true,
        trail: true
      });
    }

    // 3. Lingering Light-Painting Air Trail (drifts slightly and hangs in air)
    for (let t = 0; t < 5; t++) {
      pool.spawn({
        kind: 'SPARK',
        x: this.x + (Math.random() - 0.5) * 12,
        y: this.y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9 + 0.25,
        color: COLORS.GOLD,
        fadeColor: COLORS.DEEP_ORANGE,
        size: 3.6,
        life: 1.2 + Math.random() * 0.6,
        drag: 0.98,
        gravity: 0.02,
        flicker: true,
        crackle: false,
        trail: true
      });
    }

    // 4. Burning Magnesium Core Flame
    for (let j = 0; j < 5; j++) {
      pool.spawn({
        kind: 'SPARK',
        x: this.x + (Math.random() - 0.5) * 6,
        y: this.y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: COLORS.WHITE_HOT,
        fadeColor: COLORS.GOLD,
        size: 9.5,
        life: 0.16,
        drag: 0.88,
        gravity: 0,
        trail: false
      });
    }

    // 5. Subtle sparkler wire smoke wisps
    if (Math.random() < 0.4) {
      pool.spawn({
        kind: 'SMOKE',
        x: this.x + (Math.random() - 0.5) * 8,
        y: this.y - 4,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -(Math.random() * 2 + 1),
        color: COLORS.SMOKE_WARM,
        fadeColor: COLORS.SMOKE_GRAY,
        size: 11,
        life: 0.9
      });
    }
  }

  /**
   * Renders the glowing golden light ring / aura around the conductor's hand
   * (faithfully recreating the magical hand aura in the reference image)
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.auraAlpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.auraAlpha;

    const hx = this.x;
    const hy = this.y;
    const ringRadius = 55;

    // 1. Soft golden aura glow
    const auraGrad = ctx.createRadialGradient(hx, hy, ringRadius * 0.5, hx, hy, ringRadius * 1.6);
    auraGrad.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
    auraGrad.addColorStop(0.5, 'rgba(255, 140, 0, 0.18)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(hx, hy, ringRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Orbiting golden spark particles on the ring
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(this.auraAngle);

    ctx.strokeStyle = 'rgba(255, 220, 100, 0.65)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing orbiting beads
    for (let b = 0; b < 6; b++) {
      const a = (b * Math.PI * 2) / 6;
      const bx = Math.cos(a) * ringRadius;
      const by = Math.sin(a) * ringRadius;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  public stop(): void {
    this.active = false;
  }
}
