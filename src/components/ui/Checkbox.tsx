import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { alpha, springs, useTheme } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface Props {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  label?: string;
}

/** Round checkbox: fills with the accent and pops the check mark in with a spring. */
export function Checkbox({ checked, onToggle, size = 28, label }: Props) {
  const t = useTheme();
  const fill = useSharedValue(checked ? 1 : 0);
  const pop = useSharedValue(1);
  useEffect(() => {
    fill.value = withTiming(checked ? 1 : 0, { duration: 220 });
    if (checked) pop.value = withSequence(withSpring(1.22, springs.snappy), withSpring(1, springs.snappy));
  }, [checked, fill, pop]);
  const box = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
    backgroundColor: interpolateColor(fill.value, [0, 1], [alpha(t.accent, 0), t.accent]),
    borderColor: interpolateColor(fill.value, [0, 1], [t.borderStrong, t.accent]),
  }));
  const mark = useAnimatedStyle(() => ({ opacity: fill.value, transform: [{ scale: interpolate(fill.value, [0, 1], [0.4, 1]) }] }));
  return (
    <PressableScale
      onPress={() => {
        if (!checked) haptic.success();
        onToggle();
      }}
      feedback="none"
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.box, { width: size, height: size, borderRadius: size / 2 }, box]}>
        <Animated.View style={mark}>
          <Icon name="checkmark" size={size * 0.62} color={t.onAccent} />
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({ box: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' } });
