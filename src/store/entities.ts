import type {
  AchievementRecord,
  FocusSession,
  Goal,
  GoalMilestone,
  Habit,
  HabitLog,
  JournalEntry,
  Note,
  Task,
} from '@/types';
import { createEntityStore } from './createEntityStore';

export { liveItems } from './createEntityStore';

export const useTasks = createEntityStore<Task>('tasks');
export const useHabits = createEntityStore<Habit>('habits');
export const useHabitLogs = createEntityStore<HabitLog>('habit_logs');
export const useGoals = createEntityStore<Goal>('goals');
export const useMilestones = createEntityStore<GoalMilestone>('goal_milestones');
export const useNotes = createEntityStore<Note>('notes');
export const useJournal = createEntityStore<JournalEntry>('journal_entries');
export const useFocusSessions = createEntityStore<FocusSession>('focus_sessions');
export const useAchievementRecords = createEntityStore<AchievementRecord>('achievements');

/** Every synced entity store, keyed by its Postgres table name. */
export const ENTITY_STORES = {
  tasks: useTasks,
  habits: useHabits,
  habit_logs: useHabitLogs,
  goals: useGoals,
  goal_milestones: useMilestones,
  notes: useNotes,
  journal_entries: useJournal,
  focus_sessions: useFocusSessions,
  achievements: useAchievementRecords,
} as const;

export const resetAllEntities = () => Object.values(ENTITY_STORES).forEach((s) => s.getState().reset());
