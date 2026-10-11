import { currentLanguage } from './index';

/** Locale-aware formatting. Digits stay Western (0-9) in every language. */
const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const tag = currentLanguage().intl;
  const key = `${tag}|${JSON.stringify(opts)}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, opts);
    cache.set(key, f);
  }
  return f;
}

export const weekdayShort = (d: Date) => fmt({ weekday: 'short' }).format(d);
export const weekdayNarrow = (d: Date) => fmt({ weekday: 'narrow' }).format(d);
export const monthLong = (d: Date) => fmt({ month: 'long' }).format(d);
export const monthYear = (d: Date) => fmt({ month: 'long', year: 'numeric' }).format(d);
export const dayMonth = (d: Date) => fmt({ weekday: 'short', month: 'short', day: 'numeric' }).format(d);
export const dayMonthShort = (d: Date) => fmt({ month: 'short', day: 'numeric' }).format(d);
export const time12 = (d: Date) => fmt({ hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
export const dateTime = (d: Date) => fmt({ dateStyle: 'medium', timeStyle: 'short' }).format(d);
export const dateOnly = (d: Date) => fmt({ dateStyle: 'medium' }).format(d);
