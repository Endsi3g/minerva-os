import { ScrollView, View, Text, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { ChevronLeft, AlertTriangle, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMobileLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { trackScreen } from '@/lib/analytics';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export default function Cockpit() {
  const { t } = useMobileLang();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => { trackScreen('Cockpit'); }, []);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) {
      setLoading(false);
      return;
    }

    const [projectsRes, tasksRes, approvalsRes, invoicesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('workspace_id', wid),
      supabase.from('tasks').select('*').eq('workspace_id', wid),
      supabase.from('approvals').select('*').eq('workspace_id', wid),
      supabase.from('invoices').select('*').eq('workspace_id', wid),
    ]);

    setProjects(projectsRes.data ?? []);
    setTasks(tasksRes.data ?? []);
    setApprovals(approvalsRes.data ?? []);
    setInvoices(invoicesRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculations
  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);

  const revenueThisMonth = useMemo(() => {
    return invoices
      .filter((i: any) => i.status === 'paid' && i.paid_date?.startsWith(thisMonth))
      .reduce((s: number, i: any) => s + (Number(i.amount) ?? 0), 0);
  }, [invoices, thisMonth]);

  const onTimeRate = useMemo(() => {
    const doneTasks = tasks.filter((t: any) => t.status === 'done');
    if (!doneTasks.length) return 100;
    const onTime = doneTasks.filter((t: any) => new Date(t.due_date) >= today).length;
    return Math.round((onTime / doneTasks.length) * 100);
  }, [tasks]);

  const avgApprovalDays = useMemo(() => {
    const pending = approvals.filter((a: any) => a.status === 'pending');
    if (!pending.length) return 0;
    const totalDays = pending.reduce((s: number, a: any) => {
      return s + Math.floor((today.getTime() - new Date(a.submitted_date).getTime()) / 86400000);
    }, 0);
    return Math.round(totalDays / pending.length);
  }, [approvals]);

  const recentWins = useMemo(() => {
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
    const wins: Array<{ type: 'paid' | 'completed'; name: string; date: string; label: string }> = [];
    invoices
      .filter((i: any) => i.status === 'paid' && i.paid_date && new Date(i.paid_date) >= thirtyDaysAgo)
      .slice(0, 3)
      .forEach((i: any) => wins.push({ type: 'paid', name: `INV-${i.invoice_number}`, date: i.paid_date!, label: t.billing.status.paid }));
    projects
      .filter((p: any) => p.status === 'completed' && p.due_date && new Date(p.due_date) >= thirtyDaysAgo)
      .slice(0, 2)
      .forEach((p: any) => wins.push({ type: 'completed', name: p.name, date: p.due_date!, label: t.projects.completed }));
    return wins.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  }, [invoices, projects, t]);

  const alerts = useMemo(() => {
    const list: Array<{ id: string; severity: 'critical' | 'warning'; message: string }> = [];
    
    // Project overdue
    projects.forEach((p: any) => {
      if (p.status === 'active' && new Date(p.due_date) < today) {
        list.push({ id: `p-${p.id}`, severity: 'critical', message: `Project "${p.name}" is past its due date` });
      }
    });

    // Overdue invoices
    const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue');
    if (overdueInvoices.length > 0) {
      list.push({ id: 'inv-overdue', severity: 'critical', message: `${overdueInvoices.length} invoice(s) currently overdue` });
    }

    // Stalled approvals
    approvals.forEach((a: any) => {
      if (a.status === 'pending') {
        const days = Math.floor((today.getTime() - new Date(a.submitted_date).getTime()) / 86400000);
        if (days > 5) {
          list.push({ id: `a-${a.id}`, severity: 'warning', message: `Approval "${a.name}" pending for ${days} days` });
        }
      }
    });

    return list;
  }, [projects, invoices, approvals]);

  // Portfolio overall score simulation
  const portfolioScore = useMemo(() => {
    const activeProjects = projects.filter((p: any) => p.status === 'active');
    if (!activeProjects.length) return 85;
    const scores = activeProjects.map((p: any) => {
      const pTasks = tasks.filter((t: any) => t.project_id === p.id);
      if (!pTasks.length) return 90;
      const done = pTasks.filter((t: any) => t.status === 'done').length;
      return Math.round((done / pTasks.length) * 100);
    });
    return Math.round(scores.reduce((s, val) => s + val, 0) / scores.length);
  }, [projects, tasks]);

  if (loading) {
    return (
      <View className="flex-1 bg-obsidian items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-obsidian"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
    >
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1 rounded-full bg-dusk border border-mist">
          <ChevronLeft size={20} color="#475569" />
        </TouchableOpacity>
        <View>
          <Text className="text-ivory text-2xl font-semibold">Cockpit</Text>
          <Text className="text-fog text-xs mt-0.5">Agency portfolio intelligence dashboard</Text>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 rounded-2xl p-4 bg-white border border-mist shadow-sm">
          <Text className="text-fog text-[10px] uppercase tracking-wider mb-1">Portfolio Health</Text>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="text-2xl font-bold text-ivory">{portfolioScore}%</Text>
            <TrendingUp size={14} color="#10B981" />
          </View>
          <Text className="text-[10px] text-sage mt-1">Stable trend</Text>
        </View>

        <View className="flex-1 rounded-2xl p-4 bg-white border border-mist shadow-sm">
          <Text className="text-fog text-[10px] uppercase tracking-wider mb-1">On-Time Delivery</Text>
          <Text className="text-2xl font-bold text-ivory">{onTimeRate}%</Text>
          <Text className="text-[10px] text-silver mt-1">{tasks.filter((t: any) => t.status === 'done').length} tasks done</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 rounded-2xl p-4 bg-white border border-mist shadow-sm">
          <Text className="text-fog text-[10px] uppercase tracking-wider mb-1">Monthly Revenue</Text>
          <Text className="text-2xl font-bold text-ivory">{fmt(revenueThisMonth)}</Text>
          <Text className="text-[10px] text-silver mt-1">{invoices.filter((i: any) => i.status === 'paid' && i.paid_date?.startsWith(thisMonth)).length} paid MTD</Text>
        </View>

        <View className="flex-1 rounded-2xl p-4 bg-white border border-mist shadow-sm">
          <Text className="text-fog text-[10px] uppercase tracking-wider mb-1">Pending Approvals</Text>
          <Text className="text-2xl font-bold text-ivory">{approvals.filter((a: any) => a.status === 'pending').length}</Text>
          <Text className="text-[10px] text-silver mt-1">{avgApprovalDays > 0 ? `${avgApprovalDays}d avg age` : 'All resolved'}</Text>
        </View>
      </View>

      {/* Critical Alerts */}
      <Text className="text-fog text-xs font-semibold uppercase tracking-widest mb-3">Critical Alerts</Text>
      {alerts.length === 0 ? (
        <View className="flex-row items-center gap-2.5 rounded-2xl p-4 bg-emerald-50 border border-emerald-200 mb-6">
          <CheckCircle2 size={16} color="#10B981" />
          <Text className="text-xs text-emerald-800 font-medium">All systems healthy. No portfolio alerts.</Text>
        </View>
      ) : (
        <View className="gap-2 mb-6">
          {alerts.map((alert) => (
            <View
              key={alert.id}
              className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 border ${
                alert.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              {alert.severity === 'critical' ? (
                <AlertTriangle size={15} color="#EF4444" />
              ) : (
                <AlertCircle size={15} color="#F59E0B" />
              )}
              <Text className="text-xs text-ivory font-medium flex-1">{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Delivery Performance */}
      <Text className="text-fog text-xs font-semibold uppercase tracking-widest mb-3">Delivery Health</Text>
      <View className="rounded-2xl p-4 bg-white border border-mist shadow-sm mb-6">
        <View className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-xs text-silver">Tasks On-Time</Text>
            <Text className="text-xs font-semibold text-ivory">{onTimeRate}%</Text>
          </View>
          <View className="h-1.5 w-full bg-mist rounded-full overflow-hidden">
            <View className="h-full bg-primaryColor" style={{ width: `${onTimeRate}%` }} />
          </View>
        </View>

        <View className="flex-row justify-between py-1.5 border-b border-mist">
          <Text className="text-xs text-silver">Average Approval Age</Text>
          <Text className="text-xs font-medium text-ivory">{avgApprovalDays} days</Text>
        </View>
        <View className="flex-row justify-between pt-1.5">
          <Text className="text-xs text-silver">Active Projects</Text>
          <Text className="text-xs font-medium text-ivory">{projects.filter((p: any) => p.status === 'active').length}</Text>
        </View>
      </View>

      {/* Recent Wins */}
      <Text className="text-fog text-xs font-semibold uppercase tracking-widest mb-3">Recent Wins (Last 30 Days)</Text>
      {recentWins.length === 0 ? (
        <Text className="text-xs text-silver italic mb-4">No recent major wins recorded.</Text>
      ) : (
        <View className="rounded-2xl bg-white border border-mist shadow-sm divide-y divide-mist">
          {recentWins.map((win, i) => (
            <View key={i} className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center gap-2.5">
                <View className="h-1.5 w-1.5 rounded-full bg-sage" />
                <View>
                  <Text className="text-xs font-semibold text-ivory">{win.name}</Text>
                  <Text className="text-[10px] text-fog mt-0.5">{win.label}</Text>
                </View>
              </View>
              <Text className="text-[10px] text-fog">
                {new Date(win.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
