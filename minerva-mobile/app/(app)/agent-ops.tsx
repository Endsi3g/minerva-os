import { ScrollView, View, Text, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { ChevronLeft, Play, Terminal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { trackScreen } from '@/lib/analytics';

const MODULE_AGENTS = [
  {
    id: 'crm-agent',
    name: 'CRM Agent',
    role: 'Pipeline Intelligence',
    description: 'Scores leads, detects stalling deals, and surfaces pipeline health alerts.',
    color: 'bg-blue-500',
    endpoint: '/api/agents/crm',
    action: 'crm_agent_run',
    alertAction: 'crm_agent_alert',
  },
  {
    id: 'pm-agent',
    name: 'PM Agent',
    role: 'Project Intelligence',
    description: 'Detects scope drift, predicts delays, and flags blocked tasks.',
    color: 'bg-purple-500',
    endpoint: '/api/agents/pm',
    action: 'pm_agent_run',
    alertAction: 'pm_agent_alert',
  },
  {
    id: 'finance-agent',
    name: 'Finance Agent',
    role: 'Financial Intelligence',
    description: 'Monitors overdue invoices, retainer renewals, and cash flow anomalies.',
    color: 'bg-emerald-500',
    endpoint: '/api/agents/finance',
    action: 'finance_agent_run',
    alertAction: 'finance_agent_alert',
  },
];

export default function AgentOps() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  useEffect(() => { trackScreen('AgentOps'); }, []);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) {
      setLoading(false);
      return;
    }
    setWorkspaceId(wid);

    const { data } = await supabase
      .from('agent_audit')
      .select('*')
      .eq('workspace_id', wid)
      .order('timestamp', { ascending: false })
      .limit(20);

    setAuditLogs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const runAgent = async (mod: typeof MODULE_AGENTS[0]) => {
    if (!workspaceId || runningAgent) return;
    setRunningAgent(mod.id);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}${mod.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      await loadData();
    } catch (err) {
      console.error(`[${mod.name}] run error:`, err);
    } finally {
      setRunningAgent(null);
    }
  };

  const runAllAgents = async () => {
    if (!workspaceId || runningAgent) return;
    setRunningAgent('all');
    try {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
      await Promise.all(
        MODULE_AGENTS.map(mod =>
          fetch(`${baseUrl}${mod.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceId }),
          })
        )
      );
      await loadData();
    } catch (err) {
      console.error('[Run all agents]', err);
    } finally {
      setRunningAgent(null);
    }
  };

  // Group audit alerts
  const agentAlerts = useMemo(() => {
    return auditLogs.filter(log =>
      ['crm_agent_alert', 'pm_agent_alert', 'finance_agent_alert'].includes(log.action)
    );
  }, [auditLogs]);

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
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1 rounded-full bg-dusk border border-mist">
            <ChevronLeft size={20} color="#475569" />
          </TouchableOpacity>
          <View>
            <Text className="text-ivory text-2xl font-semibold">Agent Ops</Text>
            <Text className="text-fog text-xs mt-0.5">Autonomous workspace agents governance</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={runAllAgents}
          disabled={!!runningAgent}
          className="bg-primaryColor px-3.5 py-1.5 rounded-full flex-row items-center gap-1.5 disabled:opacity-50"
        >
          <Play size={10} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">Run All</Text>
        </TouchableOpacity>
      </View>

      {/* Module Agents Grid */}
      <Text className="text-fog text-xs font-semibold uppercase tracking-widest mb-3">Module Agents</Text>
      <View className="gap-3 mb-6">
        {MODULE_AGENTS.map(mod => {
          const lastRanRow = auditLogs.find(log => log.action === mod.action);
          const lastRanText = lastRanRow
            ? new Date(lastRanRow.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Never';

          return (
            <View key={mod.id} className="rounded-2xl p-4 bg-white border border-mist shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-2">
                  <View className={`w-2 h-2 rounded-full ${mod.color}`} />
                  <View>
                    <Text className="text-xs font-semibold text-ivory">{mod.name}</Text>
                    <Text className="text-[9px] uppercase tracking-wider text-fog font-medium">{mod.role}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => runAgent(mod)}
                  disabled={!!runningAgent}
                  className="px-2.5 py-1 rounded-lg border border-mist bg-dusk flex-row items-center gap-1 disabled:opacity-50"
                >
                  <Play size={8} color="#4F46E5" />
                  <Text className="text-[10px] font-semibold text-silver">Run</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-xs text-silver leading-relaxed mb-3">{mod.description}</Text>

              <View className="flex-row justify-between items-center pt-2 border-t border-mist">
                <Text className="text-[10px] text-fog">Last Run: {lastRanText}</Text>
                <Text className="text-[10px] text-sage font-medium">Auto-pilot active</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Recent Alerts */}
      {agentAlerts.length > 0 && (
        <>
          <Text className="text-fog text-xs font-semibold uppercase tracking-widest mb-3">Recent Agent Alerts</Text>
          <View className="rounded-2xl p-4 bg-white border border-mist shadow-sm mb-6 gap-3">
            {agentAlerts.slice(0, 5).map((log, i) => {
              const details = log.details ?? {};
              const dotColor = details.severity === 'rose' ? '#EF4444' : details.severity === 'amber' ? '#F59E0B' : '#94A3B8';
              return (
                <View key={i} className="flex-row items-start gap-2.5 py-1">
                  <View className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: dotColor }} />
                  <View className="flex-1">
                    <Text className="text-xs text-ivory font-medium">{details.title || details.description}</Text>
                    {details.description && details.title ? (
                      <Text className="text-[10px] text-fog mt-0.5">{details.description}</Text>
                    ) : null}
                  </View>
                  <Text className="text-[9px] text-fog">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Live Audit Trail */}
      <Text className="text-fog text-xs font-semibold uppercase tracking-widest mb-3">Live Audit Trail</Text>
      <View className="rounded-2xl p-4 bg-white border border-mist shadow-sm">
        <View className="flex-row items-center gap-2 mb-3">
          <Terminal size={14} color="#4F46E5" />
          <Text className="text-xs font-semibold text-ivory">Terminal Logs</Text>
        </View>
        
        {auditLogs.length === 0 ? (
          <Text className="text-xs text-silver italic">No agent logs recorded yet.</Text>
        ) : (
          <View className="gap-2">
            {auditLogs.slice(0, 10).map((log, i) => (
              <View key={i} className="py-1.5 border-b border-mist last:border-0">
                <Text className="text-[10px] font-mono text-silver">
                  <Text className="text-primaryColor">[{new Date(log.timestamp).toLocaleTimeString()}]</Text>{' '}
                  <Text className="font-semibold">{log.action}</Text>:{' '}
                  {JSON.stringify(log.details)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
