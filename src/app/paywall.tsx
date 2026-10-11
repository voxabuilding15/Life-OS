import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/Header';
import { Glow } from '@/components/ui/Glow';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { Text } from '@/components/ui/Text';
import { config } from '@/lib/config';
import { loadOffer, purchasePro, purchasesAvailable, restorePurchases, type ProOffer } from '@/services/purchases';
import { toast } from '@/store/feedback';
import { useSubscription } from '@/store/subscription';
import { useTheme } from '@/theme';

const FEATURES = [
  { icon: 'infinite', title: 'Unlimited habits & goals', sub: `Free is limited to ${config.freeHabitLimit} of each` },
  { icon: 'analytics', title: 'Advanced analytics', sub: '30-day trends, mood and focus insights' },
  { icon: 'document-text', title: 'Advanced reports', sub: 'Weekly and monthly progress summaries' },
  { icon: 'color-palette', title: 'Custom themes', sub: 'Aurora and Ghost looks' },
  { icon: 'cloud-done', title: 'Cloud synchronization', sub: 'Your data on every device, always backed up' },
  { icon: 'apps', title: 'Premium widgets', sub: 'Weekly momentum on your dashboard' },
  { icon: 'ribbon', title: 'More achievements', sub: 'Four exclusive badges to earn' },
] as const;

const REASONS: Record<string, string> = {
  habits: `You've reached the free limit of ${config.freeHabitLimit} habits.`,
  goals: `You've reached the free limit of ${config.freeGoalLimit} active goals.`,
  themes: 'Custom themes are a Pro feature.',
  analytics: 'Advanced analytics are a Pro feature.',
  sync: 'Cloud sync is a Pro feature.',
};

export default function Paywall() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const isPro = useSubscription((s) => s.isPro);
  const [offer, setOffer] = useState<ProOffer>({ priceLabel: `${config.proPriceLabel}/month`, available: false });
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => {
    void loadOffer().then(setOffer);
  }, []);

  const buy = async () => {
    setBusy('buy');
    const r = await purchasePro();
    setBusy(null);
    if (r.ok) {
      toast('Welcome to Life OS Pro.');
      router.back();
    } else if (!r.cancelled) toast(r.error ?? 'Purchase failed.');
  };

  const restore = async () => {
    setBusy('restore');
    const r = await restorePurchases();
    setBusy(null);
    if (r.ok) {
      toast('Pro restored.');
      router.back();
    } else toast(r.error ?? 'Nothing to restore.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'flex-end' }}>
          <IconButton icon="close" label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>

        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <View style={styles.halo}>
            <Glow size={320} intensity={0.55} />
          </View>
          <Logo size={84} />
          <View style={[styles.proPill, { backgroundColor: t.accent }]}>
            <Text variant="micro" color="onAccent">
              PRO
            </Text>
          </View>
          <Text variant="display" align="center" style={{ marginTop: 18 }}>
            Life OS Pro
          </Text>
          <Text variant="body" color="secondary" align="center" style={{ maxWidth: 300 }}>
            {reason && REASONS[reason] ? REASONS[reason] : 'Your full personal operating system. No limits.'}
          </Text>
        </Animated.View>

        <View style={{ gap: 14, marginTop: 28 }}>
          {FEATURES.map((f, i) => (
            <Animated.View key={f.title} entering={FadeInDown.delay(120 + i * 60).duration(400)} style={styles.feature}>
              <View style={[styles.featIcon, { backgroundColor: t.accentSoft }]}>
                <Icon name={f.icon} size={20} color={t.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{f.title}</Text>
                <Text variant="caption" color="secondary">
                  {f.sub}
                </Text>
              </View>
              <Icon name="checkmark-circle" size={20} color={t.accent} />
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(600)} style={{ marginTop: 28 }}>
          <Card accent padding={18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text variant="micro" color="accent">
                  MONTHLY
                </Text>
                <Text variant="title">{offer.priceLabel}</Text>
                <Text variant="caption" color="secondary">
                  Cancel anytime in your store settings
                </Text>
              </View>
              <Icon name="checkmark-circle" size={28} color={t.accent} />
            </View>
          </Card>
        </Animated.View>

        <View style={{ marginTop: 18, gap: 4 }}>
          {isPro ? (
            <Button title="You're on Pro" icon="checkmark" variant="secondary" onPress={() => router.back()} />
          ) : (
            <Button title={purchasesAvailable ? `Continue · ${offer.priceLabel}` : 'Subscribe'} icon="sparkles" loading={busy === 'buy'} onPress={buy} />
          )}
          {__DEV__ && !purchasesAvailable && !isPro ? (
            <Button
              title="Activate Pro (development only)"
              variant="ghost"
              size="md"
              onPress={() => {
                useSubscription.getState().set({ isPro: true });
                router.back();
              }}
            />
          ) : null}
          <Button title="Restore purchases" variant="ghost" size="md" loading={busy === 'restore'} onPress={restore} />
          <Text variant="micro" color="tertiary" align="center" style={{ marginTop: 6, letterSpacing: 0.2, fontFamily: 'Inter_500Medium' }}>
            Payment is charged to your store account. The subscription renews automatically unless cancelled at least 24 hours before the period ends.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, marginTop: 4 },
  halo: { position: 'absolute', top: -118, width: 320, height: 320 },
  proPill: { position: 'absolute', top: 70, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  featIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
