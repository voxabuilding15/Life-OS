export const HABIT_ICONS = ['book', 'barbell', 'code-slash', 'water', 'leaf', 'moon', 'bicycle', 'musical-notes', 'restaurant', 'brush', 'language', 'cash', 'calendar', 'bulb', 'walk', 'heart', 'wallet', 'create'] as const;

export const HABIT_PRESETS: { name: string; icon: (typeof HABIT_ICONS)[number] }[] = [
  { name: 'Reading', icon: 'book' },
  { name: 'Gym', icon: 'barbell' },
  { name: 'Coding', icon: 'code-slash' },
  { name: 'Water', icon: 'water' },
  { name: 'Meditation', icon: 'leaf' },
];

/** Starter habit ideas per onboarding objective. */
export const STARTER_HABITS: Record<string, { name: string; icon: (typeof HABIT_ICONS)[number] }[]> = {
  productivity: [
    { name: 'Plan tomorrow', icon: 'calendar' },
    { name: 'Deep work block', icon: 'bulb' },
  ],
  fitness: [
    { name: 'Gym', icon: 'barbell' },
    { name: 'Walk 8k steps', icon: 'walk' },
    { name: 'Water', icon: 'water' },
  ],
  learning: [
    { name: 'Reading', icon: 'book' },
    { name: 'Coding', icon: 'code-slash' },
    { name: 'Practice a language', icon: 'language' },
  ],
  career: [
    { name: 'Work on a side project', icon: 'code-slash' },
    { name: 'Network or reach out', icon: 'create' },
  ],
  finance: [
    { name: 'Track spending', icon: 'wallet' },
    { name: 'Save something', icon: 'cash' },
  ],
  growth: [
    { name: 'Meditation', icon: 'leaf' },
    { name: 'Journal', icon: 'create' },
    { name: 'Sleep by 11pm', icon: 'moon' },
  ],
};
