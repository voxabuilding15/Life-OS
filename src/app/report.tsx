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
import { useI18n } from '@/i18n';
import { formatDuration, formatShortDate, shortDay, todayKey } from '@/lib/date';
import type { Delta } from '@/lib/report';
import { useHabits } from '@/store/entities';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

function range(start: string, end: string) {
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

function Tile({ icon, label, delta, format = (n: number) => String(n), showDelta, minutes }: { icon: string; label: string; delta: Delta; format?: (n: number) => string; showDelta: boolean; minutes?: boolean }) {
  const t = useTheme();
  const { t: tr } = useI18n();
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
            {diff === 0 ? tr('report.sameAsLast') : tr(minutes ? 'report.vsLastMin' : 'report.vsLast', { delta: Math.abs(diff) })}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default function Report() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const r = useWeeklyReport();
  const isPro = useIsPro();
  const habits = useHabits((s) => s.items);
  const topName = r.topHabit ? habits[r.topHabit.habitId]?.name : null;
  const scoreDiff = r.lifeScore.current - r.lifeScore.previous;

  const hl = (h: (typeof r.highlights)[number]) => tr(`report.highlights.${h.key}`, h.key === 'bestDay' ? { ...h.values, day: shortDay(h.values.day as string) } : h.values);
  const text = useMemo(
    () =>
      [
        tr('report.shareTitle', { range: range(r.start, r.end) }),
        tr('report.shareScore', { score: r.lifeScore.current, delta: `${scoreDiff >= 0 ? '+' : ''}${scoreDiff}` }),
        tr('report.shareTotals', { tasks: r.tasks.current, habits: r.habits.current, focus: formatDuration(r.focusMinutes.current * 60) }),
        ...r.highlights.map(hl),
      ].join('\n'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [r, scoreDiff, tr],
  );

  return (
    <Screen>
      <Header title={tr('report.title')} subtitle={range(r.start, r.end)} back right={isPro ? undefined : <ProBadge />} />

      <Animated.View entering={FadeInDown.duration(450)}>
        <Card accent padding={22}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <ProgressRing value={r.lifeScore.current / 100} size={96} stroke={9}>
              <CountUp value={r.lifeScore.current} variant="title" style={{ fontSize: 30, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 }} />
            </ProgressRing>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="micro" color="accent">
                {tr(`report.headlines.${r.headline}`).toUpperCase()}
              </Text>
              <Text variant="heading">{scoreDiff === 0 ? tr('report.scoreSame') : tr(scoreDiff > 0 ? 'report.scoreUp' : 'report.scoreDown', { count: Math.abs(scoreDiff) })}</Text>
              <Text variant="caption" color="secondary">
                {tr('report.activeDays', { count: r.activeDays })}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      <SectionHeader title={tr('report.thisWeek')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Tile icon="checkmark-done" label={tr('report.tasks')} delta={r.tasks} showDelta={isPro} />
        <Tile icon="flame" label={tr('report.checkins')} delta={r.habits} showDelta={isPro} />
        <Tile icon="timer" label={tr('report.focus')} delta={r.focusMinutes} format={(n) => formatDuration(n * 60)} showDelta={isPro} minutes />
        <Tile icon="book" label={tr('report.journalDays')} delta={r.journal} showDelta={isPro} />
      </View>

      <SectionHeader title={tr('report.winsPerDay')} />
      <Card padding={18}>
        <BarChart height={100} showValues data={r.perDay.map((d) => ({ label: r.perDay.length ? shortDay(d.day).charAt(0) : '', value: d.wins, highlight: d.day === todayKey() }))} />
      </Card>

      <SectionHeader title={tr('report.insights')} />
      <ProGate reason="report" label={tr('report.unlockFull')}>
        <View style={{ gap: 10 }}>
          <Card padding={16}>
            {r.highlights.length ? (
              r.highlights.map((h) => (
                <View key={h.key} style={{ flexDirection: 'row', gap: 10, paddingVertical: 5 }}>
                  <Icon name="checkmark-circle" size={16} color={t.accent} />
                  <Text variant="body" color="secondary" style={{ flex: 1 }}>
                    {hl(h)}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="body" color="tertiary">
                {tr('report.noActivity')}
              </Text>
            )}
          </Card>
          {topName ? (
            <Card padding={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Icon name="trophy" size={20} color={t.accent} />
                <Text variant="body" style={{ flex: 1 }}>
                  {tr('report.topHabit', { name: topName, days: r.topHabit!.count })}
                </Text>
              </View>
            </Card>
          ) : null}
          <Card accent padding={16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="bulb" size={20} color={t.accent} />
              <Text variant="body" color="secondary" style={{ flex: 1 }}>
                {r.tipPillar ? tr(`lifeScore.pillars.${r.tipPillar}.tip`) : tr('report.emptyTip')}
              </Text>
            </View>
          </Card>
        </View>
      </ProGate>

      {isPro ? (
        <View style={{ marginTop: 22 }}>
          <Button title={tr('report.share')} icon="share-outline" variant="secondary" onPress={() => void Share.share({ message: text })} />
        </View>
      ) : null}
    </Screen>
  );
}
