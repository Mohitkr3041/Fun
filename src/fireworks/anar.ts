import { ParticlePool } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { COLORS } from './fireworkColors';

/**
 * 4-Tier Volcanic Anar (Indian Flowerpot) Engine
 * Features:
 * - Festive decorated conical earthenware base on the ground
 * - Intense molten throat jet
 * - Dense towering sodium gold vertical plume
 * - Graceful weeping willow umbrella canopy drooping under gravity
 * - Crackling titanium flower sputters
 * - Soft rising smoke haze
 */
export class Anar implements FireworkEffect {
  public active: boolean = true;
  private x: number;
  private y: number;
  private onSound?: SoundTriggerCallback;
  private baseAlpha: number = 0;
  private smokeTimer: number = 0;

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

    this.onSound?.('ANAR_LOOP');
    this.baseAlpha = Math.min(1.0, this.baseAlpha + dt * 4);

    // 1. Dynamic golden light pulsing over user and floor
    pool.addFlash(this.x, this.y - 70, 360, COLORS.GOLD, 0.48);

    // 2. Rising atmospheric smoke puffs
    this.smokeTimer += dt;
    if (this.smokeTimer > 0.08) {
      this.smokeTimer = 0;
      pool.spawn({
        kind: 'SMOKE',
        x: this.x + (Math.random() - 0.5) * 16,
        y: this.y - 30,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2 + 1.2),
        color: COLORS.SMOKE_WARM,
        fadeColor: COLORS.SMOKE_GRAY,
        size: 14 + Math.random() * 8,
        life: 1.2 + Math.random() * 0.4
      });
    }

    // ========================================================
    // TIER 1: Blinding White Molten Throat Jet
    // ========================================================
    const jetCount = 14;
    for (let j = 0; j < jetCount; j++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.12; // Tight vertical jet
      const speed = 28 + Math.random() * 11;
      pool.spawn({
        kind: 'SPARK',
        x: this.x + (Math.random() - 0.5) * 6,
        y: this.y - 35,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.2,
        vy: Math.sin(angle) * speed,
        color: COLORS.WHITE_HOT,
        fadeColor: COLORS.GOLD,
        size: 5.4,
        life: 0.35 + Math.random() * 0.15,
        drag: 0.95,
        gravity: 0.16,
        trail: true
      });
    }

    // ========================================================
    // TIER 2: Towering Sodium Gold Plume
    // ========================================================
    const plumeCount = 30;
    for (let p = 0; p < plumeCount; p++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.34;
      const speed = 21 + Math.random() * 13;
      const isWhite = Math.random() < 0.28;

      pool.spawn({
        kind: 'SPARK',
        x: this.x + (Math.random() - 0.5) * 10,
        y: this.y - 30,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed,
        color: isWhite ? COLORS.WHITE_HOT : COLORS.GOLD,
        fadeColor: COLORS.AMBER,
        size: 3.6,
        life: 0.8 + Math.random() * 0.4,
        drag: 0.965,
        gravity: 0.38,
        flicker: true,
        crackle: Math.random() < 0.22,
        trail: true
      });
    }

    // ========================================================
    // TIER 3: Weeping Willow Umbrella Canopy
    // Parabolic drooping branches cascading outward
    // ========================================================
    const willowCount = 26;
    for (let w = 0; w < willowCount; w++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.92;
      const speed = 15 + Math.random() * 12;

      pool.spawn({
        kind: 'SPARK',
        x: this.x + (Math.random() - 0.5) * 12,
        y: this.y - 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS.GOLD,
        fadeColor: COLORS.DEEP_ORANGE,
        size: 3.2,
        life: 1.0 + Math.random() * 0.55,
        drag: 0.97,
        gravity: 0.46, // Heavy gravity curves into cascading branches
        flicker: true,
        crackle: Math.random() < 0.25,
        trail: true
      });
    }

    // ========================================================
    // TIER 4: Titanium Flower Flakes
    // Perimeter stars that crackle into secondary sparks
    // ========================================================
    const flowerCount = 9;
    for (let f = 0; f < flowerCount; f++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.05;
      const speed = 13 + Math.random() * 11;

      pool.spawn({
        kind: 'SPARK',
        x: this.x + (Math.random() - 0.5) * 8,
        y: this.y - 30,
        vx: Math.cos(angle) * speed * 1.1,
        vy: Math.sin(angle) * speed,
        color: COLORS.WHITE_HOT,
        fadeColor: COLORS.AMBER,
        size: 3.8,
        life: 0.7 + Math.random() * 0.35,
        drag: 0.955,
        gravity: 0.42,
        flicker: true,
        crackle: true,
        trail: true
      });
    }
  }

  /**
   * Renders the traditional decorated conical Anar base on the ground
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.baseAlpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.baseAlpha;

    const bx = this.x;
    const by = this.y;
    const coneW = 46;
    const coneH = 48;

    // 1. Soft glowing ground contact shadow & amber light pool
    const floorGlow = ctx.createRadialGradient(bx, by + 4, 0, bx, by + 4, 60);
    floorGlow.addColorStop(0, 'rgba(255, 170, 0, 0.45)');
    floorGlow.addColorStop(0.5, 'rgba(255, 100, 0, 0.2)');
    floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(bx, by + 4, 55, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Conical Body (Traditional festive green & terracotta)
    ctx.beginPath();
    ctx.moveTo(bx - coneW / 2, by);
    ctx.lineTo(bx - coneW * 0.16, by - coneH);
    ctx.lineTo(bx + coneW * 0.16, by - coneH);
    ctx.lineTo(bx + coneW / 2, by);
    ctx.closePath();

    const coneGrad = ctx.createLinearGradient(bx - coneW / 2, by, bx + coneW / 2, by);
    coneGrad.addColorStop(0, '#1b5e20');
    coneGrad.addColorStop(0.35, '#2e7d32');
    coneGrad.addColorStop(0.65, '#43a047');
    coneGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = coneGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 3. Festive decorative red waistband
    ctx.beginPath();
    ctx.moveTo(bx - coneW * 0.38, by - coneH * 0.35);
    ctx.lineTo(bx - coneW * 0.24, by - coneH * 0.65);
    ctx.lineTo(bx + coneW * 0.24, by - coneH * 0.65);
    ctx.lineTo(bx + coneW * 0.38, by - coneH * 0.35);
    ctx.closePath();
    ctx.fillStyle = '#d32f2f';
    ctx.fill();
    ctx.strokeStyle = '#ffe082';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 4. Gold decorative flower / dot pattern
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(bx, by - coneH * 0.5, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx - 10, by - coneH * 0.48, 2.5, 0, Math.PI * 2);
    ctx.arc(bx + 10, by - coneH * 0.48, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Blazing throat nozzle ring
    ctx.fillStyle = '#fff9c4';
    ctx.beginPath();
    ctx.ellipse(bx, by - coneH, coneW * 0.18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  public stop(): void {
    this.active = false;
  }
}
