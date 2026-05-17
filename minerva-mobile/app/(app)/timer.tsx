import { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { TimerControls } from '@/components/TimerControls';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { storeActiveTimerStart, clearActiveTimerStart } from '@/lib/backgroundTimer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

type Project = { _id: string; name: string };

export default function Timer() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const userEmail = user?.email ?? '';

  const activeTimer = useQuery(api.timers.getActive, { userId: userEmail });
  const projects = (useQuery(api.projects.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Project[];

  const startTimer = useMutation(api.timers.start);
  const stopTimer = useMutation(api.timers.stop);
  const cancelTimer = useMutation(api.timers.cancel);

  const isRunning = Boolean(activeTimer);

  // Tick interval
  useEffect(() => {
    if (isRunning && activeTimer) {
      const startTime = activeTimer.startTime as number;
      const update = () => setElapsed(Date.now() - startTime);
      update();
      intervalRef.current = setInterval(update, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setElapsed(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, activeTimer]);

  async function handleStart() {
    if (!description.trim() || !workspaceId) return;
    setLoading(true);
    try {
      await startTimer({
        workspaceId,
        userId: userEmail,
        projectId: selectedProjectId as Parameters<typeof startTimer>[0]['projectId'] ?? undefined,
        description: description.trim(),
      });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      storeActiveTimerStart(Date.now());
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Timer running',
          body: description.trim(),
          data: { screen: 'timer' },
        },
        trigger: null,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    try {
      await stopTimer({ userId: userEmail, workspaceId, billable: true });
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      clearActiveTimerStart();
      await Notifications.dismissAllNotificationsAsync();
      setDescription('');
      setSelectedProjectId(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    Alert.alert(t.timer.discardConfirm, t.timer.discardConfirmBody, [
      { text: t.timer.keepRunning, style: 'cancel' },
      {
        text: t.timer.discard, style: 'destructive',
        onPress: async () => {
          await cancelTimer({ userId: userEmail });
          clearActiveTimerStart();
          await Notifications.dismissAllNotificationsAsync();
          setDescription('');
        },
      },
    ]);
  }

  return (
    <ScrollView
      className="flex-1 bg-obsidian"
      contentContainerStyle={{ padding: 16, paddingTop: 56 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-ivory text-2xl font-semibold mb-8">{t.timer.title}</Text>

      {/* Timer display */}
      <View className="items-center py-8">
        <TimerControls
          isRunning={isRunning}
          elapsed={formatElapsed(elapsed)}
          description={isRunning ? (activeTimer?.description as string) ?? '' : ''}
          onStart={handleStart}
          onStop={handleStop}
          loading={loading}
        />

        {isRunning && (
          <TouchableOpacity onPress={handleCancel} className="mt-4">
            <Text className="text-fog text-xs">{t.timer.discardTimer}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Input form — only shown when not running */}
      {!isRunning && (
        <View className="mt-2 space-y-3">
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t.timer.whatWorkingOn}
            placeholderTextColor="#8A9099"
            className="bg-midnight border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm"
            returnKeyType="done"
          />

          {/* Project selector */}
          <Text className="text-fog text-xs uppercase tracking-widest mt-2">{t.timer.project}</Text>
          <FlatList
            data={[{ _id: '', name: t.timer.noProject }, ...projects]}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedProjectId(item._id || null)}
                className="mr-2 px-3 py-1.5 rounded-xl border"
                style={{
                  borderColor: selectedProjectId === (item._id || null) ? '#7FA38A' : 'rgba(255,255,255,0.1)',
                  backgroundColor: selectedProjectId === (item._id || null) ? '#7FA38A20' : '#111522',
                }}
              >
                <Text
                  style={{ color: selectedProjectId === (item._id || null) ? '#7FA38A' : '#8A9099', fontSize: 12 }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </ScrollView>
  );
}
