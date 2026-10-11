import * as Notifications from 'expo-notifications';

const N = Notifications as unknown as Record<string, jest.Mock>;
let svc: typeof import('@/services/notifications');
let settings: typeof import('@/store/settings');
const task = (over: object = {}) => ({ id: 't1', title: 'Pay rent', description: '', category: 'Finance', priority: 'high', dueDate: null, reminderAt: new Date(Date.now() + 3600e3).toISOString(), completed: false, completedAt: null, createdAt: '', updatedAt: '', deletedAt: null, ...over }) as never;

beforeAll(() => {
  jest.isolateModules(() => {
    svc = require('@/services/notifications');
    settings = require('@/store/settings');
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  N.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  settings.useSettings.getState().set({ notifications: true, dailyReminder: true, weeklyReport: true });
});

describe('local notifications', () => {
  it('schedules a future task reminder with a stable id', async () => {
    await svc.scheduleTaskReminder(task());
    expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(N.scheduleNotificationAsync.mock.calls[0][0]).toMatchObject({ identifier: 'task:t1', content: { title: 'Pay rent' }, trigger: { type: 'date' } });
  });

  it('does not schedule past, completed, deleted or reminder-less tasks, and clears the old one', async () => {
    await svc.scheduleTaskReminder(task({ reminderAt: new Date(Date.now() - 1000).toISOString() }));
    await svc.scheduleTaskReminder(task({ completed: true }));
    await svc.scheduleTaskReminder(task({ deletedAt: 'x' }));
    await svc.scheduleTaskReminder(task({ reminderAt: null }));
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledWith('task:t1');
  });

  it('respects the master switch and denied permission', async () => {
    settings.useSettings.getState().set({ notifications: false });
    await svc.scheduleTaskReminder(task());
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
    settings.useSettings.getState().set({ notifications: true });
    N.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    await svc.scheduleTaskReminder(task());
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('asks for permission when it can', async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    N.requestPermissionsAsync.mockResolvedValue({ granted: true });
    expect(await svc.ensureNotificationPermission()).toBe(true);
    expect(N.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('schedules a daily habit reminder at the chosen time', async () => {
    await svc.scheduleHabitReminder({ id: 'h1', name: 'Reading', icon: 'book', reminderTime: '07:30', archived: false, createdAt: '', updatedAt: '', deletedAt: null });
    expect(N.scheduleNotificationAsync.mock.calls[0][0]).toMatchObject({ identifier: 'habit:h1', trigger: { type: 'daily', hour: 7, minute: 30 } });
  });

  it('schedules the evening check-in and Sunday report, and clears them when disabled', async () => {
    await svc.syncDailyReminder();
    const ids = N.scheduleNotificationAsync.mock.calls.map((c) => c[0].identifier).sort();
    expect(ids).toEqual(['daily:review', 'weekly:report']);
    expect(N.scheduleNotificationAsync.mock.calls.find((c) => c[0].identifier === 'weekly:report')![0].trigger).toMatchObject({ type: 'weekly', weekday: 1, hour: 18 });

    jest.clearAllMocks();
    settings.useSettings.getState().set({ notifications: false });
    await svc.syncDailyReminder();
    expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledWith('daily:review');
    expect(N.cancelScheduledNotificationAsync).toHaveBeenCalledWith('weekly:report');
  });
});
