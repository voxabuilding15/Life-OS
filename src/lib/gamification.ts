import { t } from '@/i18n';

/** Pure XP / level / achievement rules. No I/O so everything here is unit-testable. */

export const XP = {
  task: 10,
  habit: 20,
  goal: 500,
  milestone: 40,
  focusSession: 30,
  journal: 15,
  challengeAll: 50,
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

/** Locale key of the title for a level (`levels.<n>`), one title per three levels. */
export const levelTitleKey = (level: number): string => `levels.${Math.min(7, Math.floor((level - 1) / 3))}`;
export const levelTitle = (level: number): string => t(levelTitleKey(level));

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
  challengesClaimed: number;
  freezesUsed: number;
  lifeScore: number;
}

export const ACHIEVEMENT_CATEGORIES = ['Tasks', 'Habits', 'Focus', 'Goals', 'Mind', 'Growth'] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

/** Text lives in the locale files under `achievements.items.<key>.{title,description}`. */
export interface AchievementDef {
  key: string;
  icon: string;
  category: AchievementCategory;
  /** 1-4: roman-numeral tier within its family; also scales the XP bonus. */
  tier: 1 | 2 | 3 | 4;
  /** Value the stat must reach. */
  target: number;
  value: (s: AchievementStats) => number;
  /** Pro-only achievements only unlock for subscribers ("More achievements"). */
  pro?: boolean;
  /** Bonus XP granted on unlock. */
  xp: number;
}

const TIER_XP = { 1: 25, 2: 50, 3: 100, 4: 200 } as const;

const def = (
  key: string,
  icon: string,
  category: AchievementCategory,
  tier: 1 | 2 | 3 | 4,
  target: number,
  value: (s: AchievementStats) => number,
  pro = false,
): AchievementDef => ({ key, icon, category, tier, target, value, pro, xp: TIER_XP[tier] });

export const ACHIEVEMENTS: AchievementDef[] = [
  def('first_task', 'checkmark-circle', 'Tasks', 1, 1, (s) => s.tasksCompleted),
  def('tasks_25', 'list', 'Tasks', 2, 25, (s) => s.tasksCompleted),
  def('tasks_100', 'trophy', 'Tasks', 3, 100, (s) => s.tasksCompleted),
  def('tasks_500', 'hardware-chip', 'Tasks', 4, 500, (s) => s.tasksCompleted, true),

  def('first_habit', 'repeat', 'Habits', 1, 1, (s) => s.habitCheckins),
  def('streak_7', 'flame', 'Habits', 2, 7, (s) => s.bestStreak),
  def('streak_30', 'flame', 'Habits', 3, 30, (s) => s.bestStreak),
  def('streak_100', 'diamond', 'Habits', 4, 100, (s) => s.bestStreak, true),
  def('habit_100', 'barbell', 'Habits', 3, 100, (s) => s.habitCheckins),
  def('freeze_1', 'snow', 'Habits', 2, 1, (s) => s.freezesUsed, true),

  def('focus_1', 'timer', 'Focus', 1, 1, (s) => s.focusSessions),
  def('focus_25', 'pulse', 'Focus', 2, 25, (s) => s.focusSessions),
  def('focus_10h', 'hourglass', 'Focus', 3, 600, (s) => s.focusMinutes),
  def('focus_100h', 'moon', 'Focus', 4, 6000, (s) => s.focusMinutes, true),

  def('first_goal', 'flag', 'Goals', 2, 1, (s) => s.goalsCompleted),
  def('goals_5', 'rocket', 'Goals', 4, 5, (s) => s.goalsCompleted, true),

  def('first_note', 'document-text', 'Mind', 1, 1, (s) => s.notes),
  def('notes_10', 'library', 'Mind', 2, 10, (s) => s.notes),
  def('journal_7', 'book', 'Mind', 2, 7, (s) => s.journalEntries),
  def('journal_30', 'heart', 'Mind', 3, 30, (s) => s.journalEntries, true),

  def('level_5', 'ribbon', 'Growth', 2, 5, (s) => s.level),
  def('level_10', 'medal', 'Growth', 3, 10, (s) => s.level, true),
  def('challenge_1', 'star', 'Growth', 1, 1, (s) => s.challengesClaimed),
  def('challenge_25', 'star-half', 'Growth', 3, 25, (s) => s.challengesClaimed),
  def('score_70', 'speedometer', 'Growth', 2, 70, (s) => s.lifeScore),
  def('score_90', 'sparkles', 'Growth', 4, 90, (s) => s.lifeScore, true),
];

export const achievementProgress = (a: AchievementDef, s: AchievementStats): number =>
  Math.min(1, Math.max(0, a.value(s) / a.target));

/** Achievements newly earned given current stats, skipping ones already unlocked and Pro ones for free users. */
export const newlyUnlocked = (stats: AchievementStats, unlocked: ReadonlySet<string>, isPro: boolean): AchievementDef[] =>
  ACHIEVEMENTS.filter((a) => !unlocked.has(a.key) && (!a.pro || isPro) && a.value(stats) >= a.target);
