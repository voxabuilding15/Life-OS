import { useMemo } from 'react';
import { Share, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import { Header, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { ProBadge } from '@/components/ui/ProBadge';
import { ProGate } from '@/components/ui/ProGate';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useWeeklyReport } from '@/hooks/useLife';
import { formatDay, formatDuration, shortDay, todayKey } from '@/lib/date';
import type { Delta } from '@/lib/report';
import { useHabits } from '@/store/entities';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

function range(start: string, end: string) {
  return `${formatDay(start, '')} – ${formatDay(end, '')}`;
}

function Tile({ icon, label, delta, format = (n: number) => String(n), showDelta }: { icon: string; label: string; delta: Delta; format?: (n: number) => string; showDelta: boolean }) {
  const t = useTheme();
  const diff = delta.current - delta.previous;
  return (
    <Card padding={14} style={{ flex: 1, minWidth: '45%' }}>
      <Icon name={icon} size={16} color={t.accent} />
      <Text variant="title" style={{ marginTop: 10 }}>
        {format(delta.current)}
      </Text>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      {showDelta ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Icon name={diff >= 0 ? 'arrow-up' : 'arrow-down'} size={11} color={diff >= 0 ? t.accent : t.textTertiary} />
          <Text variant="micro" color={diff >= 0 ? 'accent' : 'tertiary'} style={{ letterSpacing: 0.2 }}>
            {diff === 0 ? 'Same as last week' : `${Math.abs(diff)}${label === 'Focus' ? ' min' : ''} vs last week`}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default function Report() {
  const t = useTheme();
  const r = useWeeklyReport();
  const isPro = useIsPro();
  const habits = useHabits((s) => s.items);
  const topName = r.topHabit ? habits[r.topHabit.habitId]?.name : null;
  const scoreDiff = r.lifeScore.current - r.lifeScore.previous;

  const text = useMemo(
    () =>
      [`My Life OS week (${range(r.start, r.end)})`, `Life Score ${r.lifeScore.current}/100 (${scoreDiff >= 0 ? '+' : ''}${scoreDiff} vs last week)`, `${r.tasks.current} tasks · ${r.habits.current} habit check-ins · ${formatDuration(r.focusMinutes.current * 60)} focus`, ...r.highlights].join('\n'),
    [r, scoreDiff],
  );

  return (
    <Screen>
      <Header title="Weekly report" subtitle={range(r.start, r.end)} back right={isPro ? undefined : <ProBadge />} />

      <Animated.View entering={FadeInDown.duration(450)}>
        <Card accent padding={22}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <ProgressRing value={r.lifeScore.current / 100} size={96} stroke={9}>
              <CountUp value={r.lifeScore.current} variant="title" style={{ fontSize: 30, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 }} />
            </ProgressRing>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="micro" color="accent">
                {r.headline.toUpperCase()}
              </Text>
              <Text variant="heading">Life Score {scoreDiff >= 0 ? 'up' : 'down'} {Math.abs(scoreDiff)} this week</Text>
              <Text variant="caption" color="secondary">
                Active {r.activeDays} of 7 days
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      <SectionHeader title="This week" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Tile icon="checkmark-done" label="Tasks" delta={r.tasks} showDelta={isPro} />
        <Tile icon="flame" label="Check-ins" delta={r.habits} showDelta={isPro} />
        <Tile icon="timer" label="Focus" delta={r.focusMinutes} format={(n) => formatDuration(n * 60)} showDelta={isPro} />
        <Tile icon="book" label="Journal days" delta={r.journal} showDelta={isPro} />
      </View>

      <SectionHeader title="Wins per day" />
      <Card padding={18}>
        <BarChart height={100} showValues data={r.perDay.map((d) => ({ label: r.perDay.length ? shortDay(d.day).charAt(0) : '', value: d.wins, highlight: d.day === todayKey() }))} />
      </Card>

      <SectionHeader title="Insights" />
      <ProGate reason="report" label="Unlock full report with Pro">
        <View style={{ gap: 10 }}>
          <Card padding={16}>
            {r.highlights.length ? (
              r.highlights.map((h) => (
                <View key={h} style={{ flexDirection: 'row', gap: 10, paddingVertical: 5 }}>
                  <Icon name="checkmark-circle" size={16} color={t.accent} />
                  <Text variant="body" color="secondary" style={{ flex: 1 }}>
                    {h}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="body" color="tertiary">
                No activity yet this week. Complete a task or habit to fill your report.
              </Text>
            )}
          </Card>
          {topName ? (
            <Card padding={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name="trophy" size={20} color={t.accent} />
                <Text variant="body" style={{ flex: 1 }}>
                  Most consistent habit: <Text variant="bodyMedium" color="accent">{topName}</Text> ({r.topHabit!.count} days)
                </Text>
              </View>
            </Card>
          ) : null}
          <Card accent padding={16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="bulb" size={20} color={t.accent} />
              <Text variant="body" color="secondary" style={{ flex: 1 }}>
                {r.tip}
              </Text>
            </View>
          </Card>
        </View>
      </ProGate>

      {isPro ? (
        <View style={{ marginTop: 22 }}>
          <Button title="Share my week" icon="share-outline" variant="secondary" onPress={() => void Share.share({ message: text })} />
        </View>
      ) : null}
    </Screen>
  );
}
