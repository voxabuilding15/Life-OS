/**
 * Pre-flight for a Google Play release. Fails (exit 1) on blockers, prints warnings for the rest.
 *   npm run verify:release            fast checks
 *   npm run verify:release -- --build also exports the Android bundle and runs prebuild to inspect the manifest
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => path.join(root, p);
const blockers = [];
const warnings = [];
const ok = [];
const check = (cond, pass, fail, level = 'blocker') => (cond ? ok.push(pass) : (level === 'blocker' ? blockers : warnings).push(fail));

const app = JSON.parse(fs.readFileSync(rel('app.json'), 'utf8')).expo;
const pkg = JSON.parse(fs.readFileSync(rel('package.json'), 'utf8'));

// PNG dimensions without dependencies.
const pngSize = (file) => {
  const b = fs.readFileSync(file);
  return b.toString('ascii', 1, 4) === 'PNG' ? { w: b.readUInt32BE(16), h: b.readUInt32BE(20) } : null;
};

// ---- Environment (read .env.production / .env if present; EAS secrets show up as process.env) ----
const env = { ...process.env };
for (const f of ['.env', '.env.production']) {
  if (fs.existsSync(rel(f))) for (const l of fs.readFileSync(rel(f), 'utf8').split('\n')) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && m[2]) env[m[1]] ??= m[2]; }
}
for (const k of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY', 'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY']) check(Boolean(env[k]), `${k} set`, `${k} is missing: the release build would have no backend / no purchases`);
check(!/^1$/.test(env.EXPO_PUBLIC_ALLOW_PREVIEW ?? ''), 'preview mode disabled', 'EXPO_PUBLIC_ALLOW_PREVIEW=1 must not be set for a store build');
for (const k of ['EXPO_PUBLIC_PRIVACY_URL', 'EXPO_PUBLIC_TERMS_URL', 'EXPO_PUBLIC_SUPPORT_EMAIL']) check(Boolean(env[k]) && !/lifeos\.app/.test(env[k]), `${k} set`, `${k} still uses the placeholder default (Play requires a real, public privacy policy URL)`);
if (env.EXPO_PUBLIC_SUPABASE_URL) check(env.EXPO_PUBLIC_SUPABASE_URL.startsWith('https://'), 'Supabase URL is https', 'EXPO_PUBLIC_SUPABASE_URL must be https');
check(fs.existsSync(rel('google-services.json')) || Boolean(env.GOOGLE_SERVICES_JSON), 'Firebase config present', 'google-services.json (or GOOGLE_SERVICES_JSON secret) missing: FCM token registration will not work');

// ---- App metadata ----
check(app.android?.package === 'com.lifeos.app', `package ${app.android?.package}`, 'android.package missing');
check(/^\d+\.\d+\.\d+$/.test(app.version), `version ${app.version}`, 'version must be semver');
check(pkg.version === app.version, 'package.json version matches app.json', 'package.json version differs from app.json', 'warning');
check(Number.isInteger(app.android?.versionCode), `versionCode ${app.android?.versionCode} (EAS auto-increments)`, 'android.versionCode missing');
check(app.userInterfaceStyle === 'dark', 'dark UI', 'userInterfaceStyle should be dark', 'warning');
check(app.extra?.eas?.projectId, 'EAS project linked', 'extra.eas.projectId is empty: run `eas init` before building', 'warning');
check(app.android?.allowBackup === false, 'allowBackup disabled', 'android.allowBackup should be false');

const allowed = new Set(['android.permission.POST_NOTIFICATIONS', 'android.permission.VIBRATE']);
const extra = (app.android?.permissions ?? []).filter((p) => !allowed.has(p));
check(extra.length === 0, 'permissions limited to notifications + vibrate', `unexpected permissions: ${extra.join(', ')}`);

// ---- Brand assets ----
const sizes = { 'assets/icon.png': [1024, 1024], 'assets/adaptive-icon.png': [1024, 1024], 'assets/adaptive-icon-monochrome.png': [1024, 1024], 'assets/splash-icon.png': [1024, 1024], 'assets/notification-icon.png': [96, 96], 'store/play/icon-512.png': [512, 512], 'store/play/feature-graphic-1024x500.png': [1024, 500] };
for (const [f, [w, h]] of Object.entries(sizes)) {
  const s = fs.existsSync(rel(f)) && pngSize(rel(f));
  check(s && s.w === w && s.h === h, `${f} ${w}x${h}`, `${f} missing or not ${w}x${h}${s ? ` (is ${s.w}x${s.h})` : ''}`);
}
const shots = fs.existsSync(rel('store/play/screenshots')) ? fs.readdirSync(rel('store/play/screenshots')).filter((f) => f.endsWith('.png')) : [];
check(shots.length >= 2 && shots.length <= 8, `${shots.length} phone screenshots`, 'Play needs 2-8 phone screenshots in store/play/screenshots');
for (const f of shots) {
  const s = pngSize(rel(`store/play/screenshots/${f}`));
  const ratio = s ? Math.max(s.w, s.h) / Math.min(s.w, s.h) : 99;
  check(s && Math.min(s.w, s.h) >= 320 && Math.max(s.w, s.h) <= 3840 && ratio <= 2, `${f} ${s?.w}x${s?.h}`, `${f} violates Play screenshot limits (320-3840px, max 2:1)`);
}
// Store text limits, per language
const LISTINGS = { en: ['listing.md', 'Title', 'Short description', 'Full description', 'Category'], fr: ['listing.fr.md', 'Titre', 'Description courte', 'Description complète', 'Catégorie'], ar: ['listing.ar.md', 'العنوان', 'الوصف القصير', 'الوصف الكامل', 'الفئة'] };
for (const [lang, [file, tTitle, tShort, tFull, tNext]] of Object.entries(LISTINGS)) {
  const listing = fs.readFileSync(rel(`store/${file}`), 'utf8');
  const field = (label) => listing.match(new RegExp(`\\*\\*${label}[^*]*\\*\\*\\s*\\n?([^\\n]+)`))?.[1]?.trim() ?? '';
  const title = field(tTitle);
  const short = field(tShort);
  const full = listing.split(`**${tFull}`)[1]?.split(`**${tNext}`)[0] ?? '';
  check(title.length > 0 && title.length <= 30, `[${lang}] title ${title.length}/30`, `[${lang}] store title is ${title.length} chars (max 30)`);
  check(short.length > 0 && short.length <= 80, `[${lang}] short description ${short.length}/80`, `[${lang}] short description is ${short.length} chars (max 80)`);
  check(full.length > 0 && full.length <= 4000, `[${lang}] full description ${full.length}/4000`, `[${lang}] full description is ${full.length} chars (max 4000)`);
}
for (const lang of ['fr', 'ar']) {
  const n = fs.existsSync(rel(`store/play/${lang}/screenshots`)) ? fs.readdirSync(rel(`store/play/${lang}/screenshots`)).filter((f) => f.endsWith('.png')).length : 0;
  check(n >= 2 && n <= 8, `[${lang}] ${n} localized screenshots`, `[${lang}] needs 2-8 localized screenshots in store/play/${lang}/screenshots`);
  const g = fs.existsSync(rel(`store/play/${lang}/feature-graphic-1024x500.png`)) && pngSize(rel(`store/play/${lang}/feature-graphic-1024x500.png`));
  check(g && g.w === 1024 && g.h === 500, `[${lang}] feature graphic 1024x500`, `[${lang}] localized feature graphic missing`);
}
// Locale files: every language has every key
{
  const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`.replace(/_(zero|one|two|few|many|other)$/, '')]));
  const keys = (l) => new Set(flat(JSON.parse(fs.readFileSync(rel(`locales/${l}.json`), 'utf8'))));
  const en = keys('en');
  for (const l of ['fr', 'ar']) {
    const k = keys(l);
    const missing = [...en].filter((x) => !k.has(x));
    check(missing.length === 0, `[${l}] locale complete (${k.size} keys)`, `[${l}] locale is missing ${missing.length} keys, e.g. ${missing.slice(0, 3).join(', ')}`);
  }
}

// ---- Code hygiene ----
const grep = (pattern) => { try { return execSync(`grep -rIn --include=*.ts --include=*.tsx -E "${pattern}" src || true`, { cwd: root, encoding: 'utf8' }).trim(); } catch { return ''; } };
const logs = grep('console\\.(log|debug)');
check(!logs, 'no console.log in src', `console.log left in src:\n${logs}`, 'warning');
const secrets = grep('(service_role|sk_live|secret_key|BEGIN PRIVATE KEY)');
check(!secrets, 'no secrets in src', `possible secret in src:\n${secrets}`);
const devOnly = fs.readFileSync(rel('src/app/paywall.tsx'), 'utf8');
check(/__DEV__\s*&&/.test(devOnly), 'dev-only Pro switch is behind __DEV__', 'dev-only Pro activation is not guarded by __DEV__');

// ---- Optional heavy checks ----
if (process.argv.includes('--build')) {
  try {
    const out = fs.mkdtempSync('/var/tmp/lifeos-export-');
    execSync(`npx expo export --platform android --output-dir ${out}`, { cwd: root, stdio: 'pipe', env: { ...env, CI: '1' } });
    const js = fs.readdirSync(path.join(out, '_expo/static/js/android')).find((f) => f.endsWith('.hbc'));
    const mb = fs.statSync(path.join(out, '_expo/static/js/android', js)).size / 1048576;
    check(mb < 15, `Hermes bundle ${mb.toFixed(1)} MB`, `Hermes bundle is ${mb.toFixed(1)} MB (budget 15)`);
    fs.rmSync(out, { recursive: true, force: true });
  } catch (e) { blockers.push(`android export failed: ${String(e.stderr ?? e).slice(0, 400)}`); }
  try {
    execSync('npx expo prebuild --platform android --no-install --clean', { cwd: root, stdio: 'pipe', env: { ...env, CI: '1' } });
    const manifest = fs.readFileSync(rel('android/app/src/main/AndroidManifest.xml'), 'utf8');
    const perms = [...manifest.matchAll(/<uses-permission android:name="([^"]+)"(?![^>]*tools:node="remove")/g)].map((m) => m[1]);
    const unexpected = perms.filter((p) => !['android.permission.INTERNET', ...allowed].includes(p));
    check(unexpected.length === 0, `manifest permissions: ${perms.join(', ')}`, `unexpected merged permissions: ${unexpected.join(', ')}`);
    check(/usesCleartextTraffic="false"/.test(manifest), 'cleartext traffic disabled', 'cleartext traffic is enabled');
    const props = fs.readFileSync(rel('android/gradle.properties'), 'utf8');
    check(/enableMinifyInReleaseBuilds=true/.test(props) && /enableShrinkResourcesInReleaseBuilds=true/.test(props), 'R8 + resource shrinking on', 'R8/resource shrinking not enabled');
    check(/targetSdkVersion=3[5-9]/.test(props), 'targetSdk >= 35', 'targetSdkVersion must be >= 35 for new Play apps');
    fs.rmSync(rel('android'), { recursive: true, force: true });
  } catch (e) { blockers.push(`prebuild failed: ${String(e.stderr ?? e).slice(0, 400)}`); }
}

for (const m of ok) console.log(`  ok       ${m}`);
for (const m of warnings) console.log(`  WARN     ${m}`);
for (const m of blockers) console.log(`  BLOCKER  ${m}`);
console.log(`\n${ok.length} ok, ${warnings.length} warnings, ${blockers.length} blockers`);
process.exit(blockers.length ? 1 : 0);
