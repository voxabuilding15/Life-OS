import { addDays } from '@/lib/date';
import { completionRate, currentStreak, heatmapGrid, longestStreak } from '@/lib/habits';

const TODAY = '2026-10-11'; // a Sunday
const days = (...offsets: number[]) => new Set(offsets.map((o) => addDays(TODAY, o)));

describe('currentStreak', () => {
  it('is 0 with no check-ins', () => expect(currentStreak(new Set(), TODAY)).toBe(0));
  it('counts consecutive days ending today', () => expect(currentStreak(days(0, -1, -2), TODAY)).toBe(3));
  it('stays alive when only yesterday is checked', () => expect(currentStreak(days(-1, -2, -3, -4), TODAY)).toBe(4));
  it('breaks after a missed day', () => expect(currentStreak(days(-2, -3), TODAY)).toBe(0));
  it('stops at the first gap', () => expect(currentStreak(days(0, -1, -3, -4), TODAY)).toBe(2));
  it('handles month and year boundaries', () => {
    const set = new Set(['2026-12-30', '2026-12-31', '2027-01-01']);
    expect(currentStreak(set, '2027-01-01')).toBe(3);
  });
});

describe('longestStreak', () => {
  it('finds the longest run regardless of order', () => {
    expect(longestStreak(days(-10, -9, -8, -7, -3, -2, -1))).toBe(4);
  });
  it('is 0 for empty', () => expect(longestStreak(new Set())).toBe(0));
});

describe('completionRate', () => {
  it('is the share of the window with a check-in', () => {
    expect(completionRate(days(0, -1, -2), 10, TODAY)).toBeCloseTo(0.3);
  });
});

describe('heatmapGrid', () => {
  it('builds weeks x 7 cells ending with the current week', () => {
    const grid = heatmapGrid(days(0), 15, TODAY);
    expect(grid).toHaveLength(15);
    grid.forEach((col) => expect(col).toHaveLength(7));
    const last = grid[14];
    expect(last[0].key).toBe(TODAY); // Sunday is the first row
    expect(last[0].done).toBe(true);
    expect(last[1].future).toBe(true);
  });
});
