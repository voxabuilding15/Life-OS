import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { springs } from '@/theme';

interface Props {
  page: number;
  onPageChange: (page: number) => void;
  width: number;
  children: ReactNode[];
  onTouch?: () => void;
}

/**
 * Horizontal pager that is direction-aware by construction: page N sits N widths away from page 0 in the
 * reading direction, so it behaves identically in LTR and RTL (no scroll-offset origin differences).
 */
export function SwipePager({ page, onPageChange, width, children, onTouch }: Props) {
  const { rtl } = useI18n();
  const sign = rtl ? 1 : -1; // pages advance to the left in LTR, to the right in RTL
  const count = children.length;
  const x = useSharedValue(sign * page * width);
  const start = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(sign * page * width, springs.soft);
  }, [page, width, sign, x]);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      start.value = x.value;
      if (onTouch) runOnJS(onTouch)();
    })
    .onUpdate((e) => {
      x.value = start.value + e.translationX;
    })
    .onEnd((e) => {
      const projected = (start.value + e.translationX + e.velocityX * 0.15) / (sign * width);
      const next = Math.min(count - 1, Math.max(0, Math.round(projected)));
      x.value = withSpring(sign * next * width, springs.soft);
      runOnJS(onPageChange)(next);
    });

  const track = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width, overflow: 'hidden' }}>
        <Animated.View style={[{ flexDirection: 'row', width: width * count }, track]}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}
