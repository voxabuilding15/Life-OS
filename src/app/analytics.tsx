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
import { MOODS } from '@/lib/mood';
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
  const isPro = useIsPro();
  const [range, setRange] = useState<Range>('7');
  const days = Number(range);
  const a = useAnalytics(days);

  if (!isPro) {
    return (
      <Screen>
        <Header title="Analytics" back right={<ProBadge />} />
        <Card accent padding={22}>
          <View style={{ gap: 14, alignItems: 'center' }}>
            <Icon name="analytics" size={34} color={t.accent} />
            <Text variant="heading" align="center">
              Advanced analytics & reports
            </Text>
            <Text variant="body" color="secondary" align="center">
              See trends across 30 days, your best days, habit consistency, focus time and mood, plus a weekly report.
            </Text>
            <View style={{ opacity: 0.4, width: '100%' }}>
              <BarChart height={80} data={[3, 6, 4, 8, 5, 9, 7].map((v, i) => ({ label: 'MTWTFSS'[i], value: v }))} />
            </View>
            <Button title="Unlock with Pro" icon="sparkles" onPress={() => router.replace('/paywall?reason=analytics')} />
          </View>
        </Card>
      </Screen>
    );
  }

  const avgMood = a.avgMood != null ? MOODS[Math.round(a.avgMood) - 1]?.label : '—';
  const report = a.activeDays === 0
    ? 'No activity in this period yet. Complete a task or habit to start your report.'
    : `You were active on ${a.activeDays} of ${days} days, finished ${a.tasks} task${a.tasks === 1 ? '' : 's'}, logged ${a.habitCheckins} habit check-in${a.habitCheckins === 1 ? '' : 's'} and focused for ${formatDuration(a.focusMinutes * 60)}.${a.bestDay ? ` Your strongest day was ${shortDay(a.bestDay.key)} with ${a.bestDay.total} wins.` : ''}`;

  return (
    <Screen>
      <Header title="Analytics" subtitle="Pro" back right={<ProBadge />} />
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: '7', label: '7 days' },
          { value: '14', label: '14 days' },
          { value: '30', label: '30 days' },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <StatTile icon="checkmark-done" value={a.tasks} label="Tasks" />
        <StatTile icon="flame" value={a.habitCheckins} label="Check-ins" />
        <StatTile icon="timer" value={formatDuration(a.focusMinutes * 60)} label="Focus" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <StatTile icon="pulse" value={`${Math.round(a.habitRate * 100)}%`} label="Habit rate" />
        <StatTile icon="happy" value={avgMood} label="Avg mood" />
        <StatTile icon="calendar" value={`${a.activeDays}/${days}`} label="Active days" />
      </View>

      <SectionHeader title="Wins per day" />
      <Card padding={18}>
        <BarChart height={110} data={bucket(a.series.map((d) => ({ key: d.key, label: d.label, v: d.total })))} />
      </Card>
      <SectionHeader title="Focus minutes" />
      <Card padding={18}>
        <BarChart height={90} data={bucket(a.series.map((d) => ({ key: d.key, label: d.label, v: d.focusMinutes })))} />
      </Card>

      <SectionHeader title={`${days === 7 ? 'Weekly' : days === 14 ? 'Fortnight' : 'Monthly'} report`} />
      <Card accent padding={18}>
        <Text variant="body" color="secondary">
          {report}
        </Text>
      </Card>
    </Screen>
  );
}
