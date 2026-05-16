import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useQuery } from 'convex/react';
import { useState, useCallback } from 'react';
import { router } from 'expo-router';
import { KPICard } from '@/components/KPICard';
// Convex API shared via symlink: minerva-mobile/convex -> ../convex
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;

  const projects = useQuery(api.projects.list, workspaceId ? { workspaceId } : 'skip') ?? [];
  const tasks = useQuery(api.tasks.get, workspaceId ? { workspaceId } : 'skip') ?? [];
  const approvals = useQuery(api.approvals.list, workspaceId ? { workspaceId } : 'skip') ?? [];
  const invoices = useQuery(api.invoices.list, workspaceId ? { workspaceId } : 'skip') ?? [];

  const activeProjects = (projects as { status: string }[]).filter(p => p.status === 'active').length;
  const openTasks = (tasks as { status: string }[]).filter(t => t.status !== 'done').length;
  const pendingApprovals = (approvals as { status: string }[]).filter(a => a.status === 'pending').length;
  const revenueMtd = (invoices as { status: string; amount: number; paidAt?: number }[])
    .filter(i => i.status === 'paid' && i.paidAt && i.paidAt > Date.now() - 30 * 24 * 60 * 60 * 1000)
    .reduce((acc, i) => acc + (i.amount ?? 0), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <ScrollView
      className="flex-1 bg-obsidian"
      contentContainerStyle={{ padding: 16, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
    >
      {/* Header */}
      <View className="mb-6">
        <Text className="text-fog text-sm">{greeting}</Text>
        <Text className="text-ivory text-2xl font-semibold mt-0.5">Dashboard</Text>
      </View>

      {/* KPI grid */}
      <View className="flex-row gap-3 mb-3">
        <KPICard label="Active Projects" value={String(activeProjects)} color="#F5F1E8" />
        <KPICard label="Open Tasks" value={String(openTasks)} color="#B89B6A" />
      </View>
      <View className="flex-row gap-3 mb-6">
        <KPICard
          label="Pending Approvals"
          value={String(pendingApprovals)}
          color={pendingApprovals > 0 ? '#B89B6A' : '#7FA38A'}
        />
        <KPICard label="Revenue MTD" value={fmt(revenueMtd)} color="#7FA38A" />
      </View>

      {/* Quick actions */}
      <Text className="text-fog text-xs uppercase tracking-widest mb-3">Quick Actions</Text>
      <View className="flex-row flex-wrap gap-2">
        {[
          { label: 'Timer', route: '/(app)/timer' as const },
          { label: 'Approvals', route: '/(app)/approvals' as const },
          { label: 'Files', route: '/(app)/files' as const },
        ].map(action => (
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
    </ScrollView>
  );
}
