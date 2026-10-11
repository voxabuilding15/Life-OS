import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChallengeRow } from '@/components/features/ChallengeRow';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Confetti } from '@/components/ui/Confetti';
import { Header, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useDailyChallenges } from '@/hooks/useLife';
import { useI18n } from '@/i18n';
import { XP } from '@/lib/gamification';
import { claimChallenge } from '@/services/actions';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';

export default function Challenges() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const d = useDailyChallenges();
  const isPro = useIsPro();
  const [burst, setBurst] = useState(0);
  const regular = d.views.filter((c) => !c.bonus);
  const bonus = d.views.find((c) => c.bonus);
  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Header title={tr('challenges.title')} subtitle={tr('challenges.resets')} back />
        <Card accent padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            <ProgressRing value={d.total ? d.claimedCount / d.total : 0} size={84} stroke={9}>
              <Text variant="title">
                {d.claimedCount}/{d.total}
              </Text>
            </ProgressRing>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="heading">{d.allClaimed ? tr('challenges.perfectDay') : tr('challenges.mission')}</Text>
              <Text variant="caption" color="secondary">
                {tr('challenges.allBonus', { xp: XP.challengeAll })}
              </Text>
            </View>
          </View>
        </Card>

        <SectionHeader title={tr('challenges.today')} />
        <Card padding={14}>
          {regular.map((c, i) => (
            <Animated.View key={c.id} entering={FadeInDown.delay(i * 80)}>
              <ChallengeRow
                challenge={c}
                onClaim={(x) => {
                  if (claimChallenge(d.day, x, d.claimedKeys, d.all, d.stats)) setBurst((b) => b + 1);
                }}
              />
            </Animated.View>
          ))}
        </Card>

        {bonus ? (
          <>
            <SectionHeader title={tr('challenges.proBonus')} />
            <Card padding={14} accent={isPro}>
              <ChallengeRow
                challenge={bonus}
                onLocked={() => router.push('/paywall?reason=challenges')}
                onClaim={(x) => {
                  if (claimChallenge(d.day, x, d.claimedKeys, d.all, d.stats)) setBurst((b) => b + 1);
                }}
              />
            </Card>
            {!isPro ? (
              <Text variant="caption" color="secondary" align="center" style={{ marginTop: 10 }}>
                {tr('challenges.proBonusHint')}
              </Text>
            ) : null}
          </>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, justifyContent: 'center' }}>
          <Icon name="information-circle-outline" size={14} color={t.textTertiary} />
          <Text variant="caption" color="tertiary">
            {tr('challenges.autoHint')}
          </Text>
        </View>
        <View style={{ marginTop: 20 }}>
          <Button title={tr('challenges.backToDashboard')} variant="secondary" onPress={() => router.replace('/(tabs)')} />
        </View>
      </Screen>
      <Confetti playKey={burst} />
    </View>
  );
}
