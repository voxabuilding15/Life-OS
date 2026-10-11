import { StyleSheet, View } from 'react-native';
import type { AchievementDef } from '@/lib/gamification';
import { radius, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { ProBadge } from '../ui/ProBadge';
import { Text } from '../ui/Text';

export function AchievementBadge({ def, unlocked, locked }: { def: AchievementDef; unlocked: boolean; locked?: boolean }) {
  const t = useTheme();
  return (
    <View
      accessibilityLabel={`${def.title}, ${unlocked ? 'unlocked' : 'locked'}. ${def.description}`}
      style={[styles.tile, { backgroundColor: unlocked ? t.accentSoft : t.surface, borderColor: unlocked ? t.accentBorder : t.border }]}
    >
      <View style={[styles.icon, { backgroundColor: unlocked ? t.accent : t.surfaceStrong }]}>
        <Icon name={unlocked ? def.icon : locked ? 'lock-closed' : def.icon} size={20} color={unlocked ? t.onAccent : t.textTertiary} />
      </View>
      <Text variant="caption" align="center" style={{ fontFamily: 'Inter_600SemiBold', opacity: unlocked ? 1 : 0.6 }} numberOfLines={2}>
        {def.title}
      </Text>
      {def.pro && !unlocked ? <ProBadge small /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.lg, borderWidth: 1, minHeight: 112, justifyContent: 'center' },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
