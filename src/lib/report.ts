import { addDays, dayInitial, toKey, todayKey } from './date';
import type { LifeData } from './lifeData';
import { computeLifeScore, weakestPillar, type PillarId } from './lifeScore';

export interface Delta {
  current: number;
  previous: number;
}

/** A translatable sentence: `report.highlights.<key>` with `values`. */
export interface Highlight {
  key: 'tasks' | 'tasksDelta' | 'habits' | 'focus' | 'milestones' | 'bestDay';
  values: Record<string, number | string>;
}

export type Headline = 'fresh' | 'rising' | 'quiet' | 'consistent' | 'steady';

export interface WeeklyReport {
  start: string;
  end: string;
  tasks: Delta;
  habits: Delta;
  focusMinutes: Delta;
  journal: Delta;
  milestones: Delta;
  lifeScore: Delta;
  activeDays: number;
  perDay: { day: string; label: string; wins: number }[];
  bestDay: { day: string; wins: number } | null;
  topHabit: { habitId: string; count: number } | null;
  highlights: Highlight[];
  /** Pillar whose tip to show (`lifeScore.pillars.<id>.tip`), or null for the empty-state tip. */
  tipPillar: PillarId | null;
  headline: Headline;
}

const dayOf = (iso: string) => toKey(new Date(iso));

function windowStats(data: LifeData, end: string) {
  const start = addDays(end, -6);
  const inW = (d: string) => d >= start && d <= end;
  const tasksDone = data.tasks.filter((t) => t.completed && t.completedAt && inW(dayOf(t.completedAt)));
  const logs = data.logs.filter((l) => inW(l.logDate));
  const focus = data.sessions.filter((s) => s.completed && inW(dayOf(s.startedAt)));
  const journal = data.journal.filter((j) => inW(j.entryDate));
  const milestones = data.milestones.filter((m) => m.completed && m.completedAt && inW(dayOf(m.completedAt)));
  return {
    tasksDone,
    logs,
    focusMinutes: Math.round(focus.reduce((a, s) => a + s.durationSeconds / 60, 0)),
    journal: journal.length,
    milestones: milestones.length,
  };
}

/** Pure weekly report for the 7 days ending `end`, compared with the 7 days before. */
export function buildWeeklyReport(data: LifeData, end: string = todayKey()): WeeklyReport {
  const cur = windowStats(data, end);
  const prev = windowStats(data, addDays(end, -7));
  const start = addDays(end, -6);

  const perDay = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    const wins =
      cur.tasksDone.filter((t) => dayOf(t.completedAt!) === day).length + cur.logs.filter((l) => l.logDate === day).length;
    return { day, label: dayInitial(day), wins };
  });
  const best = perDay.reduce((a, d) => (d.wins > a.wins ? d : a), perDay[0]);
  const bestDay = best.wins > 0 ? { day: best.day, wins: best.wins } : null;

  const byHabit = new Map<string, number>();
  for (const l of cur.logs) byHabit.set(l.habitId, (byHabit.get(l.habitId) ?? 0) + 1);
  const topEntry = [...byHabit.entries()].sort((a, b) => b[1] - a[1])[0];
  const topHabit = topEntry ? { habitId: topEntry[0], count: topEntry[1] } : null;

  const scoreNow = computeLifeScore(data, end);
  const scorePrev = computeLifeScore(data, addDays(end, -7));
  const activeDays = perDay.filter((d) => d.wins > 0).length;

  const diff = (c: number, p: number) => c - p;
  const highlights: Highlight[] = [];
  const dTasks = diff(cur.tasksDone.length, prev.tasksDone.length);
  if (cur.tasksDone.length) highlights.push(dTasks > 0 ? { key: 'tasksDelta', values: { count: cur.tasksDone.length, delta: dTasks } } : { key: 'tasks', values: { count: cur.tasksDone.length } });
  if (cur.logs.length) highlights.push({ key: 'habits', values: { count: cur.logs.length } });
  if (cur.focusMinutes) highlights.push({ key: 'focus', values: { minutes: cur.focusMinutes } });
  if (cur.milestones) highlights.push({ key: 'milestones', values: { count: cur.milestones } });
  // `day` is the ISO date; the screen formats it with the active language.
  if (bestDay) highlights.push({ key: 'bestDay', values: { day: bestDay.day, wins: bestDay.wins } });

  const weak = weakestPillar(scoreNow);
  const tipPillar = weak ? weak.id : null;
  const d = scoreNow.score - scorePrev.score;
  const headline: Headline = activeDays === 0 ? 'fresh' : d >= 5 ? 'rising' : d <= -5 ? 'quiet' : activeDays >= 6 ? 'consistent' : 'steady';

  return {
    start,
    end,
    tasks: { current: cur.tasksDone.length, previous: prev.tasksDone.length },
    habits: { current: cur.logs.length, previous: prev.logs.length },
    focusMinutes: { current: cur.focusMinutes, previous: prev.focusMinutes },
    journal: { current: cur.journal, previous: prev.journal },
    milestones: { current: cur.milestones, previous: prev.milestones },
    lifeScore: { current: scoreNow.score, previous: scorePrev.score },
    activeDays,
    perDay,
    bestDay,
    topHabit,
    highlights,
    tipPillar,
    headline,
  };
}
