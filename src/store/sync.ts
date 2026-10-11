import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from './storage';

interface SyncState {
  /** Highest updatedAt already pushed, per table. */
  pushed: Record<string, string>;
  /** Server-side synced_at cursor already pulled, per table. */
  pulled: Record<string, string>;
  lastSyncAt: string | null;
  /** Account whose profile this install has already merged once (see syncProfile). */
  profileUser: string | null;
  syncing: boolean;
  error: string | null;
  online: boolean;
  patch: (p: Partial<Omit<SyncState, 'patch' | 'reset'>>) => void;
  reset: () => void;
}

export const useSync = create<SyncState>()(
  persist(
    (set) => ({
      pushed: {},
      pulled: {},
      lastSyncAt: null,
      profileUser: null,
      syncing: false,
      error: null,
      online: true,
      patch: (p) => set(p),
      reset: () => set({ pushed: {}, pulled: {}, lastSyncAt: null, profileUser: null, error: null }),
    }),
    {
      name: 'lifeos.sync',
      storage: persistStorage,
      version: 1,
      partialize: (s) => ({ pushed: s.pushed, pulled: s.pulled, lastSyncAt: s.lastSyncAt, profileUser: s.profileUser }) as never,
    },
  ),
);
