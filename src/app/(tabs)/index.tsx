import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChallengesCard } from '@/components/features/ChallengesCard';
import { LifeScoreCard } from '@/components/features/LifeScoreCard';
import { TaskRow } from '@/components/features/TaskRow';
import { WeeklyInsight } from '@/components/features/WeeklyInsight';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import { IconButton, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useFocusData, useGoalsData, useHabitsData, useLevelProgress, useTasksData } from '@/hooks/useData';
import { useI18n } from '@/i18n';
import { formatDuration, greeting } from '@/lib/date';
import { levelTitle } from '@/lib/gamification';
import { toggleHabit } from '@/services/actions';
import { runSync } from '@/services/sync';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { useTheme } from '@/theme';

const stagger = (i: number) => FadeInDown.delay(i * 70).duration(450).springify().damping(16);

export default function Dashboard() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { displayName, avatarUrl } = useProfile();
  const email = useAuth((s) => s.email);
  const name = displayName || email?.split('@')[0] || 'there';
  const lvl = useLevelProgress();
  const tasks = useTasksData();
  const habits = useHabitsData();
  const goals = useGoalsData();
  const focus = useFocusData();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await runSync();
    setRefreshing(false);
  }, []);

  const daily = useMemo(() => {
    const total = tasks.planned + habits.total;
    const done = tasks.done + habits.doneToday;
    return total === 0 ? 0 : done / total;
  }, [tasks.planned, tasks.done, habits.total, habits.doneToday]);

  return (
    <Screen bottomInset={110} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} colors={[t.accent]} progressBackgroundColor={t.surfaceSolid} />}>
      <Animated.View entering={stagger(0)} style={styles.header}>
        <PressableScale onPress={() => router.push('/profile')} feedback="tap" accessibilityLabel={tr('dashboard.openProfile')}>
          <Avatar name={name} uri={avatarUrl} size={48} />
        </PressableScale>
        <View style={{ flex: 1 }}>
          <Text variant="body" color="secondary" accessibilityLabel={`${greeting()}, ${name}`}>
            {greeting()},
          </Text>
          <Text content variant="title" numberOfLines={1}>
            {name}
          </Text>
        </View>
        <IconButton icon="settings-outline" label={tr('dashboard.settings')} onPress={() => router.push('/settings')} />
      </Animated.View>

      {/* Hero: level, XP, daily completion */}
      <Animated.View entering={stagger(1)}>
        <Card accent padding={20} onPress={() => router.push('/profile')} accessibilityLabel={tr('dashboard.levelXp')}>
          <View style={styles.hero}>
            <ProgressRing value={daily} size={104} stroke={9}>
              <CountUp value={Math.round(daily * 100)} suffix="%" style={{ fontSize: 26, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 }} />
              <Text variant="micro" color="secondary">
                {tr('dashboard.today')}
              </Text>
            </ProgressRing>
            <View style={{ flex: 1, gap: 8 }}>
              <View style={styles.levelRow}>
                <View style={[styles.levelBadge, { backgroundColor: t.accent }]}>
                  <Text variant="caption" color="onAccent" style={{ fontFamily: 'Inter_800ExtraBold' }}>
                    {tr('common.level', { level: lvl.level })}
                  </Text>
                </View>
                <Text variant="bodyMedium" style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {levelTitle(lvl.level)}
                </Text>
              </View>
              <ProgressBar value={lvl.ratio} height={8} />
              <Text variant="caption" color="secondary">
                {tr('dashboard.xpToNext', { current: lvl.current, needed: lvl.needed, next: lvl.level + 1 })}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={stagger(2)} style={{ marginTop: 12 }}>
        <LifeScoreCard />
      </Animated.View>
      <Animated.View entering={stagger(3)} style={{ marginTop: 12 }}>
        <ChallengesCard />
      </Animated.View>

      {/* Quick stats */}
      <Animated.View entering={stagger(4)} style={styles.quick}>
        {[
          { icon: 'checkmark-done', value: `${tasks.done}/${tasks.planned}`, label: tr('tabs.tasks'), go: '/(tabs)/tasks' },
          { icon: 'flame', value: `${habits.doneToday}/${habits.total}`, label: tr('tabs.habits'), go: '/(tabs)/habits' },
          { icon: 'timer', value: formatDuration(focus.todayMinutes * 60), label: tr('focus.modes.focus'), go: '/focus' },
        ].map((s) => (
          <PressableScale key={s.label} style={{ flex: 1 }} feedback="tap" onPress={() => router.push(s.go)} accessibilityLabel={tr('dashboard.tileLabel', { label: s.label, value: s.value })}>
            <View style={[styles.quickTile, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Icon name={s.icon} size={16} accent />
              <Text variant="heading">{s.value}</Text>
              <Text variant="caption" color="secondary">
                {s.label}
              </Text>
            </View>
          </PressableScale>
        ))}
      </Animated.View>

      {/* Focus shortcut */}
      <Animated.View entering={stagger(5)} style={{ marginTop: 16 }}>
        <Card onPress={() => router.push('/focus')} padding={16} accessibilityLabel={tr('dashboard.startFocus')}>
          <View style={styles.focusRow}>
            <View style={[styles.focusIcon, { backgroundColor: t.accent, shadowColor: t.accent }]}>
              <Icon name="timer-outline" size={24} color={t.onAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading">{tr('dashboard.focusMode')}</Text>
              <Text variant="caption" color="secondary">
                {focus.todaySessions > 0 ? tr('dashboard.focusToday', { count: focus.todaySessions, minutes: focus.todayMinutes }) : tr('dashboard.focusIdle')}
              </Text>
            </View>
            <Icon name="play-circle" size={36} color={t.accent} />
          </View>
        </Card>
      </Animated.View>

      {/* Today's tasks */}
      <Animated.View entering={stagger(6)} style={{ marginTop: 12 }}>
        <SectionHeader title={tr('dashboard.todaysTasks')} action={tasks.planned ? tr('common.seeAll') : tr('dashboard.add')} onAction={() => (tasks.planned ? router.push('/(tabs)/tasks') : router.push('/task/new'))} />
        <Card padding={tasks.today.length ? 12 : 18}>
          <View style={styles.cardTop}>
            <Text variant="bodyMedium" color="secondary">
              {tr('dashboard.completedOf', { done: tasks.done, total: tasks.planned })}
            </Text>
            <View style={{ width: 110 }}>
              <ProgressBar value={tasks.planned ? tasks.done / tasks.planned : 0} height={6} />
            </View>
          </View>
          {tasks.today.slice(0, 3).map((task) => (
            <TaskRow key={task.id} task={task} compact />
          ))}
          {tasks.today.length === 0 ? (
            <Text variant="body" color="tertiary">
              {tasks.planned ? tr('dashboard.allDone') : tr('dashboard.nothingPlanned')}
            </Text>
          ) : null}
        </Card>
      </Animated.View>

      {/* Habits */}
      <Animated.View entering={stagger(7)}>
        <SectionHeader title={tr('dashboard.habitProgress')} action={habits.total ? tr('common.seeAll') : tr('dashboard.add')} onAction={() => (habits.total ? router.push('/(tabs)/habits') : router.push('/habit/new'))} />
        <Card padding={habits.items.length ? 6 : 18}>
          {habits.items.slice(0, 3).map(({ habit, doneToday, streak }) => (
            <PressableScale key={habit.id} onPress={() => toggleHabit(habit.id)} feedback="none" scaleTo={0.99} style={styles.habitRow} accessibilityLabel={tr('habits.streakLabel', { name: habit.name, streak: tr('habits.streak', { count: streak }) })}>
              <View style={[styles.habitIcon, { backgroundColor: doneToday ? t.accent : t.accentSoft }]}>
                <Icon name={habit.icon} size={18} color={doneToday ? t.onAccent : t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text content variant="bodyMedium">{habit.name}</Text>
                <Text variant="caption" color="secondary">
                  🔥 {tr('habits.streak', { count: streak })}
                </Text>
              </View>
              <Icon name={doneToday ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={doneToday ? t.accent : t.textTertiary} />
            </PressableScale>
          ))}
          {habits.items.length === 0 ? (
            <Text variant="body" color="tertiary">
              {tr('dashboard.buildStreak')}
            </Text>
          ) : null}
        </Card>
      </Animated.View>

      {/* Goals */}
      <Animated.View entering={stagger(8)}>
        <SectionHeader title={tr('dashboard.currentGoals')} action={goals.active.length ? tr('common.seeAll') : tr('dashboard.add')} onAction={() => (goals.active.length ? router.push('/(tabs)/goals') : router.push('/goal/new'))} />
        <View style={{ gap: 10 }}>
          {goals.active.slice(0, 2).map(({ goal, progress, done, milestones }) => (
            <Card key={goal.id} onPress={() => router.push(`/goal/${goal.id}`)} padding={16}>
              <View style={styles.goalTop}>
                <Text content variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                  {goal.title}
                </Text>
                <Text variant="bodyMedium" color="accent" style={{ fontFamily: 'Inter_700Bold' }}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <ProgressBar value={progress} />
              <Text variant="caption" color="secondary" style={{ marginTop: 8 }}>
                {tr('dashboard.milestonesOf', { done, total: milestones.length })}
              </Text>
            </Card>
          ))}
          {goals.active.length === 0 ? (
            <Card>
              <Text variant="body" color="tertiary">
                {tr('dashboard.dreamBig')}
              </Text>
            </Card>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={stagger(9)} style={{ marginTop: 20 }}>
        <WeeklyInsight />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  quick: { flexDirection: 'row', gap: 10, marginTop: 14 },
  quickTile: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 6 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  focusIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 6 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  habitIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  goalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
});
