import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { shortDay, todayKey } from '@/lib/date';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useI18n } from '@/i18n';
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
  const { t: tr } = useI18n();
  const isPro = useIsPro();
  const a = useAnalytics(7);
  const today = todayKey();

  if (!isPro) {
    return (
      <Card onPress={() => router.push('/report')} padding={18} accessibilityLabel={tr('report.openLabel')}>
        <View style={styles.head}>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Text variant="heading">{tr('report.title')}</Text>
            </View>
            <Text variant="caption" color="secondary">
              {tr('report.cardSubtitle')}
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
    <Card padding={18} onPress={() => router.push('/report')} accessibilityLabel={tr('report.openLabel')}>
      <View style={styles.head}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Text variant="heading">{tr('report.title')}</Text>
            <ProBadge small />
          </View>
          <Text variant="caption" color="secondary">
            {a.bestDay ? tr('report.bestDay', { day: shortDay(a.bestDay.key), wins: a.bestDay.total }) : tr('report.trendHint')}
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
