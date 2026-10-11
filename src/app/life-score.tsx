import { router } from 'expo-router';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { BarChart } from '@/components/ui/BarChart';
import { CountUp } from '@/components/ui/CountUp';
import { Floating } from '@/components/ui/Floating';
import { Glow } from '@/components/ui/Glow';
import { Header, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useLifeScore } from '@/hooks/useLife';
import { useI18n } from '@/i18n';
import { shortDay, todayKey } from '@/lib/date';
import { useTheme } from '@/theme';

const ICONS = { habits: 'flame', tasks: 'checkmark-done', focus: 'timer', goals: 'flag', reflection: 'book' } as const;

export default function LifeScore() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const ls = useLifeScore();
  const up = ls.delta >= 0;
  return (
    <Screen>
      <Header title={tr('lifeScore.title')} subtitle={tr('lifeScore.subtitle')} back />

      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <View style={{ position: 'absolute', top: -60 }} pointerEvents="none">
          <Glow size={360} intensity={0.45} />
        </View>
        <Floating distance={3} duration={3000}>
          <ProgressRing value={ls.score / 100} size={220} stroke={16} duration={1400}>
            <CountUp value={ls.score} duration={1200} style={{ fontSize: 64, lineHeight: 70, fontFamily: 'Inter_800ExtraBold', letterSpacing: -3 }} />
            <Text variant="caption" color="secondary">
              {tr('lifeScore.outOf')}
            </Text>
          </ProgressRing>
        </Floating>
        <Animated.View entering={FadeInDown.delay(300)} style={{ alignItems: 'center', gap: 6, marginTop: 18 }}>
          <Text variant="title">{tr(`lifeScore.bands.${ls.band}`)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={up ? 'trending-up' : 'trending-down'} size={16} color={up ? t.accent : t.textSecondary} />
            <Text variant="bodyMedium" color={up ? 'accent' : 'secondary'}>
              {tr('lifeScore.vsYesterday', { delta: `${up ? '+' : ''}${ls.delta}` })}
            </Text>
          </View>
        </Animated.View>
      </View>

      <SectionHeader title={tr('lifeScore.whatShapes')} />
      <View style={{ gap: 10 }}>
        {ls.pillars.map((p, i) => (
          <Animated.View key={p.id} entering={FadeInDown.delay(80 * i).duration(400)}>
            <Card padding={16}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ICONS[p.id]} size={18} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{tr(`lifeScore.pillars.${p.id}.label`)}</Text>
                  <Text variant="caption" color="secondary">
                    {p.applicable ? tr(`lifeScore.pillars.${p.id}.detail`, p.values) : tr(`lifeScore.pillars.${p.id}.empty`)}
                  </Text>
                </View>
                <Text variant="caption" color={p.applicable ? 'accent' : 'tertiary'} style={{ fontFamily: 'Inter_700Bold' }}>
                  {p.applicable ? `${Math.round(p.ratio * 100)}%` : '—'}
                </Text>
              </View>
              <ProgressBar value={p.applicable ? p.ratio : 0} height={6} />
              <Text variant="micro" color="tertiary" style={{ marginTop: 8, letterSpacing: 0.3 }}>
                {tr('lifeScore.worth', { count: p.weight })}
              </Text>
            </Card>
          </Animated.View>
        ))}
      </View>

      {ls.weakest && ls.score < 100 ? (
        <>
          <SectionHeader title={tr('lifeScore.nextMove')} />
          <Card accent padding={16} onPress={() => router.push(ls.weakest!.id === 'focus' ? '/focus' : ls.weakest!.id === 'habits' ? '/(tabs)/habits' : ls.weakest!.id === 'goals' ? '/(tabs)/goals' : ls.weakest!.id === 'reflection' ? '/(tabs)/notes' : '/(tabs)/tasks')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="bulb" size={22} color={t.accent} />
              <Text variant="body" color="secondary" style={{ flex: 1 }}>
                {tr(`lifeScore.pillars.${ls.weakest.id}.tip`)}
              </Text>
              <Icon name="arrow-forward" size={18} color={t.accent} />
            </View>
          </Card>
        </>
      ) : null}

      <SectionHeader title={tr('lifeScore.last7')} />
      <Card padding={18}>
        <BarChart height={110} showValues data={ls.trend.map((d) => ({ label: shortDay(d.day).charAt(0), value: d.score, highlight: d.day === todayKey() }))} />
      </Card>
      <Text variant="caption" color="tertiary" align="center" style={{ marginTop: 18, marginBottom: 8 }}>
        {tr('lifeScore.footer')}
      </Text>
    </Screen>
  );
}
