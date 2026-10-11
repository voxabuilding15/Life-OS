import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/theme';

interface Props {
  /** 0-1 */
  value: number;
  height?: number;
}

export function ProgressBar({ value, height = 8 }: Props) {
  const t = useTheme();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.min(1, Math.max(0, value)), { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [value, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={[styles.track, { height, borderRadius: height, backgroundColor: t.surfaceStrong }]}
    >
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: t.accent, shadowColor: t.accent, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { overflow: 'visible', width: '100%' } });
