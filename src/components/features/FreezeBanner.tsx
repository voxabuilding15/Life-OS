import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { FreezeOffer } from '@/lib/freeze';
import { haptic } from '@/lib/haptics';
import { freezeHabit, freezesRemaining } from '@/services/actions';
import { toast } from '@/store/feedback';
import { useIsPro } from '@/store/subscription';
import { radius, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';

export function useFreezeAction() {
  return (habitId: string) => {
    const r = freezeHabit(habitId);
    if (r.ok) {
      haptic.success();
      toast('Streak Freeze used. Your streak is safe.');
    } else if (r.reason === 'pro') router.push('/paywall?reason=freeze');
    else if (r.reason === 'none-left') toast('No freezes left this month. They reset on the 1st.');
  };
}

/** "Your streak is about to break" prompt with a one-tap Streak Freeze (Pro). */
export function FreezeBanner({ habitId, offer }: { habitId: string; offer: FreezeOffer }) {
  const t = useTheme();
  const isPro = useIsPro();
  const freeze = useFreezeAction();
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.wrap, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }]}>
      <Icon name="snow" size={18} color={t.accent} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
          Save your {offer.savedStreak}-day streak
        </Text>
        <Text variant="micro" color="secondary" style={{ letterSpacing: 0.2, fontFamily: 'Inter_500Medium' }}>
          {isPro ? `${freezesRemaining()} freeze${freezesRemaining() === 1 ? '' : 's'} left this month` : 'Streak Freeze is a Pro feature'}
        </Text>
      </View>
      <PressableScale onPress={() => freeze(habitId)} feedback="medium" accessibilityLabel="Use Streak Freeze" style={[styles.btn, { backgroundColor: t.accent }]}>
        <Icon name={isPro ? 'snow' : 'lock-closed'} size={13} color={t.onAccent} />
        <Text variant="caption" color="onAccent" style={{ fontFamily: 'Inter_700Bold' }}>
          {isPro ? 'Freeze' : 'Pro'}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, marginTop: 14 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 12 },
});
