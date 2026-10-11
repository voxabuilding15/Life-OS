/** Mood scale 1 (rough) - 5 (great). Labels live in the locale files under `mood.<value>`. */
export const MOODS = [
  { value: 1, icon: 'sad-outline' },
  { value: 2, icon: 'remove-circle-outline' },
  { value: 3, icon: 'happy-outline' },
  { value: 4, icon: 'happy' },
  { value: 5, icon: 'sunny' },
] as const;
