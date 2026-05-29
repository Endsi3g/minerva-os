import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { ApprovalCard } from '@/components/ApprovalCard';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useMobileLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Approval = {
  id: string;
  name: string;
  type: string;
  submitted_date?: string;
  status: 'pending' | 'approved' | 'revision';
};

type SectionRow =
  | { kind: 'header'; label: string; id: string }
  | { kind: 'item'; approval: Approval };

export default function Approvals() {
  const { t } = useMobileLang();
  const [refreshing, setRefreshing] = useState(false);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const loadData = useCallback(async () => {
    const wsRes = await supabase.from('workspaces').select('id').limit(1);
    const wid = wsRes.data?.[0]?.id;
    if (!wid) return;
    const { data } = await supabase.from('approvals').select('*').eq('workspace_id', wid).order('created_at', { ascending: false });
    setApprovals(data ?? []);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  async function handleApprove(id: string) {
    await supabase.from('approvals').update({ status: 'approved' }).eq('id', id);
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function handleRevise(id: string) {
    await supabase.from('approvals').update({ status: 'revision' }).eq('id', id);
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'revision' } : a));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  const sections: SectionRow[] = [
    ...(pending.length > 0
      ? [{ kind: 'header' as const, label: `${t.approvals.pending} (${pending.length})`, id: 'h-pending' }]
      : []),
    ...pending.map(a => ({ kind: 'item' as const, approval: a })),
    ...(resolved.length > 0
      ? [{ kind: 'header' as const, label: t.approvals.resolved, id: 'h-resolved' }]
      : []),
    ...resolved.map(a => ({ kind: 'item' as const, approval: a })),
  ];

  return (
    <View className="flex-1 bg-obsidian">
      <View className="px-4 pt-14 pb-4">
        <Text className="text-ivory text-2xl font-semibold">{t.approvals.title}</Text>
        <Text className="text-fog text-sm mt-0.5">
          {approvals.length} {t.approvals.subtitle} · {pending.length} {t.approvals.pending.toLowerCase()}
        </Text>
      </View>

      {approvals.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-fog/50 text-sm">{t.approvals.noApprovals}</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={item => {
            if (item.kind === 'header') return item.id;
            return item.approval.id;
          }}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7FA38A" />}
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <Text className="text-fog text-xs uppercase tracking-widest mb-2 mt-2">{item.label}</Text>
              );
            }
            const { approval } = item;
            return (
              <SwipeableRow
                rightActions={[
                  {
                    label: t.approvals.approve,
                    color: '#7FA38A',
                    onPress: () => handleApprove(approval.id),
                  },
                ]}
              >
                <ApprovalCard
                  title={approval.name}
                  type={approval.type}
                  submittedBy={approval.submitted_date ?? ''}
                  status={approval.status}
                  onApprove={() => handleApprove(approval.id)}
                  onRevise={() => handleRevise(approval.id)}
                />
              </SwipeableRow>
            );
          }}
        />
      )}
    </View>
  );
}
