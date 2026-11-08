import { ParticlePool, ParticleColor } from '../particles/particle';
import { FireworkEffect, SoundTriggerCallback } from './fireworkTypes';
import { Rocket } from './rocket';
import { Anar } from './anar';
import { Chakri } from './chakri';
import { Starburst } from './starburst';
import { RomanCandle } from './romanCandle';
import { Sparkler } from './sparkler';
import { ThousandWala } from './thousandWala';
import { GrandFinale } from './grandFinale';
import { DetectedGesture } from '../vision/gestureTypes';
import { COLORS } from './fireworkColors';

export class FireworkDirector {
  public pool: ParticlePool = new ParticlePool();
  private effects: FireworkEffect[] = [];
  private continuousAnars: Map<number, Anar> = new Map();
  private continuousSparklers: Map<number, Sparkler> = new Map();
  private continuousChakris: Map<number, Chakri> = new Map();
  private onSound?: SoundTriggerCallback;

  constructor(onSound?: SoundTriggerCallback) {
    this.onSound = onSound;
  }

  public setSoundCallback(cb: SoundTriggerCallback): void {
    this.onSound = cb;
  }

  /**
   * Handle gestures recognized in current frame
   */
  public handleGestures(
    gestures: DetectedGesture[],
    screenW: number,
    screenH: number
  ): void {
    const activeAnarHands = new Set<number>();
    const activeSparklerHands = new Set<number>();
    const activeChakriHands = new Set<number>();

    for (const g of gestures) {
      const { type, triggerPoint, handIndex } = g;

      switch (type) {
        case 'ROCKET': {
          // Launch rocket from fingertip aimed toward top 15-30% of screen
          const targetY = screenH * (0.12 + Math.random() * 0.2);
          this.effects.push(new Rocket(triggerPoint.x, triggerPoint.y, targetY, this.onSound));
          break;
        }

        case 'ANAR': {
          activeAnarHands.add(handIndex);
          let anar = this.continuousAnars.get(handIndex);
          if (!anar || !anar.active) {
            anar = new Anar(triggerPoint.x, triggerPoint.y, this.onSound);
            this.continuousAnars.set(handIndex, anar);
            this.effects.push(anar);
          } else {
            anar.updatePosition(triggerPoint.x, triggerPoint.y);
          }
          break;
        }

        case 'CHAKRI': {
          activeChakriHands.add(handIndex);
          let chakri = this.continuousChakris.get(handIndex);
          // Ground position or near bottom relative to hand
          const groundY = Math.max(triggerPoint.y, screenH * 0.78);
          if (!chakri || !chakri.active) {
            chakri = new Chakri(triggerPoint.x, groundY, this.onSound);
            this.continuousChakris.set(handIndex, chakri);
            this.effects.push(chakri);
          } else {
            chakri.updatePosition(triggerPoint.x, groundY);
          }
          break;
        }

        case 'STARBURST': {
          new Starburst(triggerPoint.x, triggerPoint.y, this.pool, this.onSound);
          break;
        }

        case 'ROMAN_CANDLE': {
          this.effects.push(new RomanCandle(triggerPoint.x, triggerPoint.y, this.onSound));
          break;
        }

        case 'PHOOLJHADI': {
          activeSparklerHands.add(handIndex);
          let sparkler = this.continuousSparklers.get(handIndex);
          if (!sparkler || !sparkler.active) {
            sparkler = new Sparkler(triggerPoint.x, triggerPoint.y, this.onSound);
            this.continuousSparklers.set(handIndex, sparkler);
            this.effects.push(sparkler);
          } else {
            sparkler.updatePosition(triggerPoint.x, triggerPoint.y);
          }
          break;
        }

        case 'THOUSAND_WALA': {
          // Hang garland starting near upper-mid screen down to trigger point
          const topY = Math.max(screenH * 0.15, triggerPoint.y - 180);
          this.effects.push(new ThousandWala(triggerPoint.x, topY, this.onSound));
          break;
        }

        case 'GRAND_FINALE': {
          this.effects.push(new GrandFinale(screenW, screenH, this.onSound));
          break;
        }
      }
    }

    // Stop continuous Anars no longer active
    for (const [handIdx, anar] of this.continuousAnars.entries()) {
      if (!activeAnarHands.has(handIdx)) {
        anar.stop();
        this.continuousAnars.delete(handIdx);
      }
    }

    // Stop continuous Sparklers no longer active
    for (const [handIdx, sparkler] of this.continuousSparklers.entries()) {
      if (!activeSparklerHands.has(handIdx)) {
        sparkler.stop();
        this.continuousSparklers.delete(handIdx);
      }
    }

    // Stop continuous Chakris no longer active
    for (const [handIdx, chakri] of this.continuousChakris.entries()) {
      if (!activeChakriHands.has(handIdx)) {
        chakri.stop();
        this.continuousChakris.delete(handIdx);
      }
    }
  }

  /**
   * Directly triggers any cracker (e.g. from hotkeys or UI card clicks)
   */
  public triggerEffect(type: string, x: number, y: number, screenW: number, screenH: number): void {
    switch (type) {
      case 'ROCKET': {
        const targetY = screenH * (0.12 + Math.random() * 0.2);
        this.effects.push(new Rocket(x, y, targetY, this.onSound));
        break;
      }
      case 'ANAR': {
        const anar = new Anar(x, y, this.onSound);
        this.effects.push(anar);
        // Automatically stop after 4.5s when triggered as one-shot click
        setTimeout(() => anar.stop(), 4500);
        break;
      }
      case 'CHAKRI': {
        const groundY = Math.max(y, screenH * 0.82);
        const chakri = new Chakri(x, groundY, this.onSound);
        this.effects.push(chakri);
        setTimeout(() => chakri.stop(), 5000);
        break;
      }
      case 'STARBURST': {
        new Starburst(x, y, this.pool, this.onSound);
        break;
      }
      case 'ROMAN_CANDLE': {
        this.effects.push(new RomanCandle(x, y, this.onSound));
        break;
      }
      case 'PHOOLJHADI': {
        const sparkler = new Sparkler(x, y, this.onSound);
        this.effects.push(sparkler);
        setTimeout(() => sparkler.stop(), 4000);
        break;
      }
      case 'THOUSAND_WALA': {
        const topY = Math.max(screenH * 0.15, y - 180);
        this.effects.push(new ThousandWala(x, topY, this.onSound));
        break;
      }
      case 'GRAND_FINALE': {
        this.effects.push(new GrandFinale(screenW, screenH, this.onSound));
        break;
      }
    }
  }

  /**
   * Main per-frame simulation and render step
   */
  public updateAndRender(dt: number, ctx: CanvasRenderingContext2D): void {
    // 1. Render decorative physical bases and hand auras (Anar cone, Chakri disc, etc.)
    for (const effect of this.effects) {
      effect.render?.(ctx);
    }

    // 2. Update active high-level firework systems
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.update(dt, this.pool);
      if (!effect.active) {
        this.effects.splice(i, 1);
      }
    }

    // 3. Update particle physics with micro-crackle pop callback
    this.pool.update(dt, (x: number, y: number, color: ParticleColor) => {
      // Spawn 3 micro-sparks on crackle pop
      for (let k = 0; k < 3; k++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4.5 + 1.2;
        this.pool.spawn({
          kind: 'SPARK',
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: COLORS.WHITE_HOT,
          fadeColor: color,
          size: 2.2,
          life: 0.22,
          drag: 0.9,
          gravity: 0.05,
          trail: false
        });
      }
    });

    // 4. Render all glowing particles & smoke additively/source-over to canvas
    this.pool.render(ctx);
  }

  public clear(): void {
    this.effects = [];
    this.continuousAnars.clear();
    this.continuousSparklers.clear();
    this.continuousChakris.clear();
    this.pool.clear();
  }
}
