import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';

/** Tiny area line chart. Values are plotted against a fixed 0-100 scale unless `max` is given. */
export function Sparkline({ values, width = 120, height = 36, max = 100 }: { values: number[]; width?: number; height?: number; max?: number }) {
  const t = useTheme();
  const { rtl } = useI18n();
  if (values.length < 2) return null;
  const pad = 4;
  const step = (width - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => [pad + i * step, pad + (1 - Math.min(1, v / max)) * (height - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]} ${height} L${pts[0][0]} ${height} Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <Svg width={width} height={height} style={rtl ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Defs>
        <LinearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={t.accent} stopOpacity={0.35} />
          <Stop offset="1" stopColor={t.accent} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#spark)" />
      <Path d={line} stroke={t.accent} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={lx} cy={ly} r={3.5} fill={t.accent} />
    </Svg>
  );
}
