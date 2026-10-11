import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Confetti } from '@/components/ui/Confetti';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useGoalsData } from '@/hooks/useData';
import { useI18n } from '@/i18n';
import { diffDays, formatDay, todayKey } from '@/lib/date';
import { haptic } from '@/lib/haptics';
import { addMilestone, deleteGoal, toggleMilestone } from '@/services/actions';
import { useTheme } from '@/theme';

export default function GoalDetail() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { all } = useGoalsData();
  const item = useMemo(() => all.find((g) => g.goal.id === id), [all, id]);
  const [next, setNext] = useState('');
  const [burst, setBurst] = useState(0);

  if (!item) {
    return (
      <Screen>
        <Header title={tr('goals.goal')} back />
        <EmptyState icon="alert-circle-outline" title={tr('goals.notFound')} message={tr('goals.deleted')} />
      </Screen>
    );
  }
  const { goal, milestones, progress, done } = item;
  const left = goal.targetDate ? diffDays(goal.targetDate, todayKey()) : null;

  const confirmDelete = () => {
    const run = () => {
      deleteGoal(goal.id);
      router.back();
    };
    if (Platform.OS === 'web') return run();
    Alert.alert(tr('goals.deleteTitle'), tr('goals.deleteBody'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('common.delete'), style: 'destructive', onPress: run },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
    <Screen keyboard>
      <Header title={goal.title} contentTitle subtitle={tr(`categories.goal.${goal.category}`)} back />

      {goal.completedAt ? (
        <Animated.View entering={ZoomIn.springify().damping(12)} style={{ marginBottom: 14 }}>
          <Card accent padding={18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="trophy" size={26} color={t.onAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="micro" color="accent">
                  {tr('achievements.unlockedToast')}
                </Text>
                <Text variant="heading">{tr('goals.achievedTitle')}</Text>
                <Text variant="caption" color="secondary">
                  {tr('goals.earnedXp')}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>
      ) : null}

      <Card padding={20}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          <ProgressRing value={progress} size={96} stroke={9}>
            <Text style={{ fontSize: 24, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.8 }}>{Math.round(progress * 100)}%</Text>
          </ProgressRing>
          <View style={{ flex: 1, gap: 6 }}>
            <Text variant="heading">
              {tr('goals.milestonesOf', { done, count: milestones.length })}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="calendar-outline" size={14} color={t.textSecondary} />
              <Text variant="caption" color="secondary">
                {goal.targetDate ? (left != null && left >= 0 ? tr('goals.daysLeft', { date: formatDay(goal.targetDate), count: left }) : tr('goals.pastDue', { date: formatDay(goal.targetDate) })) : tr('goals.noTarget')}
              </Text>
            </View>
          </View>
        </View>
        {goal.description ? (
          <Text content variant="body" color="secondary" style={{ marginTop: 16 }}>
            {goal.description}
          </Text>
        ) : null}
      </Card>

      <SectionHeader title={tr('goals.timeline')} />
      <View>
        {milestones.map((m, i) => (
          <Animated.View key={m.id} entering={FadeInDown.delay(i * 60).duration(350)} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center' }}>
              <Checkbox
                checked={m.completed}
                label={tr('goals.completeMilestone', { title: m.title })}
                onToggle={() => {
                  const r = toggleMilestone(m.id);
                  if (r.goalCompleted) {
                    haptic.success();
                    setBurst((b) => b + 1);
                  }
                }}
              />
              {i < milestones.length - 1 ? <View style={{ flex: 1, width: 2, marginVertical: 4, backgroundColor: m.completed ? t.accent : t.surfaceStrong, minHeight: 22 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 18, paddingTop: 3 }}>
              <Text content variant="bodyMedium" style={m.completed && { color: t.textTertiary, textDecorationLine: 'line-through' }}>
                {m.title}
              </Text>
              {m.completedAt ? (
                <Text variant="caption" color="tertiary">
                  {tr('goals.doneOn', { date: formatDay(todayKey(new Date(m.completedAt))) })}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        ))}
        {milestones.length === 0 ? (
          <Text variant="body" color="tertiary" style={{ marginBottom: 12 }}>
            {tr('goals.addHint')}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <View style={{ flex: 1 }}>
          <Input value={next} onChangeText={setNext} placeholder={tr('goals.addPlaceholder')} icon="add" returnKeyType="done" onSubmitEditing={() => next.trim() && (addMilestone(goal.id, next), setNext(''))} />
        </View>
        <Button title={tr('common.add')} size="md" fullWidth={false} disabled={!next.trim()} onPress={() => (addMilestone(goal.id, next), setNext(''))} />
      </View>

      <View style={{ marginTop: 28 }}>
        <Button title={tr('goals.delete')} variant="ghost" onPress={confirmDelete} />
      </View>
    </Screen>
    <Confetti playKey={burst} />
    </View>
  );
}
