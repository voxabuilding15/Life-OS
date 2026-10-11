import { toggleHabit, toggleMilestone, toggleTask, createTask, createHabit, createGoal, canCreateHabit } from '@/services/actions';
import { todayKey } from '@/lib/date';
import { ENTITY_STORES, liveItems, useMilestones, useGoals, useTasks, useHabits, useAchievementRecords } from '@/store/entities';
import { useFeedback } from '@/store/feedback';
import { useProfile } from '@/store/profile';
import { useSubscription } from '@/store/subscription';

const reset = () => {
  Object.values(ENTITY_STORES).forEach((s) => s.getState().reset());
  useProfile.getState().reset();
  useSubscription.getState().reset();
  useFeedback.setState({ queue: [] });
};

const task = () => createTask({ title: 'T', description: '', category: 'Work', priority: 'medium', dueDate: todayKey(), reminderAt: null });

beforeEach(reset);
afterEach(() => jest.useRealTimers());

describe('task XP', () => {
  it('awards +10 XP on completion and takes it back on reopen', () => {
    const t = task();
    toggleTask(t.id);
    expect(useProfile.getState().xp).toBe(10);
    expect(useTasks.getState().items[t.id].completed).toBe(true);
    toggleTask(t.id);
    expect(useProfile.getState().xp).toBe(0);
    expect(useTasks.getState().items[t.id].completed).toBe(false);
  });

  it('shows an XP popup and unlocks First Step', () => {
    toggleTask(task().id);
    const types = useFeedback.getState().queue.map((e) => e.type);
    expect(types).toContain('xp');
    expect(types).toContain('achievement');
    expect(liveItems(useAchievementRecords).map((a) => a.key)).toContain('first_task');
  });

  it('queues a level-up when XP crosses a level', () => {
    jest.useFakeTimers();
    useProfile.getState().addXp(95);
    toggleTask(task().id); // 105 XP => level 2
    jest.advanceTimersByTime(1000);
    expect(useFeedback.getState().queue.some((e) => e.type === 'levelUp' && e.to === 2)).toBe(true);
  });
});

describe('habits', () => {
  it('awards +20 XP per check-in and toggles off cleanly', () => {
    const h = createHabit({ name: 'Reading', icon: 'book', reminderTime: null })!;
    expect(toggleHabit(h.id)).toBe(true);
    expect(useProfile.getState().xp).toBe(20);
    expect(toggleHabit(h.id)).toBe(false);
    expect(useProfile.getState().xp).toBe(0);
    expect(toggleHabit(h.id)).toBe(true); // revives the soft-deleted log
    expect(useProfile.getState().xp).toBe(20);
  });

  it('limits free users to 3 habits, Pro is unlimited', () => {
    for (let i = 0; i < 3; i++) expect(createHabit({ name: `H${i}`, icon: 'book', reminderTime: null })).not.toBeNull();
    expect(canCreateHabit()).toBe(false);
    expect(createHabit({ name: 'Fourth', icon: 'book', reminderTime: null })).toBeNull();
    useSubscription.getState().set({ isPro: true });
    expect(createHabit({ name: 'Fourth', icon: 'book', reminderTime: null })).not.toBeNull();
    expect(liveItems(useHabits)).toHaveLength(4);
  });
});

describe('goals', () => {
  it('completing the last milestone completes the goal for +500 XP', () => {
    const goal = createGoal({ title: 'Full Stack', description: '', category: 'Career', targetDate: null }, ['HTML', 'CSS'])!;
    const [a, b] = liveItems(useMilestones).sort((x, y) => x.position - y.position);
    expect(toggleMilestone(a.id).goalCompleted).toBe(false);
    expect(useProfile.getState().xp).toBe(40);
    expect(toggleMilestone(b.id).goalCompleted).toBe(true);
    expect(useGoals.getState().items[goal.id].completedAt).not.toBeNull();
    expect(useProfile.getState().xp).toBe(40 + 40 + 500);
    // Re-opening a milestone re-opens the goal and refunds its XP
    toggleMilestone(b.id);
    expect(useGoals.getState().items[goal.id].completedAt).toBeNull();
    expect(useProfile.getState().xp).toBe(40);
  });

  it('limits free users to 3 active goals', () => {
    for (let i = 0; i < 3; i++) expect(createGoal({ title: `G${i}`, description: '', category: 'Career', targetDate: null }, [])).not.toBeNull();
    expect(createGoal({ title: 'G4', description: '', category: 'Career', targetDate: null }, [])).toBeNull();
  });
});

describe('entity store', () => {
  it('soft deletes and merges remote rows last-write-wins', () => {
    const t = task();
    useTasks.getState().remove(t.id);
    expect(useTasks.getState().items[t.id].deletedAt).not.toBeNull();
    const local = useTasks.getState().items[t.id];
    useTasks.getState().mergeRemote([{ ...local, title: 'older', updatedAt: '2000-01-01T00:00:00.000Z' }]);
    expect(useTasks.getState().items[t.id].title).toBe('T');
    useTasks.getState().mergeRemote([{ ...local, title: 'newer', deletedAt: null, updatedAt: '2999-01-01T00:00:00.000Z' }]);
    expect(useTasks.getState().items[t.id].title).toBe('newer');
  });
});
