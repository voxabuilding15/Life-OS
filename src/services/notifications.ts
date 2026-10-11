import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/store/auth';
import { useSettings } from '@/store/settings';
import type { Habit, Task } from '@/types';
import { supabase } from './supabase';

const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Life OS',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#68C7EC',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

const enabled = () => useSettings.getState().notifications;

export async function scheduleTaskReminder(task: Task): Promise<void> {
  if (!supported) return;
  const id = `task:${task.id}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  if (!enabled() || task.completed || task.deletedAt || !task.reminderAt) return;
  const when = new Date(task.reminderAt);
  if (when.getTime() <= Date.now() || !(await ensureNotificationPermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: task.title, body: task.description || 'Reminder from Life OS', data: { route: '/(tabs)/tasks' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  if (supported) await Notifications.cancelScheduledNotificationAsync(`task:${taskId}`).catch(() => undefined);
}

export async function scheduleHabitReminder(habit: Habit): Promise<void> {
  if (!supported) return;
  const id = `habit:${habit.id}`;
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  if (!enabled() || habit.archived || habit.deletedAt || !habit.reminderTime) return;
  const [hour, minute] = habit.reminderTime.split(':').map(Number);
  if (!(await ensureNotificationPermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: habit.name, body: 'Keep your streak alive.', data: { route: '/(tabs)/habits' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  if (supported) await Notifications.cancelScheduledNotificationAsync(`habit:${habitId}`).catch(() => undefined);
}

export async function syncDailyReminder(): Promise<void> {
  if (!supported) return;
  const id = 'daily:review';
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  await Notifications.cancelScheduledNotificationAsync('weekly:report').catch(() => undefined);
  const { dailyReminder } = useSettings.getState();
  if (!enabled() || !(await ensureNotificationPermission())) return;
  await scheduleWeekly();
  if (!dailyReminder) return;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: 'Close out your day', body: 'Check off your tasks and habits to keep levelling up.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 30 },
  });
}

async function scheduleWeekly(): Promise<void> {
  const id = 'weekly:report';
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
  if (!useSettings.getState().weeklyReport) return;
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: { title: 'Your weekly report is ready', body: 'See your Life Score and how your week went.', data: { route: '/report' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 18, minute: 30 },
  });
}

/** Registers this device's FCM token on the profile so the backend can send pushes. */
export async function registerPushToken(): Promise<void> {
  const userId = useAuth.getState().userId;
  if (!supported || !supabase || !userId || !Device.isDevice) return;
  try {
    if (!(await ensureNotificationPermission())) return;
    const token = await Notifications.getDevicePushTokenAsync(); // FCM on Android, APNs on iOS
    await supabase.from('profiles').update({ push_token: String(token.data), push_platform: Platform.OS }).eq('id', userId);
  } catch {
    /* Firebase not configured on this build: reminders still work locally. */
  }
}

export async function scheduleFocusEnd(seconds: number, title: string): Promise<void> {
  if (!supported || !enabled()) return;
  await Notifications.cancelScheduledNotificationAsync('focus:end').catch(() => undefined);
  if (!(await ensureNotificationPermission())) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'focus:end',
    content: { title, body: 'Time is up. Open Life OS to continue.', data: { route: '/focus' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, Math.round(seconds)) },
  });
}

export async function cancelFocusEnd(): Promise<void> {
  if (supported) await Notifications.cancelScheduledNotificationAsync('focus:end').catch(() => undefined);
}
