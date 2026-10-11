import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Field, FormModal } from '@/components/features/FormModal';
import { Chip } from '@/components/ui/Chip';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { canCreateGoal, createGoal } from '@/services/actions';
import { GOAL_CATEGORIES, type GoalCategory } from '@/types';

export default function GoalForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Career');
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<string[]>(['', '', '']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canCreateGoal()) router.replace('/paywall?reason=goals');
  }, []);

  const save = () => {
    if (!title.trim()) return setError('Name your goal.');
    const goal = createGoal({ title, description: description.trim(), category, targetDate }, milestones);
    if (!goal) return router.replace('/paywall?reason=goals');
    router.replace(`/goal/${goal.id}`);
  };

  return (
    <FormModal title="New goal" saveLabel="Create goal" onSave={save}>
      <Input label="Goal" value={title} onChangeText={(v) => (setTitle(v), setError(null))} placeholder="e.g. Become a Full Stack Developer" error={error} autoFocus />
      <Input label="Why it matters" value={description} onChangeText={setDescription} placeholder="Optional" multiline />
      <Field label="Category">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GOAL_CATEGORIES.map((c) => (
            <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </Field>
      <Field label="Milestones">
        <View style={{ gap: 10 }}>
          {milestones.map((m, i) => (
            <Input key={i} value={m} onChangeText={(v) => setMilestones((all) => all.map((x, j) => (j === i ? v : x)))} placeholder={['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'][i] ? `e.g. ${['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'][i]}` : 'Next step'} icon="ellipse-outline" />
          ))}
          <Chip label="Add milestone" icon="add" onPress={() => setMilestones((m) => [...m, ''])} />
        </View>
      </Field>
      <Field label="Target date">
        <DatePicker value={targetDate} onChange={setTargetDate} />
      </Field>
    </FormModal>
  );
}
