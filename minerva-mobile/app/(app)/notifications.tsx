import { FlatList, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { router } from 'expo-router';
import { Header } from '@/components/Header';
import { EmptyState } from '@/components/EmptyState';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  targetUrl?: string;
  _creationTime: number;
};

function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isSameDay(ms: number): boolean {
  const d = new Date(ms);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function isWithinWeek(ms: number): boolean {
  return Date.now() - ms < 7 * 24 * 60 * 60 * 1000;
}

type SectionRow =
  | { kind: 'header'; label: string; id: string }
  | { kind: 'item'; notification: Notification };

export default function Notifications() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();

  const notifications = (useQuery(
    api.notifications.list,
    user?.email ? { userId: user.email } : 'skip'
  ) ?? []) as Notification[];

  const markAsRead = useMutation(api.notifications.markAsRead);

  const onRefresh = useCallback(() => {
    // Convex keeps data live; manual refresh is a no-op
  }, []);

  const today = notifications.filter(n => isSameDay(n._creationTime));
  const thisWeek = notifications.filter(n => !isSameDay(n._creationTime) && isWithinWeek(n._creationTime));
  const earlier = notifications.filter(n => !isWithinWeek(n._creationTime));

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
      await markAsRead({ id: notification._id as Parameters<typeof markAsRead>[0]['id'] });
    }
    if (notification.targetUrl) {
      router.push(notification.targetUrl as Parameters<typeof router.push>[0]);
    }
  }

  async function handleMarkRead(notification: Notification) {
    if (!notification.read) {
      await markAsRead({ id: notification._id as Parameters<typeof markAsRead>[0]['id'] });
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
            return item.notification._id;
          }}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor="#7FA38A" />
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
                      {relativeTime(notification._creationTime)}
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
