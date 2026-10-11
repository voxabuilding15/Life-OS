import { router } from 'expo-router';
import { View } from 'react-native';
import { diffDays, formatDay, todayKey } from '@/lib/date';
import type { GoalWithProgress } from '@/hooks/useData';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { Text } from '../ui/Text';
import { useTheme } from '@/theme';

export function GoalCard({ item }: { item: GoalWithProgress }) {
  const t = useTheme();
  const { goal, progress, done, milestones } = item;
  const left = goal.targetDate ? diffDays(goal.targetDate, todayKey()) : null;
  return (
    <Card onPress={() => router.push(`/goal/${goal.id}`)} padding={18} accessibilityLabel={`${goal.title}, ${Math.round(progress * 100)} percent`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <ProgressRing value={progress} size={64} stroke={7}>
          {goal.completedAt ? <Icon name="trophy" size={22} color={t.accent} /> : <Text variant="caption" style={{ fontFamily: 'Inter_700Bold' }}>{Math.round(progress * 100)}%</Text>}
        </ProgressRing>
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="micro" color="accent">
            {goal.category.toUpperCase()}
          </Text>
          <Text variant="heading" numberOfLines={2}>
            {goal.title}
          </Text>
          <Text variant="caption" color="secondary">
            {done}/{milestones.length} milestones
            {goal.completedAt ? ' · Achieved' : left != null ? ` · ${left < 0 ? 'Overdue' : left === 0 ? 'Due today' : formatDay(goal.targetDate!)}` : ''}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={t.textTertiary} />
      </View>
    </Card>
  );
}
