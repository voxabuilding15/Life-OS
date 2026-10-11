import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface Bar {
  label: string;
  value: number;
  highlight?: boolean;
}

function AnimatedBar({ ratio, index, height, highlight }: { ratio: number; index: number; height: number; highlight?: boolean }) {
  const t = useTheme();
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(index * 30, withTiming(ratio, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [ratio, index, h]);
  const style = useAnimatedStyle(() => ({ height: Math.max(4, h.value * height) }));
  return <Animated.View style={[{ width: '100%', borderRadius: 6, backgroundColor: highlight ? t.accent : t.accentMuted }, style]} />;
}

export function BarChart({ data, height = 120, showValues }: { data: Bar[]; height?: number; showValues?: boolean }) {
  const { t: tr } = useI18n();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.row} accessibilityLabel={tr('common.chart')}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.col}>
          {showValues ? (
            <Text variant="micro" color="tertiary">
              {d.value}
            </Text>
          ) : null}
          <View style={{ height, justifyContent: 'flex-end', width: '100%' }}>
            <AnimatedBar ratio={d.value / max} index={i} height={height} highlight={d.highlight} />
          </View>
          <Text variant="micro" color={d.highlight ? 'accent' : 'tertiary'}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' }, col: { flex: 1, alignItems: 'center', gap: 6 } });
