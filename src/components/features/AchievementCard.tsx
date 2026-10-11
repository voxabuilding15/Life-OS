import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { achievementProgress, type AchievementDef, type AchievementStats } from '@/lib/gamification';
import { useI18n } from '@/i18n';
import { radius, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { ProBadge } from '../ui/ProBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { Text } from '../ui/Text';

const ROMAN = ['', 'I', 'II', 'III', 'IV'];

export function AchievementCard({ def, stats, unlocked, isPro }: { def: AchievementDef; stats: AchievementStats; unlocked: boolean; isPro: boolean }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const locked = Boolean(def.pro) && !isPro && !unlocked;
  const ratio = unlocked ? 1 : achievementProgress(def, stats);
  const value = Math.min(def.value(stats), def.target);
  return (
    <PressableScale
      feedback="tap"
      scaleTo={0.99}
      onPress={locked ? () => router.push('/paywall?reason=achievements') : undefined}
      accessibilityLabel={tr('achievements.cardLabel', { title: tr(`achievements.items.${def.key}.title`), tier: ROMAN[def.tier], state: unlocked ? tr('achievements.stateUnlocked') : locked ? tr('achievements.stateLocked') : tr('achievements.stateProgress', { value, target: def.target }), description: tr(`achievements.items.${def.key}.description`) })}
      style={[styles.card, { backgroundColor: unlocked ? t.accentSoft : t.surface, borderColor: unlocked ? t.accentBorder : t.border }]}
    >
      <View style={[styles.icon, { backgroundColor: unlocked ? t.accent : t.surfaceStrong }]}>
        <Icon name={locked ? 'lock-closed' : def.icon} size={22} color={unlocked ? t.onAccent : t.textTertiary} />
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <View style={styles.titleRow}>
          <Text variant="bodyMedium" style={{ fontFamily: 'Inter_600SemiBold', flexShrink: 1 }} numberOfLines={1}>
            {tr(`achievements.items.${def.key}.title`)}
          </Text>
          <View style={[styles.tier, { borderColor: unlocked ? t.accent : t.border }]}>
            <Text variant="micro" color={unlocked ? 'accent' : 'tertiary'} style={{ fontSize: 9 }}>
              {ROMAN[def.tier]}
            </Text>
          </View>
          {def.pro && !unlocked ? <ProBadge small /> : null}
        </View>
        <Text variant="caption" color="secondary" numberOfLines={1}>
          {tr(`achievements.items.${def.key}.description`)}
        </Text>
        {unlocked ? (
          <Text variant="micro" color="accent" style={{ letterSpacing: 0.3 }}>
            {tr('achievements.unlocked', { xp: def.xp })}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ProgressBar value={locked ? 0 : ratio} height={5} />
            </View>
            <Text variant="micro" color="tertiary" style={{ letterSpacing: 0.2 }}>
              {locked ? tr('common.plusXp', { count: def.xp }) : `${value}/${def.target}`}
            </Text>
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg, borderWidth: 1 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tier: { minWidth: 22, height: 16, paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
