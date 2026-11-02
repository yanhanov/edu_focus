export const ACCENT_PALETTE_IDS = [
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'mint',
  'coral',
  'brown',
  'slate',
  'graphite',
  'navy',
  'wine',
] as const;

export type AccentPaletteId = (typeof ACCENT_PALETTE_IDS)[number];

export const DEFAULT_ACCENT_PALETTE: AccentPaletteId = 'green';

export type AccentPair = {
  accent: string;
  accentSoft: string;
};

type PaletteDef = { label: string; light: AccentPair; dark: AccentPair };

export const ACCENT_PALETTES = {
  green: {
    label: 'Зелёная',
    light: { accent: '#1B6B4A', accentSoft: '#D8EFE4' },
    dark: { accent: '#7DDBB3', accentSoft: '#1A3329' },
  },
  emerald: {
    label: 'Изумруд',
    light: { accent: '#047857', accentSoft: '#D1FAE5' },
    dark: { accent: '#6EE7B7', accentSoft: '#064E3B' },
  },
  teal: {
    label: 'Бирюза',
    light: { accent: '#0F766E', accentSoft: '#CCFBF1' },
    dark: { accent: '#5EEAD4', accentSoft: '#134E4A' },
  },
  cyan: {
    label: 'Циан',
    light: { accent: '#0891B2', accentSoft: '#CFFAFE' },
    dark: { accent: '#67E8F9', accentSoft: '#164E63' },
  },
  sky: {
    label: 'Небо',
    light: { accent: '#0284C7', accentSoft: '#E0F2FE' },
    dark: { accent: '#7DD3FC', accentSoft: '#0C4A6E' },
  },
  blue: {
    label: 'Синяя',
    light: { accent: '#1D4ED8', accentSoft: '#DBEAFE' },
    dark: { accent: '#93C5FD', accentSoft: '#172554' },
  },
  indigo: {
    label: 'Индиго',
    light: { accent: '#4338CA', accentSoft: '#E0E7FF' },
    dark: { accent: '#A5B4FC', accentSoft: '#1E1B4B' },
  },
  violet: {
    label: 'Фиолет',
    light: { accent: '#6D28D9', accentSoft: '#EDE9FE' },
    dark: { accent: '#C4B5FD', accentSoft: '#2E1065' },
  },
  purple: {
    label: 'Пурпур',
    light: { accent: '#7E22CE', accentSoft: '#F3E8FF' },
    dark: { accent: '#D8B4FE', accentSoft: '#3B0764' },
  },
  fuchsia: {
    label: 'Фуксия',
    light: { accent: '#A21CAF', accentSoft: '#FAE8FF' },
    dark: { accent: '#F0ABFC', accentSoft: '#4A044E' },
  },
  pink: {
    label: 'Розовая',
    light: { accent: '#DB2777', accentSoft: '#FCE7F3' },
    dark: { accent: '#F9A8D4', accentSoft: '#500724' },
  },
  rose: {
    label: 'Роза',
    light: { accent: '#E11D48', accentSoft: '#FFE4E6' },
    dark: { accent: '#FDA4AF', accentSoft: '#4C0519' },
  },
  red: {
    label: 'Красная',
    light: { accent: '#DC2626', accentSoft: '#FEE2E2' },
    dark: { accent: '#FCA5A5', accentSoft: '#450A0A' },
  },
  orange: {
    label: 'Оранж',
    light: { accent: '#EA580C', accentSoft: '#FFEDD5' },
    dark: { accent: '#FDBA74', accentSoft: '#431407' },
  },
  amber: {
    label: 'Янтарь',
    light: { accent: '#B45309', accentSoft: '#FEF3C7' },
    dark: { accent: '#FCD34D', accentSoft: '#451A03' },
  },
  yellow: {
    label: 'Жёлтая',
    light: { accent: '#A16207', accentSoft: '#FEF9C3' },
    dark: { accent: '#FDE047', accentSoft: '#422006' },
  },
  lime: {
    label: 'Лайм',
    light: { accent: '#65A30D', accentSoft: '#ECFCCB' },
    dark: { accent: '#BEF264', accentSoft: '#1A2E05' },
  },
  mint: {
    label: 'Мята',
    light: { accent: '#059669', accentSoft: '#D1FAE5' },
    dark: { accent: '#86EFAC', accentSoft: '#14532D' },
  },
  coral: {
    label: 'Коралл',
    light: { accent: '#F97316', accentSoft: '#FFEDD5' },
    dark: { accent: '#FB923C', accentSoft: '#431407' },
  },
  brown: {
    label: 'Кофе',
    light: { accent: '#92400E', accentSoft: '#FEF3C7' },
    dark: { accent: '#D6A06C', accentSoft: '#292018' },
  },
  slate: {
    label: 'Слейт',
    light: { accent: '#475569', accentSoft: '#E2E8F0' },
    dark: { accent: '#94A3B8', accentSoft: '#1E293B' },
  },
  graphite: {
    label: 'Графит',
    light: { accent: '#374151', accentSoft: '#E5E7EB' },
    dark: { accent: '#D1D5DB', accentSoft: '#111827' },
  },
  navy: {
    label: 'Морская',
    light: { accent: '#1E3A8A', accentSoft: '#DBEAFE' },
    dark: { accent: '#60A5FA', accentSoft: '#0F172A' },
  },
  wine: {
    label: 'Вино',
    light: { accent: '#9F1239', accentSoft: '#FFE4E6' },
    dark: { accent: '#FB7185', accentSoft: '#4C0519' },
  },
} as const satisfies Record<AccentPaletteId, PaletteDef>;

export function isAccentPaletteId(value: string): value is AccentPaletteId {
  return (ACCENT_PALETTE_IDS as readonly string[]).includes(value);
}
