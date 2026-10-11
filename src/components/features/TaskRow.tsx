import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { diffDays, formatDay, todayKey } from '@/lib/date';
import { toggleTask } from '@/services/actions';
import { useI18n } from '@/i18n';
import { alpha, radius, useTheme } from '@/theme';
import type { Task } from '@/types';
import { Checkbox } from '../ui/Checkbox';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';

const PRIORITY_ICON = { high: 'chevron-up-circle', medium: 'remove-circle', low: 'chevron-down-circle' } as const;

export const TaskRow = memo(function TaskRow({ task, compact }: { task: Task; compact?: boolean }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const overdue = !task.completed && task.dueDate && diffDays(task.dueDate, todayKey()) < 0;
  return (
    <Animated.View layout={LinearTransition.springify().damping(18)} exiting={FadeOut.duration(180)}>
      <PressableScale
        onPress={() => router.push({ pathname: '/task/new', params: { id: task.id } })}
        feedback="none"
        scaleTo={0.99}
        style={[styles.row, compact ? styles.compact : { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radius.lg, padding: 14 }]}
        accessibilityLabel={tr('tasks.rowLabel', { title: task.title, state: tr(task.completed ? 'tasks.stateDone' : 'tasks.stateOpen') })}
      >
        <Checkbox checked={task.completed} onToggle={() => toggleTask(task.id)} label={tr('tasks.complete', { title: task.title })} />
        <View style={styles.body}>
          <Text content variant="bodyMedium" numberOfLines={1} style={task.completed && { textDecorationLine: 'line-through', color: t.textTertiary }}>
            {task.title}
          </Text>
          <View style={styles.meta}>
            <Text variant="caption" color="tertiary">
              {tr(`categories.task.${task.category}`)}
            </Text>
            {task.dueDate ? (
              <Text variant="caption" color={overdue ? 'primary' : 'tertiary'} style={overdue && { fontFamily: 'Inter_600SemiBold' }}>
                · {overdue ? `${tr('tasks.overdue')} · ` : ''}
                {formatDay(task.dueDate)}
              </Text>
            ) : null}
            {task.reminderAt ? <Icon name="notifications-outline" size={12} color={t.textTertiary} /> : null}
          </View>
        </View>
        {!task.completed ? (
          <View style={[styles.prio, { backgroundColor: task.priority === 'high' ? t.accentSoft : 'transparent' }]}>
            <Icon name={PRIORITY_ICON[task.priority]} size={18} color={task.priority === 'high' ? t.accent : alpha('#FFFFFF', task.priority === 'medium' ? 0.4 : 0.22)} />
          </View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  compact: { paddingVertical: 8 },
  body: { flex: 1, gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  prio: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
