import type { TextStyle } from 'react-native';

/** Inter (Latin UI font) -> IBM Plex Sans Arabic equivalents. Plex has no ExtraBold, so 800 maps to Bold. */
const ARABIC_FAMILY: Record<string, string> = {
  Inter_400Regular: 'IBMPlexSansArabic_400Regular',
  Inter_500Medium: 'IBMPlexSansArabic_500Medium',
  Inter_600SemiBold: 'IBMPlexSansArabic_600SemiBold',
  Inter_700Bold: 'IBMPlexSansArabic_700Bold',
  Inter_800ExtraBold: 'IBMPlexSansArabic_700Bold',
};

export const arabicFamily = (family: string | undefined): string | undefined =>
  family ? (ARABIC_FAMILY[family] ?? family) : family;

/**
 * Arabic typography rules applied to any text style:
 *  - IBM Plex Sans Arabic instead of Inter,
 *  - no letter-spacing (tracking breaks Arabic letter joining),
 *  - slightly taller line height for marks and taller glyphs.
 */
export function localizeTextStyle(style: TextStyle, rtl: boolean): TextStyle {
  if (!rtl) return style;
  const out: TextStyle = { ...style, fontFamily: arabicFamily(style.fontFamily), letterSpacing: 0 };
  if (typeof style.lineHeight === 'number') out.lineHeight = Math.round(style.lineHeight * 1.12);
  return out;
}

const LRM = '\u200E';
/** Right-to-left mark: pins an Arabic paragraph's base direction even when it starts with a Latin run. */
export const RLM = '\u200F';
/** A run of Latin letters / digits with the joiners that belong inside it ("+20 XP", "195 / 200 XP", "Life OS"). */
const LATIN_RUN = /(?:[+\-/]\s?)?[A-Za-z0-9](?:[A-Za-z0-9 .,:/+%\-]*[A-Za-z0-9%])?/g;

/**
 * Wraps each Latin/number run in left-to-right marks so the Unicode bidi algorithm cannot reorder it
 * inside an Arabic sentence (e.g. "+20 XP" rendering as "XP 20+").
 */
export const isolateLatinRuns = (text: string): string => text.replace(LATIN_RUN, (m) => `${LRM}${m}${LRM}`);
