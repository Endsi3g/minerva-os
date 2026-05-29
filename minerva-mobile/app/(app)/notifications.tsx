import { FlatList, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  target_url?: string;
  created_at: string;
};

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isSameDay(isoString: string): boolean {
  const d = new Date(isoString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function isWithinWeek(isoString: string): boolean {
  return Date.now() - new Date(isoString).getTime() < 7 * 24 * 60 * 60 * 1000;
}

type SectionRow =
  | { kind: 'header'; label: string; id: string }
  | { kind: 'item'; notification: Notification };

export default function Notifications() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data ?? []);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const today = notifications.filter(n => isSameDay(n.created_at));
  const thisWeek = notifications.filter(n => !isSameDay(n.created_at) && isWithinWeek(n.created_at));
  const earlier = notifications.filter(n => !isWithinWeek(n.created_at));

  const sections: SectionRow[] = [
    ...(today.length > 0 ? [{ kind: 'header' as const, label: t.notifications.today, id: 'h-today' }] : []),
    ...today.map(n => ({ kind: 'item' as const, notification: n })),
    ...(thisWeek.length > 0 ? [{ kind: 'header' as const, label: t.notifications.thisWeek, id: 'h-week' }] : []),
    ...thisWeek.map(n => ({ kind: 'item' as const, notification: n })),
    ...(earlier.length > 0 ? [{ kind: 'header' as const, label: t.notifications.earlier, id: 'h-earlier' }] : []),
    ...earlier.map(n => ({ kind: 'item' as const, notification: n })),
  ];

  async function handleTap(notification: Notification) {
    if (!notification.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
    if (notification.target_url) {
      router.push(notification.target_url as Parameters<typeof router.push>[0]);
    }
  }

  async function handleMarkRead(notification: Notification) {
    if (!notification.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
  }

  return (
    <View className="flex-1 bg-obsidian">
      <Header title={t.notifications.title} />

      {notifications.length === 0 ? (
        <EmptyState emoji="🔔" title={t.notifications.noNotifications} />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={item => {
            if (item.kind === 'header') return item.id;
            return item.notification.id;
          }}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <Text className="text-fog text-xs uppercase tracking-widest mb-2 mt-4 first:mt-0">
                  {item.label}
                </Text>
              );
            }

            const { notification } = item;

            return (
              <SwipeableRow
                leftActions={[
                  {
                    label: t.notifications.markRead,
                    color: '#7FA38A',
                    onPress: () => handleMarkRead(notification),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleTap(notification)}
                  className="flex-row items-start py-3 mb-1"
                  style={{ backgroundColor: '#0A0D14' }}
                >
                  <View className="pt-1 mr-3 w-5 items-center">
                    {!notification.read && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#7FA38A',
                        }}
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-ivory font-medium text-sm" numberOfLines={1}>
                      {notification.title}
                    </Text>
                    <Text className="text-fog text-sm mt-0.5" numberOfLines={1}>
                      {notification.message}
                    </Text>
                    <Text style={{ color: 'rgba(138,144,153,0.5)', fontSize: 11, marginTop: 2 }}>
                      {relativeTime(notification.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </SwipeableRow>
            );
          }}
        />
      )}
    </View>
  );
}
