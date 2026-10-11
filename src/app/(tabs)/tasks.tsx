import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { TaskRow } from '@/components/features/TaskRow';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Header, SectionHeader } from '@/components/ui/Header';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { useTasksData } from '@/hooks/useData';
import { formatDay } from '@/lib/date';
import { type Task } from '@/types';

type View_ = 'today' | 'upcoming' | 'completed';

export default function Tasks() {
  const [view, setView] = useState<View_>('today');
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
        <Header title="Tasks" subtitle={`${data.today.length} to do today`} />
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'upcoming', label: `Upcoming${data.upcoming.length ? ` · ${data.upcoming.length}` : ''}` },
            { value: 'completed', label: 'Completed' },
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
                      <Text variant="heading">{data.done === data.planned ? 'Clean sweep' : 'Keep going'}</Text>
                      <Text variant="caption" color="secondary">
                        Every task you finish earns +10 XP.
                      </Text>
                    </View>
                  </View>
                </Card>
              ) : null}
              {data.today.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
              {data.doneToday.length > 0 ? (
                <>
                  <SectionHeader title="Done today" />
                  {data.doneToday.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </>
              ) : null}
              {data.planned === 0 ? <EmptyState icon="sunny-outline" title="A clear day" message="Plan what matters. Add your first task for today." actionLabel="New task" onAction={() => router.push('/task/new')} /> : null}
            </>
          ) : null}

          {view === 'upcoming' ? (
            upcomingGroups.length ? (
              upcomingGroups.map(([day, tasks]) => (
                <View key={day} style={{ gap: 10 }}>
                  <SectionHeader title={formatDay(day)} />
                  {tasks.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </View>
              ))
            ) : (
              <EmptyState icon="calendar-outline" title="Nothing scheduled" message="Tasks with a future date will show up here." actionLabel="New task" onAction={() => router.push('/task/new')} />
            )
          ) : null}

          {view === 'completed' ? (
            data.completed.length ? (
              data.completed.map((t) => <TaskRow key={t.id} task={t} />)
            ) : (
              <EmptyState icon="trophy-outline" title="No wins yet" message="Completed tasks will be collected here." />
            )
          ) : null}
        </View>
      </Screen>
      <Fab onPress={() => router.push('/task/new')} label="New task" />
    </View>
  );
}
