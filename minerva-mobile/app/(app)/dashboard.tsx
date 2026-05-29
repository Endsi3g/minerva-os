import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { KPICard } from '@/components/KPICard';
import { useMobileLang } from '@/lib/i18n';
import { useAppAuth } from '@/lib/auth';
import { trackScreen } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const { t } = useMobileLang();
  const { user } = useAppAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [activeProjects, setActiveProjects] = useState(0);
  const [openTasks, setOpenTasks] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [revenueMtd, setRevenueMtd] = useState(0);
  const [activity, setActivity] = useState<{ id: string; user: string; action: string; targetName: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { trackScreen('Dashboard'); }, []);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) return;
    setWorkspaceId(wid);

    const [projectsRes, tasksRes, approvalsRes, invoicesRes, activityRes, notifRes] = await Promise.all([
      supabase.from('projects').select('status').eq('workspace_id', wid),
      supabase.from('tasks').select('status').eq('workspace_id', wid),
      supabase.from('approvals').select('status').eq('workspace_id', wid),
      supabase.from('invoices').select('status,amount,date').eq('workspace_id', wid),
      supabase.from('activity').select('id,username,action_name,target_name').eq('workspace_id', wid).order('created_at', { ascending: false }).limit(5),
      user ? supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false) : Promise.resolve({ count: 0 }),
    ]);

    setActiveProjects((projectsRes.data ?? []).filter((p: any) => p.status === 'active').length);
    setOpenTasks((tasksRes.data ?? []).filter((t: any) => t.status !== 'done').length);
    setPendingApprovals((approvalsRes.data ?? []).filter((a: any) => a.status === 'pending').length);

    const now = new Date();
    const mtd = (invoicesRes.data ?? [])
      .filter((i: any) => i.status === 'paid' && new Date(i.date).getMonth() === now.getMonth())
      .reduce((acc: number, i: any) => acc + Number(i.amount), 0);
    setRevenueMtd(mtd);

    setActivity((activityRes.data ?? []).map((a: any) => ({
      id: a.id,
      user: a.username,
      action: a.action_name,
      targetName: a.target_name,
    })));

    setUnreadCount('count' in notifRes ? (notifRes.count ?? 0) : 0);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.dashboard.greetingMorning
    : hour < 18 ? t.dashboard.greetingAfternoon : t.dashboard.greetingEvening;

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
      {activity.length > 0 && (
        <>
          <Text className="text-fog text-xs uppercase tracking-widest mb-3">{t.dashboard.recentActivity}</Text>
          {activity.map(item => (
            <View key={item.id} className="py-2 border-b border-white/5">
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
