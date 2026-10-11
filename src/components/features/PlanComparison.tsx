import { StyleSheet, View } from 'react-native';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { config } from '@/lib/config';
import { useI18n } from '@/i18n';
import { radius, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';

type Cell = true | false | string;

const FREE_ACH = ACHIEVEMENTS.filter((a) => !a.pro).length;

/** Free/Pro cells are either booleans or a locale key (`paywall.compare.*`) or a literal number string. */
const COMPARISON: { label: string; free: Cell; pro: Cell }[] = [
  { label: 'core', free: true, pro: true },
  { label: 'lifeScore', free: true, pro: true },
  { label: 'habits', free: `${config.freeHabitLimit}`, pro: 'unlimited' },
  { label: 'goals', free: `${config.freeGoalLimit}`, pro: 'unlimited' },
  { label: 'challenges', free: 'perDay3', pro: 'bonus' },
  { label: 'freeze', free: false, pro: 'twoMonth' },
  { label: 'stats', free: 'days7', pro: 'days30' },
  { label: 'report', free: 'summary', pro: 'fullInsights' },
  { label: 'achievements', free: `${FREE_ACH}`, pro: `${ACHIEVEMENTS.length}` },
  { label: 'sync', free: false, pro: true },
  { label: 'themes', free: 'ocean', pro: 'moreThemes' },
  { label: 'widgets', free: 'basic', pro: 'premium' },
];

function CellView({ value, pro }: { value: Cell; pro?: boolean }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  if (value === true) return <Icon name="checkmark-circle" size={18} color={pro ? t.accent : t.textSecondary} />;
  if (value === false) return <Icon name="remove" size={18} color={t.textTertiary} />;
  return (
    <Text variant="caption" color={pro ? 'accent' : 'secondary'} align="center" style={{ fontFamily: pro ? 'Inter_600SemiBold' : 'Inter_500Medium', fontSize: 12 }}>
      {/^\d+$/.test(value) ? value : tr(`paywall.compare.${value}`)}
    </Text>
  );
}

/** Free vs Pro table. The Pro column is highlighted. */
export function PlanComparison() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const text = (c: Cell) => (c === true ? tr('paywall.compare.yes') : c === false ? tr('paywall.compare.no') : /^\d+$/.test(c) ? c : tr(`paywall.compare.${c}`));
  return (
    <View style={[styles.table, { borderColor: t.border, backgroundColor: t.surface }]}>
      <View style={styles.head}>
        <View style={{ flex: 1.5 }} />
        <Text variant="micro" color="tertiary" align="center" style={styles.col}>
          {tr('paywall.free')}
        </Text>
        <View style={[styles.col, styles.proHead, { backgroundColor: t.accent }]}>
          <Text variant="micro" color="onAccent">
            {tr('paywall.proCol')}
          </Text>
        </View>
      </View>
      {COMPARISON.map((row, i) => (
        <View key={row.label} style={[styles.row, i % 2 === 1 && { backgroundColor: 'rgba(255,255,255,0.025)' }]} accessibilityLabel={tr('paywall.compare.rowLabel', { label: tr(`paywall.compare.${row.label}`), free: text(row.free), pro: text(row.pro) })}>
          <Text variant="caption" style={{ flex: 1.5, paddingEnd: 8 }}>
            {tr(`paywall.compare.${row.label}`)}
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
  proHead: { height: 22, borderRadius: 8, flex: 1, marginStart: 4 },
});
