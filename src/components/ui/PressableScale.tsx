import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { springs } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  feedback?: 'tap' | 'light' | 'medium' | 'none';
}

/** Base interactive element: springy press scale + haptic tick. */
export function PressableScale({ children, style, scaleTo = 0.97, feedback = 'light', onPress, onPressIn, onPressOut, disabled, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, springs.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, springs.snappy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (feedback !== 'none') haptic[feedback]();
        onPress?.(e);
      }}
      style={[animated, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
