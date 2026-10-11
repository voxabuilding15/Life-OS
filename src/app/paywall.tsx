import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BenefitPager } from '@/components/features/BenefitPager';
import { PlanComparison } from '@/components/features/PlanComparison';
import { AmbientBackground } from '@/components/ui/AmbientBackground';
import { Button } from '@/components/ui/Button';
import { Floating } from '@/components/ui/Floating';
import { Glow } from '@/components/ui/Glow';
import { IconButton } from '@/components/ui/Header';
import { Logo } from '@/components/ui/Logo';
import { Text } from '@/components/ui/Text';
import { config } from '@/lib/config';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { billingLine, ctaLabel, type Plan, type PlanId } from '@/lib/plans';
import { loadOffers, purchasePro, purchasesAvailable, restorePurchases } from '@/services/purchases';
import { PlanSelector, TrialTimeline } from '@/components/features/PlanSelector';
import { toast } from '@/store/feedback';
import { useSubscription } from '@/store/subscription';
import { useTheme } from '@/theme';

const PRO_ACH = ACHIEVEMENTS.filter((a) => a.pro).length;

const REASONS: Record<string, { title: string; body: string }> = {
  habits: { title: 'Build without limits', body: `You've reached the free limit of ${config.freeHabitLimit} habits. Pro removes it.` },
  goals: { title: 'Dream bigger', body: `You've reached the free limit of ${config.freeGoalLimit} active goals. Pro removes it.` },
  themes: { title: 'Make it yours', body: 'Aurora and Ghost themes are part of Pro.' },
  analytics: { title: 'Know your patterns', body: 'Advanced analytics are part of Pro.' },
  report: { title: 'Your week, decoded', body: 'The full weekly report is part of Pro.' },
  sync: { title: 'Your life, on every device', body: 'Cloud sync and backup are part of Pro.' },
  freeze: { title: 'Protect your streak', body: 'Streak Freeze keeps a streak alive when life gets in the way.' },
  challenges: { title: 'Earn double XP', body: 'Pro adds a daily bonus challenge worth double XP.' },
  achievements: { title: 'Unlock every badge', body: `Pro adds ${PRO_ACH} extra achievements and the biggest XP bonuses.` },
};

export default function Paywall() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const isPro = useSubscription((s) => s.isPro);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const copy = reason ? REASONS[reason] : undefined;

  useEffect(() => {
    void loadOffers().then((o) => {
      setPlans(o.plans);
      if (!o.plans.some((p) => p.id === 'yearly')) setSelected('monthly');
    });
  }, []);

  const plan = plans?.find((p) => p.id === selected) ?? plans?.[0] ?? null;

  const buy = async () => {
    setBusy('buy');
    const r = await purchasePro(selected);
    setBusy(null);
    if (r.ok) router.replace('/pro?welcome=1');
    else if (!r.cancelled) toast(r.error ?? 'Purchase failed.');
  };

  const restore = async () => {
    setBusy('restore');
    const r = await restorePurchases();
    setBusy(null);
    if (r.ok) router.replace('/pro?welcome=1');
    else toast(r.error ?? 'Nothing to restore.');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AmbientBackground />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 250, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'flex-end' }}>
          <IconButton icon="close" label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>

        <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
          <View style={styles.halo} pointerEvents="none">
            <Glow size={340} intensity={0.55} />
          </View>
          <Floating distance={5} duration={2600}>
            <Logo size={64} />
          </Floating>
          <View style={[styles.proPill, { backgroundColor: t.accent }]}>
            <Text variant="micro" color="onAccent">
              PRO
            </Text>
          </View>
          <Text variant="display" align="center" style={{ marginTop: 12 }}>
            {copy?.title ?? 'Life OS Pro'}
          </Text>
          <Text variant="body" color="secondary" align="center" style={{ maxWidth: 310 }}>
            {copy?.body ?? 'Your full personal operating system. No limits.'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={{ marginTop: 24, gap: 14 }}>
          <Text variant="heading">Choose your plan</Text>
          <PlanSelector plans={plans} selected={selected} onSelect={setSelected} />
          {plan?.trialDays ? <TrialTimeline days={plan.trialDays} /> : null}
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ marginTop: 36 }}>
          <BenefitPager />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500)} style={{ marginTop: 32, gap: 12 }}>
          <Text variant="heading">Free vs Pro</Text>
          <PlanComparison />
        </Animated.View>

      </ScrollView>

      {/* Sticky conversion bar */}
      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={[styles.bar, { paddingBottom: insets.bottom + 12, backgroundColor: t.background, borderTopColor: t.border }]}>
        {isPro ? (
          <Button title="You're on Pro" icon="checkmark" variant="secondary" onPress={() => router.replace('/pro')} />
        ) : (
          <Button title={plan ? ctaLabel(plan) : 'Continue'} icon="sparkles" shimmer disabled={!plan} loading={busy === 'buy'} onPress={buy} />
        )}
        {__DEV__ && !purchasesAvailable && !isPro ? (
          <Button
            title="Activate Pro (development only)"
            variant="ghost"
            size="sm"
            onPress={() => {
              useSubscription.getState().set({ isPro: true });
              router.replace('/pro?welcome=1');
            }}
          />
        ) : null}
        {plan && !isPro ? (
          <Text variant="micro" color="secondary" align="center" style={{ letterSpacing: 0.1, fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 15 }} accessibilityLiveRegion="polite">
            {billingLine(plan)}
          </Text>
        ) : null}
        <View style={styles.links}>
          <Text variant="micro" color="tertiary" onPress={restore} style={styles.link} accessibilityRole="link">
            {busy === 'restore' ? 'Restoring…' : 'Restore'}
          </Text>
          <Text variant="micro" color="tertiary" onPress={() => void Linking.openURL(config.termsUrl)} style={styles.link} accessibilityRole="link">
            Terms
          </Text>
          <Text variant="micro" color="tertiary" onPress={() => void Linking.openURL(config.privacyUrl)} style={styles.link} accessibilityRole="link">
            Privacy
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 8, marginTop: 4 },
  halo: { position: 'absolute', top: -138, width: 340, height: 340 },
  proPill: { position: 'absolute', top: 50, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 20, gap: 4, borderTopWidth: StyleSheet.hairlineWidth },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 2 },
  link: { paddingVertical: 8, textDecorationLine: 'underline', letterSpacing: 0.3 },
});
