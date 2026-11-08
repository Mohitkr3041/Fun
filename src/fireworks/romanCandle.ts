import { ParticlePool, ParticleColor } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { COLORS } from './fireworkColors';

interface CandleBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: ParticleColor;
  life: number;
  maxLife: number;
}

/**
 * Roman Candle Multi-Shot Pyrotechnic Battery
 * Features:
 * - Timed successive launch of incandescent colored stars
 * - Luminous comet tails and smoke plumes
 * - Detonation of each star into a starburst cluster with mini smoke puff
 * - Decorative launcher battery rendering
 */
export class RomanCandle implements FireworkEffect {
  public active: boolean = true;
  private x: number;
  private y: number;
  private onSound?: SoundTriggerCallback;

  private balls: CandleBall[] = [];
  private shotsRemaining: number = 7;
  private shotTimer: number = 0;
  private readonly SHOT_INTERVAL: number = 0.24;
  private tubeAlpha: number = 1.0;

  private colorSequence = [
    COLORS.CRIMSON,
    COLORS.ELECTRIC_BLUE,
    COLORS.GOLD,
    COLORS.EMERALD,
    COLORS.NEON_PINK,
    COLORS.PURPLE,
    COLORS.CYAN
  ];

  constructor(x: number, y: number, onSound?: SoundTriggerCallback) {
    this.x = x;
    this.y = y;
    this.onSound = onSound;
    this.fireSingleShot();
  }

  public updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  private fireSingleShot(): void {
    if (this.shotsRemaining <= 0) return;

    this.onSound?.('ROMAN_POP');
    const colorIdx = 7 - this.shotsRemaining;
    const color = this.colorSequence[colorIdx % this.colorSequence.length];
    this.shotsRemaining--;

    // Launch with slight angular fan
    const angleOffset = (colorIdx - 3) * 0.08;
    const speed = 17 + Math.random() * 4;

    this.balls.push({
      x: this.x + (colorIdx - 3) * 6,
      y: this.y - 20,
      vx: Math.sin(angleOffset) * speed,
      vy: -Math.cos(angleOffset) * speed,
      color,
      life: 0.72 + Math.random() * 0.2,
      maxLife: 0.72 + Math.random() * 0.2
    });
  }

  public update(dt: number, pool: ParticlePool): void {
    if (this.shotsRemaining > 0) {
      this.shotTimer += dt;
      if (this.shotTimer >= this.SHOT_INTERVAL) {
        this.shotTimer = 0;
        this.fireSingleShot();
      }
    } else {
      this.tubeAlpha = Math.max(0, this.tubeAlpha - dt * 1.5);
    }

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      b.life -= dt;
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.24; // Gravity

      // 1. Incandescent Comet Head
      pool.spawn({
        kind: 'SPARK',
        x: b.x,
        y: b.y,
        vx: 0,
        vy: 0,
        color: COLORS.WHITE_HOT,
        fadeColor: b.color,
        size: 7.0,
        life: 0.08,
        drag: 0.9,
        gravity: 0,
        trail: false
      });

      // 2. Glowing comet trail & sparks
      for (let j = 0; j < 5; j++) {
        pool.spawn({
          kind: 'SPARK',
          x: b.x + (Math.random() - 0.5) * 4,
          y: b.y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 2 - b.vx * 0.15,
          vy: Math.random() * 3 + 1,
          color: b.color,
          fadeColor: COLORS.GOLD,
          size: 3.2,
          life: 0.35 + Math.random() * 0.15,
          drag: 0.94,
          gravity: 0.08,
          trail: true
        });
      }

      // 3. Smoke puff along comet trajectory
      if (Math.random() < 0.25) {
        pool.spawn({
          kind: 'SMOKE',
          x: b.x,
          y: b.y + 6,
          vx: (Math.random() - 0.5) * 0.8,
          vy: Math.random() * 1.2,
          color: COLORS.SMOKE_GRAY,
          fadeColor: COLORS.SMOKE_WARM,
          size: 8,
          life: 0.8
        });
      }

      if (b.life <= 0 || b.vy >= 0) {
        this.detonateBall(b, pool);
        this.balls.splice(i, 1);
      }
    }

    if (this.shotsRemaining <= 0 && this.balls.length === 0) {
      this.active = false;
    }
  }

  private detonateBall(b: CandleBall, pool: ParticlePool): void {
    this.onSound?.('EXPLOSION', 0.65);
    pool.addFlash(b.x, b.y, 320, b.color, 0.55);

    // Burst smoke puff
    for (let s = 0; s < 4; s++) {
      pool.spawn({
        kind: 'SMOKE',
        x: b.x,
        y: b.y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5 - 0.3,
        color: COLORS.SMOKE_GRAY,
        fadeColor: COLORS.SMOKE_WARM,
        size: 14 + Math.random() * 8,
        life: 1.2
      });
    }

    // Star-shaped crackling cluster (52 stars)
    for (let i = 0; i < 52; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8.5 + 2.8;
      pool.spawn({
        kind: 'SPARK',
        x: b.x,
        y: b.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() < 0.28 ? COLORS.WHITE_HOT : b.color,
        fadeColor: COLORS.GOLD,
        size: 3.4,
        life: 0.9 + Math.random() * 0.4,
        drag: 0.958,
        gravity: 0.09,
        flicker: true,
        crackle: Math.random() < 0.5,
        trail: true
      });
    }
  }

  /**
   * Renders the festive multi-tube candle battery
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (this.tubeAlpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.tubeAlpha;

    const bx = this.x;
    const by = this.y;

    // Tube battery container
    ctx.lineWidth = 3;
    const tubeColors = ['#d500f9', '#00e5ff', '#ffd600'];

    for (let t = -1; t <= 1; t++) {
      ctx.save();
      ctx.translate(bx + t * 9, by);
      ctx.rotate(t * 0.12);

      // Tube body
      ctx.fillStyle = tubeColors[t + 1];
      ctx.fillRect(-3.5, -34, 7, 34);
      ctx.strokeStyle = '#ffd700';
      ctx.strokeRect(-3.5, -34, 7, 34);

      // Gold stars / chevron decoration on tube
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -22, 4, 3);
      ctx.fillRect(-2, -12, 4, 3);

      ctx.restore();
    }

    ctx.restore();
  }
}
