import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { Field, FormModal } from '@/components/features/FormModal';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { formatHm, TimePicker } from '@/components/ui/TimePicker';
import { useI18n } from '@/i18n';
import { HABIT_ICONS, HABIT_PRESETS } from '@/lib/habitIcons';
import { canCreateHabit, createHabit } from '@/services/actions';
import { useTheme } from '@/theme';

export default function HabitForm() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('book');
  const [remind, setRemind] = useState(false);
  const [time, setTime] = useState('08:00');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canCreateHabit()) router.replace('/paywall?reason=habits');
  }, []);

  const save = () => {
    if (!name.trim()) return setError(tr('habits.nameRequired'));
    const habit = createHabit({ name, icon, reminderTime: remind ? time : null });
    if (!habit) return router.replace('/paywall?reason=habits');
    router.back();
  };

  return (
    <FormModal title={tr('habits.new')} saveLabel={tr('habits.create')} onSave={save}>
      <Field label={tr('habits.quickStart')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {HABIT_PRESETS.map((p) => (
            <Chip
              key={p.id}
              label={tr(`starterHabits.${p.id}`)}
              icon={p.icon}
              selected={name === tr(`starterHabits.${p.id}`)}
              onPress={() => {
                setName(tr(`starterHabits.${p.id}`));
                setIcon(p.icon);
                setError(null);
              }}
            />
          ))}
        </View>
      </Field>
      <Input label={tr('habits.name')} value={name} onChangeText={(v) => (setName(v), setError(null))} placeholder={tr('habits.namePlaceholder')} error={error} />
      <Field label={tr('habits.icon')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {HABIT_ICONS.map((i) => (
            <PressableScale
              key={i}
              onPress={() => setIcon(i)}
              feedback="tap"
              accessibilityLabel={tr('habits.iconLabel', { name: i })}
              accessibilityState={{ selected: icon === i }}
              style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, backgroundColor: icon === i ? t.accentSoft : t.surface, borderColor: icon === i ? t.accent : t.border }}
            >
              <Icon name={i} size={22} color={icon === i ? t.accent : t.textSecondary} />
            </PressableScale>
          ))}
        </View>
      </Field>
      <Field label={tr('habits.dailyReminder')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="body" color="secondary">
            {remind ? tr('habits.everyDayAt', { time: formatHm(time) }) : tr('tasks.noReminder')}
          </Text>
          <Switch value={remind} onValueChange={setRemind} trackColor={{ false: t.surfaceStrong, true: t.accentMuted }} thumbColor={remind ? t.accent : '#FFFFFF'} accessibilityLabel={tr('habits.enableDaily')} />
        </View>
        {remind ? <TimePicker value={time} onChange={setTime} presets={['07:00', '12:00', '18:00', '21:00']} /> : null}
      </Field>
    </FormModal>
  );
}
