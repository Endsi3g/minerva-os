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
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { TimerControls } from '@/components/TimerControls';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { storeActiveTimerStart, clearActiveTimerStart } from '@/lib/backgroundTimer';
import { supabase } from '@/lib/supabase';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

type Project = { id: string; name: string };
type ActiveTimer = { id: string; description: string; start_time: string; project_id: string | null };

export default function Timer() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userEmail = user?.email ?? '';

  // Load workspace + projects + active timer
  useEffect(() => {
    async function load() {
      const wsRes = await supabase.from('workspaces').select('id').limit(1);
      const wid = wsRes.data?.[0]?.id;
      if (!wid) return;
      setWorkspaceId(wid);

      const [projectsRes, timerRes] = await Promise.all([
        supabase.from('projects').select('id,name').eq('workspace_id', wid).eq('status', 'active'),
        supabase.from('active_timers').select('*').eq('user_id', userEmail).maybeSingle(),
      ]);
      setProjects(projectsRes.data ?? []);
      setActiveTimer(timerRes.data ?? null);
    }
    if (userEmail) load();
  }, [userEmail]);

  // Subscribe to active_timers changes
  useEffect(() => {
    if (!userEmail) return;
    const channel = supabase
      .channel('active-timer-' + userEmail)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_timers', filter: `user_id=eq.${userEmail}` }, () => {
        supabase.from('active_timers').select('*').eq('user_id', userEmail).maybeSingle()
          .then(({ data }) => setActiveTimer(data ?? null));
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [userEmail]);

  const isRunning = Boolean(activeTimer);

  // Tick interval
  useEffect(() => {
    if (isRunning && activeTimer) {
      const startTime = new Date(activeTimer.start_time).getTime();
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
      await supabase.from('active_timers').insert({
        workspace_id: workspaceId,
        user_id: userEmail,
        project_id: selectedProjectId ?? null,
        description: description.trim(),
        start_time: new Date().toISOString(),
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
    if (!activeTimer || !workspaceId) return;
    setLoading(true);
    try {
      const startTime = new Date(activeTimer.start_time).getTime();
      const durationMs = Date.now() - startTime;
      await supabase.from('time_entries').insert({
        workspace_id: workspaceId,
        user_id: userEmail,
        project_id: activeTimer.project_id ?? null,
        description: activeTimer.description,
        start_time: startTime,
        end_time: Date.now(),
        duration: Math.round(durationMs / 60000),
        billable: true,
      });
      await supabase.from('active_timers').delete().eq('user_id', userEmail);
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
          await supabase.from('active_timers').delete().eq('user_id', userEmail);
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
          description={isRunning ? (activeTimer?.description ?? '') : ''}
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
            data={[{ id: '', name: t.timer.noProject }, ...projects]}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedProjectId(item.id || null)}
                className="mr-2 px-3 py-1.5 rounded-xl border"
                style={{
                  borderColor: selectedProjectId === (item.id || null) ? '#7FA38A' : 'rgba(255,255,255,0.1)',
                  backgroundColor: selectedProjectId === (item.id || null) ? '#7FA38A20' : '#111522',
                }}
              >
                <Text
                  style={{ color: selectedProjectId === (item.id || null) ? '#7FA38A' : '#8A9099', fontSize: 12 }}
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
