import type { FocusSession, Goal, GoalMilestone, HabitLog, JournalEntry, Task } from '@/types';

/** Snapshot of the user's (non-deleted) data that the pure scoring / report functions work on. */
export interface LifeData {
  tasks: Task[];
  habitCount: number;
  logs: HabitLog[];
  sessions: FocusSession[];
  milestones: GoalMilestone[];
  goals: Goal[];
  journal: JournalEntry[];
}

export const emptyLifeData = (): LifeData => ({ tasks: [], habitCount: 0, logs: [], sessions: [], milestones: [], goals: [], journal: [] });
