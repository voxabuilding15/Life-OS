import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { Header, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { ProBadge } from '@/components/ui/ProBadge';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatDuration, shortDay, todayKey } from '@/lib/date';
import { useI18n } from '@/i18n';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

type Range = '7' | '14' | '30';

/** Compresses a long series into at most 15 bars so labels stay legible. */
function bucket(series: { key: string; label: string; v: number }[], max = 15) {
  const size = Math.ceil(series.length / max);
  const out: { label: string; value: number; highlight?: boolean }[] = [];
  for (let i = 0; i < series.length; i += size) {
    const chunk = series.slice(i, i + size);
    out.push({ label: size === 1 ? chunk[0].label : String(Number(chunk[0].key.slice(8))), value: chunk.reduce((a, c) => a + c.v, 0), highlight: chunk.some((c) => c.key === todayKey()) });
  }
  return out;
}

export default function Analytics() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const isPro = useIsPro();
  const [range, setRange] = useState<Range>('7');
  const days = Number(range);
  const a = useAnalytics(days);

  if (!isPro) {
    return (
      <Screen>
        <Header title={tr('analytics.title')} back right={<ProBadge />} />
        <Card accent padding={22}>
          <View style={{ gap: 14, alignItems: 'center' }}>
            <Icon name="analytics" size={34} color={t.accent} />
            <Text variant="heading" align="center">
              {tr('analytics.gateTitle')}
            </Text>
            <Text variant="body" color="secondary" align="center">
              {tr('analytics.gateBody')}
            </Text>
            <View style={{ opacity: 0.4, width: '100%' }}>
              <BarChart height={80} data={[3, 6, 4, 8, 5, 9, 7].map((v, i) => ({ label: 'MTWTFSS'[i], value: v }))} />
            </View>
            <Button title={tr('common.unlockWithPro')} icon="sparkles" onPress={() => router.replace('/paywall?reason=analytics')} />
          </View>
        </Card>
      </Screen>
    );
  }

  const avgMood = a.avgMood != null ? tr(`mood.${Math.round(a.avgMood)}`) : '—';
  const report =
    a.activeDays === 0
      ? tr('analytics.reportEmpty')
      : tr('analytics.reportBody', { active: a.activeDays, days, tasks: a.tasks, habits: a.habitCheckins, focus: formatDuration(a.focusMinutes * 60) }) +
        (a.bestDay ? tr('analytics.reportBest', { day: shortDay(a.bestDay.key), wins: a.bestDay.total }) : '');

  return (
    <Screen>
      <Header title={tr('analytics.title')} subtitle={tr('common.pro')} back right={<ProBadge />} />
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: '7', label: tr('analytics.range7') },
          { value: '14', label: tr('analytics.range14') },
          { value: '30', label: tr('analytics.range30') },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <StatTile icon="checkmark-done" value={a.tasks} label={tr('analytics.tasks')} />
        <StatTile icon="flame" value={a.habitCheckins} label={tr('analytics.checkins')} />
        <StatTile icon="timer" value={formatDuration(a.focusMinutes * 60)} label={tr('analytics.focus')} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <StatTile icon="pulse" value={`${Math.round(a.habitRate * 100)}%`} label={tr('analytics.habitRate')} />
        <StatTile icon="happy" value={avgMood} label={tr('analytics.avgMood')} />
        <StatTile icon="calendar" value={`${a.activeDays}/${days}`} label={tr('analytics.activeDays')} />
      </View>

      <SectionHeader title={tr('analytics.winsPerDay')} />
      <Card padding={18}>
        <BarChart height={110} data={bucket(a.series.map((d) => ({ key: d.key, label: d.label, v: d.total })))} />
      </Card>
      <SectionHeader title={tr('analytics.focusMinutes')} />
      <Card padding={18}>
        <BarChart height={90} data={bucket(a.series.map((d) => ({ key: d.key, label: d.label, v: d.focusMinutes })))} />
      </Card>

      <SectionHeader title={tr(days === 7 ? 'analytics.reportWeekly' : days === 14 ? 'analytics.reportFortnight' : 'analytics.reportMonthly')} />
      <Card accent padding={18}>
        <Text variant="body" color="secondary">
          {report}
        </Text>
      </Card>
    </Screen>
  );
}
