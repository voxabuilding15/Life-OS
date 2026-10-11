import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { heatmapGrid } from '@/lib/habits';
import { alpha, useTheme } from '@/theme';
import { Text } from './Text';

const DAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];

/** GitHub-style calendar heatmap of check-ins (weeks as columns, Sun-Sat rows). */
export const Heatmap = memo(function Heatmap({ doneDays, weeks = 15 }: { doneDays: ReadonlySet<string>; weeks?: number }) {
  const t = useTheme();
  const grid = heatmapGrid(doneDays, weeks);
  const [width, setWidth] = useState(0);
  // Fit the grid to its container: label gutter + `weeks` columns separated by 4px gaps.
  const cell = width ? Math.min(22, Math.max(8, Math.floor((width - 14 - 6 - weeks * 4) / weeks))) : 12;
  return (
    <View style={styles.row} accessibilityLabel="Habit calendar heatmap" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.labels, { gap: 4 }]}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={{ height: cell, justifyContent: 'center' }}>
            <Text variant="micro" color="tertiary">
              {d}
            </Text>
          </View>
        ))}
      </View>
      {grid.map((col, ci) => (
        <View key={ci} style={{ gap: 4 }}>
          {col.map((c) => (
            <View
              key={c.key}
              style={{
                width: cell,
                height: cell,
                borderRadius: 5,
                backgroundColor: c.future ? 'transparent' : c.done ? t.accent : t.surfaceStrong,
                borderWidth: c.future ? 1 : 0,
                borderColor: alpha('#FFFFFF', 0.05),
                shadowColor: t.accent,
                shadowOpacity: c.done ? 0.5 : 0,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 0 },
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 4 }, labels: { marginRight: 2 } });
