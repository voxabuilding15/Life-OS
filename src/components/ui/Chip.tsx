import { StyleSheet } from 'react-native';
import { radius, useTheme } from '@/theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName | string;
}

export function Chip({ label, selected, onPress, icon }: Props) {
  const t = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      feedback="tap"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        { backgroundColor: selected ? t.accentSoft : t.surface, borderColor: selected ? t.accentBorder : t.border },
      ]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? t.accent : t.textSecondary} /> : null}
      <Text variant="caption" color={selected ? 'accent' : 'secondary'} style={{ fontFamily: 'Inter_600SemiBold' }}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: radius.pill, borderWidth: 1 },
});
