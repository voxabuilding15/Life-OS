export const config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  revenueCatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  entitlement: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT ?? 'pro',
  freeHabitLimit: 3,
  freeGoalLimit: 3,
  proPriceLabel: '$4.99',
  proProductId: 'lifeos_pro_monthly',
  proYearlyProductId: 'lifeos_pro_yearly',
  /** Shown only until the store returns real prices (offline / preview). */
  fallbackMonthlyPrice: 4.99,
  fallbackYearlyPrice: 29.99,
  trialDays: 7,
  freezesPerMonth: 2,
  androidPackage: 'com.lifeos.app',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://lifeos.app/privacy',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://lifeos.app/terms',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@lifeos.app',
} as const;

/** Preview mode (no account) is a developer convenience; release builds never expose it unless explicitly enabled. */
export const allowPreview = __DEV__ || process.env.EXPO_PUBLIC_ALLOW_PREVIEW === '1';

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
