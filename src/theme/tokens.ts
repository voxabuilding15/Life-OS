/**
 * Life OS design tokens.
 * The identity uses exactly three base colors; every other tone is an alpha
 * variant of one of them. Never introduce a new hue here.
 */
export const BASE = {
  blue: '#68C7EC',
  dark: '#000F0F',
  white: '#FFFFFF',
} as const;

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export const alpha = rgba;

export const colors = {
  background: BASE.dark,
  /** Raised surfaces (cards). */
  surface: rgba(BASE.white, 0.045),
  surfaceStrong: rgba(BASE.white, 0.08),
  surfaceSolid: '#0B1A1A', // BASE.dark lifted with white at ~6%: opaque stand-in for sheets
  border: rgba(BASE.white, 0.09),
  borderStrong: rgba(BASE.white, 0.16),
  text: BASE.white,
  textSecondary: rgba(BASE.white, 0.62),
  textTertiary: rgba(BASE.white, 0.38),
  overlay: rgba(BASE.dark, 0.78),
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 } as const;
export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontFamily: font.extrabold, letterSpacing: -1 },
  title: { fontSize: 26, lineHeight: 32, fontFamily: font.bold, letterSpacing: -0.6 },
  heading: { fontSize: 19, lineHeight: 25, fontFamily: font.semibold, letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: font.regular },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontFamily: font.medium },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: font.medium },
  micro: { fontSize: 11, lineHeight: 14, fontFamily: font.semibold, letterSpacing: 0.8 },
} as const;

export type TextVariant = keyof typeof typography;

export const springs = {
  snappy: { damping: 18, stiffness: 260, mass: 0.7 },
  soft: { damping: 20, stiffness: 140, mass: 0.9 },
} as const;

export type ThemeId = 'ocean' | 'ghost' | 'aurora';

export interface AppTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  accent: string;
  /** Text/icon color placed on top of an accent fill. */
  onAccent: string;
  /** Ambient glow strength (0-1). */
  glow: number;
  pro: boolean;
}

export const THEMES: Record<ThemeId, AppTheme> = {
  ocean: { id: 'ocean', name: 'Ocean', tagline: 'The signature blue', accent: BASE.blue, onAccent: BASE.dark, glow: 0.5, pro: false },
  aurora: { id: 'aurora', name: 'Aurora', tagline: 'Blue, with a brighter glow', accent: BASE.blue, onAccent: BASE.dark, glow: 1, pro: true },
  ghost: { id: 'ghost', name: 'Ghost', tagline: 'Pure monochrome', accent: BASE.white, onAccent: BASE.dark, glow: 0.25, pro: true },
};
