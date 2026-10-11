import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useDailyChallenges } from '@/hooks/useLife';
import { useI18n } from '@/i18n';
import { claimChallenge } from '@/services/actions';
import { useTheme } from '@/theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';
import { ChallengeRow } from './ChallengeRow';

export function ChallengesCard() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const d = useDailyChallenges();
  const visible = d.views.filter((c) => !c.bonus);
  return (
    <Card padding={14}>
      <PressableScale feedback="tap" scaleTo={0.99} onPress={() => router.push('/challenges')} style={styles.head} accessibilityLabel={tr('challenges.openLabel')}>
        <View style={[styles.badge, { backgroundColor: t.accentSoft }]}>
          <Icon name="trophy" size={16} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading">{tr('challenges.title')}</Text>
          <Text variant="caption" color="secondary">
            {d.allClaimed ? tr('challenges.allDone') : d.ready ? tr('challenges.readyToClaim', { count: d.ready }) : tr('challenges.progressSummary', { done: d.claimedCount, total: d.total })}
          </Text>
        </View>
        <View style={styles.dots}>
          {Array.from({ length: d.total }, (_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i < d.claimedCount ? t.accent : t.surfaceStrong }]} />
          ))}
        </View>
        <Icon name="chevron-forward" size={18} color={t.textTertiary} />
      </PressableScale>
      {visible.map((c) => (
        <ChallengeRow key={c.id} challenge={c} compact onClaim={(x) => claimChallenge(d.day, x, d.claimedKeys, d.all, d.stats)} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingBottom: 6 },
  badge: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
