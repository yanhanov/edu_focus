export const ACCENT_PALETTE_IDS = ['green', 'blue', 'violet', 'amber'] as const;

export type AccentPaletteId = (typeof ACCENT_PALETTE_IDS)[number];

export const DEFAULT_ACCENT_PALETTE: AccentPaletteId = 'green';

export type AccentPair = {
  accent: string;
  accentSoft: string;
};

export const ACCENT_PALETTES: Record<
  AccentPaletteId,
  { label: string; light: AccentPair; dark: AccentPair }
> = {
  green: {
    label: 'Зелёная',
    light: { accent: '#1B6B4A', accentSoft: '#D8EFE4' },
    dark: { accent: '#7DDBB3', accentSoft: '#1A3329' },
  },
  blue: {
    label: 'Синяя',
    light: { accent: '#1D4ED8', accentSoft: '#DBEAFE' },
    dark: { accent: '#93C5FD', accentSoft: '#172554' },
  },
  violet: {
    label: 'Фиолетовая',
    light: { accent: '#6D28D9', accentSoft: '#EDE9FE' },
    dark: { accent: '#C4B5FD', accentSoft: '#2E1065' },
  },
  amber: {
    label: 'Янтарная',
    light: { accent: '#B45309', accentSoft: '#FFEDD5' },
    dark: { accent: '#FCD34D', accentSoft: '#451A03' },
  },
};

export function isAccentPaletteId(value: string): value is AccentPaletteId {
  return (ACCENT_PALETTE_IDS as readonly string[]).includes(value);
}
