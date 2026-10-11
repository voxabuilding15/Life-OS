# Production configuration and secrets

## Supabase (GitHub Actions)

Add two **repository secrets** (GitHub → Settings → Secrets and variables → Actions → New repository secret):

| Secret | Value |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` (Supabase → Project Settings → API) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | the **anon / publishable** key. Never the service-role / `sb_secret_` key |

`.github/workflows/build.yml` passes them only to the steps that need them (`check:supabase`, `expo export`, bundle
verification). It runs with `contents: read`, does not persist git credentials, does not upload the bundle, and is skipped
for fork pull requests (secrets are not available there).

`npm run check:supabase` fails the build, **without printing any value**, if a secret is empty, not https, has stray
whitespace, is a service-role key, if any `.env*` file (except `.env.example`) is tracked, or (with `--bundle dist`) if the
exported bundle does not contain the configuration.

## How the app reads it

`src/lib/config.ts` reads `process.env.EXPO_PUBLIC_SUPABASE_URL` / `..._ANON_KEY`; Expo inlines them at bundle time.
`isSupabaseConfigured` gates `src/services/supabase.ts`. Without them the app has no backend, so a release build must
always get them. Metro caches inlined values, so CI exports with `--clear`.

## What is and is not secret

- `EXPO_PUBLIC_*` values end up in the shipped JS bundle and are readable by anyone with the app. That is by design for the
  anon key: Row Level Security is enabled on every table and is what protects the data.
- The service-role key, the RevenueCat webhook secret, `play-service-account.json` and signing keystores must never be
  in the client, the repo or this workflow.
- `.env`, `.env.*` (except `.env.example`), `google-services.json` and keystores are git-ignored. Locally, copy
  `.env.example` to `.env`. For EAS store builds, set the same values as EAS secrets (`eas secret:create`).
- If a secret leaks, rotate it in Supabase (JWT secret / API keys), then update the GitHub secret.
