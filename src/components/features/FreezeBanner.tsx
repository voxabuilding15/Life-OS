import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { FreezeOffer } from '@/lib/freeze';
import { haptic } from '@/lib/haptics';
import { t } from '@/i18n';
import { useI18n } from '@/i18n';
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
      toast(t('freeze.used'));
    } else if (r.reason === 'pro') router.push('/paywall?reason=freeze');
    else if (r.reason === 'none-left') toast(t('freeze.noneLeft'));
  };
}

/** "Your streak is about to break" prompt with a one-tap Streak Freeze (Pro). */
export function FreezeBanner({ habitId, offer }: { habitId: string; offer: FreezeOffer }) {
  const th = useTheme();
  const { t: tr } = useI18n();
  const isPro = useIsPro();
  const freeze = useFreezeAction();
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.wrap, { backgroundColor: th.accentSoft, borderColor: th.accentBorder }]}>
      <Icon name="snow" size={18} color={th.accent} />
      <View style={{ flex: 1 }}>
        <Text variant="caption" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {tr('freeze.save', { count: offer.savedStreak })}
        </Text>
        <Text variant="micro" color="secondary" style={{ letterSpacing: 0.2, fontFamily: 'Inter_500Medium' }}>
          {isPro ? tr('freeze.left', { count: freezesRemaining() }) : tr('freeze.proFeature')}
        </Text>
      </View>
      <PressableScale onPress={() => freeze(habitId)} feedback="medium" accessibilityLabel={tr('freeze.use')} style={[styles.btn, { backgroundColor: th.accent }]}>
        <Icon name={isPro ? 'snow' : 'lock-closed'} size={13} color={th.onAccent} />
        <Text variant="caption" color="onAccent" style={{ fontFamily: 'Inter_700Bold' }}>
          {isPro ? tr('freeze.freeze') : tr('common.pro')}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, marginTop: 14 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 12 },
});
