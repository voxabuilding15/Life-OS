import { useEffect, useState } from 'react';
import { ENTITY_STORES } from '@/store/entities';
import { useProfile } from '@/store/profile';
import { useSettings } from '@/store/settings';
import { useSubscription } from '@/store/subscription';
import { useSync } from '@/store/sync';
import { initAuth } from '@/services/auth';
import { syncDailyReminder } from '@/services/notifications';
import { initPurchases } from '@/services/purchases';
import { startSync } from '@/services/sync';

type Persisted = { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } };

const stores: Persisted[] = [
  useSettings as unknown as Persisted,
  useProfile as unknown as Persisted,
  useSubscription as unknown as Persisted,
  useSync as unknown as Persisted,
  ...(Object.values(ENTITY_STORES) as unknown as Persisted[]),
];

/** True once every persisted store has been rehydrated from disk. */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(() => stores.every((s) => s.persist.hasHydrated()));
  useEffect(() => {
    if (ready) return;
    const check = () => stores.every((s) => s.persist.hasHydrated()) && setReady(true);
    const unsubs = stores.map((s) => s.persist.onFinishHydration(check));
    check();
    return () => unsubs.forEach((u) => u());
  }, [ready]);
  return ready;
}

/** Starts auth, purchases, sync and reminder scheduling once the local data is ready. */
export function useServices(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const stopAuth = initAuth();
    const stopSync = startSync();
    void initPurchases();
    void syncDailyReminder();
    return () => {
      stopAuth();
      stopSync();
    };
  }, [enabled]);
}
