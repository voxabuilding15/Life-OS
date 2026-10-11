import { useEffect } from 'react';
import type { DimensionValue, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { radius, useTheme } from '@/theme';

export function Skeleton({ width = '100%', height = 20, style }: { width?: DimensionValue; height?: number; style?: ViewStyle }) {
  const t = useTheme();
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width, height, borderRadius: radius.md, backgroundColor: t.surfaceStrong }, anim, style]} />;
}
