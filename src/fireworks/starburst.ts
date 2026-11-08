import { ParticlePool } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { COLORS } from './fireworkColors';

/**
 * High-Yield Spherical Multicolored Starburst Shell
 * Features:
 * - Simultaneous radial expansion in vibrant hues: Gold, Deep Orange, Neon Pink, Electric Blue, Purple
 * - Secondary crackling crossette breaks
 * - Atmospheric smoke dispersion cloud
 * - Glowing particle trails and central plasma fireball
 */
export class Starburst implements FireworkEffect {
  public active: boolean = false;

  constructor(
    x: number,
    y: number,
    pool: ParticlePool,
    onSound?: SoundTriggerCallback
  ) {
    onSound?.('EXPLOSION', 1.45);

    // Multicolored spectrum palette
    const colorSpectrum = [
      COLORS.GOLD,
      COLORS.DEEP_ORANGE,
      COLORS.NEON_PINK,
      COLORS.ELECTRIC_BLUE,
      COLORS.PURPLE,
      COLORS.CYAN,
      COLORS.LEMON_YELLOW
    ];

    const primaryColor = colorSpectrum[Math.floor(Math.random() * colorSpectrum.length)];

    // 1. Massive Initial Concussive Flash
    pool.addFlash(x, y, 800, primaryColor, 0.9);

    // 2. Atmospheric Smoke Plume at blast center
    for (let s = 0; s < 14; s++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4.2;
      pool.spawn({
        kind: 'SMOKE',
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 0.4,
        color: COLORS.SMOKE_GRAY,
        fadeColor: COLORS.SMOKE_WARM,
        size: 24 + Math.random() * 16,
        life: 1.9 + Math.random() * 0.7
      });
    }

    // 3. Volumetric 460-Star Spherical Expansion
    const particleCount = 460;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Multi-speed power curve creates depth and spherical layering
      const speed = Math.pow(Math.random(), 0.58) * 19 + 3.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // Distribute rich festive spectrum
      const starColor = colorSpectrum[i % colorSpectrum.length];
      const isCore = Math.random() < 0.16;

      pool.spawn({
        kind: 'SPARK',
        x,
        y,
        vx,
        vy,
        color: isCore ? COLORS.WHITE_HOT : starColor,
        fadeColor: COLORS.GOLD,
        size: 4.0,
        life: 1.45 + Math.random() * 0.7,
        drag: 0.968,
        gravity: 0.08,
        flicker: true,
        crackle: Math.random() < 0.65, // Triggers secondary branching crackle burst
        trail: true
      });
    }

    // 4. Blinding Central Fireball Detonation
    for (let k = 0; k < 50; k++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8.5;
      pool.spawn({
        kind: 'SPARK',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS.WHITE_HOT,
        fadeColor: primaryColor,
        size: 9.5,
        life: 0.38,
        drag: 0.88,
        gravity: 0,
        trail: false
      });
    }
  }

  public update(): void {
    // Immediate one-shot effect
  }
}
