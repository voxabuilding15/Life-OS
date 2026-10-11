import { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useI18n } from '@/i18n';
import { weekdayNarrow } from '@/i18n/format';
import { heatmapGrid } from '@/lib/habits';
import { alpha, useTheme } from '@/theme';
import { Text } from './Text';

/** Rows run Sunday..Saturday; label Monday, Wednesday and Friday. 2026-10-11 is a Sunday. */
const labelFor = (row: number) => (row % 2 === 1 ? weekdayNarrow(new Date(2026, 9, 11 + row)) : '');

/** GitHub-style calendar heatmap of check-ins (weeks as columns, Sun-Sat rows). */
export const Heatmap = memo(function Heatmap({ doneDays, weeks = 15 }: { doneDays: ReadonlySet<string>; weeks?: number }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const grid = heatmapGrid(doneDays, weeks);
  const [width, setWidth] = useState(0);
  // Fit the grid to its container: label gutter + `weeks` columns separated by 4px gaps.
  const cell = width ? Math.min(22, Math.max(8, Math.floor((width - 14 - 6 - weeks * 4) / weeks))) : 12;
  return (
    <View style={styles.row} accessibilityLabel={tr('habits.heatmapLabel')} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={[styles.labels, { gap: 4 }]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ height: cell, justifyContent: 'center' }}>
            <Text variant="micro" color="tertiary">
              {labelFor(i)}
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

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 4 }, labels: { marginEnd: 2 } });
