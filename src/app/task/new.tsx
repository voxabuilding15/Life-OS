import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';
import { Field, FormModal } from '@/components/features/FormModal';
import { Chip } from '@/components/ui/Chip';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { formatHm, TimePicker } from '@/components/ui/TimePicker';
import { useI18n } from '@/i18n';
import { fromKey, todayKey } from '@/lib/date';
import { createTask, deleteTask, updateTask } from '@/services/actions';
import { toast } from '@/store/feedback';
import { useTasks } from '@/store/entities';
import { useTheme } from '@/theme';
import { TASK_CATEGORIES, type Priority, type TaskCategory } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

export default function TaskForm() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? useTasks.getState().items[id] : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState<TaskCategory>(existing?.category ?? 'Personal');
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState<string | null>(existing ? existing.dueDate : todayKey());
  const [remind, setRemind] = useState(Boolean(existing?.reminderAt));
  const [time, setTime] = useState(() => {
    if (existing?.reminderAt) {
      const d = new Date(existing.reminderAt);
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return '09:00';
  });
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!title.trim()) return setError(tr('tasks.needTitle'));
    let reminderAt: string | null = null;
    if (remind) {
      const base = fromKey(dueDate ?? todayKey());
      const [h, m] = time.split(':').map(Number);
      base.setHours(h, m, 0, 0);
      reminderAt = base.toISOString();
      if (base.getTime() < Date.now()) {
        toast(tr('tasks.reminderPassed'));
        reminderAt = null;
      }
    }
    const input = { title, description: description.trim(), category, priority, dueDate, reminderAt };
    if (existing) updateTask(existing.id, { ...input, title: title.trim() });
    else createTask(input);
    router.back();
  };

  return (
    <FormModal
      title={existing ? tr('tasks.edit') : tr('tasks.new')}
      saveLabel={existing ? tr('tasks.saveChanges') : tr('tasks.create')}
      onSave={save}
      onDelete={
        existing
          ? () => {
              deleteTask(existing.id);
              router.back();
            }
          : undefined
      }
      deleteLabel={tr('tasks.deleteTask')}
    >
      <Input label={tr('tasks.titleLabel')} value={title} onChangeText={(v) => (setTitle(v), setError(null))} placeholder={tr('tasks.titlePlaceholder')} error={error} autoFocus={!existing} returnKeyType="next" />
      <Input label={tr('tasks.descLabel')} value={description} onChangeText={setDescription} placeholder={tr('tasks.descPlaceholder')} multiline />
      <Field label={tr('tasks.category')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TASK_CATEGORIES.map((c) => (
            <Chip key={c} label={tr(`categories.task.${c}`)} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </Field>
      <Field label={tr('tasks.priority')}>
        <Segmented
          value={priority}
          onChange={setPriority}
          options={[
            { value: 'low', label: tr('priority.low') },
            { value: 'medium', label: tr('priority.medium') },
            { value: 'high', label: tr('priority.high') },
          ]}
        />
      </Field>
      <Field label={tr('tasks.dueDate')}>
        <DatePicker value={dueDate} onChange={setDueDate} />
      </Field>
      <Field label={tr('tasks.reminder')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="body" color="secondary">
            {remind ? tr('tasks.notifyAt', { time: formatHm(time) }) : tr('tasks.noReminder')}
          </Text>
          <Switch
            value={remind}
            onValueChange={setRemind}
            trackColor={{ false: t.surfaceStrong, true: t.accentMuted }}
            thumbColor={remind ? t.accent : '#FFFFFF'}
            accessibilityLabel={tr('tasks.enableReminder')}
          />
        </View>
        {remind ? <TimePicker value={time} onChange={setTime} presets={['08:00', '12:00', '15:00', '18:00', '21:00']} /> : null}
      </Field>
    </FormModal>
  );
}
