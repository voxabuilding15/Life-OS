# Release checklist

Run `npm run verify:release -- --build` first. It must report **0 blockers**. Every blocker it lists is something only you can supply (keys, URLs, Firebase file).

## 1. Accounts and services
- [ ] Supabase: apply `supabase/migrations/0001` and `0002`, deploy `functions/revenuecat-webhook`, set Auth URLs, decide on email confirmation, enable leaked-password protection.
- [ ] RevenueCat: link Google Play (service account), products `lifeos_pro_monthly` and `lifeos_pro_yearly`, entitlement `pro`, offering marked **current** with packages `$rc_monthly` and `$rc_annual`, webhook -> `revenuecat-webhook` with the shared Authorization secret.
- [ ] Google Play Console subscriptions: monthly base plan $4.99; yearly base plan $29.99 with an **offer: 7-day free trial** (new customers only). The app reads trial eligibility from the store, so the button only says "Start 7-day free trial" when the user can actually get it.
- [ ] Firebase: Android app `com.lifeos.app`; EAS file secret `GOOGLE_SERVICES_JSON`.
- [ ] GitHub Actions secrets `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set (see `docs/secrets.md`); the Build workflow must be green.
- [ ] EAS secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_PRIVACY_URL`, `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_SUPPORT_EMAIL`. Run `eas init` to fill `extra.eas.projectId`.
- [ ] Publish the privacy policy, terms and account-deletion pages (drafts in this folder).

## 2. Automated tests (already green in CI-style runs)
- `npm run typecheck && npm test` (71 unit tests: logic, plans/trial maths, RevenueCat flow on a mocked SDK, notification scheduling).
- `npm run test:integration` (16 tests: real PostgreSQL + the migrations + Row Level Security behind a Supabase-compatible shim; covers sign-up, duplicate email, wrong password, reset, sign-out wipe, account deletion, push/pull of all 9 entity types, incremental sync, soft deletes, fresh-install restore, last-write-wins, habit-day merge, user isolation, offline queue). Needs PostgreSQL server binaries.

## 3. Manual tests on real devices (cannot be automated here)
Use an internal-testing build (`eas build --profile preview --platform android`, then the Play internal track for billing tests). Test on at least one low-end and one recent Android phone.

**Authentication**
- [ ] Register with a new email (with and without email confirmation), sign out, sign in, wrong password message, forgot-password email arrives and the link works, delete account then sign-in fails.

**Supabase sync (Pro)**
- [ ] Create tasks/habits/goals/notes on device A, wait ~3s, confirm rows in the Supabase table editor. Sign in on device B: everything appears. Edit on both while offline, reconnect: newest edit wins, no duplicates.
- [ ] Airplane mode: the "Offline" banner appears, edits work, sync resumes on reconnect.

**RevenueCat / Google Play billing** (license-tester account, internal test track)
- [ ] Paywall shows real prices; yearly shows the 7-day trial only for eligible accounts; a second purchase by the same tester shows no trial.
- [ ] Buy yearly with trial: Pro unlocks immediately, Pro screen says "Free trial ends <date>", `subscriptions` row shows `status=trialing`. Buy monthly. Cancel in Play: Pro stays until expiry. Restore purchases on a reinstall. Test accounts' trials and renewals are accelerated by Google.
- [ ] Sign out and in as another user: entitlement follows the account.

**Notifications**
- [ ] Android 13+ permission prompt appears only in onboarding / Settings. Task reminder fires at the chosen time with the app closed; habit reminder daily; evening check-in 8:30 PM; weekly report Sunday 6:30 PM; focus timer fires when backgrounded. Tapping each opens the right screen. Turning "Reminders" off cancels everything. Reboot the device: daily reminders still fire.
- [ ] FCM token appears in `profiles.push_token` after login (needs `google-services.json`).

**Quality**
- [ ] Cold start under 2.5s on the low-end device; no ANRs; rotate / background / kill during a focus session; font scaling 130%; TalkBack on onboarding, dashboard and paywall; dark mode only is intentional.
- [ ] Check the Play **pre-launch report** and Android vitals.

**Languages and RTL**
- [ ] Change language in Settings -> Language: English <-> French updates instantly; switching to Arabic reloads the app once and the whole UI (tabs, headers, lists, charts, calendar, paywall) is mirrored. Switch back to English and confirm it reloads to LTR.
- [ ] On a device whose system language is French or Arabic, a fresh install starts in that language; with another language it starts in English.
- [ ] Sign in on a second device: the account's saved language is applied.
- [ ] Check long French text on a small phone (320 dp wide), Arabic with font scale 130%, TalkBack in Arabic, and that task/habit reminders arrive in the chosen language.
- [ ] Add the French and Arabic Play listings (`listing.fr.md`, `listing.ar.md`) and localized graphics (`store/play/fr`, `store/play/ar`).

## 4. Build and submit
- [ ] `eas build --profile production --platform android` (AAB, EAS-managed upload key, Play App Signing).
- [ ] Play Console: listing from `listing.md`, graphics from `store/play/` (`npm run brand` / `scripts/generate-store-assets.mjs` regenerate them), privacy URL, Data safety from `data-safety.md`, content rating, target audience 13+, ads = no, test account for reviewers.
- [ ] Testing tracks: internal -> closed (personal developer accounts created after Nov 2023 need 12+ opted-in testers for 14 days) -> production with a staged rollout (10-20%).
- [ ] After launch watch crash rate (< 1.09%), ANR rate (< 0.47%), subscription conversion and refunds.
