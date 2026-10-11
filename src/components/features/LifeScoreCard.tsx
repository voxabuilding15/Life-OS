import { router } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useLifeScore } from '@/hooks/useLife';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { Card } from '../ui/Card';
import { CountUp } from '../ui/CountUp';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { Sparkline } from '../ui/Sparkline';
import { Text } from '../ui/Text';

export function LifeScoreCard() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const ls = useLifeScore();
  const { width } = useWindowDimensions();
  const roomy = width >= 360; // the trend sparkline needs room, especially next to long French/Arabic labels
  const up = ls.delta >= 0;
  return (
    <Card onPress={() => router.push('/life-score')} padding={18} accessibilityLabel={tr('lifeScore.card', { score: ls.score, band: tr(`lifeScore.bands.${ls.band}`) })}>
      <View style={styles.row}>
        <ProgressRing value={ls.score / 100} size={92} stroke={9} duration={1100}>
          <CountUp value={ls.score} variant="title" style={{ fontSize: 28, lineHeight: 32, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 }} />
          <Text variant="micro" color="tertiary" style={{ fontSize: 9 }}>
            {tr('lifeScore.slash100')}
          </Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <Text variant="micro" color="accent">
            {tr('lifeScore.label')}
          </Text>
          <Text variant="heading">{tr(`lifeScore.bands.${ls.band}`)}</Text>
          <View style={styles.delta}>
            <Icon name={up ? 'trending-up' : 'trending-down'} size={14} color={up ? t.accent : t.textSecondary} />
            <Text variant="caption" color={up ? 'accent' : 'secondary'}>
              {tr('lifeScore.vsYesterday', { delta: `${up ? '+' : ''}${ls.delta}` })}
            </Text>
          </View>
        </View>
        {roomy ? <Sparkline values={ls.trend.map((d) => d.score)} width={84} height={44} /> : null}
      </View>
      {ls.weakest && ls.score < 100 ? (
        <View style={[styles.tip, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }]}>
          <Icon name="bulb" size={14} color={t.accent} />
          <Text variant="caption" color="secondary" style={{ flex: 1 }} numberOfLines={2}>
            {tr(`lifeScore.pillars.${ls.weakest.id}.tip`)}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 10, borderRadius: 12, borderWidth: 1 },
});
