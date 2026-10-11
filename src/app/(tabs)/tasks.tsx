import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TaskRow } from '@/components/features/TaskRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Header, SectionHeader } from '@/components/ui/Header';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { useTasksData } from '@/hooks/useData';
import { useI18n } from '@/i18n';
import { formatDay } from '@/lib/date';
import { type Task } from '@/types';

type View_ = 'today' | 'upcoming' | 'completed';

export default function Tasks() {
  const { t: tr } = useI18n();
  const [view, setView] = useState<View_>('today');
  const [shown, setShown] = useState(40);
  const data = useTasksData();

  const upcomingGroups = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const t of data.upcoming) {
      const k = t.dueDate!;
      groups.set(k, [...(groups.get(k) ?? []), t]);
    }
    return [...groups.entries()];
  }, [data.upcoming]);

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={110}>
        <Header title={tr('tabs.tasks')} subtitle={tr('tasks.subtitle', { count: data.today.length })} />
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'today', label: tr('tasks.viewToday') },
            { value: 'upcoming', label: data.upcoming.length ? tr('tasks.viewUpcomingCount', { count: data.upcoming.length }) : tr('tasks.viewUpcoming') },
            { value: 'completed', label: tr('tasks.viewCompleted') },
          ]}
        />

        <View style={{ marginTop: 20, gap: 10 }}>
          {view === 'today' ? (
            <>
              {data.planned > 0 ? (
                <Card padding={16}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <ProgressRing value={data.done / data.planned} size={56} stroke={6}>
                      <Text variant="caption" style={{ fontFamily: 'Inter_700Bold' }}>
                        {data.done}/{data.planned}
                      </Text>
                    </ProgressRing>
                    <View style={{ flex: 1 }}>
                      <Text variant="heading">{data.done === data.planned ? tr('tasks.cleanSweep') : tr('tasks.keepGoing')}</Text>
                      <Text variant="caption" color="secondary">
                        {tr('tasks.earnsXp')}
                      </Text>
                    </View>
                  </View>
                </Card>
              ) : null}
              {data.today.slice(0, shown).map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
              {data.today.length > shown ? <Button title={tr('common.showMore', { count: data.today.length - shown })} variant="ghost" size="md" onPress={() => setShown((n) => n + 40)} /> : null}
              {data.doneToday.length > 0 ? (
                <>
                  <SectionHeader title={tr('tasks.doneToday')} />
                  {data.doneToday.slice(0, 30).map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </>
              ) : null}
              {data.planned === 0 ? <EmptyState icon="sunny-outline" title={tr('tasks.emptyTodayTitle')} message={tr('tasks.emptyTodayBody')} actionLabel={tr('tasks.new')} onAction={() => router.push('/task/new')} satellites={['checkmark', 'flash', 'star']} hint={tr('tasks.emptyTodayHint')} /> : null}
            </>
          ) : null}

          {view === 'upcoming' ? (
            upcomingGroups.length ? (
              <>
              {upcomingGroups.slice(0, Math.ceil(shown / 4)).map(([day, tasks]) => (
                <View key={day} style={{ gap: 10 }}>
                  <SectionHeader title={formatDay(day)} />
                  {tasks.slice(0, 20).map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </View>
              ))}
              {upcomingGroups.length > Math.ceil(shown / 4) ? <Button title={tr('common.showMoreDays')} variant="ghost" size="md" onPress={() => setShown((n) => n + 40)} /> : null}
              </>
            ) : (
              <EmptyState icon="calendar-outline" title={tr('tasks.emptyUpcomingTitle')} message={tr('tasks.emptyUpcomingBody')} actionLabel={tr('tasks.emptyUpcomingAction')} onAction={() => router.push('/task/new')} satellites={['time', 'alarm', 'ellipse']} />
            )
          ) : null}

          {view === 'completed' ? (
            data.completed.length ? (
              <>
                {data.completed.slice(0, shown).map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
                {data.completed.length > shown ? <Button title={tr('common.showMore', { count: data.completed.length - shown })} variant="ghost" size="md" onPress={() => setShown((n) => n + 40)} /> : null}
              </>
            ) : (
              <EmptyState icon="trophy-outline" title={tr('tasks.emptyDoneTitle')} message={tr('tasks.emptyDoneBody')} satellites={['checkmark-done', 'flash', 'star']} />
            )
          ) : null}
        </View>
      </Screen>
      <Fab onPress={() => router.push('/task/new')} label={tr('tasks.new')} />
    </View>
  );
}
