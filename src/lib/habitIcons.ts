export const HABIT_ICONS = ['book', 'barbell', 'code-slash', 'water', 'leaf', 'moon', 'bicycle', 'musical-notes', 'restaurant', 'brush', 'language', 'cash'] as const;

export const HABIT_PRESETS: { name: string; icon: (typeof HABIT_ICONS)[number] }[] = [
  { name: 'Reading', icon: 'book' },
  { name: 'Gym', icon: 'barbell' },
  { name: 'Coding', icon: 'code-slash' },
  { name: 'Water', icon: 'water' },
  { name: 'Meditation', icon: 'leaf' },
];
