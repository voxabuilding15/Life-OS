import { useMemo } from 'react';
import { challengeKey, challengeProgress, challengesForDay, type Challenge, type DayStats } from '@/lib/challenges';
import { todayKey, toKey } from '@/lib/date';
import { computeLifeScore, lifeScoreTrend, weakestPillar } from '@/lib/lifeScore';
import type { LifeData } from '@/lib/lifeData';
import { buildWeeklyReport } from '@/lib/report';
import { useLive } from '@/store/createEntityStore';
import { useAchievementRecords, useFocusSessions, useGoals, useHabitLogs, useHabits, useJournal, useMilestones, useTasks } from '@/store/entities';
import { useIsPro } from '@/store/subscription';

/** Live, memoised snapshot used by the pure scoring / challenge / report functions. */
export function useLifeData(): LifeData {
  const tasks = useLive(useTasks);
  const habits = useLive(useHabits);
  const logs = useLive(useHabitLogs);
  const sessions = useLive(useFocusSessions);
  const milestones = useLive(useMilestones);
  const goals = useLive(useGoals);
  const journal = useLive(useJournal);
  return useMemo(
    () => ({ tasks, habitCount: habits.filter((h) => !h.archived).length, logs, sessions, milestones, goals, journal }),
    [tasks, habits, logs, sessions, milestones, goals, journal],
  );
}

export function useLifeScore() {
  const data = useLifeData();
  const today = todayKey();
  return useMemo(() => {
    const result = computeLifeScore(data, today);
    const trend = lifeScoreTrend(data, 7, today);
    const yesterday = trend[trend.length - 2]?.score ?? 0;
    return { ...result, trend, delta: result.score - yesterday, weakest: weakestPillar(result) };
  }, [data, today]);
}

export function useWeeklyReport() {
  const data = useLifeData();
  const today = todayKey();
  return useMemo(() => buildWeeklyReport(data, today), [data, today]);
}

export interface ChallengeView extends Challenge {
  current: number;
  done: boolean;
  claimed: boolean;
  locked: boolean;
}

export function useDailyChallenges() {
  const data = useLifeData();
  const records = useLive(useAchievementRecords);
  const isPro = useIsPro();
  const day = todayKey();

  return useMemo(() => {
    const habitDoneToday = new Set(data.logs.filter((l) => l.logDate === day).map((l) => l.habitId));
    const stats: DayStats = {
      tasks: data.tasks.filter((t) => t.completed && t.completedAt && toKey(new Date(t.completedAt)) === day).length,
      habits: habitDoneToday.size,
      allHabitsDone: data.habitCount > 0 && habitDoneToday.size >= data.habitCount,
      focusMinutes: Math.round(
        data.sessions.filter((s) => s.completed && toKey(new Date(s.startedAt)) === day).reduce((a, s) => a + s.durationSeconds / 60, 0),
      ),
      journal: data.journal.some((j) => j.entryDate === day),
      milestones: data.milestones.filter((m) => m.completed && m.completedAt && toKey(new Date(m.completedAt)) === day).length,
    };
    const challenges = challengesForDay(day, {
      hasHabits: data.habitCount > 0,
      hasOpenMilestones: data.milestones.some((m) => !m.completed),
    });
    const claimedKeys = new Set(records.map((r) => r.key));
    const views: ChallengeView[] = challenges.map((c) => ({
      ...c,
      current: challengeProgress(c, stats).current,
      done: challengeProgress(c, stats).done,
      claimed: claimedKeys.has(challengeKey(day, c.id)),
      locked: Boolean(c.bonus) && !isPro,
    }));
    const claimable = views.filter((c) => !c.locked);
    return {
      day,
      stats,
      all: challenges,
      claimedKeys,
      views,
      claimedCount: claimable.filter((c) => c.claimed).length,
      total: claimable.length,
      ready: claimable.filter((c) => c.done && !c.claimed).length,
      allClaimed: claimedKeys.has(challengeKey(day, 'all')),
    };
  }, [data, records, isPro, day]);
}
