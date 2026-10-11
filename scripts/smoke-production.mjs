/**
 * Smoke test of the REAL Supabase backend using only the public URL + anon key (no service role).
 *   EXPO_PUBLIC_SUPABASE_URL=... EXPO_PUBLIC_SUPABASE_ANON_KEY=... node scripts/smoke-production.mjs
 * Creates two throw-away users, exercises registration, login, profile trigger, language sync, tasks/habits/goals/notes,
 * an offline-then-reconnect push read back from a second "device", and Row Level Security between the two users.
 * Both users are deleted at the end through the app's own delete_my_account() RPC. Never prints keys or passwords.
 * Needs email confirmation to be OFF (or a confirmed-email policy for example.com) so sign-up returns a session.
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY missing'); process.exit(1); }

const client = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const run = randomUUID().slice(0, 8);
const password = `Smoke-${randomUUID()}`;
const results = [];
const cleanups = [];
let failed = false;

async function step(name, fn) {
  try { const detail = await fn(); results.push(['PASS', name, detail ?? '']); }
  catch (e) { failed = true; results.push(['FAIL', name, e.message]); }
}
const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.code ?? ''} ${error.message}`); return data; };
const eq = (a, b, what) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${what}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

async function signUp(label) {
  const c = client();
  const email = `lifeos-smoke-${run}-${label}@example.com`;
  const { data, error } = await c.auth.signUp({ email, password, options: { data: { display_name: `Smoke ${label}` } } });
  if (error) throw new Error(`sign-up: ${error.message}`);
  if (!data.session) throw new Error('sign-up returned no session: email confirmation is ON (turn it off or confirm the address) ');
  cleanups.push(c);
  return { c, email, id: data.user.id };
}

const A = {}, B = {};
await step('registration (user A and user B)', async () => { Object.assign(A, await signUp('a')); Object.assign(B, await signUp('b')); return 'both signed up with a session'; });

if (A.c) {
  await step('email login on a second device', async () => {
    const d = client();
    must(await d.auth.signInWithPassword({ email: A.email, password }), 'login');
    A.d = d;
    const bad = await client().auth.signInWithPassword({ email: A.email, password: 'wrong-password-123' });
    if (!bad.error) throw new Error('wrong password was accepted');
    return 'correct password accepted, wrong password rejected';
  });

  await step('profile created by auth trigger', async () => {
    const p = must(await A.c.from('profiles').select('*').eq('id', A.id).single(), 'profiles');
    eq(p.display_name, 'Smoke a', 'display_name'); eq(p.level, 1, 'level'); eq(p.xp, 0, 'xp');
    must(await A.c.from('users').select('id,email').eq('id', A.id).single(), 'users row');
    return 'users + profiles rows exist with display name';
  });

  await step('language sync en/fr/ar (and rejects invalid)', async () => {
    for (const lang of ['fr', 'ar', 'en']) {
      must(await A.c.from('profiles').update({ language: lang }).eq('id', A.id), `set ${lang}`);
      const seen = must(await A.d.from('profiles').select('language').eq('id', A.id).single(), 'read on device 2');
      eq(seen.language, lang, `device 2 sees ${lang}`);
    }
    const bad = await A.c.from('profiles').update({ language: 'de' }).eq('id', A.id);
    if (!bad.error) throw new Error('invalid language "de" was accepted by the CHECK constraint');
    return 'fr, ar, en propagate to the other device; "de" rejected';
  });

  const now = new Date().toISOString();
  const rows = {
    tasks: { id: randomUUID(), user_id: A.id, title: 'Smoke task', priority: 'high', updated_at: now },
    habits: { id: randomUUID(), user_id: A.id, name: 'Smoke habit', reminder_time: '07:30', updated_at: now },
    goals: { id: randomUUID(), user_id: A.id, title: 'Smoke goal', updated_at: now },
    notes: { id: randomUUID(), user_id: A.id, title: 'ملاحظة / Note / Remarque', body: 'é à ç — مرحبا', updated_at: now },
  };
  for (const [table, row] of Object.entries(rows)) {
    await step(`create ${table} and read back on device 2`, async () => {
      must(await A.c.from(table).insert(row), `insert ${table}`);
      const back = must(await A.d.from(table).select('*').eq('id', row.id).single(), `select ${table}`);
      if (table === 'notes') eq(back.title, row.title, 'unicode round-trip');
      return 'synced';
    });
  }

  await step('offline edits, reconnect, incremental pull by synced_at', async () => {
    const cursor = must(await A.d.from('tasks').select('synced_at').order('synced_at', { ascending: false }).limit(1).single(), 'cursor').synced_at;
    // created "offline" 2 days ago, pushed only now (reconnect)
    const old = new Date(Date.now() - 2 * 864e5).toISOString();
    const offline = [1, 2, 3].map((i) => ({ id: randomUUID(), user_id: A.id, title: `Offline task ${i}`, created_at: old, updated_at: old }));
    must(await A.c.from('tasks').upsert(offline), 'push queued rows');
    must(await A.c.from('tasks').upsert({ ...rows.tasks, title: 'Smoke task (edited offline)', updated_at: new Date().toISOString() }), 'push edit');
    const pulled = must(await A.d.from('tasks').select('id,title,created_at').gt('synced_at', cursor), 'incremental pull');
    if (pulled.length !== 4) throw new Error(`expected 4 changed rows after cursor, got ${pulled.length}`);
    if (!pulled.some((r) => r.title === 'Smoke task (edited offline)')) throw new Error('edit not pulled');
    eq(new Date(pulled.find((r) => r.title === 'Offline task 1').created_at).toISOString(), old, 'client created_at preserved');
    // soft delete propagates
    must(await A.c.from('tasks').update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', offline[0].id), 'soft delete');
    const del = must(await A.d.from('tasks').select('deleted_at').eq('id', offline[0].id).single(), 'read deleted');
    if (!del.deleted_at) throw new Error('soft delete not visible');
    return '3 offline rows + 1 edit arrive after reconnect; soft delete visible';
  });

  await step('RLS: user B cannot read, write, steal or delete user A data', async () => {
    for (const table of Object.keys(rows)) {
      const seen = must(await B.c.from(table).select('id').eq('id', rows[table].id), `B select ${table}`);
      eq(seen.length, 0, `B sees A's ${table}`);
      const ins = await B.c.from(table).insert({ ...rows[table], id: randomUUID() }); // user_id = A
      if (!ins.error) throw new Error(`B inserted a ${table} row owned by A`);
      const upd = await B.c.from(table).update({ updated_at: new Date().toISOString() }).eq('id', rows[table].id).select();
      eq(upd.data?.length ?? 0, 0, `B updated A's ${table}`);
      const del = await B.c.from(table).delete().eq('id', rows[table].id).select();
      eq(del.data?.length ?? 0, 0, `B deleted A's ${table}`);
      const still = must(await A.c.from(table).select('id').eq('id', rows[table].id), `A re-read ${table}`);
      eq(still.length, 1, `A's ${table} intact`);
    }
    eq(must(await B.c.from('profiles').select('id'), 'B profiles').map((r) => r.id), [B.id], 'B sees only own profile');
    const hijack = await B.c.from('profiles').update({ display_name: 'hacked' }).eq('id', A.id).select();
    eq(hijack.data?.length ?? 0, 0, "B edited A's profile");
    const sub = await B.c.from('subscriptions').insert({ user_id: B.id, status: 'active' });
    if (!sub.error) throw new Error('client could write its own subscription');
    const anon = client();
    eq((await anon.from('tasks').select('id')).data ?? [], [], 'anonymous (no login) reads tasks');
    return 'all 4 content tables + profiles isolated; subscriptions read-only; anonymous sees nothing';
  });
}

// Cleanup: users delete themselves via the app's RPC.
for (const c of cleanups) { const r = await c.rpc('delete_my_account'); if (r.error) { failed = true; results.push(['FAIL', 'cleanup', `delete_my_account: ${r.error.message}`]); } }
if (A.id) await step('account deletion cascades', async () => { const d = await client().auth.signInWithPassword({ email: A.email, password }); if (!d.error) throw new Error('deleted user can still sign in'); return 'user A can no longer sign in'; });

for (const [s, n, d] of results) console.log(`${s}  ${n}${d ? ` — ${d}` : ''}`);
console.log(failed ? '\nSMOKE TEST FAILED' : '\nSMOKE TEST PASSED');
process.exit(failed ? 1 : 0);
