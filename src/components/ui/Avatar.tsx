import { Image, StyleSheet, View } from 'react-native';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme';
import { Text } from './Text';

export function Avatar({ name, uri, size = 44 }: { name: string; uri?: string | null; size?: number }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const initial = (name.trim().charAt(0) || '·').toUpperCase();
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.accentSoft, borderColor: t.accentBorder }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} accessibilityLabel={tr('common.profilePicture')} />
      ) : (
        <Text style={{ fontSize: size * 0.4, fontFamily: 'Inter_700Bold', color: t.accent }}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' } });
