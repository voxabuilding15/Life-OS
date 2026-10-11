jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}` };
});
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: false, canAskAgain: false })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  setNotificationChannelAsync: jest.fn(),
  getDevicePushTokenAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily', TIME_INTERVAL: 'timeInterval' },
}));
jest.mock('expo-device', () => ({ isDevice: false }));
