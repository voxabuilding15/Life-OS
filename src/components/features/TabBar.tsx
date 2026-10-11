import type { BottomTabBarProps } from 'expo-router/tabs';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { alpha, BASE, radius, springs, useTheme } from '@/theme';
import { Icon } from '../ui/Icon';
import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';

const META: Record<string, { key: string; icon: string; iconActive: string }> = {
  index: { key: 'tabs.home', icon: 'home-outline', iconActive: 'home' },
  tasks: { key: 'tabs.tasks', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle' },
  habits: { key: 'tabs.habits', icon: 'flame-outline', iconActive: 'flame' },
  goals: { key: 'tabs.goals', icon: 'flag-outline', iconActive: 'flag' },
  notes: { key: 'tabs.notes', icon: 'journal-outline', iconActive: 'journal' },
};

function Item({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const meta = META[name];
  const lift = useAnimatedStyle(() => ({ transform: [{ translateY: withSpring(focused ? -1 : 0, springs.snappy) }, { scale: withSpring(focused ? 1.06 : 1, springs.snappy) }] }));
  const pill = useAnimatedStyle(() => ({ opacity: withSpring(focused ? 1 : 0, springs.snappy), transform: [{ scale: withSpring(focused ? 1 : 0.6, springs.snappy) }] }));
  if (!meta) return null;
  return (
    <PressableScale onPress={onPress} feedback="tap" scaleTo={0.9} style={styles.item} accessibilityLabel={tr(meta.key)} accessibilityState={{ selected: focused }}>
      <Animated.View style={[styles.pill, { backgroundColor: t.accentSoft, borderColor: t.accentBorder }, pill]} />
      <Animated.View style={[{ alignItems: 'center', gap: 3 }, lift]}>
        <Icon name={focused ? meta.iconActive : meta.icon} size={22} color={focused ? t.accent : t.textTertiary} />
        <Text variant="micro" color={focused ? 'accent' : 'tertiary'} style={{ letterSpacing: 0.2, fontSize: 10.5 }}>
          {tr(meta.key)}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

/** Floating glass tab bar. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, { borderColor: t.borderStrong, backgroundColor: Platform.OS === 'android' ? alpha(BASE.dark, 0.94) : alpha(BASE.dark, 0.6) }]}>
        {Platform.OS !== 'android' ? <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} /> : null}
        <View style={styles.row}>
          {state.routes.map((route, index) => (
            <Item
              key={route.key}
              name={route.name}
              focused={state.index === index}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (state.index !== index && !e.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', padding: 6 },
  item: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 2, bottom: 2, left: 4, right: 4, borderRadius: radius.lg, borderWidth: 1 },
});
