import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

/** Gently bobs its children up and down. Used for hero icons and empty-state illustrations. */
export function Floating({ children, distance = 6, duration = 2200, delay = 0, style }: { children: ReactNode; distance?: number; duration?: number; delay?: number; style?: StyleProp<ViewStyle> }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(withTiming(-distance, { duration, easing: Easing.inOut(Easing.quad) }), withTiming(distance, { duration, easing: Easing.inOut(Easing.quad) })), -1, true));
  }, [y, distance, duration, delay]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}

/** Slow pulse (scale + opacity) for rings and glows. */
export function Pulse({ children, scale = 1.08, duration = 1600, style }: { children?: ReactNode; scale?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [p, duration]);
  const anim = useAnimatedStyle(() => ({ opacity: 0.55 + p.value * 0.45, transform: [{ scale: 1 + (scale - 1) * p.value }] }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
