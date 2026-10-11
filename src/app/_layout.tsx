import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { router, Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackLayer } from '@/components/features/FeedbackLayer';
import { SplashOverlay } from '@/components/features/SplashOverlay';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { DirectionView } from '@/components/ui/DirectionView';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { Text } from '@/components/ui/Text';
import { useHydrated, useServices } from '@/hooks/useBootstrap';
import { applyLocale, detectDeviceLocale, useI18n } from '@/i18n';
import { useAuth } from '@/store/auth';
import { useProfile } from '@/store/profile';
import { BASE } from '@/theme';

/** Last line of defence: a branded fallback instead of a white screen if a render throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, backgroundColor: BASE.dark, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 }}>
      <Logo size={64} />
      <Text variant="title" align="center">
        {t('common.errorTitle')}
      </Text>
      <Text variant="body" color="secondary" align="center">
        {t('common.errorBody')}
      </Text>
      {__DEV__ ? (
        <Text variant="caption" color="tertiary" align="center">
          {error.message}
        </Text>
      ) : null}
      <Button title={t('common.tryAgain')} onPress={retry} fullWidth={false} />
    </View>
  );
}

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const MIN_SPLASH_MS = 2300;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });
  const hydrated = useHydrated();
  const status = useAuth((s) => s.status);
  const onboarded = useProfile((s) => s.onboarded);
  const [minElapsed, setMinElapsed] = useState(false);
  const { rtl } = useI18n();
  const savedLanguage = useProfile((p) => p.language);

  useServices(hydrated);

  // Language: the saved preference wins; on first launch the device language is detected and saved.
  useEffect(() => {
    if (!hydrated) return;
    if (savedLanguage) void applyLocale(savedLanguage);
    else {
      const detected = detectDeviceLocale();
      useProfile.getState().setProfile({ language: detected });
      void applyLocale(detected);
    }
  }, [hydrated, savedLanguage]);

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
      <DirectionView rtl={rtl} style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {fontsLoaded && hydrated ? (
          <View style={{ flex: 1, backgroundColor: BASE.dark }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BASE.dark }, animation: rtl ? 'slide_from_left' : 'slide_from_right' }}>
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
                <Stack.Screen name="life-score" />
                <Stack.Screen name="challenges" />
                <Stack.Screen name="report" />
                <Stack.Screen name="pro" />
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
      </DirectionView>
    </GestureHandlerRootView>
  );
}
