import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSync } from '@/store/sync';
import { radius, useTheme } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export function OfflineBanner() {
  const online = useSync((s) => s.online);
  const t = useTheme();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={[styles.wrap, { top: insets.top + 4 }]} pointerEvents="none">
      <View style={[styles.pill, { backgroundColor: t.surfaceSolid, borderColor: t.borderStrong }]}>
        <Icon name="cloud-offline-outline" size={14} color={t.textSecondary} />
        <Text variant="caption" color="secondary">
          Offline. Changes are saved on this device.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1 },
});
