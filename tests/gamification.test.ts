import { ACHIEVEMENTS, levelFromXp, levelProgress, newlyUnlocked, xpForLevel, xpToNext, XP, type AchievementStats } from '@/lib/gamification';

describe('xp curve', () => {
  it('awards the specified XP per action', () => {
    expect(XP.task).toBe(10);
    expect(XP.habit).toBe(20);
    expect(XP.goal).toBe(500);
  });

  it('costs 100 XP for level 1 -> 2 and 50 more each level', () => {
    expect(xpToNext(1)).toBe(100);
    expect(xpToNext(2)).toBe(150);
    expect(xpToNext(5)).toBe(300);
  });

  it('xpForLevel is the running sum of xpToNext', () => {
    let sum = 0;
    for (let level = 1; level <= 30; level++) {
      expect(xpForLevel(level)).toBe(sum);
      sum += xpToNext(level);
    }
  });

  it('levelFromXp matches the thresholds (and the SQL level_from_xp function)', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(249)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
    expect(levelFromXp(300)).toBe(3); // SQL level_from_xp(300) = 3, verified against Postgres
    expect(levelFromXp(449)).toBe(3);
    expect(levelFromXp(450)).toBe(4);
    expect(levelFromXp(-50)).toBe(1);
  });

  it('level 5 -> 6 boundary', () => {
    const at6 = xpForLevel(6);
    expect(levelFromXp(at6 - 1)).toBe(5);
    expect(levelFromXp(at6)).toBe(6);
  });

  it('reports progress inside the current level', () => {
    const p = levelProgress(445);
    expect(p).toMatchObject({ level: 3, current: 195, needed: 200 });
    expect(p.ratio).toBeCloseTo(0.975);
  });
});

describe('achievements', () => {
  const zero: AchievementStats = { tasksCompleted: 0, habitCheckins: 0, bestStreak: 0, goalsCompleted: 0, focusSessions: 0, focusMinutes: 0, notes: 0, journalEntries: 0, level: 1 };

  it('unlocks only what the stats satisfy and never twice', () => {
    const first = newlyUnlocked({ ...zero, tasksCompleted: 1 }, new Set(), false).map((a) => a.key);
    expect(first).toEqual(['first_task']);
    expect(newlyUnlocked({ ...zero, tasksCompleted: 1 }, new Set(['first_task']), false)).toHaveLength(0);
  });

  it('keeps Pro achievements locked for free users', () => {
    const stats = { ...zero, bestStreak: 120, level: 12 };
    const free = newlyUnlocked(stats, new Set(), false).map((a) => a.key);
    const pro = newlyUnlocked(stats, new Set(), true).map((a) => a.key);
    expect(free).not.toContain('streak_100');
    expect(pro).toContain('streak_100');
    expect(pro).toContain('level_10');
  });

  it('has unique keys', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.key)).size).toBe(ACHIEVEMENTS.length);
  });
});
