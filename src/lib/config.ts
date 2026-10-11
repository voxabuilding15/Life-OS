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
  freezesPerMonth: 2,
  androidPackage: 'com.lifeos.app',
  privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? 'https://lifeos.app/privacy',
  termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? 'https://lifeos.app/terms',
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@lifeos.app',
} as const;

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
