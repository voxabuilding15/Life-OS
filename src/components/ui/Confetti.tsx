import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BASE, useTheme } from '@/theme';

const COUNT = 28;

function Piece({ i, progress, color }: { i: number; progress: { value: number }; color: string }) {
  const spec = useMemo(() => {
    const angle = (i / COUNT) * Math.PI * 2 + (i % 3) * 0.2;
    return { dx: Math.cos(angle) * (90 + (i % 5) * 28), dy: Math.sin(angle) * (90 + (i % 4) * 24) - 40, rot: (i % 2 ? 1 : -1) * (180 + (i % 5) * 90), w: 6 + (i % 3) * 2, h: 10 + (i % 4) * 2 };
  }, [i]);
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p < 0.1 ? p * 10 : 1 - Math.max(0, (p - 0.65) / 0.35),
      transform: [{ translateX: spec.dx * p }, { translateY: spec.dy * p + 160 * p * p }, { rotate: `${spec.rot * p}deg` }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', width: spec.w, height: spec.h, borderRadius: 2, backgroundColor: color }, style]} />;
}

/** One-shot confetti burst from the center. Re-fires whenever `playKey` changes (and is > 0). */
export function Confetti({ playKey }: { playKey: number }) {
  const t = useTheme();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!playKey) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) });
  }, [playKey, progress]);
  if (!playKey) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {Array.from({ length: COUNT }, (_, i) => (
        <Piece key={i} i={i} progress={progress} color={i % 3 === 0 ? BASE.white : t.accent} />
      ))}
    </View>
  );
}
