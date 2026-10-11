export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Soft delete so removals can be synced to other devices. */
  deletedAt: string | null;
}

export type Priority = 'low' | 'medium' | 'high';

export const TASK_CATEGORIES = ['Personal', 'Work', 'Study', 'Health', 'Finance', 'Creative'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface Task extends Entity {
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  /** 'YYYY-MM-DD' or null (someday). */
  dueDate: string | null;
  /** ISO timestamp of the reminder, if any. */
  reminderAt: string | null;
  completed: boolean;
  completedAt: string | null;
}

export interface Habit extends Entity {
  name: string;
  icon: string;
  /** 'HH:mm' daily reminder or null. */
  reminderTime: string | null;
  archived: boolean;
}

export interface HabitLog extends Entity {
  habitId: string;
  /** 'YYYY-MM-DD' */
  logDate: string;
}

export const GOAL_CATEGORIES = ['Career', 'Learning', 'Fitness', 'Finance', 'Personal', 'Creative'] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export interface Goal extends Entity {
  title: string;
  description: string;
  category: GoalCategory;
  targetDate: string | null;
  completedAt: string | null;
}

export interface GoalMilestone extends Entity {
  goalId: string;
  title: string;
  position: number;
  completed: boolean;
  completedAt: string | null;
}

export const NOTE_CATEGORIES = ['Ideas', 'Work', 'Study', 'Life', 'Reading'] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

export interface Note extends Entity {
  title: string;
  body: string;
  category: NoteCategory;
  isFavorite: boolean;
}

export interface JournalEntry extends Entity {
  /** 'YYYY-MM-DD' - one entry per day. */
  entryDate: string;
  /** 1 (rough) - 5 (great) */
  mood: number;
  body: string;
}

export interface FocusSession extends Entity {
  startedAt: string;
  durationSeconds: number;
  plannedSeconds: number;
  completed: boolean;
  taskId: string | null;
}

export interface AchievementRecord extends Entity {
  key: string;
  unlockedAt: string;
}

/** Labels live in the locale files under `onboarding.objectives.<id>`. */
export const OBJECTIVES = [
  { id: 'productivity', icon: 'flash' },
  { id: 'fitness', icon: 'barbell' },
  { id: 'learning', icon: 'school' },
  { id: 'career', icon: 'briefcase' },
  { id: 'finance', icon: 'wallet' },
  { id: 'growth', icon: 'leaf' },
] as const;
export type ObjectiveId = (typeof OBJECTIVES)[number]['id'];
