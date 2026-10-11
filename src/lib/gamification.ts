/** Pure XP / level / achievement rules. No I/O so everything here is unit-testable. */

export const XP = {
  task: 10,
  habit: 20,
  goal: 500,
  milestone: 40,
  focusSession: 30,
  journal: 15,
} as const;

export type XpSource = keyof typeof XP;

/** XP needed to move from `level` to `level + 1`. Level 1 -> 2 costs 100, then +50 per level. */
export const xpToNext = (level: number): number => 100 + (level - 1) * 50;

/** Total XP required to *reach* `level` (level 1 = 0). */
export const xpForLevel = (level: number): number => {
  const n = level - 1;
  return n <= 0 ? 0 : 100 * n + 25 * n * (n - 1);
};

export const levelFromXp = (xp: number): number => {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  return level;
};

export interface LevelProgress {
  level: number;
  current: number;
  needed: number;
  ratio: number;
}

export const levelProgress = (xp: number): LevelProgress => {
  const safe = Math.max(0, xp);
  const level = levelFromXp(safe);
  const current = safe - xpForLevel(level);
  const needed = xpToNext(level);
  return { level, current, needed, ratio: needed === 0 ? 0 : current / needed };
};

const TITLES = ['Newcomer', 'Explorer', 'Builder', 'Achiever', 'Strategist', 'Architect', 'Master', 'Legend'];
export const levelTitle = (level: number): string => TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 3))];

export interface AchievementStats {
  tasksCompleted: number;
  habitCheckins: number;
  bestStreak: number;
  goalsCompleted: number;
  focusSessions: number;
  focusMinutes: number;
  notes: number;
  journalEntries: number;
  level: number;
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  /** Pro-only achievements only unlock for subscribers ("More achievements"). */
  pro?: boolean;
  test: (s: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: 'first_task', title: 'First Step', description: 'Complete your first task', icon: 'checkmark-circle', test: (s) => s.tasksCompleted >= 1 },
  { key: 'tasks_25', title: 'Getting Things Done', description: 'Complete 25 tasks', icon: 'list', test: (s) => s.tasksCompleted >= 25 },
  { key: 'tasks_100', title: 'Centurion', description: 'Complete 100 tasks', icon: 'trophy', test: (s) => s.tasksCompleted >= 100 },
  { key: 'first_habit', title: 'Habit Forming', description: 'Check in a habit for the first time', icon: 'repeat', test: (s) => s.habitCheckins >= 1 },
  { key: 'streak_7', title: 'On Fire', description: 'Reach a 7 day streak', icon: 'flame', test: (s) => s.bestStreak >= 7 },
  { key: 'streak_30', title: 'Unstoppable', description: 'Reach a 30 day streak', icon: 'flame', test: (s) => s.bestStreak >= 30 },
  { key: 'first_goal', title: 'Dream Achieved', description: 'Complete your first goal', icon: 'flag', test: (s) => s.goalsCompleted >= 1 },
  { key: 'focus_1', title: 'In The Zone', description: 'Finish a focus session', icon: 'timer', test: (s) => s.focusSessions >= 1 },
  { key: 'focus_10h', title: 'Deep Worker', description: 'Focus for 10 hours in total', icon: 'hourglass', test: (s) => s.focusMinutes >= 600 },
  { key: 'first_note', title: 'Thinker', description: 'Write your first note', icon: 'document-text', test: (s) => s.notes >= 1 },
  { key: 'journal_7', title: 'Reflective', description: 'Write 7 journal entries', icon: 'book', test: (s) => s.journalEntries >= 7 },
  { key: 'level_5', title: 'Level 5', description: 'Reach level 5', icon: 'rocket', test: (s) => s.level >= 5 },
  // Pro
  { key: 'streak_100', title: 'Centennial', description: 'Reach a 100 day streak', icon: 'diamond', pro: true, test: (s) => s.bestStreak >= 100 },
  { key: 'tasks_500', title: 'Machine', description: 'Complete 500 tasks', icon: 'hardware-chip', pro: true, test: (s) => s.tasksCompleted >= 500 },
  { key: 'focus_100h', title: 'Monk Mode', description: 'Focus for 100 hours in total', icon: 'moon', pro: true, test: (s) => s.focusMinutes >= 6000 },
  { key: 'level_10', title: 'Level 10', description: 'Reach level 10', icon: 'ribbon', pro: true, test: (s) => s.level >= 10 },
];

/** Keys newly earned given current stats, skipping ones already unlocked and Pro ones for free users. */
export const newlyUnlocked = (stats: AchievementStats, unlocked: ReadonlySet<string>, isPro: boolean): AchievementDef[] =>
  ACHIEVEMENTS.filter((a) => !unlocked.has(a.key) && (!a.pro || isPro) && a.test(stats));
