import { addDays, todayKey } from './date';
import { currentStreak } from './habits';

/** Streak Freeze (Pro): protects one missed day so a streak is not lost. */
export const FREEZES_PER_MONTH = 2;
export const FREEZE_PREFIX = 'freeze:';

export const freezeKey = (habitId: string, day: string) => `${FREEZE_PREFIX}${habitId}:${day}`;

export const parseFreezeKey = (key: string): { habitId: string; day: string } | null => {
  if (!key.startsWith(FREEZE_PREFIX)) return null;
  const rest = key.slice(FREEZE_PREFIX.length);
  const i = rest.lastIndexOf(':');
  return i < 0 ? null : { habitId: rest.slice(0, i), day: rest.slice(i + 1) };
};

/** Freezes left this calendar month, counted by when each freeze was used. */
export function freezesLeft(usedAtIso: string[], now: Date = new Date()): number {
  const month = todayKey(now).slice(0, 7);
  const used = usedAtIso.filter((iso) => todayKey(new Date(iso)).slice(0, 7) === month).length;
  return Math.max(0, FREEZES_PER_MONTH - used);
}

export interface FreezeOffer {
  /** The streak that would be saved by freezing yesterday. */
  savedStreak: number;
  day: string;
}

/**
 * A freeze is worth offering when yesterday was missed, today isn't done yet,
 * and freezing yesterday would revive a streak (> 0 days).
 */
export function freezeOffer(done: ReadonlySet<string>, frozen: ReadonlySet<string>, today: string = todayKey()): FreezeOffer | null {
  const yesterday = addDays(today, -1);
  if (done.has(today) || done.has(yesterday) || frozen.has(yesterday)) return null;
  if (currentStreak(done, today, frozen) > 0) return null;
  const withFreeze = new Set(frozen).add(yesterday);
  const saved = currentStreak(done, today, withFreeze);
  return saved > 0 ? { savedStreak: saved, day: yesterday } : null;
}
