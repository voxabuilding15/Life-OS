import { todayKey } from '@/lib/date';
import {
  ACHIEVEMENTS,
  levelFromXp,
  newlyUnlocked,
  XP,
  type AchievementStats,
  type XpSource,
} from '@/lib/gamification';
import { longestStreak } from '@/lib/habits';
import { config } from '@/lib/config';
import { nowIso } from '@/lib/id';
import {
  liveItems,
  useAchievementRecords,
  useFocusSessions,
  useGoals,
  useHabitLogs,
  useHabits,
  useJournal,
  useMilestones,
  useNotes,
  useTasks,
} from '@/store/entities';
import { useFeedback } from '@/store/feedback';
import { useProfile } from '@/store/profile';
import { useSubscription } from '@/store/subscription';
import type { FocusSession, Goal, Habit, JournalEntry, Note, Task } from '@/types';
import { cancelHabitReminder, cancelTaskReminder, scheduleHabitReminder, scheduleTaskReminder } from './notifications';

/* ------------------------------------------------------------------ */
/* Gamification core                                                   */
/* ------------------------------------------------------------------ */

export function achievementStats(): AchievementStats {
  const logs = liveItems(useHabitLogs);
  const byHabit = new Map<string, Set<string>>();
  for (const l of logs) {
    if (!byHabit.has(l.habitId)) byHabit.set(l.habitId, new Set());
    byHabit.get(l.habitId)!.add(l.logDate);
  }
  const sessions = liveItems(useFocusSessions).filter((s) => s.completed);
  return {
    tasksCompleted: liveItems(useTasks).filter((t) => t.completed).length,
    habitCheckins: logs.length,
    bestStreak: Math.max(0, ...[...byHabit.values()].map((d) => longestStreak(d))),
    goalsCompleted: liveItems(useGoals).filter((g) => g.completedAt).length,
    focusSessions: sessions.length,
    focusMinutes: Math.round(sessions.reduce((a, s) => a + s.durationSeconds, 0) / 60),
    notes: liveItems(useNotes).length,
    journalEntries: liveItems(useJournal).length,
    level: 0, // filled in by checkAchievements
  };
}

export function checkAchievements(): void {
  const profile = useProfile.getState();
  const unlocked = new Set(liveItems(useAchievementRecords).map((a) => a.key));
  const stats = achievementStats();
  stats.level = levelFromXp(profile.xp);
  for (const a of newlyUnlocked(stats, unlocked, useSubscription.getState().isPro)) {
    useAchievementRecords.getState().add({ key: a.key, unlockedAt: nowIso() });
    useFeedback.getState().push({ type: 'achievement', achievement: a });
  }
}

/** Award (or take back, when `sign` is -1) XP for an action. Positive awards show the popup + level-up. */
export function awardXp(source: XpSource, label: string, sign: 1 | -1 = 1): void {
  const amount = XP[source] * sign;
  const { before, after } = useProfile.getState().addXp(amount);
  const feedback = useFeedback.getState();
  if (sign > 0) {
    feedback.push({ type: 'xp', amount, label });
    // Let the XP pop land first, then celebrate.
    if (after > before) setTimeout(() => useFeedback.getState().push({ type: 'levelUp', from: before, to: after }), 900);
  }
  checkAchievements();
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export type TaskInput = Pick<Task, 'title' | 'description' | 'category' | 'priority' | 'dueDate' | 'reminderAt'>;

export function createTask(input: TaskInput): Task {
  const task = useTasks.getState().add({ ...input, title: input.title.trim(), completed: false, completedAt: null });
  void scheduleTaskReminder(task);
  return task;
}

export function updateTask(id: string, input: Partial<TaskInput>): void {
  const task = useTasks.getState().update(id, input);
  if (task) void scheduleTaskReminder(task);
}

export function deleteTask(id: string): void {
  useTasks.getState().remove(id);
  void cancelTaskReminder(id);
}

export function toggleTask(id: string): void {
  const store = useTasks.getState();
  const task = store.items[id];
  if (!task || task.deletedAt) return;
  if (task.completed) {
    store.update(id, { completed: false, completedAt: null });
    awardXp('task', 'Task reopened', -1);
    const next = useTasks.getState().items[id];
    if (next) void scheduleTaskReminder(next);
  } else {
    store.update(id, { completed: true, completedAt: nowIso() });
    void cancelTaskReminder(id);
    awardXp('task', 'Task completed');
  }
}

/* ------------------------------------------------------------------ */
/* Habits                                                              */
/* ------------------------------------------------------------------ */

export const canCreateHabit = (): boolean =>
  useSubscription.getState().isPro || liveItems(useHabits).filter((h) => !h.archived).length < config.freeHabitLimit;

export type HabitInput = Pick<Habit, 'name' | 'icon' | 'reminderTime'>;

export function createHabit(input: HabitInput): Habit | null {
  if (!canCreateHabit()) return null;
  const habit = useHabits.getState().add({ ...input, name: input.name.trim(), archived: false });
  void scheduleHabitReminder(habit);
  return habit;
}

export function deleteHabit(id: string): void {
  useHabits.getState().remove(id);
  liveItems(useHabitLogs)
    .filter((l) => l.habitId === id)
    .forEach((l) => useHabitLogs.getState().remove(l.id));
  void cancelHabitReminder(id);
}

export function toggleHabit(habitId: string, date: string = todayKey()): boolean {
  const logs = useHabitLogs.getState();
  const matching = Object.values(logs.items).filter((l) => l.habitId === habitId && l.logDate === date);
  const active = matching.filter((l) => !l.deletedAt);
  if (active.length) {
    active.forEach((l) => logs.remove(l.id));
    if (date === todayKey()) awardXp('habit', 'Habit unchecked', -1);
    else useProfile.getState().addXp(-XP.habit);
    return false;
  }
  const revived = matching[0];
  if (revived) logs.update(revived.id, { deletedAt: null });
  else logs.add({ habitId, logDate: date });
  // Backfilled days earn XP too, but without celebration noise.
  if (date === todayKey()) awardXp('habit', 'Habit completed');
  else {
    useProfile.getState().addXp(XP.habit);
    checkAchievements();
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Goals                                                               */
/* ------------------------------------------------------------------ */

export const canCreateGoal = (): boolean =>
  useSubscription.getState().isPro || liveItems(useGoals).filter((g) => !g.completedAt).length < config.freeGoalLimit;

export type GoalInput = Pick<Goal, 'title' | 'description' | 'category' | 'targetDate'>;

export function createGoal(input: GoalInput, milestones: string[]): Goal | null {
  if (!canCreateGoal()) return null;
  const goal = useGoals.getState().add({ ...input, title: input.title.trim(), completedAt: null });
  milestones
    .map((m) => m.trim())
    .filter(Boolean)
    .forEach((title, position) =>
      useMilestones.getState().add({ goalId: goal.id, title, position, completed: false, completedAt: null }),
    );
  return goal;
}

export function addMilestone(goalId: string, title: string): void {
  const existing = liveItems(useMilestones).filter((m) => m.goalId === goalId);
  useMilestones.getState().add({ goalId, title: title.trim(), position: existing.length, completed: false, completedAt: null });
  // A new open milestone re-opens a completed goal.
  const goal = useGoals.getState().items[goalId];
  if (goal?.completedAt) {
    useGoals.getState().update(goalId, { completedAt: null });
    useProfile.getState().addXp(-XP.goal);
  }
}

export function deleteGoal(id: string): void {
  useGoals.getState().remove(id);
  liveItems(useMilestones)
    .filter((m) => m.goalId === id)
    .forEach((m) => useMilestones.getState().remove(m.id));
}

/** Toggles a milestone; completing the last one completes the goal (+500 XP). */
export function toggleMilestone(id: string): { goalCompleted: boolean } {
  const store = useMilestones.getState();
  const m = store.items[id];
  if (!m || m.deletedAt) return { goalCompleted: false };
  const goals = useGoals.getState();
  const goal = goals.items[m.goalId];
  if (m.completed) {
    store.update(id, { completed: false, completedAt: null });
    awardXp('milestone', 'Milestone reopened', -1);
    if (goal?.completedAt) {
      goals.update(goal.id, { completedAt: null });
      useProfile.getState().addXp(-XP.goal);
    }
    return { goalCompleted: false };
  }
  store.update(id, { completed: true, completedAt: nowIso() });
  awardXp('milestone', 'Milestone reached');
  const siblings = liveItems(useMilestones).filter((x) => x.goalId === m.goalId);
  if (goal && !goal.completedAt && siblings.length && siblings.every((x) => x.completed)) {
    goals.update(goal.id, { completedAt: nowIso() });
    awardXp('goal', 'Goal achieved');
    return { goalCompleted: true };
  }
  return { goalCompleted: false };
}

/* ------------------------------------------------------------------ */
/* Focus, notes, journal                                               */
/* ------------------------------------------------------------------ */

export function logFocusSession(s: Pick<FocusSession, 'startedAt' | 'durationSeconds' | 'plannedSeconds' | 'completed' | 'taskId'>): void {
  if (s.durationSeconds < 60) return; // ignore accidental starts
  useFocusSessions.getState().add(s);
  if (s.completed) awardXp('focusSession', 'Focus session complete');
}

export type NoteInput = Pick<Note, 'title' | 'body' | 'category'>;

export function saveNote(id: string | null, input: NoteInput): Note | undefined {
  if (id) return useNotes.getState().update(id, input);
  const note = useNotes.getState().add({ ...input, isFavorite: false });
  checkAchievements();
  return note;
}

export function saveJournal(date: string, mood: number, body: string): JournalEntry {
  const store = useJournal.getState();
  const existing = Object.values(store.items).find((e) => e.entryDate === date);
  if (existing) {
    const wasDeleted = Boolean(existing.deletedAt);
    const updated = store.update(existing.id, { mood, body, deletedAt: null })!;
    if (wasDeleted) awardXp('journal', 'Journal entry');
    return updated;
  }
  const created = store.add({ entryDate: date, mood, body });
  awardXp('journal', 'Journal entry');
  return created;
}

export const ALL_ACHIEVEMENTS = ACHIEVEMENTS;
