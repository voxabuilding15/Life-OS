import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { addDays, fromKey, toKey, todayKey } from '@/lib/date';
import { radius, useTheme } from '@/theme';
import { Chip } from './Chip';
import { IconButton } from './Header';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
  allowNone?: boolean;
}

/** Inline month calendar with quick picks. No native date-picker dependency, identical on every platform. */
export function DatePicker({ value, onChange, allowNone = true }: Props) {
  const t = useTheme();
  const today = todayKey();
  const [cursor, setCursor] = useState(() => fromKey(value ?? today));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => toKey(new Date(year, month, i + 1)))] as (string | null)[];
  }, [year, month]);

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.quick}>
        <Chip label="Today" selected={value === today} onPress={() => onChange(today)} />
        <Chip label="Tomorrow" selected={value === addDays(today, 1)} onPress={() => onChange(addDays(today, 1))} />
        <Chip label="Next week" selected={value === addDays(today, 7)} onPress={() => onChange(addDays(today, 7))} />
        {allowNone ? <Chip label="No date" selected={value === null} onPress={() => onChange(null)} /> : null}
      </View>
      <View style={[styles.cal, { backgroundColor: t.surface, borderColor: t.border }]}>
        <View style={styles.head}>
          <IconButton icon="chevron-back" label="Previous month" size={34} onPress={() => setCursor(new Date(year, month - 1, 1))} />
          <Text variant="bodyMedium">
            {MONTHS[month]} {year}
          </Text>
          <IconButton icon="chevron-forward" label="Next month" size={34} onPress={() => setCursor(new Date(year, month + 1, 1))} />
        </View>
        <View style={styles.grid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View key={i} style={styles.cell}>
              <Text variant="micro" color="tertiary">
                {d}
              </Text>
            </View>
          ))}
          {cells.map((key, i) => {
            if (!key) return <View key={`e${i}`} style={styles.cell} />;
            const selected = key === value;
            const isToday = key === today;
            return (
              <View key={key} style={styles.cell}>
                <PressableScale
                  onPress={() => onChange(key)}
                  feedback="tap"
                  scaleTo={0.9}
                  accessibilityLabel={key}
                  style={[styles.day, selected && { backgroundColor: t.accent }, !selected && isToday && { borderColor: t.accentBorder, borderWidth: 1 }]}
                >
                  <Text variant="caption" color={selected ? 'onAccent' : isToday ? 'accent' : 'primary'} style={{ fontFamily: selected ? 'Inter_700Bold' : 'Inter_500Medium' }}>
                    {Number(key.slice(8))}
                  </Text>
                </PressableScale>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cal: { borderRadius: radius.lg, borderWidth: 1, padding: 12, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  day: { width: '84%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
