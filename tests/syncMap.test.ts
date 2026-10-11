import { fromRemote, toCamel, toRemote, toSnake } from '@/lib/syncMap';
import type { Task } from '@/types';

const task: Task = {
  id: 'id-1',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z',
  deletedAt: null,
  title: 'Ship it',
  description: '',
  category: 'Work',
  priority: 'high',
  dueDate: '2026-10-12',
  reminderAt: null,
  completed: false,
  completedAt: null,
};

describe('sync mapping', () => {
  it('converts keys both ways', () => {
    expect(toSnake('reminderAt')).toBe('reminder_at');
    expect(toCamel('reminder_at')).toBe('reminderAt');
  });

  it('maps an entity to a Postgres row with user_id', () => {
    const row = toRemote(task, 'user-1');
    expect(row).toMatchObject({ user_id: 'user-1', id: 'id-1', due_date: '2026-10-12', reminder_at: null, completed_at: null, deleted_at: null, updated_at: task.updatedAt });
  });

  it('round-trips and drops server-only columns', () => {
    const row = { ...toRemote(task, 'user-1'), synced_at: '2026-10-11T10:00:01+00:00' };
    expect(fromRemote<Task>(row)).toEqual(task);
  });

  it('normalises Postgres timestamps so they sort against local ISO strings', () => {
    const t = fromRemote<Task>({ ...toRemote(task, 'u'), updated_at: '2026-10-11T12:00:00+02:00' });
    expect(t.updatedAt).toBe('2026-10-11T10:00:00.000Z');
    expect(t.dueDate).toBe('2026-10-12');
  });
});
