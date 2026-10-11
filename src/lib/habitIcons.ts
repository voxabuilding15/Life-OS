export const HABIT_ICONS = ['book', 'barbell', 'code-slash', 'water', 'leaf', 'moon', 'bicycle', 'musical-notes', 'restaurant', 'brush', 'language', 'cash', 'calendar', 'bulb', 'walk', 'heart', 'wallet', 'create'] as const;

export type HabitIcon = (typeof HABIT_ICONS)[number];

/** Habit ideas. Names live in the locale files under `starterHabits.<id>`. */
export interface HabitIdea {
  id: string;
  icon: HabitIcon;
}

export const HABIT_PRESETS: HabitIdea[] = [
  { id: 'reading', icon: 'book' },
  { id: 'gym', icon: 'barbell' },
  { id: 'coding', icon: 'code-slash' },
  { id: 'water', icon: 'water' },
  { id: 'meditation', icon: 'leaf' },
];

/** Starter habit ideas per onboarding objective. */
export const STARTER_HABITS: Record<string, HabitIdea[]> = {
  productivity: [
    { id: 'plan_tomorrow', icon: 'calendar' },
    { id: 'deep_work', icon: 'bulb' },
  ],
  fitness: [
    { id: 'gym', icon: 'barbell' },
    { id: 'walk', icon: 'walk' },
    { id: 'water', icon: 'water' },
  ],
  learning: [
    { id: 'reading', icon: 'book' },
    { id: 'coding', icon: 'code-slash' },
    { id: 'language', icon: 'language' },
  ],
  career: [
    { id: 'side_project', icon: 'code-slash' },
    { id: 'network', icon: 'create' },
  ],
  finance: [
    { id: 'spending', icon: 'wallet' },
    { id: 'save', icon: 'cash' },
  ],
  growth: [
    { id: 'meditation', icon: 'leaf' },
    { id: 'journal', icon: 'create' },
    { id: 'sleep', icon: 'moon' },
  ],
};
