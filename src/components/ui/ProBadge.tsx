import { StyleSheet, View } from 'react-native';
import { useI18n } from '@/i18n';
import { radius, useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export function ProBadge({ small }: { small?: boolean }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <View style={[styles.badge, { backgroundColor: t.accentSoft, borderColor: t.accentBorder, paddingVertical: small ? 2 : 4 }]}>
      <Icon name="sparkles" size={small ? 10 : 12} color={t.accent} />
      <Text variant="micro" color="accent">
        {tr('common.pro')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1 } });
