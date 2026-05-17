import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from 'convex/react';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { KPICard } from '@/components/KPICard';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { trackScreen } from '@/lib/analytics';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { trackScreen('Dashboard'); }, []);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const projects = useQuery(api.projects.list, workspaceId ? { workspaceId } : 'skip') ?? [];
  const tasks = useQuery(api.tasks.get, workspaceId ? { workspaceId } : 'skip') ?? [];
  const approvals = useQuery(api.approvals.list, workspaceId ? { workspaceId } : 'skip') ?? [];
  const invoices = useQuery(api.invoices.list, workspaceId ? { workspaceId } : 'skip') ?? [];
  const activity = useQuery(api.activity.list, workspaceId ? { workspaceId } : 'skip') ?? [];

  const notifications = useQuery(
    api.notifications.list,
    user ? { userId: user.email } : 'skip'
  ) as Array<{ read: boolean }> | undefined;
  const unreadCount = (notifications ?? []).filter(n => !n.read).length;

  const activeProjects = (projects as { status: string }[]).filter(p => p.status === 'active').length;
  const openTasks = (tasks as { status: string }[]).filter(t => t.status !== 'done').length;
  const pendingApprovals = (approvals as { status: string }[]).filter(a => a.status === 'pending').length;

  // Schema uses paidDate (string) not paidAt (number)
  const revenueMtd = (invoices as { status: string; amount: number; paidDate?: string }[])
    .filter(i => {
      if (i.status !== 'paid' || !i.paidDate) return false;
      const paid = new Date(i.paidDate).getTime();
      return paid > Date.now() - 30 * 24 * 60 * 60 * 1000;
    })
    .reduce((acc, i) => acc + (i.amount ?? 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.dashboard.greetingMorning
    : hour < 18 ? t.dashboard.greetingAfternoon : t.dashboard.greetingEvening;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const quickActions = [
    { label: t.dashboard.timer, route: '/(app)/timer' as const },
    { label: t.dashboard.projects, route: '/(app)/projects/index' as const },
    { label: t.dashboard.clients, route: '/(app)/clients/index' as const },
    { label: t.dashboard.approvals, route: '/(app)/approvals' as const },
  ];

  return (
    <ScrollView
      className="flex-1 bg-obsidian"
      contentContainerStyle={{ padding: 16, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-6">
        <View>
          <Text className="text-fog text-sm">{greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
          <Text className="text-ivory text-2xl font-semibold mt-0.5">{t.dashboard.title}</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/notifications')}
          style={{ marginTop: 4 }}
          hitSlop={8}
        >
          <View>
            <Bell size={22} color="#8A9099" />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute', top: -4, right: -4,
                backgroundColor: '#A86A6A', borderRadius: 99,
                width: 14, height: 14, alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* KPI grid */}
      <View className="flex-row gap-3 mb-3">
        <KPICard label={t.dashboard.activeProjects} value={String(activeProjects)} color="#F5F1E8" />
        <KPICard label={t.dashboard.openTasks} value={String(openTasks)} color="#B89B6A" />
      </View>
      <View className="flex-row gap-3 mb-6">
        <KPICard
          label={t.dashboard.pendingApprovals}
          value={String(pendingApprovals)}
          color={pendingApprovals > 0 ? '#B89B6A' : '#7FA38A'}
        />
        <KPICard label={t.dashboard.revenueMtd} value={fmt(revenueMtd)} color="#7FA38A" />
      </View>

      {/* Quick actions */}
      <Text className="text-fog text-xs uppercase tracking-widest mb-3">{t.dashboard.quickActions}</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {quickActions.map(action => (
          <TouchableOpacity
            key={action.label}
            onPress={() => router.push(action.route)}
            className="px-4 py-2 rounded-xl border border-white/10"
            style={{ backgroundColor: '#111522' }}
          >
            <Text className="text-silver text-sm">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent activity */}
      {(activity as { user: string; action: string; targetName: string }[]).length > 0 && (
        <>
          <Text className="text-fog text-xs uppercase tracking-widest mb-3">{t.dashboard.recentActivity}</Text>
          {(activity as { _id: string; user: string; action: string; targetName: string }[]).slice(0, 5).map(item => (
            <View key={item._id} className="py-2 border-b border-white/5">
              <Text className="text-silver text-xs">
                <Text className="text-ivory">{item.user}</Text> {item.action} {item.targetName}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}
