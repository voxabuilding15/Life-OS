import { useMemo } from 'react';
import { achievementStats } from '@/services/actions';
import { useAchievementRecords, useFocusSessions, useGoals, useHabitLogs, useJournal, useNotes, useTasks } from '@/store/entities';
import { useLive } from '@/store/createEntityStore';

/** Lifetime statistics for the profile screen. */
export function useLifetimeStats() {
  const tasks = useLive(useTasks);
  const logs = useLive(useHabitLogs);
  const goals = useLive(useGoals);
  const sessions = useLive(useFocusSessions);
  const notes = useLive(useNotes);
  const journal = useLive(useJournal);
  return useMemo(() => {
    const s = achievementStats();
    return {
      tasksCompleted: s.tasksCompleted,
      habitCheckins: s.habitCheckins,
      bestStreak: s.bestStreak,
      goalsCompleted: s.goalsCompleted,
      focusMinutes: s.focusMinutes,
      notes: s.notes,
      journal: s.journalEntries,
    };
    // Recompute when any underlying collection changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, logs, goals, sessions, notes, journal]);
}

export function useUnlockedKeys(): Set<string> {
  const records = useLive(useAchievementRecords);
  return useMemo(() => new Set(records.map((r) => r.key)), [records]);
}
