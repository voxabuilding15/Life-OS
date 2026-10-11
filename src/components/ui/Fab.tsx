import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

export function Fab({ onPress, icon = 'add', label }: { onPress: () => void; icon?: IconName; label: string }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      scaleTo={0.92}
      style={[styles.fab, { bottom: insets.bottom + 92, backgroundColor: t.accent, shadowColor: t.accent }]}
    >
      <Icon name={icon} size={28} color={t.onAccent} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', end: 20, width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.45, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
});
