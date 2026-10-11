import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
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
  /** Slow light sweep across a primary button (conversion CTAs). */
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
}

function Sweep({ width }: { width: number }) {
  const x = useSharedValue(-1);
  useEffect(() => {
    x.value = withRepeat(withDelay(1200, withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) })), -1);
  }, [x]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * width }, { skewX: '-20deg' }] }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: 80 }, anim]}>
      <LinearGradient colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export function Button({ title, onPress, variant = 'primary', size = 'lg', icon, loading, disabled, fullWidth = true, shimmer, style }: Props) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const height = size === 'lg' ? 56 : size === 'md' ? 48 : 38;
  const inactive = disabled || loading;
  const fg = variant === 'primary' ? t.onAccent : variant === 'secondary' ? t.text : t.accent;
  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.base,
        { height, opacity: disabled ? 0.45 : 1, alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        variant === 'primary' && { backgroundColor: t.accent, shadowColor: t.accent, ...styles.glow },
        variant === 'secondary' && { backgroundColor: t.surfaceStrong, borderWidth: 1, borderColor: t.border },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        style,
      ]}
    >
      {shimmer && !inactive && variant === 'primary' && width > 0 ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, overflow: 'hidden' }]}>
          <Sweep width={width} />
        </View>
      ) : null}
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
