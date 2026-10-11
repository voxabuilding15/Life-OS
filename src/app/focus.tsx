import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { StatTile } from '@/components/ui/StatTile';
import { BarChart } from '@/components/ui/BarChart';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useFocusData, useTasksData } from '@/hooks/useData';
import { MODE_LABEL, useFocusTimer } from '@/hooks/useFocusTimer';
import { clock, formatDay, formatDuration, formatTime, todayKey } from '@/lib/date';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

const PRESETS = [15, 25, 45, 60];

export default function Focus() {
  const t = useTheme();
  const [tab, setTab] = useState<'timer' | 'stats'>('timer');
  const [taskId, setTaskId] = useState<string | null>(null);
  const timer = useFocusTimer(taskId);
  const settings = useSettings();
  const { today: openTasks } = useTasksData();
  const stats = useFocusData();
  const week = useAnalytics(7);

  return (
    <Screen scroll={tab === 'stats'}>
      <View style={styles.top}>
        <IconButton icon="close" label="Close focus mode" onPress={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: 14 }}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'timer', label: 'Timer' },
              { value: 'stats', label: 'Stats' },
            ]}
          />
        </View>
        <View style={{ width: 42 }} />
      </View>

      {tab === 'timer' ? (
        <Animated.View entering={FadeIn} style={styles.timerWrap}>
          <Text variant="micro" color="accent" style={{ letterSpacing: 2 }}>
            {MODE_LABEL[timer.mode].toUpperCase()}
          </Text>

          <View style={{ marginVertical: 36 }}>
            <ProgressRing value={timer.running || timer.progress > 0 ? timer.progress : 0} size={288} stroke={10} duration={400}>
              <Text style={styles.clock} accessibilityLiveRegion="none" accessibilityLabel={`${Math.floor(timer.remaining / 60)} minutes ${timer.remaining % 60} seconds remaining`}>
                {clock(timer.remaining)}
              </Text>
              <Text variant="caption" color="secondary">
                {timer.running ? 'Stay with it' : 'Ready when you are'}
              </Text>
            </ProgressRing>
          </View>

          <View style={styles.dots}>
            {Array.from({ length: settings.sessionsUntilLongBreak }, (_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i < timer.completedInCycle ? t.accent : t.surfaceStrong }]} />
            ))}
          </View>

          <View style={styles.controls}>
            <IconButton icon="refresh" label="Reset timer" onPress={timer.reset} size={52} />
            <PressableScale
              onPress={timer.running ? timer.pause : timer.start}
              feedback="none"
              scaleTo={0.92}
              accessibilityLabel={timer.running ? 'Pause' : 'Start'}
              style={[styles.play, { backgroundColor: t.accent, shadowColor: t.accent }]}
            >
              <Icon name={timer.running ? 'pause' : 'play'} size={34} color={t.onAccent} />
            </PressableScale>
            <IconButton icon="play-skip-forward" label="Skip to next phase" onPress={timer.skip} size={52} />
          </View>

          {!timer.running && timer.mode === 'focus' ? (
            <Animated.View entering={FadeInDown} style={{ gap: 18, marginTop: 36, alignItems: 'center' }}>
              <View style={styles.presets}>
                {PRESETS.map((m) => (
                  <Chip key={m} label={`${m} min`} selected={settings.focusMinutes === m} onPress={() => settings.set({ focusMinutes: m })} />
                ))}
              </View>
              {openTasks.length > 0 ? (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  <Text variant="micro" color="tertiary">
                    FOCUS ON
                  </Text>
                  <View style={styles.presets}>
                    {openTasks.slice(0, 3).map((task) => (
                      <Chip key={task.id} label={task.title.length > 22 ? `${task.title.slice(0, 21)}…` : task.title} selected={taskId === task.id} onPress={() => setTaskId(taskId === task.id ? null : task.id)} />
                    ))}
                  </View>
                </View>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn} style={{ gap: 16, paddingTop: 8, paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatTile icon="today" value={formatDuration(stats.todayMinutes * 60)} label="Today" />
            <StatTile icon="calendar" value={formatDuration(stats.weekMinutes * 60)} label="This week" />
            <StatTile icon="checkmark-done" value={stats.totalSessions} label="Sessions" />
          </View>
          <Card padding={18}>
            <Text variant="heading" style={{ marginBottom: 14 }}>
              Last 7 days (min)
            </Text>
            <BarChart showValues height={110} data={week.series.map((d) => ({ label: d.label, value: d.focusMinutes, highlight: d.key === todayKey() }))} />
          </Card>
          <Text variant="heading">History</Text>
          {stats.sessions.length === 0 ? (
            <EmptyState icon="timer-outline" title="No sessions yet" message="Finish a focus session and it will show up here." />
          ) : (
            stats.sessions.slice(0, 20).map((s) => (
              <Card key={s.id} padding={14}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Icon name={s.completed ? 'checkmark-circle' : 'pause-circle-outline'} size={24} color={s.completed ? t.accent : t.textTertiary} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{formatDuration(s.durationSeconds)} focus</Text>
                    <Text variant="caption" color="secondary">
                      {formatDay(todayKey(new Date(s.startedAt)))} · {formatTime(new Date(s.startedAt))}
                    </Text>
                  </View>
                  <Text variant="caption" color="tertiary">
                    {s.completed ? 'Completed' : 'Stopped early'}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 24 },
  clock: { fontSize: 68, lineHeight: 76, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  play: { width: 88, height: 88, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
