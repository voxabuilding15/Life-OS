import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { shortDay, todayKey } from '@/lib/date';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';
import { BarChart } from '../ui/BarChart';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ProBadge } from '../ui/ProBadge';
import { Text } from '../ui/Text';

/** Premium widget: 7-day momentum. Free users see a teaser that opens the paywall. */
export function WeeklyInsight() {
  const t = useTheme();
  const isPro = useIsPro();
  const a = useAnalytics(7);
  const today = todayKey();

  if (!isPro) {
    return (
      <Card onPress={() => router.push('/paywall')} padding={18} accessibilityLabel="Unlock weekly insights with Pro">
        <View style={styles.head}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Text variant="heading">Weekly momentum</Text>
              <ProBadge small />
            </View>
            <Text variant="caption" color="secondary">
              See your best days, trends and focus time.
            </Text>
          </View>
          <Icon name="lock-closed" size={20} color={t.accent} />
        </View>
        <View style={{ opacity: 0.35, marginTop: 14 }}>
          <BarChart height={56} data={[4, 7, 3, 9, 6, 8, 5].map((v, i) => ({ label: 'MTWTFSS'[i], value: v }))} />
        </View>
      </Card>
    );
  }
  return (
    <Card padding={18}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Text variant="heading">Weekly momentum</Text>
            <ProBadge small />
          </View>
          <Text variant="caption" color="secondary">
            {a.bestDay ? `Best day: ${shortDay(a.bestDay.key)} · ${a.bestDay.total} wins` : 'Complete tasks and habits to see your trend.'}
          </Text>
        </View>
        <Text variant="title" color="accent">
          {a.tasks + a.habitCheckins}
        </Text>
      </View>
      <View style={{ marginTop: 14 }}>
        <BarChart height={64} data={a.series.map((d) => ({ label: d.label, value: d.total, highlight: d.key === today }))} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
