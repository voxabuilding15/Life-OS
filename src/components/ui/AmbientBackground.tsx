import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';

/** Soft radial glows behind content; gives the dark canvas depth without adding colors. */
export function AmbientBackground() {
  const t = useTheme();
  const g = t.glow;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="top" cx="85%" cy="0%" rx="85%" ry="45%" fx="85%" fy="0%">
            <Stop offset="0" stopColor={t.accent} stopOpacity={0.26 * g} />
            <Stop offset="1" stopColor={t.accent} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="bottom" cx="0%" cy="100%" rx="80%" ry="40%" fx="0%" fy="100%">
            <Stop offset="0" stopColor={t.accent} stopOpacity={0.12 * g} />
            <Stop offset="1" stopColor={t.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#top)" />
        <Rect width="100%" height="100%" fill="url(#bottom)" />
      </Svg>
    </View>
  );
}
