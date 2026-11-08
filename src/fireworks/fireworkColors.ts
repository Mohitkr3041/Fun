import { ParticleColor } from '../particles/particle';

export const COLORS = {
  GOLD: { r: 255, g: 215, b: 0 },
  AMBER: { r: 255, g: 140, b: 20 },
  DEEP_ORANGE: { r: 255, g: 85, b: 0 },
  WHITE_HOT: { r: 255, g: 255, b: 255 },
  CRIMSON: { r: 255, g: 30, b: 70 },
  EMERALD: { r: 0, g: 255, b: 120 },
  ELECTRIC_BLUE: { r: 0, g: 195, b: 255 },
  CYAN: { r: 0, g: 235, b: 255 },
  MAGENTA: { r: 255, g: 20, b: 147 },
  NEON_PINK: { r: 255, g: 45, b: 185 },
  PURPLE: { r: 180, g: 40, b: 255 },
  LEMON_YELLOW: { r: 255, g: 245, b: 40 },
  SILVER: { r: 220, g: 235, b: 255 },
  SMOKE_GRAY: { r: 140, g: 135, b: 160 },
  SMOKE_WARM: { r: 170, g: 135, b: 115 }
} as const;

export const PALETTES = [
  [COLORS.GOLD, COLORS.AMBER, COLORS.WHITE_HOT],
  [COLORS.CRIMSON, COLORS.GOLD, COLORS.WHITE_HOT],
  [COLORS.EMERALD, COLORS.GOLD, COLORS.WHITE_HOT],
  [COLORS.ELECTRIC_BLUE, COLORS.SILVER, COLORS.WHITE_HOT],
  [COLORS.MAGENTA, COLORS.GOLD, COLORS.ELECTRIC_BLUE],
  [COLORS.NEON_PINK, COLORS.CYAN, COLORS.LEMON_YELLOW],
  [COLORS.PURPLE, COLORS.ELECTRIC_BLUE, COLORS.WHITE_HOT]
];

export const CHAKRI_COLORS = [
  COLORS.MAGENTA,
  COLORS.CYAN,
  COLORS.LEMON_YELLOW,
  COLORS.GOLD,
  COLORS.DEEP_ORANGE,
  COLORS.ELECTRIC_BLUE
];

export function getRandomColor(): ParticleColor {
  const all = [
    COLORS.GOLD,
    COLORS.CRIMSON,
    COLORS.EMERALD,
    COLORS.ELECTRIC_BLUE,
    COLORS.MAGENTA,
    COLORS.PURPLE,
    COLORS.CYAN,
    COLORS.NEON_PINK,
    COLORS.LEMON_YELLOW
  ];
  return all[Math.floor(Math.random() * all.length)];
}
