import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface Props {
  icon: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  const t = useTheme();
  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.wrap}>
      <View style={[styles.halo, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }]}>
        <View style={[styles.core, { backgroundColor: t.accentSoft }]}>
          <Icon name={icon} size={30} color={t.accent} />
        </View>
      </View>
      <Text variant="heading" align="center">
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center" style={styles.msg}>
        {message}
      </Text>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} fullWidth={false} size="md" icon="add" /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 10 },
  halo: { width: 96, height: 96, borderRadius: 48, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  core: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  msg: { maxWidth: 280, marginBottom: 12 },
});
