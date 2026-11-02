import { Colors } from '@/constants/theme';

/** Matches app chrome — same as native splash in app.json */
export const SplashColors = {
  light: {
    background: Colors.light.background,
  },
  dark: {
    background: Colors.dark.background,
  },
} as const;

export type SplashPalette = (typeof SplashColors)[keyof typeof SplashColors];
