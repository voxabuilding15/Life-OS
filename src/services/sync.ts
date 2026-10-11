import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { isLocale, t } from '@/i18n';
import { onLocalChange } from '@/lib/events';
import { ENTITY_STORES } from '@/store/entities';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { useSubscription } from '@/store/subscription';
import { useSync } from '@/store/sync';
import type { Entity } from '@/types';
import { fromRemote, toRemote } from '@/lib/syncMap';
import { supabase } from './supabase';

/**
 * Cloud sync engine (Pro).
 *
 * - Local-first: every write lands in the persisted Zustand stores immediately.
 * - Push: rows whose `updatedAt` is newer than the per-table cursor are upserted.
 * - Pull: rows with `synced_at` after the per-table cursor are merged, last-write-wins on `updatedAt`.
 * - Deletes are soft (`deletedAt`) so they propagate like any other update.
 * The profile (name, objectives, XP) syncs for every signed-in user; the rest of the data is a Pro feature.
 */

// Parents first so foreign keys resolve.
const ORDER = [
  'habits',
  'habit_logs',
  'goals',
  'goal_milestones',
  'tasks',
  'notes',
  'journal_entries',
  'focus_sessions',
  'achievements',
] as const;

const CONFLICT: Record<string, string> = {
  habit_logs: 'habit_id,log_date',
  journal_entries: 'user_id,entry_date',
  achievements: 'user_id,key',
};

const BATCH = 200;

let inFlight: Promise<void> | null = null;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | null = null;

const canSyncData = () => {
  const { userId } = useAuth.getState();
  return Boolean(supabase && userId && useSubscription.getState().isPro && useSync.getState().online);
};

async function pushTable(table: (typeof ORDER)[number], userId: string) {
  const store = ENTITY_STORES[table];
  const cursor = useSync.getState().pushed[table] ?? '';
  const dirty = (Object.values(store.getState().items) as Entity[])
    .filter((i) => i.updatedAt > cursor)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? -1 : 1));
  for (let i = 0; i < dirty.length; i += BATCH) {
    const chunk = dirty.slice(i, i + BATCH);
    const { error } = await supabase!.from(table).upsert(
      chunk.map((row) => toRemote(row, userId)),
      { onConflict: CONFLICT[table] ?? 'id' },
    );
    if (error) throw error;
    const { pushed, patch } = useSync.getState();
    patch({ pushed: { ...pushed, [table]: chunk[chunk.length - 1].updatedAt } });
  }
}

async function pullTable(table: (typeof ORDER)[number], userId: string) {
  const store = ENTITY_STORES[table];
  for (;;) {
    const cursor = useSync.getState().pulled[table] ?? '1970-01-01T00:00:00Z';
    const { data, error } = await supabase!
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .gt('synced_at', cursor)
      .order('synced_at', { ascending: true })
      .limit(500);
    if (error) throw error;
    if (!data?.length) return;
    (store as unknown as { getState: () => { mergeRemote: (r: Entity[]) => void } })
      .getState()
      .mergeRemote(data.map((r) => fromRemote<Entity>(r)));
    const { pulled, patch } = useSync.getState();
    patch({ pulled: { ...pulled, [table]: data[data.length - 1].synced_at as string } });
    if (data.length < 500) return;
  }
}

export async function syncProfile() {
  const { userId } = useAuth.getState();
  if (!supabase || !userId || !useSync.getState().online) return;
  try {
    const p = useProfile.getState();
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    const remoteUpdated = data?.updated_at ? new Date(data.updated_at as string).toISOString() : '';
    const remote = data
      ? {
          displayName: (data.display_name as string) ?? '',
          avatarUrl: (data.avatar_url as string | null) ?? null,
          objectives: ((data.objectives as string[]) ?? []) as never[],
          xp: (data.xp as number) ?? 0,
          onboarded: Boolean(data.onboarded),
          language: isLocale(data.language) ? data.language : null,
          updatedAt: remoteUpdated,
        }
      : null;
    const sync = useSync.getState();

    // First time this install meets this account: combine instead of letting a fresh install's empty
    // profile overwrite the account's. The account's saved language wins so it follows the user.
    if (remote && sync.profileUser !== userId) {
      p.mergeRemote({
        ...remote,
        displayName: remote.displayName || p.displayName,
        avatarUrl: remote.avatarUrl ?? p.avatarUrl,
        objectives: remote.objectives.length ? remote.objectives : p.objectives,
        xp: Math.max(remote.xp, p.xp),
        language: remote.language ?? p.language,
        updatedAt: new Date().toISOString(),
      });
      sync.patch({ profileUser: userId });
      await pushProfile(userId);
      return;
    }
    sync.patch({ profileUser: userId });

    if (remote && (!p.updatedAt || remoteUpdated > p.updatedAt)) p.mergeRemote(remote);
    else if (!remote || p.updatedAt > remoteUpdated) await pushProfile(userId);
  } catch (e) {
    useSync.getState().patch({ error: e instanceof Error ? e.message : t('settings.syncFailed') });
  }
}

async function pushProfile(userId: string) {
  const p = useProfile.getState();
  await supabase!.from('profiles').upsert({
    id: userId,
    display_name: p.displayName,
    avatar_url: p.avatarUrl,
    objectives: p.objectives,
    xp: p.xp,
    onboarded: p.onboarded,
    language: p.language,
    updated_at: p.updatedAt || new Date().toISOString(),
  });
}

async function syncOnce(): Promise<void> {
  const userId = useAuth.getState().userId;
  if (!userId) return;
  useSync.getState().patch({ syncing: true, error: null });
  try {
    await syncProfile();
    if (canSyncData()) {
      for (const t of ORDER) await pushTable(t, userId);
      for (const t of ORDER) await pullTable(t, userId);
      useSync.getState().patch({ lastSyncAt: new Date().toISOString() });
    }
  } catch (e) {
    useSync.getState().patch({ error: e instanceof Error ? e.message : (e as { message?: string })?.message ?? t('settings.syncFailed') });
  } finally {
    useSync.getState().patch({ syncing: false });
  }
}

/**
 * Runs a sync. If one is already in flight, a follow-up run is queued (so edits made mid-sync are never
 * missed) and the returned promise resolves once everything has settled.
 */
export function runSync(): Promise<void> {
  if (inFlight) {
    rerun = true;
    return inFlight;
  }
  inFlight = (async () => {
    do {
      rerun = false;
      await syncOnce();
    } while (rerun);
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export function scheduleSync(delay = 2500) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void runSync(), delay);
}

/** Wire sync triggers once. Returns a cleanup function. */
export function startSync(): () => void {
  const offChange = onLocalChange(() => scheduleSync());
  const netSub = NetInfo.addEventListener((state) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    const wasOnline = useSync.getState().online;
    useSync.getState().patch({ online });
    if (online && !wasOnline) scheduleSync(500);
  });
  const appSub = AppState.addEventListener('change', (s) => {
    if (s === 'active') scheduleSync(500);
  });
  return () => {
    offChange();
    netSub();
    appSub.remove();
    if (timer) clearTimeout(timer);
  };
}
