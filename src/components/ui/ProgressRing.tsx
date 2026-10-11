import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** 0-1 */
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  duration?: number;
}

export function ProgressRing({ value, size = 72, stroke = 7, children, duration = 900 }: Props) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, value)), { duration, easing: Easing.out(Easing.cubic) });
  }, [value, duration, progress]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - progress.value) }));
  return (
    <View style={{ width: size, height: size }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surfaceStrong} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="none"
          animatedProps={props}
        />
      </Svg>
      {children ? <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({ center: { alignItems: 'center', justifyContent: 'center' } });
