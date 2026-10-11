import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { FreezeBanner } from '@/components/features/FreezeBanner';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useHabitsData, type HabitWithStats } from '@/hooks/useData';
import { config } from '@/lib/config';
import { useI18n } from '@/i18n';
import { dayInitial, lastNDays, todayKey } from '@/lib/date';
import { toggleHabit } from '@/services/actions';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

function WeekDots({ doneDays, frozenDays }: { doneDays: ReadonlySet<string>; frozenDays: ReadonlySet<string> }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {lastNDays(7).map((d) => (
        <View key={d} style={{ alignItems: 'center', gap: 4 }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: doneDays.has(d) ? t.accent : frozenDays.has(d) ? t.accentSoft : t.surfaceStrong }}>
            {doneDays.has(d) ? <Icon name="checkmark" size={13} color={t.onAccent} /> : frozenDays.has(d) ? <Icon name="snow" size={12} color={t.accent} /> : null}
          </View>
          <Text variant="micro" color={d === todayKey() ? 'accent' : 'tertiary'} style={{ fontSize: 9 }}>
            {dayInitial(d)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HabitCard({ item, index }: { item: HabitWithStats; index: number }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { habit, doneToday, streak, doneDays, frozenDays, offer } = item;
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} layout={LinearTransition.springify().damping(18)}>
      <Card onPress={() => router.push(`/habit/${habit.id}`)} padding={16} accessibilityLabel={tr('habits.streakLabel', { name: habit.name, streak: tr('habits.streak', { count: streak }) })}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={habit.icon} size={22} color={t.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text content variant="heading" numberOfLines={1}>
              {habit.name}
            </Text>
            <Text variant="caption" color={streak > 0 ? 'accent' : 'tertiary'} style={{ fontFamily: 'Inter_600SemiBold' }}>
              🔥 {tr('habits.streak', { count: streak })}{frozenDays.size ? ' · ❄️' : ''}
            </Text>
          </View>
          <PressableScale
            onPress={() => toggleHabit(habit.id)}
            feedback="medium"
            scaleTo={0.88}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: doneToday }}
            accessibilityLabel={tr('habits.checkIn', { name: habit.name })}
            style={{ width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: doneToday ? t.accent : 'transparent', borderWidth: 2, borderColor: doneToday ? t.accent : t.borderStrong, shadowColor: t.accent, shadowOpacity: doneToday ? 0.5 : 0, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
          >
            <Icon name="checkmark" size={26} color={doneToday ? t.onAccent : t.textTertiary} />
          </PressableScale>
        </View>
        <View style={{ marginTop: 16 }}>
          <WeekDots doneDays={doneDays} frozenDays={frozenDays} />
        </View>
        {offer ? <FreezeBanner habitId={habit.id} offer={offer} /> : null}
      </Card>
    </Animated.View>
  );
}

export default function Habits() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const data = useHabitsData();
  const isPro = useIsPro();
  const atLimit = !isPro && data.total >= config.freeHabitLimit;
  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={110}>
        <Header title={tr('tabs.habits')} subtitle={data.total ? tr('habits.subtitleDone', { done: data.doneToday, total: data.total }) : tr('habits.subtitleEmpty')} />
        {data.total > 0 ? (
          <Card accent padding={18} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
              <ProgressRing value={data.total ? data.doneToday / data.total : 0} size={72} stroke={8}>
                <Icon name="flame" size={26} color={t.accent} />
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <Text variant="heading">{data.doneToday === data.total ? tr('habits.allDone') : tr('habits.toGo', { count: data.total - data.doneToday })}</Text>
                <Text variant="caption" color="secondary">
                  {tr('habits.xpBest', { days: data.bestStreak })}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}
        <View style={{ gap: 12 }}>
          {data.items.map((item, i) => (
            <HabitCard key={item.habit.id} item={item} index={i} />
          ))}
        </View>
        {data.total === 0 ? <EmptyState icon="flame-outline" title={tr('habits.emptyTitle')} message={tr('habits.emptyBody')} actionLabel={tr('habits.new')} onAction={() => router.push('/habit/new')} satellites={['barbell', 'book', 'water']} hint={tr('habits.emptyHint')} /> : null}
        {atLimit ? (
          <PressableScale onPress={() => router.push('/paywall?reason=habits')} style={{ marginTop: 16 }} feedback="tap">
            <Text variant="caption" color="accent" align="center" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {tr('habits.limitBanner', { count: config.freeHabitLimit })}
            </Text>
          </PressableScale>
        ) : null}
      </Screen>
      <Fab onPress={() => router.push('/habit/new')} label={tr('habits.new')} />
    </View>
  );
}
