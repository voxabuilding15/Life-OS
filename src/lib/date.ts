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
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const shortDay = (key: string) => DAYS[fromKey(key).getDay()];
export const dayInitial = (key: string) => DAYS[fromKey(key).getDay()].charAt(0);

export const formatDay = (key: string, today: string = todayKey()): string => {
  const diff = diffDays(key, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const d = fromKey(key);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

export const formatLongDate = (d: Date = new Date()): string =>
  `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;

export const formatTime = (d: Date): string => {
  const h = d.getHours();
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
};

export const formatDuration = (seconds: number): string => {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
};

export const clock = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
};
