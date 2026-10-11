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
let keyInfo = null;
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
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      keyInfo = { role: payload.role, ref: payload.ref };
      const host = (() => { try { return new URL(url).hostname.split('.')[0]; } catch { return ''; } })();
      if (payload.ref && host && payload.ref !== host) fail(`anon key belongs to project "${payload.ref}" but the URL is project "${host}": key and URL come from different Supabase projects`);
      if (payload.role && payload.role !== 'anon' && payload.role !== 'service_role') fail(`anon key has unexpected role "${payload.role}"`);
      if (payload.exp && payload.exp * 1000 < Date.now()) fail('anon key has expired');
      if (payload.role === 'service_role') fail('EXPO_PUBLIC_SUPABASE_ANON_KEY is a SERVICE-ROLE key. Never ship it in an app. Rotate it and use the anon key');
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

// Live probe: does THIS project accept THIS key? (an "Invalid API key" at login means it does not)
if (process.argv.includes('--live') && errors.length === 0) {
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(20000) });
    if (r.status === 401 || r.status === 403) fail(`Supabase rejected the anon key for this project (HTTP ${r.status}: Invalid API key). The key does not belong to this URL, is truncated, or was rotated`);
    else if (!r.ok) fail(`Supabase auth settings endpoint answered HTTP ${r.status}`);
    else {
      const st = await r.json();
      console.log(`live probe OK: key accepted. email signup ${st.disable_signup ? 'DISABLED' : 'enabled'}, email auto-confirm ${st.mailer_autoconfirm ? 'on' : 'off (users must confirm email)'}`);
    }
  } catch (e) { fail(`could not reach ${new URL(url).host}: ${e.message}`); }
}

// APK: extract the bundle from the apk and look for BOTH url and key
const a = process.argv.indexOf('--apk');
if (a > -1 && errors.length === 0) {
  const apk = process.argv[a + 1];
  const tmp = fs.mkdtempSync('/tmp/apkcheck-');
  try {
    execSync(`unzip -q -o "${apk}" "assets/index.android.bundle" -d "${tmp}"`);
    const bundle = fs.readFileSync(path.join(tmp, 'assets/index.android.bundle'));
    if (!bundle.includes(url)) fail('APK bundle does not contain the Supabase URL');
    if (!bundle.includes(key)) fail(`APK bundle does not contain the anon key (key length ${key.length}): the build did not embed this secret`);
    // the embedded config must be the one used by the client: no stale/other supabase host and no second key
    const otherHosts = new Set((bundle.toString('latin1').match(/https:\/\/[a-z0-9]{20}\.supabase\.co/g) ?? []).filter((h) => h !== url));
    if (otherHosts.size) fail('APK bundle also contains a different Supabase project URL');
    if (!errors.length) console.log('APK bundle contains the exact Supabase URL and anon key from the secrets');
  } catch (e) { fail(`APK check failed: ${e.message}`); }
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (errors.length) {
  console.error('Supabase configuration check FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Supabase configuration OK (url host: ${new URL(url).host}; key length: ${key.length}${keyInfo ? `; key role: ${keyInfo.role}, key project: ${keyInfo.ref}` : '; opaque (non-JWT) key'}; values not printed)`);
