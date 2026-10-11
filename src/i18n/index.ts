import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { DevSettings, I18nManager, Platform } from 'react-native';
import { initReactI18next, useTranslation } from 'react-i18next';
import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import fr from '../../locales/fr.json';

export type Locale = 'en' | 'fr' | 'ar';

export interface LanguageOption {
  code: Locale;
  /** Name in its own language, always shown that way so people can find their language. */
  native: string;
  flag: string;
  rtl: boolean;
  /** BCP-47 tag for Intl. Arabic uses Western digits (0-9) so timers, charts and prices read consistently. */
  intl: string;
  /** 0 = Sunday, 1 = Monday ... 6 = Saturday */
  firstDay: number;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', native: 'English', flag: '🇬🇧', rtl: false, intl: 'en-US', firstDay: 0 },
  { code: 'fr', native: 'Français', flag: '🇫🇷', rtl: false, intl: 'fr-FR', firstDay: 1 },
  { code: 'ar', native: 'العربية', flag: '🇸🇦', rtl: true, intl: 'ar-u-nu-latn-ca-gregory', firstDay: 6 },
];

export const DEFAULT_LOCALE: Locale = 'en';
export const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'fr' || v === 'ar';
export const languageOf = (l: Locale): LanguageOption => LANGUAGES.find((x) => x.code === l) ?? LANGUAGES[0];

/** First launch: pick the best supported language from the device's preferred languages. */
export function detectDeviceLocale(): Locale {
  try {
    for (const loc of getLocales()) {
      const code = loc.languageCode?.toLowerCase();
      if (isLocale(code)) return code;
    }
  } catch {
    /* fall through */
  }
  return DEFAULT_LOCALE;
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr }, ar: { translation: ar } },
  lng: detectDeviceLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: ['en', 'fr', 'ar'],
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
  react: { useSuspense: false },
});

export default i18n;

/** Translate outside React (services, notifications, pure libs). Components should use `useI18n`. */
export const t = (key: string, options?: Record<string, unknown>): string => i18n.t(key, options as never) as unknown as string;

export const currentLocale = (): Locale => (isLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE);
export const currentLanguage = (): LanguageOption => languageOf(currentLocale());

let restarting = false;

/** Reloads the JS bundle so the native layout direction (RTL flag) takes effect everywhere. */
async function restartApp(): Promise<void> {
  restarting = true;
  try {
    // Persist the language preference before the process goes away.
    const { flushStorage } = require('@/store/storage') as typeof import('@/store/storage');
    await flushStorage();
    const RNRestart = require('react-native-restart') as { default?: { restart: () => void }; restart?: () => void };
    (RNRestart.default?.restart ?? RNRestart.restart ?? (() => DevSettings.reload()))();
  } catch {
    DevSettings.reload();
  }
}

/**
 * Switches the app language.
 *  - Text, fonts, formats and the JS layout direction change immediately.
 *  - Moving between LTR and RTL also flips the native RTL flag, which needs a reload to apply to the
 *    system-level pieces (scroll views, gestures, transitions). The reload happens automatically.
 */
export async function applyLocale(locale: Locale): Promise<void> {
  const lang = languageOf(locale);
  if (i18n.language !== locale) await i18n.changeLanguage(locale);
  try {
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== lang.rtl) {
      I18nManager.forceRTL(lang.rtl);
      if (Platform.OS !== 'web' && !restarting) void restartApp();
    }
  } catch {
    /* web / tests */
  }
}

export function useI18n() {
  const { t: tr, i18n: inst } = useTranslation();
  const locale: Locale = isLocale(inst.language) ? inst.language : DEFAULT_LOCALE;
  const lang = languageOf(locale);
  return { t: tr, locale, lang, rtl: lang.rtl };
}
