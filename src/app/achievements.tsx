import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AchievementBadge } from '@/components/features/AchievementBadge';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useUnlockedKeys } from '@/hooks/useStats';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { useIsPro } from '@/store/subscription';
import { Button } from '@/components/ui/Button';

export default function Achievements() {
  const unlocked = useUnlockedKeys();
  const isPro = useIsPro();
  return (
    <Screen>
      <Header title="Achievements" subtitle={`${unlocked.size} of ${ACHIEVEMENTS.length} unlocked`} back />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {ACHIEVEMENTS.map((a, i) => (
          <Animated.View key={a.key} entering={FadeInDown.delay(Math.min(i, 12) * 40).duration(350)} style={{ width: '31.6%' }}>
            <AchievementBadge def={a} unlocked={unlocked.has(a.key)} locked={a.pro && !isPro} />
          </Animated.View>
        ))}
      </View>
      {!isPro ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text variant="body" color="secondary" align="center">
            Pro unlocks {ACHIEVEMENTS.filter((a) => a.pro).length} extra achievements.
          </Text>
          <Button title="Unlock with Pro" icon="sparkles" onPress={() => router.push('/paywall')} />
        </View>
      ) : null}
    </Screen>
  );
}
