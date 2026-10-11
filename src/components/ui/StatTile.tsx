import { StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export function StatTile({ icon, value, label }: { icon: IconName; value: string | number; label: string }) {
  return (
    <Card style={styles.tile} padding={14}>
      <View style={styles.top}>
        <Icon name={icon} size={16} accent />
      </View>
      <Text variant="title">{value}</Text>
      <Text variant="caption" color="secondary">
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({ tile: { flex: 1 }, top: { marginBottom: 10 } });
