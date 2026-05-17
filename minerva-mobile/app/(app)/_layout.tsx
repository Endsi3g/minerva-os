import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { LayoutDashboard, FolderKanban, Clock, Bell, Grid3X3 } from 'lucide-react-native';
import { View, Text, Platform } from 'react-native';
import { useQuery } from 'convex/react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';
import { useAppAuth } from '@/lib/auth';
import { useMobileLang } from '@/lib/i18n';
import { LoadingSpinner } from '@/components/LoadingSpinner';

function TabIcon({ Icon, focused, badge }: { Icon: typeof LayoutDashboard; focused: boolean; badge?: number }) {
  const color = focused ? '#7FA38A' : '#8A9099';
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={22} color={color} />
      {badge && badge > 0 ? (
        <View style={{
          position: 'absolute',
          top: -4,
          right: -8,
          backgroundColor: '#A86A6A',
          borderRadius: 99,
          minWidth: 16,
          height: 16,
          paddingHorizontal: 4,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>
            {badge > 99 ? '99+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AppLayout() {
  const { t } = useMobileLang();
  const { isAuthenticated, isLoading, user } = useAppAuth();

  const notifications = useQuery(
    api.notifications.list,
    user ? { userId: user.email } : 'skip'
  ) as Array<{ read: boolean }> | undefined;

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const approvals = useQuery(api.approvals.list, workspaceId ? { workspaceId } : 'skip') as
    Array<{ status: string }> | undefined;

  const unreadNotifs = (notifications ?? []).filter(n => !n.read).length;
  const pendingApprovals = (approvals ?? []).filter(a => a.status === 'pending').length;
  const inboxBadge = unreadNotifs + pendingApprovals;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111522',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#7FA38A',
        tabBarInactiveTintColor: '#8A9099',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t.nav.dashboard,
          tabBarIcon: ({ focused }) => <TabIcon Icon={LayoutDashboard} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="projects/index"
        options={{
          title: t.nav.projects,
          tabBarIcon: ({ focused }) => <TabIcon Icon={FolderKanban} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: t.nav.timer,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Clock} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: t.nav.inbox,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Bell} focused={focused} badge={inboxBadge} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t.nav.more,
          tabBarIcon: ({ focused }) => <TabIcon Icon={Grid3X3} focused={focused} />,
        }}
      />
      {/* All non-tab screens hidden from tab bar */}
      {[
        'notifications', 'profile', 'pipeline', 'billing/index', 'billing/[id]',
        'clients/index', 'clients/[id]', 'projects/[id]',
        'time-entries', 'expenses/index', 'expenses/new',
        'proposals/index', 'proposals/[id]',
        'knowledge/index', 'tickets/index', 'tickets/new', 'files',
      ].map(name => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
