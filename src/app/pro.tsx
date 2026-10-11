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
import { freezesRemaining } from '@/services/actions';
import { config } from '@/lib/config';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { THEMES } from '@/theme';
import { useEffect } from 'react';
import { haptic } from '@/lib/haptics';
import { useSettings } from '@/store/settings';
import { useSubscription } from '@/store/subscription';
import { useSync } from '@/store/sync';
import { useTheme } from '@/theme';

const PERKS = [
  { icon: 'snow', title: 'Streak Freeze', body: 'Save a streak after a missed day.', go: '/(tabs)/habits' },
  { icon: 'analytics', title: 'Advanced analytics', body: '30-day trends, mood and focus.', go: '/analytics' },
  { icon: 'document-text', title: 'Full weekly report', body: 'Insights, comparisons and sharing.', go: '/report' },
  { icon: 'trophy', title: 'Bonus challenge', body: 'A daily challenge worth double XP.', go: '/challenges' },
  { icon: 'ribbon', title: 'Extra achievements', body: `${ACHIEVEMENTS.filter((a) => a.pro).length} more badges to earn.`, go: '/achievements' },
  { icon: 'color-palette', title: 'Custom themes', body: 'Aurora and Ghost.', go: '/settings' },
] as const;

/** Pro hub: welcome moment after purchase, plus a launchpad for every Pro benefit. */
export default function Pro() {
  const t = useTheme();
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
        <Header title="Life OS Pro" back />
        <Card accent padding={22}>
          <View style={{ gap: 14, alignItems: 'center' }}>
            <Icon name="sparkles" size={34} color={t.accent} />
            <Text variant="heading" align="center">
              Unlock everything
            </Text>
            <Text variant="body" color="secondary" align="center">
              Streak Freeze, advanced analytics, cloud sync, themes and more for {config.proPriceLabel}/month.
            </Text>
            <Button title="See Pro" shimmer icon="sparkles" onPress={() => router.replace('/paywall')} />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Header title={welcome ? 'Welcome to Pro' : 'Life OS Pro'} back />
        <Animated.View entering={ZoomIn.springify().damping(14)} style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ position: 'absolute', top: -70 }} pointerEvents="none">
            <Glow size={320} intensity={0.5} />
          </View>
          <Floating distance={4}>
            <Logo size={88} />
          </Floating>
          <Text variant="title" style={{ marginTop: 14 }}>
            {welcome ? 'You’re in. Thank you.' : 'Pro is active'}
          </Text>
          <Text variant="body" color="secondary" align="center" style={{ marginTop: 4, maxWidth: 300 }}>
            {welcome ? 'Every Pro feature is unlocked. Here is where to find them.' : expiresAt ? `${isTrial ? 'Free trial ends' : willRenew ? 'Renews' : 'Ends'} ${new Date(expiresAt).toLocaleDateString()}` : 'Thanks for supporting Life OS.'}
          </Text>
        </Animated.View>

        <View style={{ gap: 10 }}>
          {PERKS.map((p, i) => (
            <Animated.View key={p.title} entering={FadeInDown.delay(120 + i * 60).duration(400)}>
              <Card onPress={() => router.push(p.go)} padding={14}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={p.icon} size={20} color={t.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{p.title}</Text>
                    <Text variant="caption" color="secondary">
                      {p.title === 'Streak Freeze' ? `${freezesRemaining()} of ${config.freezesPerMonth} left this month` : p.title === 'Custom themes' ? `Active: ${THEMES[themeId].name}` : p.body}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color={t.textTertiary} />
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        <SectionHeader title="Your plan" />
        <Card padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="cloud-done" size={20} color={t.accent} />
            <Text variant="caption" color="secondary" style={{ flex: 1 }}>
              {sync.lastSyncAt ? `Cloud sync active · last synced ${new Date(sync.lastSyncAt).toLocaleString()}` : 'Cloud sync is on'}
            </Text>
          </View>
        </Card>
        <View style={{ marginTop: 16 }}>
          <Button
            title="Manage subscription"
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
