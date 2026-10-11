export type ChallengeMetric = 'tasks' | 'habits' | 'allHabits' | 'focus' | 'journal' | 'milestone';

export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  metric: ChallengeMetric;
  target: number;
  xp: number;
}

export interface Challenge extends ChallengeTemplate {
  /** Pro-only bonus challenge. */
  bonus?: boolean;
}

/** What has been done today; challenge progress is derived from this, never stored. */
export interface DayStats {
  tasks: number;
  habits: number;
  allHabitsDone: boolean;
  focusMinutes: number;
  journal: boolean;
  milestones: number;
}

export interface Availability {
  hasHabits: boolean;
  hasOpenMilestones: boolean;
}

const POOL: ChallengeTemplate[] = [
  { id: 'tasks_2', title: 'Two down', description: 'Complete 2 tasks', icon: 'checkmark-done', metric: 'tasks', target: 2, xp: 25 },
  { id: 'tasks_4', title: 'Task blitz', description: 'Complete 4 tasks', icon: 'flash', metric: 'tasks', target: 4, xp: 45 },
  { id: 'habits_2', title: 'Double check-in', description: 'Check in 2 habits', icon: 'repeat', metric: 'habits', target: 2, xp: 25 },
  { id: 'habits_all', title: 'Clean sweep', description: 'Check in every habit today', icon: 'flame', metric: 'allHabits', target: 1, xp: 40 },
  { id: 'focus_25', title: 'One good session', description: 'Focus for 25 minutes', icon: 'timer', metric: 'focus', target: 25, xp: 30 },
  { id: 'focus_50', title: 'Deep work', description: 'Focus for 50 minutes', icon: 'hourglass', metric: 'focus', target: 50, xp: 50 },
  { id: 'journal_1', title: 'Reflect', description: "Write today's journal entry", icon: 'book', metric: 'journal', target: 1, xp: 25 },
  { id: 'milestone_1', title: 'Move the needle', description: 'Reach a goal milestone', icon: 'flag', metric: 'milestone', target: 1, xp: 40 },
];

/** Small deterministic PRNG so every device picks the same challenges for the same day. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Three challenges with distinct metrics (plus a Pro bonus), the same for everyone on a given day. */
export function challengesForDay(day: string, avail: Availability): Challenge[] {
  const rand = seededRandom(`lifeos:${day}`);
  const pool = POOL.filter((c) => (c.metric === 'habits' || c.metric === 'allHabits' ? avail.hasHabits : c.metric === 'milestone' ? avail.hasOpenMilestones : true));
  const shuffled = [...pool].sort(() => rand() - 0.5);
  const picked: ChallengeTemplate[] = [];
  const metrics = new Set<ChallengeMetric>();
  for (const c of shuffled) {
    if (metrics.has(c.metric)) continue;
    picked.push(c);
    metrics.add(c.metric);
    if (picked.length === 4) break;
  }
  const [a, b, c, bonus] = picked;
  return [a, b, c].filter(Boolean).concat(bonus ? [{ ...bonus, xp: bonus.xp * 2 }] : []).map((ch, i) => ({ ...ch, bonus: i === 3 || undefined }));
}

export function challengeProgress(c: Challenge, s: DayStats): { current: number; target: number; done: boolean } {
  const current =
    c.metric === 'tasks' ? s.tasks : c.metric === 'habits' ? s.habits : c.metric === 'allHabits' ? Number(s.allHabitsDone) : c.metric === 'focus' ? s.focusMinutes : c.metric === 'journal' ? Number(s.journal) : s.milestones;
  return { current: Math.min(current, c.target), target: c.target, done: current >= c.target };
}

export const challengeKey = (day: string, id: string) => `challenge:${day}:${id}`;
export const CHALLENGE_PREFIX = 'challenge:';
