import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { AchievementCard } from '@/components/features/AchievementCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAchievementStats, useUnlockedKeys } from '@/hooks/useStats';
import { useI18n } from '@/i18n';
import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENTS, type AchievementCategory } from '@/lib/gamification';
import { useIsPro } from '@/store/subscription';

export default function Achievements() {
  const { t: tr } = useI18n();
  const unlocked = useUnlockedKeys();
  const stats = useAchievementStats();
  const isPro = useIsPro();
  const [filter, setFilter] = useState<'All' | AchievementCategory>('All');

  const list = useMemo(
    () =>
      ACHIEVEMENTS.filter((a) => filter === 'All' || a.category === filter).sort(
        (a, b) => Number(unlocked.has(b.key)) - Number(unlocked.has(a.key)) || Number(!!a.pro) - Number(!!b.pro) || a.tier - b.tier,
      ),
    [filter, unlocked],
  );
  const count = ACHIEVEMENTS.filter((a) => unlocked.has(a.key)).length;
  const earnedXp = ACHIEVEMENTS.filter((a) => unlocked.has(a.key)).reduce((s, a) => s + a.xp, 0);

  return (
    <Screen>
      <Header title={tr('achievements.title')} subtitle={tr('achievements.unlockedCount', { count, total: ACHIEVEMENTS.length })} back />
      <Card accent padding={18}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing value={count / ACHIEVEMENTS.length} size={72} stroke={8}>
            <Text variant="bodyMedium" style={{ fontFamily: 'Inter_800ExtraBold' }}>
              {Math.round((count / ACHIEVEMENTS.length) * 100)}%
            </Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text variant="heading">{tr('achievements.xpEarned', { count: earnedXp })}</Text>
            <Text variant="caption" color="secondary">
              {tr('achievements.xpHint')}
            </Text>
          </View>
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 16 }} style={{ flexGrow: 0 }}>
        {(['All', ...ACHIEVEMENT_CATEGORIES] as const).map((c) => (
          <Chip key={c} label={tr(`achievements.categories.${c}`)} selected={filter === c} onPress={() => setFilter(c)} />
        ))}
      </ScrollView>

      <View style={{ gap: 10 }}>
        {list.map((a, i) => (
          <Animated.View key={a.key} entering={FadeInDown.delay(Math.min(i, 10) * 35).duration(350)} layout={LinearTransition}>
            <AchievementCard def={a} stats={stats} unlocked={unlocked.has(a.key)} isPro={isPro} />
          </Animated.View>
        ))}
      </View>
      {!isPro ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text variant="body" color="secondary" align="center">
            {tr('achievements.proUnlocks', { count: ACHIEVEMENTS.filter((a) => a.pro).length })}
          </Text>
          <Button title={tr('common.unlockWithPro')} icon="sparkles" shimmer onPress={() => router.push('/paywall?reason=achievements')} />
        </View>
      ) : null}
    </Screen>
  );
}
