import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConvexProvider } from 'convex/react';
import * as Notifications from 'expo-notifications';
import { convex } from '@/lib/convex';
import '../global.css';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on first launch
    Notifications.requestPermissionsAsync().catch(() => {
      // Permission denied — notifications disabled, non-fatal
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <StatusBar style="light" backgroundColor="#0A0D14" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0D14' } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
