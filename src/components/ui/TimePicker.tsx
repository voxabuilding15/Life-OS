import { StyleSheet, View } from 'react-native';
import { useI18n } from '@/i18n';
import { time12 } from '@/i18n/format';
import { radius, useTheme } from '@/theme';
import { Chip } from './Chip';
import { IconButton } from './Header';
import { Text } from './Text';

const pad = (n: number) => String(n).padStart(2, '0');

export const parseTime = (v: string): { h: number; m: number } => {
  const [h, m] = v.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
};

export const formatHm = (v: string): string => {
  const { h, m } = parseTime(v);
  return time12(new Date(2026, 0, 1, h, m));
};

/** Stepper time picker ('HH:mm'), 5-minute granularity, with quick picks. */
export function TimePicker({ value, onChange, presets }: { value: string; onChange: (v: string) => void; presets?: string[] }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { h, m } = parseTime(value);
  const set = (nh: number, nm: number) => onChange(`${pad((nh + 24) % 24)}:${pad(((nm % 60) + 60) % 60)}`);
  const col = (label: string, display: string, up: () => void, down: () => void) => (
    <View style={styles.col}>
      <IconButton icon="chevron-up" label={tr('time.increase', { unit: label })} size={36} onPress={up} />
      <Text variant="title" style={{ minWidth: 56, textAlign: 'center' }}>
        {display}
      </Text>
      <IconButton icon="chevron-down" label={tr('time.decrease', { unit: label })} size={36} onPress={down} />
    </View>
  );
  return (
    <View style={{ gap: 14 }}>
      {presets ? (
        <View style={styles.presets}>
          {presets.map((p) => (
            <Chip key={p} label={formatHm(p)} selected={p === value} onPress={() => onChange(p)} />
          ))}
        </View>
      ) : null}
      <View style={[styles.box, { backgroundColor: t.surface, borderColor: t.border }]}>
        {col(tr('time.hour'), pad(h % 12 === 0 ? 12 : h % 12), () => set(h + 1, m), () => set(h - 1, m))}
        <Text variant="title" color="tertiary">
          :
        </Text>
        {col(tr('time.minute'), pad(m), () => set(h, m + 5), () => set(h, m - 5))}
        <View style={styles.col}>
          <Chip label={tr('time.am')} selected={h < 12} onPress={() => h >= 12 && set(h - 12, m)} />
          <Chip label={tr('time.pm')} selected={h >= 12} onPress={() => h < 12 && set(h + 12, m)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  box: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', borderRadius: radius.lg, borderWidth: 1, paddingVertical: 14 },
  col: { alignItems: 'center', gap: 8 },
});
