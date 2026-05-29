import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { LayoutDashboard, FolderKanban, Clock, Bell, Grid3X3 } from 'lucide-react-native';
import { View, Text, Platform } from 'react-native';
import { useAppAuth } from '@/lib/auth';
import { useMobileLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
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
  const [inboxBadge, setInboxBadge] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function fetchBadge() {
      const workspacesRes = await supabase.from('workspaces').select('id').limit(1);
      const workspaceId = workspacesRes.data?.[0]?.id;
      if (!workspaceId) return;

      const [notifRes, approvalsRes] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('read', false),
        supabase.from('approvals').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'pending'),
      ]);
      setInboxBadge((notifRes.count ?? 0) + (approvalsRes.count ?? 0));
    }
    fetchBadge();
  }, [user]);

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
