import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { ChallengeView } from '@/hooks/useLife';
import { haptic } from '@/lib/haptics';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { ProBadge } from '../ui/ProBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { Text } from '../ui/Text';

interface Props {
  challenge: ChallengeView;
  onClaim: (c: ChallengeView) => void;
  onLocked?: () => void;
  compact?: boolean;
}

export function ChallengeRow({ challenge: c, onClaim, onLocked, compact }: Props) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const title = tr(`challenges.items.${c.id}.title`);
  const description = tr(`challenges.items.${c.id}.description`);
  const ready = c.done && !c.claimed && !c.locked;
  return (
    <PressableScale
      feedback="none"
      scaleTo={0.99}
      onPress={() => (c.locked ? onLocked?.() : ready ? (haptic.success(), onClaim(c)) : undefined)}
      accessibilityLabel={tr('challenges.rowLabel', { title, description, state: c.claimed ? tr('challenges.claimed') : tr('achievements.stateProgress', { value: c.current, target: c.target }) })}
      style={[styles.row, { opacity: c.claimed ? 0.6 : 1, paddingVertical: compact ? 8 : 12 }]}
    >
      <View style={[styles.icon, { backgroundColor: c.claimed || ready ? t.accent : t.accentSoft }]}>
        <Icon name={c.locked ? 'lock-closed' : c.claimed ? 'checkmark' : c.icon} size={18} color={c.claimed || ready ? t.onAccent : t.accent} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.titleRow}>
          <Text variant="bodyMedium" numberOfLines={1} style={{ flexShrink: 1, textDecorationLine: c.claimed ? 'line-through' : 'none' }}>
            {title}
          </Text>
          {c.bonus ? <ProBadge small /> : null}
        </View>
        {compact ? null : (
          <Text variant="caption" color="secondary">
            {description}
          </Text>
        )}
        {!c.claimed && !c.locked ? <ProgressBar value={c.current / c.target} height={5} /> : null}
      </View>
      {ready ? (
        <Animated.View entering={FadeIn} style={[styles.claim, { backgroundColor: t.accent, shadowColor: t.accent }]}>
          <Text variant="caption" color="onAccent" style={{ fontFamily: 'Inter_700Bold' }}>
            {tr('challenges.claim', { xp: c.xp })}
          </Text>
        </Animated.View>
      ) : (
        <View style={[styles.xp, { backgroundColor: t.surfaceStrong }]}>
          <Text variant="micro" color={c.claimed ? 'tertiary' : 'accent'}>
            {tr('common.plusXp', { count: c.xp })}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  claim: { paddingHorizontal: 12, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  xp: { paddingHorizontal: 9, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
