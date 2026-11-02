/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { ACCENT_PALETTES, DEFAULT_ACCENT_PALETTE } from '@/constants/accent-palettes';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useProfileOptional } from '@/hooks/use-profile';
import { getCachedProfile } from '@/lib/profile';

export function useTheme() {
  const scheme = useColorScheme();
  const mode = scheme === 'dark' ? 'dark' : 'light';
  const profile = useProfileOptional();
  const paletteId =
    profile?.profile.accentPalette ?? getCachedProfile().accentPalette ?? DEFAULT_ACCENT_PALETTE;
  const palette = ACCENT_PALETTES[paletteId][mode];

  return {
    ...Colors[mode],
    accent: palette.accent,
    accentSoft: palette.accentSoft,
  };
}
