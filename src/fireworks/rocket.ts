import { ParticlePool, ParticleColor } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { COLORS, getRandomColor } from './fireworkColors';

/**
 * High-Altitude Aerial Rocket
 * Launches with a dense glowing plume, lateral sparks, and smoke trail,
 * detonating into a massive multicolored spherical break with cascading stars and smoke.
 */
export class Rocket implements FireworkEffect {
  public active: boolean = true;
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private targetY: number;
  private color: ParticleColor;
  private trailTimer: number = 0;
  private onSound?: SoundTriggerCallback;

  constructor(
    startX: number,
    startY: number,
    targetY: number,
    onSound?: SoundTriggerCallback
  ) {
    this.x = startX;
    this.y = startY;
    // Slight authentic parabolic curve
    this.vx = (Math.random() - 0.5) * 2.5;
    this.vy = -(21 + Math.random() * 5); // Fast upward launch velocity
    this.targetY = targetY;
    this.color = getRandomColor();
    this.onSound = onSound;

    this.onSound?.('ROCKET_LAUNCH');
  }

  public update(dt: number, pool: ParticlePool): void {
    if (!this.active) return;

    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.32; // Gravity slows the ascent

    this.trailTimer += dt;
    if (this.trailTimer > 0.012) {
      this.trailTimer = 0;

      // 1. Dense incandescent golden plume
      for (let i = 0; i < 7; i++) {
        pool.spawn({
          kind: 'SPARK',
          x: this.x + (Math.random() - 0.5) * 5,
          y: this.y + Math.random() * 4,
          vx: (Math.random() - 0.5) * 2.4 - this.vx * 0.2,
          vy: Math.random() * 6 + 3,
          color: COLORS.GOLD,
          fadeColor: COLORS.DEEP_ORANGE,
          size: 3.2,
          life: 0.55 + Math.random() * 0.35,
          drag: 0.94,
          gravity: 0.12,
          trail: true
        });
      }

      // 2. Lateral flying sparks
      if (Math.random() < 0.6) {
        pool.spawn({
          kind: 'SPARK',
          x: this.x,
          y: this.y,
          vx: (Math.random() - 0.5) * 8,
          vy: Math.random() * 4 + 1,
          color: COLORS.WHITE_HOT,
          fadeColor: COLORS.AMBER,
          size: 2.2,
          life: 0.35,
          drag: 0.92,
          gravity: 0.15,
          flicker: true
        });
      }

      // 3. Ascent smoke trail
      if (Math.random() < 0.35) {
        pool.spawn({
          kind: 'SMOKE',
          x: this.x + (Math.random() - 0.5) * 6,
          y: this.y + 12,
          vx: (Math.random() - 0.5) * 0.8,
          vy: Math.random() * 1.5 + 0.5,
          color: COLORS.SMOKE_GRAY,
          fadeColor: COLORS.SMOKE_WARM,
          size: 10,
          life: 1.1 + Math.random() * 0.5
        });
      }
    }

    // Rocket head blazing plasma node
    pool.spawn({
      kind: 'SPARK',
      x: this.x,
      y: this.y,
      vx: 0,
      vy: 0,
      color: COLORS.WHITE_HOT,
      fadeColor: COLORS.GOLD,
      size: 8.5,
      life: 0.08,
      drag: 0.9,
      gravity: 0,
      trail: false
    });

    if (this.y <= this.targetY || this.vy >= -1) {
      this.detonate(pool);
      this.active = false;
    }
  }

  private detonate(pool: ParticlePool): void {
    this.onSound?.('EXPLOSION', 1.35);

    // 1. Concussive light flash
    pool.addFlash(this.x, this.y, 750, this.color, 0.85);

    // 2. Atmospheric explosion smoke cloud
    for (let s = 0; s < 12; s++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 3.5;
      pool.spawn({
        kind: 'SMOKE',
        x: this.x + (Math.random() - 0.5) * 20,
        y: this.y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 0.5,
        color: COLORS.SMOKE_GRAY,
        fadeColor: COLORS.SMOKE_WARM,
        size: 22 + Math.random() * 14,
        life: 1.8 + Math.random() * 0.8
      });
    }

    // 3. Spherical Multicolored Star Shell
    const particleCount = 380 + Math.floor(Math.random() * 90);
    const isWillow = Math.random() < 0.45;
    const burstColor = isWillow ? COLORS.GOLD : this.color;
    const secondaryColor = isWillow ? COLORS.AMBER : COLORS.WHITE_HOT;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = isWillow
        ? Math.pow(Math.random(), 0.55) * 15 + 3.5
        : Math.pow(Math.random(), 0.55) * 18 + 4.5;

      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      pool.spawn({
        kind: 'SPARK',
        x: this.x,
        y: this.y,
        vx,
        vy,
        color: Math.random() < 0.22 ? COLORS.WHITE_HOT : burstColor,
        fadeColor: secondaryColor,
        size: isWillow ? 3.4 : 4.0,
        life: isWillow ? 2.2 + Math.random() * 0.8 : 1.5 + Math.random() * 0.6,
        drag: isWillow ? 0.972 : 0.965,
        gravity: isWillow ? 0.16 : 0.1,
        flicker: true,
        crackle: Math.random() < 0.5,
        trail: true
      });
    }

    // 4. Blinding central fireball flash
    for (let j = 0; j < 45; j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8.5;
      pool.spawn({
        kind: 'SPARK',
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS.WHITE_HOT,
        fadeColor: burstColor,
        size: 9.5,
        life: 0.38,
        drag: 0.88,
        gravity: 0,
        trail: false
      });
    }
  }
}
