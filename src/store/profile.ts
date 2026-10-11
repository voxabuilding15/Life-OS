import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emitLocalChange } from '@/lib/events';
import { nowIso } from '@/lib/id';
import { levelFromXp } from '@/lib/gamification';
import type { Locale } from '@/i18n';
import type { ObjectiveId } from '@/types';
import { persistStorage } from './storage';

interface ProfileState {
  displayName: string;
  avatarUrl: string | null;
  objectives: ObjectiveId[];
  xp: number;
  onboarded: boolean;
  /** UI language. null until the first launch resolves it from the device. */
  language: Locale | null;
  updatedAt: string;
  /** Adds (or removes, if negative) XP and returns the levels before/after. */
  addXp: (amount: number) => { before: number; after: number };
  setProfile: (patch: Partial<Pick<ProfileState, 'displayName' | 'avatarUrl' | 'objectives' | 'onboarded' | 'language'>>) => void;
  /** Server snapshot wins when it is newer, or when it holds more XP than a fresh install. */
  mergeRemote: (row: { displayName: string; avatarUrl: string | null; objectives: ObjectiveId[]; xp: number; onboarded: boolean; language: Locale | null; updatedAt: string }) => void;
  reset: () => void;
}

const initial = { displayName: '', avatarUrl: null, objectives: [] as ObjectiveId[], xp: 0, onboarded: false, language: null as Locale | null, updatedAt: '' };

export const useProfile = create<ProfileState>()(
  persist(
    (set, get) => ({
      ...initial,
      addXp: (amount) => {
        const before = levelFromXp(get().xp);
        const xp = Math.max(0, get().xp + amount);
        set({ xp, updatedAt: nowIso() });
        emitLocalChange();
        return { before, after: levelFromXp(xp) };
      },
      setProfile: (patch) => {
        set({ ...patch, updatedAt: nowIso() });
        emitLocalChange();
      },
      mergeRemote: (row) => {
        const local = get();
        if (!local.updatedAt || row.updatedAt > local.updatedAt) {
          set({ ...row, language: row.language ?? local.language, onboarded: row.onboarded || local.onboarded });
        }
      },
      reset: () => set(initial),
    }),
    { name: 'lifeos.profile', storage: persistStorage, version: 1 },
  ),
);

export const useLevel = () => useProfile((s) => levelFromXp(s.xp));
