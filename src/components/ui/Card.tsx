import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { alpha, BASE, radius, useTheme } from '@/theme';
import { PressableScale } from './PressableScale';

interface Props {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Highlights the card with the accent (hero cards). */
  accent?: boolean;
  padding?: number;
  accessibilityLabel?: string;
}

/** Glass card: translucent surface, hairline border and a soft top highlight. */
export function Card({ children, onPress, style, accent, padding = 18, accessibilityLabel }: Props) {
  const t = useTheme();
  const body = (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[alpha(accent ? t.accent : BASE.white, accent ? 0.16 : 0.06), 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding }}>{children}</View>
    </>
  );
  const shell: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: t.surface, borderColor: accent ? t.accentBorder : t.border },
    style,
  ];
  if (!onPress) return <View style={shell}>{body}</View>;
  return (
    <PressableScale onPress={onPress} style={shell} scaleTo={0.985} feedback="tap" accessibilityLabel={accessibilityLabel}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth * 1.5, overflow: 'hidden' },
});
