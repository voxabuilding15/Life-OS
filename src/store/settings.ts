import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeId } from '@/theme/tokens';
import { persistStorage } from './storage';

interface SettingsState {
  themeId: ThemeId;
  haptics: boolean;
  notifications: boolean;
  dailyReminder: boolean;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsUntilLongBreak: number;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      themeId: 'ocean',
      haptics: true,
      notifications: true,
      dailyReminder: true,
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      sessionsUntilLongBreak: 4,
      set: (patch) => set(patch),
    }),
    { name: 'lifeos.settings', storage: persistStorage, version: 1 },
  ),
);
