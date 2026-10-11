import { useMemo } from 'react';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { persist } from 'zustand/middleware';
import { emitLocalChange } from '@/lib/events';
import { newId, nowIso } from '@/lib/id';
import type { Entity } from '@/types';
import { persistStorage } from './storage';

export interface EntityState<T extends Entity> {
  items: Record<string, T>;
  /** Create a new entity (id and timestamps are filled in). */
  add: (data: Omit<T, keyof Entity>) => T;
  update: (id: string, patch: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>) => T | undefined;
  /** Soft delete. */
  remove: (id: string) => void;
  /** Merge rows from the server, last-write-wins on updatedAt. Does not trigger a sync. */
  mergeRemote: (rows: T[]) => void;
  reset: () => void;
}

export type EntityStore<T extends Entity> = UseBoundStore<StoreApi<EntityState<T>>> & { tableName: string };

export function createEntityStore<T extends Entity>(name: string): EntityStore<T> {
  const store = create<EntityState<T>>()(
    persist(
      (set, get) => ({
        items: {},
        add: (data) => {
          const now = nowIso();
          const item = { ...data, id: newId(), createdAt: now, updatedAt: now, deletedAt: null } as unknown as T;
          set((s) => ({ items: { ...s.items, [item.id]: item } }));
          emitLocalChange();
          return item;
        },
        update: (id, patch) => {
          const current = get().items[id];
          if (!current) return undefined;
          const next = { ...current, ...patch, updatedAt: nowIso() } as T;
          set((s) => ({ items: { ...s.items, [id]: next } }));
          emitLocalChange();
          return next;
        },
        remove: (id) => {
          const current = get().items[id];
          if (!current || current.deletedAt) return;
          const now = nowIso();
          set((s) => ({ items: { ...s.items, [id]: { ...current, deletedAt: now, updatedAt: now } } }));
          emitLocalChange();
        },
        mergeRemote: (rows) => {
          if (!rows.length) return;
          set((s) => {
            const items = { ...s.items };
            for (const row of rows) {
              const local = items[row.id];
              if (!local || local.updatedAt <= row.updatedAt) items[row.id] = row;
            }
            return { items };
          });
        },
        reset: () => set({ items: {} }),
      }),
      { name: `lifeos.${name}`, storage: persistStorage, version: 1 },
    ),
  ) as unknown as EntityStore<T>;
  store.tableName = name;
  return store;
}

/** Live (non-deleted) entities from a store, newest first. Stable between unrelated renders. */
export function useLive<T extends Entity>(store: EntityStore<T>): T[] {
  const items = store((s) => s.items);
  return useMemo(
    () => Object.values(items).filter((i) => !i.deletedAt).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [items],
  );
}

export const liveItems = <T extends Entity>(store: EntityStore<T>): T[] =>
  Object.values(store.getState().items).filter((i) => !i.deletedAt);
