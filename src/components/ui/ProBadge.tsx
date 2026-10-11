import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export function ProBadge({ small }: { small?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: t.accentSoft, borderColor: t.accentBorder, paddingVertical: small ? 2 : 4 }]}>
      <Icon name="sparkles" size={small ? 10 : 12} color={t.accent} />
      <Text variant="micro" color="accent">
        PRO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({ badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1 } });
