import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackLayer } from '@/components/features/FeedbackLayer';
import { SplashOverlay } from '@/components/features/SplashOverlay';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useHydrated, useServices } from '@/hooks/useBootstrap';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { BASE } from '@/theme';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const MIN_SPLASH_MS = 2300;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const hydrated = useHydrated();
  const status = useAuth((s) => s.status);
  const onboarded = useProfile((s) => s.onboarded);
  const [minElapsed, setMinElapsed] = useState(false);

  useServices(hydrated);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const route = res.notification.request.content.data?.route;
      if (typeof route === 'string') router.push(route);
    });
    return () => sub.remove();
  }, []);

  const ready = fontsLoaded && hydrated && status !== 'loading';
  const authed = status === 'signedIn';

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: BASE.dark }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {fontsLoaded && hydrated ? (
          <View style={{ flex: 1, backgroundColor: BASE.dark }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BASE.dark }, animation: 'fade' }}>
              <Stack.Protected guard={!authed && !onboarded}>
                <Stack.Screen name="onboarding" />
              </Stack.Protected>
              <Stack.Protected guard={!authed}>
                <Stack.Screen name="(auth)" />
              </Stack.Protected>
              <Stack.Protected guard={authed}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="analytics" />
                <Stack.Screen name="achievements" />
                <Stack.Screen name="habit/[id]" />
                <Stack.Screen name="goal/[id]" />
                <Stack.Screen name="focus" options={{ animation: 'slide_from_bottom' }} />
                <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="task/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="habit/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="goal/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="note/[id]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="journal/[date]" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              </Stack.Protected>
            </Stack>
            <OfflineBanner />
            {authed ? <FeedbackLayer /> : null}
          </View>
        ) : null}
        {!(ready && minElapsed) ? <SplashOverlay /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
