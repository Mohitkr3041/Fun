import { ParticlePool } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { Rocket } from './rocket';
import { Starburst } from './starburst';
import { Anar } from './anar';
import { COLORS } from './fireworkColors';

/**
 * Grand Finale Pyrotechnic Spectacle
 * Features:
 * - Staggered multi-rocket salvos launched from all sides of the screen
 * - Simultaneous ground Anar volcanic fountains
 * - High-altitude multicolored Starburst shells
 * - Climax with blinding celebratory golden shower rain
 */
export class GrandFinale implements FireworkEffect {
  public active: boolean = true;
  private duration: number = 4.2;
  private timer: number = 0;
  private rocketInterval: number = 0.22;
  private nextRocketTime: number = 0;
  private nextStarburstTime: number = 0.6;
  private screenW: number;
  private screenH: number;
  private onSound?: SoundTriggerCallback;

  private effects: FireworkEffect[] = [];
  private climaxTriggered: boolean = false;

  constructor(
    screenW: number,
    screenH: number,
    onSound?: SoundTriggerCallback
  ) {
    this.screenW = screenW;
    this.screenH = screenH;
    this.onSound = onSound;
    this.onSound?.('FINALE');

    // Flank the screen with two celebratory ground Anars
    this.effects.push(new Anar(screenW * 0.18, screenH * 0.88, onSound));
    this.effects.push(new Anar(screenW * 0.82, screenH * 0.88, onSound));

    this.spawnRocketSalvo();
  }

  private spawnRocketSalvo(): void {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const launchX = this.screenW * (0.1 + Math.random() * 0.8);
      const launchY = this.screenH;
      const targetY = this.screenH * (0.1 + Math.random() * 0.35);

      this.effects.push(new Rocket(launchX, launchY, targetY, this.onSound));
    }
  }

  public update(dt: number, pool: ParticlePool): void {
    this.timer += dt;

    // 1. Staggered rocket launches
    if (this.timer < this.duration) {
      if (this.timer >= this.nextRocketTime) {
        this.nextRocketTime = this.timer + this.rocketInterval + Math.random() * 0.08;
        this.spawnRocketSalvo();
      }

      // 2. Periodic Starburst Shells in sky
      if (this.timer >= this.nextStarburstTime) {
        this.nextStarburstTime = this.timer + 0.85 + Math.random() * 0.4;
        const burstX = this.screenW * (0.2 + Math.random() * 0.6);
        const burstY = this.screenH * (0.15 + Math.random() * 0.25);
        this.effects.push(new Starburst(burstX, burstY, pool, this.onSound));
      }
    }

    // 3. Grand Golden Shower Climax
    if (this.timer > 2.6 && !this.climaxTriggered) {
      this.climaxTriggered = true;
      pool.addFlash(this.screenW / 2, this.screenH * 0.3, 1000, COLORS.GOLD, 1.0);

      // Rain 250 golden willow stars from the upper sky
      for (let g = 0; g < 250; g++) {
        const x = this.screenW * (0.1 + Math.random() * 0.8);
        const y = this.screenH * (0.1 + Math.random() * 0.25);
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 6 + 1;

        pool.spawn({
          kind: 'SPARK',
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd + 2.0,
          color: COLORS.GOLD,
          fadeColor: COLORS.WHITE_HOT,
          size: 3.5,
          life: 2.2 + Math.random() * 0.8,
          drag: 0.98,
          gravity: 0.12,
          flicker: true,
          crackle: Math.random() < 0.4,
          trail: true
        });
      }
    }

    // Update child fireworks
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.update(dt, pool);
      if (!e.active) {
        this.effects.splice(i, 1);
      }
    }

    if (this.timer >= this.duration && this.effects.length === 0) {
      this.active = false;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (const e of this.effects) {
      e.render?.(ctx);
    }

    // Render the canvas-recorded Happy Diwali centerpiece
    if (this.timer > 0.25 && this.timer < 4.2) {
      const bannerAlpha = Math.min(1.0, (this.timer - 0.25) * 4);
      const fadeOut = this.timer > 3.6 ? Math.max(0, (4.2 - this.timer) / 0.6) : 1;
      const alpha = bannerAlpha * fadeOut;
      if (alpha > 0.01) {
        this.renderCanvasBanner(ctx, alpha);
      }
    }
  }

  private renderCanvasBanner(ctx: CanvasRenderingContext2D, alpha: number): void {
    const cx = this.screenW / 2;
    const cy = this.screenH / 2;
    const bannerW = Math.min(540, this.screenW * 0.88);
    const bannerH = 140;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Ambient Golden Halo
    const aura = ctx.createRadialGradient(cx, cy, 40, cx, cy, bannerW * 0.65);
    aura.addColorStop(0, 'rgba(255, 215, 0, 0.45)');
    aura.addColorStop(0.5, 'rgba(255, 140, 0, 0.2)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, bannerW * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rotating Mandala Ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.timer * 0.8);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, bannerH * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Ornate Glass Banner Background
    ctx.fillStyle = 'rgba(14, 3, 10, 0.84)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - bannerW / 2, cy - bannerH / 2, bannerW, bannerH, 20);
    ctx.fill();
    ctx.stroke();

    // 4. Pretitle: ✦ SHUBH DEEPAVALI ✦
    ctx.fillStyle = '#ffe082';
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦ SHUBH DEEPAVALI ✦', cx, cy - bannerH * 0.26);

    // 5. Main Title: HAPPY DIWALI
    const fontSize = Math.min(42, Math.max(26, Math.floor(bannerW * 0.082)));
    ctx.font = `900 ${fontSize}px "Rozha One", "Cinzel Decorative", serif`;
    const textGrad = ctx.createLinearGradient(cx - 150, 0, cx + 150, 0);
    textGrad.addColorStop(0, '#ffffff');
    textGrad.addColorStop(0.45, '#ffd700');
    textGrad.addColorStop(1, '#ff9100');
    ctx.fillStyle = textGrad;
    ctx.shadowColor = 'rgba(255, 200, 0, 0.7)';
    ctx.shadowBlur = 18;
    ctx.fillText('HAPPY DIWALI', cx, cy + 2);
    ctx.shadowBlur = 0;

    // 6. Subtitle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.fillText('May your world blaze with light, joy & prosperity', cx, cy + bannerH * 0.28);

    ctx.restore();
  }
}
