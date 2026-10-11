import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Confetti } from '@/components/ui/Confetti';
import { Floating } from '@/components/ui/Floating';
import { Glow } from '@/components/ui/Glow';
import { Header, SectionHeader } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { dateOnly, dateTime } from '@/i18n/format';
import { freezesRemaining } from '@/services/actions';
import { config } from '@/lib/config';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { useEffect } from 'react';
import { haptic } from '@/lib/haptics';
import { useSettings } from '@/store/settings';
import { useSubscription } from '@/store/subscription';
import { useSync } from '@/store/sync';
import { useTheme } from '@/theme';

const PERKS = [
  { key: 'freeze', icon: 'snow', go: '/(tabs)/habits' },
  { key: 'analytics', icon: 'analytics', go: '/analytics' },
  { key: 'report', icon: 'document-text', go: '/report' },
  { key: 'bonus', icon: 'trophy', go: '/challenges' },
  { key: 'achievements', icon: 'ribbon', go: '/achievements' },
  { key: 'themes', icon: 'color-palette', go: '/settings' },
] as const;

/** Pro hub: welcome moment after purchase, plus a launchpad for every Pro benefit. */
export default function Pro() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const { isPro, expiresAt, isTrial, willRenew } = useSubscription();
  const sync = useSync();
  const themeId = useSettings((s) => s.themeId);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (welcome && isPro) {
      haptic.success();
      setBurst(1);
    }
  }, [welcome, isPro]);

  if (!isPro) {
    return (
      <Screen>
        <Header title={tr('pro.title')} back />
        <Card accent padding={22}>
          <View style={{ gap: 14, alignItems: 'center' }}>
            <Icon name="sparkles" size={34} color={t.accent} />
            <Text variant="heading" align="center">
              {tr('pro.unlockAll')}
            </Text>
            <Text variant="body" color="secondary" align="center">
              {tr('pro.pitch', { price: config.proPriceLabel })}
            </Text>
            <Button title={tr('pro.seePro')} shimmer icon="sparkles" onPress={() => router.replace('/paywall')} />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Header title={welcome ? tr('pro.welcome') : tr('pro.title')} back />
        <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ position: 'absolute', top: -70 }} pointerEvents="none">
            <Glow size={320} intensity={0.5} />
          </View>
          <Floating distance={4}>
            <Logo size={88} />
          </Floating>
          <Text variant="title" style={{ marginTop: 14 }}>
            {welcome ? tr('pro.inTitle') : tr('pro.activeTitle')}
          </Text>
          <Text variant="body" color="secondary" align="center" style={{ marginTop: 4, maxWidth: 300 }}>
            {welcome ? tr('pro.welcomeBody') : expiresAt ? tr(isTrial ? 'pro.trialEnds' : willRenew ? 'pro.renews' : 'pro.ends', { date: dateOnly(new Date(expiresAt)) }) : tr('pro.thanks')}
          </Text>
        </Animated.View>

        <View style={{ gap: 10 }}>
          {PERKS.map((p, i) => (
            <Animated.View key={p.key} entering={FadeInDown.delay(120 + i * 60).duration(400)}>
              <Card onPress={() => router.push(p.go)} padding={14}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={p.icon} size={20} color={t.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{tr(`pro.perkTitles.${p.key}`)}</Text>
                    <Text variant="caption" color="secondary">
                      {p.key === 'freeze' ? tr('pro.freezeLeft', { left: freezesRemaining(), total: config.freezesPerMonth }) : p.key === 'themes' ? tr('pro.themeActive', { name: tr(`themes.${themeId}.name`) }) : p.key === 'achievements' ? tr('pro.perks.achievements', { count: ACHIEVEMENTS.filter((a) => a.pro).length }) : tr(`pro.perks.${p.key}`)}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color={t.textTertiary} />
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        <SectionHeader title={tr('pro.yourPlan')} />
        <Card padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="cloud-done" size={20} color={t.accent} />
            <Text variant="caption" color="secondary" style={{ flex: 1 }}>
              {sync.lastSyncAt ? tr('pro.syncActive', { date: dateTime(new Date(sync.lastSyncAt)) }) : tr('pro.syncOn')}
            </Text>
          </View>
        </Card>
        <View style={{ marginTop: 16 }}>
          <Button
            title={tr('pro.manage')}
            variant="secondary"
            icon="open-outline"
            onPress={() => void Linking.openURL(`https://play.google.com/store/account/subscriptions?sku=${config.proProductId}&package=${config.androidPackage}`)}
          />
        </View>
      </Screen>
      <Confetti playKey={burst} />
    </View>
  );
}
