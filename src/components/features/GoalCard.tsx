import { router } from 'expo-router';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { diffDays, formatDay, todayKey } from '@/lib/date';
import type { GoalWithProgress } from '@/hooks/useData';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { Text } from '../ui/Text';
import { useTheme } from '@/theme';

export function GoalCard({ item }: { item: GoalWithProgress }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { goal, progress, done, milestones } = item;
  const left = goal.targetDate ? diffDays(goal.targetDate, todayKey()) : null;
  return (
    <Card onPress={() => router.push(`/goal/${goal.id}`)} padding={18} accessibilityLabel={tr('goals.cardLabel', { title: goal.title, percent: Math.round(progress * 100) })}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <ProgressRing value={progress} size={64} stroke={7}>
          {goal.completedAt ? <Icon name="trophy" size={22} color={t.accent} /> : <Text variant="caption" style={{ fontFamily: 'Inter_700Bold' }}>{Math.round(progress * 100)}%</Text>}
        </ProgressRing>
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="micro" color="accent">
            {tr(`categories.goal.${goal.category}`).toUpperCase()}
          </Text>
          <Text content variant="heading" numberOfLines={2}>
            {goal.title}
          </Text>
          <Text variant="caption" color="secondary">
            {tr('goals.milestonesCount', { done, total: milestones.length })}
            {goal.completedAt ? ` · ${tr('goals.achieved')}` : left != null ? ` · ${left < 0 ? tr('goals.overdue') : left === 0 ? tr('goals.dueToday') : formatDay(goal.targetDate!)}` : ''}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={t.textTertiary} />
      </View>
    </Card>
  );
}
