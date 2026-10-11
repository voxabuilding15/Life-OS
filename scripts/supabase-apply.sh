#!/usr/bin/env bash
# Applies supabase/migrations to the production project and verifies it.
# Needs (never commit these): SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
#   (Supabase dashboard → Account → Access Tokens; Project Settings → General / Database)
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_ACCESS_TOKEN:?}" "${SUPABASE_PROJECT_REF:?}" "${SUPABASE_DB_PASSWORD:?}"
npx --yes supabase@latest link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
npx --yes supabase@latest db push --password "$SUPABASE_DB_PASSWORD"   # tracked: only unapplied migrations run
# Verification over the pooled connection string (Project Settings → Database → Connection string)
if [ -n "${SUPABASE_DB_URL:-}" ]; then psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/verify.sql
else echo "Set SUPABASE_DB_URL to also run supabase/verify.sql"; fi
