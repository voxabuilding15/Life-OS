import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Field, FormModal } from '@/components/features/FormModal';
import { Chip } from '@/components/ui/Chip';
import { DatePicker } from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { useI18n } from '@/i18n';
import { canCreateGoal, createGoal } from '@/services/actions';
import { GOAL_CATEGORIES, type GoalCategory } from '@/types';

export default function GoalForm() {
  const { t: tr } = useI18n();
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
    if (!title.trim()) return setError(tr('goals.nameRequired'));
    const goal = createGoal({ title, description: description.trim(), category, targetDate }, milestones);
    if (!goal) return router.replace('/paywall?reason=goals');
    router.replace(`/goal/${goal.id}`);
  };

  return (
    <FormModal title={tr('goals.new')} saveLabel={tr('goals.create')} onSave={save}>
      <Input label={tr('goals.goal')} value={title} onChangeText={(v) => (setTitle(v), setError(null))} placeholder={tr('goals.goalPlaceholder')} error={error} autoFocus />
      <Input label={tr('goals.why')} value={description} onChangeText={setDescription} placeholder={tr('common.optional')} multiline />
      <Field label={tr('goals.category')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GOAL_CATEGORIES.map((c) => (
            <Chip key={c} label={tr(`categories.goal.${c}`)} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      </Field>
      <Field label={tr('goals.milestones')}>
        <View style={{ gap: 10 }}>
          {milestones.map((m, i) => (
            <Input key={i} value={m} onChangeText={(v) => setMilestones((all) => all.map((x, j) => (j === i ? v : x)))} placeholder={['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'][i] ? tr('goals.milestoneExample', { example: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'][i] }) : tr('goals.nextStep')} icon="ellipse-outline" />
          ))}
          <Chip label={tr('goals.addMilestone')} icon="add" onPress={() => setMilestones((m) => [...m, ''])} />
        </View>
      </Field>
      <Field label={tr('goals.targetDate')}>
        <DatePicker value={targetDate} onChange={setTargetDate} />
      </Field>
    </FormModal>
  );
}
