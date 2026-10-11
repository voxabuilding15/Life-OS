import { useMemo } from 'react';
import { useSettings } from '@/store/settings';
import { alpha, colors, THEMES, type AppTheme } from './tokens';

export * from './tokens';

/** Resolved theme: static palette + the user's accent. Components read accent from here. */
export function useTheme() {
  const themeId = useSettings((s) => s.themeId);
  return useMemo(() => {
    const t: AppTheme = THEMES[themeId] ?? THEMES.ocean;
    return {
      ...colors,
      accent: t.accent,
      onAccent: t.onAccent,
      glow: t.glow,
      accentSoft: alpha(t.accent, 0.14),
      accentMuted: alpha(t.accent, 0.3),
      accentBorder: alpha(t.accent, 0.35),
    };
  }, [themeId]);
}
