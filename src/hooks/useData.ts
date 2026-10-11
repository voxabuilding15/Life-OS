import { useMemo } from 'react';
import { lastNDays, todayKey } from '@/lib/date';
import { completionRate, currentStreak, longestStreak } from '@/lib/habits';
import { levelProgress } from '@/lib/gamification';
import {
  useFocusSessions,
  useGoals,
  useHabitLogs,
  useHabits,
  useJournal,
  useMilestones,
  useNotes,
  useTasks,
} from '@/store/entities';
import { useLive } from '@/store/createEntityStore';
import { useProfile } from '@/store/profile';
import type { Goal, GoalMilestone, Habit } from '@/types';

export function useLevelProgress() {
  const xp = useProfile((s) => s.xp);
  return useMemo(() => ({ ...levelProgress(xp), xp }), [xp]);
}

export function useTodayKey(): string {
  // Day rollover is picked up on the next render triggered by any store change or navigation.
  return todayKey();
}

export function useTasksData() {
  const all = useLive(useTasks);
  const today = todayKey();
  return useMemo(() => {
    const open = all.filter((t) => !t.completed);
    const priorityRank = { high: 0, medium: 1, low: 2 } as const;
    const byPriority = (a: (typeof all)[number], b: (typeof all)[number]) => priorityRank[a.priority] - priorityRank[b.priority];
    const todayTasks = open.filter((t) => !t.dueDate || t.dueDate <= today).sort(byPriority);
    const doneToday = all.filter((t) => t.completed && t.completedAt && todayKey(new Date(t.completedAt)) === today);
    const upcoming = open.filter((t) => t.dueDate && t.dueDate > today).sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
    const completed = all.filter((t) => t.completed).sort((a, b) => ((a.completedAt ?? '') < (b.completedAt ?? '') ? 1 : -1));
    // Today's plan = still-open tasks due today/overdue + those finished today.
    const planned = todayTasks.length + doneToday.length;
    return { all, today: todayTasks, doneToday, upcoming, completed, planned, done: doneToday.length };
  }, [all, today]);
}

export interface HabitWithStats {
  habit: Habit;
  doneDays: Set<string>;
  doneToday: boolean;
  streak: number;
  best: number;
  rate30: number;
}

export function useHabitsData() {
  const habits = useLive(useHabits);
  const logs = useLive(useHabitLogs);
  const today = todayKey();
  return useMemo(() => {
    const byHabit = new Map<string, Set<string>>();
    for (const l of logs) {
      if (!byHabit.has(l.habitId)) byHabit.set(l.habitId, new Set());
      byHabit.get(l.habitId)!.add(l.logDate);
    }
    const items: HabitWithStats[] = habits
      .filter((h) => !h.archived)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      .map((habit) => {
        const doneDays = byHabit.get(habit.id) ?? new Set<string>();
        return {
          habit,
          doneDays,
          doneToday: doneDays.has(today),
          streak: currentStreak(doneDays, today),
          best: longestStreak(doneDays),
          rate30: completionRate(doneDays, 30, today),
        };
      });
    const doneToday = items.filter((i) => i.doneToday).length;
    return { items, doneToday, total: items.length, bestStreak: Math.max(0, ...items.map((i) => i.streak)) };
  }, [habits, logs, today]);
}

export interface GoalWithProgress {
  goal: Goal;
  milestones: GoalMilestone[];
  progress: number;
  done: number;
}

export function useGoalsData() {
  const goals = useLive(useGoals);
  const milestones = useLive(useMilestones);
  return useMemo(() => {
    const byGoal = new Map<string, GoalMilestone[]>();
    for (const m of milestones) {
      if (!byGoal.has(m.goalId)) byGoal.set(m.goalId, []);
      byGoal.get(m.goalId)!.push(m);
    }
    const items: GoalWithProgress[] = goals.map((goal) => {
      const ms = (byGoal.get(goal.id) ?? []).sort((a, b) => a.position - b.position);
      const done = ms.filter((m) => m.completed).length;
      return { goal, milestones: ms, done, progress: goal.completedAt ? 1 : ms.length ? done / ms.length : 0 };
    });
    return {
      active: items.filter((i) => !i.goal.completedAt).sort((a, b) => b.progress - a.progress),
      completed: items.filter((i) => i.goal.completedAt),
      all: items,
    };
  }, [goals, milestones]);
}

export function useFocusData() {
  const sessions = useLive(useFocusSessions);
  return useMemo(() => {
    const done = sessions.filter((s) => s.completed);
    const today = todayKey();
    const week = new Set(lastNDays(7));
    const minutesOn = (pred: (day: string) => boolean) =>
      Math.round(done.filter((s) => pred(todayKey(new Date(s.startedAt)))).reduce((a, s) => a + s.durationSeconds, 0) / 60);
    return {
      sessions,
      todayMinutes: minutesOn((d) => d === today),
      todaySessions: done.filter((s) => todayKey(new Date(s.startedAt)) === today).length,
      weekMinutes: minutesOn((d) => week.has(d)),
      totalMinutes: Math.round(done.reduce((a, s) => a + s.durationSeconds, 0) / 60),
      totalSessions: done.length,
    };
  }, [sessions]);
}

export const useNotesData = () => useLive(useNotes);
export const useJournalData = () => useLive(useJournal);
