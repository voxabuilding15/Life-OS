import { create } from 'zustand';
import type { AchievementDef } from '@/lib/gamification';

export type FeedbackEvent =
  | { id: number; type: 'xp'; amount: number; label: string }
  | { id: number; type: 'levelUp'; from: number; to: number }
  | { id: number; type: 'achievement'; achievement: AchievementDef }
  | { id: number; type: 'toast'; message: string };

type NewEvent = FeedbackEvent extends infer E ? (E extends { id: number } ? Omit<E, 'id'> : never) : never;

interface FeedbackState {
  queue: FeedbackEvent[];
  push: (event: NewEvent) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useFeedback = create<FeedbackState>((set) => ({
  queue: [],
  push: (event) => set((s) => ({ queue: [...s.queue, { ...event, id: ++counter } as FeedbackEvent] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((e) => e.id !== id) })),
}));

export const toast = (message: string) => useFeedback.getState().push({ type: 'toast', message });
