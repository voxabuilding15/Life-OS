import { addDays, dayInitial, shortDay, toKey, todayKey } from './date';
import type { LifeData } from './lifeData';
import { computeLifeScore, weakestPillar } from './lifeScore';

export interface Delta {
  current: number;
  previous: number;
}

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
  highlights: string[];
  tip: string;
  headline: string;
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
  const highlights: string[] = [];
  if (cur.tasksDone.length) highlights.push(`Finished ${cur.tasksDone.length} task${cur.tasksDone.length === 1 ? '' : 's'}${diff(cur.tasksDone.length, prev.tasksDone.length) > 0 ? ` (+${diff(cur.tasksDone.length, prev.tasksDone.length)} vs last week)` : ''}.`);
  if (cur.logs.length) highlights.push(`Logged ${cur.logs.length} habit check-in${cur.logs.length === 1 ? '' : 's'}.`);
  if (cur.focusMinutes) highlights.push(`Focused for ${cur.focusMinutes} minutes.`);
  if (cur.milestones) highlights.push(`Reached ${cur.milestones} goal milestone${cur.milestones === 1 ? '' : 's'}.`);
  if (bestDay) highlights.push(`${shortDay(bestDay.day)} was your strongest day with ${bestDay.wins} wins.`);

  const weak = weakestPillar(scoreNow);
  const tip = weak ? weak.tip : 'Add a habit or a task to start building your Life Score.';
  const d = scoreNow.score - scorePrev.score;
  const headline =
    activeDays === 0
      ? 'A fresh start'
      : d >= 5
        ? 'You are on the rise'
        : d <= -5
          ? 'A quieter week'
          : activeDays >= 6
            ? 'Remarkably consistent'
            : 'Steady progress';

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
    tip,
    headline,
  };
}
