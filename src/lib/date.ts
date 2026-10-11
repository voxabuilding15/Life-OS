import { t } from '@/i18n';
import { dayMonth, dayMonthShort, time12, weekdayNarrow, weekdayShort } from '@/i18n/format';

/** Local-time date helpers. All "day" values are 'YYYY-MM-DD' strings in the user's time zone. */

const pad = (n: number) => String(n).padStart(2, '0');

export const toKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayKey = (now: Date = new Date()): string => toKey(now);

export const fromKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const addDays = (key: string, days: number): string => {
  const d = fromKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
};

export const diffDays = (a: string, b: string): number =>
  Math.round((fromKey(a).getTime() - fromKey(b).getTime()) / 86_400_000);

/** The last `n` day keys ending at `end` (inclusive), oldest first. */
export const lastNDays = (n: number, end: string = todayKey()): string[] =>
  Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));

export const greeting = (now: Date = new Date()): string => {
  const h = now.getHours();
  if (h < 5) return t('greeting.night');
  if (h < 12) return t('greeting.morning');
  if (h < 18) return t('greeting.afternoon');
  return t('greeting.evening');
};

export const shortDay = (key: string) => weekdayShort(fromKey(key));
export const dayInitial = (key: string) => weekdayNarrow(fromKey(key));

export const formatDay = (key: string, today: string = todayKey()): string => {
  const diff = diffDays(key, today);
  if (diff === 0) return t('date.today');
  if (diff === 1) return t('date.tomorrow');
  if (diff === -1) return t('date.yesterday');
  return dayMonth(fromKey(key));
};

/** Short "Oct 5" style date used for ranges. */
export const formatShortDate = (key: string): string => dayMonthShort(fromKey(key));

export const formatLongDate = (d: Date = new Date()): string => dayMonth(d);

export const formatTime = (d: Date): string => time12(d);

export const formatDuration = (seconds: number): string => {
  const m = Math.round(seconds / 60);
  if (m < 60) return t('time.minutes', { count: m });
  const h = Math.floor(m / 60);
  return m % 60 ? t('time.hoursMinutes', { h, m: m % 60 }) : t('time.hours', { count: h });
};

export const clock = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};
