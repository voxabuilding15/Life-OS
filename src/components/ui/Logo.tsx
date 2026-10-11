import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { BASE } from '@/theme';

/** Life OS mark: an orbit ring with a rising node and a core. */
export function Logo({ size = 96, color = BASE.blue }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityLabel="Life OS logo">
      <Defs>
        <SvgGradient id="ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={BASE.white} stopOpacity={0.95} />
          <Stop offset="1" stopColor={color} stopOpacity={1} />
        </SvgGradient>
      </Defs>
      <Circle cx="48" cy="48" r="34" stroke={color} strokeOpacity={0.18} strokeWidth={6} fill="none" />
      <Path d="M48 14 A34 34 0 1 1 15.7 59.5" stroke="url(#ring)" strokeWidth={6} strokeLinecap="round" fill="none" />
      <Circle cx="48" cy="14" r="6.5" fill={BASE.white} />
      <Circle cx="48" cy="48" r="11" fill={color} />
      <Circle cx="48" cy="48" r="4.5" fill={BASE.dark} />
    </Svg>
  );
}
