import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';

/** A soft accent glow (radial falloff) centered in a square of `size`. */
export function Glow({ size = 240, intensity = 0.4, style }: { size?: number; intensity?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={t.accent} stopOpacity={intensity} />
            <Stop offset="0.45" stopColor={t.accent} stopOpacity={intensity * 0.35} />
            <Stop offset="1" stopColor={t.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#g)" />
      </Svg>
    </View>
  );
}
