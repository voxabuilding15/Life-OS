/**
 * End-to-end tests of the app's real auth + sync code (services/auth.ts, services/sync.ts, supabase-js)
 * against PostgreSQL with the project's migrations and RLS, through a Supabase-compatible shim.
 */

import { nodeFetch } from './nodeFetch';

declare const process: { env: Record<string, string | undefined> };

let auth: typeof import('@/services/auth');
let sync: typeof import('@/services/sync');
let supa: typeof import('@/services/supabase');
let stores: typeof import('@/store/entities');
let authStore: typeof import('@/store/auth');
let profile: typeof import('@/store/profile');
let subscription: typeof import('@/store/subscription');
let syncStore: typeof import('@/store/sync');
let stopAuth: () => void;

const BASE = () => process.env.IT_SUPABASE_URL as string;
const sql = async (query: string, args: unknown[] = []) => {
  const res = await fetch(`${BASE()}/__sql`, { method: 'POST', body: JSON.stringify({ sql: query, args }) });
  return (await res.json()) as Record<string, unknown>[];
};
const waitFor = async (cond: () => boolean, ms = 4000) => {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, 25));
  }
};
const email = (n: string) => `${n}-${Math.random().toString(36).slice(2, 8)}@example.com`;
const PASSWORD = 'correct horse battery';
const wipeLocal = () => {
  stores.resetAllEntities();
  profile.useProfile.getState().reset();
  subscription.useSubscription.getState().reset();
  syncStore.useSync.getState().reset();
};

beforeAll(async () => {
  (globalThis as { fetch: unknown }).fetch = nodeFetch;
  process.env.EXPO_PUBLIC_SUPABASE_URL = BASE();
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  jest.resetModules();
  // Node's fetch talks to the shim; RN's polyfill is not needed here.
  auth = require('@/services/auth');
  sync = require('@/services/sync');
  supa = require('@/services/supabase');
  stores = require('@/store/entities');
  authStore = require('@/store/auth');
  profile = require('@/store/profile');
  subscription = require('@/store/subscription');
  syncStore = require('@/store/sync');
  expect(supa.supabase).not.toBeNull();
  stopAuth = auth.initAuth();
});

afterAll(() => stopAuth?.());

describe('authentication', () => {
  const e = email('ann');

  it('registers a new account, signs in and creates the profile + user rows', async () => {
    profile.useProfile.getState().setProfile({ displayName: 'Ann', objectives: ['learning'] });
    const r = await auth.signUp(e, PASSWORD, 'Ann');
    expect(r).toEqual({ ok: true, needsConfirmation: false });
    await waitFor(() => authStore.useAuth.getState().status === 'signedIn');
    const uid = authStore.useAuth.getState().userId!;
    expect((await sql('select email from public.users where id = $1', [uid]))[0].email).toBe(e);
    expect((await sql('select display_name from public.profiles where id = $1', [uid]))[0].display_name).toBe('Ann');
  });

  it('rejects a duplicate email with a friendly message', async () => {
    expect(await auth.signUp(e, PASSWORD, 'Ann')).toEqual({ ok: false, error: 'An account with this email already exists.' });
  });

  it('rejects weak passwords', async () => {
    const r = await auth.signUp(email('weak'), '123', 'W');
    expect(r.ok).toBe(false);
  });

  it('signs out and wipes local data', async () => {
    stores.useTasks.getState().add({ title: 'secret', description: '', category: 'Work', priority: 'low', dueDate: null, reminderAt: null, completed: false, completedAt: null });
    await auth.signOut();
    await waitFor(() => authStore.useAuth.getState().status === 'signedOut');
    expect(Object.keys(stores.useTasks.getState().items)).toHaveLength(0);
    expect(profile.useProfile.getState().displayName).toBe('');
  });

  it('rejects a wrong password and accepts the right one', async () => {
    expect(await auth.signIn(e, 'wrong-password')).toEqual({ ok: false, error: 'Incorrect email or password.' });
    expect(await auth.signIn(e, PASSWORD)).toEqual({ ok: true });
    await waitFor(() => authStore.useAuth.getState().status === 'signedIn');
  });

  it('sends a password reset', async () => {
    expect(await auth.sendPasswordReset(e)).toEqual({ ok: true });
  });

  it('deletes the account and all of its data', async () => {
    const uid = authStore.useAuth.getState().userId!;
    expect(await auth.deleteAccountData()).toEqual({ ok: true });
    expect(await sql('select 1 from auth.users where id = $1', [uid])).toHaveLength(0);
    expect(await sql('select 1 from public.profiles where id = $1', [uid])).toHaveLength(0);
    expect(await auth.signIn(e, PASSWORD)).toEqual({ ok: false, error: 'Incorrect email or password.' });
  });
});

describe('cloud sync', () => {
  const e = email('sync');
  let uid: string;
  const seed = () => {
    const t = stores.useTasks.getState().add({ title: 'Ship launch', description: 'd', category: 'Work', priority: 'high', dueDate: '2026-10-12', reminderAt: new Date('2026-10-12T09:00:00Z').toISOString(), completed: true, completedAt: new Date().toISOString() });
    const h = stores.useHabits.getState().add({ name: 'Reading', icon: 'book', reminderTime: '07:30', archived: false });
    stores.useHabitLogs.getState().add({ habitId: h.id, logDate: '2026-10-10' });
    stores.useHabitLogs.getState().add({ habitId: h.id, logDate: '2026-10-11' });
    const g = stores.useGoals.getState().add({ title: 'Full Stack', description: '', category: 'Career', targetDate: '2027-01-01', completedAt: null });
    stores.useMilestones.getState().add({ goalId: g.id, title: 'HTML', position: 0, completed: true, completedAt: new Date().toISOString() });
    stores.useNotes.getState().add({ title: 'Idea', body: 'x'.repeat(500), category: 'Ideas', isFavorite: true });
    stores.useJournal.getState().add({ entryDate: '2026-10-11', mood: 4, body: 'good day' });
    stores.useFocusSessions.getState().add({ startedAt: new Date().toISOString(), durationSeconds: 1500, plannedSeconds: 1500, completed: true, taskId: t.id });
    stores.useAchievementRecords.getState().add({ key: 'first_task', unlockedAt: new Date().toISOString() });
    return { t, h, g };
  };

  beforeAll(async () => {
    await auth.signUp(e, PASSWORD, 'Sync User');
    await waitFor(() => authStore.useAuth.getState().status === 'signedIn');
    uid = authStore.useAuth.getState().userId!;
    await sync.runSync(); // let the sign-in sync settle so it cannot interleave with the tests
    wipeLocal();
    syncStore.useSync.getState().patch({ online: true });
  });

  it('keeps data on the device for Free users but still syncs the profile', async () => {
    profile.useProfile.getState().setProfile({ displayName: 'Free Fred', language: 'ar' });
    profile.useProfile.getState().addXp(120);
    stores.useTasks.getState().add({ title: 'local only', description: '', category: 'Work', priority: 'low', dueDate: null, reminderAt: null, completed: false, completedAt: null });
    await sync.runSync();
    expect(await sql('select 1 from public.tasks where user_id = $1', [uid])).toHaveLength(0);
    // First sync of this install: the account's name wins over a blank/fresh local one, XP is never lost.
    let p = (await sql('select display_name, xp, level, language from public.profiles where id = $1', [uid]))[0];
    expect(p).toMatchObject({ display_name: 'Sync User', xp: 120, level: 2, language: 'ar' });
    // Later edits are plain last-write-wins.
    profile.useProfile.getState().setProfile({ displayName: 'Free Fred', language: 'fr' });
    await sync.runSync();
    p = (await sql('select display_name, language from public.profiles where id = $1', [uid]))[0];
    expect(p).toMatchObject({ display_name: 'Free Fred', language: 'fr' });
    wipeLocal();
  });

  it('brings the saved language back on a fresh install and never lets a blank profile overwrite the account', async () => {
    wipeLocal();
    profile.useProfile.getState().setProfile({ language: 'en', onboarded: true }); // what onboarding does on a new device
    await sync.runSync();
    expect(profile.useProfile.getState()).toMatchObject({ language: 'fr', displayName: 'Free Fred', xp: 120 });
    const p = (await sql('select xp, display_name, language from public.profiles where id = $1', [uid]))[0];
    expect(p).toMatchObject({ xp: 120, display_name: 'Free Fred', language: 'fr' });
    wipeLocal();
  });

  it('pushes every entity type for Pro users with correct column mapping', async () => {
    subscription.useSubscription.getState().set({ isPro: true });
    const { t, h } = seed();
    await sync.runSync();
    expect(syncStore.useSync.getState().error).toBeNull();
    const count = async (table: string) => Number((await sql(`select count(*)::int as n from public.${table} where user_id = $1`, [uid]))[0].n);
    expect(await Promise.all(['tasks', 'habits', 'habit_logs', 'goals', 'goal_milestones', 'notes', 'journal_entries', 'focus_sessions', 'achievements'].map(count))).toEqual([1, 1, 2, 1, 1, 1, 1, 1, 1]);
    const row = (await sql('select title, priority, due_date::text as due, completed, reminder_at, focus.task_id from public.tasks left join (select task_id from public.focus_sessions limit 1) focus on true where id = $1', [t.id]))[0];
    expect(row).toMatchObject({ title: 'Ship launch', priority: 'high', due: '2026-10-12', completed: true });
    expect(row.task_id).toBe(t.id);
    expect((await sql('select reminder_time from public.habits where id = $1', [h.id]))[0].reminder_time).toBe('07:30');
  });

  it('only pushes what changed (incremental)', async () => {
    const [before] = await sql('select synced_at from public.notes where user_id = $1', [uid]);
    const t = Object.values(stores.useTasks.getState().items)[0];
    stores.useTasks.getState().update(t.id, { title: 'Ship launch v2' });
    await new Promise((r) => setTimeout(r, 20));
    await sync.runSync();
    expect((await sql('select title from public.tasks where id = $1', [t.id]))[0].title).toBe('Ship launch v2');
    const [after] = await sql('select synced_at from public.notes where user_id = $1', [uid]);
    expect(after.synced_at).toBe(before.synced_at); // the untouched note was not re-written
  });

  it('propagates soft deletes', async () => {
    const note = Object.values(stores.useNotes.getState().items)[0];
    stores.useNotes.getState().remove(note.id);
    await sync.runSync();
    expect((await sql('select deleted_at from public.notes where id = $1', [note.id]))[0].deleted_at).not.toBeNull();
  });

  it('restores everything on a fresh install after sign-in', async () => {
    const snapshot = JSON.stringify(Object.values(stores.useTasks.getState().items).map((t) => ({ id: t.id, title: t.title, due: t.dueDate, completed: t.completed })));
    await auth.signOut();
    await waitFor(() => authStore.useAuth.getState().status === 'signedOut');
    expect(Object.keys(stores.useTasks.getState().items)).toHaveLength(0);
    expect(await auth.signIn(e, PASSWORD)).toEqual({ ok: true });
    await waitFor(() => authStore.useAuth.getState().status === 'signedIn');
    subscription.useSubscription.getState().set({ isPro: true }); // RevenueCat restores this on a real device
    await sync.runSync();
    expect(JSON.stringify(Object.values(stores.useTasks.getState().items).map((t) => ({ id: t.id, title: t.title, due: t.dueDate, completed: t.completed })))).toBe(snapshot);
    expect(Object.values(stores.useHabitLogs.getState().items)).toHaveLength(2);
    expect(Object.values(stores.useMilestones.getState().items)[0].completed).toBe(true);
    expect(profile.useProfile.getState().displayName).toBe('Free Fred'); // profile (set earlier on this account) came back from the server
  });

  it('resolves conflicts last-write-wins', async () => {
    const t = Object.values(stores.useTasks.getState().items)[0];
    // A newer edit made elsewhere wins.
    await sql(`update public.tasks set title = 'edited on another device', updated_at = now() + interval '1 hour' where id = $1`, [t.id]);
    await sync.runSync();
    expect(stores.useTasks.getState().items[t.id].title).toBe('edited on another device');
    // An older remote edit is ignored (and our newer local one is pushed).
    stores.useTasks.getState().update(t.id, { title: 'local newest' });
    await sql(`update public.tasks set title = 'stale', updated_at = '2000-01-01' where id = $1`, [t.id]);
    await sync.runSync();
    expect(stores.useTasks.getState().items[t.id].title).toBe('local newest');
  });

  it('merges the same habit day created on two devices without error', async () => {
    const h = Object.values(stores.useHabits.getState().items)[0];
    stores.useHabitLogs.getState().add({ habitId: h.id, logDate: '2026-10-09' });
    await sql(`insert into public.habit_logs (id, user_id, habit_id, log_date) values (gen_random_uuid(), $1, $2, '2026-10-09')`, [uid, h.id]);
    await sync.runSync();
    expect(syncStore.useSync.getState().error).toBeNull();
    expect(Number((await sql(`select count(*)::int n from public.habit_logs where habit_id = $1 and log_date = '2026-10-09'`, [h.id]))[0].n)).toBe(1);
  });

  it('isolates users with Row Level Security', async () => {
    const eB = email('bob');
    const reg = await fetch(`${BASE()}/auth/v1/signup`, { method: 'POST', body: JSON.stringify({ email: eB, password: PASSWORD }) });
    const { access_token } = (await reg.json()) as { access_token: string };
    const headers = { authorization: `Bearer ${access_token}`, 'content-type': 'application/json' };
    const read = await fetch(`${BASE()}/rest/v1/tasks?select=*`, { headers });
    expect(await read.json()).toEqual([]); // sees none of Sync User's rows
    const t = Object.values(stores.useTasks.getState().items)[0];
    const steal = await fetch(`${BASE()}/rest/v1/tasks?id=eq.${t.id}`, { method: 'PATCH', headers, body: JSON.stringify({ title: 'hacked' }) });
    expect(steal.status).toBe(200);
    expect((await sql('select title from public.tasks where id = $1', [t.id]))[0].title).not.toBe('hacked');
    const spoof = await fetch(`${BASE()}/rest/v1/tasks`, { method: 'POST', headers, body: JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', user_id: uid, title: 'spoof' }) });
    expect(spoof.status).toBe(403);
    const subs = await fetch(`${BASE()}/rest/v1/subscriptions`, { method: 'POST', headers, body: JSON.stringify({ user_id: uid, plan: 'pro' }) });
    expect(subs.status).toBe(403); // clients can never grant themselves Pro
  });

  it('does nothing while offline', async () => {
    syncStore.useSync.getState().patch({ online: false });
    stores.useNotes.getState().add({ title: 'offline note', body: '', category: 'Ideas', isFavorite: false });
    await sync.runSync();
    expect(await sql(`select 1 from public.notes where title = 'offline note'`)).toHaveLength(0);
    syncStore.useSync.getState().patch({ online: true });
    await sync.runSync();
    expect(await sql(`select 1 from public.notes where title = 'offline note'`)).toHaveLength(1);
  });
});
