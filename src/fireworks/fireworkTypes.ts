import { ParticlePool } from '../particles/particle';

export interface FireworkEffect {
  active: boolean;
  update(dt: number, pool: ParticlePool): void;
  render?(ctx: CanvasRenderingContext2D): void;
}

export type SoundTriggerCallback = (
  soundType:
    | 'ROCKET_LAUNCH'
    | 'EXPLOSION'
    | 'ANAR_LOOP'
    | 'SPARKLER_LOOP'
    | 'ROMAN_POP'
    | 'FINALE'
    | 'CHAKRI_LOOP'
    | 'CRACKER_CHAIN',
  intensity?: number
) => void;
