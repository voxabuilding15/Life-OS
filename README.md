# Life OS

A premium personal operating system for young people: tasks, habits, goals, focus and journaling in one dark, calm, gamified app. React Native + Expo (SDK 57) + TypeScript + Expo Router, with Supabase, RevenueCat and Firebase Cloud Messaging.

> "My life is organized. I am improving every day."

## Features

| Area | What you get |
| --- | --- |
| **Onboarding** | Animated splash, "Your life. Organized." welcome, objective picker, name, account creation |
| **Auth** | Email register / login / forgot password (Supabase Auth), validation and friendly errors |
| **Dashboard** | Greeting, level + XP ring, daily completion %, today's tasks (3/5), habit streaks, goals, focus shortcut, weekly momentum widget (Pro) |
| **Tasks** | Title, description, category, priority, date, reminder; Today / Upcoming / Completed; animated check + XP popup |
| **Habits** | Daily check-in, streaks, 7-day dots, calendar heatmap, per-habit statistics |
| **Goals** | Milestone timeline, progress %, target date, achievement card on completion |
| **Focus** | Pomodoro timer (wall-clock accurate, notification if backgrounded), sessions, stats, history |
| **Notes / Journal** | Notes with categories, search, favorites; daily journal with mood |
| **Profile** | Avatar upload, level, XP, achievements, lifetime statistics, settings |
| **Gamification** | Task +10 XP, habit +20, goal +500 (milestone +40, focus +30, journal +15); levels, 16 achievements, level-up celebration |
| **Life Score** | A 0-100 score from habits, tasks, focus, goals and reflection, with a 7-day trend and a "next best move" |
| **Daily challenges** | 3 deterministic challenges a day (+ a Pro double-XP bonus), claimable XP, all-done bonus |
| **Streak Freeze** (Pro) | Saves a streak after a missed day; 2 a month; offered automatically when a streak is about to break |
| **Achievements** | 26 tiered badges in 6 categories with progress bars and XP bonuses |
| **Weekly report** | This week vs last: Life Score, tasks, check-ins, focus, best day, top habit, tips, share (Pro for full insights); Sunday notification |
| **Pro** (monthly $4.99, yearly $29.99 with a 7-day free trial) | Unlimited habits & goals, Streak Freeze, advanced analytics and full report, bonus challenge, themes, cloud sync, premium widget, 8 extra achievements; paywall with benefit slides and a Free vs Pro table |

Free plan limits: 3 habits, 3 active goals, 7-day statistics, local-only data. Everything is offline-first.

## Design system

Only three base colors are used. Every other tone is an alpha of one of them (`src/theme/tokens.ts`).

| Token | Value |
| --- | --- |
| Primary blue | `#68C7EC` |
| Dark background | `#000F0F` |
| White | `#FFFFFF` |

Components live in `src/components/ui` (Card, Button, Input, Chip, Segmented, ProgressRing/Bar, Checkbox, Heatmap, BarChart, DatePicker, TimePicker, EmptyState, Glow, ...). Typography is Inter. Animations use Reanimated 4. The Pro themes (Aurora, Ghost) only change the accent between the palette's blue and white.

## Architecture

```
src/
  app/            Expo Router routes (auth gate lives in app/_layout.tsx via Stack.Protected)
  components/     ui/ (design system) and features/ (feature widgets)
  hooks/          derived data (useData, useAnalytics, useFocusTimer, ...)
  lib/            pure logic: gamification, habits/streaks, dates, sync mapping (unit tested)
  services/       actions (XP engine), auth, sync, purchases (RevenueCat), notifications (FCM + local), avatar
  store/          Zustand stores, persisted to AsyncStorage (offline-first)
  theme/          tokens + useTheme
supabase/
  migrations/     0001_init.sql: schema, RLS, triggers, storage bucket
  functions/      revenuecat-webhook (writes public.subscriptions)
tests/            Jest: XP curve, streaks, sync mapping, store/action integration
```

### Offline-first sync

Every write lands in a persisted Zustand store first. For Pro users the sync engine (`src/services/sync.ts`) pushes rows changed since the last push and pulls rows changed on the server (cursor = server-stamped `synced_at`), resolving conflicts last-write-wins on `updated_at`. Deletes are soft (`deleted_at`). Sync runs on local changes (debounced), app foreground and network reconnect. The profile (name, objectives, XP) syncs for every signed-in user.

## Getting started

```bash
npm install
cp .env.example .env     # fill in Supabase / RevenueCat keys
npx expo start           # use a development build (see below); press w for the web preview
npm run typecheck && npm test
```

Without Supabase keys the app runs in **preview mode** (the login and register screens offer "Continue in preview mode"): everything works locally, nothing is synced. In `__DEV__` the paywall also offers a "development only" Pro switch when RevenueCat is not configured.

### 1. Supabase

1. Create a project, then run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
2. Put the project URL and anon key in `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
3. Auth -> Providers: keep Email enabled. Decide whether "Confirm email" is on (the app handles both).
4. Storage: the migration creates the public `avatars` bucket with per-user folder policies.

Row Level Security is enabled on every table; users can only read and write their own rows. `subscriptions` is read-only for clients. `delete_my_account()` powers Settings -> Delete account.

### 2. RevenueCat

1. Create products (`lifeos_pro_monthly`, $4.99/month) in App Store Connect / Google Play, attach them to an entitlement named `pro` in RevenueCat, and add them to the current offering.
2. Set `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` / `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
3. Optional but recommended: deploy `supabase/functions/revenuecat-webhook` and point a RevenueCat webhook at it so `public.subscriptions` mirrors entitlements.

### 3. Firebase Cloud Messaging

1. Create a Firebase project, add the Android app `com.lifeos.app` (and iOS `com.lifeos.app`).
2. Download `google-services.json` / `GoogleService-Info.plist` to the repo root (git-ignored), or on EAS expose them as file secrets `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICE_INFO_PLIST` (`app.config.js` picks them up).
3. The app stores each device's FCM token in `profiles.push_token`. Sending server pushes is up to your backend; task, habit and daily reminders are scheduled locally and need no server.

### Build & release

Native modules (notifications, purchases) require a development build, not Expo Go:

```bash
npx eas build --profile development --platform android
npx eas build --profile production  --platform all
```

## Quality

- `npm run typecheck`: strict TypeScript.
- `npm test`: 50 tests (adds Life Score, challenges, streak freeze, weekly report and tiered achievements)
- covering the XP/level curve (cross-checked against the SQL `level_from_xp`), streak and heatmap logic, the camel/snake sync mapping, and store + XP-engine integration (free-plan limits, goal completion, reopen refunds).
- Accessibility: roles, labels and states on interactive elements; progress bars expose values.

## Known limitations

- Cloud sync, RevenueCat purchases and FCM need real project credentials and have not been exercised against live services from this repo; the SQL schema and RLS were verified against a local PostgreSQL with stubbed Supabase `auth`/`storage` schemas.
- Server-side push sending is not included.
- Custom themes are limited to the three-color palette on purpose (Ocean, Aurora, Ghost).

## Testing

- `npm test`: 71 unit tests. `npm run test:integration`: 16 tests against real PostgreSQL + migrations + RLS (auth, sync, isolation).
- `npm run verify:release -- --build`: pre-flight for a store build (env, metadata, assets, store text limits, manifest permissions, R8, bundle size).
- Real-device and store-billing tests are listed in `store/release-checklist.md`.

## Branding

See `brand/README.md`. `npm run brand` regenerates all icons and logo files.

## Google Play

See `store/` for the listing copy, icon, feature graphic, 8 screenshots, draft privacy policy, data-safety answers and the release checklist.
