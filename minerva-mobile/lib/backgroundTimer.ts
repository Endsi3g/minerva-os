import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';

export const BACKGROUND_TIMER_TASK = 'BACKGROUND_TIMER_SYNC';

const ACTIVE_TIMER_KEY = 'minerva_active_timer_start';

export function storeActiveTimerStart(startTime: number): void {
  SecureStore.setItemAsync(ACTIVE_TIMER_KEY, String(startTime));
}

export function clearActiveTimerStart(): void {
  SecureStore.deleteItemAsync(ACTIVE_TIMER_KEY);
}

TaskManager.defineTask(BACKGROUND_TIMER_TASK, async () => {
  try {
    const raw = await SecureStore.getItemAsync(ACTIVE_TIMER_KEY);
    if (!raw) return BackgroundFetch.BackgroundFetchResult.NoData;

    const startTime = Number(raw);
    const elapsed = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const formatted = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');

    await Notifications.setBadgeCountAsync(h > 0 ? h : 0);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer running',
        body: formatted,
        sticky: true,
      },
      trigger: null,
    });

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundTimerSync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TIMER_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Already registered or not supported — safe to ignore
  }
}
