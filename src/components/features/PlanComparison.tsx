import { StyleSheet, View } from 'react-native';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { config } from '@/lib/config';
import { radius, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';

type Cell = true | false | string;

const FREE_ACH = ACHIEVEMENTS.filter((a) => !a.pro).length;

export const COMPARISON: { label: string; free: Cell; pro: Cell }[] = [
  { label: 'Tasks, reminders & focus timer', free: true, pro: true },
  { label: 'Life Score', free: true, pro: true },
  { label: 'Habits', free: `${config.freeHabitLimit}`, pro: 'Unlimited' },
  { label: 'Active goals', free: `${config.freeGoalLimit}`, pro: 'Unlimited' },
  { label: 'Daily challenges', free: '3 a day', pro: '+ double-XP bonus' },
  { label: 'Streak Freeze', free: false, pro: `${config.freezesPerMonth} a month` },
  { label: 'Statistics', free: '7 days', pro: '30 days + trends' },
  { label: 'Weekly report', free: 'Summary', pro: 'Full insights' },
  { label: 'Achievements', free: `${FREE_ACH}`, pro: `${ACHIEVEMENTS.length}` },
  { label: 'Cloud sync & backup', free: false, pro: true },
  { label: 'Themes', free: 'Ocean', pro: '+ Aurora, Ghost' },
  { label: 'Dashboard widgets', free: 'Basic', pro: 'Premium' },
];

function CellView({ value, pro }: { value: Cell; pro?: boolean }) {
  const t = useTheme();
  if (value === true) return <Icon name="checkmark-circle" size={18} color={pro ? t.accent : t.textSecondary} />;
  if (value === false) return <Icon name="remove" size={18} color={t.textTertiary} />;
  return (
    <Text variant="caption" color={pro ? 'accent' : 'secondary'} align="center" style={{ fontFamily: pro ? 'Inter_600SemiBold' : 'Inter_500Medium', fontSize: 12 }}>
      {value}
    </Text>
  );
}

/** Free vs Pro table. The Pro column is highlighted. */
export function PlanComparison() {
  const t = useTheme();
  return (
    <View style={[styles.table, { borderColor: t.border, backgroundColor: t.surface }]}>
      <View style={styles.head}>
        <View style={{ flex: 1.5 }} />
        <Text variant="micro" color="tertiary" align="center" style={styles.col}>
          FREE
        </Text>
        <View style={[styles.col, styles.proHead, { backgroundColor: t.accent }]}>
          <Text variant="micro" color="onAccent">
            PRO
          </Text>
        </View>
      </View>
      {COMPARISON.map((row, i) => (
        <View key={row.label} style={[styles.row, i % 2 === 1 && { backgroundColor: 'rgba(255,255,255,0.025)' }]} accessibilityLabel={`${row.label}: Free ${String(row.free)}, Pro ${String(row.pro)}`}>
          <Text variant="caption" style={{ flex: 1.5, paddingRight: 8 }}>
            {row.label}
          </Text>
          <View style={styles.col}>
            <CellView value={row.free} />
          </View>
          <View style={[styles.col, { backgroundColor: t.accentSoft, borderRadius: 8, paddingVertical: 6 }]}>
            <CellView value={row.pro} pro />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderRadius: radius.lg, borderWidth: 1, padding: 12, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, minHeight: 40 },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  proHead: { height: 22, borderRadius: 8, flex: 1, marginLeft: 4 },
});
