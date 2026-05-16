import { FlatList, View, Text, RefreshControl } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { ApprovalCard } from '@/components/ApprovalCard';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useMobileLang } from '@/lib/i18n';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — symlinked from parent repo
import { api } from '../convex/_generated/api';

type Approval = {
  _id: string;
  name: string;
  type: string;
  submittedDate?: string;
  status: 'pending' | 'approved' | 'revision';
};

type SectionRow =
  | { kind: 'header'; label: string; id: string }
  | { kind: 'item'; approval: Approval };

export default function Approvals() {
  const { t } = useMobileLang();
  const [refreshing, setRefreshing] = useState(false);

  const workspaces = useQuery(api.workspaces.list, {}) ?? [];
  const workspaceId = workspaces[0]?._id;
  const approvals = (useQuery(api.approvals.list, workspaceId ? { workspaceId } : 'skip') ?? []) as Approval[];
  const updateApproval = useMutation(api.approvals.update);

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  async function handleApprove(id: string) {
    await updateApproval({ id: id as Parameters<typeof updateApproval>[0]['id'], status: 'approved' });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function handleRevise(id: string) {
    await updateApproval({ id: id as Parameters<typeof updateApproval>[0]['id'], status: 'revision' });
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
            return item.approval._id;
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
                    onPress: () => handleApprove(approval._id),
                  },
                ]}
              >
                <ApprovalCard
                  title={approval.name}
                  type={approval.type}
                  submittedBy={approval.submittedDate ?? ''}
                  status={approval.status}
                  onApprove={() => handleApprove(approval._id)}
                  onRevise={() => handleRevise(approval._id)}
                />
              </SwipeableRow>
            );
          }}
        />
      )}
    </View>
  );
}
