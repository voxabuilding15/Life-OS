import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { radius, useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg' | 'sm';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', size = 'lg', icon, loading, disabled, fullWidth = true, style }: Props) {
  const t = useTheme();
  const height = size === 'lg' ? 56 : size === 'md' ? 48 : 38;
  const inactive = disabled || loading;
  const fg = variant === 'primary' ? t.onAccent : variant === 'secondary' ? t.text : t.accent;
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        { height, opacity: disabled ? 0.45 : 1, alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        variant === 'primary' && { backgroundColor: t.accent, shadowColor: t.accent, ...styles.glow },
        variant === 'secondary' && { backgroundColor: t.surfaceStrong, borderWidth: 1, borderColor: t.border },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} size={size === 'sm' ? 16 : 20} color={fg} /> : null}
          <Text variant={size === 'sm' ? 'caption' : 'bodyMedium'} style={{ color: fg, fontFamily: 'Inter_600SemiBold' }}>
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glow: { shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
