import { useMemo } from 'react';
import { dayInitial, lastNDays, todayKey } from '@/lib/date';
import { useFocusSessions, useHabitLogs, useHabits, useJournal, useTasks } from '@/store/entities';
import { useLive } from '@/store/createEntityStore';

export interface DayStat {
  key: string;
  label: string;
  tasks: number;
  habits: number;
  focusMinutes: number;
  mood: number | null;
  total: number;
}

/** Per-day activity over the last `days` days. */
export function useAnalytics(days: number) {
  const tasks = useLive(useTasks);
  const logs = useLive(useHabitLogs);
  const habits = useLive(useHabits);
  const sessions = useLive(useFocusSessions);
  const journal = useLive(useJournal);

  return useMemo(() => {
    const keys = lastNDays(days);
    const map = new Map<string, DayStat>(
      keys.map((key) => [key, { key, label: dayInitial(key), tasks: 0, habits: 0, focusMinutes: 0, mood: null, total: 0 }]),
    );
    for (const t of tasks) {
      if (t.completed && t.completedAt) {
        const d = map.get(todayKey(new Date(t.completedAt)));
        if (d) d.tasks += 1;
      }
    }
    for (const l of logs) {
      const d = map.get(l.logDate);
      if (d) d.habits += 1;
    }
    for (const s of sessions) {
      if (!s.completed) continue;
      const d = map.get(todayKey(new Date(s.startedAt)));
      if (d) d.focusMinutes += Math.round(s.durationSeconds / 60);
    }
    for (const j of journal) {
      const d = map.get(j.entryDate);
      if (d) d.mood = j.mood;
    }
    const series = keys.map((k) => {
      const d = map.get(k)!;
      d.total = d.tasks + d.habits;
      return d;
    });
    const sum = (f: (d: DayStat) => number) => series.reduce((a, d) => a + f(d), 0);
    const best = series.reduce((a, d) => (d.total > a.total ? d : a), series[0]);
    const moods = series.filter((d) => d.mood != null);
    const habitCount = habits.filter((h) => !h.archived).length;
    return {
      series,
      tasks: sum((d) => d.tasks),
      habitCheckins: sum((d) => d.habits),
      focusMinutes: sum((d) => d.focusMinutes),
      activeDays: series.filter((d) => d.total > 0 || d.focusMinutes > 0).length,
      bestDay: best && best.total > 0 ? best : null,
      avgMood: moods.length ? moods.reduce((a, d) => a + (d.mood ?? 0), 0) / moods.length : null,
      habitRate: habitCount ? sum((d) => d.habits) / (habitCount * days) : 0,
    };
  }, [days, tasks, logs, habits, sessions, journal]);
}
