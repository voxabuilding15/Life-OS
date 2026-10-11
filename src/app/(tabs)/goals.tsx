import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GoalCard } from '@/components/features/GoalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { Header, SectionHeader } from '@/components/ui/Header';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useGoalsData } from '@/hooks/useData';
import { config } from '@/lib/config';
import { useIsPro } from '@/store/subscription';

export default function Goals() {
  const { active, completed, all } = useGoalsData();
  const isPro = useIsPro();
  const atLimit = !isPro && active.length >= config.freeGoalLimit;
  return (
    <View style={{ flex: 1 }}>
      <Screen bottomInset={110}>
        <Header title="Goals" subtitle={all.length ? `${active.length} in progress · ${completed.length} achieved` : 'Think big. Break it down.'} />
        <View style={{ gap: 12 }}>
          {active.map((g, i) => (
            <Animated.View key={g.goal.id} entering={FadeInDown.delay(i * 70).duration(400)}>
              <GoalCard item={g} />
            </Animated.View>
          ))}
        </View>
        {active.length === 0 && completed.length === 0 ? <EmptyState icon="flag-outline" title="Set your first big goal" message="Break it into milestones and watch the progress add up." actionLabel="New goal" onAction={() => router.push('/goal/new')} /> : null}
        {completed.length > 0 ? (
          <>
            <SectionHeader title="Achieved" />
            <View style={{ gap: 12 }}>
              {completed.map((g) => (
                <GoalCard key={g.goal.id} item={g} />
              ))}
            </View>
          </>
        ) : null}
        {atLimit ? (
          <PressableScale onPress={() => router.push('/paywall?reason=goals')} style={{ marginTop: 16 }} feedback="tap">
            <Text variant="caption" color="accent" align="center" style={{ fontFamily: 'Inter_600SemiBold' }}>
              Free plan: {config.freeGoalLimit} active goals · Go Pro for unlimited
            </Text>
          </PressableScale>
        ) : null}
      </Screen>
      <Fab onPress={() => router.push('/goal/new')} label="New goal" />
    </View>
  );
}
