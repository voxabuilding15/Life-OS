import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useI18n } from '@/i18n';
import { perMonthLabel, periodLabel, periodShort, savingsPercent, trialLabel, type Plan, type PlanId } from '@/lib/plans';
import { radius, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';

interface Props {
  plans: Plan[] | null;
  selected: PlanId;
  onSelect: (id: PlanId) => void;
}

function PlanCard({ plan, selected, onSelect, savings }: { plan: Plan; selected: boolean; onSelect: () => void; savings: number }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const yearly = plan.id === 'yearly';
  const planName = tr(yearly ? 'plans.yearly' : 'plans.monthly');
  const baseLabel = plan.trialDays ? tr('paywall.planLabelTrial', { plan: planName, price: plan.priceString, period: periodLabel(plan.id), trial: trialLabel(plan.trialDays) }) : tr('paywall.planLabel', { plan: planName, price: plan.priceString, period: periodLabel(plan.id) });
  return (
    <PressableScale
      onPress={onSelect}
      feedback="tap"
      scaleTo={0.985}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={yearly && savings > 0 ? tr('paywall.planLabelSave', { label: baseLabel, percent: savings }) : baseLabel}
      style={[styles.card, { backgroundColor: selected ? t.accentSoft : t.surface, borderColor: selected ? t.accent : t.border, shadowColor: t.accent, shadowOpacity: selected ? 0.35 : 0 }]}
    >
      {yearly && savings > 0 ? (
        <View style={[styles.ribbon, { backgroundColor: t.accent }]}>
          <Text variant="micro" color="onAccent" style={{ fontSize: 10 }}>
            {tr('paywall.bestValue', { percent: savings })}
          </Text>
        </View>
      ) : null}
      <View style={[styles.radio, { borderColor: selected ? t.accent : t.borderStrong, backgroundColor: selected ? t.accent : 'transparent' }]}>
        {selected ? (
          <Animated.View entering={FadeIn.duration(150)}>
            <Icon name="checkmark" size={14} color={t.onAccent} />
          </Animated.View>
        ) : null}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text variant="heading">{planName}</Text>
        {plan.trialDays ? (
          <View style={styles.trial}>
            <Icon name="gift" size={12} color={t.accent} />
            <Text variant="caption" color="accent" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {trialLabel(plan.trialDays)}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color="secondary">
            {tr('paywall.flexible')}
          </Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="heading">
          {plan.priceString}
          <Text variant="caption" color="secondary">
            /{periodShort(plan.id)}
          </Text>
        </Text>
        {yearly ? (
          <Text variant="caption" color="secondary">
            {tr('paywall.perMonth', { price: perMonthLabel(plan) })}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

export function PlanSelector({ plans, selected, onSelect }: Props) {
  if (!plans) {
    return (
      <View style={{ gap: 12 }}>
        <Skeleton height={84} style={{ borderRadius: radius.lg }} />
        <Skeleton height={84} style={{ borderRadius: radius.lg }} />
      </View>
    );
  }
  const monthly = plans.find((p) => p.id === 'monthly');
  const yearly = plans.find((p) => p.id === 'yearly');
  const savings = monthly && yearly ? savingsPercent(monthly, yearly) : 0;
  return (
    <View style={{ gap: 12 }} accessibilityRole="radiogroup">
      {[yearly, monthly].filter(Boolean).map((p) => (
        <PlanCard key={p!.id} plan={p!} selected={selected === p!.id} onSelect={() => onSelect(p!.id)} savings={savings} />
      ))}
    </View>
  );
}

/** Today -> reminder -> billed. Makes the trial feel safe. */
export function TrialTimeline({ days }: { days: number }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const steps = [
    { icon: 'lock-open', title: tr('paywall.timeline.today'), body: tr('paywall.timeline.todayBody') },
    { icon: 'notifications', title: tr('paywall.timeline.day', { day: days - 2 }), body: tr('paywall.timeline.reminderBody') },
    { icon: 'card', title: tr('paywall.timeline.day', { day: days }), body: tr('paywall.timeline.billedBody') },
  ];
  return (
    <View style={[styles.timeline, { backgroundColor: t.surface, borderColor: t.border }]}>
      {steps.map((s, i) => (
        <View key={s.title} style={styles.step}>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.stepIcon, { backgroundColor: i === 0 ? t.accent : t.accentSoft }]}>
              <Icon name={s.icon} size={14} color={i === 0 ? t.onAccent : t.accent} />
            </View>
            {i < steps.length - 1 ? <View style={[styles.line, { backgroundColor: t.accentBorder }]} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? 10 : 0 }}>
            <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {s.title}
            </Text>
            <Text variant="caption" color="secondary">
              {s.body}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, paddingTop: 18, borderRadius: radius.lg, borderWidth: 1.5, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  ribbon: { position: 'absolute', top: -10, end: 14, paddingHorizontal: 10, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trial: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeline: { borderRadius: radius.lg, borderWidth: 1, padding: 14 },
  step: { flexDirection: 'row', gap: 12 },
  stepIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  line: { width: 2, flex: 1, marginVertical: 3, minHeight: 14 },
});
