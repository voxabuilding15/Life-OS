import { addDays, lastNDays, todayKey } from './date';

/**
 * Current streak: consecutive days with a check-in ending today.
 * If today isn't checked yet the streak is still alive when yesterday was.
 * A frozen day (Streak Freeze) bridges a missed day: it keeps the streak alive without adding to it.
 */
export function currentStreak(doneDays: ReadonlySet<string>, today: string = todayKey(), frozenDays: ReadonlySet<string> = new Set()): number {
  const alive = (d: string) => doneDays.has(d) || frozenDays.has(d);
  let cursor = alive(today) ? today : addDays(today, -1);
  let streak = 0;
  while (alive(cursor)) {
    if (doneDays.has(cursor)) streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(doneDays: ReadonlySet<string>): number {
  const sorted = [...doneDays].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

/** Share of the last `days` days with a check-in, 0-1. */
export function completionRate(doneDays: ReadonlySet<string>, days: number, today: string = todayKey()): number {
  const window = lastNDays(days, today);
  return window.filter((d) => doneDays.has(d)).length / days;
}

export interface HeatCell {
  key: string;
  done: boolean;
  future: boolean;
}

/**
 * Calendar heatmap grid: `weeks` columns of 7 rows (Sun..Sat), ending with the week containing `today`.
 */
export function heatmapGrid(doneDays: ReadonlySet<string>, weeks = 15, today: string = todayKey()): HeatCell[][] {
  const [y, m, d] = today.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const lastSaturday = addDays(today, 6 - dow);
  const start = addDays(lastSaturday, -(weeks * 7 - 1));
  const columns: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let r = 0; r < 7; r++) {
      const key = addDays(start, w * 7 + r);
      col.push({ key, done: doneDays.has(key), future: key > today });
    }
    columns.push(col);
  }
  return columns;
}
