import { ParticlePool } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { COLORS, CHAKRI_COLORS } from './fireworkColors';

/**
 * Traditional Indian Spinning Chakri (Ground Zamin Chakkar)
 * Features:
 * - High-speed spinning disc with authentic festive concentric spiral patterns
 * - Tangential spark emission creating expanding pinwheel spiral arms
 * - Gradual rotational acceleration and dynamic ground light ring
 * - Sizzling multi-color sparks (magenta, cyan, yellow, gold) and atmospheric smoke
 */
export class Chakri implements FireworkEffect {
  public active: boolean = true;
  private x: number;
  private y: number;
  private onSound?: SoundTriggerCallback;

  private angle: number = 0;
  private angularVelocity: number = 6; // Starts gentle, accelerates
  private readonly MAX_ANGULAR_VELOCITY: number = 38;
  private radius: number = 34; // Radius of the chakri disc
  private lifeTime: number = 0;
  private smokeTimer: number = 0;
  private alpha: number = 0;

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

    this.lifeTime += dt;
    this.onSound?.('CHAKRI_LOOP');

    // Fade in base disc
    this.alpha = Math.min(1.0, this.alpha + dt * 5);

    // Gradual spin acceleration
    this.angularVelocity = Math.min(
      this.MAX_ANGULAR_VELOCITY,
      this.angularVelocity + dt * 14
    );

    // Update spin angle
    this.angle += this.angularVelocity * dt;

    // Ground ambient flash
    pool.addFlash(this.x, this.y, 260, COLORS.GOLD, 0.4);

    // 1. Tangential Spark Ejection (2 or 4 active jet nozzles on the disc rim)
    const nozzleCount = 4;
    const speedRatio = this.angularVelocity / this.MAX_ANGULAR_VELOCITY;
    const sparksPerNozzle = Math.max(2, Math.floor(speedRatio * 5));

    for (let n = 0; n < nozzleCount; n++) {
      const nozzleAngle = this.angle + (n * Math.PI * 2) / nozzleCount;
      const nozzleX = this.x + Math.cos(nozzleAngle) * this.radius;
      const nozzleY = this.y + Math.sin(nozzleAngle) * (this.radius * 0.45); // Elliptical ground perspective

      // Tangent vector
      const tangentAngle = nozzleAngle + Math.PI / 2;
      const baseSpeed = 12 + speedRatio * 18;

      const color = CHAKRI_COLORS[(n + Math.floor(this.lifeTime * 4)) % CHAKRI_COLORS.length];

      for (let s = 0; s < sparksPerNozzle; s++) {
        const spread = (Math.random() - 0.5) * 0.45;
        const speed = baseSpeed + (Math.random() - 0.5) * 8;
        const vx = Math.cos(tangentAngle + spread) * speed;
        // Apply slight perspective flattening to Y component
        const vy = Math.sin(tangentAngle + spread) * (speed * 0.55);

        pool.spawn({
          kind: 'SPARK',
          x: nozzleX,
          y: nozzleY,
          vx,
          vy,
          color: Math.random() < 0.25 ? COLORS.WHITE_HOT : color,
          fadeColor: COLORS.GOLD,
          size: 3.2 + Math.random() * 1.4,
          life: 0.45 + Math.random() * 0.35,
          drag: 0.94,
          gravity: 0.08,
          flicker: true,
          crackle: Math.random() < 0.3,
          trail: true
        });
      }
    }

    // 2. Rising ground smoke haze
    this.smokeTimer += dt;
    if (this.smokeTimer > 0.07) {
      this.smokeTimer = 0;
      pool.spawn({
        kind: 'SMOKE',
        x: this.x + (Math.random() - 0.5) * (this.radius * 2),
        y: this.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 1.8 + 0.6),
        color: COLORS.SMOKE_WARM,
        fadeColor: COLORS.SMOKE_GRAY,
        size: 16 + Math.random() * 10,
        life: 1.1 + Math.random() * 0.5
      });
    }
  }

  /**
   * Renders the spinning decorative Chakri disc with concentric spiral rings
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.active || this.alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    const cx = this.x;
    const cy = this.y;
    const rX = this.radius;
    const rY = this.radius * 0.42; // Ground perspective ellipse

    // 1. Floor burn / amber circular halo
    const floorGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rX * 2.2);
    floorGlow.addColorStop(0, 'rgba(255, 200, 0, 0.45)');
    floorGlow.addColorStop(0.4, 'rgba(255, 80, 0, 0.22)');
    floorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rX * 2.2, rY * 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Spinning Chakri body with perspective
    ctx.translate(cx, cy);
    ctx.scale(1, 0.42);
    ctx.rotate(this.angle);

    // Outer notched ring
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, rX, 0, Math.PI * 2);
    ctx.stroke();

    // Concentric spiral arms matching the festive reference image
    const rings = [
      { r: rX * 0.95, fill: '#ff1744' }, // Red outer
      { r: rX * 0.78, fill: '#d500f9' }, // Magenta
      { r: rX * 0.60, fill: '#00e5ff' }, // Cyan
      { r: rX * 0.42, fill: '#ffd600' }, // Yellow
      { r: rX * 0.24, fill: '#00c853' }  // Green core
    ];

    for (const ring of rings) {
      ctx.fillStyle = ring.fill;
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4 Curved spiral vanes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    for (let v = 0; v < 4; v++) {
      const a = (v * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const cpX = Math.cos(a + 0.6) * (rX * 0.6);
      const cpY = Math.sin(a + 0.6) * (rX * 0.6);
      const endX = Math.cos(a) * rX;
      const endY = Math.sin(a) * rX;
      ctx.quadraticCurveTo(cpX, cpY, endX, endY);
      ctx.stroke();
    }

    // Central white-hot center hub
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public stop(): void {
    this.active = false;
  }
}
