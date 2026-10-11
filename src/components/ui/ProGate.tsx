import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsPro } from '@/store/subscription';
import { useTheme } from '@/theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** Shows children as-is for Pro; for free users renders them dimmed behind a tappable unlock overlay. */
export function ProGate({ children, reason, label = 'Unlock with Pro' }: { children: ReactNode; reason: string; label?: string }) {
  const isPro = useIsPro();
  const t = useTheme();
  if (isPro) return <>{children}</>;
  return (
    <View>
      <View style={{ opacity: 0.22 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {children}
      </View>
      <PressableScale onPress={() => router.push(`/paywall?reason=${reason}`)} accessibilityLabel={label} style={[StyleSheet.absoluteFill, styles.overlay]}>
        <View style={[styles.pill, { backgroundColor: t.surfaceSolid, borderColor: t.accentBorder, shadowColor: t.accent }]}>
          <Icon name="lock-closed" size={14} color={t.accent} />
          <Text variant="caption" color="accent" style={{ fontFamily: 'Inter_700Bold' }}>
            {label}
          </Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: 1, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
});
