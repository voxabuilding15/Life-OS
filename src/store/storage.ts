import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Write-coalescing wrapper around AsyncStorage.
 *
 * Every store mutation would otherwise serialise and write the whole collection. With thousands of rows
 * that is wasteful, so writes to the same key within WRITE_DELAY_MS are merged into one, and anything
 * pending is flushed as soon as the app leaves the foreground (so nothing is lost on a swipe-away).
 */
const WRITE_DELAY_MS = 400;
const pending = new Map<string, string>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  const entries = [...pending.entries()];
  pending.clear();
  if (entries.length) await AsyncStorage.multiSet(entries);
}

AppState.addEventListener('change', (s) => {
  if (s !== 'active') void flush();
});

const coalescing: StateStorage = {
  getItem: async (name) => pending.get(name) ?? AsyncStorage.getItem(name),
  setItem: (name, value) => {
    pending.set(name, value);
    if (!timer) timer = setTimeout(() => void flush(), WRITE_DELAY_MS);
  },
  removeItem: async (name) => {
    pending.delete(name);
    await AsyncStorage.removeItem(name);
  },
};

/** Offline-first persistence for every store. */
export const persistStorage = createJSONStorage(() => coalescing);

/** Exposed for sign-out / tests. */
export const flushStorage = flush;
