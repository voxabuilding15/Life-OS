import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Field, FormModal } from '@/components/features/FormModal';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { formatDay, todayKey } from '@/lib/date';
import { MOODS } from '@/lib/mood';
import { saveJournal } from '@/services/actions';
import { useJournal } from '@/store/entities';
import { useTheme } from '@/theme';

const PROMPTS = ['What went well today?', 'What did you learn?', 'What will you do better tomorrow?'];

export default function JournalEditor() {
  const t = useTheme();
  const { date } = useLocalSearchParams<{ date: string }>();
  const day = date || todayKey();
  const existing = Object.values(useJournal.getState().items).find((e) => e.entryDate === day && !e.deletedAt);
  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [body, setBody] = useState(existing?.body ?? '');

  return (
    <FormModal
      title={formatDay(day)}
      saveLabel="Save entry"
      onSave={() => {
        saveJournal(day, mood, body.trim());
        router.back();
      }}
    >
      <Field label="How are you feeling?">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {MOODS.map((m) => {
            const on = m.value === mood;
            return (
              <PressableScale
                key={m.value}
                onPress={() => setMood(m.value)}
                feedback="tap"
                accessibilityLabel={m.label}
                accessibilityState={{ selected: on }}
                style={{ alignItems: 'center', gap: 6, width: 62, paddingVertical: 12, borderRadius: 18, borderWidth: 1.5, backgroundColor: on ? t.accentSoft : t.surface, borderColor: on ? t.accent : t.border }}
              >
                <Icon name={m.icon} size={26} color={on ? t.accent : t.textSecondary} />
                <Text variant="micro" color={on ? 'accent' : 'tertiary'}>
                  {m.label}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      </Field>
      <Input label="Your thoughts" value={body} onChangeText={setBody} placeholder={PROMPTS[new Date().getDate() % PROMPTS.length]} multiline style={{ minHeight: 160 }} />
    </FormModal>
  );
}
