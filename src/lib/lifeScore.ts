import { addDays, toKey, todayKey } from './date';
import type { LifeData } from './lifeData';

/** Life Score: a 0-100 snapshot of how well you are looking after your life over the last 7 days. */

export const FOCUS_WEEKLY_TARGET_MIN = 150;
export const MILESTONES_TARGET = 2; // in the last 14 days
export const JOURNAL_TARGET_DAYS = 4;

export type PillarId = 'habits' | 'tasks' | 'focus' | 'goals' | 'reflection';

/** Text lives in the locale files under `lifeScore.pillars.<id>.*` and `lifeScore.bands.<band>`. */
export interface Pillar {
  id: PillarId;
  weight: number;
  /** 0-1 */
  ratio: number;
  /** False when the user has nothing to measure yet (e.g. no habits). Excluded from the score. */
  applicable: boolean;
  /** Interpolation values for `lifeScore.pillars.<id>.detail`. */
  values: Record<string, number>;
}

export type ScoreBand = 'elite' | 'thriving' | 'momentum' | 'warming' | 'starting';

export interface LifeScoreResult {
  score: number;
  band: ScoreBand;
  pillars: Pillar[];
}

export const scoreBand = (score: number): ScoreBand =>
  score >= 90 ? 'elite' : score >= 75 ? 'thriving' : score >= 55 ? 'momentum' : score >= 30 ? 'warming' : 'starting';

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const dayOf = (iso: string) => toKey(new Date(iso));

export function computeLifeScore(data: LifeData, day: string = todayKey()): LifeScoreResult {
  const start = addDays(day, -6);
  const inWindow = (d: string) => d >= start && d <= day;

  // Habits: check-ins vs. every habit every day.
  const checkins = new Set(data.logs.filter((l) => inWindow(l.logDate)).map((l) => `${l.habitId}|${l.logDate}`)).size;
  const habitRatio = data.habitCount ? clamp01(checkins / (data.habitCount * 7)) : 0;

  // Tasks: of everything planned in the window, how much was finished by `day`.
  const planned = data.tasks.filter((t) => (t.dueDate ? inWindow(t.dueDate) : t.completedAt ? inWindow(dayOf(t.completedAt)) : false));
  const finished = planned.filter((t) => t.completed && t.completedAt && dayOf(t.completedAt) <= day);
  const taskRatio = planned.length ? finished.length / planned.length : 0;

  // Focus: minutes against a weekly target.
  const focusMin = data.sessions
    .filter((s) => s.completed && inWindow(dayOf(s.startedAt)))
    .reduce((a, s) => a + s.durationSeconds / 60, 0);
  const focusRatio = clamp01(focusMin / FOCUS_WEEKLY_TARGET_MIN);

  // Goals: milestones reached recently.
  const since = addDays(day, -13);
  const reached = data.milestones.filter((m) => m.completed && m.completedAt && dayOf(m.completedAt) >= since && dayOf(m.completedAt) <= day).length;
  const goalRatio = clamp01(reached / MILESTONES_TARGET);

  // Reflection: journal days.
  const journalDays = new Set(data.journal.filter((j) => inWindow(j.entryDate)).map((j) => j.entryDate)).size;
  const reflectionRatio = clamp01(journalDays / JOURNAL_TARGET_DAYS);

  const pillars: Pillar[] = [
    { id: 'habits', weight: 30, ratio: habitRatio, applicable: data.habitCount > 0, values: { count: checkins } },
    { id: 'tasks', weight: 25, ratio: taskRatio, applicable: planned.length > 0, values: { done: finished.length, total: planned.length } },
    { id: 'focus', weight: 20, ratio: focusRatio, applicable: true, values: { minutes: Math.round(focusMin), target: FOCUS_WEEKLY_TARGET_MIN } },
    { id: 'goals', weight: 15, ratio: goalRatio, applicable: data.goals.length > 0, values: { count: reached } },
    { id: 'reflection', weight: 10, ratio: reflectionRatio, applicable: true, values: { days: journalDays, target: JOURNAL_TARGET_DAYS } },
  ];

  const active = pillars.filter((p) => p.applicable);
  const totalWeight = active.reduce((a, p) => a + p.weight, 0);
  const score = totalWeight === 0 ? 0 : Math.round((100 * active.reduce((a, p) => a + p.weight * p.ratio, 0)) / totalWeight);
  return { score, band: scoreBand(score), pillars };
}

/** The score for each of the last `days` days (oldest first). */
export function lifeScoreTrend(data: LifeData, days = 7, end: string = todayKey()): { day: string; score: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(end, i - (days - 1));
    return { day, score: computeLifeScore(data, day).score };
  });
}

/** The pillar with the most upside (largest weighted gap), for the "next best action" hint. */
export function weakestPillar(result: LifeScoreResult): Pillar | null {
  const active = result.pillars.filter((p) => p.applicable);
  if (!active.length) return null;
  return active.reduce((a, p) => (p.weight * (1 - p.ratio) > a.weight * (1 - a.ratio) ? p : a));
}
