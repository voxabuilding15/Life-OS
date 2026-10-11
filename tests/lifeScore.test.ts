import { addDays } from '@/lib/date';
import { emptyLifeData, type LifeData } from '@/lib/lifeData';
import { computeLifeScore, lifeScoreTrend, scoreBand, weakestPillar } from '@/lib/lifeScore';
import { buildWeeklyReport } from '@/lib/report';
import { currentStreak } from '@/lib/habits';
import { freezeOffer, freezesLeft, parseFreezeKey, freezeKey } from '@/lib/freeze';
import type { Task } from '@/types';

const DAY = '2026-10-11';
const iso = (day: string, h = 12) => new Date(`${day}T${String(h).padStart(2, '0')}:00:00`).toISOString();
const base = { id: 'x', createdAt: iso(DAY), updatedAt: iso(DAY), deletedAt: null };
const task = (over: Partial<Task>): Task => ({ ...base, title: 't', description: '', category: 'Work', priority: 'medium', dueDate: DAY, reminderAt: null, completed: false, completedAt: null, ...over });

describe('Life Score', () => {
  it('is 0 for a brand new user and in range 0-100', () => {
    expect(computeLifeScore(emptyLifeData(), DAY).score).toBe(0);
  });

  it('renormalises over applicable pillars only (no habits/goals/tasks yet)', () => {
    const data: LifeData = { ...emptyLifeData(), sessions: [{ ...base, startedAt: iso(DAY), durationSeconds: 150 * 60, plannedSeconds: 0, completed: true, taskId: null }] };
    const r = computeLifeScore(data, DAY);
    // focus (20) full, reflection (10) empty => 20/30
    expect(r.score).toBe(67);
  });

  it('scores a perfect week at 100', () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(DAY, -i));
    const data: LifeData = {
      tasks: [task({ completed: true, completedAt: iso(DAY) })],
      habitCount: 1,
      logs: days.map((d, i) => ({ ...base, id: `l${i}`, habitId: 'h', logDate: d })),
      sessions: [{ ...base, startedAt: iso(DAY), durationSeconds: 150 * 60, plannedSeconds: 0, completed: true, taskId: null }],
      milestones: [0, 1].map((i) => ({ ...base, id: `m${i}`, goalId: 'g', title: 'm', position: i, completed: true, completedAt: iso(DAY) })),
      goals: [{ ...base, title: 'g', description: '', category: 'Career', targetDate: null, completedAt: null }],
      journal: days.slice(0, 4).map((d, i) => ({ ...base, id: `j${i}`, entryDate: d, mood: 4, body: '' })),
    };
    expect(computeLifeScore(data, DAY).score).toBe(100);
  });

  it('only counts the last 7 days and reflects missed tasks', () => {
    const data: LifeData = { ...emptyLifeData(), tasks: [task({ completed: true, completedAt: iso(DAY) }), task({}), task({ dueDate: addDays(DAY, -30), completed: true, completedAt: iso(addDays(DAY, -30)) })] };
    const r = computeLifeScore(data, DAY);
    expect(r.pillars.find((p) => p.id === 'tasks')!.ratio).toBeCloseTo(0.5);
  });

  it('builds a trend and picks the weakest pillar', () => {
    const data = { ...emptyLifeData(), habitCount: 2 };
    expect(lifeScoreTrend(data, 7, DAY)).toHaveLength(7);
    expect(weakestPillar(computeLifeScore(data, DAY))?.id).toBe('habits');
  });

  it('labels bands', () => {
    expect(scoreBand(10)).toBe('starting');
    expect(scoreBand(60)).toBe('momentum');
    expect(scoreBand(95)).toBe('elite');
  });
});

describe('weekly report', () => {
  it('compares this week to last and finds the best day', () => {
    const data: LifeData = {
      ...emptyLifeData(),
      habitCount: 1,
      tasks: [task({ completed: true, completedAt: iso(DAY) }), task({ completed: true, completedAt: iso(DAY) }), task({ completed: true, completedAt: iso(addDays(DAY, -9)) })],
      logs: [{ ...base, habitId: 'h1', logDate: DAY }],
    };
    const r = buildWeeklyReport(data, DAY);
    expect(r.tasks).toEqual({ current: 2, previous: 1 });
    expect(r.bestDay).toEqual({ day: DAY, wins: 3 });
    expect(r.topHabit).toEqual({ habitId: 'h1', count: 1 });
    expect(r.activeDays).toBe(1);
    expect(r.highlights.length).toBeGreaterThan(0);
    expect(r.highlights[0]).toEqual({ key: 'tasksDelta', values: { count: 2, delta: 1 } });
    expect(r.tipPillar).not.toBeNull();
  });

  it('handles an empty week', () => {
    const r = buildWeeklyReport(emptyLifeData(), DAY);
    expect(r.headline).toBe('fresh');
    expect(r.bestDay).toBeNull();
  });
});

describe('streak freeze logic', () => {
  const done = (...offsets: number[]) => new Set(offsets.map((o) => addDays(DAY, o)));

  it('a frozen day bridges a gap without adding to the streak', () => {
    expect(currentStreak(done(-2, -3, -4), DAY, new Set())).toBe(0);
    expect(currentStreak(done(-2, -3, -4), DAY, done(-1))).toBe(3);
    expect(currentStreak(done(0, -2, -3), DAY, done(-1))).toBe(3);
  });

  it('offers a freeze only when it would save a streak', () => {
    expect(freezeOffer(done(-2, -3, -4), new Set(), DAY)).toEqual({ savedStreak: 3, day: addDays(DAY, -1) });
    expect(freezeOffer(done(-1, -2), new Set(), DAY)).toBeNull(); // streak alive already
    expect(freezeOffer(done(-4, -5), new Set(), DAY)).toBeNull(); // nothing to save
    expect(freezeOffer(done(0, -2), new Set(), DAY)).toBeNull(); // done today
  });

  it('counts monthly allowance and round-trips keys', () => {
    const now = new Date('2026-10-20T10:00:00');
    expect(freezesLeft([], now)).toBe(2);
    expect(freezesLeft([new Date('2026-10-02T10:00:00').toISOString(), new Date('2026-09-30T10:00:00').toISOString()], now)).toBe(1);
    expect(parseFreezeKey(freezeKey('abc-1', DAY))).toEqual({ habitId: 'abc-1', day: DAY });
    expect(parseFreezeKey('challenge:x')).toBeNull();
  });
});
