import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AmbientBackground } from './AmbientBackground';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  /** Extra bottom space (e.g. for the tab bar / FAB). */
  bottomInset?: number;
  padded?: boolean;
  keyboard?: boolean;
  noTop?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, scroll = true, bottomInset = 0, padded = true, keyboard, noTop, refreshControl, contentStyle }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: noTop ? 0 : insets.top + 8, paddingBottom: insets.bottom + bottomInset, paddingHorizontal: padded ? 20 : 0 };
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[pad, styles.grow, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad, contentStyle]}>{children}</View>
  );
  return (
    <View style={[styles.flex, { backgroundColor: t.background }]}>
      <AmbientBackground />
      {keyboard ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 }, grow: { flexGrow: 1 } });
