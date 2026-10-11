# Release checklist

## Accounts and services
- [ ] Supabase: run `supabase/migrations/0001_init.sql`, set auth redirect/URL settings, enable email confirmation as desired, deploy `revenuecat-webhook`.
- [ ] RevenueCat: Play service credentials, product `lifeos_pro_monthly` ($4.99/month), entitlement `pro`, offering marked current, webhook configured.
- [ ] Firebase: Android app `com.lifeos.app`; add `google-services.json` as the EAS file secret `GOOGLE_SERVICES_JSON`.
- [ ] Set EAS secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_SUPPORT_EMAIL`.
- [ ] Host the privacy policy and terms at public URLs; link the privacy policy in Play Console.

## Build
- [ ] `npm run typecheck && npm test`
- [ ] `eas build --profile production --platform android` (AAB; let EAS manage the upload keystore; enable Play App Signing)
- [ ] Install the AAB via internal testing on at least 2 real devices (a low-end one included). Verify: cold start, onboarding, sign-up, reminders fire, purchase and restore with a license tester, Streak Freeze, airplane-mode edits then sync.
- [ ] Check the Play pre-launch report (crashes, accessibility, security).

## Play Console
- [ ] Store listing: copy from `listing.md`, assets from `store/play/`.
- [ ] App content: privacy policy URL, data safety (`data-safety.md`), ads = no, target audience 13+, content rating questionnaire.
- [ ] Monetization: create the subscription base plan, set price $4.99/month, add a license-tester account.
- [ ] Testing: internal -> closed (personal developer accounts created after Nov 2023 need 12+ testers opted in for 14 days before requesting production access) -> production staged rollout (start at 10-20%).
- [ ] Monitor Android vitals (ANR < 0.47%, crash < 1.09%) before widening the rollout.
