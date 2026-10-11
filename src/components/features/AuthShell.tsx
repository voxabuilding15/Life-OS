import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { IconButton } from '../ui/Header';
import { Logo } from '../ui/Logo';
import { Screen } from '../ui/Screen';
import { Text } from '../ui/Text';

export function AuthShell({ title, subtitle, children, back }: { title: string; subtitle: string; children: ReactNode; back?: boolean }) {
  return (
    <Screen keyboard>
      <View style={{ height: 48, justifyContent: 'center' }}>
        {back ? <IconButton icon="chevron-back" label="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))} /> : null}
      </View>
      <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: 12, marginBottom: 32, gap: 10 }}>
        <Logo size={56} />
        <Text variant="display" style={{ marginTop: 14 }}>
          {title}
        </Text>
        <Text variant="body" color="secondary">
          {subtitle}
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(120).duration(500)} style={{ gap: 16 }}>
        {children}
      </Animated.View>
    </Screen>
  );
}
