import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { MobileLangProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { initSentry } from '@/lib/sentry';
import { registerBackgroundTimerSync } from '@/lib/backgroundTimer';
import * as Sentry from '@sentry/react-native';
import '../global.css';

initSentry();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootLayout() {
  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => undefined);
    registerBackgroundTimerSync();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string> | null;
      const screen = data?.screen;
      if (screen === 'timer') router.push('/(app)/timer');
      else if (screen === 'approvals') router.push('/(app)/approvals');
      else if (screen === 'notifications') router.push('/(app)/notifications');
      else if (screen === 'billing') router.push('/(app)/billing/index');
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MobileLangProvider>
        <AuthProvider>
          <ErrorBoundary>
            <OfflineBanner />
            <StatusBar style="light" backgroundColor="#0A0D14" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0D14' } }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
            </Stack>
          </ErrorBoundary>
        </AuthProvider>
      </MobileLangProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
