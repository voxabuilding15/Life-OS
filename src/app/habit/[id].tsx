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
import { useI18n } from '@/i18n';
import { deleteHabit, freezesRemaining, toggleHabit } from '@/services/actions';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

export default function HabitDetail() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPro = useIsPro();
  const { items } = useHabitsData();
  const item = useMemo(() => items.find((i) => i.habit.id === id), [items, id]);

  if (!item) {
    return (
      <Screen>
        <Header title={tr('habits.detail')} back />
        <EmptyState icon="alert-circle-outline" title={tr('habits.notFound')} message={tr('habits.deleted')} />
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
    Alert.alert(tr('habits.deleteTitle'), tr('habits.deleteBody'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('common.delete'), style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen>
      <Header title={habit.name} contentTitle subtitle={tr('habits.detail')} back />
      <Card accent padding={22}>
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Icon name={habit.icon} size={30} color={t.accent} />
          <Text style={{ fontSize: 56, lineHeight: 62, fontFamily: 'Inter_800ExtraBold', letterSpacing: -2 }}>{streak}</Text>
          <Text variant="bodyMedium" color="secondary">
            🔥 {tr('habits.streak', { count: streak })}
          </Text>
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <StatTile icon="trophy" value={best} label={tr('habits.bestStreak')} />
        <StatTile icon="calendar" value={doneDays.size} label={tr('habits.checkins')} />
        <StatTile icon="pulse" value={`${Math.round(rate30 * 100)}%`} label={tr('habits.days30')} />
      </View>
      <SectionHeader title={tr('freeze.title')} />
      <Card padding={16} accent={Boolean(offer)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="snow" size={20} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="bodyMedium">{tr('freeze.protect')}</Text>
              {!isPro ? <ProBadge small /> : null}
            </View>
            <Text variant="caption" color="secondary">
              {isPro ? tr('freeze.proStatus', { left: freezesRemaining(), total: 2, used: frozenDays.size }) : tr('freeze.proPitch')}
            </Text>
          </View>
        </View>
        {offer ? <FreezeBanner habitId={habit.id} offer={offer} /> : null}
      </Card>
      <SectionHeader title={tr('habits.activity')} />
      <Card padding={16}>
        <Heatmap doneDays={doneDays} weeks={isPro ? 20 : 15} />
        {!isPro ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <ProBadge small />
            <Text variant="caption" color="secondary" onPress={() => router.push('/paywall')}>
              {tr('habits.extendedHistory')}
            </Text>
          </View>
        ) : null}
      </Card>
      <View style={{ gap: 4, marginTop: 24 }}>
        <Button title={doneToday ? tr('habits.undoToday') : tr('habits.checkInToday')} icon={doneToday ? 'arrow-undo' : 'checkmark'} variant={doneToday ? 'secondary' : 'primary'} onPress={() => toggleHabit(habit.id)} />
        <Button title={tr('habits.delete')} variant="ghost" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}
