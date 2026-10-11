/**
 * Validates the production Supabase configuration without ever printing a secret value.
 *   node scripts/check-supabase-env.mjs            checks the environment + that no .env file is tracked by git
 *   node scripts/check-supabase-env.mjs --bundle dist   also checks the exported JS bundle really contains the configuration
 *
 * EXPO_PUBLIC_* values are inlined into the app bundle by design: the anon key is safe only because RLS is on
 * for every table. The service-role key must never reach the client or this pipeline.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const errors = [];
const fail = (m) => errors.push(m);

if (!url) fail('EXPO_PUBLIC_SUPABASE_URL is empty (missing GitHub Actions secret?)');
else {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') fail('EXPO_PUBLIC_SUPABASE_URL must use https');
    if (u.pathname !== '/' || u.search) fail('EXPO_PUBLIC_SUPABASE_URL must be the bare project URL (no path or query)');
  } catch {
    fail('EXPO_PUBLIC_SUPABASE_URL is not a valid URL');
  }
}
if (!key) fail('EXPO_PUBLIC_SUPABASE_ANON_KEY is empty (missing GitHub Actions secret?)');
else {
  if (/\s/.test(key)) fail('EXPO_PUBLIC_SUPABASE_ANON_KEY contains whitespace (stray newline in the secret?)');
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const role = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role;
      if (role === 'service_role') fail('EXPO_PUBLIC_SUPABASE_ANON_KEY is a SERVICE-ROLE key. Never ship it in an app. Rotate it and use the anon key');
    } catch { /* not a decodable JWT: fine */ }
  }
  if (/^sb_secret_/.test(key)) fail('EXPO_PUBLIC_SUPABASE_ANON_KEY is a secret key (sb_secret_...). Use the anon / publishable key');
}

// .env files must never be tracked (only .env.example is allowed).
try {
  const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter((f) => /(^|\/)\.env(\..+)?$/.test(f) && !f.endsWith('.env.example'));
  if (tracked.length) fail(`env files are tracked by git: ${tracked.join(', ')}`);
} catch { /* not a git checkout */ }

// Exported bundle must contain the configuration (it is inlined at build time).
const i = process.argv.indexOf('--bundle');
if (i > -1 && errors.length === 0) {
  const dir = process.argv[i + 1] ?? 'dist';
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : /\.(hbc|js|bundle)$/.test(e.name) && files.push(p); } };
  if (!fs.existsSync(dir)) fail(`bundle directory ${dir} not found`);
  else {
    walk(dir);
    const contains = (needle) => files.some((f) => fs.readFileSync(f).includes(needle));
    if (!files.length) fail(`no bundle found in ${dir}`);
    else {
      if (!contains(url)) fail('exported bundle does not contain EXPO_PUBLIC_SUPABASE_URL: the app would run without a backend');
      if (!contains(key)) fail('exported bundle does not contain EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }
  }
}

if (errors.length) {
  console.error('Supabase configuration check FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Supabase configuration OK (url host: ${new URL(url).host}; key length: ${key.length}; values not printed)`);
