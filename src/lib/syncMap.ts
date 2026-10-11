import type { Entity } from '@/types';

const ISO = /^\d{4}-\d{2}-\d{2}T/;

export const toSnake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
export const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function toRemote(item: Entity, userId: string): Record<string, unknown> {
  const out: Record<string, unknown> = { user_id: userId };
  for (const [k, v] of Object.entries(item)) out[toSnake(k)] = v;
  return out;
}

export function fromRemote<T extends Entity>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'user_id' || k === 'synced_at') continue;
    // Normalise Postgres timestamps ("+00:00") to JS ISO so string comparison is safe.
    out[toCamel(k)] = typeof v === 'string' && ISO.test(v) ? new Date(v).toISOString() : v;
  }
  return out as unknown as T;
}
