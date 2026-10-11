import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { radius, springs, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const t = useTheme();
  const { rtl } = useI18n();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const seg = width / options.length;
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: withSpring((rtl ? -index : index) * seg, springs.snappy) }], width: seg }));
  return (
    <View style={[styles.track, { backgroundColor: t.surface, borderColor: t.border }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width - 8)}>
      <View style={styles.inner}>
        {width > 0 ? <Animated.View style={[styles.indicator, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }, indicator]} /> : null}
        {options.map((o) => (
          <PressableScale key={o.value} style={styles.item} onPress={() => onChange(o.value)} feedback="tap" scaleTo={0.96} accessibilityState={{ selected: o.value === value }}>
            <Text variant="caption" color={o.value === value ? 'accent' : 'secondary'} style={{ fontFamily: 'Inter_600SemiBold' }}>
              {o.label}
            </Text>
          </PressableScale>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.md, borderWidth: 1, padding: 4 },
  inner: { flexDirection: 'row' },
  item: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  indicator: { position: 'absolute', top: 0, bottom: 0, start: 0, borderRadius: radius.sm, borderWidth: 1 },
});
