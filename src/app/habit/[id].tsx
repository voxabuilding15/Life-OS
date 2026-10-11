import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Platform, View } from 'react-native';
import { FreezeBanner } from '@/components/features/FreezeBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header, SectionHeader } from '@/components/ui/Header';
import { Heatmap } from '@/components/ui/Heatmap';
import { Icon } from '@/components/ui/Icon';
import { ProBadge } from '@/components/ui/ProBadge';
import { Screen } from '@/components/ui/Screen';
import { StatTile } from '@/components/ui/StatTile';
import { Text } from '@/components/ui/Text';
import { useHabitsData } from '@/hooks/useData';
import { deleteHabit, freezesRemaining, toggleHabit } from '@/services/actions';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

export default function HabitDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPro = useIsPro();
  const { items } = useHabitsData();
  const item = useMemo(() => items.find((i) => i.habit.id === id), [items, id]);

  if (!item) {
    return (
      <Screen>
        <Header title="Habit" back />
        <EmptyState icon="alert-circle-outline" title="Habit not found" message="It may have been deleted." />
      </Screen>
    );
  }
  const { habit, doneDays, frozenDays, offer, streak, best, doneToday, rate30 } = item;

  const confirmDelete = () => {
    const run = () => {
      deleteHabit(habit.id);
      router.back();
    };
    if (Platform.OS === 'web') return run();
    Alert.alert('Delete habit?', 'Your streak and history for this habit will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen>
      <Header title={habit.name} subtitle="Habit" back />
      <Card accent padding={22}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Icon name={habit.icon} size={30} color={t.accent} />
          <Text style={{ fontSize: 56, lineHeight: 62, fontFamily: 'Inter_800ExtraBold', letterSpacing: -2 }}>{streak}</Text>
          <Text variant="bodyMedium" color="secondary">
            🔥 {streak} day streak
          </Text>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <StatTile icon="trophy" value={best} label="Best streak" />
        <StatTile icon="calendar" value={doneDays.size} label="Check-ins" />
        <StatTile icon="pulse" value={`${Math.round(rate30 * 100)}%`} label="30 days" />
      </View>
      <SectionHeader title="Streak Freeze" />
      <Card padding={16} accent={Boolean(offer)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="snow" size={20} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="bodyMedium">Protect your streak</Text>
              {!isPro ? <ProBadge small /> : null}
            </View>
            <Text variant="caption" color="secondary">
              {isPro ? `${freezesRemaining()} of 2 freezes left this month · ${frozenDays.size} used on this habit` : 'Miss a day without losing your streak. 2 freezes every month.'}
            </Text>
          </View>
        </View>
        {offer ? <FreezeBanner habitId={habit.id} offer={offer} /> : null}
      </Card>
      <SectionHeader title="Activity" />
      <Card padding={16}>
        <Heatmap doneDays={doneDays} weeks={isPro ? 20 : 15} />
        {!isPro ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <ProBadge small />
            <Text variant="caption" color="secondary" onPress={() => router.push('/paywall')}>
              Unlock the extended history
            </Text>
          </View>
        ) : null}
      </Card>
      <View style={{ gap: 4, marginTop: 24 }}>
        <Button title={doneToday ? 'Undo today' : 'Check in today'} icon={doneToday ? 'arrow-undo' : 'checkmark'} variant={doneToday ? 'secondary' : 'primary'} onPress={() => toggleHabit(habit.id)} />
        <Button title="Delete habit" variant="ghost" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}
