/**
 * Ultra High-Fidelity Pyrotechnic Particle Engine
 * Multi-pass additive bloom, volumetric motion streaks with trail history,
 * atmospheric smoke plumes, and dynamic ambient room illumination.
 */

export interface ParticleColor {
  r: number;
  g: number;
  b: number;
}

export type ParticleKind = 'SPARK' | 'SMOKE';

export interface Particle {
  active: boolean;
  kind: ParticleKind;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  trailHistory: { x: number; y: number }[];
  vx: number;
  vy: number;
  color: ParticleColor;
  fadeColor: ParticleColor;
  alpha: number;
  size: number;
  initialSize: number;
  life: number;
  maxLife: number;
  drag: number;
  gravity: number;
  flicker: boolean;
  crackle: boolean;
  trail: boolean;
}

export interface AmbientFlash {
  x: number;
  y: number;
  radius: number;
  color: ParticleColor;
  alpha: number;
  decay: number;
}

export class ParticlePool {
  private pool: Particle[] = [];
  public activeCount: number = 0;
  private readonly MAX_PARTICLES: number = 7500;
  public flashes: AmbientFlash[] = [];

  constructor() {
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.pool.push({
        active: false,
        kind: 'SPARK',
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        trailHistory: [],
        vx: 0,
        vy: 0,
        color: { r: 255, g: 255, b: 255 },
        fadeColor: { r: 255, g: 180, b: 0 },
        alpha: 1,
        size: 3,
        initialSize: 3,
        life: 1,
        maxLife: 1,
        drag: 0.98,
        gravity: 0.05,
        flicker: false,
        crackle: false,
        trail: true
      });
    }
  }

  public spawn(config: {
    kind?: ParticleKind;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: ParticleColor;
    fadeColor?: ParticleColor;
    size?: number;
    life: number;
    drag?: number;
    gravity?: number;
    flicker?: boolean;
    crackle?: boolean;
    trail?: boolean;
  }): Particle | null {
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const p = this.pool[i];
      if (!p.active) {
        p.active = true;
        p.kind = config.kind ?? 'SPARK';
        p.x = config.x;
        p.y = config.y;
        p.prevX = config.x;
        p.prevY = config.y;
        p.trailHistory.length = 0;
        p.trailHistory.push({ x: config.x, y: config.y });
        p.vx = config.vx;
        p.vy = config.vy;
        p.color = config.color;
        p.fadeColor = config.fadeColor || { r: 255, g: 160, b: 40 };
        const sz = config.size ?? (p.kind === 'SMOKE' ? 12 : 3.2);
        p.size = sz;
        p.initialSize = sz;
        p.life = config.life;
        p.maxLife = config.life;
        p.alpha = p.kind === 'SMOKE' ? 0.22 : 1;
        p.drag = config.drag ?? (p.kind === 'SMOKE' ? 0.96 : 0.975);
        p.gravity = config.gravity ?? (p.kind === 'SMOKE' ? -0.04 : 0.08);
        p.flicker = config.flicker ?? false;
        p.crackle = config.crackle ?? false;
        p.trail = config.trail ?? true;
        this.activeCount++;
        return p;
      }
    }
    return null;
  }

  public addFlash(x: number, y: number, radius: number, color: ParticleColor, intensity: number = 0.5): void {
    this.flashes.push({
      x,
      y,
      radius,
      color,
      alpha: Math.min(1.0, intensity),
      decay: 3.5
    });
  }

  private activeSparks: Particle[] = [];
  private activeSmoke: Particle[] = [];

  public update(dt: number, onCrackle?: (x: number, y: number, color: ParticleColor) => void): void {
    let count = 0;
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        if (p.crackle && onCrackle && Math.random() < 0.7) {
          onCrackle(p.x, p.y, p.color);
        }
        continue;
      }

      count++;
      p.prevX = p.x;
      p.prevY = p.y;

      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;

      if (p.kind === 'SMOKE') {
        // Smoke expands and drifts upwards softly
        p.size += dt * 18;
        const progress = 1 - p.life / p.maxLife;
        // Fade in quickly, then linger and gently dissipate
        if (progress < 0.2) {
          p.alpha = (progress / 0.2) * 0.24;
        } else {
          p.alpha = Math.max(0, (1 - progress) * 0.24);
        }
      } else {
        // High-luminance plateau for sparks
        const lifeRatio = p.life / p.maxLife;
        p.alpha = lifeRatio > 0.2 ? 1.0 : Math.pow(lifeRatio / 0.2, 0.75);

        if (p.flicker) {
          p.alpha = Math.min(1.0, p.alpha * (0.8 + Math.random() * 0.4));
        }

        // Maintain fixed trail history for smooth ribbons
        if (p.trail) {
          p.trailHistory.unshift({ x: p.x, y: p.y });
          if (p.trailHistory.length > 5) {
            p.trailHistory.pop();
          }
        }
      }
    }
    this.activeCount = count;

    for (let f = this.flashes.length - 1; f >= 0; f--) {
      const flash = this.flashes[f];
      flash.alpha -= flash.decay * dt;
      if (flash.alpha <= 0) {
        this.flashes.splice(f, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.activeCount === 0 && this.flashes.length === 0) {
      return;
    }

    ctx.save();

    // 1. Dynamic Ambient Light Flash (Illuminates room, sky, and user)
    if (this.flashes.length > 0) {
      ctx.globalCompositeOperation = 'lighter';
      for (const flash of this.flashes) {
        if (flash.alpha <= 0.01) continue;
        const grad = ctx.createRadialGradient(
          flash.x, flash.y, 0,
          flash.x, flash.y, flash.radius
        );
        const { r, g, b } = flash.color;
        grad.addColorStop(0,    `rgba(${r},${g},${b},${(flash.alpha * 0.75).toFixed(3)})`);
        grad.addColorStop(0.3,  `rgba(${r},${g},${b},${(flash.alpha * 0.38).toFixed(3)})`);
        grad.addColorStop(0.65, `rgba(${r},${g},${b},${(flash.alpha * 0.12).toFixed(3)})`);
        grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Partition active particles by kind
    const sparks = this.activeSparks;
    const smoke = this.activeSmoke;
    sparks.length = 0;
    smoke.length = 0;

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const p = this.pool[i];
      if (p.active && p.alpha > 0.01) {
        if (p.kind === 'SMOKE') {
          smoke.push(p);
        } else {
          sparks.push(p);
        }
      }
    }

    // 2. Atmospheric Smoke Plumes (Soft translucent clouds behind sparks)
    if (smoke.length > 0) {
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < smoke.length; i++) {
        const s = smoke[i];
        const rad = Math.max(4, s.size);
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad);
        const { r, g, b } = s.color;
        grad.addColorStop(0,   `rgba(${r},${g},${b},${(s.alpha * 0.9).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${(s.alpha * 0.45).toFixed(3)})`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const sparkCount = sparks.length;
    if (sparkCount === 0) {
      ctx.restore();
      return;
    }

    // 3. Pass A: Luminous Volumetric Bloom Halo (Additive Light)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < sparkCount; i++) {
      const p = sparks[i];
      const progress = 1 - p.life / p.maxLife;
      const r = Math.round(p.color.r + (p.fadeColor.r - p.color.r) * progress);
      const g = Math.round(p.color.g + (p.fadeColor.g - p.color.g) * progress);
      const b = Math.round(p.color.b + (p.fadeColor.b - p.color.b) * progress);

      ctx.fillStyle = `rgba(${r},${g},${b},${(p.alpha * 0.45).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3.4 * p.alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Pass B: Saturated Solid Streaks with Trail History & Burning Core (Source-Over)
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < sparkCount; i++) {
      const p = sparks[i];
      const progress = 1 - p.life / p.maxLife;
      const r = Math.round(p.color.r + (p.fadeColor.r - p.color.r) * progress);
      const g = Math.round(p.color.g + (p.fadeColor.g - p.color.g) * progress);
      const b = Math.round(p.color.b + (p.fadeColor.b - p.color.b) * progress);

      const colorStr = `rgba(${r},${g},${b},${p.alpha.toFixed(2)})`;

      // Smooth multi-segment ribbon trail if history exists
      if (p.trail && p.trailHistory.length > 1) {
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = Math.max(2.2, p.size * p.alpha * 1.15);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p.trailHistory[0].x, p.trailHistory[0].y);
        for (let h = 1; h < p.trailHistory.length; h++) {
          ctx.lineTo(p.trailHistory[h].x, p.trailHistory[h].y);
        }
        ctx.stroke();
      } else if (p.trail) {
        ctx.strokeStyle = colorStr;
        ctx.lineWidth = Math.max(2.2, p.size * p.alpha * 1.15);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      // Saturated burning ember body
      ctx.fillStyle = colorStr;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.5 * p.alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Pass C: White-Hot Plasma Core & Specular Sparkle (Additive Light)
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < sparkCount; i++) {
      const p = sparks[i];
      const progress = 1 - p.life / p.maxLife;
      const r = Math.round(p.color.r + (p.fadeColor.r - p.color.r) * progress);
      const g = Math.round(p.color.g + (p.fadeColor.g - p.color.g) * progress);
      const b = Math.round(p.color.b + (p.fadeColor.b - p.color.b) * progress);

      // Inner chromatic glow
      ctx.fillStyle = `rgba(${r},${g},${b},${(p.alpha * 0.85).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.8 * p.alpha, 0, Math.PI * 2);
      ctx.fill();

      // Blinding white-hot core spark
      ctx.fillStyle = `rgba(255,255,255,${(p.alpha * 0.98).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.3, p.size * 0.6 * p.alpha), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  public clear(): void {
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.pool[i].active = false;
      this.pool[i].trailHistory.length = 0;
    }
    this.activeCount = 0;
    this.flashes = [];
  }
}
