import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export function IconButton({ icon, onPress, label, size = 42, active }: { icon: IconName; onPress: () => void; label: string; size?: number; active?: boolean }) {
  const t = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      feedback="tap"
      style={[styles.iconBtn, { width: size, height: size, backgroundColor: active ? t.accentSoft : t.surface, borderColor: active ? t.accentBorder : t.border }]}
    >
      <Icon name={icon} size={20} color={active ? t.accent : t.text} />
    </PressableScale>
  );
}

interface Props {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

export function Header({ title, subtitle, back, right }: Props) {
  return (
    <View style={styles.row}>
      {back ? <IconButton icon="chevron-back" label="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} /> : null}
      <View style={styles.titles}>
        {subtitle ? (
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        ) : null}
        <Text variant="title" accessibilityRole="header" numberOfLines={2}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <Text variant="heading">{title}</Text>
      {action ? (
        <PressableScale onPress={onAction} feedback="tap" hitSlop={10}>
          <Text variant="caption" color="accent" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {action}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, minHeight: 48 },
  titles: { flex: 1 },
  iconBtn: { borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 },
});
