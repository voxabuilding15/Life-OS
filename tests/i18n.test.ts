import fs from 'node:fs';
import path from 'node:path';
import i18n, { applyLocale, currentLanguage, detectDeviceLocale, LANGUAGES, languageOf, t, type Locale } from '@/i18n';
import { localizeTextStyle, arabicFamily, isolateLatinRuns, RLM } from '@/theme/arabic';
import { clock, formatDay, formatDuration, formatShortDate, formatTime, greeting, shortDay, todayKey } from '@/lib/date';
import { billingLine, ctaLabel, type Plan } from '@/lib/plans';
import { ACHIEVEMENTS, levelTitle } from '@/lib/gamification';
import { challengesForDay } from '@/lib/challenges';
import { HABIT_PRESETS, STARTER_HABITS } from '@/lib/habitIcons';
import { MOODS } from '@/lib/mood';
import { OBJECTIVES, TASK_CATEGORIES, GOAL_CATEGORIES, NOTE_CATEGORIES } from '@/types';
import { THEMES } from '@/theme/tokens';

const root = path.resolve(__dirname, '..');
const read = (l: string) => JSON.parse(fs.readFileSync(path.join(root, `locales/${l}.json`), 'utf8')) as Record<string, unknown>;
const LOCALES: Locale[] = ['en', 'fr', 'ar'];
const catalogs = Object.fromEntries(LOCALES.map((l) => [l, read(l)])) as Record<Locale, Record<string, unknown>>;

const flatten = (o: Record<string, unknown>, prefix = ''): Record<string, string> =>
  Object.entries(o).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') Object.assign(acc, flatten(v as Record<string, unknown>, key));
    else acc[key] = String(v);
    return acc;
  }, {});

const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(catalogs[l])])) as Record<Locale, Record<string, string>>;

/** Plural keys are stored as `key_one`, `key_other`...; collapse them to the base key. */
const PLURAL = /_(zero|one|two|few|many|other)$/;
const baseKeys = (l: Locale) => new Set(Object.keys(flat[l]).map((k) => k.replace(PLURAL, '')));
const placeholders = (s: string) => [...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort().join(',');

describe('locale files', () => {
  it('ship English, French and Arabic', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['en', 'fr', 'ar']);
    expect(fs.existsSync(path.join(root, 'locales/en.json'))).toBe(true);
  });

  it('have the same base keys in every language', () => {
    const en = baseKeys('en');
    for (const l of ['fr', 'ar'] as Locale[]) {
      const other = baseKeys(l);
      expect([...en].filter((k) => !other.has(k))).toEqual([]);
      expect([...other].filter((k) => !en.has(k))).toEqual([]);
    }
  });

  it('never contain empty strings', () => {
    for (const l of LOCALES) expect(Object.entries(flat[l]).filter(([, v]) => v.trim() === '')).toEqual([]);
  });

  it('use the same interpolation placeholders as English', () => {
    const problems: string[] = [];
    for (const l of ['fr', 'ar'] as Locale[]) {
      for (const [key, value] of Object.entries(flat[l])) {
        const enKey = key.replace(PLURAL, '');
        const enValue = flat.en[key] ?? flat.en[`${enKey}_other`] ?? flat.en[`${enKey}_one`];
        if (enValue === undefined) continue;
        const a = new Set(placeholders(value).split(',').filter(Boolean));
        const b = new Set(placeholders(enValue).split(',').filter(Boolean));
        // Zero/one/two forms may legitimately drop numbers ("one task" -> "مهمة واحدة").
        const missing = [...b].filter((p) => !a.has(p) && !/_(zero|one|two)$/.test(key));
        const extra = [...a].filter((p) => !b.has(p));
        if (missing.length || extra.length) problems.push(`${l}:${key} missing=${missing} extra=${extra}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it('provide every CLDR plural form each language needs', () => {
    const need: Record<Locale, string[]> = { en: ['one', 'other'], fr: ['one', 'other'], ar: ['zero', 'one', 'two', 'few', 'many', 'other'] };
    const problems: string[] = [];
    for (const l of LOCALES) {
      const groups = new Map<string, Set<string>>();
      for (const key of Object.keys(flat[l])) {
        const m = key.match(PLURAL);
        if (!m) continue;
        const base = key.replace(PLURAL, '');
        groups.set(base, (groups.get(base) ?? new Set()).add(m[1]));
      }
      for (const [base, forms] of groups) for (const f of need[l]) if (!forms.has(f)) problems.push(`${l}:${base} lacks _${f}`);
    }
    expect(problems).toEqual([]);
  });

  it('keep Arabic free of stray Latin words (except brand and technical terms)', () => {
    // Brand names, technical terms and the XP unit are intentionally Latin.
    const allowed = /Life OS|Google Play|Full Stack|Node\.js|JavaScript|HTML|CSS|React|\bXP\b|\bPRO\b|\bPro\b|you@example\.com/g;
    const offenders: string[] = [];
    for (const [key, value] of Object.entries(flat.ar)) {
      const stripped = value.replace(/\{\{[^}]+\}\}/g, ' ').replace(allowed, ' ');
      for (const word of stripped.match(/[A-Za-z][A-Za-z.]*/g) ?? []) offenders.push(`${key}: ${word}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('every dynamic key family is translated', () => {
  const has = (key: string) => LOCALES.every((l) => key in flat[l] || Object.keys(flat[l]).some((k) => k.startsWith(`${key}_`)));
  const missing = (keys: string[]) => keys.filter((k) => !has(k));

  it('achievements, challenges, levels, themes, categories, moods, objectives, starter habits', () => {
    const keys = [
      ...ACHIEVEMENTS.flatMap((a) => [`achievements.items.${a.key}.title`, `achievements.items.${a.key}.description`]),
      ...[...new Set(ACHIEVEMENTS.map((a) => a.category))].map((c) => `achievements.categories.${c}`),
      ...Array.from({ length: 8 }, (_, i) => `levels.${i}`),
      ...Object.keys(THEMES).flatMap((id) => [`themes.${id}.name`, `themes.${id}.tagline`]),
      ...TASK_CATEGORIES.map((c) => `categories.task.${c}`),
      ...GOAL_CATEGORIES.map((c) => `categories.goal.${c}`),
      ...NOTE_CATEGORIES.map((c) => `categories.note.${c}`),
      ...MOODS.map((m) => `mood.${m.value}`),
      ...OBJECTIVES.map((o) => `onboarding.objectives.${o.id}`),
      ...[...HABIT_PRESETS, ...Object.values(STARTER_HABITS).flat()].map((h) => `starterHabits.${h.id}`),
      ...Array.from({ length: 30 }, (_, d) => challengesForDay(`2026-10-${String(d + 1).padStart(2, '0')}`, { hasHabits: true, hasOpenMilestones: true })).flat().flatMap((c) => [`challenges.items.${c.id}.title`, `challenges.items.${c.id}.description`]),
      ...['habits', 'tasks', 'focus', 'goals', 'reflection'].flatMap((p) => [`lifeScore.pillars.${p}.label`, `lifeScore.pillars.${p}.tip`, `lifeScore.pillars.${p}.detail`]),
    ];
    expect(missing([...new Set(keys)])).toEqual([]);
  });
});

describe('source has no hardcoded UI text and no missing keys', () => {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(f)) files.push(p);
    }
  };
  walk(path.join(root, 'src'));

  it('uses only keys that exist in en.json', () => {
    const all = new Set(Object.keys(flat.en).map((k) => k.replace(PLURAL, '')));
    const bad: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\b(?:tr|t)\(\s*'([a-zA-Z0-9_.]+)'/g)) if (!all.has(m[1])) bad.push(`${path.relative(root, f)}: ${m[1]}`);
    }
    expect(bad).toEqual([]);
  });

  it('has no literal user-facing text in JSX or text props', () => {
    const textNode = />\s*([A-Z][^<>{}=;]*[a-z]{3,}[^<>{}=;]*)\s*</;
    const attr = /\b(title|label|placeholder|message|subtitle|actionLabel|hint|accessibilityLabel)="([^"{}]*[A-Za-z]{3,}[^"{}]*)"/;
    const allowed = new Set(['Life OS']);
    const found: string[] = [];
    for (const f of files.filter((x) => x.endsWith('.tsx'))) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line) || /className|import /.test(line)) return;
        const a = line.match(attr);
        if (a && !allowed.has(a[2])) found.push(`${path.relative(root, f)}:${i + 1} ${a[2]}`);
        const n = line.match(textNode);
        if (n && !/[()=?&|]/.test(n[1]) && !allowed.has(n[1].trim())) found.push(`${path.relative(root, f)}:${i + 1} ${n[1].trim()}`);
      });
    }
    expect(found).toEqual([]);
  });
});

describe('runtime translation', () => {
  afterEach(() => applyLocale('en'));

  it.each([
    ['en', 'Tasks', 'Today'],
    ['fr', 'Tâches', 'Aujourd’hui'],
    ['ar', 'المهام', 'اليوم'],
  ] as const)('%s translates tabs and dates', async (l, tasks, today) => {
    await applyLocale(l);
    expect(t('tabs.tasks')).toBe(tasks);
    expect(formatDay(todayKey())).toBe(today);
    expect(currentLanguage().code).toBe(l);
  });

  it('applies the right plural rules', async () => {
    await applyLocale('en');
    expect([0, 1, 2].map((count) => t('notes.countLabel', { count }))).toEqual(['0 notes', '1 note', '2 notes']);
    await applyLocale('fr');
    expect([0, 1, 2].map((count) => t('notes.countLabel', { count }))).toEqual(['0 note', '1 note', '2 notes']);
    await applyLocale('ar');
    expect([0, 1, 2, 3, 11, 100].map((count) => t('notes.countLabel', { count }))).toEqual(['لا ملاحظات', 'ملاحظة واحدة', 'ملاحظتان', '3 ملاحظات', '11 ملاحظة', '100 ملاحظة']);
  });

  it('formats durations, times and dates per language, always with Western digits', async () => {
    await applyLocale('fr');
    expect(formatDuration(5400)).toBe('1 h 30 min');
    expect(formatDuration(1500)).toBe('25 min');
    await applyLocale('ar');
    expect(formatDuration(5400)).toBe('1 س 30 د');
    expect(formatTime(new Date(2026, 9, 11, 21, 5))).toMatch(/^9:05\s*م$/);
    expect(shortDay('2026-10-11')).toMatch(/^[^\d]+$/);
    expect(formatShortDate('2026-10-11')).toMatch(/\b11\b/);
    expect(formatShortDate('2026-10-11')).not.toMatch(/[٠-٩]/);
    expect(clock(1500)).toBe('25:00');
  });

  it('greets in every language', async () => {
    const morning = new Date(2026, 9, 11, 9);
    const out: string[] = [];
    for (const l of LOCALES) {
      await applyLocale(l);
      out.push(greeting(morning));
    }
    expect(out).toEqual(['Good morning', 'Bonjour', 'صباح الخير']);
  });

  it('translates plan copy with the right trial and billing wording', async () => {
    const yearly: Plan = { id: 'yearly', productId: 'y', price: 29.99, priceString: '$29.99', currency: 'USD', trialDays: 7 };
    await applyLocale('fr');
    expect(ctaLabel(yearly)).toBe('Démarrer : Essai gratuit de 7 jours');
    expect(billingLine(yearly)).toContain('7 jours gratuits');
    await applyLocale('ar');
    expect(billingLine(yearly)).toContain('7 أيام مجانًا');
    expect(levelTitle(1)).toBe('مبتدئ');
  });

  it('falls back to English for unknown languages', async () => {
    await i18n.changeLanguage('de');
    expect(t('tabs.home')).toBe('Home');
  });
});

describe('language selection', () => {
  const mocked = jest.requireMock('expo-localization') as { getLocales: jest.Mock };
  it('detects the device language, falling back to English', () => {
    mocked.getLocales.mockReturnValueOnce([{ languageCode: 'fr', languageTag: 'fr-CA' }]);
    expect(detectDeviceLocale()).toBe('fr');
    mocked.getLocales.mockReturnValueOnce([{ languageCode: 'ar', languageTag: 'ar-MA' }]);
    expect(detectDeviceLocale()).toBe('ar');
    mocked.getLocales.mockReturnValueOnce([{ languageCode: 'de', languageTag: 'de-DE' }, { languageCode: 'fr', languageTag: 'fr-FR' }]);
    expect(detectDeviceLocale()).toBe('fr'); // first supported preference wins
    mocked.getLocales.mockReturnValueOnce([{ languageCode: 'ja', languageTag: 'ja-JP' }]);
    expect(detectDeviceLocale()).toBe('en');
  });

  it('describes direction and week start per language', () => {
    expect(languageOf('ar')).toMatchObject({ rtl: true, native: 'العربية', flag: '🇸🇦' });
    expect(languageOf('fr')).toMatchObject({ rtl: false, firstDay: 1 });
    expect(languageOf('en')).toMatchObject({ rtl: false, firstDay: 0 });
  });
});

describe('Arabic typography', () => {
  const base = { fontFamily: 'Inter_700Bold', fontSize: 26, lineHeight: 32, letterSpacing: -0.6 };
  it('swaps the font, removes tracking and opens up line height in RTL only', () => {
    expect(localizeTextStyle(base, false)).toEqual(base);
    expect(localizeTextStyle(base, true)).toEqual({ fontFamily: 'IBMPlexSansArabic_700Bold', fontSize: 26, lineHeight: 36, letterSpacing: 0 });
    expect(arabicFamily('Inter_800ExtraBold')).toBe('IBMPlexSansArabic_700Bold');
    expect(arabicFamily('Inter_400Regular')).toBe('IBMPlexSansArabic_400Regular');
  });
});

describe('direction changes', () => {
  it('flips the native RTL flag and reloads once when entering Arabic', async () => {
    jest.resetModules();
    const { I18nManager } = require('react-native') as typeof import('react-native');
    const restart = (require('react-native-restart') as { default: { restart: jest.Mock } }).default.restart;
    const force = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => undefined);
    const mod = require('@/i18n') as typeof import('@/i18n');
    restart.mockClear();
    await mod.applyLocale('ar');
    await new Promise((r) => setTimeout(r, 20));
    expect(force).toHaveBeenCalledWith(true);
    expect(restart).toHaveBeenCalledTimes(1);
    await mod.applyLocale('ar'); // already applied: no second reload
    await mod.applyLocale('fr');
    await new Promise((r) => setTimeout(r, 20));
    expect(restart).toHaveBeenCalledTimes(1);
    force.mockRestore();
  });

  it('does not reload for French and English (both left-to-right)', async () => {
    jest.resetModules();
    const restart = (require('react-native-restart') as { default: { restart: jest.Mock } }).default.restart;
    const mod = require('@/i18n') as typeof import('@/i18n');
    restart.mockClear();
    await mod.applyLocale('fr');
    await mod.applyLocale('en');
    expect(restart).not.toHaveBeenCalled();
  });
});

describe('bidi isolation for mixed Arabic / Latin text', () => {
  const LRM = '\u200E';
  it('keeps numbers, units and names in left-to-right order', () => {
    expect(isolateLatinRuns('+20 XP')).toBe(`${LRM}+20 XP${LRM}`);
    expect(isolateLatinRuns('195 / 200 XP للوصول إلى المستوى 4')).toBe(`${LRM}195 / 200 XP${LRM} للوصول إلى المستوى ${LRM}4${LRM}`);
    expect(isolateLatinRuns('/ 100')).toBe(`${LRM}/ 100${LRM}`);
    expect(isolateLatinRuns('مرحبًا بك في Life OS')).toBe(`مرحبًا بك في ${LRM}Life OS${LRM}`);
    expect(isolateLatinRuns('بدون أرقام')).toBe('بدون أرقام');
  });
  it('exposes the RLM used to pin paragraph direction', () => {
    expect(RLM).toBe('\u200F');
  });
});
